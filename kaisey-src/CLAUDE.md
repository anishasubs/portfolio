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
        PrioritySelector.tsx     # Pick Academics/Recruiting/Social/Wellness
        CommandCenter.tsx        # "Your Day at a Glance" — next event, weekly balance bar
        KaiseyChatbot.tsx        # Chat + brain dump (7-phase state machine)
        CalendarView.tsx         # Day/Week/Month calendar with edit/delete
        AgentSuggestion.tsx      # Recommendation cards (conflicts, optimization)
        ProfileSection.tsx       # Google profile display
        SettingsPage.tsx         # Integration settings
        OnboardingTour.tsx       # 4-step spotlight walkthrough for first-time users
        priority.ts              # Priority mode configs, EventCategory type, balance utilities
      ui/                        # shadcn/ui primitives (Button, Card, etc.)
    config/
      env.ts                     # Vite env var mapping
  vite.config.ts
```

## Event Categories (4 types)
Events have exactly 4 categories, mapping 1:1 with priority modes:
- `academics` (blue) — classes, studying, prep, homework, deep work
- `recruiting` (red) — interviews, info sessions, career events
- `social` (orange) — coffee chats, networking, happy hours, lunches
- `wellness` (green) — gym, yoga, meditation, workouts

Defined as `EventCategory` type in `priority.ts`. Keywords for auto-classification are in `getEventTypeAndColor()` in App.tsx.

## Priority Modes
Four modes defined in `priority.ts`. Priority mode controls:
- **Agent recommendations** — suggestions are filtered by selected priority
- **Weekly balance bar** — shows time breakdown per category (all categories always visible)

Priority mode does NOT affect:
- Brain dump categorization (GPT classifies neutrally)
- Calendar event visibility (no dimming of non-priority events)

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
