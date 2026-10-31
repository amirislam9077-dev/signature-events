// Online database (TiDB) mein database banana + local backup ka data daalna
//   node cloud-import.js            → sirf connection check
//   node cloud-import.js --import   → database bana kar backup/signature_events.sql daalo
import fs from "node:fs";
import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config({ path: new URL("./.env.tidb", import.meta.url) });
const { DB_HOST, DB_USER, DB_PASSWORD, DB_PORT = "4000", DB_NAME = "signature_events" } = process.env;
if (!DB_HOST || !DB_USER || !DB_PASSWORD) {
  console.error("server/.env.tidb mein DB_HOST, DB_USER aur DB_PASSWORD teeno bharein.");
  process.exit(1);
}

const conn = await mysql.createConnection({
  host: DB_HOST, port: Number(DB_PORT), user: DB_USER, password: DB_PASSWORD,
  ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
  multipleStatements: true, connectTimeout: 20000,
});

try {
  const [[v]] = await conn.query("SELECT VERSION() AS v");
  console.log("✓ Connected to TiDB:", v.v);

  if (process.argv.includes("--import")) {
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await conn.query(`USE \`${DB_NAME}\``);
    const dump = fs.readFileSync(new URL("./backup/signature_events.sql", import.meta.url), "utf8");
    await conn.query(dump);
    console.log(`✓ Data imported into "${DB_NAME}"`);
  }

  const [dbs] = await conn.query("SHOW DATABASES LIKE ?", [DB_NAME]);
  if (dbs.length) {
    await conn.query(`USE \`${DB_NAME}\``);
    for (const t of ["enquiries", "vendors", "searches", "catalog_items", "booking_items", "admin_settings"]) {
      const [[c]] = await conn.query(`SELECT COUNT(*) AS n FROM \`${t}\``).catch(() => [[{ n: "missing" }]]);
      console.log(`  ${t.padEnd(15)} ${c.n}`);
    }
  } else {
    console.log(`  Database "${DB_NAME}" abhi nahi bana.`);
  }
} finally {
  await conn.end();
}
