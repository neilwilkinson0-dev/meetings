import Link from "next/link";

export default function Eaa() {
  return (
    <main className="page">
      <p className="eyebrow">
        <Link href="/">← All games</Link>
      </p>
      <h1 className="page-title">eAA 2026</h1>
      <p className="subtitle">
        A five-slide deck: who I am, who Certiverse is, what I&apos;ll cover, a jump to
        the live demo in its own tab, then questions with a QR code to the free trial.
      </p>

      <div className="card-grid">
        <Link href="/eaa/setup" className="game-card marquee">
          <h2>1. Set up</h2>
          <p>Edit the words, the demo link and where the QR code points.</p>
          <span className="play-hint">Open setup →</span>
        </Link>
        <Link href="/eaa/deck" className="game-card marquee">
          <h2>2. Present</h2>
          <p>
            → / space / clicker to move on, ← to go back, F for full screen, D to
            reopen the demo.
          </p>
          <span className="play-hint">Open the deck →</span>
        </Link>
      </div>
    </main>
  );
}
