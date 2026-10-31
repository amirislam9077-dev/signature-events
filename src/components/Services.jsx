import { IMG, SERVICES } from "../data";

export default function Services({ city, onQuote }) {
  return (
    <section className="section section--soft" id="our-services">
      <div className="container">
        <div className="section__head">
          <span className="eyebrow eyebrow--dark">Our Services</span>
          <h2>Everything for your event, under one roof</h2>
        </div>
        <div className="services">
          {SERVICES.map((s) => (
            // card par click → us service ka page (gallery ke saath)
            <a className="service" key={s.slug} href={`/services/${s.slug}`}>
              <div className="service__img">
                <img src={IMG(s.img, 600)} alt={s.name} loading="lazy" />
                <span className="service__count">📷 {s.gallery.length} photos</span>
              </div>
              <div className="service__body">
                <h3>{s.name}</h3>
                <span className="service__loc">
                  <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
                    <path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" />
                  </svg>
                  {city || "Across Pakistan"}
                </span>
                <div className="service__actions">
                  <span className="service__tag">View photos →</span>
                  <button type="button" className="service__quote"
                    onClick={(e) => { e.preventDefault(); onQuote(s.name); }}>Get Quote</button>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
