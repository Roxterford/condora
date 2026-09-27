import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "../db";

const TARGET = path.join("sql", "denormalizar_unidades.sql");

export async function main() {
  console.log("⏳ Denormalizando unidades...");

  const sql = fs.readFileSync(path.join(process.cwd(), TARGET), "utf8");
  const client = createClient();

  try {
    await client.connect();
    const { rowCount } = await client.query(sql);
    console.log(`✅ ${rowCount} unidades actualizadas.`);
  } catch (error) {
    console.error("❌ No se pudieron denormalizar las unidades.");
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}
