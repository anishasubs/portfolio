# Kaisey — AI Student Co-Pilot

## What This Is
Kaisey is a React+Vite+Tailwind+shadcn single-page app that acts as an AI calendar assistant for students. It integrates with Google Calendar and uses OpenAI (gpt-4o-mini) for intelligent scheduling.

## Tech Stack
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **AI**: OpenAI gpt-4o-mini (via serverless proxy at `../kaisey-proxy/`)
- **Calendar**: Google Calendar API (OAuth 2.0 implicit flow)
- **Animation**: Framer Motion (imported as `motion/react`)
- **State**: All state in App.tsx via useState (no Redux/Zustand/Context)

## Project Structure
```
kaisey-src/
  src/
    app/
      App.tsx                    # Root component — all state lives here
      components/
        WelcomePage.tsx          # Landing page with demo video + Google OAuth
        PrioritySelector.tsx     # Pick up to 4 priorities (presets + custom labels)
        CommandCenter.tsx        # "Your Day at a Glance" — next event, weekly balance bar
        KaiseyChatbot.tsx        # Chat + brain dump (7-phase state machine)
        CalendarView.tsx         # Day/Week/Month calendar with edit/delete
        AgentSuggestion.tsx      # Recommendation cards (conflicts, optimization)
        ProfileSection.tsx       # Google profile display
        SettingsPage.tsx         # Integration settings
        OnboardingTour.tsx       # 4-step spotlight walkthrough for first-time users
        priority.ts              # Priority model, category metadata, prompt hints, balance utilities
      ui/                        # shadcn/ui primitives (Button, Card, etc.)
    config/
      env.ts                     # Vite env var mapping
  vite.config.ts
```

## Event Categories (4 types)
Events have exactly 4 categories. These are the fixed taxonomy — the AI classifies
into them, the calendar colours by them, and priorities are named lenses on top:
- `academics` (blue) — classes, studying, prep, homework, deep work
- `recruiting` (red) — interviews, info sessions, career events
- `social` (orange) — coffee chats, networking, happy hours, lunches
- `wellness` (green) — gym, yoga, meditation, workouts

Defined as `EventCategory` type in `priority.ts`. Keywords for auto-classification are in `getEventTypeAndColor()` in App.tsx.

## Priorities
The user picks **up to 4 priorities** (`MAX_PRIORITIES`), flat — there is no ranking
between them. A `Priority` is `{ id, label, category, description?, isCustom }`:
the four presets are the categories under their own names, and a custom priority is
a user-supplied label pinned to one of the same four categories. That keeps the
taxonomy stable (the AI tool schema and colour palette never change) while the user
sees their own words everywhere.

Stored as JSON under `kaisey-priorities`. The v1 single-mode key `kaisey-priority`
is migrated on first read by `loadPriorities()`.

## Classification
`inferCategory()` in `priority.ts` is the single classifier for free text — both
event titles (Google Calendar fetch and `getEventTypeAndColor()` in App.tsx) and the
name someone types for their own priority. It scores a string against per-category
keyword lists and returns the best match, defaulting to academics.

Keywords match at **word starts**, not as bare substrings, so a keyword covers its
suffixes ("recruit" catches "recruiting" and "recruiter") without matching mid-word.
That boundary matters: plain `includes()` finds "run" inside "brunch" and "lab"
inside "collaborate". Ties go to the first match in `EVENT_CATEGORY_PRECEDENCE`
(wellness, social, recruiting, academics), which is the order the old if/else chains
used. `categoryColor()` gives the Tailwind class for a category.

When someone names their own priority the UI shows the guess as one correctable line
("Scheduled like health & rest · Change") rather than asking the user to classify it.

Priorities control:
- **AI scheduling bias** — `buildPriorityPromptHint()` composes one instruction block
  covering every chosen priority, naming the categories left out as the ones to move first
- **Calendar dimming** — non-priority events are dimmed; nothing is dimmed when no
  priorities are set
- **Weekly balance bar** — all categories stay visible, non-priority ones dimmed, each
  labelled with the user's own name for it
- **"Up Next"** — surfaces the soonest event in any priority category
- **Imbalance callouts** — flags priorities getting no time, and non-priorities crowding them out

Priorities do NOT affect:
- Brain dump categorization (GPT still classifies into the 4 categories neutrally)

Two priorities may share a category (e.g. "Wellness" and "Marathon training"). When
that happens `categoryDisplayLabel()` falls back to the built-in category name rather
than picking one arbitrarily.

## Key Architecture Decisions
- **No router** — conditional rendering in App.tsx swaps between views
- **OpenAI calls go through a Vercel serverless proxy** (`../kaisey-proxy/`) — never expose API keys client-side
- **CalendarEvent is the core data type** — `{ id, title, time, date, duration, type: EventCategory, color }`
- **CalendarAction is the mutation type** — `{ type: "add"|"remove"|"replace", event, replaceWith?, recurrence? }`
- **All calendar mutations** flow through `handleScheduleChange()` in App.tsx, which updates local state AND syncs to Google Calendar API

## Brain Dump Flow
The chatbot (`KaiseyChatbot.tsx`) detects brain dumps via `detectIntent()`:
1. User pastes freeform text (2+ clauses or explicit trigger)
2. GPT extracts tasks with category, priority, duration, preferred time
3. User sees extracted tasks with colored category dots (tappable to change)
4. User adjusts durations/time preferences, clicks "Schedule All"
5. GPT proposes optimized schedule avoiding conflicts
6. User reviews, revises via chat, or accepts
7. Events added to calendar

Quick actions (single commands like "add gym at 5pm") go through `callOpenAI()` with function calling.

## Build & Deploy
```bash
cd kaisey-src && npx vite build    # outputs to ../kaisey/
```
- Built files go to `../kaisey/` (configured in vite.config.ts `outDir`)
- Clean old `../kaisey/assets/` before building
- Deployed as static files on GitHub Pages at `anishasubs.github.io/portfolio/kaisey/`
- Base path: `/portfolio/kaisey/`

## Important Patterns
- The chatbot has two modes: GPT-4o-mini with function calling (primary) and a keyword/regex fallback engine (`processUserRequestFallback`)
- Brain dump is a 7-phase state machine: IDLE → EXTRACTING → EDITING → PROPOSING → REVIEW_SCHEDULE → REVISING → ACCEPTED
- localStorage keys: `kaisey-priority`, `google_calendar_token`, `kaisey-tour-seen`
- Google OAuth client ID is hardcoded in `env.ts`

## Common Tasks
- **Modify chatbot behavior**: Edit system prompt in `KaiseyChatbot.tsx` `callOpenAI()` or the keyword engine in `processUserRequestFallback()`
- **Change priority logic**: Edit `priority.ts` — `PRIORITY_CONFIG`, `computeWeeklyBalance()`, `computeImbalanceCallouts()`
- **Update proxy**: Edit `../kaisey-proxy/api/chat.ts`, deploy with `cd ../kaisey-proxy && npx vercel --prod`
