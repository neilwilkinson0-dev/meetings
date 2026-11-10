"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabase } from "@/lib/supabaseClient";

// Everything on the eAA deck is editable from /eaa/setup. These are the
// starting values; edits are saved in this browser (localStorage), so set
// it up on the laptop you'll present from.
export const DEFAULTS = {
  // Slide 1 — intro / who I am
  eventName: "eAA 2026",
  talkTitle: "From blueprint to test form: *a live look at AI-assisted exam development*",
  name: "Neil Wilkinson",
  role: "Director of Product",
  company: "Certiverse",
  email: "neil@certiverse.com",
  photo: "/media/eaa/neil.webp",
  aboutMe: "",

  // Slide 2 — who Certiverse is. Each point: "Bold lead. The rest."
  certiverseTitle: "Launch your next certification *in hours.*",
  certiversePoints:
    "End-to-end and self-service. Define, develop, and deliver your exams in one platform, without stitching together tools.\n" +
    "Designed by PhD psychometricians. Expertise is embedded in every workflow, every algorithm, and every validation check.\n" +
    "AI-boosted workflows. Streamlined job task analysis, automated blueprint creation, and AI-boosted content creation, plus many more, get you moving faster.\n" +
    "Ready to deliver. Exam form creation, administration, and analysis, plus an Exam Store, vouchers and promo codes, and secure delivery.",

  // Slide 3 — what I'm going to talk about
  agendaTitle: "What we'll *cover*",
  agendaItems:
    "JTA\nBlueprint\nContent\nReview\nEnemy Detection\nStandard Setting\nTranslation\nForm Creation",

  // Slide 4 — demo
  demoTitle: "Let's see it *live*",
  demoSubtitle: "Over to the platform…",

  // Slide 5 — questions
  questionsKicker: "Thank you!",
  questionsTitle: "Any questions?",
  qrUrl: "https://certiverse.com/#/trial",
  qrLabel: "Scan to start your free trial",
  showQrUrl: false,

  // Slide 6 — bonus
  breakfastKicker: "One more thing…",
  breakfastTitle: "Tim's *breakfast*",
  breakfastSub: "Victoria sponge and an Americano, Manchester",
};

const KEY = "eaa-deck-config";

// Wrap words in *asterisks* to colour them green, as in the brand decks.
export function splitEmphasis(text) {
  return String(text ?? "")
    .split(/(\*[^*]+\*)/)
    .filter(Boolean)
    .map((part) =>
      part.startsWith("*") && part.endsWith("*") ? { em: true, text: part.slice(1, -1) } : { em: false, text: part }
    );
}

// "Bold lead. The rest." -> { lead, rest }
export function leadAndRest(line) {
  const m = String(line).match(/^(.+?[.!?:])\s+(.+)$/);
  return m ? { lead: m[1], rest: m[2] } : { lead: "", rest: line };
}

export function lines(text) {
  return String(text ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export function useDeckConfig() {
  const [config, setConfig] = useState(DEFAULTS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "{}");
      setConfig({ ...DEFAULTS, ...saved });
    } catch {}
    setReady(true);

    // Keep an open deck in sync with edits made in another tab.
    const onStorage = (e) => {
      if (e.key !== KEY) return;
      try {
        setConfig({ ...DEFAULTS, ...JSON.parse(e.newValue || "{}") });
      } catch {}
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const update = useCallback((patch) => {
    setConfig((prev) => {
      const next = { ...prev, ...patch };
      // Only store what differs from the defaults, so improving a default
      // in code still reaches you unless you've changed that field.
      const diff = Object.fromEntries(
        Object.entries(next).filter(([k, v]) => DEFAULTS[k] !== v)
      );
      try {
        localStorage.setItem(KEY, JSON.stringify(diff));
      } catch {}
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(KEY);
    } catch {}
    setConfig(DEFAULTS);
  }, []);

  return { config, update, reset, ready };
}

export const SLIDES = ["intro", "certiverse", "agenda", "demo", "questions", "breakfast"];
export const SLIDE_LABELS = ["Intro", "Who is Certiverse", "What we'll cover", "Live demo", "Questions", "Tim's breakfast"];

// Phone remote <-> deck over a Supabase realtime broadcast channel. Nothing
// is stored: the remote sends "goto", the deck answers with "state" so the
// remote always shows where the deck really is.
const CHANNEL = "eaa-deck";

export function useDeckChannel({ onGoto, onState, onHello } = {}) {
  const [status, setStatus] = useState("connecting");
  const channelRef = useRef(null);
  const handlers = useRef({});
  handlers.current = { onGoto, onState, onHello };

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setStatus("unconfigured");
      return;
    }
    const channel = supabase
      .channel(CHANNEL, { config: { broadcast: { self: false } } })
      .on("broadcast", { event: "goto" }, ({ payload }) => handlers.current.onGoto?.(payload))
      .on("broadcast", { event: "state" }, ({ payload }) => handlers.current.onState?.(payload))
      .on("broadcast", { event: "hello" }, () => handlers.current.onHello?.())
      .subscribe((s) => {
        if (s === "SUBSCRIBED") {
          setStatus("connected");
          channel.send({ type: "broadcast", event: "hello", payload: {} });
        } else if (s === "CHANNEL_ERROR" || s === "TIMED_OUT" || s === "CLOSED") {
          setStatus("offline");
        }
      });
    channelRef.current = channel;
    return () => {
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, []);

  const send = useCallback((event, payload) => {
    channelRef.current?.send({ type: "broadcast", event, payload });
  }, []);

  return { status, send };
}
