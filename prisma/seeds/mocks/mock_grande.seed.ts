import "dotenv/config";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { generarSQL } from "./generador_mock_grande";

function resolverDb(): string {
  const repoRoot = process.cwd();

  // 1) Variable MOCK_DB_PATH suele ser útil en devcontainer
  if (process.env.MOCK_DB_PATH) {
    return process.env.MOCK_DB_PATH.replace(/^file:/, "");
  }

  // 2) Si DATABASE_URL existe y apunta a un archivo alcanzable, se usa
  const dbUrl = process.env.DATABASE_URL?.replace("file:", "");
  if (dbUrl && fs.existsSync(dbUrl)) {
    return path.resolve(dbUrl);
  }

  // 3) Fallback: dev.db de la raíz del repo
  const local = path.join(repoRoot, "dev.db");
  if (fs.existsSync(local)) {
    return local;
  }

  return local;
}

const db = resolverDb();

console.log(`⏳ Generando mock masivo...`);
const sql = generarSQL();

const target = path.join(process.cwd(), "prisma", "seeds", "mocks", "mock_grande.sql");
fs.writeFileSync(target, sql, "utf8");

console.log(`📄 SQL generado (${(sql.length / 1024).toFixed(0)} KiB): ${target}`);
console.log(`🛢  Insertando en ${db}...`);

execSync(`sqlite3 "${db}" < "${target}"`, { stdio: "inherit" });

console.log("✅ Mock insertado. Recreando vistas...");

const viewsDir = path.join(process.cwd(), "sql", "views");
for (const file of fs.readdirSync(viewsDir).filter((f) => f.endsWith(".sql"))) {
  const viewSql = fs.readFileSync(path.join(viewsDir, file), "utf8");
  execSync(`sqlite3 "${db}" "${viewSql.replace(/"/g, '\\"')}"`, { stdio: "inherit" });
}

console.log("✅ Vistas recreadas.");