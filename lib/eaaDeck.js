"use client";

import { useCallback, useEffect, useState } from "react";

// Everything on the eAA deck is editable from /eaa/setup. These are the
// starting values; edits are saved in this browser (localStorage), so set
// it up on the laptop you'll present from.
export const DEFAULTS = {
  // Slide 1 — intro / who I am
  eventName: "eAA 2026",
  talkTitle: "From blueprint to live exam — *with AI in the loop*",
  name: "Neil Wilkinson",
  role: "Sr. Director of Product",
  company: "Certiverse",
  email: "neil@certiverse.com",
  photo: "/media/eaa/neil.webp",
  aboutMe: "Based in Manchester, UK\nBuilding the tools programmes use to define, develop and deliver exams",

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
    "Where AI genuinely helps in exam development today\nLive demo: from blueprint to reviewed items\nWhat it means for your programme\nYour questions",

  // Slide 4 — demo
  demoTitle: "Let's see it *live*",
  demoSubtitle: "Switching to the demo…",
  demoUrl: "https://certiverse.com",
  autoOpenDemo: true,

  // Slide 5 — questions
  questionsKicker: "Thank you!",
  questionsTitle: "Any questions?",
  qrUrl: "https://certiverse.com/#/trial",
  qrLabel: "Scan to start your free trial",
  showQrUrl: false,
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
