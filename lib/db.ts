import postgres from "postgres";

declare global {
  // eslint-disable-next-line no-var
  var __bp55sql: ReturnType<typeof postgres> | undefined;
}

export function getSql() {
  if (global.__bp55sql) return global.__bp55sql;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }

  const localDatabase = /localhost|127\.0\.0\.1|@db:5432/.test(connectionString);
  const client = postgres(connectionString, {
    ssl: localDatabase ? false : "require",
    max: 5,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  if (process.env.NODE_ENV !== "production") global.__bp55sql = client;
  return client;
}
