# Kaisey — AI MBA Co-Pilot

## What This Is
Kaisey is a React+Vite+Tailwind+shadcn single-page app that acts as an AI calendar assistant for MBA students. It integrates with Google Calendar and uses OpenAI (gpt-4o-mini) for intelligent scheduling.

## Tech Stack
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **AI**: OpenAI gpt-4o-mini (via serverless proxy at kaisey-proxy/)
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
        CommandCenter.tsx        # "Your Day at a Glance" — next event, priority pills, weekly balance
        BrainDumpPlanner.tsx     # Freeform text → structured schedule (7-phase state machine)
        KaiseyChatbot.tsx        # Chat interface with function calling for calendar actions
        CalendarView.tsx         # Day/Week/Month calendar with edit/delete
        AgentSuggestion.tsx      # Recommendation cards (conflicts, optimization)
        ProfileSection.tsx       # Google profile display
        SettingsPage.tsx         # Integration settings
        OnboardingTour.tsx       # 4-step spotlight walkthrough for first-time users
        priority.ts              # Priority mode configs, balance utilities
      ui/                        # shadcn/ui primitives (Button, Card, etc.)
    config/
      env.ts                     # Vite env var mapping
  vite.config.ts
```

## Key Architecture Decisions
- **No router** — conditional rendering in App.tsx swaps between views
- **OpenAI calls go through a Vercel serverless proxy** (`kaisey-proxy/`) — never expose API keys client-side
- **CalendarEvent is the core data type** — `{ id, title, time, date, duration, type, color }`
- **CalendarAction is the mutation type** — `{ type: "add"|"remove"|"replace", event: { title, time, duration, date? }, replaceWith?, recurrence? }`
- **Priority system** uses prompt engineering (injecting hints into GPT system prompts) + visual feedback (weekly balance bar, color-coded events, imbalance callouts)
- **All calendar mutations** flow through `handleScheduleChange()` in App.tsx, which updates local state AND syncs to Google Calendar API

## Build & Deploy
```bash
cd kaisey-src && npx vite build    # outputs to ../kaisey/
```
- Built files go to `../kaisey/` (configured in vite.config.ts `outDir`)
- Clean old `../kaisey/assets/` before building
- Deployed as static files on GitHub Pages at `anishasubs.github.io/portfolio/kaisey/`
- Base path: `/portfolio/kaisey/`

## Priority Modes
Four modes defined in `priority.ts`:
- **Academics** — highlights class/study events, biases toward study blocks during peak hours
- **Recruiting** — highlights recruiting/networking events, gives interview prep best time slots
- **Social** — highlights networking/meeting events, leaves free time for spontaneous social
- **Wellness** — highlights workout events, adds breaks between intense blocks

## Important Patterns
- Event types are inferred from title keywords (e.g., "gym" → workout, "Goldman" → recruiting) in `getEventTypeAndColor()` in App.tsx
- The chatbot has two modes: GPT-4o-mini with function calling (primary) and a keyword/regex fallback engine
- BrainDumpPlanner is a 7-phase state machine: IDLE → BRAIN_DUMP_INPUT → EXTRACTING → CLARIFY → PROPOSING → REVIEW_SCHEDULE → REVISING → ACCEPTED
- localStorage keys: `kaisey-priority`, `google_calendar_token`, `kaisey-tour-seen`
- Google OAuth client ID is hardcoded for the specific Google Cloud project

## Common Tasks
- **Add a new event type**: Update `getEventTypeAndColor()` in App.tsx + `PRIORITY_CONFIG` in priority.ts
- **Modify chatbot behavior**: Edit system prompt in `KaiseyChatbot.tsx` `callOpenAI()` or the keyword engine in `processUserRequest()`
- **Change priority logic**: Edit `priority.ts` — `PRIORITY_CONFIG`, `computeWeeklyBalance()`, `computeImbalanceCallouts()`
- **Update proxy**: Edit `kaisey-proxy/api/chat.ts`, deploy with `vercel --prod`
