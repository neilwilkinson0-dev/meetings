"use client";

// The five slides, shared by the live deck (/eaa/deck) and the PDF page
// (/eaa/print) so both always show the same thing.
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { leadAndRest, lines, splitEmphasis } from "@/lib/eaaDeck";

export function useQr(url) {
  const [src, setSrc] = useState("");
  useEffect(() => {
    if (!url) return setSrc("");
    QRCode.toDataURL(url, { margin: 1, width: 800, errorCorrectionLevel: "M" })
      .then(setSrc)
      .catch(() => setSrc(""));
  }, [url]);
  return src;
}

const B = "/media/eaa/brand";

// Text with *asterisk* words picked out in brand green.
function Em({ text }) {
  return splitEmphasis(text).map((p, i) => {
    const Tag = p.em ? "em" : "span";
    return <Tag key={i}>{noBreakHyphens(p.text)}</Tag>;
  });
}

// Keep words like "AI-assisted" on one line instead of breaking at the hyphen.
function noBreakHyphens(text) {
  return text.split(/(\S+-\S+)/).map((w, i) =>
    i % 2 ? (
      <span key={i} style={{ whiteSpace: "nowrap" }}>
        {w}
      </span>
    ) : (
      w
    )
  );
}

function Img({ src, className, alt = "" }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} className={className} alt={alt} draggable={false} />;
}

function Logo() {
  return <Img src={`${B}/logo.webp`} className="eaa-logo" alt="Certiverse" />;
}

// Mint side strip with a doodle and the mark at the foot, as on the
// brand's section slides.
function Strip({ doodle }) {
  return (
    <aside className="eaa-strip">
      <Img src={doodle} className="eaa-strip-doodle" />
      <span className="eaa-strip-mark">
        <Img src={`${B}/mark.webp`} />
      </span>
    </aside>
  );
}

function IntroSlide({ c }) {
  const about = lines(c.aboutMe);
  return (
    <div className="eaa-s eaa-mint eaa-intro">
      <Logo />
      <div className="eaa-intro-body">
        <div className="eaa-intro-text">
          <h1 className="eaa-title">
            <Em text={c.talkTitle} />
          </h1>
          <h2 className="eaa-name">{c.name}</h2>
          <p className="eaa-role">
            {c.role}
            {c.company && <> <span className="eaa-bar">|</span> {c.company}</>}
          </p>
          {about.length > 0 && (
            <ul className="eaa-about">
              {about.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
          )}
          {c.eventName && <p className="eaa-pill">{c.eventName}</p>}
        </div>
        {c.photo && (
          <div className="eaa-photo-card">
            <Img src={c.photo} className="eaa-photo" alt={c.name} />
            <Img src={`${B}/shield-path.webp`} className="eaa-photo-doodle" />
          </div>
        )}
      </div>
    </div>
  );
}

function CertiverseSlide({ c }) {
  const points = lines(c.certiversePoints);
  return (
    <div className="eaa-s eaa-white eaa-about-cv">
      <aside className="eaa-ddd">
        {[
          ["define", "Define"],
          ["develop", "Develop"],
          ["deliver", "Deliver"],
        ].map(([img, label], i) => (
          <figure key={img} style={{ animationDelay: `${100 + i * 120}ms` }}>
            <Img src={`${B}/${img}.webp`} />
            <figcaption>{label}</figcaption>
          </figure>
        ))}
        <Img src={`${B}/mark.webp`} className="eaa-corner-mark" />
      </aside>
      <div className="eaa-panel-mint">
        <h1 className="eaa-h1">
          <Em text={c.certiverseTitle} />
        </h1>
        <ul className="eaa-arrows">
          {points.map((p, i) => {
            const { lead, rest } = leadAndRest(p);
            return (
              <li key={i} style={{ animationDelay: `${150 + i * 90}ms` }}>
                <Img src={`${B}/arrow.webp`} className="eaa-arrow" />
                <p>
                  {lead && <strong>{lead} </strong>}
                  {rest}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function AgendaSlide({ c }) {
  const items = lines(c.agendaItems);
  return (
    <div className="eaa-s eaa-white eaa-with-strip">
      <Strip doodle={`${B}/squiggle.svg`} />
      <div className="eaa-strip-main">
        <h1 className="eaa-h1">
          <Em text={c.agendaTitle} />
        </h1>
        <ol
          className={`eaa-agenda ${items.length > 5 ? "two" : ""}`}
          style={{ "--rows": Math.ceil(items.length / 2) }}
        >
          {items.map((item, i) => (
            <li key={i} style={{ animationDelay: `${120 + i * 90}ms` }}>
              <span className="eaa-num">{String(i + 1).padStart(2, "0")}</span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      </div>
      <Img src={`${B}/stars.webp`} className="eaa-stars" />
    </div>
  );
}

function DemoSlide({ c }) {
  return (
    <div className="eaa-s eaa-white eaa-with-strip">
      <Strip doodle={`${B}/deliver.webp`} />
      <div className="eaa-strip-main">
        <p className="eaa-kicker">Live demo</p>
        <h1 className="eaa-h1 eaa-big">
          <Em text={c.demoTitle} />
        </h1>
        {c.demoSubtitle && <p className="eaa-sub">{c.demoSubtitle}</p>}
      </div>
      <Img src={`${B}/stars.webp`} className="eaa-stars" />
    </div>
  );
}

function QuestionsSlide({ c, qr }) {
  return (
    <div className="eaa-s eaa-mint eaa-questions">
      <Logo />
      <div className="eaa-q-body">
        <div>
          {c.questionsKicker && <p className="eaa-q-kicker">{c.questionsKicker}</p>}
          <h1 className="eaa-h1 eaa-big">
            <Em text={c.questionsTitle} />
          </h1>
          <div className="eaa-contact">
            <p className="eaa-contact-name">{c.name}</p>
            {c.email && <p>{c.email}</p>}
          </div>
        </div>
        {qr && (
          <div className="eaa-qr">
            <Img src={`${B}/badge.webp`} className="eaa-qr-badge" />
            <Img src={qr} className="eaa-qr-img" alt={`QR code: ${c.qrUrl}`} />
            {c.qrLabel && <p className="eaa-qr-label">{c.qrLabel}</p>}
            {c.showQrUrl && <p className="eaa-qr-url">{c.qrUrl.replace(/^https?:\/\//, "")}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export function Slide({ id, c, qr }) {
  if (id === "intro") return <IntroSlide c={c} />;
  if (id === "certiverse") return <CertiverseSlide c={c} />;
  if (id === "agenda") return <AgendaSlide c={c} />;
  if (id === "demo") return <DemoSlide c={c} />;
  if (id === "questions") return <QuestionsSlide c={c} qr={qr} />;
  return null;
}
