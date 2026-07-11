import { Pool, types } from "pg";
import { env } from "./env";

// Return DATE columns as raw "YYYY-MM-DD" strings instead of JS Date objects,
// which pg otherwise parses at local midnight and can shift a day when
// serialized back to UTC.
types.setTypeParser(types.builtins.DATE, (value) => value);

export const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: { rejectUnauthorized: false },
});
