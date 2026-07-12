import { Client } from "pg";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const res = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'Session';
  `);
  console.log("Columns:", res.rows);
  await client.end();
}
main().catch(console.error);
