-- Time Travel game: one question at a time, ideas collected via QR code.
create table if not exists time_travel_rounds (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  active boolean not null default true,
  started_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists time_travel_entries (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references time_travel_rounds(id) on delete cascade,
  name text not null,
  idea text not null,
  created_at timestamptz not null default now()
);

create index if not exists time_travel_entries_round_id_idx on time_travel_entries (round_id);

alter table time_travel_rounds enable row level security;
alter table time_travel_entries enable row level security;

create policy "anon full access rounds" on time_travel_rounds
  for all using (true) with check (true);

create policy "anon full access entries" on time_travel_entries
  for all using (true) with check (true);
