"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SLIDES, lines, useDeckChannel, useDeckConfig } from "@/lib/eaaDeck";
import { Slide, useQr } from "../Slides";
import { useWakeLock } from "@/lib/event";


function enterFullscreen() {
  document.documentElement.requestFullscreen?.().catch(() => {});
}

function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  else enterFullscreen();
}

function slideFromHash() {
  const n = parseInt(window.location.hash.replace("#", ""), 10);
  return n >= 1 && n <= SLIDES.length ? n - 1 : 0;
}

export default function Deck() {
  const { config: c, ready } = useDeckConfig();
  const [i, setI] = useState(0);
  const [idle, setIdle] = useState(false);
  const qr = useQr(c.qrUrl);
  const latest = useRef({ i, c });
  latest.current = { i, c };
  useWakeLock(true);

  useEffect(() => setI(slideFromHash()), []);

  // Remember the slide in the URL so a reload lands in the same place.
  useEffect(() => {
    history.replaceState(null, "", `#${i + 1}`);
  }, [i]);

    const go = useCallback((to) => {
    const { i } = latest.current;
    const next = Math.max(0, Math.min(SLIDES.length - 1, to));
    if (next === i) return;
    setI(next);
  }, []);

  // Phone remote: follow its "goto"s and tell it where we are.
  const { send } = useDeckChannel({
    onGoto: (p) => typeof p?.to === "number" && go(p.to),
    onHello: () => send("state", { i: latest.current.i, agenda: lines(latest.current.c.agendaItems) }),
  });

  // The agenda doubles as the phone's demo checklist.
  const agendaKey = c.agendaItems;
  useEffect(() => {
    send("state", { i, agenda: lines(agendaKey) });
  }, [i, agendaKey, send]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const { i } = latest.current;
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
        case "PageDown":
        case "Enter":
        case " ":
          e.preventDefault();
          go(i + 1);
          break;
        case "ArrowLeft":
        case "ArrowUp":
        case "PageUp":
        case "Backspace":
          e.preventDefault();
          go(i - 1);
          break;
        case "Home":
          go(0);
          break;
        case "End":
          go(SLIDES.length - 1);
          break;
        case "f":
        case "F":
          toggleFullscreen();
          break;
        default:
          if (/^[1-9]$/.test(e.key)) go(Number(e.key) - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  // Hide the cursor and controls when the mouse is still.
  useEffect(() => {
    let t;
    const onMove = () => {
      setIdle(false);
      clearTimeout(t);
      t = setTimeout(() => setIdle(true), 2500);
    };
    onMove();
    window.addEventListener("mousemove", onMove);
    return () => {
      clearTimeout(t);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  const slide = SLIDES[i];

  return (
    <main
      className={`eaa-deck ${idle ? "eaa-idle" : ""}`}
      onClick={(e) => {
        if (e.target.closest("button, a")) return;
        // Left third goes back, the rest goes forward.
        go(e.clientX < window.innerWidth / 3 ? i - 1 : i + 1);
      }}
      onDoubleClick={enterFullscreen}
    >
      {ready && (
        <section className="eaa-slide" key={slide}>
          <Slide id={slide} c={c} qr={qr} />
        </section>
      )}

      <div className="eaa-dots">
        {SLIDES.map((s, n) => (
          <button
            key={s}
            className={n === i ? "on" : ""}
            aria-label={`Slide ${n + 1}`}
            onClick={(e) => {
              e.stopPropagation();
              go(n);
            }}
          />
        ))}
      </div>

      <div className="eaa-controls">
        <button onClick={(e) => (e.stopPropagation(), toggleFullscreen())}>⛶ Full screen (F)</button>
        <a href="/eaa/setup" onClick={(e) => e.stopPropagation()}>
          Edit
        </a>
        <a href="/eaa/print?download" target="_blank" onClick={(e) => e.stopPropagation()}>
          ⤓ PDF
        </a>
      </div>
    </main>
  );
}
