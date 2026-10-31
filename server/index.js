// Computer ya VPS par chalane ke liye: API + website (dist) ek hi server se
import express from "express";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import app from "./app.js";
import { notifyStatus, verifyMailer } from "./notify.js";

const PORT = Number(process.env.PORT) || 5000;

const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist");
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(distDir, "index.html")));
}

app.listen(PORT, () => {
  console.log(`API running: http://localhost:${PORT}`);
  const s = notifyStatus();
  console.log(`Email: ${s.email ? "ON" : "OFF (set SMTP in .env)"} | WhatsApp API: ${s.whatsapp ? "ON" : "OFF (set WA_TOKEN in .env)"}`);
  if (s.email) verifyMailer().then((r) => console.log("Email login:", r)).catch((e) => console.error("Email login FAILED:", e.message));
});
