import "dotenv/config";
import path from "node:path";
import { createClient, createViews, VIEWS_DIR } from "../db";

export async function main() {
  console.log("⏳ Creating views...");

  console.log("exec path", path.join(process.cwd(), VIEWS_DIR));

  const client = createClient();

  try {
    await client.connect();
    await createViews(client);
    console.log("✅ Views created.");
  } catch (error) {
    console.error("❌ No se pudieron crear las vistas de 'sql/views'.");
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}
