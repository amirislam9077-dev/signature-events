import { useCallback, useEffect, useMemo, useState } from "react";
import { CITIES, TYPES, typeLabel } from "../data";
import { AuthError, adminFetch } from "./adminApi";
import { rs } from "./Booking";
import "./reports.css";

/* ================= date helpers ================= */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parse = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d || 1); };

function presetRange(key) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  switch (key) {
    case "this_month": return [new Date(y, m, 1), new Date(y, m + 1, 0)];
    case "last_month": return [new Date(y, m - 1, 1), new Date(y, m, 0)];
    case "last_3": return [new Date(y, m - 2, 1), new Date(y, m + 1, 0)];
    case "last_6": return [new Date(y, m - 5, 1), new Date(y, m + 1, 0)];
    case "this_year": return [new Date(y, 0, 1), new Date(y, 11, 31)];
    default: return [null, null];
  }
}
const PRESETS = [
  ["this_month", "This month"], ["last_month", "Last month"], ["last_3", "Last 3 months"],
  ["last_6", "Last 6 months"], ["this_year", "This year"], ["all", "All time"], ["custom", "Custom"],
];

const periodLabel = (p, group) => {
  if (group === "month") { const [y, m] = p.split("-").map(Number); return `${MONTHS[m - 1]} ${String(y).slice(2)}`; }
  const d = parse(p);
  return `${group === "week" ? "Wk " : ""}${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

// khali mahine/hafte/din bhi graph mein 0 ke saath dikhein
function fillPeriods(series, group, from, to) {
  if (!series.length && (!from || !to)) return [];
  const map = new Map(series.map((s) => [s.period, s]));
  const keys = series.map((s) => s.period).sort();
  let start = from ? parse(from) : parse(keys[0].length === 7 ? `${keys[0]}-01` : keys[0]);
  const end = to ? parse(to) : parse(keys[keys.length - 1].length === 7 ? `${keys[keys.length - 1]}-01` : keys[keys.length - 1]);
  const out = [];
  if (group === "month") {
    for (let d = new Date(start.getFullYear(), start.getMonth(), 1); d <= end && out.length < 60; d.setMonth(d.getMonth() + 1)) {
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      out.push(map.get(k) || { period: k, orders: 0, booked: 0, sales: 0, advance: 0 });
    }
  } else {
    if (group === "week") start = new Date(start.getFullYear(), start.getMonth(), start.getDate() - ((start.getDay() + 6) % 7));
    const step = group === "week" ? 7 : 1;
    for (let d = new Date(start); d <= end && out.length < 120; d.setDate(d.getDate() + step)) {
      const k = iso(d);
      out.push(map.get(k) || { period: k, orders: 0, booked: 0, sales: 0, advance: 0 });
    }
  }
  return out;
}

const short = (n) => {
  const v = Number(n) || 0;
  if (v >= 10000000) return `${(v / 10000000).toFixed(v % 10000000 ? 1 : 0)} Cr`;
  if (v >= 100000) return `${(v / 100000).toFixed(v % 100000 ? 1 : 0)} L`;
  if (v >= 1000) return `${Math.round(v / 1000)}k`;
  return String(v);
};

// saaf scale: 0, 2L, 4L, 6L... (1-2-5 steps)
function niceTicks(max, count = 4) {
  if (max <= 0) return [0, 1];
  const raw = max / count;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw);
  const top = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = 0; v <= top + step / 2; v += step) ticks.push(v);
  return ticks;
}

/* ================= charts ================= */

function BarChart({ title, data, valueKey, format, axisFormat, empty }) {
  const [hover, setHover] = useState(null);
  const W = 720, H = 260, L = 56, R = 12, T = 16, B = 34;
  const max = Math.max(0, ...data.map((d) => Number(d[valueKey]) || 0));
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1] || 1;
  const plotW = W - L - R, plotH = H - T - B;
  const slot = data.length ? plotW / data.length : plotW;
  const barW = Math.max(4, Math.min(48, slot * 0.62));
  const y = (v) => T + plotH - (v / top) * plotH;
  const labelEvery = Math.ceil(data.length / 12);
  const total = data.reduce((s, d) => s + (Number(d[valueKey]) || 0), 0);

  return (
    <div className="rp-chart">
      <div className="rp-chart__head">
        <h3>{title}</h3>
        <span>Total: <b>{format(total)}</b></span>
      </div>
      {data.length === 0 || max === 0 ? (
        <p className="rp-empty">{empty}</p>
      ) : (
        <div className="rp-chart__wrap">
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={title}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} className={t === 0 ? "rp-axis" : "rp-grid"} />
                <text x={L - 8} y={y(t) + 4} textAnchor="end" className="rp-tick">{axisFormat(t)}</text>
              </g>
            ))}
            {data.map((d, i) => {
              const v = Number(d[valueKey]) || 0;
              const x = L + i * slot + (slot - barW) / 2;
              const h = Math.max(0, y(0) - y(v));
              const r = Math.min(4, barW / 2, h);
              return (
                <g key={d.period} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                  <rect x={L + i * slot} y={T} width={slot} height={plotH} fill="transparent" />
                  {h > 0 && (
                    <path className={`rp-bar ${hover === i ? "is-hover" : ""}`}
                      d={`M${x},${y(0)} V${y(v) + r} Q${x},${y(v)} ${x + r},${y(v)} H${x + barW - r} Q${x + barW},${y(v)} ${x + barW},${y(v) + r} V${y(0)} Z`} />
                  )}
                  {i % labelEvery === 0 && (
                    <text x={L + i * slot + slot / 2} y={H - 12} textAnchor="middle" className="rp-tick">{d.label}</text>
                  )}
                </g>
              );
            })}
          </svg>
          {hover !== null && (
            <div className="rp-tip" style={{ left: `${((L + hover * slot + slot / 2) / W) * 100}%` }}>
              <strong>{data[hover].label}</strong>
              <span>{format(data[hover][valueKey])}</span>
              {valueKey === "sales" && <small>{data[hover].booked} booked · {data[hover].orders} orders</small>}
              {valueKey === "orders" && <small>{data[hover].booked} booked</small>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function HBars({ title, rows, valueKey = "sales", sub, format = rs, empty = "No data in this range." }) {
  const max = Math.max(0, ...rows.map((r) => Number(r[valueKey]) || 0));
  return (
    <div className="rp-chart">
      <div className="rp-chart__head"><h3>{title}</h3></div>
      {rows.length === 0 ? <p className="rp-empty">{empty}</p> : (
        <ul className="rp-hbars">
          {rows.map((r) => (
            <li key={r.label} title={`${r.label}: ${format(r[valueKey])}`}>
              <div className="rp-hbars__top">
                <span className="rp-hbars__label">{r.label}</span>
                <b>{format(r[valueKey])}</b>
              </div>
              <div className="rp-hbars__track"><div className="rp-hbars__fill" style={{ width: `${max ? (Number(r[valueKey]) / max) * 100 : 0}%` }} /></div>
              {sub && <small>{sub(r)}</small>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ================= page ================= */

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

const STATUS = { new: "New", contacted: "Contacted", booked: "Booked", closed: "Closed" };

export default function Reports({ onAuthFail }) {
  const [preset, setPreset] = useState("this_year");
  const [custom, setCustom] = useState(() => { const [a, b] = presetRange("this_month"); return { from: iso(a), to: iso(b) }; });
  const [basis, setBasis] = useState("created");
  const [group, setGroup] = useState("month");
  const [status, setStatus] = useState("");
  const [city, setCity] = useState("");
  const [type, setType] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [from, to] = useMemo(() => {
    if (preset === "custom") return [custom.from, custom.to];
    const [a, b] = presetRange(preset);
    return [a ? iso(a) : "", b ? iso(b) : ""];
  }, [preset, custom]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams({ from, to, basis, group, status, city, type });
      setData(await adminFetch(`/reports?${qs}`));
    } catch (err) {
      if (err instanceof AuthError) onAuthFail();
      else setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [from, to, basis, group, status, city, type, onAuthFail]);

  useEffect(() => { load(); }, [load]);

  const series = useMemo(
    () => (data ? fillPeriods(data.series, group, from, to).map((s) => ({ ...s, label: periodLabel(s.period, group) })) : []),
    [data, group, from, to]);

  const s = data?.summary;
  const conversion = s && s.orders ? Math.round((s.sales_count / s.orders) * 100) : 0;
  const avg = s && s.sales_count ? s.sales / s.sales_count : 0;
  const balance = s ? s.sales - s.advance : 0;
  const rangeText = from && to ? `${parse(from).getDate()} ${MONTHS[parse(from).getMonth()]} ${parse(from).getFullYear()} – ${parse(to).getDate()} ${MONTHS[parse(to).getMonth()]} ${parse(to).getFullYear()}` : "All time";

  const exportCSV = () => downloadCSV(`signature-report-${from || "all"}-${to || "all"}.csv`, [
    ["ID", (r) => r.id], ["Received", (r) => r.created_at], ["Event date", (r) => r.event_date], ["Customer", (r) => r.name],
    ["WhatsApp", (r) => r.phone], ["City", (r) => r.city], ["Events", (r) => (r.event_types || "").split(",").map(typeLabel).join(", ")],
    ["Guests", (r) => r.guests], ["Venue", (r) => r.venue], ["Status", (r) => STATUS[r.status]],
    ["Amount (Rs)", (r) => Number(r.amount)], ["Advance (Rs)", (r) => Number(r.advance_paid)],
    ["Balance (Rs)", (r) => Number(r.amount) - Number(r.advance_paid)],
  ], data?.orders || []);

  const split = s ? [
    ["Menu", s.menu_sales], ["Services", s.service_sales], ["Hall rent", s.hall_sales],
  ] : [];
  const splitTotal = split.reduce((a, [, v]) => a + v, 0);

  return (
    <div className="rp">
      {/* ---------- filters ---------- */}
      <section className="rp-filters">
        <div className="rp-presets">
          {PRESETS.map(([k, l]) => (
            <button key={k} className={preset === k ? "is-active" : ""} onClick={() => setPreset(k)}>{l}</button>
          ))}
        </div>
        <div className="rp-filter-row">
          {preset === "custom" && (
            <>
              <label>From<input type="date" value={custom.from} onChange={(e) => setCustom({ ...custom, from: e.target.value })} /></label>
              <label>To<input type="date" value={custom.to} onChange={(e) => setCustom({ ...custom, to: e.target.value })} /></label>
            </>
          )}
          <label>Date based on
            <select value={basis} onChange={(e) => setBasis(e.target.value)}>
              <option value="created">Order received date</option>
              <option value="event">Event date</option>
            </select>
          </label>
          <label>Group by
            <select value={group} onChange={(e) => setGroup(e.target.value)}>
              <option value="month">Month</option>
              <option value="week">Week</option>
              <option value="day">Day</option>
            </select>
          </label>
          <label>Status
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All</option>
              {Object.entries(STATUS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </label>
          <label>City
            <select value={city} onChange={(e) => setCity(e.target.value)}>
              <option value="">All cities</option>
              {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label>Event type
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">All events</option>
              {TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </label>
          <div className="rp-filter-actions">
            <button className="ad-btn" onClick={load}>↻ Refresh</button>
            <button className="ad-btn" onClick={() => window.print()}>🖨 Print</button>
            <button className="ad-btn ad-btn--gold" onClick={exportCSV} disabled={!data?.orders?.length}>⬇ Excel (CSV)</button>
          </div>
        </div>
        <p className="rp-range">Showing <b>{rangeText}</b> · by {basis === "event" ? "event date" : "order received date"}{loading ? " · loading..." : ""}</p>
        {error && <p className="ad-error">{error}</p>}
      </section>

      {s && (
        <>
          {/* ---------- KPIs ---------- */}
          <section className="rp-kpis">
            <div className="rp-kpi rp-kpi--hero"><span>Total sales</span><strong>{rs(s.sales)}</strong><small>{s.sales_count} booked orders</small></div>
            <div className="rp-kpi"><span>Orders received</span><strong>{s.orders}</strong><small>{s.new_count} new · {s.contacted} contacted</small></div>
            <div className="rp-kpi"><span>Booked</span><strong>{s.sales_count}</strong><small>{conversion}% conversion</small></div>
            <div className="rp-kpi"><span>Avg. order value</span><strong>{rs(avg)}</strong><small>per booked order</small></div>
            <div className="rp-kpi"><span>Advance collected</span><strong>{rs(s.advance)}</strong><small>from booked orders</small></div>
            <div className="rp-kpi"><span>Balance pending</span><strong className={balance > 0 ? "rp-due" : ""}>{rs(balance)}</strong><small>still to collect</small></div>
            <div className="rp-kpi"><span>Guests served</span><strong>{s.guests.toLocaleString("en-PK")}</strong><small>in booked orders</small></div>
          </section>

          {/* ---------- time charts ---------- */}
          <section className="rp-grid2">
            <BarChart title={`Sales by ${group}`} data={series} valueKey="sales" format={rs} axisFormat={short}
              empty="No booked sales in this range." />
            <BarChart title={`Orders by ${group}`} data={series} valueKey="orders" format={(v) => `${v} orders`} axisFormat={(v) => String(v)}
              empty="No orders in this range." />
          </section>

          {/* ---------- sales split ---------- */}
          <section className="rp-chart rp-split">
            <div className="rp-chart__head"><h3>Where the sales come from</h3><span>Total: <b>{rs(splitTotal)}</b></span></div>
            <div className="rp-split__rows">
              {split.map(([label, v]) => (
                <div key={label} className="rp-split__row">
                  <span>{label}</span>
                  <div className="rp-hbars__track"><div className="rp-hbars__fill" style={{ width: `${splitTotal ? (v / splitTotal) * 100 : 0}%` }} /></div>
                  <b>{rs(v)}</b>
                  <small>{splitTotal ? Math.round((v / splitTotal) * 100) : 0}%</small>
                </div>
              ))}
            </div>
          </section>

          {/* ---------- breakdowns ---------- */}
          <section className="rp-grid3">
            <HBars title="Top dishes (by sales)" rows={data.topDishes} sub={(r) => `${r.orders} orders · ${Number(r.qty).toLocaleString("en-PK")} servings`} />
            <HBars title="Top services (by sales)" rows={data.topServices} sub={(r) => `${r.orders} orders`} />
            <HBars title="Most booked halls" rows={data.topVenues} valueKey="orders" format={(v) => `${v} bookings`}
              sub={(r) => `Rent ${rs(r.sales)}`} />
            <HBars title="Orders by event type" rows={data.byType.map((r) => ({ ...r, label: typeLabel(r.label) }))} valueKey="orders"
              format={(v) => `${v} orders`} sub={(r) => `Sales ${rs(r.sales)}`} />
            <HBars title="Orders by city" rows={data.byCity} valueKey="orders" format={(v) => `${v} orders`} sub={(r) => `Sales ${rs(r.sales)}`} />
          </section>

          {/* ---------- table view ---------- */}
          <section className="rp-chart">
            <div className="rp-chart__head"><h3>Orders in this report</h3><span>{data.orders.length} orders</span></div>
            <div className="ad-table-wrap">
              <table className="ad-table rp-table">
                <thead><tr><th>#</th><th>Received</th><th>Event date</th><th>Customer</th><th>City</th><th>Event(s)</th><th>Status</th><th className="rp-num">Amount</th><th className="rp-num">Advance</th><th className="rp-num">Balance</th></tr></thead>
                <tbody>
                  {data.orders.map((r) => (
                    <tr key={r.id}>
                      <td className="ad-id">{r.id}</td>
                      <td className="ad-nowrap">{String(r.created_at).slice(0, 10)}</td>
                      <td className="ad-nowrap">{r.event_date}</td>
                      <td><strong>{r.name}</strong><small className="ad-sub">{r.phone}</small></td>
                      <td>{r.city}</td>
                      <td>{(r.event_types || "").split(",").filter(Boolean).map(typeLabel).join(", ")}</td>
                      <td><span className={`ad-status ad-status--${r.status}`}>{STATUS[r.status]}</span></td>
                      <td className="rp-num">{Number(r.amount) ? rs(r.amount) : "-"}</td>
                      <td className="rp-num">{Number(r.advance_paid) ? rs(r.advance_paid) : "-"}</td>
                      <td className="rp-num">{Number(r.amount) ? rs(Number(r.amount) - Number(r.advance_paid)) : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.orders.length === 0 && <p className="ad-empty">No orders in this range.</p>}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
