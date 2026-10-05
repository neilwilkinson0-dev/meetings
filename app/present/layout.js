// Everything under /present uses the Rome theme (see .rome in globals.css).
export const metadata = {
  title: "EATP 2026",
};

export default function PresentLayout({ children }) {
  return <div className="rome">{children}</div>;
}
