import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type { AppConfig } from "../config.js";
import { runMigrations } from "./migrate.js";
import * as schema from "./schema.js";

export type Database = ReturnType<typeof createDatabase>["db"];

export function createDatabase(config: AppConfig) {
  const sql = postgres(config.databaseUrl, { max: 10 });
  const db = drizzle(sql, { schema });

  return {
    db,
    sql,
    async init() {
      await runMigrations(sql);
    },
    async close() {
      await sql.end();
    },
  };
}
