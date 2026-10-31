import { COMPANY } from "../data";

const POINTS = [
  ["Complete planning", "From Mehndi to Valima — one team handles it all."],
  ["In-house catering", "Fresh Desi, BBQ & Continental menus, served with care."],
  ["Décor & stage", "Floral stages, lighting and themes made for your story."],
  ["On-time, stress-free", "We coordinate every detail so your family can celebrate."],
];

export default function About({ onQuote }) {
  return (
    <section className="section about" id="about">
      <div className="container about__inner">
        <div className="about__media">
          <img src="/couple-fireworks.jpg" alt="Bride and groom watching fireworks on their wedding night" loading="lazy" />
          <div className="about__badge">
            <strong>✦</strong>
            <span>{COMPANY.tagline}</span>
          </div>
        </div>

        <div className="about__text">
          <span className="eyebrow eyebrow--dark">About {COMPANY.name}</span>
          <h2>Moments that sparkle forever</h2>
          <p className="about__lead">
            Your wedding night should feel like this — the fireworks, the lights, and the two of you at the centre of it all.
            At {COMPANY.name}, we take care of everything behind the scenes so you can live every moment.
          </p>
          <ul className="about__points">
            {POINTS.map(([title, text]) => (
              <li key={title}>
                <span className="about__tick">✓</span>
                <div><strong>{title}</strong><p>{text}</p></div>
              </li>
            ))}
          </ul>
          <div className="about__btns">
            <button className="btn btn--primary" onClick={onQuote}>Plan my event</button>
            <a className="btn btn--ghost-dark" href={`https://wa.me/${COMPANY.whatsapp}`} target="_blank" rel="noopener noreferrer">
              WhatsApp {COMPANY.phone}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
