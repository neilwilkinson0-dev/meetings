export default function Logo({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path
        d="M32 6 L54 14 V32 C54 46 44 55 32 58 C20 55 10 46 10 32 V14 Z"
        stroke="var(--forest)"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path
        d="M20 30 L29 40 L45 20"
        stroke="var(--green)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
