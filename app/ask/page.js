"use client";

import { useState } from "react";
import Laurel from "../components/Laurel";
import { getSupabase } from "@/lib/supabaseClient";

export default function Ask() {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(0);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    const supabase = getSupabase();
    if (!supabase) return setError("This page isn't set up yet.");
    setSending(true);
    setError("");
    const { error } = await supabase
      .from("event_questions")
      .insert({ body: text.slice(0, 500) });
    setSending(false);
    if (error) return setError("Couldn't send that — please try again.");
    setBody("");
    setSent((n) => n + 1);
  }

  return (
    <main className="ev-ask">
      <header className="ev-ask-hero">
        <Laurel size={52} />
        <p className="ev-ask-kicker">EATP 2026 · Rome</p>
        <h1 className="ev-ask-title">Ask us anything</h1>
      </header>

      <div className="ev-ask-body">
        <p className="ev-ask-lead">
          No jargon, no judgement. Send a question and we&apos;ll pick some to answer live.
        </p>

        {sent > 0 && (
          <div className="ev-ask-sent">
            ✓ Sent! The presenter will pick questions to answer. Feel free to ask another.
          </div>
        )}

        <form className="ev-ask-form" onSubmit={submit}>
          <textarea
            className="input"
            rows={4}
            maxLength={500}
            placeholder="Type your question…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            autoFocus
          />
          <button className="btn big" type="submit" disabled={sending || !body.trim()}>
            {sending ? "Sending…" : "Send question"}
          </button>
          {error && <p className="ev-error">{error}</p>}
        </form>
      </div>
    </main>
  );
}
