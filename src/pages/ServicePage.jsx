import { useEffect, useRef, useState } from "react";
import { COMPANY, IMG, SERVICES } from "../data";
import Logo from "../components/Logo";
import { QuoteModal } from "../components/Modals";
import Toast from "../components/Toast";
import BackToAdmin from "../components/BackToAdmin";
import "./service-page.css";

// pichhle page par wapas (usi jagah) — agar seedha link se aaye hon to services section par
function goBack() {
  const sameSite = document.referrer && new URL(document.referrer).origin === window.location.origin;
  if (sameSite && window.history.length > 1) window.history.back();
  else window.location.href = "/#our-services";
}

const NO_FILTERS ={ city: "", date: "", startTime: "", endTime: "", types: [], budget: "" };

function Lightbox({ images, index, onClose, onGo, alt }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onGo(index + 1);
      if (e.key === "ArrowLeft") onGo(index - 1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [index, onClose, onGo]);

  return (
    <div className="sp-lightbox" onClick={onClose}>
      <button className="sp-lightbox__x" aria-label="Close">×</button>
      <button className="sp-lightbox__nav sp-lightbox__nav--prev" aria-label="Previous" onClick={(e) => { e.stopPropagation(); onGo(index - 1); }}>‹</button>
      <img src={IMG(images[index], 1600)} alt={`${alt} — photo ${index + 1}`} onClick={(e) => e.stopPropagation()} />
      <button className="sp-lightbox__nav sp-lightbox__nav--next" aria-label="Next" onClick={(e) => { e.stopPropagation(); onGo(index + 1); }}>›</button>
      <span className="sp-lightbox__count">{index + 1} / {images.length}</span>
    </div>
  );
}

export default function ServicePage({ slug }) {
  const service = SERVICES.find((s) => s.slug === slug);
  const [quoteFor, setQuoteFor] = useState(null);
  const [open, setOpen] = useState(null);
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  useEffect(() => {
    document.title = service ? `${service.name} | ${COMPANY.name}` : `${COMPANY.name}`;
    window.scrollTo(0, 0);
  }, [service]);

  const showToast = (message) => {
    clearTimeout(timer.current);
    setToast({ message });
    timer.current = setTimeout(() => setToast(null), 4000);
  };

  if (!service) {
    return (
      <div className="sp-missing">
        <Logo href="/" />
        <h1>Service not found</h1>
        <a className="btn btn--gold" href="/#our-services">← See all services</a>
      </div>
    );
  }

  const others = SERVICES.filter((s) => s.slug !== slug);
  const go = (i) => setOpen((i + service.gallery.length) % service.gallery.length);

  return (
    <div className="sp">
      <header className="sp-top">
        <div className="container sp-top__inner">
          <Logo href="/" />
          <nav className="sp-top__nav">
            <button className="sp-back" onClick={goBack} title="Go back to the previous page">← Back</button>
            <a href="/#our-services">All services</a>
            <button className="btn btn--gold btn--sm" onClick={() => setQuoteFor(service.name)}>Get a Quote</button>
          </nav>
        </div>
      </header>

      <section className="sp-hero" style={{ backgroundImage: `url(${IMG(service.img, 1800)})` }}>
        <div className="container sp-hero__content">
          <a className="sp-crumb" href="/#our-services">Services</a>
          <h1>{service.name}</h1>
          <p>{service.intro}</p>
          <div className="sp-hero__btns">
            <button className="btn btn--gold" onClick={() => setQuoteFor(service.name)}>Get a free quote</button>
            <a className="btn btn--outline-light" target="_blank" rel="noopener noreferrer"
              href={`https://wa.me/${COMPANY.whatsapp}?text=${encodeURIComponent(`Assalam o Alaikum! I'm interested in your ${service.name} service.`)}`}>
              WhatsApp us
            </a>
          </div>
        </div>
      </section>

      <section className="section section--tight">
        <div className="container">
          <div className="section__head">
            <span className="eyebrow eyebrow--dark">What's included</span>
            <h2>{service.name} by {COMPANY.name}</h2>
          </div>
          <ul className="sp-includes">
            {service.includes.map((x) => <li key={x}><span>✓</span>{x}</li>)}
          </ul>
        </div>
      </section>

      {service.addons?.map((a) => (
        <section className="sp-addon" key={a.title}>
          <div className="container sp-addon__inner">
            <img src={IMG(a.img, 900)} alt={a.title} loading="lazy" />
            <div>
              <span className="eyebrow">Add-on</span>
              <h2>{a.icon} {a.title}</h2>
              <p>{a.text}</p>
              <ul>{a.points.map((x) => <li key={x}>✓ {x}</li>)}</ul>
              <button className="btn btn--gold" onClick={() => setQuoteFor(`${service.name} + ${a.title}`)}>
                Add {a.title.toLowerCase()} to my quote
              </button>
            </div>
          </div>
        </section>
      ))}

      <section className="section section--soft">
        <div className="container">
          <div className="section__head section__head--row">
            <div>
              <span className="eyebrow eyebrow--dark">Gallery</span>
              <h2>Photos</h2>
            </div>
            <span className="muted">Click any photo to view it large</span>
          </div>
          <div className="sp-gallery">
            {service.gallery.map((id, i) => (
              <button key={id + i} className="sp-gallery__item" onClick={() => setOpen(i)} aria-label={`Open photo ${i + 1}`}>
                <img src={IMG(id, 800)} alt={`${service.name} — photo ${i + 1}`} loading="lazy" />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="container cta__inner sp-cta">
          <div>
            <span className="eyebrow">Book {service.name}</span>
            <h2>Let's plan it together</h2>
            <p>Tell us your date, city and guest count — we'll send you a custom quote.</p>
          </div>
          <div className="cta__btns">
            <button className="btn btn--gold" onClick={() => setQuoteFor(service.name)}>Get a Quote</button>
            <a className="btn btn--outline-light" href={`tel:${COMPANY.phoneIntl}`}>Call {COMPANY.phone}</a>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section__head">
            <span className="eyebrow eyebrow--dark">More services</span>
            <h2>Explore other services</h2>
          </div>
          <div className="services">
            {others.map((s) => (
              <a key={s.slug} className="service" href={`/services/${s.slug}`}>
                <div className="service__img"><img src={IMG(s.img, 600)} alt={s.name} loading="lazy" /></div>
                <div className="service__body">
                  <h3>{s.name}</h3>
                  <span className="service__tag">View photos →</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <footer className="sp-foot">
        <div className="container sp-foot__inner">
          <Logo href="/" />
          <span>☎ {COMPANY.phone} · ✉ {COMPANY.email}</span>
          <span>© {new Date().getFullYear()} {COMPANY.legalName}</span>
        </div>
      </footer>

      {open !== null && (
        <Lightbox images={service.gallery} index={open} alt={service.name} onClose={() => setOpen(null)} onGo={go} />
      )}

      <QuoteModal
        open={!!quoteFor}
        forWhom={quoteFor}
        filters={NO_FILTERS}
        onClose={() => setQuoteFor(null)}
        onSubmit={(_, id) => showToast(`Thank you! Your enquiry #${id} is received. We'll contact you shortly.`)}
        onError={() => showToast(`Sorry, could not send right now. Please call or WhatsApp us on ${COMPANY.phone}.`)}
      />
      <Toast message={toast?.message} />
      <BackToAdmin />
    </div>
  );
}
