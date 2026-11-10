"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { leadAndRest, lines, splitEmphasis, useDeckConfig } from "@/lib/eaaDeck";
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

const B = "/media/eaa/brand";

// Text with *asterisk* words picked out in brand green.
function Em({ text }) {
  return splitEmphasis(text).map((p, i) => (p.em ? <em key={i}>{p.text}</em> : <span key={i}>{p.text}</span>));
}

function Img({ src, className, alt = "" }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} className={className} alt={alt} draggable={false} />;
}

function Logo() {
  return <Img src={`${B}/logo.webp`} className="eaa-logo" alt="Certiverse" />;
}

// Mint side strip with a doodle and the mark at the foot, as on the
// brand's section slides.
function Strip({ doodle }) {
  return (
    <aside className="eaa-strip">
      <Img src={doodle} className="eaa-strip-doodle" />
      <span className="eaa-strip-mark">
        <Img src={`${B}/mark.webp`} />
      </span>
    </aside>
  );
}

function IntroSlide({ c }) {
  const about = lines(c.aboutMe);
  return (
    <div className="eaa-s eaa-mint eaa-intro">
      <Logo />
      <div className="eaa-intro-body">
        <div className="eaa-intro-text">
          <h1 className="eaa-title">
            <Em text={c.talkTitle} />
          </h1>
          <h2 className="eaa-name">{c.name}</h2>
          <p className="eaa-role">
            {c.role}
            {c.company && <> <span className="eaa-bar">|</span> {c.company}</>}
          </p>
          {about.length > 0 && (
            <ul className="eaa-about">
              {about.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
          )}
          {c.eventName && <p className="eaa-pill">{c.eventName}</p>}
        </div>
        {c.photo && (
          <div className="eaa-photo-card">
            <Img src={c.photo} className="eaa-photo" alt={c.name} />
            <Img src={`${B}/shield-path.webp`} className="eaa-photo-doodle" />
          </div>
        )}
      </div>
    </div>
  );
}

function CertiverseSlide({ c }) {
  const points = lines(c.certiversePoints);
  return (
    <div className="eaa-s eaa-white eaa-about-cv">
      <aside className="eaa-ddd">
        {[
          ["define", "Define"],
          ["develop", "Develop"],
          ["deliver", "Deliver"],
        ].map(([img, label], i) => (
          <figure key={img} style={{ animationDelay: `${100 + i * 120}ms` }}>
            <Img src={`${B}/${img}.webp`} />
            <figcaption>{label}</figcaption>
          </figure>
        ))}
        <Img src={`${B}/mark.webp`} className="eaa-corner-mark" />
      </aside>
      <div className="eaa-panel-mint">
        <h1 className="eaa-h1">
          <Em text={c.certiverseTitle} />
        </h1>
        <ul className="eaa-arrows">
          {points.map((p, i) => {
            const { lead, rest } = leadAndRest(p);
            return (
              <li key={i} style={{ animationDelay: `${150 + i * 90}ms` }}>
                <Img src={`${B}/arrow.webp`} className="eaa-arrow" />
                <p>
                  {lead && <strong>{lead} </strong>}
                  {rest}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function AgendaSlide({ c }) {
  const items = lines(c.agendaItems);
  return (
    <div className="eaa-s eaa-white eaa-with-strip">
      <Strip doodle={`${B}/squiggle.svg`} />
      <div className="eaa-strip-main">
        <h1 className="eaa-h1">
          <Em text={c.agendaTitle} />
        </h1>
        <ol className="eaa-agenda">
          {items.map((item, i) => (
            <li key={i} style={{ animationDelay: `${120 + i * 90}ms` }}>
              <span className="eaa-num">{String(i + 1).padStart(2, "0")}</span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      </div>
      <Img src={`${B}/stars.webp`} className="eaa-stars" />
    </div>
  );
}

function DemoSlide({ c }) {
  return (
    <div className="eaa-s eaa-white eaa-with-strip">
      <Strip doodle={`${B}/deliver.webp`} />
      <div className="eaa-strip-main">
        <p className="eaa-kicker">Live demo</p>
        <h1 className="eaa-h1 eaa-big">
          <Em text={c.demoTitle} />
        </h1>
        {c.demoSubtitle && <p className="eaa-sub">{c.demoSubtitle}</p>}
        <button
          className="eaa-demo-btn"
          onClick={(e) => {
            e.stopPropagation();
            openDemo(c.demoUrl);
          }}
        >
          Open the demo →
        </button>
        <p className="eaa-hint">Press D or Enter to open it again · → for questions when you&apos;re back</p>
      </div>
      <Img src={`${B}/stars.webp`} className="eaa-stars" />
    </div>
  );
}

function QuestionsSlide({ c, qr }) {
  return (
    <div className="eaa-s eaa-mint eaa-questions">
      <Logo />
      <div className="eaa-q-body">
        <div>
          {c.questionsKicker && <p className="eaa-q-kicker">{c.questionsKicker}</p>}
          <h1 className="eaa-h1 eaa-big">
            <Em text={c.questionsTitle} />
          </h1>
          <div className="eaa-contact">
            <p className="eaa-contact-name">{c.name}</p>
            {c.email && <p>{c.email}</p>}
          </div>
        </div>
        {qr && (
          <div className="eaa-qr">
            <Img src={`${B}/badge.webp`} className="eaa-qr-badge" />
            <Img src={qr} className="eaa-qr-img" alt={`QR code: ${c.qrUrl}`} />
            {c.qrLabel && <p className="eaa-qr-label">{c.qrLabel}</p>}
            {c.showQrUrl && <p className="eaa-qr-url">{c.qrUrl.replace(/^https?:\/\//, "")}</p>}
          </div>
        )}
      </div>
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
      onClick={(e) => {
        if (e.target.closest("button, a")) return;
        // Left third goes back, the rest goes forward.
        go(e.clientX < window.innerWidth / 3 ? i - 1 : i + 1);
      }}
      onDoubleClick={enterFullscreen}
    >
      {ready && (
        <section className="eaa-slide" key={slide}>
          {slide === "intro" && <IntroSlide c={c} />}
          {slide === "certiverse" && <CertiverseSlide c={c} />}
          {slide === "agenda" && <AgendaSlide c={c} />}
          {slide === "demo" && <DemoSlide c={c} />}
          {slide === "questions" && <QuestionsSlide c={c} qr={qr} />}
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
      </div>
    </main>
  );
}
