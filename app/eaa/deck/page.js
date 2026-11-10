"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { lines, useDeckConfig } from "@/lib/eaaDeck";
import { useWakeLock } from "@/lib/event";

const SLIDES = ["intro", "certiverse", "agenda", "demo", "questions"];
const DEMO = SLIDES.indexOf("demo");

function useQr(url) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    if (!url) return setSrc("");
    QRCode.toDataURL(url, { margin: 1, width: 800, errorCorrectionLevel: "M" })
      .then(setSrc)
      .catch(() => setSrc(""));
  }, [url]);
  return src;
}

// Opens (or re-focuses) the demo in its own named tab, so pressing it
// twice doesn't pile up tabs.
function openDemo(url) {
  if (!url) return;
  const w = window.open(url, "eaa-demo");
  if (w) {
    try {
      w.opener = null;
    } catch {}
    w.focus?.();
  }
}

function IntroSlide({ c }) {
  return (
    <div className="eaa-intro">
      <div className="eaa-intro-text">
        <p className="eaa-eyebrow">{c.eventName}</p>
        <h1 className="eaa-talk">{c.talkTitle}</h1>
        <div className="eaa-me">
          <h2 className="eaa-name">{c.name}</h2>
          <p className="eaa-role">
            {c.role}
            {c.company && <span className="eaa-company"> · {c.company}</span>}
          </p>
          {lines(c.aboutMe).length > 0 && (
            <ul className="eaa-about">
              {lines(c.aboutMe).map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {c.photo && (
        <div className="eaa-photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.photo} alt={c.name} />
        </div>
      )}
    </div>
  );
}

function CertiverseSlide({ c }) {
  const points = lines(c.certiversePoints);
  return (
    <div className="eaa-block">
      <p className="eaa-eyebrow">{c.company || "Certiverse"}</p>
      <h1 className="eaa-h1">{c.certiverseTitle}</h1>
      {c.certiverseTagline && <p className="eaa-lead">{c.certiverseTagline}</p>}
      {points.length > 0 && (
        <div className="eaa-tiles">
          {points.map((p, i) => (
            <div className="eaa-tile" key={i} style={{ animationDelay: `${120 + i * 90}ms` }}>
              {p}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AgendaSlide({ c }) {
  const items = lines(c.agendaItems);
  return (
    <div className="eaa-block">
      <p className="eaa-eyebrow">Today</p>
      <h1 className="eaa-h1">{c.agendaTitle}</h1>
      <ol className="eaa-agenda">
        {items.map((item, i) => (
          <li key={i} style={{ animationDelay: `${120 + i * 90}ms` }}>
            <span className="eaa-num">{String(i + 1).padStart(2, "0")}</span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function DemoSlide({ c }) {
  return (
    <div className="eaa-demo">
      <p className="eaa-eyebrow">Live demo</p>
      <h1 className="eaa-h1 eaa-big">{c.demoTitle}</h1>
      {c.demoSubtitle && <p className="eaa-lead">{c.demoSubtitle}</p>}
      <button
        className="eaa-demo-btn"
        onClick={(e) => {
          e.stopPropagation();
          openDemo(c.demoUrl);
        }}
      >
        Open the demo ↗
      </button>
      <p className="eaa-hint">Press D or Enter to open it again · → for questions when you&apos;re back</p>
    </div>
  );
}

function QuestionsSlide({ c, qr }) {
  return (
    <div className="eaa-questions">
      <div>
        <h1 className="eaa-h1 eaa-big">{c.questionsTitle}</h1>
        {c.questionsSubtitle && <p className="eaa-lead">{c.questionsSubtitle}</p>}
        <p className="eaa-sign">
          {c.name}
          {c.company && <span> · {c.company}</span>}
        </p>
      </div>
      {qr && (
        <div className="eaa-qr">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt={`QR code: ${c.qrUrl}`} />
          {c.qrLabel && <p className="eaa-qr-label">{c.qrLabel}</p>}
          {c.showQrUrl && <p className="eaa-qr-url">{c.qrUrl.replace(/^https?:\/\//, "")}</p>}
        </div>
      )}
    </div>
  );
}

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

  // Called from a key press or click, so the browser treats the demo tab
  // as user-initiated and doesn't block it.
  const go = useCallback((to) => {
    const { i, c } = latest.current;
    const next = Math.max(0, Math.min(SLIDES.length - 1, to));
    if (next === i) return;
    setI(next);
    if (next === DEMO && next > i && c.autoOpenDemo) openDemo(c.demoUrl);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const { i, c } = latest.current;
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
        case "PageDown":
        case " ":
          e.preventDefault();
          go(i + 1);
          break;
        case "Enter":
          e.preventDefault();
          if (i === DEMO) openDemo(c.demoUrl);
          else go(i + 1);
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
        case "d":
        case "D":
          openDemo(c.demoUrl);
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
      style={{ "--eaa-accent": c.accent }}
      onClick={(e) => {
        if (e.target.closest("button, a")) return;
        // Left third goes back, the rest goes forward.
        go(e.clientX < window.innerWidth / 3 ? i - 1 : i + 1);
      }}
      onDoubleClick={enterFullscreen}
    >
      <div className="eaa-glow" aria-hidden />
      {ready && (
        <section className="eaa-slide" key={slide}>
          {slide === "intro" && <IntroSlide c={c} />}
          {slide === "certiverse" && <CertiverseSlide c={c} />}
          {slide === "agenda" && <AgendaSlide c={c} />}
          {slide === "demo" && <DemoSlide c={c} />}
          {slide === "questions" && <QuestionsSlide c={c} qr={qr} />}
        </section>
      )}

      <footer className="eaa-footer">
        <span className="eaa-footer-brand">{c.company}</span>
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
        <span className="eaa-footer-event">{c.eventName}</span>
      </footer>

      <div className="eaa-controls">
        <button onClick={(e) => (e.stopPropagation(), toggleFullscreen())}>⛶ Full screen (F)</button>
        <a href="/eaa/setup" onClick={(e) => e.stopPropagation()}>
          Edit
        </a>
      </div>
    </main>
  );
}
