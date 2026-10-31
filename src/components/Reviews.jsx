import { REVIEWS } from "../data";

export default function Reviews() {
  return (
    <section className="section section--soft" id="reviews">
      <div className="container">
        <div className="section__head section__head--center">
          <span className="eyebrow eyebrow--dark">Reviews</span>
          <h2>What our customers say</h2>
        </div>
        <div className="reviews">
          {REVIEWS.map((r) => (
            <div className="review" key={r.name}>
              <div className="review__stars">★★★★★</div>
              <p>“{r.text}”</p>
              <div className="review__who">
                <span className="avatar">{r.name[0]}</span>
                <div>
                  <strong>{r.name}</strong>
                  <small>{r.event} · {r.city}</small>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
