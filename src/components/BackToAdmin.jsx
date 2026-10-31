import { useState } from "react";
import { FROM_ADMIN_KEY, getKey } from "../admin/adminApi";

// sirf tab dikhe jab admin login ho aur admin panel se website par aaye hon
const cameFromAdmin = () => {
  try { return sessionStorage.getItem(FROM_ADMIN_KEY) === "1" && Boolean(getKey()); } catch { return false; }
};

export default function BackToAdmin() {
  const [show, setShow] = useState(cameFromAdmin);
  if (!show) return null;

  const hide = () => {
    try { sessionStorage.removeItem(FROM_ADMIN_KEY); } catch { /* private mode */ }
    setShow(false);
  };

  return (
    <div className="back-admin">
      <a href="/admin" className="back-admin__btn">← Back to Admin</a>
      <button className="back-admin__x" onClick={hide} aria-label="Hide" title="Hide">×</button>
    </div>
  );
}
