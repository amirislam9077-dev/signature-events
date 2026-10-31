import { useState } from "react";
import { BUDGETS, IMG, PACKAGES, formatPKR, timingText, typeLabel } from "../data";

const SORTERS = {
  popular: (a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0),
  priceLow: (a, b) => a.price - b.price,
  priceHigh: (a, b) => b.price - a.price,
};

export function filterPackages({ types, budget }, sort = "popular") {
  return PACKAGES.filter((p) => {
    if (types.length && !types.includes(p.type)) return false;
    if (budget) {
      const [min, max] = budget.split("-").map(Number);
      if (p.price < min || p.price > max) return false;
    }
    return true;
  }).sort(SORTERS[sort]);
}

function chipLabels(filters) {
  const chips = [];
  if (filters.city) chips.push(["city", filters.city]);
  filters.types.forEach((t) => chips.push([`type:${t}`, typeLabel(t)]));
  if (filters.budget) chips.push(["budget", BUDGETS.find((b) => b.value === filters.budget)?.label]);
  if (filters.date) {
    chips.push(["date", new Date(filters.date).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })]);
  }
  const timing = timingText(filters.startTime, filters.endTime);
  if (timing) chips.push(["time", timing]);
  return chips;
}

function PackageCard({ p, onQuote }) {
  return (
    <article className="planner">
      <div className="planner__img">
        <img src={IMG(p.img, 700)} alt={p.name} loading="lazy" />
        {p.popular && <span className="badge">★ Most Popular</span>}
      </div>
      <div className="planner__body">
        <span className="planner__type">{typeLabel(p.type)}</span>
        <h3 className="planner__name">{p.name}</h3>
        <div className="planner__meta"><span>👥 {p.guests}</span></div>
        <div className="planner__tags">
          {p.tags.map((t) => <span key={t}>{t}</span>)}
        </div>
        <div className="planner__foot">
          <div className="price"><small>Starting from</small><strong>{formatPKR(p.price)}</strong></div>
          <button className="btn btn--primary btn--sm" onClick={() => onQuote(p.name)}>Get Quote</button>
        </div>
      </div>
    </article>
  );
}

export default function Packages({ filters, onClear, onQuote }) {
  const [sort, setSort] = useState("popular");
  const list = filterPackages(filters, sort);
  const chips = chipLabels(filters);

  return (
    <section className="section section--soft" id="packages">
      <div className="container">
        <div className="section__head section__head--row">
          <div>
            <span className="eyebrow eyebrow--dark">Our Packages</span>
            <h2>Signature Event Packages</h2>
            <p className="muted">
              {filters.city ? `Available in ${filters.city}. ` : ""}Every package can be customised to your guests, menu and budget.
            </p>
          </div>
          <div className="sort">
            <label htmlFor="sortBy">Sort by</label>
            <select id="sortBy" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="popular">Most popular</option>
              <option value="priceLow">Price: low to high</option>
              <option value="priceHigh">Price: high to low</option>
            </select>
          </div>
        </div>

        <div className="chips">
          {chips.map(([key, label]) => (
            <span className="chip" key={key}>
              {label}
              <button aria-label="Remove" onClick={() => onClear(key)}>×</button>
            </span>
          ))}
          {chips.length > 0 && <button className="chip chip--clear" onClick={() => onClear("all")}>Clear all</button>}
        </div>

        <div className="planners">
          {list.map((p) => <PackageCard key={p.name} p={p} onQuote={onQuote} />)}
        </div>
        {list.length === 0 && (
          <p className="empty">
            No ready package in this budget — <button className="link-btn" onClick={() => onQuote("a custom package")}>ask us for a custom package</button>.
          </p>
        )}
      </div>
    </section>
  );
}
