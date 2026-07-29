"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabaseClient";

const JIRA_STATUSES = [
  { value: "to_do", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

function jiraStatusLabel(value) {
  return JIRA_STATUSES.find((s) => s.value === value)?.label ?? "To do";
}

function getVoterToken() {
  if (typeof window === "undefined") return null;
  let token = localStorage.getItem("ideas_voter_token");
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem("ideas_voter_token", token);
  }
  return token;
}

function getStoredName() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("ideas_display_name") ?? "";
}

function storeName(name) {
  if (typeof window === "undefined") return;
  if (name) localStorage.setItem("ideas_display_name", name);
}

function timeAgo(iso) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function IdeaCard({ idea, rank, votes, comments, voterToken, onVote, onComment, onJiraSave }) {
  const [commentBody, setCommentBody] = useState("");
  const [commentAuthor, setCommentAuthor] = useState(getStoredName());
  const [editingJira, setEditingJira] = useState(false);
  const [jiraKeyDraft, setJiraKeyDraft] = useState(idea.jira_key ?? "");
  const [jiraUrlDraft, setJiraUrlDraft] = useState(idea.jira_url ?? "");
  const [jiraStatusDraft, setJiraStatusDraft] = useState(idea.jira_status ?? "to_do");

  const up = votes.filter((v) => v.value === 1).length;
  const down = votes.filter((v) => v.value === -1).length;
  const score = up - down;
  const myVote = votes.find((v) => v.voter_token === voterToken)?.value ?? 0;

  function submitComment(e) {
    e.preventDefault();
    const author = commentAuthor.trim();
    const body = commentBody.trim();
    if (!author || !body) return;
    storeName(author);
    onComment(idea.id, author, body);
    setCommentBody("");
  }

  function saveJira() {
    const key = jiraKeyDraft.trim();
    if (!key) return;
    onJiraSave(idea.id, {
      jira_key: key,
      jira_url: jiraUrlDraft.trim() || null,
      jira_status: jiraStatusDraft,
    });
    setEditingJira(false);
  }

  function clearJira() {
    onJiraSave(idea.id, { jira_key: null, jira_url: null, jira_status: null });
    setEditingJira(false);
    setJiraKeyDraft("");
    setJiraUrlDraft("");
  }

  return (
    <li className="idea-card marquee">
      <div className="idea-rank">#{rank}</div>

      <div className="idea-body">
        <div className="idea-main">
          <h3 className="idea-title">{idea.title}</h3>
          {idea.description && <p className="idea-desc">{idea.description}</p>}
          <p className="idea-meta">
            {idea.author_name} · {timeAgo(idea.created_at)}
          </p>

          {idea.jira_key && !editingJira && (
            <div className="jira-badge">
              {idea.jira_url ? (
                <a href={idea.jira_url} target="_blank" rel="noreferrer">
                  {idea.jira_key}
                </a>
              ) : (
                <span>{idea.jira_key}</span>
              )}
              <span className={`jira-status jira-${idea.jira_status || "to_do"}`}>
                {jiraStatusLabel(idea.jira_status)}
              </span>
              <button className="text-link reset-link" onClick={() => setEditingJira(true)}>
                Edit
              </button>
            </div>
          )}

          {!idea.jira_key && !editingJira && (
            <button className="text-link reset-link jira-add" onClick={() => setEditingJira(true)}>
              + Link Jira ticket
            </button>
          )}

          {editingJira && (
            <div className="jira-form">
              <input
                className="input"
                placeholder="Ticket key, e.g. PROJ-123"
                value={jiraKeyDraft}
                onChange={(e) => setJiraKeyDraft(e.target.value)}
              />
              <input
                className="input"
                placeholder="Ticket URL (optional)"
                value={jiraUrlDraft}
                onChange={(e) => setJiraUrlDraft(e.target.value)}
              />
              <select
                className="input"
                value={jiraStatusDraft}
                onChange={(e) => setJiraStatusDraft(e.target.value)}
              >
                {JIRA_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <div className="btn-row">
                <button className="btn" onClick={saveJira}>
                  Save
                </button>
                <button className="text-link reset-link" onClick={() => setEditingJira(false)}>
                  Cancel
                </button>
                {idea.jira_key && (
                  <button className="text-link reset-link" onClick={clearJira}>
                    Unlink
                  </button>
                )}
              </div>
            </div>
          )}

          <details className="round-block idea-comments">
            <summary>
              {comments.length} comment{comments.length === 1 ? "" : "s"}
            </summary>

            <ul className="comment-list">
              {comments.map((c) => (
                <li key={c.id} className="comment-row">
                  <span className="comment-author">{c.author_name}</span>
                  <span className="comment-body">{c.body}</span>
                </li>
              ))}
              {comments.length === 0 && (
                <li className="empty">No comments yet — start the thread.</li>
              )}
            </ul>

            <form className="comment-form" onSubmit={submitComment}>
              <input
                className="input"
                placeholder="Your name"
                value={commentAuthor}
                onChange={(e) => setCommentAuthor(e.target.value)}
              />
              <input
                className="input comment-body-input"
                placeholder="We could expand this by…"
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
              />
              <button className="btn" type="submit">
                Post
              </button>
            </form>
          </details>
        </div>

        <div className="vote-col">
          <button
            className={`vote-btn up ${myVote === 1 ? "active" : ""}`}
            onClick={() => onVote(idea.id, 1)}
            aria-label="Thumbs up"
          >
            👍
          </button>
          <span className="vote-score">{score}</span>
          <button
            className={`vote-btn down ${myVote === -1 ? "active" : ""}`}
            onClick={() => onVote(idea.id, -1)}
            aria-label="Thumbs down"
          >
            👎
          </button>
        </div>
      </div>
    </li>
  );
}

export default function IdeasBoard() {
  const [ideas, setIdeas] = useState([]);
  const [votes, setVotes] = useState([]);
  const [comments, setComments] = useState([]);
  const [noConfig, setNoConfig] = useState(false);
  const [voterToken, setVoterToken] = useState(null);

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newAuthor, setNewAuthor] = useState("");

  useEffect(() => {
    setVoterToken(getVoterToken());
    setNewAuthor(getStoredName());
  }, []);

  async function load() {
    const supabase = getSupabase();
    if (!supabase) {
      setNoConfig(true);
      return;
    }
    const [{ data: i }, { data: v }, { data: c }] = await Promise.all([
      supabase.from("ideas").select("*").order("created_at"),
      supabase.from("idea_votes").select("*"),
      supabase.from("idea_comments").select("*").order("created_at"),
    ]);
    setIdeas(i ?? []);
    setVotes(v ?? []);
    setComments(c ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function addIdea(e) {
    e.preventDefault();
    const title = newTitle.trim();
    const author = newAuthor.trim();
    if (!title || !author) return;
    storeName(author);
    await getSupabase()
      .from("ideas")
      .insert({ title, description: newDescription.trim(), author_name: author });
    setNewTitle("");
    setNewDescription("");
    load();
  }

  async function vote(ideaId, value) {
    const supabase = getSupabase();
    const existing = votes.find((v) => v.idea_id === ideaId && v.voter_token === voterToken);
    if (existing && existing.value === value) {
      await supabase.from("idea_votes").delete().eq("id", existing.id);
    } else {
      await supabase
        .from("idea_votes")
        .upsert({ idea_id: ideaId, voter_token: voterToken, value }, { onConflict: "idea_id,voter_token" });
    }
    load();
  }

  async function addComment(ideaId, author, body) {
    await getSupabase().from("idea_comments").insert({ idea_id: ideaId, author_name: author, body });
    load();
  }

  async function saveJira(ideaId, fields) {
    await getSupabase().from("ideas").update(fields).eq("id", ideaId);
    load();
  }

  const ranked = useMemo(() => {
    return ideas
      .map((idea) => {
        const ideaVotes = votes.filter((v) => v.idea_id === idea.id);
        const score = ideaVotes.reduce((sum, v) => sum + v.value, 0);
        return { idea, score };
      })
      .sort((a, b) => b.score - a.score || new Date(a.idea.created_at) - new Date(b.idea.created_at));
  }, [ideas, votes]);

  return (
    <main className="page">
      <p className="eyebrow">
        <Link href="/ideas">← Ideas Board</Link>
      </p>
      <h1 className="page-title">The board</h1>
      <p className="subtitle">
        Pitch a feature, vote on the ones you back, and dig into the comments.
        Highest net votes rise to the top.
      </p>

      {noConfig && (
        <div className="notice">
          Supabase isn&apos;t configured yet — add your keys to{" "}
          <code>.env.local</code> first.
        </div>
      )}

      <form className="panel add-col" style={{ marginTop: 30 }} onSubmit={addIdea}>
        <h2>Pitch an idea</h2>
        <input
          className="input"
          placeholder="Your name"
          value={newAuthor}
          onChange={(e) => setNewAuthor(e.target.value)}
        />
        <input
          className="input"
          placeholder="Feature idea title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
        />
        <textarea
          className="input"
          rows={3}
          placeholder="What's the idea, and why does it matter? (optional)"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
        />
        <div>
          <button className="btn" type="submit">
            Add idea
          </button>
        </div>
      </form>

      <ul className="idea-list">
        {ranked.map(({ idea }, index) => (
          <IdeaCard
            key={idea.id}
            idea={idea}
            rank={index + 1}
            votes={votes.filter((v) => v.idea_id === idea.id)}
            comments={comments.filter((c) => c.idea_id === idea.id)}
            voterToken={voterToken}
            onVote={vote}
            onComment={addComment}
            onJiraSave={saveJira}
          />
        ))}
        {ranked.length === 0 && !noConfig && (
          <li className="empty">No ideas yet — be the first to pitch one.</li>
        )}
      </ul>
    </main>
  );
}
