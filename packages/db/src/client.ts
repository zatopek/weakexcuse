import postgres from "postgres";

const connectionString =
  process.env.DATABASE_URL || "postgres://localhost:5432/weakexcuse";

const sql = postgres(connectionString);

export default sql;
