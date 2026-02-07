import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import postgres from "postgres";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../../.env") });

const connectionString =
  process.env.DATABASE_URL || "postgres://localhost:5432/weakexcuse";

const sql = postgres(connectionString);

export default sql;
