import { useEffect, useState } from "react";
import { BUDGETS, CITIES, COMPANY, TYPE_OPTIONS } from "../data";
import MultiSelect from "./MultiSelect";

const HIGHLIGHTS = [
  ["Barat · Valima", "Mehndi · Nikah"],
  ["In-house", "Catering"],
  ["Custom", "Packages"],
  ["Across", "Pakistan"],
];

export default function Hero({ filters, onSearch, planOpen, onPlanOpen, onPlanClose }) {
  const [form, setForm] = useState(filters);
  const [callback, setCallback] = useState(false);

  // جب category یا chip سے filter بدلے تو فارم بھی اپ ڈیٹ ہو
  useEffect(() => setForm(filters), [filters]);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const today = new Date().toISOString().split("T")[0];

  const submit = (e) => {
    e.preventDefault();
    onPlanClose();
    onSearch(form, callback);
  };

  // popup: Esc se band
  useEffect(() => {
    if (!planOpen) return;
    const onKey = (e) => e.key === "Escape" && onPlanClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [planOpen, onPlanClose]);

  return (
    <section className="hero" id="home">
      <div className="hero__bg"></div>
      <div className="container hero__content">
        <div className="hero__text">
          <span className="eyebrow">{COMPANY.subtitle} · Pakistan</span>
          <h1>
            Every Occasion,<br /><em>Our Signature Touch</em>
          </h1>
          <p className="hero__sub">
            From Mehndi to Valima, birthdays to corporate dinners — Signature plans, decorates and caters your event so you can enjoy every moment.
          </p>

          <div className="hero__stats">
            {HIGHLIGHTS.map(([top, bottom]) => (
              <div key={top + bottom}><strong>{top}</strong><span>{bottom}</span></div>
            ))}
          </div>

          <div className="hero__btns">
            <button type="button" className="btn btn--gold" onClick={onPlanOpen}>✦ Plan Your Event</button>
            <a className="btn btn--outline-light" href="#packages">View Packages</a>
          </div>
        </div>
      </div>

      {/* "Plan Your Event" — ab popup mein, button dabane par khulta hai */}
      <div className={`plan-pop ${planOpen ? "is-open" : ""}`} onClick={(e) => e.target === e.currentTarget && onPlanClose()}>
        <form className="search" onSubmit={submit}>
          <button type="button" className="plan-pop__x" onClick={onPlanClose} aria-label="Close">×</button>
          <h3 className="search__title">Plan Your Event</h3>
          <div className="search__field">
            <label htmlFor="sLocation">City</label>
            <select id="sLocation" value={form.city} onChange={set("city")}>
              <option value="">Select city</option>
              {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="search__row">
            <div className="search__field">
              <label htmlFor="sDate">Event Date</label>
              <input type="date" id="sDate" min={today} value={form.date} onChange={set("date")} />
            </div>
            <div className="search__field">
              <label htmlFor="sStart">Event Time</label>
              <input type="time" id="sStart" value={form.startTime} onChange={set("startTime")} />
            </div>
          </div>
          <div className="search__field">
            <label htmlFor="sType">Event Type</label>
            <MultiSelect
              id="sType"
              options={TYPE_OPTIONS}
              value={form.types}
              onChange={(types) => setForm({ ...form, types })}
              placeholder="All events"
            />
          </div>
          <div className="search__field">
            <label htmlFor="sBudget">Budget</label>
            <select id="sBudget" value={form.budget} onChange={set("budget")}>
              <option value="">Any budget</option>
              {BUDGETS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
          </div>
          <label className="search__multi">
            <input type="checkbox" checked={callback} onChange={(e) => setCallback(e.target.checked)} />
            <span>Request a free call back</span>
          </label>
          <button type="submit" className="btn btn--gold search__btn">
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path fill="currentColor" d="M10 2a8 8 0 0 1 6.32 12.9l5.39 5.4-1.41 1.4-5.4-5.39A8 8 0 1 1 10 2zm0 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12z" />
            </svg>
            View Packages
          </button>
        </form>
      </div>
    </section>
  );
}
