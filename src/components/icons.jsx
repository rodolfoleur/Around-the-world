// Icon set — ported 1:1 from the design's inline SVGs (ios-frame-adjacent,
// stroke-based, currentColor so tab/state colors drive them).

export function HomeIcon(props) {
  return (
    <svg width="19" height="19" viewBox="0 0 20 20" fill="none" {...props}>
      <path d="M3 8.5 10 3l7 5.5V17H3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function PlanIcon(props) {
  return (
    <svg width="19" height="19" viewBox="0 0 20 20" fill="none" {...props}>
      <rect x="3" y="4" width="14" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 8h14M7 2.5v3M13 2.5v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function MapIcon(props) {
  return (
    <svg width="19" height="19" viewBox="0 0 20 20" fill="none" {...props}>
      <path d="M2.5 5.5 7.5 3.5v11l-5 2zM7.5 3.5l5 2v11l-5-2zM12.5 5.5l5-2v11l-5 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function BudgetIcon(props) {
  return (
    <svg width="19" height="19" viewBox="0 0 20 20" fill="none" {...props}>
      <rect x="2.5" y="5" width="15" height="11" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M2.5 9h15" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="14" cy="12.5" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function PlaneIcon(props) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" {...props}>
      <path d="M2 11.5 18 5l-3.2 6.2L18 17l-5.6-2.8-3.2 2.3.2-3.4z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

export function MoonIcon(props) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" {...props}>
      <path d="M15.5 12.4A6.4 6.4 0 017.6 4.5a6.5 6.5 0 107.9 7.9z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function CarIcon(props) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" {...props}>
      <path d="M3 13v-2.2l1.6-3.4A1.6 1.6 0 016 6.5h8a1.6 1.6 0 011.4.9L17 10.8V13" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="6" cy="13.6" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="14" cy="13.6" r="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function CashIcon(props) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" {...props}>
      <rect x="2" y="5.5" width="16" height="9" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="10" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function DebitIcon(props) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" {...props}>
      <rect x="2" y="4.5" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 8.5h16" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 12.5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function CreditIcon(props) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" {...props}>
      <rect x="2" y="5.5" width="16" height="10.5" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="1.6" y="2.6" width="14" height="3" rx="1.5" stroke="currentColor" strokeWidth="1.3" opacity="0.45" />
      <circle cx="14" cy="12.6" r="1.3" fill="currentColor" />
    </svg>
  );
}

export const PAY_ICONS = { Cash: CashIcon, Debit: DebitIcon, Credit: CreditIcon };
export const TAB_ICONS = { home: HomeIcon, plan: PlanIcon, map: MapIcon, budget: BudgetIcon };

export function SearchIcon(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...props}>
      <circle cx="7" cy="7" r="4.6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10.4 10.4 14 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function ChevronLeftIcon(props) {
  return (
    <svg width="9" height="15" viewBox="0 0 9 15" fill="none" {...props}>
      <path d="M8 1 1.5 7.5 8 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function transitIcon(t) {
  if (t.night) return MoonIcon;
  const s = t.t.toLowerCase();
  if (s.includes('car') || s.includes('sixt') || s.includes('taxi')) return CarIcon;
  return PlaneIcon;
}
