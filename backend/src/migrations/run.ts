import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { pool } from "../config/db";

async function run() {
  const dir = __dirname;
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = readFileSync(join(dir, file), "utf-8");
    console.log(`Running migration: ${file}`);
    await pool.query(sql);
  }

  console.log("Migrations complete.");
  await pool.end();
}

run().catch((e) => {
  console.error("Migration failed:", e.message);
  process.exit(1);
});
