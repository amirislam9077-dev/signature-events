import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { COMPANY, timingText, typeLabel } from "../data";
import { adminFetch } from "./adminApi";
import Logo from "../components/Logo";
import "./booking.css";

export const UNIT_LABEL = { per_head: "per head", fixed: "fixed", kg: "per kg", piece: "per piece" };
export const rs = (n) => `Rs ${Math.round(Number(n) || 0).toLocaleString("en-PK")}`;
const lineTotal = (it) => (Number(it.qty) || 0) * (Number(it.price) || 0);

let catalogCache = null;
export const loadCatalog = async (force = false) => {
  if (!catalogCache || force) catalogCache = (await adminFetch("/catalog")).rows;
  return catalogCache;
};
export const clearCatalogCache = () => { catalogCache = null; };

const venueText = (v) => `${v.name}, ${v.category}`;
// hall ka kiraya booking mein ek "service" item ki tarah save hota hai (category = Venue)
const isRent = (i) => i.kind === "service" && i.category === "Venue";
const withRent = (items, price, hallName) => {
  const rest = items.filter((i) => !isRent(i));
  if (!price) return rest;
  return [...rest, { kind: "service", category: "Venue", name: `Hall Rent — ${hallName || "Hall"}`, qty: 1, unit: "fixed", price, notes: "" }];
};

const groupBy = (rows, key) =>
  rows.reduce((acc, r) => {
    (acc[r[key] || "Other"] ||= []).push(r);
    return acc;
  }, {});

/* ---------- print / WhatsApp ---------- */

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function printBooking(e, form, items, totals) {
  const section = (kind, title) => {
    const list = items.filter((i) => i.kind === kind);
    if (!list.length) return "";
    const groups = groupBy(list, "category");
    return `<h2>${title}</h2>` + Object.entries(groups).map(([cat, rows]) => `
      <h3>${esc(cat)}</h3>
      <table>${rows.map((r) => `<tr><td>${esc(r.name)}${r.notes ? `<small> — ${esc(r.notes)}</small>` : ""}</td>
        <td class="n">${Number(r.qty)} × ${rs(r.price)} <small>${UNIT_LABEL[r.unit]}</small></td>
        <td class="n">${rs(lineTotal(r))}</td></tr>`).join("")}</table>`).join("");
  };
  const when = [e.event_date, timingText(e.start_time?.slice(0, 5), e.end_time?.slice(0, 5))].filter(Boolean).join(" · ");
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Booking #${e.id} — ${esc(e.name)}</title>
  <style>
    body{font-family:Arial,sans-serif;color:#1a1a1c;max-width:760px;margin:24px auto;padding:0 20px}
    header{background:#122135;color:#C8CAD3;text-align:center;padding:18px;border-bottom:3px solid #C8CAD3}
    header b{font-family:Georgia,serif;font-size:26px;letter-spacing:6px}header div{font-size:10px;letter-spacing:3px;color:#e8e2d4;margin-top:4px}
    .meta{display:grid;grid-template-columns:1fr 1fr;gap:4px 24px;margin:18px 0;font-size:14px}.meta span{color:#173159;font-weight:bold}
    h2{border-bottom:2px solid #C8CAD3;padding-bottom:4px;margin-top:26px;font-family:Georgia,serif}
    h3{margin:14px 0 4px;font-size:14px;color:#173159;text-transform:uppercase;letter-spacing:1px}
    table{width:100%;border-collapse:collapse;font-size:14px}td{padding:6px 4px;border-bottom:1px solid #eee}.n{text-align:right;white-space:nowrap}
    small{color:#777}.tot td{border:0;padding:4px}.tot .g td{font-size:17px;font-weight:bold;border-top:2px solid #122135}
    footer{text-align:center;margin-top:30px;font-size:12px;color:#777}
    @media print{body{margin:0}}
  </style></head><body>
  <header><b>SIGNATURE</b><div>CATERING &amp; EVENT MANAGEMENT</div></header>
  <div class="meta">
    <div><span>Booking #</span> ${e.id}</div><div><span>Customer</span> ${esc(e.name)}</div>
    <div><span>WhatsApp</span> ${esc(e.phone)}</div><div><span>Event</span> ${esc((e.event_types || "").split(",").map(typeLabel).join(", "))}</div>
    <div><span>Date</span> ${esc(when)}</div><div><span>Guests</span> ${esc(form.guests || "-")}</div>
    <div><span>Venue</span> ${esc(form.venue || "-")}</div><div><span>City</span> ${esc(e.city)}</div>
  </div>
  ${section("dish", "Menu")}
  ${section("service", "Services")}
  <h2>Payment</h2>
  <table class="tot">
    <tr><td>Menu</td><td class="n">${rs(totals.dishes)}</td></tr>
    <tr><td>Services</td><td class="n">${rs(totals.services)}</td></tr>
    ${totals.hall ? `<tr><td>Hall rent</td><td class="n">${rs(totals.hall)}</td></tr>` : ""}
    ${totals.discount ? `<tr><td>Discount</td><td class="n">− ${rs(totals.discount)}</td></tr>` : ""}
    <tr class="g"><td>Total</td><td class="n">${rs(totals.grand)}</td></tr>
    <tr><td>Advance received</td><td class="n">${rs(totals.advance)}</td></tr>
    <tr class="g"><td>Balance</td><td class="n">${rs(totals.balance)}</td></tr>
  </table>
  <footer>${esc(COMPANY.tagline)} · ☎ ${esc(COMPANY.phone)} · ${esc(COMPANY.email)}</footer>
  <script>window.onload=()=>window.print()</script></body></html>`;
  const w = window.open("", "_blank");
  if (!w) return alert("Popup blocked — please allow popups in your browser.");
  w.document.write(html);
  w.document.close();
}

function whatsappText(e, form, items, totals) {
  const lines = [`Assalam o Alaikum ${e.name}!`, `*Signature — Booking #${e.id}*`, `Date: ${e.event_date}${form.venue ? ` · ${form.venue}` : ""}`, `Guests: ${form.guests || "-"}`];
  const dishes = items.filter((i) => i.kind === "dish");
  const services = items.filter((i) => i.kind === "service");
  if (dishes.length) lines.push("", "*Menu:*", ...dishes.map((d) => `• ${d.name}${d.notes ? ` (${d.notes})` : ""}`));
  if (services.length) lines.push("", "*Services:*", ...services.map((s) => `• ${s.name}`));
  lines.push("", `Menu: ${rs(totals.dishes)}`, `Services: ${rs(totals.services)}`, ...(totals.hall ? [`Hall rent: ${rs(totals.hall)}`] : []), `Total: ${rs(totals.grand)}`, `Advance: ${rs(totals.advance)}`, `*Balance: ${rs(totals.balance)}*`, "", "Thank you — Team Signature");
  return lines.join("\n");
}

const toIntlPK = (phone) => {
  let d = String(phone || "").replace(/\D/g, "");
  if (d.startsWith("0")) d = "92" + d.slice(1);
  return d;
};


const UNIT_SHORT = { per_head: "/ head", fixed: "fixed", kg: "/ kg", piece: "/ piece" };

/* ---------- nayi dish / service / hall list mein hamesha ke liye ---------- */

const QUICK_LABELS = {
  dish: { title: "New dish", cat: "Category (e.g. BBQ)", name: "Dish name", price: "Rate (Rs)", unit: "per_head" },
  service: { title: "New service", cat: "Category (e.g. Decor)", name: "Service name", price: "Rate (Rs)", unit: "fixed" },
  venue: { title: "New hall", cat: "Area (e.g. DHA Phase 6)", name: "Hall / Marquee name", price: "Rent (Rs)", unit: "fixed" },
};

function QuickAdd({ kind, catalog, onCreated, onCancel }) {
  const L = QUICK_LABELS[kind];
  const [f, setF] = useState({ category: "", name: "", unit: L.unit, price: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const categories = [...new Set(catalog.filter((c) => c.kind === kind).map((c) => c.category))];

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { row } = await adminFetch("/catalog", { method: "POST", body: { ...f, kind } });
      onCreated(row);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="bkp-modal" onClick={onCancel}>
      <form className="bkp-modal__box" onSubmit={save} onClick={(e) => e.stopPropagation()}>
        <h3>{L.title}</h3>
        <p className="ad-muted">This will be saved to your list permanently and added to this booking.</p>
        <label>{L.name}<input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required autoFocus /></label>
        <label>
          {L.cat}
          <input list={`qa-${kind}`} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} required />
          <datalist id={`qa-${kind}`}>{categories.map((c) => <option key={c} value={c} />)}</datalist>
        </label>
        <div className="bkp-modal__row">
          {kind !== "venue" && (
            <label>Unit
              <select value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })}>
                {Object.entries(UNIT_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </select>
            </label>
          )}
          <label>{L.price}<input type="number" min="0" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></label>
        </div>
        {error && <p className="ad-error">{error}</p>}
        <div className="bkp-modal__btns">
          <button type="button" className="ad-btn" onClick={onCancel}>Cancel</button>
          <button className="ad-btn ad-btn--gold" disabled={busy}>{busy ? "Saving..." : "Save & add"}</button>
        </div>
      </form>
    </div>
  );
}

/* ---------- baayein taraf: list se chunne wale cards ---------- */

function Picker({ catalog, items, onAdd, onRemove, onNew }) {
  const [kind, setKind] = useState("dish");
  const [cat, setCat] = useState("");
  const [q, setQ] = useState("");

  const all = catalog.filter((c) => c.kind === kind && c.active);
  const categories = [...new Set(all.map((c) => c.category))];
  const shown = all.filter((c) => (!cat || c.category === cat) && (!q || c.name.toLowerCase().includes(q.toLowerCase())));
  const added = new Map(items.filter((i) => i.kind === kind).map((i) => [i.name, i]));
  const count = (k) => items.filter((i) => i.kind === k).length;

  return (
    <section className="bkp-picker">
      <div className="bkp-picker__top">
        <div className="bkp-seg">
          <button className={kind === "dish" ? "is-active" : ""} onClick={() => { setKind("dish"); setCat(""); }}>
            🍽 Dishes {count("dish") > 0 && <span>{count("dish")}</span>}
          </button>
          <button className={kind === "service" ? "is-active" : ""} onClick={() => { setKind("service"); setCat(""); }}>
            ✦ Services {count("service") > 0 && <span>{count("service")}</span>}
          </button>
        </div>
        <input className="bkp-search" type="search" placeholder={`Search ${kind === "dish" ? "dishes" : "services"}...`} value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="ad-btn" onClick={() => onNew(kind)}>＋ New {kind === "dish" ? "dish" : "service"}</button>
      </div>

      <div className="bkp-chips">
        <button className={!cat ? "is-active" : ""} onClick={() => setCat("")}>All</button>
        {categories.map((c) => (
          <button key={c} className={cat === c ? "is-active" : ""} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>

      <div className="bkp-cards">
        {shown.map((c) => {
          const isAdded = added.has(c.name);
          return (
            <button key={c.id} className={`bkp-card ${isAdded ? "is-added" : ""}`}
              onClick={() => (isAdded ? onRemove(c.name, kind) : onAdd(c))}
              title={isAdded ? "Click to remove" : "Click to add"}>
              <span className="bkp-card__cat">{c.category}</span>
              <span className="bkp-card__name">{c.name}</span>
              <span className="bkp-card__price">{Number(c.price) ? rs(c.price) : "Set rate"} <small>{UNIT_SHORT[c.unit]}</small></span>
              <span className="bkp-card__add">{isAdded ? "✓ Added" : "＋ Add"}</span>
            </button>
          );
        })}
        {shown.length === 0 && <p className="bk-empty">Nothing found. Use "＋ New" to create a new item.</p>}
      </div>
    </section>
  );
}

/* ---------- daayein taraf: chuni hui cheezein ---------- */

function SelectedLine({ it, fresh, onSet, onRemove }) {
  const [noteOpen, setNoteOpen] = useState(Boolean(it.notes));
  const ref = useRef(null);
  const step = (d) => onSet("qty", Math.max(0, (Number(it.qty) || 0) + d));

  // abhi add hui line nazar ke saamne aaye
  useEffect(() => {
    if (fresh) ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [fresh]);

  // ek item = table ki ek line
  return (
    <div className={`bkp-row ${fresh ? "is-fresh" : ""}`} ref={ref}>
      <div className="bkp-row__item">
        <input className="bkp-row__name" value={it.name} placeholder="Item name" title={it.name} onChange={(e) => onSet("name", e.target.value)} />
        <span className="bkp-row__meta">
          {it.category}
          {!noteOpen && <button className="bkp-row__notebtn" onClick={() => setNoteOpen(true)}>✎ note</button>}
        </span>
      </div>
      <div className="bkp-qty">
        <button onClick={() => step(-1)} aria-label="Less">−</button>
        <input type="number" min="0" value={it.qty} onChange={(e) => onSet("qty", e.target.value)} />
        <button onClick={() => step(1)} aria-label="More">+</button>
      </div>
      <select className="bkp-unit" value={it.unit} onChange={(e) => onSet("unit", e.target.value)} title="Unit">
        {Object.entries(UNIT_SHORT_SELECT).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </select>
      <input className="bkp-rate" type="number" min="0" value={it.price} onChange={(e) => onSet("price", e.target.value)} title="Rate (Rs)" />
      <strong className="bkp-row__total">{rs(lineTotal(it))}</strong>
      <button className="bkp-row__del" onClick={onRemove} title="Remove">×</button>
      {noteOpen && (
        <input className="bkp-note" value={it.notes || ""} placeholder="Note — e.g. less spicy, 2 counters" onChange={(e) => onSet("notes", e.target.value)} autoFocus={!it.notes} />
      )}
    </div>
  );
}

const UNIT_SHORT_SELECT = { per_head: "/head", fixed: "fixed", kg: "/kg", piece: "/piece" };

function SelectedGroup({ kind, title, items, freshIndex, onChange, onCustom }) {
  const list = items.map((it, index) => ({ it, index })).filter(({ it }) => it.kind === kind && !isRent(it));
  const total = list.reduce((s, { it }) => s + lineTotal(it), 0);
  const set = (index, key, value) => onChange(items.map((it, i) => (i === index ? { ...it, [key]: value } : it)));
  const remove = (index) => onChange(items.filter((_, i) => i !== index));

  return (
    <div className="bkp-group">
      <div className="bkp-group__head">
        <h4>{title} <small>{list.length}</small></h4>
        <span>{rs(total)}</span>
      </div>
      {list.length === 0 && <p className="bk-empty">Click {kind === "dish" ? "dishes" : "services"} on the left to add them.</p>}
      {list.length > 0 && (
        <div className="bkp-row bkp-row--head">
          <span>Item</span><span>Qty</span><span>Unit</span><span>Rate</span><span>Total</span><span></span>
        </div>
      )}
      {list.map(({ it, index }) => (
        <SelectedLine key={index} it={it} fresh={index === freshIndex} onSet={(k, v) => set(index, k, v)} onRemove={() => remove(index)} />
      ))}
      <button className="bkp-addnote" onClick={() => onCustom(kind)}>＋ Add a one-off {kind === "dish" ? "dish" : "service"} (this booking only)</button>
    </div>
  );
}

/* ---------- main: poori screen ka booking editor ---------- */

export default function BookingEditor({ enquiry, onSaved, onClose }) {
  const [catalog, setCatalog] = useState([]);
  const [form, setForm] = useState(null);
  const [items, setItems] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [customVenue, setCustomVenue] = useState(false);
  const [quick, setQuick] = useState(null); // "dish" | "service" | "venue"
  const [freshIndex, setFreshIndex] = useState(-1); // abhi add hui item — bill mein chamakti hai

  useEffect(() => {
    let alive = true;
    Promise.all([loadCatalog(), adminFetch(`/enquiries/${enquiry.id}/booking`)]).then(([cat, data]) => {
      if (!alive) return;
      setCatalog(cat);
      const e = data.enquiry;
      setForm({ venue: e.venue || "", guests: e.guests ?? "", advance_paid: Number(e.advance_paid) || 0, discount: Number(e.discount) || 0 });
      let loaded = data.items.map((i) => ({ ...i, qty: Number(i.qty), price: Number(i.price) }));
      // purani booking: hall chuna tha magar kiraya bill mein nahi — ab khud jod do
      const hall = cat.find((c) => c.kind === "venue" && venueText(c) === e.venue);
      const needsRent = hall && Number(hall.price) > 0 && !loaded.some(isRent);
      if (needsRent) loaded = withRent(loaded, Number(hall.price), hall.name);
      setItems(loaded);
      setDirty(Boolean(needsRent));
      if (needsRent) setMsg("Hall rent has been added to the bill — click Save booking.");
    }).catch((err) => setMsg(err.message));
    return () => { alive = false; };
  }, [enquiry.id]);

  const totals = useMemo(() => {
    const dishes = items.filter((i) => i.kind === "dish").reduce((s, i) => s + lineTotal(i), 0);
    const services = items.filter((i) => i.kind === "service" && !isRent(i)).reduce((s, i) => s + lineTotal(i), 0);
    const hall = items.filter(isRent).reduce((s, i) => s + lineTotal(i), 0);
    const discount = Number(form?.discount) || 0;
    const advance = Number(form?.advance_paid) || 0;
    const grand = Math.max(0, dishes + services + hall - discount);
    const guests = Number(form?.guests) || 0;
    return { dishes, services, hall, discount, advance, grand, balance: grand - advance, perHead: guests ? dishes / guests : 0 };
  }, [items, form]);

  const close = () => {
    if (dirty && !window.confirm("You have unsaved changes. Close anyway?")) return;
    onClose();
  };

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && !quick) close(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  });

  const setField = (key, value) => {
    // guests badlein to "per head" wali items ki qty bhi saath badle (jo pehle guests ke barabar thi)
    if (key === "guests") {
      const old = Number(form.guests) || 0;
      setItems((its) => its.map((it) => (it.unit === "per_head" && Number(it.qty) === old ? { ...it, qty: Number(value) || 0 } : it)));
    }
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
    setMsg("");
  };
  const changeItems = (next) => { setItems(next); setDirty(true); setMsg(""); };

  const fromCatalog = (c) => ({
    kind: c.kind, category: c.category, name: c.name, unit: c.unit, price: Number(c.price),
    qty: c.unit === "per_head" ? Number(form.guests) || 1 : 1, notes: "",
  });
  const addItem = (c) => { setFreshIndex(items.length); changeItems([...items, fromCatalog(c)]); };
  const removeByName = (name, kind) => { setFreshIndex(-1); changeItems(items.filter((i) => !(i.kind === kind && i.name === name))); };
  const addCustom = (kind) => { setFreshIndex(items.length); changeItems([...items, { kind, category: "Other", name: "", unit: kind === "dish" ? "per_head" : "fixed", price: 0, qty: kind === "dish" ? Number(form.guests) || 1 : 1, notes: "" }]); };

  const created = (row) => {
    clearCatalogCache();
    setCatalog((c) => [...c, row]);
    setQuick(null);
    if (row.kind === "venue") {
      setCustomVenue(false);
      setField("venue", venueText(row));
      changeItems(withRent(items, Number(row.price) || 0, row.name));
    } else {
      addItem(row);
    }
  };

  const save = async () => {
    if (items.some((i) => !String(i.name).trim())) return setMsg("Please enter a name for every item.");
    setSaving(true);
    try {
      const data = await adminFetch(`/enquiries/${enquiry.id}/booking`, { method: "PUT", body: { ...form, items } });
      setItems(data.items.map((i) => ({ ...i, qty: Number(i.qty), price: Number(i.price) })));
      setDirty(false);
      setMsg("Saved ✓");
      onSaved(data.enquiry);
    } catch (err) {
      setMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const venues = catalog.filter((c) => c.kind === "venue" && c.active);
  const venuesByArea = groupBy(venues, "category");
  const venueMatch = form && venues.find((v) => venueText(v) === form.venue);
  const venueChoice = !form ? "" : venueMatch ? form.venue : form.venue || customVenue ? "__custom" : "";
  // hall chunte hi us ka kiraya bill mein (purana hall badla to purana kiraya hata kar naya)
  const pickVenue = (value) => {
    if (value === "__custom") {
      setCustomVenue(true);
      if (venueMatch) setField("venue", "");
      return;
    }
    setCustomVenue(false);
    setField("venue", value);
    const hall = venues.find((v) => venueText(v) === value);
    changeItems(withRent(items, hall ? Number(hall.price) : 0, hall?.name));
  };
  const rentItem = items.find(isRent);
  const setRent = (price) => {
    const name = venueMatch?.name || form.venue.split(",")[0] || "Hall";
    changeItems(withRent(items, Number(price) || 0, name));
  };

  const when = [fmtDay(enquiry.event_date), timingText(enquiry.start_time?.slice(0, 5), enquiry.end_time?.slice(0, 5))].filter(Boolean).join(" · ");

  // poori screen par — drawer ke andar nahi
  return createPortal(
    <div className="bkp">
      <header className="bkp-head">
        <Logo href="/admin" onClick={(e) => { e.preventDefault(); close(); }} />
        <span className="bkp-head__divider" aria-hidden="true" />
        <div className="bkp-head__title">
          <small>Booking #{enquiry.id}</small>
          <h2>{enquiry.name}</h2>
          <span>{[when, enquiry.city, (enquiry.event_types || "").split(",").filter(Boolean).map(typeLabel).join(", ")].filter(Boolean).join(" · ")}</span>
        </div>
        <div className="bkp-head__actions">
          {dirty && <span className="bkp-unsaved">● Unsaved changes</span>}
          <button className="bkp-back" onClick={close} title="Back to admin">← Back to Admin</button>
          <button className="ad-btn ad-btn--gold" onClick={save} disabled={saving || !dirty || !form}>{saving ? "Saving..." : dirty ? "Save booking" : "Saved ✓"}</button>
          <button className="bkp-close" onClick={close} aria-label="Back to admin" title="Back to admin">×</button>
        </div>
      </header>

      {!form ? (
        <p className="bk-empty bkp-loading">{msg || "Loading..."}</p>
      ) : (
        <>
          <div className="bkp-info">
            <label className="bkp-venue">
              <span>Venue / Hall</span>
              <div className="bkp-venue__row">
                <select value={venueChoice} onChange={(e) => pickVenue(e.target.value)}>
                  <option value="">— Select a hall —</option>
                  {Object.entries(venuesByArea).map(([area, list]) => (
                    <optgroup key={area} label={area}>
                      {list.map((v) => <option key={v.id} value={venueText(v)}>{v.name}{Number(v.price) ? ` — rent ${rs(v.price)}` : ""}</option>)}
                    </optgroup>
                  ))}
                  <option value="__custom">✎ Other hall (type it in)</option>
                </select>
                <button className="ad-btn" onClick={() => setQuick("venue")}>＋ New hall</button>
              </div>
              {venueChoice === "__custom" && (
                <input value={form.venue} placeholder="Hall name and area" onChange={(e) => setField("venue", e.target.value)} />
              )}
            </label>
            <label className="bkp-rent">
              <span>Hall rent (Rs)</span>
              <input type="number" min="0" placeholder="0" value={rentItem ? rentItem.price : ""} onChange={(e) => setRent(e.target.value)} />
            </label>
            <label className="bkp-guests">
              <span>Final guests</span>
              <input type="number" min="1" value={form.guests} onChange={(e) => setField("guests", e.target.value)} />
            </label>
            <div className="bkp-info__stat"><span>Menu per head</span><strong>{rs(totals.perHead)}</strong></div>
            <div className="bkp-info__stat"><span>Total</span><strong>{rs(totals.grand)}</strong></div>
          </div>

          <div className="bkp-body">
            <Picker catalog={catalog} items={items} onAdd={addItem} onRemove={removeByName} onNew={setQuick} />

            <aside className="bkp-summary">
              <h3>Order summary</h3>
              <div className="bkp-summary__scroll">
                <SelectedGroup kind="dish" title="Menu" items={items} freshIndex={freshIndex} onChange={changeItems} onCustom={addCustom} />
                <SelectedGroup kind="service" title="Services" items={items} freshIndex={freshIndex} onChange={changeItems} onCustom={addCustom} />
              </div>

              <div className="bkp-footer">
                <div className="bkp-totals">
                  <div><span>Menu</span><b>{rs(totals.dishes)}</b></div>
                  <div><span>Services</span><b>{rs(totals.services)}</b></div>
                  <div className="bkp-totals__hall"><span>🏛 Hall rent</span><b>{rs(totals.hall)}</b></div>
                  <div className="bkp-totals__hallname">{totals.hall ? form.venue.split(",")[0] : "No hall selected"}</div>
                  <div><span>Discount</span><input type="number" min="0" value={form.discount} onChange={(e) => setField("discount", e.target.value)} /></div>
                  <div><span>Advance</span><input type="number" min="0" value={form.advance_paid} onChange={(e) => setField("advance_paid", e.target.value)} /></div>
                  <div className="bkp-totals__grand"><span>Total</span><b>{rs(totals.grand)}</b></div>
                  <div className={`bkp-totals__grand ${totals.balance > 0 ? "bk-due" : "bk-paid"}`}><span>Balance</span><b>{rs(totals.balance)}</b></div>
                </div>
                <div className="bkp-actions">
                  <button className="ad-btn" onClick={() => printBooking(enquiry, form, items, totals)} disabled={!items.length}>🖨 Print / PDF</button>
                  <a className={`ad-btn ad-btn--wa ${!items.length ? "is-disabled" : ""}`} target="_blank" rel="noopener noreferrer"
                    href={`https://wa.me/${toIntlPK(enquiry.phone)}?text=${encodeURIComponent(whatsappText(enquiry, form, items, totals))}`}>
                    Send on WhatsApp
                  </a>
                </div>
                {msg && <p className={msg.startsWith("Saved") ? "bk-ok" : "ad-error"}>{msg}</p>}
              </div>
            </aside>
          </div>
        </>
      )}

      {quick && <QuickAdd kind={quick} catalog={catalog} onCreated={created} onCancel={() => setQuick(null)} />}
    </div>,
    document.body
  );
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function fmtDay(d) {
  if (!d) return "";
  const [y, m, day] = String(d).slice(0, 10).split("-").map(Number);
  const x = new Date(y, m - 1, day);
  return `${DAYS[x.getDay()]}, ${day} ${MONTHS[m - 1]} ${y}`;
}
