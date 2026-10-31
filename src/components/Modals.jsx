import { useEffect, useState } from "react";
import { CITIES, TYPES, TYPE_OPTIONS } from "../data";
import MultiSelect from "./MultiSelect";
import { postJSON } from "../api";

function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <div className={`modal ${open ? "is-open" : ""}`} aria-hidden={!open} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal__box" role="dialog" aria-label={title}>
        <button className="modal__close" aria-label="Close" onClick={onClose}>×</button>
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}

// فارم کا ڈیٹا API کے ذریعے MySQL میں محفوظ کرتا ہے
function useApiSubmit(path, { onSubmit, onClose, onError }) {
  const [sending, setSending] = useState(false);

  const submit = async (e, extra = {}) => {
    e.preventDefault();
    const form = e.target;
    setSending(true);
    try {
      const payload = { ...Object.fromEntries(new FormData(form)), ...extra };
      const { id } = await postJSON(path, payload);
      form.reset();
      onClose();
      onSubmit(payload, id);
    } catch (err) {
      onError(err.message);
    } finally {
      setSending(false);
    }
  };

  return { submit, sending };
}

export function QuoteModal({ open, forWhom, filters, onClose, onSubmit, onError }) {
  const [types, setTypes] = useState([]);
  const { submit, sending } = useApiSubmit("/api/enquiries", { onSubmit, onClose, onError });

  // فارم کھلنے پر سرچ میں منتخب ایونٹس پہلے سے بھر دیں
  useEffect(() => {
    if (open) setTypes(filters.types);
  }, [open, filters.types]);

  return (
    <Modal open={open} onClose={onClose} title="Get a free quote">
      <p className="muted">Enquiry for: {forWhom}</p>
      <form className="form" key={`${forWhom}-${open}`} onSubmit={(e) => submit(e, { types, enquiryFor: forWhom })}>
        <div className="form__row">
          <input type="text" name="name" placeholder="Your name" required />
          <input type="tel" name="phone" placeholder="WhatsApp number (03xx xxxxxxx)" pattern="[0-9+ \-]{10,15}" required />
        </div>
        <div className="form__row">
          <input type="email" name="email" placeholder="Email (for confirmation)" />
          <input type="number" name="guests" placeholder="No. of guests" min="1" />
        </div>
        <div className="form__row">
          <select name="city" defaultValue={filters.city} required>
            <option value="">City</option>
            {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <MultiSelect options={TYPE_OPTIONS} value={types} onChange={setTypes} placeholder="Event type(s)" />
        </div>
        <div className="form__row form__row--time">
          <input type="date" name="date" defaultValue={filters.date} required />
          <label>
            <span>Event time</span>
            <input type="time" name="startTime" defaultValue={filters.startTime} />
          </label>
        </div>
        <textarea name="message" rows="2" placeholder="Tell us about your event (optional)"></textarea>
        <button className="btn btn--primary btn--block" type="submit" disabled={sending}>
          {sending ? "Sending..." : "Send Enquiry"}
        </button>
      </form>
    </Modal>
  );
}

export function VendorModal({ open, onClose, onSubmit, onError }) {
  const { submit, sending } = useApiSubmit("/api/vendors", { onSubmit, onClose, onError });

  return (
    <Modal open={open} onClose={onClose} title="Join as Vendor">
      <p className="muted">Decorators, photographers, caterers and venues — partner with Signature. Fill in your details and we'll contact you.</p>
      <form className="form" onSubmit={submit}>
        <input type="text" name="business" placeholder="Business name" required />
        <input type="text" name="name" placeholder="Contact person" required />
        <input type="tel" name="phone" placeholder="WhatsApp number (03xx xxxxxxx)" pattern="[0-9+ \-]{10,15}" required />
        <div className="form__row">
          <select name="city" required defaultValue="">
            <option value="">City</option>
            {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select name="type" required defaultValue="">
            <option value="">Service type</option>
            {TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
        <button className="btn btn--gold btn--block" type="submit" disabled={sending}>
          {sending ? "Sending..." : "Submit"}
        </button>
      </form>
    </Modal>
  );
}
