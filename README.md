# Meeting Games — meetings.neilpilla.com

A small Next.js site hosting games to kick off meetings. The landing page is a
card grid; each card opens a game with its own stage and settings.

**First game: Would You Rather** — a wheel picks a person (no repeats), a
question is revealed slot-machine style, and you lock in their answer. Every
response is saved to Supabase.

## Stack

Next.js 14 (App Router) · Supabase · Vercel — same shape as your other tools.

## Routes

- `/` — game picker
- `/would-you-rather` — lobby (counts + start)
- `/would-you-rather/settings` — manage people & questions
- `/would-you-rather/play` — the game stage

## 1. Supabase setup

Use a new Supabase project (or a new set of tables in an existing one). In the
SQL editor, run `supabase/schema.sql`. It creates three tables — `wyr_people`,
`wyr_questions`, `wyr_responses` — with permissive anon policies (fine for a
private tool) and a few starter questions.

Responses store the person's name and both option texts inline, so your saved
history stays intact even if you later edit or delete a person or question.

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
