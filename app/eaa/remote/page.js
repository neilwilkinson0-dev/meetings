"use client";

import { useState } from "react";
import PinGate from "../../present/PinGate";
import { SLIDES, SLIDE_LABELS, useDeckChannel } from "@/lib/eaaDeck";
import { useWakeLock } from "@/lib/event";

const STATUS = {
  connecting: "Connecting…",
  connected: "Connected",
  offline: "Offline — check your signal",
  unconfigured: "Supabase isn't configured",
};

function Remote() {
  // null until the deck tells us where it is.
  const [i, setI] = useState(null);
  const awake = useWakeLock();
  const { status, send } = useDeckChannel({
    onState: (p) => typeof p?.i === "number" && setI(p.i),
  });

  function go(to) {
    const next = Math.max(0, Math.min(SLIDES.length - 1, to));
    setI(next); // optimistic; the deck confirms with its own "state"
    send("goto", { to: next });
    navigator.vibrate?.(15);
  }

  const live = status === "connected";
  const deckSeen = i !== null;

  return (
    <main className="eaa-remote">
      <header className="eaa-r-top">
        <span className={`eaa-r-dot ${live && deckSeen ? "ok" : live ? "wait" : "bad"}`} />
        <span>
          {live && !deckSeen ? "Waiting for the deck — open /eaa/deck on the laptop" : STATUS[status]}
        </span>
      </header>

      <section className="eaa-r-now">
        <p className="eaa-r-kicker">{deckSeen ? `Slide ${i + 1} of ${SLIDES.length}` : "Slide –"}</p>
        <h1>{deckSeen ? SLIDE_LABELS[i] : "—"}</h1>
        <p className="eaa-r-next">
          {deckSeen && i < SLIDES.length - 1 ? `Next: ${SLIDE_LABELS[i + 1]}` : deckSeen ? "Last slide" : ""}
        </p>
      </section>

      <div className="eaa-r-buttons">
        <button className="eaa-r-back" disabled={!live || i === 0} onClick={() => go((i ?? 0) - 1)}>
          ← Back
        </button>
        <button
          className="eaa-r-fwd"
          disabled={!live || i === SLIDES.length - 1}
          onClick={() => go((i ?? -1) + 1)}
        >
          Next →
        </button>
      </div>

      <ol className="eaa-r-list">
        {SLIDE_LABELS.map((label, n) => (
          <li key={label}>
            <button className={n === i ? "on" : ""} disabled={!live} onClick={() => go(n)}>
              <span>{n + 1}</span>
              {label}
            </button>
          </li>
        ))}
      </ol>

      <p className="eaa-r-foot">
        {awake ? "Screen will stay on while this page is open." : "Tap anywhere to keep your screen on."}
      </p>
    </main>
  );
}

export default function RemotePage() {
  return (
    <PinGate label="eAA 2026">
      <Remote />
    </PinGate>
  );
}
