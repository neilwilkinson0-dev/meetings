"use client";

import { useCallback, useEffect, useState } from "react";

// Everything on the eAA deck is editable from /eaa/setup. These are the
// starting values; edits are saved in this browser (localStorage), so set
// it up on the laptop you'll present from.
export const DEFAULTS = {
  // Slide 1 — intro / who I am
  eventName: "eAA 2026",
  talkTitle: "From blueprint to live exam — with AI in the loop",
  name: "Neil Wilkinson",
  role: "Director of Product & Innovation",
  company: "Certiverse",
  photo: "/media/eaa/neil.webp",
  aboutMe:
    "Builds the product that helps testing programmes write, review and deliver exams\nBased in Manchester, UK\nObsessed with making assessment tech feel simple",

  // Slide 2 — who Certiverse is
  certiverseTitle: "Who is Certiverse?",
  certiverseTagline:
    "An end-to-end platform for building and delivering high-stakes exams — faster, and with experts at the centre.",
  certiversePoints:
    "Job task analysis & blueprinting\nAI-assisted item writing & review\nSecure online delivery & proctoring\nHeadless — run our engine inside your own platform",

  // Slide 3 — what I'm going to talk about
  agendaTitle: "What we'll cover",
  agendaItems:
    "Where AI genuinely helps in exam development today\nLive demo: from blueprint to reviewed items\nWhat it means for your programme\nYour questions",

  // Slide 4 — demo
  demoTitle: "Let's see it live",
  demoSubtitle: "Switching to the demo…",
  demoUrl: "https://certiverse.com",
  autoOpenDemo: true,

  // Slide 5 — questions
  questionsTitle: "Questions?",
  questionsSubtitle: "Try Certiverse for yourself — scan to start a free trial.",
  qrUrl: "https://certiverse.com/#/trial",
  qrLabel: "Start your free trial",
  showQrUrl: false,

  // Look
  accent: "#7c5cff",
};

const KEY = "eaa-deck-config";

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
