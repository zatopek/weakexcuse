import { readdir, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import sql from "./client.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const seedsDir = join(__dirname, "../seeds");

async function seed() {
  const files = (await readdir(seedsDir))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const content = await readFile(join(seedsDir, file), "utf-8");
    console.log(`Running seed ${file}...`);
    await sql.unsafe(content);
    console.log(`Finished ${file}`);
  }

  console.log("All seeds applied.");
  await sql.end();
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
