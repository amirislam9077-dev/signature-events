import mysql from "mysql2/promise";
import "dotenv/config";

// Cloud MySQL (TiDB Cloud, Aiven waghera) SSL maangte hain — .env / Vercel mein DB_SSL=true
export const sslOption = process.env.DB_SSL === "true" ? { minVersion: "TLSv1.2", rejectUnauthorized: true } : undefined;

export const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "signature_events",
  ssl: sslOption,
  waitForConnections: true,
  connectionLimit: process.env.VERCEL ? 3 : 10, // Vercel par har function ka apna chhota pool
  dateStrings: true,
});
