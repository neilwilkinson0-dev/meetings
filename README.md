# Meeting Games — meetings.neilpilla.com

A small Next.js site hosting games to kick off meetings. The landing page is a
card grid; each card opens a game with its own stage and settings.

**Would You Rather** — a wheel picks a person (no repeats), a question is
revealed slot-machine style, and you lock in their answer. Every response is
saved to Supabase.

**Time Travel** — a question goes up on the big screen with a QR code.
Everyone scans it, submits their name and an idea from their phone, and after
a minute the room's answers reveal on screen — the QR stays up so late
submissions keep landing. Every round and its ideas are saved to Supabase so
you can look back at what was asked and what came in.

## Stack

Next.js 14 (App Router) · Supabase · Vercel — same shape as your other tools.

## Routes

- `/` — game picker
- `/would-you-rather` — lobby (counts + start)
- `/would-you-rather/settings` — manage people & questions
- `/would-you-rather/play` — the game stage
- `/time-travel` — lobby (play + settings)
- `/time-travel/settings` — set the question, browse past rounds
- `/time-travel/play` — the big-screen stage (question, QR, countdown, reveal)
- `/time-travel/submit` — the phone form guests scan the QR into

## 1. Supabase setup

Use a new Supabase project (or a new set of tables in an existing one). In the
SQL editor, run `supabase/schema.sql` for Would You Rather and
`supabase/time_travel_schema.sql` for Time Travel. Both use permissive anon
policies (fine for a private tool).

Would You Rather responses store the person's name and both option texts
inline, so your saved history stays intact even if you later edit or delete a
person or question. Time Travel entries are tied to a round (one row per
question asked), so past ideas stay grouped under whichever question they
answered.

## 2. Local dev

```bash
cp .env.local.example .env.local   # then fill in your Supabase URL + anon key
npm install
npm run dev
```

## 3. Deploy (Vercel)

1. Push to a new GitHub repo.
2. Import it in Vercel.
3. Add env vars `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Add the domain `meetings.neilpilla.com` and point a CNAME at Vercel, same as
   your other subdomains.

## Notes

- Fonts (Bungee + Archivo) load from Google Fonts via a `<link>` in the layout.
- Adding a second game = a new folder under `app/` and a new card on the home
  page. The `soon` card is a placeholder for exactly that.
