import express from "express";
import cors from "cors";
import "dotenv/config";
import { pool } from "./db.js";
import { notifyEnquiry, notifyVendor, notifyStatus } from "./notify.js";
import adminRouter from "./admin.js";

// Saari API yahan — server/index.js (computer/VPS) aur api/index.js (Vercel) dono isi ko chalate hain
const app = express();

const origins = (process.env.CORS_ORIGIN || "http://localhost:5173").split(",").map((o) => o.trim());
app.use(cors({ origin: origins }));
app.use(express.json({ limit: "20kb" }));

/* ---------- validation helpers ---------- */

const PHONE_RE = /^[0-9+\-\s]{10,15}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/; // 24-hour "HH:MM"
const timeOrNull = (v) => {
  const t = str(v, 5);
  return TIME_RE.test(t) ? t : null;
};

const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const optional = (v) => (v === "" ? null : v);
const typesToString = (v) =>
  (Array.isArray(v) ? v : typeof v === "string" ? v.split(",") : [])
    .map((t) => String(t).trim().slice(0, 30))
    .filter(Boolean)
    .join(",")
    .slice(0, 255);

function fail(res, errors) {
  return res.status(400).json({ ok: false, errors });
}

/* ---------- routes ---------- */

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, db: "connected", notifications: notifyStatus() });
  } catch (err) {
    res.status(500).json({ ok: false, db: "error", message: err.code || err.message });
  }
});

// "Get a free quote" form
app.post("/api/enquiries", async (req, res, next) => {
  try {
    const b = req.body || {};
    const data = {
      name: str(b.name, 120),
      phone: str(b.phone, 20),
      whatsapp: str(b.whatsapp, 20) || str(b.phone, 20), // ab form mein ek hi number (WhatsApp) hai
      email: str(b.email, 160),
      city: str(b.city, 60),
      event_types: typesToString(b.types),
      event_date: str(b.date, 10),
      start_time: timeOrNull(b.startTime),
      end_time: timeOrNull(b.endTime),
      guests: b.guests === "" || b.guests == null ? null : Number(b.guests),
      message: str(b.message, 2000),
      enquiry_for: str(b.enquiryFor, 160),
    };

    const errors = [];
    if (!data.name) errors.push("name is required");
    if (!PHONE_RE.test(data.phone)) errors.push("valid phone is required");
    if (data.whatsapp && !PHONE_RE.test(data.whatsapp)) errors.push("WhatsApp number is invalid");
    if (data.email && !EMAIL_RE.test(data.email)) errors.push("email is invalid");
    if (!data.city) errors.push("city is required");
    if (!DATE_RE.test(data.event_date)) errors.push("valid event date is required");
    if (str(b.startTime, 10) && !data.start_time) errors.push("start time is invalid");
    if (str(b.endTime, 10) && !data.end_time) errors.push("end time is invalid");
    if (data.guests !== null && (!Number.isInteger(data.guests) || data.guests < 1 || data.guests > 100000)) {
      errors.push("guests must be a positive number");
    }
    if (errors.length) return fail(res, errors);

    const [result] = await pool.execute(
      `INSERT INTO enquiries (name, phone, whatsapp, email, city, event_types, event_date, start_time, end_time,
                              guests, message, enquiry_for)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.name, data.phone, optional(data.whatsapp), optional(data.email), data.city, optional(data.event_types),
       data.event_date, data.start_time, data.end_time, data.guests, optional(data.message), optional(data.enquiry_for)]
    );
    await notifyEnquiry(result.insertId, data); // email/WhatsApp pehle — Vercel jawab ke baad function rok deta hai
    res.status(201).json({ ok: true, id: result.insertId });
  } catch (err) {
    next(err);
  }
});

// "Join as Vendor" form
app.post("/api/vendors", async (req, res, next) => {
  try {
    const b = req.body || {};
    const data = {
      business_name: str(b.business, 160),
      contact_name: str(b.name, 120),
      phone: str(b.phone, 20),
      whatsapp: str(b.whatsapp, 20) || str(b.phone, 20), // ab form mein ek hi number (WhatsApp) hai
      city: str(b.city, 60),
      service_type: str(b.type, 60),
    };

    const errors = [];
    if (!data.business_name) errors.push("business name is required");
    if (!data.contact_name) errors.push("contact person is required");
    if (!PHONE_RE.test(data.phone)) errors.push("valid phone is required");
    if (data.whatsapp && !PHONE_RE.test(data.whatsapp)) errors.push("WhatsApp number is invalid");
    if (!data.city) errors.push("city is required");
    if (!data.service_type) errors.push("service type is required");
    if (errors.length) return fail(res, errors);

    const [result] = await pool.execute(
      `INSERT INTO vendors (business_name, contact_name, phone, whatsapp, city, service_type) VALUES (?, ?, ?, ?, ?, ?)`,
      [data.business_name, data.contact_name, data.phone, optional(data.whatsapp), data.city, data.service_type]
    );
    await notifyVendor(result.insertId, data);
    res.status(201).json({ ok: true, id: result.insertId });
  } catch (err) {
    next(err);
  }
});

// "Plan Your Event" search box
app.post("/api/searches", async (req, res, next) => {
  try {
    const b = req.body || {};
    const date = str(b.date, 10);
    const [result] = await pool.execute(
      `INSERT INTO searches (city, event_date, start_time, end_time, event_types, budget, callback_requested)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [optional(str(b.city, 60)), DATE_RE.test(date) ? date : null, timeOrNull(b.startTime), timeOrNull(b.endTime),
       optional(typesToString(b.types)), optional(str(b.budget, 40)), b.callback ? 1 : 0]
    );
    res.status(201).json({ ok: true, id: result.insertId });
  } catch (err) {
    next(err);
  }
});

/* ---------- admin: data dekhne ke liye (header "x-admin-key" zaroori) ---------- */

app.use("/api/admin", adminRouter);

app.use("/api", (_req, res) => res.status(404).json({ ok: false, error: "not found" }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ ok: false, error: "server error" });
});

export default app;
