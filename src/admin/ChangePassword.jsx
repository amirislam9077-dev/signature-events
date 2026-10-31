import { useEffect, useState } from "react";
import { changePassword } from "./adminApi";

// Password badalne ka popup — login page aur sidebar dono se khulta hai
export default function ChangePassword({ initialCurrent = "", onClose, onChanged }) {
  const [current, setCurrent] = useState(initialCurrent);
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (next.length < 8) return setError("New password must be at least 8 characters.");
    if (next !== confirm) return setError("New passwords do not match.");
    setBusy(true);
    try {
      await changePassword(current, next);
      setDone(true);
      onChanged?.(next);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const strength = next.length === 0 ? "" : next.length < 8 ? "Too short"
    : /[A-Z]/.test(next) && /[0-9]/.test(next) && /[^A-Za-z0-9]/.test(next) && next.length >= 10 ? "Strong" : "OK";

  return (
    <div className="cp" onClick={onClose}>
      <form className="cp__box" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <button type="button" className="cp__x" onClick={onClose} aria-label="Close">×</button>
        <h3>🔑 Change password</h3>

        {done ? (
          <>
            <p className="cp__ok">✓ Password changed. Use your new password next time you log in.</p>
            <button type="button" className="ad-btn ad-btn--gold" onClick={onClose}>Done</button>
          </>
        ) : (
          <>
            <label>Current password
              <input type={show ? "text" : "password"} value={current} onChange={(e) => setCurrent(e.target.value)} required autoFocus={!initialCurrent} />
            </label>
            <label>New password
              <input type={show ? "text" : "password"} value={next} onChange={(e) => setNext(e.target.value)} required minLength={8} autoFocus={Boolean(initialCurrent)} />
              {strength && <small className={`cp__strength cp__strength--${strength.replace(" ", "").toLowerCase()}`}>{strength}</small>}
            </label>
            <label>Confirm new password
              <input type={show ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </label>
            <label className="cp__show">
              <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> Show passwords
            </label>
            <p className="cp__hint">At least 8 characters. Mix letters, numbers and a symbol for a strong password.</p>
            {error && <p className="ad-error">{error}</p>}
            <div className="cp__btns">
              <button type="button" className="ad-btn" onClick={onClose}>Cancel</button>
              <button className="ad-btn ad-btn--gold" disabled={busy}>{busy ? "Saving..." : "Change password"}</button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
