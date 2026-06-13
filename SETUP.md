# Dashboard — Setup Guide (fork → deploy in ~5 min)

This is a static dashboard (plain HTML/JS) that deploys on **Vercel** and syncs across your
devices with **Supabase**. WHOOP + the sleep Shortcut are optional add-ons.

---

## 1. Fork & deploy

1. **Fork** this repo to your GitHub.
2. Go to **vercel.com → Add New → Project → Import** your fork.
3. Framework Preset: **Other**. Root Directory: **`./`**. Build/output: leave blank (static).
4. **Deploy.** You'll get a URL like `https://your-app.vercel.app`.

The dashboard opens to a **password screen** — the default password is in
[`lock.js`](lock.js) (`var PASSWORD = "qwer"`). Change it to whatever you want.

---

## 2. Supabase (cross-device sync) — required for sync

Create a free project at **supabase.com**, then run **both** SQL blocks below in
**SQL Editor → New query → Run**.

### SQL #1 — `app_state` (powers all dashboard sync)
```sql
create table if not exists public.app_state (
  key        text primary key,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- The browser uses the ANON key, so allow it to read/write:
alter table public.app_state enable row level security;
create policy "anon full access app_state"
  on public.app_state for all
  to anon using (true) with check (true);

-- Instant cross-device updates:
alter publication supabase_realtime add table public.app_state;
```

### SQL #2 — `sleep_logs` (only if you use the iOS sleep Shortcut)
```sql
create table if not exists public.sleep_logs (
  id              uuid primary key default gen_random_uuid(),
  date            date not null unique,
  sleep_start     timestamptz not null,
  wake_time       timestamptz not null,
  duration_hours  numeric(4,2) not null,
  created_at      timestamptz not null default now()
);
create index if not exists sleep_logs_date_desc on public.sleep_logs (date desc);

-- Dashboard reads sleep with the anon key:
alter table public.sleep_logs enable row level security;
create policy "anon can read sleep_logs"
  on public.sleep_logs for select to anon using (true);
```

### Put YOUR Supabase keys in the code
Supabase → **Project Settings → API**. Copy the **Project URL** and the **anon / publishable**
key, then replace the placeholders in these files (find the old URL/key and swap yours in):

- [`sync.js`](sync.js)
- [`topbar.js`](topbar.js)
- [`gym.html`](gym.html)
- [`sleep-tracker/frontend/sleep-card.html`](sleep-tracker/frontend/sleep-card.html)

> ⚠️ Only the **anon** key goes in the code. **Never** put the `service_role` key in any
> `.html`/`.js` file — it has full admin access. It only goes in a Vercel env var (below).

---

## 3. Vercel Environment Variables (optional features)

Vercel → your project → **Settings → Environment Variables**. Add only what you need, then redeploy.

| Variable | Needed for | Where to get it |
|---|---|---|
| `WHOOP_CLIENT_ID` | WHOOP login | Your WHOOP app (developer.whoop.com) |
| `WHOOP_CLIENT_SECRET` | WHOOP login | Your WHOOP app — **secret** |
| `SUPABASE_URL` | Sleep Shortcut API | Supabase → Settings → API (Project URL) |
| `SUPABASE_SERVICE_KEY` | Sleep Shortcut API | Supabase → Settings → API (**service_role**, secret) |
| `SLEEP_API_SECRET` | Sleep Shortcut API | Any password you choose (must match your Shortcut) |

> The core dashboard (hub, caffeine, water, settings, sync) works with **no env vars**.

---

## 4. WHOOP (optional)

1. **developer.whoop.com** → create an app.
2. Set its **Redirect URI** to exactly: `https://your-app.vercel.app/api/whoop-callback`
   (use your real Vercel domain — add every domain you'll open the site from).
3. Put your app's **Client ID** in [`health.html`](health.html) (`const CLIENT_ID = '...'`),
   and set `WHOOP_CLIENT_ID` + `WHOOP_CLIENT_SECRET` in Vercel env. Redeploy.
4. Open the site at that exact domain → Health page → **Connect WHOOP**.

> The callback auto-detects the domain, so you do **not** need a `WHOOP_REDIRECT_URI` env var.

---

## 5. Nova (AI mentor / gym coach) — optional

No setup or key in the repo. Each user **pastes their own Anthropic API key** on the
**Nova** tile; it's stored only in their browser and sent straight to Anthropic. Get a key at
console.anthropic.com.

---

## TL;DR
1. Fork → import to Vercel → deploy.
2. New Supabase → run **SQL #1** (and **SQL #2** for sleep) → paste your **URL + anon key** into
   `sync.js`, `topbar.js`, `gym.html`, `sleep-card.html`.
3. (Optional) WHOOP + sleep env vars in Vercel.
4. Change the password in `lock.js`. Done.
