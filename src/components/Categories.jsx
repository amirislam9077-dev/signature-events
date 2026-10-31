import { IMG, TYPES } from "../data";

export default function Categories({ active, onPick }) {
  return (
    <section className="section" id="categories">
      <div className="container">
        <div className="section__head">
          <span className="eyebrow eyebrow--dark">Browse by Event</span>
          <h2>What are you celebrating?</h2>
        </div>
        <div className="cats">
          {TYPES.map((t) => (
            <div
              key={t.id}
              className={`cat ${active.includes(t.id) ? "is-active" : ""}`}
              role="button"
              tabIndex={0}
              onClick={() => onPick(t.id)}
              onKeyDown={(e) => e.key === "Enter" && onPick(t.id)}
            >
              <img src={IMG(t.img, 500)} alt={t.label} loading="lazy" />
              <span>{t.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
