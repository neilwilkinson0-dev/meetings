"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";

export default function Submit() {
  const [phase, setPhase] = useState("loading");
  // phases: loading | error | none | form | sent
  const [round, setRound] = useState(null);
  const [name, setName] = useState("");
  const [idea, setIdea] = useState("");
  const [sending, setSending] = useState(false);

  async function load() {
    const supabase = getSupabase();
    if (!supabase) {
      setPhase("error");
      return;
    }
    const { data } = await supabase
      .from("time_travel_rounds")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(1);
    if (!data?.[0]) {
      setPhase("none");
      return;
    }
    setRound(data[0]);
    setPhase("form");
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e) {
    e.preventDefault();
    const n = name.trim();
    const i = idea.trim();
    if (!n || !i || !round) return;
    setSending(true);
    const supabase = getSupabase();
    await supabase.from("time_travel_entries").insert({
      round_id: round.id,
      name: n,
      idea: i,
    });
    setSending(false);
    setIdea("");
    setPhase("sent");
  }

  if (phase === "loading") {
    return (
      <main className="page">
        <p className="subtitle">Loading…</p>
      </main>
    );
  }

  if (phase === "error") {
    return (
      <main className="page">
        <div className="notice">
          Supabase isn&apos;t configured — add your keys to{" "}
          <code>.env.local</code>.
        </div>
      </main>
    );
  }

  if (phase === "none") {
    return (
      <main className="page">
        <h1 className="page-title">No round running</h1>
        <p className="subtitle">
          Ask the host to start a round, then reload this page.
        </p>
      </main>
    );
  }

  if (phase === "sent") {
    return (
      <main className="page">
        <h1 className="page-title">Thanks!</h1>
        <p className="subtitle">Your idea's on the big screen.</p>
        <div className="panel" style={{ marginTop: 26 }}>
          <h2>{round.question}</h2>
          <button
            className="btn"
            style={{ marginTop: 18 }}
            onClick={() => setPhase("form")}
          >
            Send another idea
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <p className="eyebrow">Time Travel</p>
      <h1 className="page-title">{round.question}</h1>

      <form className="panel add-col" style={{ marginTop: 30 }} onSubmit={submit}>
        <input
          className="input"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <textarea
          className="input"
          rows={4}
          placeholder="Your idea…"
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
        />
        <div>
          <button className="btn" type="submit" disabled={sending}>
            {sending ? "Sending…" : "Send it"}
          </button>
        </div>
      </form>
    </main>
  );
}
