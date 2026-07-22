import Link from "next/link";

export default function WouldYouRather() {
  return (
    <main className="page">
      <p className="eyebrow">
        <Link href="/">← All games</Link>
      </p>
      <h1 className="page-title">Would You Rather</h1>
      <p className="subtitle">
        The wheel picks a person, the cards pick a question, and they have to
        choose. No repeats — everyone gets a turn.
      </p>

      <div className="card-grid">
        <Link href="/would-you-rather/play" className="game-card marquee">
          <h2>Play</h2>
          <p>Spin the wheel and start the show.</p>
          <span className="play-hint">Enter the stage →</span>
        </Link>

        <Link href="/would-you-rather/settings" className="game-card marquee">
          <h2>Settings</h2>
          <p>Manage who&apos;s in the room and the question deck.</p>
          <span className="play-hint">Edit setup →</span>
        </Link>
      </div>
    </main>
  );
}
