"use client";

import { useEffect, useState } from "react";
import PinGate from "../../present/PinGate";
import { SLIDES, SLIDE_LABELS, useDeckChannel } from "@/lib/eaaDeck";
import { useWakeLock } from "@/lib/event";

const DEMO = SLIDES.indexOf("demo");

// Which demo steps you've ticked off, kept on the phone so a refresh
// mid-demo doesn't lose your place.
function useDemoTicks() {
  const [done, setDone] = useState([]);
  useEffect(() => {
    try {
      setDone(JSON.parse(localStorage.getItem("eaa-demo-done") || "[]"));
    } catch {}
  }, []);
  function save(next) {
    setDone(next);
    try {
      localStorage.setItem("eaa-demo-done", JSON.stringify(next));
    } catch {}
  }
  return [done, save];
}

const STATUS = {
  connecting: "Connecting…",
  connected: "Connected",
  offline: "Offline — check your signal",
  unconfigured: "Supabase isn't configured",
};

function Remote() {
  // null until the deck tells us where it is.
  const [i, setI] = useState(null);
  const [agenda, setAgenda] = useState([]);
  const [done, setDone] = useDemoTicks();
  const awake = useWakeLock();
  const { status, send } = useDeckChannel({
    onState: (p) => {
      if (typeof p?.i === "number") setI(p.i);
      if (Array.isArray(p?.agenda)) setAgenda(p.agenda);
    },
  });

  function go(to) {
    const next = Math.max(0, Math.min(SLIDES.length - 1, to));
    setI(next); // optimistic; the deck confirms with its own "state"
    send("goto", { to: next });
    navigator.vibrate?.(15);
  }

  const live = status === "connected";
  const deckSeen = i !== null;
  const onDemo = i === DEMO;

  function toggle(item) {
    setDone(done.includes(item) ? done.filter((d) => d !== item) : [...done, item]);
    navigator.vibrate?.(10);
  }

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

      {onDemo && agenda.length > 0 && (
        <section className="eaa-r-demo">
          <div className="eaa-r-demo-head">
            <h2>Demo checklist</h2>
            {done.length > 0 && (
              <button onClick={() => setDone([])}>Reset</button>
            )}
          </div>
          <ol>
            {agenda.map((item, n) => (
              <li key={item}>
                <button className={done.includes(item) ? "done" : ""} onClick={() => toggle(item)}>
                  <span className="eaa-r-tick">{done.includes(item) ? "✓" : n + 1}</span>
                  <span className="eaa-r-item">{item}</span>
                </button>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className={`eaa-r-buttons ${onDemo ? "compact" : ""}`}>
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
