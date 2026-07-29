import Link from "next/link";

export default function Ideas() {
  return (
    <main className="page">
      <p className="eyebrow">
        <Link href="/">← All games</Link>
      </p>
      <h1 className="page-title">Ideas Board</h1>
      <p className="subtitle">
        Pitch a feature, vote on what other people have suggested, and
        thrash it out in the comments. The board auto-ranks by traction, and
        anyone can link a top idea to its Jira ticket once it&apos;s underway.
      </p>

      <div className="card-grid">
        <Link href="/ideas/board" className="game-card marquee">
          <h2>Open the board</h2>
          <p>See what&apos;s been pitched, vote, comment, and add your own.</p>
          <span className="play-hint">Enter the stage →</span>
        </Link>
      </div>
    </main>
  );
}
