import { COMPANY } from "../data";

export function Crown({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 64 36" aria-hidden="true">
      <path
        fill="currentColor"
        d="M4 30h56l-2 5H6zM6 28 2 8l14 10L24 2l8 14 8-14 8 16 14-10-4 20z"
      />
      <circle cx="2" cy="7" r="2.4" fill="currentColor" />
      <circle cx="24" cy="2" r="2.4" fill="currentColor" />
      <circle cx="40" cy="2" r="2.4" fill="currentColor" />
      <circle cx="62" cy="7" r="2.4" fill="currentColor" />
    </svg>
  );
}

export default function Logo({ size = "md", href = "#home", onClick }) {
  return (
    <a href={href} onClick={onClick} className={`logo logo--${size}`} aria-label={COMPANY.legalName}>
      <span className="logo__monogram">
        <Crown className="logo__crown" />
        <span className="logo__s">S</span>
      </span>
      <span className="logo__words">
        <span className="logo__name">{COMPANY.name}</span>
        <span className="logo__sub">{COMPANY.subtitle}</span>
      </span>
    </a>
  );
}
