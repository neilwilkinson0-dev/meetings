import Link from "next/link";

export default function TimeTravel() {
  return (
    <main className="page">
      <p className="eyebrow">
        <Link href="/">← All games</Link>
      </p>
      <h1 className="page-title">Time Travel</h1>
      <p className="subtitle">
        A question goes up on screen. Everyone scans the QR code and sends in
        an idea from their phone. After a minute the room&apos;s answers
        reveal themselves — and keep rolling in.
      </p>

      <div className="card-grid">
        <Link href="/time-travel/play" className="game-card marquee">
          <h2>Play</h2>
          <p>Put the question on screen and open it up for ideas.</p>
          <span className="play-hint">Enter the stage →</span>
        </Link>

        <Link href="/time-travel/settings" className="game-card marquee">
          <h2>Settings</h2>
          <p>Set the question for the next round, and browse past ones.</p>
          <span className="play-hint">Edit setup →</span>
        </Link>
      </div>
    </main>
  );
}
