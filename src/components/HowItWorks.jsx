const STEPS = [
  ["01", "Tell Us", "Share your event type, date, city, guest count and budget by call, WhatsApp or the quote form."],
  ["02", "Plan Together", "We suggest menus, stage themes and décor, and customise a package for you."],
  ["03", "Celebrate", "Our team handles setup, catering and coordination on the day — you enjoy the moment."],
];

const SERVICES = [
  ["🍽", "Catering", "Desi, BBQ, Chinese and Continental menus with live counters and desserts."],
  ["✿", "Stage & Décor", "Fresh floral stages, entrances, table décor and themed setups."],
  ["✦", "Lighting & Sound", "Elegant lighting, fairy lights, sound systems and DJ arrangements."],
  ["☎", "Full Coordination", "One team from first call to the last guest — no stress for your family."],
];

export default function HowItWorks() {
  return (
    <section className="section section--dark" id="how-it-works">
      <div className="container">
        <div className="section__head section__head--center">
          <span className="eyebrow">How it works</span>
          <h2>Your event in 3 simple steps</h2>
        </div>
        <div className="steps">
          {STEPS.map(([num, title, text]) => (
            <div className="step" key={num}>
              <span className="step__num">{num}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
        <div className="features">
          {SERVICES.map(([icon, title, text]) => (
            <div className="feature" key={title}>
              <div className="feature__icon">{icon}</div>
              <h4>{title}</h4>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
