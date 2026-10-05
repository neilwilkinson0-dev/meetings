import Link from "next/link";

export default function Present() {
  return (
    <main className="page">
      <p className="eyebrow">
        <Link href="/">← All games</Link>
      </p>
      <h1 className="page-title">Presenter</h1>
      <p className="subtitle">
        Run a whole session from your phone: title screens, slides, a video,
        a fun-or-serious ice breaker and audience Q&amp;A — with a QR code in
        the corner the whole time so anyone can ask.
      </p>

      <div className="card-grid">
        <Link href="/present/setup" className="game-card marquee">
          <h2>1. Set up</h2>
          <p>Build and reorder the sections, upload slides and the video.</p>
          <span className="play-hint">Open setup →</span>
        </Link>
        <Link href="/present/screen" className="game-card marquee">
          <h2>2. Big screen</h2>
          <p>Open this on the laptop plugged into the projector.</p>
          <span className="play-hint">Open screen →</span>
        </Link>
        <Link href="/present/remote" className="game-card marquee">
          <h2>3. Remote</h2>
          <p>Open this on your phone to drive the screen while you talk.</p>
          <span className="play-hint">Open remote →</span>
        </Link>
      </div>
    </main>
  );
}
