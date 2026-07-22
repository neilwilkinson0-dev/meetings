"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabaseClient";

const SEGMENT_COLOURS = ["#7a5cff", "#ff4f9a", "#43e5ff", "#ffc845"];
const SPIN_MS = 4600;

function polar(cx, cy, r, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return [cx + r * Math.sin(rad), cy - r * Math.cos(rad)];
}

function segmentPath(cx, cy, r, startDeg, endDeg) {
  const [x1, y1] = polar(cx, cy, r, startDeg);
  const [x2, y2] = polar(cx, cy, r, endDeg);
  const largeArc = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

function Wheel({ people, rotation, spinning, onSpinEnd }) {
  const n = people.length;
  const seg = 360 / n;
  const cx = 250;
  const cy = 250;
  const r = 228;

  const fontSize = n <= 6 ? 24 : n <= 10 ? 19 : n <= 14 ? 15 : 12;

  const bulbs = useMemo(() => {
    const count = 24;
    return Array.from({ length: count }, (_, i) => polar(cx, cy, 244, (360 / count) * i));
  }, []);

  return (
    <div className={`wheel-wrap ${spinning ? "spinning" : ""}`}>
      <div className="pointer" />
      <svg className="wheel-svg" viewBox="0 0 500 500" role="img" aria-label="Name wheel">
        <circle cx={cx} cy={cy} r={248} fill="#0d0930" stroke="#372b85" strokeWidth="3" />
        {bulbs.map(([x, y], i) => (
          <circle key={i} className="bulb" cx={x} cy={y} r={5} fill="#ffc845" />
        ))}
        <g
          style={{
            transform: `rotate(${rotation}deg)`,
            transformOrigin: "250px 250px",
            transition: spinning
              ? `transform ${SPIN_MS}ms cubic-bezier(0.1, 0.72, 0.12, 1)`
              : "none",
          }}
          onTransitionEnd={onSpinEnd}
        >
          {n === 1 ? (
            <circle cx={cx} cy={cy} r={r} fill={SEGMENT_COLOURS[0]} />
          ) : (
            people.map((p, i) => (
              <path
                key={p.id}
                d={segmentPath(cx, cy, r, i * seg, (i + 1) * seg)}
                fill={SEGMENT_COLOURS[i % SEGMENT_COLOURS.length]}
                stroke="#0d0930"
                strokeWidth="2.5"
              />
            ))
          )}
          {people.map((p, i) => (
            <g key={p.id} transform={`rotate(${i * seg + seg / 2} ${cx} ${cy})`}>
              <text
                x={cx}
                y={cy - r + 34}
                textAnchor="middle"
                fill="#1a1440"
                fontSize={fontSize}
                fontWeight="800"
                style={{ fontFamily: "var(--font-body), sans-serif" }}
              >
                {p.name.length > 14 ? p.name.slice(0, 13) + "…" : p.name}
              </text>
            </g>
          ))}
        </g>
        <circle cx={cx} cy={cy} r={34} fill="#0d0930" stroke="#ffc845" strokeWidth="4" />
        <text
          x={cx}
          y={cy + 7}
          textAnchor="middle"
          fill="#ffc845"
          fontSize="18"
          style={{ fontFamily: "var(--font-display), sans-serif" }}
        >
          ?
        </text>
      </svg>
    </div>
  );
}

function Sparks() {
  const sparks = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        dx: `${(Math.random() * 2 - 1) * 260}px`,
        dy: `${(Math.random() * 2 - 1) * 200}px`,
        left: `${45 + Math.random() * 10}%`,
        top: `${40 + Math.random() * 10}%`,
        char: ["✦", "✸", "★"][i % 3],
        color: ["#ff4f9a", "#43e5ff", "#ffc845"][i % 3],
      })),
    []
  );
  return sparks.map((s) => (
    <span
      key={s.id}
      className="spark"
      style={{ "--dx": s.dx, "--dy": s.dy, left: s.left, top: s.top, color: s.color }}
    >
      {s.char}
    </span>
  ));
}

export default function Play() {
  const [phase, setPhase] = useState("loading");
  // phases: loading | error | wheel | flash | reveal | choose | locked | done
  const [remaining, setRemaining] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [usedQuestionIds, setUsedQuestionIds] = useState([]);
  const [current, setCurrent] = useState(null); // person
  const [question, setQuestion] = useState(null);
  const [cyclingText, setCyclingText] = useState("");
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const sessionId = useRef(null);
  const winnerRef = useRef(null);
  const timers = useRef([]);

  useEffect(() => {
    sessionId.current = crypto.randomUUID();
    const supabase = getSupabase();
    if (!supabase) {
      setErrorMsg("Supabase isn't configured — add your keys to .env.local.");
      setPhase("error");
      return;
    }
    (async () => {
      const [{ data: p, error: pe }, { data: q, error: qe }] = await Promise.all([
        supabase.from("wyr_people").select("*").order("created_at"),
        supabase.from("wyr_questions").select("*"),
      ]);
      if (pe || qe) {
        setErrorMsg("Couldn't load the game data. Check the Supabase tables exist.");
        setPhase("error");
        return;
      }
      if (!p?.length || !q?.length) {
        setErrorMsg("Add some people and questions in Settings first.");
        setPhase("error");
        return;
      }
      setRemaining(p);
      setQuestions(q);
      setPhase("wheel");
    })();
    return () => timers.current.forEach(clearTimeout);
  }, []);

  function later(fn, ms) {
    timers.current.push(setTimeout(fn, ms));
  }

  function spin() {
    if (spinning || remaining.length === 0) return;
    const n = remaining.length;
    const seg = 360 / n;
    const winnerIndex = Math.floor(Math.random() * n);
    winnerRef.current = remaining[winnerIndex];

    const centre = winnerIndex * seg + seg / 2;
    const jitter = (Math.random() * 2 - 1) * seg * 0.3;
    const base = rotation - (rotation % 360);
    const target = base + 360 * 6 + (360 - centre + jitter);

    setSpinning(true);
    setRotation(target);
  }

  function onSpinEnd() {
    if (!spinning) return;
    setSpinning(false);
    setCurrent(winnerRef.current);
    setPhase("flash");
    later(startReveal, 2100);
  }

  function pickQuestion() {
    let pool = questions.filter((q) => !usedQuestionIds.includes(q.id));
    if (pool.length === 0) pool = questions; // recycle if the deck runs dry
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function startReveal() {
    setPhase("reveal");
    const chosen = pickQuestion();
    setQuestion(chosen);
    setUsedQuestionIds((ids) => [...ids, chosen.id]);

    // Slot-machine shuffle: flick through random questions, slowing down.
    const delays = [70, 70, 80, 90, 100, 120, 140, 170, 210, 260, 330, 420];
    let elapsed = 0;
    delays.forEach((d) => {
      elapsed += d;
      later(() => {
        const r = questions[Math.floor(Math.random() * questions.length)];
        setCyclingText(`${r.option_a} — or — ${r.option_b}`);
      }, elapsed);
    });
    later(() => setPhase("choose"), elapsed + 500);
  }

  async function choose(letter) {
    setPhase("locked");
    const supabase = getSupabase();
    if (supabase && current && question) {
      await supabase.from("wyr_responses").insert({
        session_id: sessionId.current,
        person_id: current.id,
        person_name: current.name,
        question_id: question.id,
        option_a: question.option_a,
        option_b: question.option_b,
        choice: letter,
      });
    }
    later(() => {
      const next = remaining.filter((p) => p.id !== current.id);
      setRemaining(next);
      setCurrent(null);
      setQuestion(null);
      setCyclingText("");
      setPhase(next.length === 0 ? "done" : "wheel");
    }, 1300);
  }

  if (phase === "loading") {
    return (
      <main className="stage">
        <p className="stage-count">Setting the stage…</p>
      </main>
    );
  }

  if (phase === "error") {
    return (
      <main className="page">
        <p className="eyebrow">
          <Link href="/would-you-rather">← Would You Rather</Link>
        </p>
        <div className="notice">{errorMsg}</div>
      </main>
    );
  }

  if (phase === "done") {
    return (
      <main className="stage">
        <Sparks />
        <h1 className="done-title">That&apos;s everyone!</h1>
        <div className="btn-row" style={{ marginTop: 40 }}>
          <Link href="/would-you-rather" className="btn big">
            Back to the lobby
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="stage">
      <div className="stage-topbar">
        <Link href="/would-you-rather" className="text-link">
          ← Leave the show
        </Link>
        <span className="stage-count">
          {remaining.length} still on the wheel
        </span>
      </div>

      <Wheel
        people={remaining}
        rotation={rotation}
        spinning={spinning}
        onSpinEnd={onSpinEnd}
      />

      <div className="spin-cta">
        <button className="btn big" onClick={spin} disabled={spinning}>
          {spinning ? "Round and round…" : "Spin the wheel"}
        </button>
      </div>

      {phase === "flash" && current && (
        <div className="overlay">
          <Sparks />
          <p className="flash-label">The wheel has chosen</p>
          <h1 className="flash-name">{current.name}</h1>
        </div>
      )}

      {(phase === "reveal" || phase === "choose" || phase === "locked") && (
        <div className="overlay">
          <div className="reveal-card marquee">
            <p className="q-label">
              {current?.name}, would you rather…
            </p>

            {phase === "reveal" && (
              <p className="cycling">{cyclingText || "…"}</p>
            )}

            {(phase === "choose" || phase === "locked") && question && (
              <>
                <div className="options">
                  <button
                    className="option-btn a"
                    onClick={() => choose("a")}
                    disabled={phase === "locked"}
                  >
                    {question.option_a}
                  </button>
                  <span className="vs">or</span>
                  <button
                    className="option-btn b"
                    onClick={() => choose("b")}
                    disabled={phase === "locked"}
                  >
                    {question.option_b}
                  </button>
                </div>
                {phase === "locked" && <p className="locked">✔ Locked in</p>}
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
