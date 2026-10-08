"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import Laurel from "../../components/Laurel";
import { getSupabase } from "@/lib/supabaseClient";
import { currentSection, funText, useEvent, youTubeId } from "@/lib/event";

function useQr(path) {
  const [qr, setQr] = useState({ src: "" });
  useEffect(() => {
    QRCode.toDataURL(`${window.location.origin}${path}`, { margin: 1, width: 600 }).then((src) =>
      setQr({ src })
    );
  }, [path]);
  return qr;
}

function BigQr({ qr, label }) {
  if (!qr.src) return null;
  return (
    <div className="ev-bigqr">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={qr.src} alt="QR code" />
      <p className="ev-bigqr-label">{label}</p>
    </div>
  );
}

// Heading, subheading and the optional "text underneath" lines.
function Heading({ section }) {
  const lines = (section.data?.body ?? "").split("\n").filter((l) => l.trim());
  return (
    <>
      <h1 className="ev-h1">{section.title}</h1>
      {section.subtitle && <p className="ev-sub">{section.subtitle}</p>}
      {lines.length > 0 && (
        <div className="ev-body">
          {lines.map((l, i) => (
            <p key={i}>{l}</p>
          ))}
        </div>
      )}
    </>
  );
}

function TitleSection({ section, qr }) {
  return (
    <div className={`ev-title ${section.data?.show_big_qr ? "with-qr" : ""}`}>
      <div>
        <Laurel size={88} />
        <Heading section={section} />
      </div>
      {section.data?.show_big_qr && <BigQr qr={qr} label="Scan to ask us anything" />}
    </div>
  );
}

function TextSection({ section }) {
  const bullets = section.data?.bullets ?? [];
  const image = section.data?.image;
  return (
    <div className={`ev-text ${image ? "with-image" : ""}`}>
      <div>
        <h1 className="ev-h1">{section.title}</h1>
        {section.subtitle && <p className="ev-sub">{section.subtitle}</p>}
        {bullets.length > 0 && (
          <ul className="ev-bullets">
            {bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        )}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {image && <img className="ev-text-img" src={image} alt="" />}
    </div>
  );
}

function SlidesSection({ section, step }) {
  const images = section.data?.images ?? [];
  if (!images.length) {
    return (
      <div className="ev-title">
        <div>
          <Heading section={section} />
        </div>
      </div>
    );
  }
  const i = Math.min(step, images.length - 1);
  return (
    <div className="ev-slides">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img key={images[i]} className="ev-slide" src={images[i]} alt={`Slide ${i + 1}`} />
      {/* Preload the next slide so Next is instant. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {images[i + 1] && <img src={images[i + 1]} alt="" style={{ display: "none" }} />}
    </div>
  );
}

function VideoSection({ section, video }) {
  const url = section.data?.url ?? "";
  const yt = youTubeId(url);
  const ref = useRef(null);
  const playing = !!video?.playing;
  const nonce = video?.nonce;

  // Restart from the top whenever the remote sends a new nonce.
  useEffect(() => {
    if (ref.current && !yt) ref.current.currentTime = 0;
    if (yt) ytCommand(ref.current, "seekTo", [0, true]);
  }, [nonce, yt]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (yt) {
      ytCommand(el, playing ? "playVideo" : "pauseVideo");
    } else if (playing) {
      el.play().catch(() => {});
    } else {
      el.pause();
    }
  }, [playing, yt, nonce]);

  if (!url) {
    return (
      <div className="ev-title">
        <div>
          <Heading section={section} />
        </div>
      </div>
    );
  }

  if (yt) {
    return (
      <div className="ev-video">
        <iframe
          ref={ref}
          src={`https://www.youtube.com/embed/${yt}?enablejsapi=1&controls=0&rel=0&modestbranding=1&playsinline=1`}
          allow="autoplay; encrypted-media; fullscreen"
          title={section.title}
          onLoad={() => playing && ytCommand(ref.current, "playVideo")}
        />
      </div>
    );
  }

  return (
    <div className="ev-video">
      <video ref={ref} src={url} playsInline preload="auto" />
    </div>
  );
}

function ytCommand(iframe, func, args = []) {
  iframe?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args }), "*");
}

const SPIN_MS = 2200;

function IcebreakerSection({ section, ice, pools }) {
  const [spinning, setSpinning] = useState(false);
  const [cycling, setCycling] = useState("");
  const lastNonce = useRef(ice?.nonce);
  const latest = useRef({ ice, pools });
  latest.current = { ice, pools };
  const nonce = ice?.nonce;

  // Keyed on the nonce, not the ice object, which is recreated on every poll.
  useEffect(() => {
    const { ice, pools } = latest.current;
    if (!ice || nonce === lastNonce.current) return;
    lastNonce.current = nonce;
    const pool = ice.type === "serious" ? pools.serious : pools.fun;
    if (!pool.length) return;
    setSpinning(true);
    const tick = setInterval(() => {
      setCycling(pool[Math.floor(Math.random() * pool.length)]);
    }, 90);
    const stop = setTimeout(() => {
      clearInterval(tick);
      setSpinning(false);
    }, SPIN_MS);
    return () => {
      clearInterval(tick);
      clearTimeout(stop);
      setSpinning(false);
    };
  }, [nonce]);

  if (!ice) {
    return (
      <div className="ev-ice">
        <h1 className="ev-h1">{section.title}</h1>
        <p className="ev-sub">{section.subtitle || "Fun or serious?"}</p>
        <div className="ev-ice-choices">
          <div className="ev-ice-card fun">
            <span className="ev-ice-emoji">🎉</span>Fun
          </div>
          <div className="ev-ice-or">or</div>
          <div className="ev-ice-card serious">
            <span className="ev-ice-emoji">🤔</span>Serious
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ev-ice">
      <p className={`ev-ice-tag ${ice.type}`}>
        {ice.type === "serious" ? "🤔 Serious" : "🎉 Fun"}
        {ice.audience && " · from the room"}
      </p>
      {spinning ? (
        <p className="ev-ice-cycling">{cycling}</p>
      ) : ice.text ? (
        <h1 className="ev-ice-q pop">{ice.text}</h1>
      ) : (
        <div className="ev-ice-wyr pop">
          <p className="ev-ice-lead">Would you rather…</p>
          <div className="ev-ice-options">
            <div className="ev-ice-opt">{ice.a}</div>
            <div className="ev-ice-or">or</div>
            <div className="ev-ice-opt">{ice.b}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function QaSection({ section, question, count, qr }) {
  if (question) {
    return (
      <div className="ev-qa-show">
        <p className="ev-ice-tag serious">Question from the room</p>
        <h1 className="ev-qa-q pop" key={question.id}>
          “{question.body}”
        </h1>
      </div>
    );
  }
  return (
    <div className="ev-title with-qr">
      <div>
        <h1 className="ev-h1">{section.title}</h1>
        <p className="ev-sub">{section.subtitle || "Scan the code to ask"}</p>
        <p className="ev-qa-count">
          {count} question{count === 1 ? "" : "s"} in so far
        </p>
      </div>
      <BigQr qr={qr} label="Scan to ask a question" />
    </div>
  );
}

export default function Screen() {
  const { sections, state, questions, error, loaded } = useEvent({ withQuestions: true });
  const [started, setStarted] = useState(false);
  const [pools, setPools] = useState({ fun: [], serious: [] });
  const qr = useQr("/ask");

  // Text for the ice breaker's slot-machine shuffle.
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    Promise.all([
      supabase.from("fun_questions").select("option_a, option_b, text"),
      supabase.from("serious_questions").select("text"),
    ]).then(([f, s]) =>
      setPools({
        fun: (f.data ?? []).map(funText),
        serious: (s.data ?? []).map((r) => r.text),
      })
    );
  }, []);

  const section = currentSection(sections, state);
  const data = state?.data ?? {};
  const question = useMemo(
    () => questions.find((q) => q.id === data.question_id) ?? null,
    [questions, data.question_id]
  );

  function start() {
    // This click is also what lets the video play with sound later.
    document.documentElement.requestFullscreen?.().catch(() => {});
    setStarted(true);
  }

  if (error) {
    return (
      <main className="page">
        <div className="notice">{error}</div>
      </main>
    );
  }

  if (!started) {
    return (
      <main className="ev-screen ev-start" onClick={start}>
        <Laurel size={88} />
        <h1 className="ev-h1">Ready to present</h1>
        <p className="ev-sub">
          {loaded ? "Click anywhere to go full screen and start." : "Loading…"}
        </p>
        <p className="ev-start-hint">
          Then drive everything from <strong>/present/remote</strong> on your phone.
        </p>
      </main>
    );
  }

  const bigQrShowing =
    (section?.kind === "title" && section.data?.show_big_qr) ||
    (section?.kind === "qa" && !question);
  const showCornerQr =
    !data.hide_qr && !section?.data?.hide_qr && !bigQrShowing && section?.kind !== "video";

  return (
    <main className="ev-screen" onDoubleClick={start}>
      <div className="ev-stage" key={section?.id}>
        {!section && <p className="ev-sub">No sections yet — add some in /present/setup.</p>}
        {section?.kind === "title" && <TitleSection section={section} qr={qr} />}
        {section?.kind === "text" && <TextSection section={section} />}
        {section?.kind === "slides" && <SlidesSection section={section} step={state?.step ?? 0} />}
        {section?.kind === "video" && <VideoSection section={section} video={data.video} />}
        {section?.kind === "icebreaker" && (
          <IcebreakerSection section={section} ice={data.ice} pools={pools} />
        )}
        {section?.kind === "qa" && (
          <QaSection
            section={section}
            question={question}
            count={questions.length}
            qr={qr}
          />
        )}
      </div>

      {showCornerQr && qr.src && (
        <div className="ev-cornerqr">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr.src} alt="QR code to ask a question" />
          <span>
            Got a question?
            <br />
            Scan to ask
          </span>
        </div>
      )}
    </main>
  );
}
