import { useCallback, useEffect, useMemo, useState } from "react";
import { COMPANY, timingText, typeLabel } from "../data";
import { AuthError, adminFetch, getKey, markFromAdmin, setKey } from "./adminApi";
import BookingEditor, { rs } from "./Booking";
import CatalogTab from "./CatalogTab";
import Logo from "../components/Logo";
import Reports from "./Reports";
import ChangePassword from "./ChangePassword";
import "./admin.css";

/* ================= helpers ================= */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const parseDate = (d) => {
  const [y, m, day] = String(d).slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, day);
};
const fmtDate = (d) => {
  if (!d) return "-";
  const x = parseDate(d);
  return `${DAYS[x.getDay()]}, ${x.getDate()} ${MONTHS[x.getMonth()]} ${x.getFullYear()}`;
};
const fmtDateTime = (dt) => {
  if (!dt) return "-";
  const [d, t = "00:00"] = String(dt).split(" ");
  const x = parseDate(d);
  const [h, m] = t.split(":").map(Number);
  return `${x.getDate()} ${MONTHS[x.getMonth()]}, ${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};
const daysUntil = (d) => {
  if (!d) return "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((parseDate(d) - today) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff > 1) return `in ${diff} days`;
  return `${-diff} days ago`;
};
const types = (csv) => (csv ? csv.split(",").map(typeLabel).join(", ") : "-");
const timing = (r) => timingText(r.start_time?.slice(0, 5), r.end_time?.slice(0, 5));

const toIntlPK = (phone) => {
  let d = String(phone || "").replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("0")) d = "92" + d.slice(1);
  return d;
};
const waLink = (phone, text) => `https://wa.me/${toIntlPK(phone)}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
const greet = (r) =>
  `Assalam o Alaikum ${r.name}! This is ${COMPANY.legalName}, getting in touch about your enquiry #${r.id} ` +
  `(${types(r.event_types)}, ${fmtDate(r.event_date)}).`;

function downloadCSV(filename, columns, rows) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = [columns.map((c) => esc(c[0])).join(","), ...rows.map((r) => columns.map((c) => esc(c[1](r))).join(","))];
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

const ENQUIRY_STATUS = {
  new: "New",
  contacted: "Contacted",
  booked: "Booked",
  closed: "Closed",
};
const VENDOR_STATUS = { new: "New", approved: "Approved", rejected: "Rejected" };

/* ================= Login ================= */

function Login({ onLogin }) {
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [changing, setChanging] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await adminFetch("/login", { key: pwd });
      setKey(pwd);
      onLogin();
    } catch (err) {
      setError(err instanceof AuthError ? "Incorrect password." : "Could not reach the server. Is the API running?");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ad-login">
      <form className="ad-login__box" onSubmit={submit}>
        <div className="ad-brand ad-brand--center">
          <Logo href="/admin" />
          <span className="ad-panel-tag">Admin Panel</span>
        </div>
        <label htmlFor="pwd">Admin password</label>
        <input id="pwd" type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} autoFocus required />
        {error && <p className="ad-error">{error}</p>}
        <button className="ad-btn ad-btn--gold" disabled={busy}>{busy ? "Checking..." : "Login"}</button>
        <button type="button" className="ad-link ad-link--btn" onClick={() => setChanging(true)}>🔑 Change password</button>
        <a className="ad-link" href="/">← Back to website</a>
        {changing && <ChangePassword initialCurrent={pwd} onClose={() => setChanging(false)} onChanged={() => setPwd("")} />}
      </form>
    </div>
  );
}

/* ================= Small parts ================= */

function StatusSelect({ value, options, onChange }) {
  return (
    <select className={`ad-status ad-status--${value}`} value={value} onChange={(e) => onChange(e.target.value)} onClick={(e) => e.stopPropagation()}>
      {Object.entries(options).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
    </select>
  );
}

function ContactButtons({ row, text }) {
  return (
    <span className="ad-contact" onClick={(e) => e.stopPropagation()}>
      <a className="ad-icon ad-icon--wa" href={waLink(row.whatsapp || row.phone, text)} target="_blank" rel="noopener noreferrer" title="WhatsApp">
        <svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.3-.5 0-1 .2-3.3-.7-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.3 0 .5l-.4.5-.3.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.4z"/></svg>
      </a>
      <a className="ad-icon" href={`tel:${row.phone}`} title="Call">
        <svg viewBox="0 0 24 24"><path fill="currentColor" d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z"/></svg>
      </a>
    </span>
  );
}

function Detail({ label, children }) {
  if (children === null || children === undefined || children === "" || children === "-") return null;
  return (
    <div className="ad-detail">
      <span>{label}</span>
      <div>{children}</div>
    </div>
  );
}

function Amount({ row }) {
  const total = Math.max(0, Number(row.items_total || 0) - Number(row.discount || 0));
  if (!total) return row.status === "booked" ? <small className="ad-warn">Add menu</small> : <span className="ad-muted">-</span>;
  const balance = total - Number(row.advance_paid || 0);
  return (
    <>
      <strong>{rs(total)}</strong>
      <small className={`ad-sub ${balance > 0 ? "ad-due" : "ad-paid"}`}>{balance > 0 ? `Balance ${rs(balance)}` : "Paid ✓"}</small>
      {Number(row.dish_count) > 0 && <small className="ad-sub">{row.dish_count} dishes</small>}
    </>
  );
}

/* ================= Enquiry drawer ================= */

function EnquiryDrawer({ row, onClose, onUpdate, onDelete, onBookingSaved }) {
  const [notes, setNotes] = useState(row.admin_notes || "");
  const [saved, setSaved] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  useEffect(() => { setNotes(row.admin_notes || ""); setSaved(false); }, [row.id, row.admin_notes]);

  const changeStatus = async (status) => {
    await onUpdate(row.id, { status });
    if (status === "booked") setBookingOpen(true);
  };
  const total = Math.max(0, Number(row.items_total || 0) - Number(row.discount || 0));

  const saveNotes = async () => {
    await onUpdate(row.id, { admin_notes: notes });
    setSaved(true);
  };

  return (
    <div className="ad-drawer" onClick={onClose}>
      <aside className="ad-drawer__panel" onClick={(e) => e.stopPropagation()}>
        <header className="ad-drawer__head">
          <div>
            <small>Enquiry #{row.id}</small>
            <h2>{row.name}</h2>
            <span className="ad-muted">Received {fmtDateTime(row.created_at)}</span>
          </div>
          <button className="ad-x" onClick={onClose} aria-label="Close">×</button>
        </header>

        <div className="ad-drawer__actions">
          <a className="ad-btn ad-btn--wa" href={waLink(row.whatsapp || row.phone, greet(row))} target="_blank" rel="noopener noreferrer">WhatsApp</a>
          <a className="ad-btn" href={`tel:${row.phone}`}>Call {row.phone}</a>
          {row.email && <a className="ad-btn" href={`mailto:${row.email}?subject=${encodeURIComponent(`Your enquiry #${row.id} — Signature`)}`}>Email</a>}
        </div>

        <div className="ad-detail ad-detail--status">
          <span>Status</span>
          <StatusSelect value={row.status} options={ENQUIRY_STATUS} onChange={changeStatus} />
        </div>

        <button className="ad-booking-cta" onClick={() => setBookingOpen(true)}>
          <span className="ad-booking-cta__icon">🍽</span>
          <span className="ad-booking-cta__text">
            <strong>Booking — Menu, Services &amp; Bill</strong>
            <small>
              {total
                ? `${row.dish_count || 0} dishes · Total ${rs(total)} · Balance ${rs(total - Number(row.advance_paid || 0))}`
                : "Add hall, dishes, services and advance here"}
            </small>
          </span>
          <span className="ad-booking-cta__go">Open →</span>
        </button>

        {bookingOpen && (
          <BookingEditor enquiry={row} onSaved={onBookingSaved} onClose={() => { setBookingOpen(false); onClose(); }} />
        )}

        <>
        <div className="ad-details">
          <Detail label="WhatsApp / Mobile">{row.phone}</Detail>
          <Detail label="Email">{row.email}</Detail>
          <Detail label="City">{row.city}</Detail>
          <Detail label="Event(s)">{types(row.event_types)}</Detail>
          <Detail label="Event date">{fmtDate(row.event_date)} <em className="ad-muted">({daysUntil(row.event_date)})</em></Detail>
          <Detail label="Time">{timing(row)}</Detail>
          <Detail label="Guests">{row.guests}</Detail>
          <Detail label="Enquiry for">{row.enquiry_for}</Detail>
          <Detail label="Customer message">{row.message}</Detail>
          <Detail label="Last updated">{row.updated_at && fmtDateTime(row.updated_at)}</Detail>
        </div>

        <label className="ad-notes-label" htmlFor="notes">Admin notes (only visible to admins)</label>
        <textarea id="notes" className="ad-notes" rows="5" value={notes}
          placeholder="e.g. Menu sent, Rs 50,000 advance received, venue Marquee XYZ..."
          onChange={(e) => { setNotes(e.target.value); setSaved(false); }} />
        <div className="ad-drawer__foot">
          <button className="ad-btn ad-btn--gold" onClick={saveNotes} disabled={notes === (row.admin_notes || "")}>
            {saved ? "Saved ✓" : "Save notes"}
          </button>
          <button className="ad-btn ad-btn--danger" onClick={() => onDelete(row)}>Delete</button>
        </div>
        </>
      </aside>
    </div>
  );
}

/* ================= Tabs ================= */

function EnquiriesTab({ onChanged, onAuthFail }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [when, setWhen] = useState("");
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status, when, q: q.trim() });
      const data = await adminFetch(`/enquiries?${params}`);
      setRows(data.rows);
    } catch (err) {
      if (err instanceof AuthError) onAuthFail();
    } finally {
      setLoading(false);
    }
  }, [status, when, q, onAuthFail]);

  useEffect(() => {
    const t = setTimeout(load, q ? 350 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  // har minute nayi enquiries check
  useEffect(() => {
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [load]);

  const update = async (id, body) => {
    const { row } = await adminFetch(`/enquiries/${id}`, { method: "PATCH", body });
    setRows((list) => list.map((r) => (r.id === id ? { ...r, ...row } : r)));
    onChanged();
  };

  // booking save hone ke baad table mein total/advance taaza karne ke liye list dobara
  const bookingSaved = () => { load(); onChanged(); };

  const remove = async (row) => {
    if (!window.confirm(`Delete enquiry #${row.id} (${row.name}) permanently?`)) return;
    await adminFetch(`/enquiries/${row.id}`, { method: "DELETE" });
    setRows((rs) => rs.filter((r) => r.id !== row.id));
    setOpenId(null);
    onChanged();
  };

  const exportCSV = () =>
    downloadCSV(`signature-enquiries-${new Date().toISOString().slice(0, 10)}.csv`, [
      ["ID", (r) => r.id], ["Received", (r) => r.created_at], ["Name", (r) => r.name], ["WhatsApp", (r) => r.phone],
      ["Email", (r) => r.email], ["City", (r) => r.city], ["Events", (r) => types(r.event_types)],
      ["Event date", (r) => r.event_date], ["Time", (r) => timing(r)], ["Guests", (r) => r.guests],
      ["Enquiry for", (r) => r.enquiry_for], ["Message", (r) => r.message], ["Status", (r) => ENQUIRY_STATUS[r.status]],
      ["Venue", (r) => r.venue], ["Total (Rs)", (r) => Math.max(0, Number(r.items_total || 0) - Number(r.discount || 0))],
      ["Advance (Rs)", (r) => Number(r.advance_paid || 0)],
      ["Balance (Rs)", (r) => Math.max(0, Number(r.items_total || 0) - Number(r.discount || 0)) - Number(r.advance_paid || 0)],
      ["Admin notes", (r) => r.admin_notes],
    ], rows);

  const open = rows.find((r) => r.id === openId);

  return (
    <section className="ad-card">
      <div className="ad-toolbar">
        <input className="ad-search" type="search" placeholder="Search name, number, email, city or #id..." value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All status</option>
          {Object.entries(ENQUIRY_STATUS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <select value={when} onChange={(e) => setWhen(e.target.value)}>
          <option value="">All dates</option>
          <option value="today">Received today</option>
          <option value="upcoming">Upcoming events</option>
          <option value="past">Past events</option>
        </select>
        <button className="ad-btn" onClick={load}>↻ Refresh</button>
        <button className="ad-btn ad-btn--gold" onClick={exportCSV} disabled={!rows.length}>⬇ Excel (CSV)</button>
      </div>

      <div className="ad-table-wrap">
        {/* compact table: milte-julte columns ek saath taake page mein fit ho */}
        <table className="ad-table ad-table--orders">
          <thead>
            <tr>
              <th>#</th><th>Customer</th><th>Event</th><th>Event date</th><th>Amount</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={r.status === "new" ? "is-new" : ""} onClick={() => setOpenId(r.id)}>
                <td className="ad-id">
                  {r.id}
                  <small className="ad-sub" title="Received">{fmtDateTime(r.created_at)}</small>
                </td>
                <td>
                  <strong>{r.name}</strong>
                  {r.admin_notes && <small className="ad-note-flag" title={r.admin_notes}> 📝</small>}
                  <div className="ad-phone">{r.phone} <ContactButtons row={r} text={greet(r)} /></div>
                  {r.email && <small className="ad-sub ad-ellipsis" title={r.email}>{r.email}</small>}
                </td>
                <td>
                  {types(r.event_types)}
                  <small className="ad-sub">{[r.city, r.guests && `${r.guests} guests`].filter(Boolean).join(" · ")}</small>
                </td>
                <td className="ad-nowrap">
                  {fmtDate(r.event_date)}
                  <small className="ad-sub">{[timing(r), daysUntil(r.event_date)].filter(Boolean).join(" · ")}</small>
                </td>
                <td className="ad-nowrap"><Amount row={r} /></td>
                <td><StatusSelect value={r.status} options={ENQUIRY_STATUS} onChange={(s) => update(r.id, { status: s })} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && rows.length === 0 && <p className="ad-empty">No enquiries found.</p>}
        {loading && rows.length === 0 && <p className="ad-empty">Loading...</p>}
      </div>
      <p className="ad-hint">Click any row to open full details and notes.</p>

      {open && <EnquiryDrawer row={open} onClose={() => setOpenId(null)} onUpdate={update} onDelete={remove} onBookingSaved={bookingSaved} />}
    </section>
  );
}

function VendorsTab({ onChanged, onAuthFail }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows((await adminFetch("/vendors")).rows);
    } catch (err) {
      if (err instanceof AuthError) onAuthFail();
    } finally {
      setLoading(false);
    }
  }, [onAuthFail]);
  useEffect(() => { load(); }, [load]);

  const update = async (id, body) => {
    const { row } = await adminFetch(`/vendors/${id}`, { method: "PATCH", body });
    setRows((rs) => rs.map((r) => (r.id === id ? row : r)));
    onChanged();
  };
  const remove = async (row) => {
    if (!window.confirm(`Delete vendor "${row.business_name}"?`)) return;
    await adminFetch(`/vendors/${row.id}`, { method: "DELETE" });
    setRows((rs) => rs.filter((r) => r.id !== row.id));
    onChanged();
  };

  return (
    <section className="ad-card">
      <div className="ad-toolbar">
        <span className="ad-muted">Decorators, photographers, caterers etc. who signed up via the "Join as Vendor" form.</span>
        <button className="ad-btn" onClick={load}>↻ Refresh</button>
        <button className="ad-btn ad-btn--gold" disabled={!rows.length} onClick={() =>
          downloadCSV("signature-vendors.csv", [
            ["ID", (r) => r.id], ["Received", (r) => r.created_at], ["Business", (r) => r.business_name],
            ["Contact", (r) => r.contact_name], ["WhatsApp", (r) => r.phone], ["City", (r) => r.city],
            ["Service", (r) => typeLabel(r.service_type)], ["Status", (r) => VENDOR_STATUS[r.status]],
          ], rows)}>⬇ Excel (CSV)</button>
      </div>
      <div className="ad-table-wrap">
        <table className="ad-table">
          <thead>
            <tr><th>#</th><th>Received</th><th>Business</th><th>Contact person</th><th>WhatsApp</th><th>City</th><th>Service</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={r.status === "new" ? "is-new" : ""}>
                <td className="ad-id">{r.id}</td>
                <td className="ad-nowrap">{fmtDateTime(r.created_at)}</td>
                <td><strong>{r.business_name}</strong></td>
                <td>{r.contact_name}</td>
                <td className="ad-nowrap">{r.phone} <ContactButtons row={r} text={`Assalam o Alaikum ${r.contact_name}! This is Signature Catering, getting in touch about your vendor registration.`} /></td>
                <td>{r.city}</td>
                <td>{typeLabel(r.service_type)}</td>
                <td><StatusSelect value={r.status} options={VENDOR_STATUS} onChange={(s) => update(r.id, { status: s })} /></td>
                <td><button className="ad-icon ad-icon--del" title="Delete" onClick={() => remove(r)}>🗑</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && rows.length === 0 && <p className="ad-empty">No vendor registrations yet.</p>}
      </div>
    </section>
  );
}

function SearchesTab({ onAuthFail }) {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    adminFetch("/searches").then((d) => setRows(d.rows)).catch((err) => { if (err instanceof AuthError) onAuthFail(); });
  }, [onAuthFail]);

  return (
    <section className="ad-card">
      <div className="ad-toolbar">
        <span className="ad-muted">What visitors search for in the website's "Plan Your Event" box — a good indicator of demand.</span>
      </div>
      <div className="ad-table-wrap">
        <table className="ad-table">
          <thead><tr><th>#</th><th>When</th><th>City</th><th>Event date</th><th>Time</th><th>Event(s)</th><th>Budget</th><th>Call back?</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="ad-id">{r.id}</td>
                <td className="ad-nowrap">{fmtDateTime(r.created_at)}</td>
                <td>{r.city || "-"}</td>
                <td className="ad-nowrap">{r.event_date ? fmtDate(r.event_date) : "-"}</td>
                <td>{timing(r) || "-"}</td>
                <td>{types(r.event_types)}</td>
                <td>{r.budget ? budgetLabel(r.budget) : "-"}</td>
                <td>{r.callback_requested ? <span className="ad-pill">Yes</span> : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="ad-empty">No searches yet.</p>}
      </div>
    </section>
  );
}

const budgetLabel = (b) => {
  const [min, max] = b.split("-").map(Number);
  const l = (n) => `${n / 100000}L`;
  return max > 900000000 ? `Rs ${l(min)}+` : min === 0 ? `Under Rs ${l(max)}` : `Rs ${l(min)} – ${l(max)}`;
};

/* ================= Dashboard ================= */

function Stats({ stats }) {
  if (!stats) return null;
  const e = stats.enquiries;
  const cards = [
    ["New enquiries", e.new_count, "Not contacted yet", "gold"],
    ["Received today", e.today, `${e.week} this week`, ""],
    ["Upcoming events", e.upcoming, "In the next 30 days", ""],
    ["Booked", e.booked, `${e.contacted} contacted`, "green"],
    ["Total enquiries", e.total, `${stats.searches.total} searches`, ""],
    ["New vendors", stats.vendors.new_count, `${stats.vendors.total} total`, ""],
  ];
  return (
    <>
      <div className="ad-stats">
        {cards.map(([label, value, sub, tone]) => (
          <div className={`ad-stat ${tone ? `ad-stat--${tone}` : ""}`} key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{sub}</small>
          </div>
        ))}
      </div>
      {(stats.topTypes.length > 0 || stats.topCities.length > 0) && (
        <div className="ad-tops">
          <div><span>Most requested:</span> {stats.topTypes.map((t) => <em key={t.type}>{typeLabel(t.type)} ({t.n})</em>)}</div>
          <div><span>Top cities:</span> {stats.topCities.map((c) => <em key={c.city}>{c.city} ({c.n})</em>)}</div>
        </div>
      )}
    </>
  );
}

export default function AdminApp() {
  const [authed, setAuthed] = useState(Boolean(getKey()));
  const [tab, setTab] = useState("enquiries");
  const [changingPwd, setChangingPwd] = useState(false);

  // phone par tables cards ban jaati hain — har khane par uske column ka naam (data-label) likh do
  useEffect(() => {
    const label = () => document.querySelectorAll(".ad-table:not(.ad-table--orders)").forEach((t) => {
      const heads = [...t.querySelectorAll("thead th")].map((th) => th.textContent.trim());
      t.querySelectorAll("tbody tr").forEach((tr) => [...tr.children].forEach((td, i) => {
        if (heads[i] && td.dataset.label !== heads[i]) td.dataset.label = heads[i];
      }));
    });
    label();
    const mo = new MutationObserver(label);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);
  const [stats, setStats] = useState(null);

  const logout = useCallback(() => {
    setKey("");
    setAuthed(false);
  }, []);

  const loadStats = useCallback(() => {
    adminFetch("/stats").then(setStats).catch((err) => { if (err instanceof AuthError) logout(); });
  }, [logout]);

  useEffect(() => {
    document.title = "Admin · Signature";
    if (!authed) return;
    loadStats();
    const t = setInterval(loadStats, 60000);
    return () => clearInterval(t);
  }, [authed, loadStats]);

  const pages = useMemo(() => [
    ["enquiries", "📋", "Orders / Enquiries", stats?.enquiries.new_count],
    ["reports", "📈", "Reports", null],
    ["catalog", "🍽", "Menu & Services", null],
    ["vendors", "🤝", "Vendors", stats?.vendors.new_count],
    ["searches", "🔍", "Website searches", null],
  ], [stats]);

  const go = (id) => {
    setTab(id);
    try { sessionStorage.setItem("signature_admin_page", id); } catch { /* private mode */ }
    window.scrollTo(0, 0);
  };
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("signature_admin_page");
      if (saved) setTab(saved);
    } catch { /* private mode */ }
  }, []);

  if (!authed) return <Login onLogin={() => setAuthed(true)} />;

  const current = pages.find((p) => p[0] === tab) || pages[0];

  return (
    <div className="ad ad-layout">
      <aside className="ad-side">
        <div className="ad-side__brand">
          <Logo href="/admin" />
          <span className="ad-panel-tag">Admin Panel</span>
        </div>
        <nav className="ad-side__nav">
          {pages.map(([id, icon, label, badge]) => (
            <button key={id} className={tab === id ? "is-active" : ""} onClick={() => go(id)} title={label}>
              <span className="ad-side__icon">{icon}</span>
              <span className="ad-side__label">{label}</span>
              {badge ? <span className="ad-badge">{badge}</span> : null}
            </button>
          ))}
        </nav>
        <div className="ad-side__foot">
          <a href="/" onClick={markFromAdmin} title="View website">🌐 <span className="ad-side__label">View website</span></a>
          <button onClick={() => setChangingPwd(true)} title="Change password">🔑 <span className="ad-side__label">Change password</span></button>
          <button onClick={logout}>🚪 <span className="ad-side__label">Logout</span></button>
        </div>
      </aside>

      <main className="ad-main">
        <div className="ad-page-head">
          <h1>{current[1]} {current[2]}</h1>
        </div>

        {tab === "enquiries" && (
          <>
            <Stats stats={stats} />
            <div className="ad-gap" />
            <EnquiriesTab onChanged={loadStats} onAuthFail={logout} />
          </>
        )}
        {tab === "reports" && <Reports onAuthFail={logout} />}
        {tab === "catalog" && <CatalogTab />}
        {tab === "vendors" && <VendorsTab onChanged={loadStats} onAuthFail={logout} />}
        {tab === "searches" && <SearchesTab onAuthFail={logout} />}
      </main>
      {changingPwd && (
        <ChangePassword initialCurrent={getKey()} onClose={() => setChangingPwd(false)} onChanged={(pwd) => setKey(pwd)} />
      )}
    </div>
  );
}
