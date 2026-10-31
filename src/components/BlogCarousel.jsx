import { useEffect, useRef, useState } from "react";
import { IMG, SLIDES } from "../data";

export default function BlogCarousel() {
  const [index, setIndex] = useState(0);
  const [tick, setTick] = useState(0); // بٹن دبانے پر auto-play ٹائمر دوبارہ شروع ہو
  const startX = useRef(0);

  const go = (i) => {
    setIndex((i + SLIDES.length) % SLIDES.length);
    setTick((t) => t + 1);
  };

  useEffect(() => {
    const timer = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 5000);
    return () => clearInterval(timer);
  }, [tick]);

  const onTouchEnd = (e) => {
    const dx = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1));
  };

  return (
    <section className="section section--tight">
      <div className="container">
        <div className="section__head section__head--row">
          <div>
            <span className="eyebrow eyebrow--dark">Planning Guides</span>
            <h2>Ideas & inspiration for your big day</h2>
          </div>
          <div className="carousel__ctrls">
            <button className="round-btn" aria-label="Previous slide" onClick={() => go(index - 1)}>‹</button>
            <button className="round-btn" aria-label="Next slide" onClick={() => go(index + 1)}>›</button>
          </div>
        </div>

        <div className="carousel">
          <div
            className="carousel__track"
            style={{ transform: `translateX(-${index * 100}%)` }}
            onTouchStart={(e) => (startX.current = e.touches[0].clientX)}
            onTouchEnd={onTouchEnd}
          >
            {SLIDES.map((s) => (
              <article className="slide" key={s.title}>
                <img src={IMG(s.img, 1600)} alt={s.title} loading="lazy" />
                <div className="slide__body">
                  <span className="slide__tag">{s.tag}</span>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                  <a href="#planners" className="btn btn--gold btn--sm">Read guide</a>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="carousel__dots">
          {SLIDES.map((s, i) => (
            <button key={s.title} className={i === index ? "is-active" : ""} aria-label={`Go to slide ${i + 1}`} onClick={() => go(i)} />
          ))}
        </div>
      </div>
    </section>
  );
}
