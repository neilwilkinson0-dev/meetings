"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { getSupabase } from "@/lib/supabaseClient";

const ROUND_SECONDS = 60;

export default function Play() {
  const [phase, setPhase] = useState("loading");
  // phases: loading | error | idle | live
  const [round, setRound] = useState(null);
  const [entries, setEntries] = useState([]);
  const [remaining, setRemaining] = useState(ROUND_SECONDS);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const entriesTimer = useRef(null);
  const tickTimer = useRef(null);

  async function fetchEntries(roundId) {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("time_travel_entries")
      .select("*")
      .eq("round_id", roundId)
      .order("created_at");
    setEntries(data ?? []);
  }

  async function loadActiveRound() {
    const supabase = getSupabase();
    if (!supabase) {
      setErrorMsg("Supabase isn't configured — add your keys to .env.local.");
      setPhase("error");
      return;
    }
    const { data, error } = await supabase
      .from("time_travel_rounds")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(1);
    if (error) {
      setErrorMsg("Couldn't load the round. Check the Supabase tables exist.");
      setPhase("error");
      return;
    }
    let active = data?.[0] ?? null;
    if (!active) {
      setPhase("idle");
      return;
    }
    if (!active.started_at) {
      const started_at = new Date().toISOString();
      await supabase.from("time_travel_rounds").update({ started_at }).eq("id", active.id);
      active = { ...active, started_at };
    }
    setRound(active);
    setPhase("live");
    fetchEntries(active.id);
  }

  useEffect(() => {
    loadActiveRound();
    return () => {
      clearInterval(entriesTimer.current);
      clearInterval(tickTimer.current);
    };
  }, []);

  useEffect(() => {
    if (phase !== "live" || !round) return;
    const startedAt = new Date(round.started_at).getTime();

    function tick() {
      const left = ROUND_SECONDS - Math.floor((Date.now() - startedAt) / 1000);
      setRemaining(Math.max(0, left));
    }
    tick();
    tickTimer.current = setInterval(tick, 1000);
    entriesTimer.current = setInterval(() => fetchEntries(round.id), 3000);

    return () => {
      clearInterval(tickTimer.current);
      clearInterval(entriesTimer.current);
    };
  }, [phase, round]);

  useEffect(() => {
    if (!round) return;
    const url = `${window.location.origin}/time-travel/submit`;
    QRCode.toDataURL(url, { margin: 1, width: 400 }).then(setQrDataUrl);
  }, [round]);

  async function resetRound() {
    clearInterval(entriesTimer.current);
    clearInterval(tickTimer.current);
    const supabase = getSupabase();
    if (round) {
      await supabase.from("time_travel_rounds").update({ active: false }).eq("id", round.id);
    }
    setRound(null);
    setEntries([]);
    setQrDataUrl("");
    setRemaining(ROUND_SECONDS);
    setPhase("idle");
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
          <Link href="/time-travel">← Time Travel</Link>
        </p>
        <div className="notice">{errorMsg}</div>
      </main>
    );
  }

  if (phase === "idle") {
    return (
      <main className="stage">
        <p className="eyebrow">
          <Link href="/time-travel">← Time Travel</Link>
        </p>
        <h1 className="done-title">No question set</h1>
        <div className="btn-row" style={{ marginTop: 30 }}>
          <Link href="/time-travel/settings" className="btn big">
            Set a question
          </Link>
        </div>
      </main>
    );
  }

  const revealed = remaining <= 0;

  return (
    <main className="stage">
      <div className="stage-topbar">
        <div className="topbar-left">
          <Link href="/time-travel" className="text-link">
            ← Leave the show
          </Link>
          <button className="text-link reset-link" onClick={resetRound}>
            ↺ Reset
          </button>
        </div>
        <div className="topbar-right">
          <span className="stage-count">{entries.length} ideas in</span>
        </div>
      </div>

      <h1 className="question-banner">{round.question}</h1>

      {qrDataUrl && (
        <div className="qr-wrap">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="QR code to submit an idea" />
        </div>
      )}
      <p className="scan-hint">Scan to send in your idea</p>

      {!revealed && (
        <p className="countdown" style={{ marginTop: 30 }}>
          {String(Math.floor(remaining / 60)).padStart(1, "0")}:
          {String(remaining % 60).padStart(2, "0")}
        </p>
      )}

      {revealed && (
        <div className="entry-grid">
          {entries.map((en) => (
            <div key={en.id} className="entry-card marquee">
              <div className="entry-name">{en.name}</div>
              <div className="entry-idea">{en.idea}</div>
            </div>
          ))}
          {entries.length === 0 && (
            <p className="empty">No ideas sent in yet — the QR code's still open.</p>
          )}
        </div>
      )}
    </main>
  );
}
