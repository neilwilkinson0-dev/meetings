"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PinGate from "../PinGate";
import { getSupabase } from "@/lib/supabaseClient";
import {
  KINDS,
  currentSection,
  goTo,
  navigate,
  pickIcebreaker,
  stepCount,
  useEvent,
} from "@/lib/event";

// Keep the phone from sleeping mid-talk.
function useWakeLock() {
  useEffect(() => {
    let lock = null;
    async function acquire() {
      try {
        lock = await navigator.wakeLock?.request("screen");
      } catch {}
    }
    acquire();
    const onVisible = () => document.visibilityState === "visible" && acquire();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      lock?.release?.().catch(() => {});
    };
  }, []);
}

function Remote() {
  const { sections, state, questions, error, loaded, updateState, setQuestions } = useEvent({
    withQuestions: true,
  });
  const [tab, setTab] = useState("live");
  const [busy, setBusy] = useState(false);
  useWakeLock();

  if (error) return <main className="page"><div className="notice">{error}</div></main>;
  if (!loaded) return <main className="ev-remote"><p className="ev-r-muted">Connecting…</p></main>;

  const section = currentSection(sections, state);
  const idx = sections.findIndex((s) => s.id === section?.id);
  const step = state?.step ?? 0;
  const data = state?.data ?? {};
  const steps = stepCount(section);
  const newQs = questions.filter((q) => q.status === "new");

  function move(dir) {
    const patch = navigate(sections, state, dir);
    if (patch) updateState(patch);
  }

  async function ice(type) {
    setBusy(true);
    const next = await pickIcebreaker(type, data);
    setBusy(false);
    if (next) updateState({ data: next });
  }

  function setData(patch) {
    updateState({ data: { ...data, ...patch } });
  }

  async function setStatus(q, status) {
    setQuestions((qs) => qs.map((x) => (x.id === q.id ? { ...x, status } : x)));
    await getSupabase().from("event_questions").update({ status }).eq("id", q.id);
    if (data.question_id === q.id) setData({ question_id: null });
  }

  function showQuestion(q) {
    // Questions only appear in a Q&A section — jump there if needed.
    if (section?.kind === "qa") return setData({ question_id: q.id });
    const qa = sections.find((s) => s.kind === "qa");
    if (!qa) return;
    const patch = goTo(qa, 0, data);
    updateState({ ...patch, data: { ...patch.data, question_id: q.id } });
    setTab("live");
  }

  const onScreen = questions.find((q) => q.id === data.question_id);

  return (
    <main className="ev-remote">
      <header className="ev-r-head">
        <div className="ev-r-now">
          <span className="ev-r-pos">
            {idx + 1}/{sections.length}
            {steps > 1 && ` · slide ${step + 1}/${steps}`}
          </span>
          <strong>{section?.title || "—"}</strong>
        </div>
        <nav className="ev-r-tabs">
          <button className={tab === "live" ? "on" : ""} onClick={() => setTab("live")}>
            Live
          </button>
          <button className={tab === "sections" ? "on" : ""} onClick={() => setTab("sections")}>
            Sections
          </button>
          <button className={tab === "questions" ? "on" : ""} onClick={() => setTab("questions")}>
            Questions{newQs.length > 0 && <span className="ev-r-badge">{newQs.length}</span>}
          </button>
        </nav>
      </header>

      {tab === "live" && (
        <section className="ev-r-body">
          {section?.kind === "icebreaker" && (
            <div className="ev-r-panel">
              <p className="ev-r-label">Ask the room: fun or serious?</p>
              <div className="ev-r-grid2">
                <button className="ev-r-big fun" disabled={busy} onClick={() => ice("fun")}>
                  🎉 Fun
                </button>
                <button className="ev-r-big serious" disabled={busy} onClick={() => ice("serious")}>
                  🤔 Serious
                </button>
              </div>
              {data.ice && (
                <>
                  <div className="ev-r-preview">
                    {data.ice.type === "serious"
                      ? data.ice.text
                      : `${data.ice.a} — or — ${data.ice.b}`}
                  </div>
                  <div className="ev-r-grid2">
                    <button className="ev-r-btn" disabled={busy} onClick={() => ice(data.ice.type)}>
                      ↻ Another {data.ice.type}
                    </button>
                    <button className="ev-r-btn" onClick={() => setData({ ice: null })}>
                      ← Back to choice
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {section?.kind === "video" && (
            <div className="ev-r-panel">
              <p className="ev-r-label">Video</p>
              <div className="ev-r-grid2">
                <button
                  className="ev-r-big fun"
                  onClick={() =>
                    setData({ video: { ...data.video, playing: !data.video?.playing } })
                  }
                >
                  {data.video?.playing ? "⏸ Pause" : "▶ Play"}
                </button>
                <button
                  className="ev-r-big"
                  onClick={() => setData({ video: { playing: true, nonce: Date.now() } })}
                >
                  ⟲ Restart
                </button>
              </div>
            </div>
          )}

          {section?.kind === "slides" && steps > 1 && (
            <div className="ev-r-panel">
              <p className="ev-r-label">Jump to slide</p>
              <div className="ev-r-thumbs">
                {section.data.images.map((src, i) => (
                  <button
                    key={src + i}
                    className={i === step ? "on" : ""}
                    onClick={() => updateState({ step: i })}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`Slide ${i + 1}`} />
                  </button>
                ))}
              </div>
            </div>
          )}

          {section?.kind === "qa" && (
            <div className="ev-r-panel">
              <p className="ev-r-label">
                {onScreen ? "On screen now" : "Tap a question to put it on screen"}
              </p>
              {onScreen && (
                <>
                  <div className="ev-r-preview">{onScreen.body}</div>
                  <div className="ev-r-grid2">
                    <button className="ev-r-btn" onClick={() => setStatus(onScreen, "answered")}>
                      ✓ Answered
                    </button>
                    <button className="ev-r-btn" onClick={() => setData({ question_id: null })}>
                      Clear screen
                    </button>
                  </div>
                </>
              )}
              <QuestionList
                questions={newQs}
                onShow={showQuestion}
                onStatus={setStatus}
                currentId={data.question_id}
              />
            </div>
          )}

          <div className="ev-r-panel ev-r-row">
            <span>QR code in the corner</span>
            <button className="ev-r-toggle" onClick={() => setData({ hide_qr: !data.hide_qr })}>
              {data.hide_qr ? "Hidden" : "Showing"}
            </button>
          </div>
        </section>
      )}

      {tab === "sections" && (
        <section className="ev-r-body">
          <ul className="ev-r-sections">
            {sections.map((s, i) => (
              <li key={s.id}>
                <button
                  className={s.id === section?.id ? "on" : ""}
                  onClick={() => {
                    updateState(goTo(s, 0, data));
                    setTab("live");
                  }}
                >
                  <span className="ev-r-num">{i + 1}</span>
                  <span className="ev-r-grow">
                    {s.title || "Untitled"}
                    <small>{KINDS[s.kind] ?? s.kind}</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="ev-r-muted">
            Reorder and edit sections in <Link href="/present/setup">setup</Link>.
          </p>
        </section>
      )}

      {tab === "questions" && (
        <section className="ev-r-body">
          <div className="ev-r-panel">
            <p className="ev-r-label">New ({newQs.length})</p>
            <QuestionList
              questions={newQs}
              onShow={showQuestion}
              onStatus={setStatus}
              currentId={data.question_id}
            />
          </div>
          {questions.some((q) => q.status !== "new") && (
            <div className="ev-r-panel">
              <p className="ev-r-label">Done</p>
              <ul className="ev-r-qs dim">
                {questions
                  .filter((q) => q.status !== "new")
                  .map((q) => (
                    <li key={q.id}>
                      <p>{q.body}</p>
                      <div className="ev-r-qmeta">
                        <span>
                          {q.status === "answered" ? "✓ answered" : "hidden"}
                          {q.name && ` · ${q.name}`}
                        </span>
                        <button onClick={() => setStatus(q, "new")}>Restore</button>
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </section>
      )}

      <footer className="ev-r-nav">
        <button className="ev-r-prev" onClick={() => move(-1)}>
          ‹ Back
        </button>
        <button className="ev-r-next" onClick={() => move(1)}>
          Next ›
        </button>
      </footer>
    </main>
  );
}

function QuestionList({ questions, onShow, onStatus, currentId }) {
  if (!questions.length) return <p className="ev-r-muted">No new questions yet.</p>;
  return (
    <ul className="ev-r-qs">
      {questions.map((q) => (
        <li key={q.id} className={q.id === currentId ? "on" : ""}>
          <p>{q.body}</p>
          <div className="ev-r-qmeta">
            <span>{q.name || "Anonymous"}</span>
            <span className="ev-r-qbtns">
              <button onClick={() => onStatus(q, "hidden")}>Hide</button>
              <button className="primary" onClick={() => onShow(q)}>
                Show
              </button>
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function RemotePage() {
  return (
    <PinGate>
      <Remote />
    </PinGate>
  );
}
