// A laurel wreath: two leafy branches curving up to meet at the top.
const LEAVES = 9;

function Branch({ flip }) {
  const leaves = Array.from({ length: LEAVES }, (_, i) => {
    const t = (i + 0.6) / LEAVES; // 0 = bottom, 1 = top
    const angle = Math.PI * (0.62 + 0.78 * t); // sweep up the left side
    const x = 50 + 38 * Math.cos(angle);
    const y = 54 - 38 * Math.sin(angle) * 1.05;
    const rot = (angle * 180) / Math.PI - 90 + 35;
    const size = 1 - t * 0.35;
    return (
      <ellipse
        key={i}
        cx={x}
        cy={y}
        rx={3.4 * size}
        ry={8 * size}
        transform={`rotate(${rot} ${x} ${y})`}
      />
    );
  });
  return (
    <g transform={flip ? "translate(100 0) scale(-1 1)" : undefined}>
      <path d="M 44 90 Q 12 70 18 34 Q 22 18 34 10" fill="none" strokeWidth="1.6" stroke="currentColor" />
      <g fill="currentColor">{leaves}</g>
    </g>
  );
}

export default function Laurel({ size = 64, className = "" }) {
  return (
    <svg
      className={`laurel ${className}`}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
    >
      <Branch />
      <Branch flip />
    </svg>
  );
}
