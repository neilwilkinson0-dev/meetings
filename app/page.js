import Link from "next/link";

export default function Home() {
  return (
    <main className="page">
      <p className="eyebrow">Neil&apos;s meeting games</p>
      <h1 className="page-title">Pick tonight&apos;s show</h1>
      <p className="subtitle">
        Choose a game to kick the meeting off. Each one has its own settings
        and its own stage.
      </p>

      <div className="card-grid">
        <Link href="/would-you-rather" className="game-card marquee">
          <h2>Would You Rather</h2>
          <p>
            The wheel picks a person, the cards pick a question, and they have
            to choose. No repeats — everyone gets a turn.
          </p>
          <span className="play-hint">Enter the stage →</span>
        </Link>

        <div className="game-card marquee soon">
          <h2>Coming soon</h2>
          <p>The next game goes here. The stage is being built.</p>
        </div>
      </div>
    </main>
  );
}
