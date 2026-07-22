"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabaseClient";

export default function Settings() {
  const [people, setPeople] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [noConfig, setNoConfig] = useState(false);

  const [newName, setNewName] = useState("");
  const [newA, setNewA] = useState("");
  const [newB, setNewB] = useState("");

  const [editingPerson, setEditingPerson] = useState(null); // { id, name }
  const [editingQuestion, setEditingQuestion] = useState(null); // { id, option_a, option_b }

  async function load() {
    const supabase = getSupabase();
    if (!supabase) {
      setNoConfig(true);
      return;
    }
    const [{ data: p }, { data: q }] = await Promise.all([
      supabase.from("wyr_people").select("*").order("created_at"),
      supabase.from("wyr_questions").select("*").order("created_at"),
    ]);
    setPeople(p ?? []);
    setQuestions(q ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function addPerson(e) {
    e?.preventDefault?.();
    const name = newName.trim();
    if (!name) return;
    setNewName("");
    await getSupabase().from("wyr_people").insert({ name });
    load();
  }

  async function savePerson() {
    const name = editingPerson.name.trim();
    if (name) {
      await getSupabase()
        .from("wyr_people")
        .update({ name })
        .eq("id", editingPerson.id);
    }
    setEditingPerson(null);
    load();
  }

  async function deletePerson(id) {
    await getSupabase().from("wyr_people").delete().eq("id", id);
    load();
  }

  async function addQuestion(e) {
    e?.preventDefault?.();
    const a = newA.trim();
    const b = newB.trim();
    if (!a || !b) return;
    setNewA("");
    setNewB("");
    await getSupabase().from("wyr_questions").insert({ option_a: a, option_b: b });
    load();
  }

  async function saveQuestion() {
    const a = editingQuestion.option_a.trim();
    const b = editingQuestion.option_b.trim();
    if (a && b) {
      await getSupabase()
        .from("wyr_questions")
        .update({ option_a: a, option_b: b })
        .eq("id", editingQuestion.id);
    }
    setEditingQuestion(null);
    load();
  }

  async function deleteQuestion(id) {
    await getSupabase().from("wyr_questions").delete().eq("id", id);
    load();
  }

  return (
    <main className="page">
      <p className="eyebrow">
        <Link href="/would-you-rather">← Would You Rather</Link>
      </p>
      <h1 className="page-title">Settings</h1>
      <p className="subtitle">
        Set up who&apos;s in the room and what they might get asked. Changes
        save straight away.
      </p>

      {noConfig && (
        <div className="notice">
          Supabase isn&apos;t configured yet — add your keys to{" "}
          <code>.env.local</code> first.
        </div>
      )}

      <div className="settings-grid">
        <section className="panel">
          <h2>People</h2>
          <p className="hint">Everyone at this meeting. Tap a name to edit it.</p>

          <div className="add-row">
            <input
              className="input"
              placeholder="Add a name…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addPerson(e)}
            />
            <button className="btn" onClick={addPerson}>
              Add
            </button>
          </div>

          <ul className="item-list">
            {people.map((p) => (
              <li key={p.id} className="item-row">
                {editingPerson?.id === p.id ? (
                  <>
                    <input
                      className="input grow"
                      autoFocus
                      value={editingPerson.name}
                      onChange={(e) =>
                        setEditingPerson({ ...editingPerson, name: e.target.value })
                      }
                      onKeyDown={(e) => e.key === "Enter" && savePerson()}
                      onBlur={savePerson}
                    />
                  </>
                ) : (
                  <>
                    <span
                      className="grow"
                      style={{ cursor: "text" }}
                      onClick={() => setEditingPerson({ id: p.id, name: p.name })}
                    >
                      {p.name}
                    </span>
                    <button
                      className="icon-btn danger"
                      aria-label={`Remove ${p.name}`}
                      onClick={() => deletePerson(p.id)}
                    >
                      ✕
                    </button>
                  </>
                )}
              </li>
            ))}
            {people.length === 0 && !noConfig && (
              <li className="empty">No one on the wheel yet — add the first name above.</li>
            )}
          </ul>
        </section>

        <section className="panel">
          <h2>Questions</h2>
          <p className="hint">
            Two options each — work things, daft things, whatever. Tap one to
            edit it.
          </p>

          <div className="add-col">
            <input
              className="input"
              placeholder="Option one…"
              value={newA}
              onChange={(e) => setNewA(e.target.value)}
            />
            <input
              className="input"
              placeholder="…or option two"
              value={newB}
              onChange={(e) => setNewB(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addQuestion(e)}
            />
            <div>
              <button className="btn" onClick={addQuestion}>
                Add question
              </button>
            </div>
          </div>

          <ul className="item-list">
            {questions.map((q) => (
              <li key={q.id} className="item-row">
                {editingQuestion?.id === q.id ? (
                  <span className="grow" style={{ display: "grid", gap: 8 }}>
                    <input
                      className="input"
                      autoFocus
                      value={editingQuestion.option_a}
                      onChange={(e) =>
                        setEditingQuestion({ ...editingQuestion, option_a: e.target.value })
                      }
                    />
                    <input
                      className="input"
                      value={editingQuestion.option_b}
                      onChange={(e) =>
                        setEditingQuestion({ ...editingQuestion, option_b: e.target.value })
                      }
                      onKeyDown={(e) => e.key === "Enter" && saveQuestion()}
                    />
                    <div>
                      <button className="btn" onClick={saveQuestion}>
                        Save
                      </button>
                    </div>
                  </span>
                ) : (
                  <>
                    <span
                      className="grow"
                      style={{ cursor: "text" }}
                      onClick={() =>
                        setEditingQuestion({
                          id: q.id,
                          option_a: q.option_a,
                          option_b: q.option_b,
                        })
                      }
                    >
                      {q.option_a} <span className="or"> or </span> {q.option_b}
                    </span>
                    <button
                      className="icon-btn danger"
                      aria-label="Remove question"
                      onClick={() => deleteQuestion(q.id)}
                    >
                      ✕
                    </button>
                  </>
                )}
              </li>
            ))}
            {questions.length === 0 && !noConfig && (
              <li className="empty">No questions in the deck yet.</li>
            )}
          </ul>
        </section>
      </div>
    </main>
  );
}
