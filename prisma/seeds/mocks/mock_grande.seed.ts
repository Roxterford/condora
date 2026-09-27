import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { createClient, createViews } from "../../db";
import { generarSQL } from "./generador_mock_grande";

export async function main() {
  console.log("⏳ Generando mock masivo...");
  const sql = generarSQL();

  const target = path.join(
    process.cwd(),
    "prisma",
    "seeds",
    "mocks",
    "mock_grande.sql",
  );
  fs.writeFileSync(target, sql, "utf8");

  console.log(`📄 SQL generado (${(sql.length / 1024).toFixed(0)} KiB): ${target}`);

  const client = createClient();

  try {
    await client.connect();
    console.log("🛢  Insertando en Postgres...");
    await client.query(sql);

    console.log("✅ Mock insertado. Recreando vistas...");
    await createViews(client);
    console.log("✅ Vistas recreadas.");
  } catch (error) {
    console.error("❌ Falló la carga del mock.");
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}
