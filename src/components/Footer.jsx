import { COMPANY } from "../data";
import Logo from "./Logo";

const ICONS = {
  facebook: "M14 9h3V5h-3c-2.8 0-4 1.7-4 4.3V11H7v4h3v9h4v-9h3l1-4h-4V9.5c0-.4.3-.5.6-.5z",
  instagram: "M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm5.2-9.4a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4zM12 2c-2.7 0-3 0-4.1.1C4.3 2.3 2.3 4.3 2.1 7.9 2 9 2 9.3 2 12s0 3 .1 4.1c.2 3.6 2.2 5.6 5.8 5.8 1.1.1 1.4.1 4.1.1s3 0 4.1-.1c3.6-.2 5.6-2.2 5.8-5.8.1-1.1.1-1.4.1-4.1s0-3-.1-4.1c-.2-3.6-2.2-5.6-5.8-5.8C15 2 14.7 2 12 2z",
  youtube: "M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.8 15V9l5.8 3-5.8 3z",
  tiktok: "M16.6 2h-3.4v13.4a2.9 2.9 0 1 1-2.9-2.9c.3 0 .6 0 .9.1V9.1a6.3 6.3 0 1 0 5.4 6.3V8.6a8 8 0 0 0 4.4 1.3V6.5a4.4 4.4 0 0 1-4.4-4.5z",
};

const COLUMNS = [
  {
    title: "Events",
    links: ["Barat", "Valima", "Mehndi & Dholki", "Nikah", "Birthday", "Corporate Events"],
    href: "#packages",
  },
  {
    title: "Services",
    links: ["Catering", "Stage & Floral Décor", "Lighting & Sound", "Wedding Invitations", "Full Event Management"],
    href: "#our-services",
  },
  {
    title: "Company",
    links: ["About Us", "Privacy Policy", "Terms & Conditions", "Cancellation and Refund"],
    href: "#",
  },
];

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div className="footer__brand">
          <Logo size="lg" />
          <p className="footer__tagline">{COMPANY.tagline}</p>
          <div className="socials">
            {Object.entries(COMPANY.social).map(([key, url]) => (
              <a key={key} className="social" href={url} target="_blank" rel="noopener noreferrer" aria-label={key}>
                <svg viewBox="0 0 24 24"><path d={ICONS[key]} /></svg>
              </a>
            ))}
          </div>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h4>{col.title}</h4>
            {col.links.map((l) => <a key={l} href={col.href}>{l}</a>)}
          </div>
        ))}

        <div>
          <h4>Contact Us</h4>
          <a href={`tel:${COMPANY.phoneIntl}`}>☎ {COMPANY.phone}</a>
          <a href={`https://wa.me/${COMPANY.whatsapp}`} target="_blank" rel="noopener noreferrer">💬 WhatsApp</a>
          <a href={`mailto:${COMPANY.email}`}>✉ {COMPANY.email}</a>
          <p className="footer__addr">📍 {COMPANY.address}</p>
        </div>
      </div>

      <div className="container footer__bottom">
        <span>© {new Date().getFullYear()} {COMPANY.legalName}. All rights reserved.</span>
        <span>Photos: Unsplash</span>
      </div>
    </footer>
  );
}
