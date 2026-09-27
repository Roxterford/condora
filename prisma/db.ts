import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { Client } from "pg";

export const VIEWS_DIR = "sql/views";

/**
 * Dependencias entre vistas: cada entrada indica de qué vistas depende la
 * clave. PostgreSQL valida el cuerpo de la vista al crearla, así que el orden
 * importa (SQLite lo difería y por eso el orden alfabético nunca dio problema).
 */
export const VIEWS_DEPENDENCIAS: Record<string, string[]> = {
  "operaciones.sql": [],
  "deudas.sql": [],
  "gastos.sql": ["operaciones.sql"],
  "pagos.sql": ["operaciones.sql"],
  "recaudacion.sql": [],
  "resumen_unidades.sql": ["deudas.sql"],
  "tasas_de_cambio.sql": ["operaciones.sql"],
  "unidades_info.sql": [],
  "unidades_stats.sql": ["deudas.sql"],
};

/**
 * Crea un cliente Postgres a partir de `DATABASE_URL`. Cada seed es responsable
 * de cerrarlo con `close()`.
 */
export function createClient(): Client {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL no está definida");
  }

  return new Client({ connectionString });
}

/**
 * Ordena los nombres de archivo de las vistas respetando el orden topológico de
 * dependencias declarado arriba. Cada dependencia debe existir ya en `sorted`.
 */
export function sortViewsByDependency(files: string[]): string[] {
  const pendientes = new Map<string, string[]>(
    files.map((file) => [file, VIEWS_DEPENDENCIAS[file] ?? []]),
  );
  const sorted: string[] = [];

  while (pendientes.size > 0) {
    const resolved = [...pendientes.keys()].filter((file) =>
      (VIEWS_DEPENDENCIAS[file] ?? []).every((dep) => sorted.includes(dep)),
    );

    if (resolved.length === 0) {
      throw new Error(
        `Dependencias circulares o inexistentes entre vistas: ${[...pendientes.keys()].join(", ")}`,
      );
    }

    for (const file of resolved) {
      sorted.push(file);
      pendientes.delete(file);
    }
  }

  return sorted;
}

/**
 * Aplica los archivos .sql de `sql/views` en orden de dependencias y devuelve
 * el cliente para que el seed pueda seguir trabajando con él.
 */
export async function createViews(client: Client): Promise<void> {
  const dir = path.join(process.cwd(), VIEWS_DIR);
  const archivos = fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".sql"));

  for (const file of sortViewsByDependency(archivos)) {
    const sql = fs.readFileSync(path.join(dir, file), "utf8");
    await client.query(sql);
  }
}
