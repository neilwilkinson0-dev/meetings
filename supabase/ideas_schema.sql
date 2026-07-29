-- Ideas Board: submit feature ideas, vote on them, discuss them, and track
-- them through to a Jira ticket once they're being built.
create table if not exists ideas (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  author_name text not null,
  jira_key text,
  jira_url text,
  jira_status text,
  created_at timestamptz not null default now()
);

create table if not exists idea_votes (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references ideas(id) on delete cascade,
  voter_token text not null,
  value smallint not null check (value in (1, -1)),
  created_at timestamptz not null default now(),
  unique (idea_id, voter_token)
);

create table if not exists idea_comments (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references ideas(id) on delete cascade,
  author_name text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists idea_votes_idea_id_idx on idea_votes (idea_id);
create index if not exists idea_comments_idea_id_idx on idea_comments (idea_id);

alter table ideas enable row level security;
alter table idea_votes enable row level security;
alter table idea_comments enable row level security;

create policy "anon full access ideas" on ideas
  for all using (true) with check (true);

create policy "anon full access idea_votes" on idea_votes
  for all using (true) with check (true);

create policy "anon full access idea_comments" on idea_comments
  for all using (true) with check (true);
