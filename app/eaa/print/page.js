"use client";

import { useEffect, useRef, useState } from "react";
import { SLIDES, useDeckConfig } from "@/lib/eaaDeck";
import { Slide, useQr } from "../Slides";

// All five slides as 16:9 pages, for saving as a PDF. Uses this browser's
// edits from /eaa/setup. Opened with ?download, it brings up the print
// dialog by itself once the fonts, images and QR code are ready.
export default function PrintDeck() {
  const { config: c, ready } = useDeckConfig();
  const qr = useQr(c.qrUrl);
  const [loaded, setLoaded] = useState(false);
  const printed = useRef(false);

  useEffect(() => {
    if (!ready || !qr) return;
    let cancelled = false;
    (async () => {
      await document.fonts?.ready;
      await Promise.all(
        [...document.images].map((img) =>
          img.complete ? null : new Promise((r) => img.addEventListener("load", r, { once: true }) || img.addEventListener("error", r, { once: true }))
        )
      );
      if (cancelled) return;
      setLoaded(true);
      if (!printed.current && new URLSearchParams(location.search).has("download")) {
        printed.current = true;
        setTimeout(() => window.print(), 300);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, qr]);

  return (
    <main className="eaa-deck eaa-print" data-ready={loaded ? "true" : "false"}>
      <div className="eaa-print-bar">
        <a href="/eaa">← eAA deck</a>
        <span>
          {loaded
            ? "Choose “Save as PDF” as the printer. Pages are already 16:9 with no margins."
            : "Getting the slides ready…"}
        </span>
        <button className="eaa-print-btn" disabled={!loaded} onClick={() => window.print()}>
          Save as PDF
        </button>
      </div>
      {ready &&
        SLIDES.map((id) => (
          <section className="eaa-print-page" key={id}>
            <Slide id={id} c={c} qr={qr} />
          </section>
        ))}
    </main>
  );
}
