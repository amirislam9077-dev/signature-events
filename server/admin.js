// Admin panel ki API — har request par header "x-admin-key" (ADMIN_KEY) zaroori
import crypto from "node:crypto";
import express from "express";
import { pool } from "./db.js";

const router = express.Router();

const ENQUIRY_STATUSES = ["new", "contacted", "booked", "closed"];
const VENDOR_STATUSES = ["new", "approved", "rejected"];

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

const wrap = (fn) => (req, res, next) => fn(req, res).catch(next);

/* ---------- Admin password ----------
   Admin panel se badla hua password database mein hash (scrypt) ki shakal mein rehta hai.
   Jab tak koi set na ho, .env ka ADMIN_KEY chalta hai. */

const MIN_PASSWORD = 8;

await pool.query(`CREATE TABLE IF NOT EXISTS admin_settings (
  k VARCHAR(60) PRIMARY KEY,
  v TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB`).catch((err) => console.error("admin_settings table:", err.message));

let storedHash; // undefined = abhi DB se nahi padha, null = DB mein koi password nahi
async function getStoredHash() {
  if (storedHash === undefined) {
    const [rows] = await pool.query("SELECT v FROM admin_settings WHERE k = 'admin_password'");
    storedHash = rows[0]?.v || null;
  }
  return storedHash;
}

const hashPassword = (pwd) => {
  const salt = crypto.randomBytes(16).toString("hex");
  return `${salt}:${crypto.scryptSync(pwd, salt, 64).toString("hex")}`;
};

async function checkPassword(pwd) {
  if (!pwd) return false;
  const stored = await getStoredHash();
  if (stored) {
    const [salt, hash] = stored.split(":");
    return safeEqual(crypto.scryptSync(pwd, salt, 64).toString("hex"), hash);
  }
  const key = process.env.ADMIN_KEY;
  return Boolean(key && key.length >= MIN_PASSWORD && safeEqual(pwd, key));
}

// ghalat password par thoda ruk kar jawab — andaze se password dhoondna mushkil ho
const denied = (res, error = "unauthorized") =>
  setTimeout(() => res.status(401).json({ ok: false, error }), 600);

// Password badalna — purana password body mein, is liye ye login check se pehle hai
router.post("/password", express.json(), wrap(async (req, res) => {
  const { current, next } = req.body || {};
  if (!(await checkPassword(String(current || "")))) return denied(res, "Current password is incorrect");
  const pwd = String(next || "");
  if (pwd.length < MIN_PASSWORD) {
    return res.status(400).json({ ok: false, error: `New password must be at least ${MIN_PASSWORD} characters` });
  }
  if (pwd === current) return res.status(400).json({ ok: false, error: "New password must be different" });

  const hash = hashPassword(pwd);
  await pool.execute(
    "INSERT INTO admin_settings (k, v) VALUES ('admin_password', ?) ON DUPLICATE KEY UPDATE v = VALUES(v)", [hash]);
  storedHash = hash;
  res.json({ ok: true });
}));

router.use((req, res, next) => {
  checkPassword(req.get("x-admin-key") || "")
    .then((ok) => (ok ? next() : denied(res)))
    .catch(next);
});

router.get("/login", (_req, res) => res.json({ ok: true }));

/* ---------- Dashboard numbers ---------- */
router.get("/stats", wrap(async (_req, res) => {
  const [[e]] = await pool.query(`
    SELECT
      COUNT(*)                                                         AS total,
      SUM(status = 'new')                                              AS new_count,
      SUM(status = 'contacted')                                        AS contacted,
      SUM(status = 'booked')                                           AS booked,
      SUM(DATE(created_at) = CURDATE())                                AS today,
      SUM(created_at >= CURDATE() - INTERVAL 6 DAY)                    AS week,
      SUM(event_date BETWEEN CURDATE() AND CURDATE() + INTERVAL 30 DAY
          AND status <> 'closed')                                      AS upcoming
    FROM enquiries`);
  const [[v]] = await pool.query(`SELECT COUNT(*) AS total, SUM(status = 'new') AS new_count FROM vendors`);
  const [[s]] = await pool.query(`
    SELECT COUNT(*) AS total, SUM(created_at >= CURDATE() - INTERVAL 6 DAY) AS week,
           SUM(callback_requested) AS callbacks FROM searches`);
  const [cities] = await pool.query(
    `SELECT city, COUNT(*) AS n FROM enquiries GROUP BY city ORDER BY n DESC LIMIT 5`);
  const [types] = await pool.query(`SELECT event_types FROM enquiries WHERE event_types IS NOT NULL`);

  const typeCount = {};
  types.forEach((r) => r.event_types.split(",").forEach((t) => { typeCount[t] = (typeCount[t] || 0) + 1; }));
  const topTypes = Object.entries(typeCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([type, n]) => ({ type, n }));

  const num = (o) => Object.fromEntries(Object.entries(o).map(([k, val]) => [k, Number(val) || 0]));
  res.json({ ok: true, enquiries: num(e), vendors: num(v), searches: num(s), topCities: cities, topTypes });
}));

/* ---------- Enquiries (orders) ---------- */
router.get("/enquiries", wrap(async (req, res) => {
  const where = [];
  const params = [];
  const { status, q, when } = req.query;

  if (ENQUIRY_STATUSES.includes(status)) { where.push("status = ?"); params.push(status); }
  if (q) {
    where.push("(name LIKE ? OR phone LIKE ? OR email LIKE ? OR city LIKE ? OR CAST(id AS CHAR) = ?)");
    const like = `%${String(q).slice(0, 60)}%`;
    params.push(like, like, like, like, String(q));
  }
  if (when === "upcoming") where.push("event_date >= CURDATE()");
  if (when === "past") where.push("event_date < CURDATE()");
  if (when === "today") where.push("DATE(created_at) = CURDATE()");

  // upcoming list event ki tareekh ke hisaab se, baqi sab nayi pehle
  const order = when === "upcoming" ? "event_date ASC, start_time ASC" : "id DESC";
  const limit = Math.min(Number(req.query.limit) || 200, 1000);
  const [rows] = await pool.query(
    `SELECT e.*,
       (SELECT COALESCE(SUM(b.qty * b.price), 0) FROM booking_items b WHERE b.enquiry_id = e.id) AS items_total,
       (SELECT COUNT(*) FROM booking_items b WHERE b.enquiry_id = e.id AND b.kind = 'dish') AS dish_count
     FROM enquiries e ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY ${order} LIMIT ?`,
    [...params, limit]);
  res.json({ ok: true, rows });
}));

router.patch("/enquiries/:id", wrap(async (req, res) => {
  const sets = [];
  const params = [];
  const { status, admin_notes } = req.body || {};
  if (status !== undefined) {
    if (!ENQUIRY_STATUSES.includes(status)) return res.status(400).json({ ok: false, error: "invalid status" });
    sets.push("status = ?"); params.push(status);
  }
  if (admin_notes !== undefined) { sets.push("admin_notes = ?"); params.push(String(admin_notes).slice(0, 5000) || null); }
  if (!sets.length) return res.status(400).json({ ok: false, error: "nothing to update" });

  const [r] = await pool.execute(`UPDATE enquiries SET ${sets.join(", ")} WHERE id = ?`, [...params, Number(req.params.id)]);
  if (!r.affectedRows) return res.status(404).json({ ok: false, error: "not found" });
  const [[row]] = await pool.query("SELECT * FROM enquiries WHERE id = ?", [Number(req.params.id)]);
  res.json({ ok: true, row });
}));

router.delete("/enquiries/:id", wrap(async (req, res) => {
  const [r] = await pool.execute("DELETE FROM enquiries WHERE id = ?", [Number(req.params.id)]);
  res.json({ ok: r.affectedRows > 0 });
}));

/* ---------- Booking: menu + services ---------- */

const UNITS = ["per_head", "fixed", "kg", "piece"];
const KINDS = ["dish", "service"];
const CATALOG_KINDS = ["dish", "service", "venue"];
const money = (v) => Math.max(0, Math.round(Number(v) * 100) / 100 || 0);

router.get("/enquiries/:id/booking", wrap(async (req, res) => {
  const id = Number(req.params.id);
  const [[enquiry]] = await pool.query("SELECT * FROM enquiries WHERE id = ?", [id]);
  if (!enquiry) return res.status(404).json({ ok: false, error: "not found" });
  const [items] = await pool.query("SELECT * FROM booking_items WHERE enquiry_id = ? ORDER BY kind, sort, id", [id]);
  res.json({ ok: true, enquiry, items });
}));

// poori booking ek saath save (purani items hata kar nayi likhi jaati hain)
router.put("/enquiries/:id/booking", wrap(async (req, res) => {
  const id = Number(req.params.id);
  const b = req.body || {};
  const items = Array.isArray(b.items) ? b.items.slice(0, 300) : [];

  for (const it of items) {
    if (!KINDS.includes(it.kind) || !UNITS.includes(it.unit) || !String(it.name || "").trim()) {
      return res.status(400).json({ ok: false, error: `invalid item: ${it.name || "(no name)"}` });
    }
  }
  const guests = b.guests === "" || b.guests == null ? null : Math.max(1, parseInt(b.guests, 10) || 1);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [r] = await conn.execute(
      "UPDATE enquiries SET venue = ?, guests = ?, advance_paid = ?, discount = ? WHERE id = ?",
      [String(b.venue || "").trim().slice(0, 160) || null, guests, money(b.advance_paid), money(b.discount), id]);
    if (!r.affectedRows) {
      await conn.rollback();
      return res.status(404).json({ ok: false, error: "not found" });
    }
    await conn.execute("DELETE FROM booking_items WHERE enquiry_id = ?", [id]);
    for (const [i, it] of items.entries()) {
      await conn.execute(
        `INSERT INTO booking_items (enquiry_id, kind, category, name, qty, unit, price, notes, sort)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, it.kind, String(it.category || "").slice(0, 60) || null, String(it.name).trim().slice(0, 120),
         money(it.qty) || 1, it.unit, money(it.price), String(it.notes || "").slice(0, 255) || null, i]);
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  const [[enquiry]] = await pool.query("SELECT * FROM enquiries WHERE id = ?", [id]);
  const [saved] = await pool.query("SELECT * FROM booking_items WHERE enquiry_id = ? ORDER BY kind, sort, id", [id]);
  res.json({ ok: true, enquiry, items: saved });
}));

/* ---------- Catalog: pakwan + services ki list ---------- */

router.get("/catalog", wrap(async (_req, res) => {
  const [rows] = await pool.query("SELECT * FROM catalog_items ORDER BY kind, category, name");
  res.json({ ok: true, rows });
}));

function catalogFields(b, partial) {
  const out = {};
  if (!partial || b.kind !== undefined) { if (!CATALOG_KINDS.includes(b.kind)) return { error: "invalid kind" }; out.kind = b.kind; }
  if (!partial || b.category !== undefined) {
    out.category = String(b.category || "").trim().slice(0, 60);
    if (!out.category) return { error: "category is required" };
  }
  if (!partial || b.name !== undefined) {
    out.name = String(b.name || "").trim().slice(0, 120);
    if (!out.name) return { error: "name is required" };
  }
  if (!partial || b.unit !== undefined) { if (!UNITS.includes(b.unit)) return { error: "invalid unit" }; out.unit = b.unit; }
  if (!partial || b.price !== undefined) out.price = money(b.price);
  if (b.active !== undefined) out.active = b.active ? 1 : 0;
  return { out };
}

router.post("/catalog", wrap(async (req, res) => {
  const { out, error } = catalogFields(req.body || {}, false);
  if (error) return res.status(400).json({ ok: false, error });
  try {
    const [r] = await pool.execute(
      "INSERT INTO catalog_items (kind, category, name, unit, price) VALUES (?, ?, ?, ?, ?)",
      [out.kind, out.category, out.name, out.unit, out.price]);
    const [[row]] = await pool.query("SELECT * FROM catalog_items WHERE id = ?", [r.insertId]);
    res.status(201).json({ ok: true, row });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return res.status(400).json({ ok: false, error: "This name is already in the list" });
    throw err;
  }
}));

router.patch("/catalog/:id", wrap(async (req, res) => {
  const { out, error } = catalogFields(req.body || {}, true);
  if (error) return res.status(400).json({ ok: false, error });
  const keys = Object.keys(out);
  if (!keys.length) return res.status(400).json({ ok: false, error: "nothing to update" });
  try {
    await pool.execute(`UPDATE catalog_items SET ${keys.map((k) => `${k} = ?`).join(", ")} WHERE id = ?`,
      [...keys.map((k) => out[k]), Number(req.params.id)]);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") return res.status(400).json({ ok: false, error: "This name is already in the list" });
    throw err;
  }
  const [[row]] = await pool.query("SELECT * FROM catalog_items WHERE id = ?", [Number(req.params.id)]);
  res.json({ ok: true, row });
}));

// purani bookings par asar nahi — un mein naam aur rate apni copy mein save hain
router.delete("/catalog/:id", wrap(async (req, res) => {
  const [r] = await pool.execute("DELETE FROM catalog_items WHERE id = ?", [Number(req.params.id)]);
  res.json({ ok: r.affectedRows > 0 });
}));

/* ---------- Reports: sale, orders, top dishes waghera (filters ke saath) ---------- */

router.get("/reports", wrap(async (req, res) => {
  const DATE = /^\d{4}-\d{2}-\d{2}$/;
  const q = req.query;
  const dateCol = q.basis === "event" ? "e.event_date" : "e.created_at";
  const where = [];
  const params = [];
  if (DATE.test(q.from)) { where.push(`DATE(${dateCol}) >= ?`); params.push(q.from); }
  if (DATE.test(q.to)) { where.push(`DATE(${dateCol}) <= ?`); params.push(q.to); }
  if (ENQUIRY_STATUSES.includes(q.status)) { where.push("e.status = ?"); params.push(q.status); }
  if (q.city) { where.push("e.city = ?"); params.push(String(q.city).slice(0, 60)); }
  if (q.type) { where.push("FIND_IN_SET(?, e.event_types)"); params.push(String(q.type).slice(0, 30)); }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const periodSql = {
    day: `DATE_FORMAT(${dateCol}, '%Y-%m-%d')`,
    week: `DATE_FORMAT(DATE(${dateCol}) - INTERVAL WEEKDAY(${dateCol}) DAY, '%Y-%m-%d')`,
    month: `DATE_FORMAT(${dateCol}, '%Y-%m')`,
  }[q.group] || `DATE_FORMAT(${dateCol}, '%Y-%m')`;

  // har order ki raqam = items - discount; "sale" = booked + closed orders ki raqam
  const base = `
    WITH t AS (
      SELECT e.*, ${periodSql} AS period,
        GREATEST(COALESCE((SELECT SUM(b.qty * b.price) FROM booking_items b WHERE b.enquiry_id = e.id), 0) - e.discount, 0) AS amount,
        COALESCE((SELECT SUM(b.qty * b.price) FROM booking_items b WHERE b.enquiry_id = e.id AND b.kind = 'dish'), 0) AS dish_amount,
        COALESCE((SELECT SUM(b.qty * b.price) FROM booking_items b WHERE b.enquiry_id = e.id AND b.kind = 'service' AND b.category = 'Venue'), 0) AS hall_amount,
        COALESCE((SELECT SUM(b.qty * b.price) FROM booking_items b WHERE b.enquiry_id = e.id AND b.kind = 'service' AND b.category <> 'Venue'), 0) AS service_amount,
        e.status IN ('booked', 'closed') AS is_sale
      FROM enquiries e ${whereSql}
    )`;

  const [[summary]] = await pool.query(`${base}
    SELECT COUNT(*) AS orders,
      SUM(status = 'new') AS new_count, SUM(status = 'contacted') AS contacted,
      SUM(status = 'booked') AS booked, SUM(status = 'closed') AS closed,
      SUM(is_sale) AS sales_count,
      SUM(IF(is_sale, amount, 0)) AS sales,
      SUM(IF(is_sale, advance_paid, 0)) AS advance,
      SUM(IF(is_sale, dish_amount, 0)) AS menu_sales,
      SUM(IF(is_sale, service_amount, 0)) AS service_sales,
      SUM(IF(is_sale, hall_amount, 0)) AS hall_sales,
      SUM(IF(is_sale, COALESCE(guests, 0), 0)) AS guests
    FROM t`, params);

  const [series] = await pool.query(`${base}
    SELECT period, COUNT(*) AS orders, SUM(is_sale) AS booked,
      SUM(IF(is_sale, amount, 0)) AS sales, SUM(IF(is_sale, advance_paid, 0)) AS advance
    FROM t GROUP BY period ORDER BY period`, params);

  const [byCity] = await pool.query(`${base}
    SELECT city AS label, COUNT(*) AS orders, SUM(IF(is_sale, amount, 0)) AS sales
    FROM t GROUP BY city ORDER BY sales DESC, orders DESC LIMIT 10`, params);

  const [typeRows] = await pool.query(`${base} SELECT event_types, is_sale, amount FROM t`, params);
  const typeMap = {};
  typeRows.forEach((r) => (r.event_types || "other").split(",").forEach((t) => {
    typeMap[t] ||= { label: t, orders: 0, sales: 0 };
    typeMap[t].orders += 1;
    if (r.is_sale) typeMap[t].sales += Number(r.amount);
  }));
  const byType = Object.values(typeMap).sort((a, b) => b.orders - a.orders);

  const topItems = async (kind, extra = "") => (await pool.query(`${base}
    SELECT b.name AS label, COUNT(DISTINCT t.id) AS orders, SUM(b.qty) AS qty, SUM(b.qty * b.price) AS sales
    FROM t JOIN booking_items b ON b.enquiry_id = t.id
    WHERE t.is_sale AND b.kind = ? ${extra}
    GROUP BY b.name ORDER BY sales DESC LIMIT 10`, [...params, kind]))[0];

  const [orders] = await pool.query(`${base}
    SELECT id, name, phone, city, event_types, event_date, created_at, status, guests, venue, amount, advance_paid
    FROM t ORDER BY ${q.basis === "event" ? "event_date" : "created_at"} DESC LIMIT 1000`, params);

  const n = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === "string" && k !== "label" && k !== "period" ? Number(v) : v === null ? 0 : v]));
  res.json({
    ok: true,
    summary: n(summary),
    series: series.map(n),
    byCity: byCity.map(n),
    byType,
    topDishes: (await topItems("dish")).map(n),
    topServices: (await topItems("service", "AND b.category <> 'Venue'")).map(n),
    topVenues: (await pool.query(`${base}
      SELECT venue AS label, COUNT(*) AS orders, SUM(hall_amount) AS sales FROM t
      WHERE is_sale AND venue IS NOT NULL GROUP BY venue ORDER BY orders DESC LIMIT 10`, params))[0].map(n),
    orders,
  });
}));

/* ---------- Vendors ---------- */
router.get("/vendors", wrap(async (req, res) => {
  const { status } = req.query;
  const filter = VENDOR_STATUSES.includes(status) ? "WHERE status = ?" : "";
  const [rows] = await pool.query(`SELECT * FROM vendors ${filter} ORDER BY id DESC LIMIT 500`, filter ? [status] : []);
  res.json({ ok: true, rows });
}));

router.patch("/vendors/:id", wrap(async (req, res) => {
  const sets = [];
  const params = [];
  const { status, admin_notes } = req.body || {};
  if (status !== undefined) {
    if (!VENDOR_STATUSES.includes(status)) return res.status(400).json({ ok: false, error: "invalid status" });
    sets.push("status = ?"); params.push(status);
  }
  if (admin_notes !== undefined) { sets.push("admin_notes = ?"); params.push(String(admin_notes).slice(0, 5000) || null); }
  if (!sets.length) return res.status(400).json({ ok: false, error: "nothing to update" });

  const [r] = await pool.execute(`UPDATE vendors SET ${sets.join(", ")} WHERE id = ?`, [...params, Number(req.params.id)]);
  if (!r.affectedRows) return res.status(404).json({ ok: false, error: "not found" });
  const [[row]] = await pool.query("SELECT * FROM vendors WHERE id = ?", [Number(req.params.id)]);
  res.json({ ok: true, row });
}));

router.delete("/vendors/:id", wrap(async (req, res) => {
  const [r] = await pool.execute("DELETE FROM vendors WHERE id = ?", [Number(req.params.id)]);
  res.json({ ok: r.affectedRows > 0 });
}));

/* ---------- Searches (website par kya dhoonda gaya) ---------- */
router.get("/searches", wrap(async (_req, res) => {
  const [rows] = await pool.query("SELECT * FROM searches ORDER BY id DESC LIMIT 300");
  res.json({ ok: true, rows });
}));

export default router;
