-- Presenter mode: run a live session (intro, slides, video, ice breaker,
-- audience Q&A, closing) on a big screen, driven from your phone.

-- The running order. `kind` decides how the section renders:
--   title | text | slides | video | icebreaker | qa
-- `data` holds the per-kind settings (images, video url, bullets, …).
create table if not exists event_sections (
  id uuid primary key default gen_random_uuid(),
  position int not null default 0,
  kind text not null,
  title text not null default '',
  subtitle text not null default '',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- One row (id = 1): what the big screen is showing right now. The phone
-- remote writes it, the screen follows it.
create table if not exists event_state (
  id int primary key default 1 check (id = 1),
  section_id uuid references event_sections(id) on delete set null,
  step int not null default 0,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
insert into event_state (id) values (1) on conflict (id) do nothing;

-- Questions the audience sends in via the QR code. Nothing reaches the
-- screen until the presenter picks it.
create table if not exists event_questions (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  body text not null,
  status text not null default 'new' check (status in ('new', 'answered', 'hidden')),
  created_at timestamptz not null default now()
);

-- The "serious" side of the ice breaker.
create table if not exists serious_questions (
  id uuid primary key default gen_random_uuid(),
  text text not null,
  created_at timestamptz not null default now()
);

alter table event_sections enable row level security;
alter table event_state enable row level security;
alter table event_questions enable row level security;
alter table serious_questions enable row level security;

create policy "anon full access event_sections" on event_sections
  for all using (true) with check (true);
create policy "anon full access event_state" on event_state
  for all using (true) with check (true);
create policy "anon full access event_questions" on event_questions
  for all using (true) with check (true);
create policy "anon full access serious_questions" on serious_questions
  for all using (true) with check (true);

-- Live updates for the screen and the remote.
alter publication supabase_realtime add table event_state;
alter publication supabase_realtime add table event_questions;
alter publication supabase_realtime add table event_sections;

-- Public bucket for slide images and the video.
insert into storage.buckets (id, name, public)
values ('event-media', 'event-media', true)
on conflict (id) do nothing;

create policy "anon read event-media" on storage.objects
  for select using (bucket_id = 'event-media');
create policy "anon upload event-media" on storage.objects
  for insert with check (bucket_id = 'event-media');
create policy "anon delete event-media" on storage.objects
  for delete using (bucket_id = 'event-media');

-- A starting running order and some serious questions — edit both in
-- /present/setup.
insert into event_sections (position, kind, title, subtitle, data)
select * from (values
  (0, 'title', 'Welcome', 'Grab a seat — we''ll start in a moment', '{"show_big_qr": false}'::jsonb),
  (1, 'text', 'Who are we', '', '{"bullets": ["Who we are", "What we do", "Why we''re here"]}'::jsonb),
  (2, 'icebreaker', 'Ice breaker', 'Fun or serious?', '{}'::jsonb),
  (3, 'slides', 'Slides', '', '{"images": []}'::jsonb),
  (4, 'qa', 'Your questions', 'Scan the code to ask', '{}'::jsonb),
  (5, 'title', 'Thank you', 'Come and find us at our stand', '{"show_big_qr": true}'::jsonb)
) as v(position, kind, title, subtitle, data)
where not exists (select 1 from event_sections);

insert into serious_questions (text)
select * from (values
  ('What''s one thing about assessment you''d change tomorrow if you could?'),
  ('Where do you think AI will genuinely help test development — and where won''t it?'),
  ('What''s the biggest threat to test security right now?'),
  ('How do we make exams fairer for every candidate?'),
  ('What does a great candidate experience look like to you?'),
  ('Which part of your process takes far longer than it should?'),
  ('What''s a skill that''s hard to assess but really matters?'),
  ('If remote proctoring disappeared tomorrow, what would you do instead?')
) as v(text)
where not exists (select 1 from serious_questions);

-- The "fun" side of the ice breaker: a copy of the Would You Rather
-- questions, so editing one list doesn't touch the other game.
create table if not exists fun_questions (
  id uuid primary key default gen_random_uuid(),
  option_a text not null,
  option_b text not null,
  created_at timestamptz not null default now()
);
alter table fun_questions enable row level security;
create policy "anon full access fun_questions" on fun_questions
  for all using (true) with check (true);
insert into fun_questions (option_a, option_b, created_at)
select option_a, option_b, created_at from wyr_questions
where not exists (select 1 from fun_questions);
