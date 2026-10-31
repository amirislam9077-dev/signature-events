import { useEffect, useState } from "react";
import { adminFetch } from "./adminApi";
import { UNIT_LABEL, clearCatalogCache, rs } from "./Booking";

const EMPTY = { kind: "dish", category: "", name: "", unit: "per_head", price: "" };

export default function CatalogTab() {
  const [rows, setRows] = useState([]);
  const [kind, setKind] = useState("dish");
  const [q, setQ] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");

  useEffect(() => {
    adminFetch("/catalog").then((d) => setRows(d.rows)).catch((e) => setError(e.message));
  }, []);

  const replace = (row) => setRows((rs_) => rs_.map((r) => (r.id === row.id ? row : r)));

  const patch = async (id, body) => {
    setError("");
    try {
      const { row } = await adminFetch(`/catalog/${id}`, { method: "PATCH", body });
      replace(row);
      clearCatalogCache();
    } catch (e) {
      setError(e.message);
    }
  };

  const add = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const { row } = await adminFetch("/catalog", { method: "POST", body: { ...form, kind } });
      setRows((r) => [...r, row]);
      setForm({ ...EMPTY, kind, unit: form.unit, category: form.category });
      clearCatalogCache();
    } catch (err) {
      setError(err.message);
    }
  };

  const remove = async (row) => {
    if (!window.confirm(`"${row.name}" from the list? (Existing bookings will not be affected)`)) return;
    await adminFetch(`/catalog/${row.id}`, { method: "DELETE" });
    setRows((r) => r.filter((x) => x.id !== row.id));
    clearCatalogCache();
  };

  const list = rows
    .filter((r) => r.kind === kind)
    .filter((r) => !q || `${r.name} ${r.category}`.toLowerCase().includes(q.toLowerCase()));
  const categories = [...new Set(rows.filter((r) => r.kind === kind).map((r) => r.category))];

  return (
    <section className="ad-card">
      <div className="ad-toolbar">
        <div className="cat-switch">
          <button className={kind === "dish" ? "is-active" : ""} onClick={() => setKind("dish")}>🍽 Dishes</button>
          <button className={kind === "service" ? "is-active" : ""} onClick={() => setKind("service")}>✦ Services</button>
          <button className={kind === "venue" ? "is-active" : ""} onClick={() => { setKind("venue"); setForm({ ...EMPTY, kind: "venue", unit: "fixed" }); }}>🏛 Halls / Venues</button>
        </div>
        <input className="ad-search" type="search" placeholder="Search..." value={q} onChange={(e) => setQ(e.target.value)} />
        <span className="ad-muted">Set your rates here — they are filled in automatically when you add an item to a booking.</span>
      </div>

      <form className="cat-add" onSubmit={add}>
        <input list="cat-categories" placeholder={kind === "venue" ? "Area (e.g. DHA Phase 6)" : "Category (e.g. BBQ)"} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required />
        <datalist id="cat-categories">{categories.map((c) => <option key={c} value={c} />)}</datalist>
        <input placeholder={{ dish: "Dish name", service: "Service name", venue: "Hall / Marquee name" }[kind]} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
          {Object.entries(UNIT_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <input type="number" min="0" placeholder={kind === "venue" ? "Rent (Rs)" : "Rate (Rs)"} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <button className="ad-btn ad-btn--gold">＋ Add</button>
      </form>
      {error && <p className="ad-error">{error}</p>}

      <div className="ad-table-wrap">
        <table className="ad-table cat-table">
          <thead><tr><th>{kind === "venue" ? "Area" : "Category"}</th><th>Name</th><th>Unit</th><th>{kind === "venue" ? "Rent (Rs)" : "Rate (Rs)"}</th><th>Show in list</th><th></th></tr></thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id} className={r.active ? "" : "is-off"}>
                <td><input defaultValue={r.category} onBlur={(e) => e.target.value !== r.category && patch(r.id, { category: e.target.value })} /></td>
                <td><input defaultValue={r.name} onBlur={(e) => e.target.value !== r.name && patch(r.id, { name: e.target.value })} /></td>
                <td>
                  <select value={r.unit} onChange={(e) => patch(r.id, { unit: e.target.value })}>
                    {Object.entries(UNIT_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                  </select>
                </td>
                <td>
                  <input type="number" min="0" defaultValue={Number(r.price)} title={rs(r.price)}
                    onBlur={(e) => Number(e.target.value) !== Number(r.price) && patch(r.id, { price: e.target.value })} />
                </td>
                <td><input type="checkbox" checked={Boolean(r.active)} onChange={(e) => patch(r.id, { active: e.target.checked })} /></td>
                <td><button className="ad-icon ad-icon--del" title="Delete" onClick={() => remove(r)}>🗑</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <p className="ad-empty">Nothing found.</p>}
      </div>
      <p className="ad-hint">Edit any field and click outside it — changes are saved automatically.</p>
    </section>
  );
}
