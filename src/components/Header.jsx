import { useEffect, useRef, useState } from "react";
import Logo from "./Logo";

const INVITE_LINKS = [
  ["Wedding Invitations", "#invitations"],
  ["Mehndi Invitations", "#invitations"],
  ["Birthday Invitations", "#invitations"],
  ["Corporate Invitations", "#invitations"],
  ["WhatsApp Invitations", "#invitations"],
  ["Digital vs Printed", "#digital-vs-printed"],
];

export default function Header({ onQuote, onJoin }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // mobile menu کے styles body.nav-open کلاس پر چلتے ہیں
  useEffect(() => {
    document.body.classList.toggle("nav-open", menuOpen);
  }, [menuOpen]);

  // Invitations menu: bahar click, Esc ya scroll par band
  const dropRef = useRef(null);
  useEffect(() => {
    if (!dropOpen) return;
    const onDown = (e) => { if (!dropRef.current?.contains(e.target)) setDropOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setDropOpen(false); };
    const onScroll = () => setDropOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown, { passive: true });
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
    };
  }, [dropOpen]);

  const close = () => {
    setMenuOpen(false);
    setDropOpen(false);
  };

  return (
    <header className={`header ${scrolled ? "is-scrolled" : ""}`}>
      <div className="container header__inner">
        <Logo />

        <nav className="nav">
          <a href="#home" className="nav__link" onClick={close}>Home</a>
          <a href="#about" className="nav__link" onClick={close}>About</a>
          <a href="#packages" className="nav__link" onClick={close}>Packages</a>
          <a href="#our-services" className="nav__link" onClick={close}>Services</a>
          <a href="#reviews" className="nav__link" onClick={close}>Reviews</a>
          <div className={`nav__dropdown ${dropOpen ? "is-open" : ""}`} ref={dropRef}>
            <button className="nav__link nav__dropbtn" type="button" onClick={() => setDropOpen(!dropOpen)}>
              Invitations <span className="caret">▾</span>
            </button>
            <div className="nav__menu">
              {INVITE_LINKS.map(([label, href]) => (
                <a key={label} href={href} onClick={close}>{label}</a>
              ))}
            </div>
          </div>
          <a href="#faq" className="nav__link" onClick={close}>FAQ</a>
          <button className="nav__link nav__vendor" type="button" onClick={() => { close(); onJoin(); }}>
            Join as Vendor
          </button>
          <button className="btn btn--gold nav__cta" onClick={() => { close(); onQuote(); }}>
            Get a Quote
          </button>
        </nav>

        <button className="burger" aria-label="Open menu" onClick={() => setMenuOpen(!menuOpen)}>
          <span></span><span></span><span></span>
        </button>
      </div>
    </header>
  );
}
