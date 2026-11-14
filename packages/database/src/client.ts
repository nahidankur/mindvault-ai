import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as schema from './schema';

// Load root .env file
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

export type DrizzleDatabase = PostgresJsDatabase<typeof schema>;

export interface DatabaseConnectionOptions {
  connectionString?: string;
  max?: number;
}

export function createDatabaseClient(
  options: DatabaseConnectionOptions = {},
): { db: DrizzleDatabase; client: postgres.Sql } {
  const connectionString =
    options.connectionString ||
    process.env.DATABASE_URL ||
    'postgresql://mindvault:mindvault_password@localhost:5433/mindvault_db?sslmode=disable';

  const client = postgres(connectionString, {
    max: options.max || 10,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false, // Recommended for Neon / Pgbouncer
  });

  const db = drizzle(client, { schema });

  return { db, client };
}
