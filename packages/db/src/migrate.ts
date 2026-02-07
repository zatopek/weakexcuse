import { readdir, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sql from "./client.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, "../migrations");

async function migrate() {
  // Create migrations tracking table
  await sql`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ DEFAULT now()
    )
  `;

  const applied = await sql<{ name: string }[]>`
    SELECT name FROM _migrations ORDER BY id
  `;
  const appliedSet = new Set(applied.map((r) => r.name));

  const files = (await readdir(migrationsDir))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (appliedSet.has(file)) {
      console.log(`Skipping ${file} (already applied)`);
      continue;
    }

    const content = await readFile(join(migrationsDir, file), "utf-8");
    console.log(`Applying ${file}...`);

    await sql.begin(async (sql) => {
      await sql.unsafe(content);
      await sql.unsafe(
        "INSERT INTO _migrations (name) VALUES ($1)",
        [file],
      );
    });

    console.log(`Applied ${file}`);
  }

  console.log("All migrations applied.");
  await sql.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
