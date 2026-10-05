"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import PinGate from "../PinGate";
import { getSupabase } from "@/lib/supabaseClient";
import { KINDS, uploadMedia, youTubeId } from "@/lib/event";

const DEFAULTS = {
  title: { title: "New title screen", data: { show_big_qr: false } },
  text: { title: "New section", data: { bullets: [] } },
  slides: { title: "Slides", data: { images: [] } },
  video: { title: "Video", data: { url: "" } },
  icebreaker: { title: "Ice breaker", subtitle: "Fun or serious?", data: {} },
  qa: { title: "Your questions", subtitle: "Scan the code to ask", data: {} },
};

function Setup() {
  const [sections, setSections] = useState([]);
  const [serious, setSerious] = useState([]);
  const [fun, setFun] = useState([]);
  const [newA, setNewA] = useState("");
  const [newB, setNewB] = useState("");
  const [qCount, setQCount] = useState(0);
  const [open, setOpen] = useState(null);
  const [newKind, setNewKind] = useState("slides");
  const [newSerious, setNewSerious] = useState("");
  const [error, setError] = useState("");
  const [remoteQr, setRemoteQr] = useState("");

  async function load() {
    const supabase = getSupabase();
    if (!supabase) return setError("Supabase isn't configured — add your keys to .env.local.");
    const [s, q, c, f] = await Promise.all([
      supabase.from("event_sections").select("*").order("position"),
      supabase.from("serious_questions").select("*").order("created_at"),
      supabase.from("event_questions").select("id", { count: "exact", head: true }),
      supabase.from("fun_questions").select("*").order("created_at"),
    ]);
    if (s.error) return setError("Couldn't load sections. Run supabase/event_schema.sql first.");
    setSections(s.data ?? []);
    setSerious(q.data ?? []);
    setFun(f.data ?? []);
    setQCount(c.count ?? 0);
  }

  useEffect(() => {
    load();
    QRCode.toDataURL(`${window.location.origin}/present/remote`, { margin: 1, width: 300 }).then(
      setRemoteQr
    );
  }, []);

  async function save(id, patch) {
    setSections((ss) => ss.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    const { error } = await getSupabase().from("event_sections").update(patch).eq("id", id);
    if (error) setError("Couldn't save — check your connection.");
  }

  async function move(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= sections.length) return;
    const next = [...sections];
    [next[i], next[j]] = [next[j], next[i]];
    const renumbered = next.map((s, k) => ({ ...s, position: k }));
    setSections(renumbered);
    const supabase = getSupabase();
    await Promise.all(
      renumbered.map((s) => supabase.from("event_sections").update({ position: s.position }).eq("id", s.id))
    );
  }

  async function add() {
    const d = DEFAULTS[newKind];
    const { data, error } = await getSupabase()
      .from("event_sections")
      .insert({
        kind: newKind,
        title: d.title,
        subtitle: d.subtitle ?? "",
        data: d.data,
        position: sections.length,
      })
      .select()
      .single();
    if (error) return setError("Couldn't add that section.");
    setSections((ss) => [...ss, data]);
    setOpen(data.id);
  }

  async function remove(s) {
    if (!confirm(`Delete “${s.title || KINDS[s.kind]}”?`)) return;
    setSections((ss) => ss.filter((x) => x.id !== s.id));
    await getSupabase().from("event_sections").delete().eq("id", s.id);
  }

  async function addSerious(e) {
    e.preventDefault();
    const text = newSerious.trim();
    if (!text) return;
    const { data } = await getSupabase().from("serious_questions").insert({ text }).select().single();
    if (data) setSerious((qs) => [...qs, data]);
    setNewSerious("");
  }

  async function removeSerious(id) {
    setSerious((qs) => qs.filter((q) => q.id !== id));
    await getSupabase().from("serious_questions").delete().eq("id", id);
  }

  async function updateSerious(id, text) {
    setSerious((qs) => qs.map((q) => (q.id === id ? { ...q, text } : q)));
    await getSupabase().from("serious_questions").update({ text }).eq("id", id);
  }

  async function addFun(e) {
    e.preventDefault();
    const option_a = newA.trim();
    const option_b = newB.trim();
    if (!option_a || !option_b) return;
    const { data } = await getSupabase()
      .from("fun_questions")
      .insert({ option_a, option_b })
      .select()
      .single();
    if (data) setFun((qs) => [...qs, data]);
    setNewA("");
    setNewB("");
  }

  async function updateFun(id, patch) {
    setFun((qs) => qs.map((q) => (q.id === id ? { ...q, ...patch } : q)));
    await getSupabase().from("fun_questions").update(patch).eq("id", id);
  }

  async function removeFun(id) {
    setFun((qs) => qs.filter((q) => q.id !== id));
    await getSupabase().from("fun_questions").delete().eq("id", id);
  }

  async function clearQuestions() {
    if (!confirm(`Delete all ${qCount} audience questions? Do this before the session starts.`)) return;
    const supabase = getSupabase();
    await supabase.from("event_questions").delete().not("id", "is", null);
    await supabase.from("event_state").update({ data: {}, step: 0, section_id: sections[0]?.id ?? null, updated_at: new Date().toISOString() }).eq("id", 1);
    setQCount(0);
  }

  return (
    <main className="page ev-setup">
      <p className="eyebrow">
        <Link href="/present">← Presenter</Link>
      </p>
      <h1 className="page-title">Set up the session</h1>
      <p className="subtitle">
        Build the running order. Changes show on the big screen straight away.
      </p>

      {error && <div className="notice">{error}</div>}

      <div className="ev-setup-grid">
        <section className="panel">
          <h2>Running order</h2>
          <p className="hint">Tap a section to edit it. Use the arrows to reorder.</p>
          <ol className="ev-sec-list">
            {sections.map((s, i) => (
              <li key={s.id} className={open === s.id ? "open" : ""}>
                <div className="ev-sec-row">
                  <span className="ev-r-num">{i + 1}</span>
                  <button className="ev-sec-name" onClick={() => setOpen(open === s.id ? null : s.id)}>
                    {s.title || "Untitled"}
                    <small>{KINDS[s.kind] ?? s.kind}</small>
                  </button>
                  <button className="icon-btn" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
                    ↑
                  </button>
                  <button
                    className="icon-btn"
                    onClick={() => move(i, 1)}
                    disabled={i === sections.length - 1}
                    aria-label="Move down"
                  >
                    ↓
                  </button>
                  <button className="icon-btn danger" onClick={() => remove(s)} aria-label="Delete">
                    ✕
                  </button>
                </div>
                {open === s.id && <SectionEditor section={s} save={(patch) => save(s.id, patch)} />}
              </li>
            ))}
          </ol>
          <div className="add-row" style={{ marginTop: 18, marginBottom: 0 }}>
            <select className="input" value={newKind} onChange={(e) => setNewKind(e.target.value)}>
              {Object.entries(KINDS).map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
            <button className="btn" onClick={add}>
              Add
            </button>
          </div>
        </section>

        <div className="ev-setup-side">
          <section className="panel">
            <h2>Present</h2>
            <p className="hint">
              Open the screen on the laptop plugged into the projector. Scan this with your phone
              for the remote.
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {remoteQr && <img className="ev-setup-qr" src={remoteQr} alt="Remote QR code" />}
            <div className="btn-row">
              <Link className="btn" href="/present/screen" target="_blank">
                Open screen
              </Link>
              <Link className="btn secondary" href="/present/remote">
                Remote
              </Link>
            </div>
          </section>

          <section className="panel">
            <h2>Fun ice breakers ({fun.length})</h2>
            <p className="hint">
              “Would you rather…” questions. A copy of your Would You Rather list — changes here
              don&apos;t affect that game. Click any text to edit it.
            </p>
            <form className="add-col" onSubmit={addFun}>
              <input
                className="input"
                placeholder="Would you rather…"
                value={newA}
                onChange={(e) => setNewA(e.target.value)}
              />
              <div className="add-row" style={{ marginBottom: 0 }}>
                <input
                  className="input"
                  placeholder="…or"
                  value={newB}
                  onChange={(e) => setNewB(e.target.value)}
                />
                <button className="btn" type="submit">
                  Add
                </button>
              </div>
            </form>
            <ul className="item-list ev-scroll-list">
              {fun.map((q) => (
                <li key={q.id} className="item-row">
                  <span className="grow ev-fun-pair">
                    <EditField value={q.option_a} onSave={(v) => updateFun(q.id, { option_a: v })} />
                    <span className="or">or</span>
                    <EditField value={q.option_b} onSave={(v) => updateFun(q.id, { option_b: v })} />
                  </span>
                  <button className="icon-btn danger" onClick={() => removeFun(q.id)} aria-label="Delete">
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel">
            <h2>Serious ice breakers ({serious.length})</h2>
            <p className="hint">Click any question to edit it.</p>
            <form className="add-row" onSubmit={addSerious}>
              <input
                className="input"
                placeholder="Add a serious question"
                value={newSerious}
                onChange={(e) => setNewSerious(e.target.value)}
              />
              <button className="btn" type="submit">
                Add
              </button>
            </form>
            <ul className="item-list">
              {serious.map((q) => (
                <li key={q.id} className="item-row">
                  <span className="grow">
                    <EditField value={q.text} onSave={(v) => updateSerious(q.id, v)} />
                  </span>
                  <button className="icon-btn danger" onClick={() => removeSerious(q.id)} aria-label="Delete">
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel">
            <h2>Before you go on</h2>
            <p className="hint">
              {qCount} audience question{qCount === 1 ? "" : "s"} saved. Clear test questions and
              reset the screen to the first section.
            </p>
            <button className="btn secondary" onClick={clearQuestions}>
              Clear questions &amp; reset
            </button>
          </section>
        </div>
      </div>
    </main>
  );
}

// Text that looks like plain text until clicked; saves on blur or Enter.
function EditField({ value, onSave }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  function commit() {
    const v = draft.trim();
    if (!v) return setDraft(value);
    if (v !== value) onSave(v);
  }
  return (
    <input
      className="ev-edit-field"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
    />
  );
}

function SectionEditor({ section, save }) {
  const [title, setTitle] = useState(section.title);
  const [subtitle, setSubtitle] = useState(section.subtitle);
  const [bullets, setBullets] = useState((section.data?.bullets ?? []).join("\n"));
  const [videoUrl, setVideoUrl] = useState(section.data?.url ?? "");
  const [uploading, setUploading] = useState("");
  const data = section.data ?? {};

  function saveData(patch) {
    save({ data: { ...data, ...patch } });
  }

  async function upload(files, onDone) {
    const list = [...files];
    const urls = [];
    try {
      for (let i = 0; i < list.length; i++) {
        setUploading(list.length > 1 ? `Uploading ${i + 1} of ${list.length}…` : "Uploading…");
        urls.push(await uploadMedia(list[i]));
      }
      onDone(urls);
    } catch (e) {
      alert(`Upload failed: ${e.message || e}. Files over 50 MB may need a YouTube link instead.`);
    } finally {
      setUploading("");
    }
  }

  const images = data.images ?? [];

  function moveImage(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= images.length) return;
    const next = [...images];
    [next[i], next[j]] = [next[j], next[i]];
    saveData({ images: next });
  }

  return (
    <div className="ev-editor">
      <label>
        Heading
        <input
          className="input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => title !== section.title && save({ title })}
        />
      </label>
      {section.kind !== "slides" && section.kind !== "video" && (
        <label>
          Subheading
          <input
            className="input"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            onBlur={() => subtitle !== section.subtitle && save({ subtitle })}
          />
        </label>
      )}

      {section.kind !== "video" && (
        <label className="ev-check">
          <input
            type="checkbox"
            checked={!!data.hide_qr}
            onChange={(e) => saveData({ hide_qr: e.target.checked })}
          />
          Hide the corner QR code on this section (if it covers something)
        </label>
      )}

      {section.kind === "title" && (
        <label className="ev-check">
          <input
            type="checkbox"
            checked={!!data.show_big_qr}
            onChange={(e) => saveData({ show_big_qr: e.target.checked })}
          />
          Show a big “ask a question” QR code
        </label>
      )}

      {section.kind === "text" && (
        <>
          <label>
            Bullet points (one per line)
            <textarea
              className="input"
              rows={5}
              value={bullets}
              onChange={(e) => setBullets(e.target.value)}
              onBlur={() =>
                saveData({ bullets: bullets.split("\n").map((b) => b.trim()).filter(Boolean) })
              }
            />
          </label>
          <div>
            <p className="ev-editor-label">Image (optional, shown on the right)</p>
            {data.image && (
              <div className="ev-thumbs">
                <figure>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={data.image} alt="" />
                  <button className="icon-btn danger" onClick={() => saveData({ image: null })}>
                    ✕
                  </button>
                </figure>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => upload(e.target.files, ([url]) => saveData({ image: url }))}
            />
          </div>
        </>
      )}

      {section.kind === "slides" && (
        <div>
          <p className="ev-editor-label">
            Slide images — export your deck from PowerPoint as PNGs (File → Export) and pick them
            all at once. They&apos;re ordered by file name; use the arrows to adjust.
          </p>
          <div className="ev-thumbs">
            {images.map((src, i) => (
              <figure key={src + i}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Slide ${i + 1}`} />
                <figcaption>
                  <button className="icon-btn" onClick={() => moveImage(i, -1)} aria-label="Earlier">
                    ←
                  </button>
                  {i + 1}
                  <button className="icon-btn" onClick={() => moveImage(i, 1)} aria-label="Later">
                    →
                  </button>
                  <button
                    className="icon-btn danger"
                    onClick={() => saveData({ images: images.filter((_, k) => k !== i) })}
                    aria-label="Remove"
                  >
                    ✕
                  </button>
                </figcaption>
              </figure>
            ))}
          </div>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              const files = [...e.target.files].sort((a, b) =>
                a.name.localeCompare(b.name, undefined, { numeric: true })
              );
              upload(files, (urls) => saveData({ images: [...images, ...urls] }));
            }}
          />
        </div>
      )}

      {section.kind === "video" && (
        <div className="ev-editor-video">
          <label>
            YouTube link or video URL
            <input
              className="input"
              placeholder="https://youtube.com/watch?v=…"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              onBlur={() => videoUrl !== data.url && saveData({ url: videoUrl.trim() })}
            />
          </label>
          <p className="ev-editor-label">…or upload an MP4</p>
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            onChange={(e) =>
              upload(e.target.files, ([url]) => {
                setVideoUrl(url);
                saveData({ url });
              })
            }
          />
          {data.url && (
            <p className="ev-editor-label">
              ✓ {youTubeId(data.url) ? "YouTube video set" : "Video file set"}
            </p>
          )}
        </div>
      )}

      {section.kind === "icebreaker" && (
        <p className="ev-editor-label">
          On the day: ask someone “fun or serious?”, then tap the answer on your phone. Manage the
          fun and serious questions on the right.
        </p>
      )}

      {section.kind === "qa" && (
        <p className="ev-editor-label">
          Questions stay hidden until you tap Show on your phone. The QR code is in the corner of
          every section so people can ask any time.
        </p>
      )}

      {uploading && <p className="ev-editor-label">{uploading}</p>}
    </div>
  );
}

export default function SetupPage() {
  return (
    <PinGate>
      <Setup />
    </PinGate>
  );
}
