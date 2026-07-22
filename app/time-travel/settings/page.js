"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabaseClient";

export default function Settings() {
  const [rounds, setRounds] = useState([]);
  const [entries, setEntries] = useState([]);
  const [noConfig, setNoConfig] = useState(false);
  const [question, setQuestion] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const supabase = getSupabase();
    if (!supabase) {
      setNoConfig(true);
      return;
    }
    const [{ data: r }, { data: e }] = await Promise.all([
      supabase.from("time_travel_rounds").select("*").order("created_at", { ascending: false }),
      supabase.from("time_travel_entries").select("*").order("created_at"),
    ]);
    setRounds(r ?? []);
    setEntries(e ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  const activeRound = rounds.find((r) => r.active) ?? null;

  useEffect(() => {
    setQuestion(activeRound?.question ?? "");
  }, [activeRound?.id]);

  async function startNewRound(e) {
    e?.preventDefault?.();
    const text = question.trim();
    if (!text) return;
    setSaving(true);
    const supabase = getSupabase();
    if (activeRound) {
      await supabase.from("time_travel_rounds").update({ active: false }).eq("id", activeRound.id);
    }
    await supabase.from("time_travel_rounds").insert({ question: text, active: true });
    setSaving(false);
    load();
  }

  function entriesFor(roundId) {
    return entries.filter((en) => en.round_id === roundId);
  }

  const pastRounds = rounds.filter((r) => !r.active);

  return (
    <main className="page">
      <p className="eyebrow">
        <Link href="/time-travel">← Time Travel</Link>
      </p>
      <h1 className="page-title">Settings</h1>
      <p className="subtitle">
        Set the question for the next round. Ideas already sent in stay saved
        against whichever question they answered.
      </p>

      {noConfig && (
        <div className="notice">
          Supabase isn&apos;t configured yet — add your keys to{" "}
          <code>.env.local</code> first.
        </div>
      )}

      <section className="panel" style={{ marginTop: 36 }}>
        <h2>Question</h2>
        <p className="hint">
          {activeRound
            ? "This round is live — saving a new question here ends it and starts the next one."
            : "Set a question, then open Play to put it on screen."}
        </p>
        <form className="add-col" onSubmit={startNewRound}>
          <input
            className="input"
            placeholder="If you could travel back to any year…"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <div>
            <button className="btn" type="submit" disabled={saving}>
              {activeRound ? "Start next round" : "Save & start round"}
            </button>
          </div>
        </form>
      </section>

      <section className="panel" style={{ marginTop: 26 }}>
        <h2>Past rounds</h2>
        <p className="hint">
          Everything the room&apos;s sent in, kept against the question it
          answered.
        </p>

        {pastRounds.length === 0 && (
          <p className="empty">No past rounds yet.</p>
        )}

        {pastRounds.map((r) => {
          const roundEntries = entriesFor(r.id);
          return (
            <details key={r.id} className="round-block">
              <summary>
                {r.question}
                <span className="round-meta"> — {roundEntries.length} ideas</span>
              </summary>
              <div className="entry-grid">
                {roundEntries.map((en) => (
                  <div key={en.id} className="entry-card">
                    <div className="entry-name">{en.name}</div>
                    <div className="entry-idea">{en.idea}</div>
                  </div>
                ))}
                {roundEntries.length === 0 && (
                  <p className="empty">No ideas came in for this one.</p>
                )}
              </div>
            </details>
          );
        })}
      </section>
    </main>
  );
}
