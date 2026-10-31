import { IMG } from "../data";

const INVITES = [
  ["Wedding Invitations", "1747847471517-952a3eb93a89", "Pakistani bride in bridal dress"],
  ["Mehndi Invitations", "1505932794465-147d1f1b2c97", "Hands decorated with mehndi"],
  ["Birthday Invitations", "1530103862676-de8c9debad1d", "Colourful birthday balloons"],
  ["Corporate Invitations", "1540575467063-178a50c2df87", "Corporate event audience"],
];

const COMPARE = [
  ["Cost", "Low", "High", "digital"],
  ["Delivery time", "Instant on WhatsApp", "Days", "digital"],
  ["RSVP tracking", "Built-in", "Manual", "digital"],
  ["Eco-friendly", "Yes", "No", "digital"],
  ["Keepsake value", "Good", "Excellent", "printed"],
];

export default function Invitations() {
  return (
    <section className="section" id="invitations">
      <div className="container">
        <div className="section__head section__head--center">
          <span className="eyebrow eyebrow--dark">Invitations</span>
          <h2>Beautiful invites for every occasion</h2>
          <p className="muted">Digital cards for WhatsApp and elegant printed cards — designed to match your event.</p>
        </div>
        <div className="invites">
          {INVITES.map(([label, img, alt]) => (
            <a className="invite" href="#contact" key={label}>
              <img src={IMG(img, 700)} alt={alt} loading="lazy" />
              <span>{label}</span>
            </a>
          ))}
        </div>

        <div className="compare" id="digital-vs-printed">
          <h3>Digital vs Printed Invitations</h3>
          <div className="compare__table">
            <div className="compare__row compare__row--head"><span></span><span>Digital</span><span>Printed</span></div>
            {COMPARE.map(([label, digital, printed, winner]) => (
              <div className="compare__row" key={label}>
                <span>{label}</span>
                <span className={winner === "digital" ? "good" : ""}>{digital}</span>
                <span className={winner === "printed" ? "good" : ""}>{printed}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
