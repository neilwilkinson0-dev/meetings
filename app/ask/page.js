"use client";

import { useState } from "react";
import Laurel from "../components/Laurel";
import { getSupabase } from "@/lib/supabaseClient";
import { AUDIENCE } from "@/lib/event";

const TYPES = {
  serious: {
    label: "Serious",
    sub: "Work related. This is definitely what we're here for. You really should be asking this sort of question.",
    emoji: "🤔",
    table: "serious_questions",
    prompt: "Ask us anything about AI in certification.",
    placeholder: "Type your question…",
  },
  fun: {
    label: "Fun",
    sub: "OK, go on then. Anything goes.",
    emoji: "🎉",
    table: "fun_questions",
    prompt: "Give us a fun question to answer.",
    placeholder: "e.g. Would you rather… or…?",
  },
};

export default function Ask() {
  const [type, setType] = useState(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(0);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    const text = body.trim();
    if (!text || !type) return;
    const supabase = getSupabase();
    if (!supabase) return setError("This page isn't set up yet.");
    setSending(true);
    setError("");
    // Goes straight into that ice breaker list; questions from the room
    // are drawn before the presenters' own.
    const { error } = await supabase
      .from(TYPES[type].table)
      .insert({ text: text.slice(0, 500), source: AUDIENCE });
    setSending(false);
    if (error) return setError("Couldn't send that — please try again.");
    setBody("");
    setSent((n) => n + 1);
  }

  function choose(next) {
    setType(next);
    setSent(0);
    setError("");
  }

  return (
    <main className="ev-ask">
      <header className="ev-ask-hero">
        <Laurel size={52} />
        <p className="ev-ask-kicker">EATP 2026 · Rome</p>
        <h1 className="ev-ask-title">Ask us anything</h1>
      </header>

      <div className="ev-ask-body">
        {!type ? (
          <>
            <p className="ev-ask-lead">
              No jargon, no judgement. What kind of question have you got? Questions from the
              room get picked first.
            </p>
            <div className="ev-ask-choices">
              {Object.entries(TYPES).map(([key, t]) => (
                <button key={key} className={`ev-ask-choice ${key}`} onClick={() => choose(key)}>
                  <span className="ev-ask-choice-emoji">{t.emoji}</span>
                  <span>
                    <strong>{t.label}</strong>
                    <small>{t.sub}</small>
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <button className="ev-ask-back" onClick={() => choose(null)}>
              ‹ {TYPES[type].emoji} {TYPES[type].label} · change
            </button>
            <p className="ev-ask-lead">{TYPES[type].prompt}</p>

            {sent > 0 && (
              <div className="ev-ask-sent">
                ✓ Sent! It&apos;s in the mix, and questions from the room get picked first. Ask
                another?
              </div>
            )}

            <form className="ev-ask-form" onSubmit={submit}>
              <textarea
                className="input"
                rows={4}
                maxLength={500}
                placeholder={TYPES[type].placeholder}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                autoFocus
              />
              <button className="btn big" type="submit" disabled={sending || !body.trim()}>
                {sending ? "Sending…" : "Send question"}
              </button>
              {error && <p className="ev-error">{error}</p>}
            </form>
          </>
        )}
      </div>
    </main>
  );
}
