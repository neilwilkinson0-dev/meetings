"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";

export const KINDS = {
  title: "Title screen",
  text: "Heading + bullets",
  slides: "Slides (images)",
  video: "Video",
  icebreaker: "Ice breaker",
  qa: "Audience Q&A",
};

export const MEDIA_BUCKET = "event-media";

// How often the screen and remote re-fetch, as a fallback for venue wifi
// dropping the realtime socket.
const POLL_MS = 2500;

export function toRoman(n) {
  const map = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"],
    [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let out = "";
  for (const [v, s] of map) while (n >= v) { out += s; n -= v; }
  return out;
}

export function stepCount(section) {
  if (section?.kind === "slides") return Math.max(1, section.data?.images?.length ?? 0);
  return 1;
}

// Sections, live state and (optionally) audience questions, kept fresh via
// Supabase realtime with a polling fallback.
export function useEvent({ withQuestions = false } = {}) {
  const [sections, setSections] = useState([]);
  const [state, setState] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) {
      setError("Supabase isn't configured — add your keys to .env.local.");
      return;
    }
    const [s, st, q] = await Promise.all([
      supabase.from("event_sections").select("*").order("position"),
      supabase.from("event_state").select("*").eq("id", 1).maybeSingle(),
      withQuestions ? loadAudienceQuestions(supabase) : Promise.resolve(null),
    ]);
    if (s.error || st.error) {
      setError("Couldn't load the event. Check supabase/event_schema.sql has been run.");
      return;
    }
    setError("");
    setSections(s.data ?? []);
    setState((prev) => newer(prev, st.data));
    if (withQuestions && q) setQuestions(q);
    setLoaded(true);
  }, [withQuestions]);

  useEffect(() => {
    load();
    const supabase = getSupabase();
    if (!supabase) return;
    const channel = supabase
      .channel(`event-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "event_state" }, (p) => {
        if (p.new?.id === 1) setState((prev) => newer(prev, p.new));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "event_sections" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "fun_questions" }, () => {
        if (withQuestions) load();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "serious_questions" }, () => {
        if (withQuestions) load();
      })
      .subscribe();
    const poll = setInterval(load, POLL_MS);
    return () => {
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [load, withQuestions]);

  // Optimistic local update + write-through.
  const updateState = useCallback(async (patch) => {
    const next = { ...patch, updated_at: new Date().toISOString() };
    setState((prev) => ({ ...prev, ...next }));
    const supabase = getSupabase();
    await supabase.from("event_state").update(next).eq("id", 1);
  }, []);

  return { sections, state, questions, error, loaded, reload: load, updateState, setQuestions };
}

// Questions the room sent in from /ask. They go straight into the ice
// breaker lists (fun_questions / serious_questions) marked source =
// "audience"; this gathers both into one newest-first list.
export const AUDIENCE = "audience";

export function funText(r) {
  return r.text || `${r.option_a} — or — ${r.option_b}`;
}

async function loadAudienceQuestions(supabase) {
  const [f, s] = await Promise.all([
    supabase.from("fun_questions").select("*").eq("source", AUDIENCE),
    supabase.from("serious_questions").select("*").eq("source", AUDIENCE),
  ]);
  if (f.error || s.error) return null;
  return [
    ...(f.data ?? []).map((r) => ({ id: r.id, type: "fun", body: funText(r), created_at: r.created_at })),
    ...(s.data ?? []).map((r) => ({ id: r.id, type: "serious", body: r.text, created_at: r.created_at })),
  ].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export async function removeAudienceQuestion(q) {
  const table = q.type === "fun" ? "fun_questions" : "serious_questions";
  await getSupabase().from(table).delete().eq("id", q.id);
}

// Keep whichever copy of the state row was written last, so a slow poll
// can't undo an optimistic update from this device.
function newer(prev, next) {
  if (!prev || !next) return next ?? prev;
  return new Date(next.updated_at) >= new Date(prev.updated_at) ? next : prev;
}

export function currentSection(sections, state) {
  if (!sections.length) return null;
  return sections.find((s) => s.id === state?.section_id) ?? sections[0];
}

// Next/previous across slide steps and sections. Returns a state patch, or
// null if already at the end.
export function navigate(sections, state, dir) {
  const section = currentSection(sections, state);
  if (!section) return null;
  const idx = sections.findIndex((s) => s.id === section.id);
  const step = state?.step ?? 0;
  const data = state?.data ?? {};
  if (dir > 0) {
    if (step < stepCount(section) - 1) return { step: step + 1 };
    const next = sections[idx + 1];
    return next ? goTo(next, 0, data) : null;
  }
  if (step > 0) return { step: step - 1 };
  const prev = sections[idx - 1];
  return prev ? goTo(prev, stepCount(prev) - 1, data) : null;
}

// Moving section resets per-section bits (video playing, question on
// screen) but keeps things like the ice breaker's used list.
export function goTo(section, step = 0, data = {}) {
  return {
    section_id: section.id,
    step,
    data: {
      ...data,
      video: { playing: false, nonce: Date.now() },
      question_id: null,
      ice: null,
    },
  };
}

export async function pickIcebreaker(type, data = {}) {
  const supabase = getSupabase();
  const used = data.ice_used ?? [];
  const table = type === "serious" ? "serious_questions" : "fun_questions";
  const { data: rows } = await supabase.from(table).select("*");
  const pool = (rows ?? []).map((r) => {
    const q = { id: r.id, type, audience: r.source === AUDIENCE, created_at: r.created_at };
    // Fun questions are either a typed question or a would-you-rather pair.
    return r.text ? { ...q, text: r.text } : { ...q, a: r.option_a, b: r.option_b };
  });
  if (!pool.length) return null;
  let fresh = pool.filter((q) => !used.includes(q.id));
  let nextUsed = used;
  if (!fresh.length) {
    // Everything of this type has been asked — start that type over.
    const ids = new Set(pool.map((q) => q.id));
    nextUsed = used.filter((id) => !ids.has(id));
    fresh = pool;
  }
  // Questions from the room go first, oldest first; then a random one of ours.
  const fromRoom = fresh
    .filter((q) => q.audience)
    .sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
  const pick = fromRoom[0] ?? fresh[Math.floor(Math.random() * fresh.length)];
  return {
    ...data,
    ice: { ...pick, nonce: Date.now() },
    ice_used: [...nextUsed, pick.id],
  };
}

export function mediaUrl(path) {
  const supabase = getSupabase();
  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function uploadMedia(file) {
  const supabase = getSupabase();
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return mediaUrl(path);
}

export function youTubeId(url) {
  const m = String(url || "").match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
  );
  return m ? m[1] : null;
}

// A tiny deterrent so a passer-by who guesses the URL can't drive the
// screen. Set NEXT_PUBLIC_PRESENTER_PIN in Vercel; leave unset to disable.
export function usePinGate() {
  const pin = process.env.NEXT_PUBLIC_PRESENTER_PIN || "";
  const [ok, setOk] = useState(!pin);
  const tried = useRef(false);
  useEffect(() => {
    if (!pin || tried.current) return;
    tried.current = true;
    try {
      if (localStorage.getItem("presenter-pin") === pin) setOk(true);
    } catch {}
  }, [pin]);
  function attempt(value) {
    if (value === pin) {
      try {
        localStorage.setItem("presenter-pin", value);
      } catch {}
      setOk(true);
      return true;
    }
    return false;
  }
  // Forget the PIN on this device (it's shared by setup and the remote).
  function lock() {
    try {
      localStorage.removeItem("presenter-pin");
    } catch {}
    window.location.reload();
  }
  return { ok, attempt, lock, enabled: !!pin };
}

// Keep the device's screen from dimming or sleeping while the page is
// open (the phone remote and the projector laptop). The lock drops when
// the tab is hidden, so take it again when it comes back.
export function useWakeLock(active = true) {
  useEffect(() => {
    if (!active) return;
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
  }, [active]);
}
