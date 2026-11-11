import Link from "next/link";

export default function Eaa() {
  return (
    <main className="page">
      <p className="eyebrow">
        <Link href="/">← All games</Link>
      </p>
      <h1 className="page-title">eAA 2026</h1>
      <p className="subtitle">
        A five-slide deck: who I am, who Certiverse is, what I&apos;ll cover, a title slide
        for the live demo, then questions with a QR code to the free trial.
      </p>

      <div className="card-grid">
        <Link href="/eaa/setup" className="game-card marquee">
          <h2>1. Set up</h2>
          <p>Edit the words and where the QR code points.</p>
          <span className="play-hint">Open setup →</span>
        </Link>
        <Link href="/eaa/deck" className="game-card marquee">
          <h2>2. Present</h2>
          <p>
            → / space / clicker to move on, ← to go back, F for full screen.
          </p>
          <span className="play-hint">Open the deck →</span>
        </Link>
        <a href="/eaa/print?download" target="_blank" className="game-card marquee">
          <h2>Download PDF</h2>
          <p>All five slides as a 16:9 PDF, with your latest edits. Pick &ldquo;Save as PDF&rdquo; in the print dialog.</p>
          <span className="play-hint">Get the PDF →</span>
        </a>
        <Link href="/eaa/remote" className="game-card marquee">
          <h2>3. Phone remote</h2>
          <p>Open this on your phone to change slides from anywhere in the room.</p>
          <span className="play-hint">Open remote →</span>
        </Link>
      </div>
    </main>
  );
}
