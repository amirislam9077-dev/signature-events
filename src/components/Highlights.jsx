import { useEffect, useRef } from "react";
import { COMPANY, INSTAGRAM_POSTS } from "../data";

const MOMENTS = [
  ["💍", "Nikah & Rukhsati", "Emotional moments, beautifully arranged."],
  ["🎶", "Mehndi & Dholki", "Music, dance and colour all night long."],
  ["🎆", "Barat entry", "Grand entrances with lights and fireworks."],
  ["🍽", "Valima dinner", "Elegant décor and our signature menu."],
];

// Instagram ka official embed script (sirf ek dafa load hota hai)
function useInstagramEmbed() {
  useEffect(() => {
    const process = () => window.instgrm?.Embeds?.process();
    if (window.instgrm) return process();
    if (document.getElementById("ig-embed")) return;
    const s = document.createElement("script");
    s.id = "ig-embed";
    s.async = true;
    s.src = "https://www.instagram.com/embed.js";
    s.onload = process;
    document.body.appendChild(s);
  }, []);
}

// Embed ko jitna chaura ho sake rakho, magar poora screen ki oonchai mein fit (zoom se chhota)
function useFitToScreen(ref) {
  useEffect(() => {
    const box = ref.current;
    if (!box) return;
    const HEADER = 80; // upar ki fixed patti (72px) + thodi jagah
    let current = 1;
    const fit = () => {
      const iframe = box.querySelector("iframe");
      if (!iframe) return;
      // Instagram iframe par apni asli oonchai style mein likhta hai — zoom se is par asar nahi,
      // is liye naapne ke liye zoom hatane ki zaroorat nahi (pehle isi se jhilmilahat hoti thi)
      const natural = (parseFloat(iframe.style.height) || Number(iframe.getAttribute("height")) || 0) + 16;
      if (natural < 200) return; // abhi load ho raha hai
      const room = window.innerHeight - HEADER - 24;
      const next = Math.round(Math.min(1, Math.max(0.6, room / natural)) * 100) / 100;
      if (Math.abs(next - current) < 0.02) return;
      current = next;
      box.style.zoom = String(next);
    };
    // sirf tab dobara naapo jab Instagram iframe ki oonchai (style) badle
    const mo = new MutationObserver(fit);
    mo.observe(box, { childList: true, subtree: true, attributes: true, attributeFilter: ["style", "height"] });
    window.addEventListener("resize", fit);
    fit();
    return () => { mo.disconnect(); window.removeEventListener("resize", fit); };
  }, [ref]);
}

function InstaFrame({ url }) {
  const ref = useRef(null);
  useFitToScreen(ref);
  return (
    <div className="highlights__frame" ref={ref}>
      <blockquote className="instagram-media" data-instgrm-permalink={url} data-instgrm-version="14">
        <a href={url} target="_blank" rel="noopener noreferrer">Watch this wedding moment on Instagram</a>
      </blockquote>
    </div>
  );
}

export default function Highlights() {
  useInstagramEmbed();
  const insta = COMPANY.social.instagram && COMPANY.social.instagram !== "#" ? COMPANY.social.instagram : null;

  return (
    <section className="section highlights" id="highlights">
      <div className="container highlights__inner">
        <div className="highlights__text">
          <span className="eyebrow eyebrow--dark">Wedding Inspiration</span>
          <h2>Every wedding has its own song</h2>
          <p className="highlights__lead">
            The dholki beats, the Barat entry, the first dance and the Rukhsati — music sets the mood of every shaadi.
            Tell us the songs you love and {COMPANY.name} will plan the stage, lighting, sound and moments around them.
          </p>
          <ul className="highlights__moments">
            {MOMENTS.map(([icon, title, text]) => (
              <li key={title}>
                <span>{icon}</span>
                <div><strong>{title}</strong><p>{text}</p></div>
              </li>
            ))}
          </ul>
          <div className="highlights__btns">
            <a className="btn btn--primary" href={`https://wa.me/${COMPANY.whatsapp}?text=${encodeURIComponent("Assalam o Alaikum! I saw your wedding highlights and want to plan my wedding with Signature.")}`}
              target="_blank" rel="noopener noreferrer">Plan my wedding</a>
            {insta && <a className="btn btn--ghost" href={insta} target="_blank" rel="noopener noreferrer">Follow on Instagram</a>}
          </div>
        </div>

        <div className="highlights__media">
          {INSTAGRAM_POSTS.map(({ url }) => (
            <div className="highlights__item" key={url}>
              <InstaFrame url={url} />
            </div>
          ))}
          <p className="highlights__credit">Video shared from Instagram for inspiration — all rights belong to the original creator.</p>
        </div>
      </div>
    </section>
  );
}
