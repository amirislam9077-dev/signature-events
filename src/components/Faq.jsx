import { useState } from "react";
import { FAQS } from "../data";

export default function Faq() {
  const [open, setOpen] = useState(null);

  return (
    <section className="section" id="faq">
      <div className="container container--narrow">
        <div className="section__head section__head--center">
          <span className="eyebrow eyebrow--dark">FAQ</span>
          <h2>Frequently asked questions</h2>
        </div>
        <div className="faq">
          {FAQS.map((f, i) => (
            <div className={`faq__item ${open === i ? "is-open" : ""}`} key={f.q}>
              <button className="faq__q" type="button" onClick={() => setOpen(open === i ? null : i)}>
                {f.q}
              </button>
              <div className="faq__a" style={{ maxHeight: open === i ? 300 : 0 }}>
                <p>{f.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
