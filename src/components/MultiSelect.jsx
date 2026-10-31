import { useEffect, useRef, useState } from "react";

// checkbox والا dropdown — ایک سے زیادہ چیزیں منتخب کی جا سکتی ہیں
export default function MultiSelect({ id, options, value, onChange, placeholder }) {
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const ref = useRef(null);

  // نیچے جگہ کم ہو تو لسٹ اوپر کی طرف کھلے تاکہ صفحے سے باہر نہ جائے
  const toggleOpen = () => {
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const below = window.innerHeight - rect.bottom;
      setDropUp(below < 260 && rect.top > below);
    }
    setOpen(!open);
  };

  useEffect(() => {
    const closeOutside = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", closeOutside);
    return () => document.removeEventListener("mousedown", closeOutside);
  }, []);

  const toggle = (v) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  const labelOf = (v) => options.find((o) => o.value === v)?.label;

  let text = placeholder;
  if (value.length === 1 || value.length === 2) text = value.map(labelOf).join(", ");
  else if (value.length > 2) text = `${value.length} events selected`;

  return (
    <div className={`ms ${open ? "is-open" : ""} ${dropUp ? "ms--up" : ""}`} ref={ref}>
      <button type="button" id={id} className={`ms__btn ${value.length ? "has-value" : ""}`} onClick={toggleOpen}>
        <span className="ms__text">{text}</span>
        <span className="ms__caret">▾</span>
      </button>
      {open && (
        <div className="ms__menu">
          <div className="ms__grid">
          {options.map((o) => (
            <label key={o.value} className={`ms__opt ${value.includes(o.value) ? "is-checked" : ""}`}>
              <input type="checkbox" checked={value.includes(o.value)} onChange={() => toggle(o.value)} />
              <span className="ms__box" aria-hidden="true">✓</span>
              <span className="ms__label">{o.label}</span>
            </label>
          ))}
          </div>
          <div className="ms__foot">
            <button type="button" onClick={() => onChange([])}>Clear</button>
            <button type="button" className="ms__done" onClick={() => setOpen(false)}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}
