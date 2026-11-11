"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { DEFAULTS, useDeckConfig } from "@/lib/eaaDeck";

function Field({ label, k, config, update, multiline, hint, type = "text" }) {
  const Tag = multiline ? "textarea" : "input";
  return (
    <label className="eaa-field">
      <span>{label}</span>
      <Tag
        className="input"
        type={multiline ? undefined : type}
        rows={multiline ? 4 : undefined}
        value={config[k] ?? ""}
        onChange={(e) => update({ [k]: e.target.value })}
        placeholder={String(DEFAULTS[k] ?? "")}
      />
      {hint && <small>{hint}</small>}
    </label>
  );
}

function Check({ label, k, config, update }) {
  return (
    <label className="eaa-check">
      <input type="checkbox" checked={!!config[k]} onChange={(e) => update({ [k]: e.target.checked })} />
      <span>{label}</span>
    </label>
  );
}

export default function Setup() {
  const { config, update, reset, ready } = useDeckConfig();
  const [qr, setQr] = useState("");
  const p = { config, update };

  useEffect(() => {
    if (!config.qrUrl) return setQr("");
    QRCode.toDataURL(config.qrUrl, { margin: 1, width: 360 }).then(setQr).catch(() => setQr(""));
  }, [config.qrUrl]);

  if (!ready) return null;

  return (
    <main className="page eaa-setup">
      <p className="eyebrow">
        <Link href="/eaa">← eAA deck</Link>
      </p>
      <h1 className="page-title">Set up the deck</h1>
      <p className="subtitle">
        Changes save as you type, in this browser — so do this on the laptop you&apos;ll
        present from. An open deck tab updates live. One item per line in the list boxes.
      </p>

      <div className="eaa-setup-actions">
        <Link className="btn" href="/eaa/deck" target="_blank">
          Open the deck ↗
        </Link>
        <a className="btn secondary" href="/eaa/print?download" target="_blank">
          Download PDF
        </a>
        <button
          className="btn secondary"
          onClick={() => confirm("Put every field back to its default?") && reset()}
        >
          Reset to defaults
        </button>
      </div>

      <section className="panel eaa-panel">
        <h2>1 · Intro — who I am</h2>
        <Field label="Event" k="eventName" {...p} hint="Shown in the green pill on the intro slide." />
        <Field label="Talk title" k="talkTitle" hint="Wrap words in *asterisks* to make them green." {...p} />
        <Field label="Your name" k="name" {...p} />
        <Field label="Role" k="role" {...p} />
        <Field label="Company" k="company" {...p} />
        <Field label="Email" k="email" {...p} hint="Shown on the questions slide." />
        <Field label="Photo URL" k="photo" {...p} hint="Leave empty to hide the photo." />
        <Field label="About me (one line each)" k="aboutMe" multiline {...p} />
      </section>

      <section className="panel eaa-panel">
        <h2>2 · Who Certiverse is</h2>
        <Field label="Heading" k="certiverseTitle" hint="Wrap words in *asterisks* to make them green." {...p} />
        <Field
          label="Points (one per line)"
          k="certiversePoints"
          multiline
          hint="The first sentence of each line is shown in bold."
          {...p}
        />
      </section>

      <section className="panel eaa-panel">
        <h2>3 · What I&apos;ll talk about</h2>
        <Field label="Heading" k="agendaTitle" hint="Wrap words in *asterisks* to make them green." {...p} />
        <Field label="Agenda (one per line)" k="agendaItems" multiline {...p} />
      </section>

      <section className="panel eaa-panel">
        <h2>4 · Demo</h2>
        <Field label="Heading" k="demoTitle" hint="Wrap words in *asterisks* to make them green." {...p} />
        <Field label="Subheading" k="demoSubtitle" {...p} />
      </section>

      <section className="panel eaa-panel">
        <h2>5 · Questions + QR code</h2>
        <Field label="Small line above" k="questionsKicker" {...p} />
        <Field label="Heading" k="questionsTitle" hint="Wrap words in *asterisks* to make them green." {...p} />
        <Field label="QR code links to" k="qrUrl" type="url" {...p} />
        <Field label="Text under the QR code" k="qrLabel" {...p} />
        <Check label="Show the link under the QR code" k="showQrUrl" {...p} />
        {qr && (
          <div className="eaa-setup-qr">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="QR preview" />
            <small>Scan this with your phone to check it goes to the right place.</small>
          </div>
        )}
      </section>

    </main>
  );
}
