function Doodle({ className, children, viewBox = "0 0 100 100" }) {
  return (
    <svg
      className={`doodle ${className || ""}`}
      viewBox={viewBox}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function SparkleDoodle(props) {
  return (
    <Doodle {...props}>
      <path d="M50 8 L57 40 L90 48 L57 56 L50 90 L43 56 L10 48 L43 40 Z" stroke="var(--green)" strokeWidth="3" />
    </Doodle>
  );
}

export function BurstDoodle(props) {
  return (
    <Doodle {...props}>
      <path d="M50 12 L58 38 L84 22 L64 44 L92 50 L64 56 L84 78 L58 62 L50 88 L42 62 L16 78 L36 56 L8 50 L36 44 L16 22 L42 38 Z" stroke="var(--forest)" strokeWidth="3" />
    </Doodle>
  );
}

export function WheelDoodle(props) {
  return (
    <Doodle {...props}>
      <circle cx="50" cy="50" r="34" stroke="var(--green)" strokeWidth="4" />
      <circle cx="50" cy="50" r="7" stroke="var(--forest)" strokeWidth="4" />
      <path d="M50 16 V34 M50 66 V84 M16 50 H34 M66 50 H84 M27 27 L38 38 M62 62 L73 73 M73 27 L62 38 M38 62 L27 73" stroke="var(--green)" strokeWidth="3" />
    </Doodle>
  );
}

export function ClockDoodle(props) {
  return (
    <Doodle {...props}>
      <circle cx="48" cy="54" r="32" stroke="var(--forest)" strokeWidth="4" />
      <path d="M48 34 V54 L66 64" stroke="var(--green)" strokeWidth="4" />
      <path d="M34 12 L48 20 L62 12" stroke="var(--forest)" strokeWidth="4" />
    </Doodle>
  );
}

export function QrDoodle(props) {
  return (
    <Doodle {...props}>
      <rect x="14" y="14" width="26" height="26" rx="4" stroke="var(--green)" strokeWidth="4" />
      <rect x="60" y="14" width="26" height="26" rx="4" stroke="var(--green)" strokeWidth="4" />
      <rect x="14" y="60" width="26" height="26" rx="4" stroke="var(--green)" strokeWidth="4" />
      <path d="M60 66 H70 V76 H80 V86 H60 Z" stroke="var(--forest)" strokeWidth="4" />
      <path d="M78 60 H86 V68" stroke="var(--forest)" strokeWidth="4" />
    </Doodle>
  );
}

export function SquiggleDoodle(props) {
  return (
    <Doodle {...props} viewBox="0 0 140 60">
      <path
        d="M4 30 C 18 6, 32 6, 46 30 S 74 54, 88 30 S 116 6, 136 30"
        stroke="var(--green)"
        strokeWidth="4"
      />
    </Doodle>
  );
}
