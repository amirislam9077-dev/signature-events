import { COMPANY } from "../data";

export default function VendorCta({ onQuote, onJoin }) {
  return (
    <section className="cta" id="contact">
      <div className="container cta__inner">
        <div className="cta__text">
          <span className="eyebrow">Book your date</span>
          <h2>Let's make your event unforgettable</h2>
          <p>Call or WhatsApp us today for a free consultation and a custom quote.</p>
          <div className="cta__contact">
            <a href={`tel:${COMPANY.phoneIntl}`}>☎ {COMPANY.phone}</a>
            <a href={`mailto:${COMPANY.email}`}>✉ {COMPANY.email}</a>
          </div>
          <div className="cta__btns">
            <button className="btn btn--gold" onClick={onQuote}>Get a Quote</button>
            <a className="btn btn--outline-light" href={`https://wa.me/${COMPANY.whatsapp}`} target="_blank" rel="noopener noreferrer">
              Chat on WhatsApp
            </a>
          </div>
          <p className="cta__vendor">
            Decorator, photographer or caterer? <button className="link-btn" onClick={onJoin}>Join as Vendor</button>
          </p>
        </div>
        <img className="cta__card" src="/signature-card.jpg" alt={`${COMPANY.legalName} business card`} loading="lazy" />
      </div>
    </section>
  );
}
