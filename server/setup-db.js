// schema.sql chala kar database aur tables banata hai: npm run db:setup
import fs from "node:fs";
import mysql from "mysql2/promise";
import { sslOption } from "./db.js";
import "dotenv/config";

const dbName = process.env.DB_NAME || "signature_events";
const sql = fs
  .readFileSync(new URL("./schema.sql", import.meta.url), "utf8")
  .replaceAll("signature_events", dbName)
  + "\n" + fs.readFileSync(new URL("./booking-schema.sql", import.meta.url), "utf8");

const conn = await mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  multipleStatements: true,
  ssl: sslOption,
});

try {
  await conn.query(sql);
  const [tables] = await conn.query(`SHOW TABLES FROM \`${dbName}\``);
  console.log(`Database "${dbName}" tayyar hai. Tables:`, tables.map((t) => Object.values(t)[0]).join(", "));
} finally {
  await conn.end();
}
