"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function Countdown() {
  const [phase, setPhase] = useState("setup"); // setup | running
  const [title, setTitle] = useState("");
  const [minutes, setMinutes] = useState("10");
  const [remaining, setRemaining] = useState(0);
  const [paused, setPaused] = useState(false);

  const endAtRef = useRef(null);
  const pausedRemainingRef = useRef(null);
  const tickRef = useRef(null);

  function startTimer(e) {
    e?.preventDefault?.();
    const mins = parseFloat(minutes);
    if (!mins || mins <= 0) return;
    const seconds = Math.round(mins * 60);
    endAtRef.current = Date.now() + seconds * 1000;
    setRemaining(seconds);
    setPaused(false);
    setPhase("running");
  }

  useEffect(() => {
    if (phase !== "running" || paused) return;

    function tick() {
      const left = Math.max(0, Math.round((endAtRef.current - Date.now()) / 1000));
      setRemaining(left);
    }
    tick();
    tickRef.current = setInterval(tick, 250);
    return () => clearInterval(tickRef.current);
  }, [phase, paused]);

  function togglePause() {
    if (paused) {
      endAtRef.current = Date.now() + pausedRemainingRef.current * 1000;
      setPaused(false);
    } else {
      pausedRemainingRef.current = remaining;
      setPaused(true);
    }
  }

  function newTimer() {
    clearInterval(tickRef.current);
    setPhase("setup");
    setPaused(false);
  }

  if (phase === "setup") {
    return (
      <main className="page">
        <p className="eyebrow">
          <Link href="/">← All games</Link>
        </p>
        <h1 className="page-title">Countdown Timer</h1>
        <p className="subtitle">
          Give it a title and a time, then hit start. Big enough to read from
          across the room.
        </p>

        <section className="panel" style={{ marginTop: 36, maxWidth: 440 }}>
          <h2>Set the clock</h2>
          <p className="hint">Any number of minutes — half minutes work too.</p>
          <form className="add-col" onSubmit={startTimer}>
            <input
              className="input"
              placeholder="What's this timer for? (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              className="input"
              type="number"
              min="0.5"
              step="0.5"
              placeholder="Minutes"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
            />
            <div>
              <button className="btn big" type="submit">
                Start
              </button>
            </div>
          </form>
        </section>
      </main>
    );
  }

  const finished = remaining <= 0;
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <main className="stage">
      <div className="stage-topbar">
        <div className="topbar-left">
          <Link href="/" className="text-link">
            ← Leave the show
          </Link>
          <button className="text-link reset-link" onClick={newTimer}>
            ↺ New timer
          </button>
        </div>
      </div>

      {title && <h1 className="question-banner">{title}</h1>}

      <p className={`timer-display${finished ? " timer-done" : ""}`}>
        {mm}:{ss}
      </p>

      {finished ? (
        <h2 className="done-title" style={{ marginTop: 10 }}>
          Time&apos;s up!
        </h2>
      ) : (
        <div className="btn-row" style={{ marginTop: 40 }}>
          <button className="btn secondary big" onClick={togglePause}>
            {paused ? "Resume" : "Pause"}
          </button>
        </div>
      )}
    </main>
  );
}
