"use client";

import { useEffect, useState } from "react";
import Logo from "../components/Logo";
import { getSupabase } from "@/lib/supabaseClient";

export default function Ask() {
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      setName(localStorage.getItem("ask-name") || "");
    } catch {}
  }, []);

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
      .insert({ name: name.trim().slice(0, 60), body: text.slice(0, 500) });
    setSending(false);
    if (error) return setError("Couldn't send that — please try again.");
    try {
      localStorage.setItem("ask-name", name.trim());
    } catch {}
    setBody("");
    setSent((n) => n + 1);
  }

  return (
    <main className="page ev-ask">
      <div className="hero-top">
        <Logo />
      </div>
      <p className="eyebrow">Ask a question</p>
      <h1 className="page-title">What would you like to ask?</h1>

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
        <input
          className="input"
          maxLength={60}
          placeholder="Your name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="btn big" type="submit" disabled={sending || !body.trim()}>
          {sending ? "Sending…" : "Send question"}
        </button>
        {error && <p className="ev-error">{error}</p>}
      </form>
    </main>
  );
}
