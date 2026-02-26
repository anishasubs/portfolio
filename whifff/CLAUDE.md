# Whifff — AI Perfume Discovery Quiz

## What This Is
Whifff is a perfume recommendation quiz app that guides users through scent preferences and returns personalized fragrance matches from a 20,000+ perfume database.

## Tech Stack
- **Framework**: Next.js 16 + React 19 + TypeScript
- **Styling**: Tailwind CSS v4 (PostCSS)
- **Animation**: Framer Motion
- **Data**: Mock in-memory database (CSV-sourced from Fragrantica). Supabase-ready via data provider abstraction.
- **Fonts**: Shrikhand (brand), Playfair Display (tagline), Nunito (body), Pacifico (decorative)

## Project Structure
```
whifff/
  app/
    page.tsx              # Main quiz page (splash → multi-step quiz → results)
    admin/page.tsx        # Admin analytics dashboard (key-protected)
    ledger/page.tsx       # Public session ledger (infinite scroll)
    api/
      sessions/route.ts   # Session CRUD + stats
      recommend/route.ts  # Recommendation engine endpoint
      perfumes/
        search/route.ts   # Perfume search
        [id]/image/       # Image proxy
  components/
    BottleSpritz.tsx      # Animated splash screen
    PerfumeSearch.tsx     # Search & select past favorites (max 2)
    ScentFamilyGrid.tsx   # 6 scent families (floral, sweet, fresh, warm, fruity, musky)
    PriceSelector.tsx     # Price range picker
    OccasionGrid.tsx      # Occasion selector (everyday, datenight, work, special)
    StrengthPicker.tsx    # Sillage/strength selector
    MixingAnimation.tsx   # Animated recommendation mixing
    ResultCard.tsx        # Individual perfume result
  hooks/
    useQuizState.ts       # Main quiz state machine
    useTypewriter.ts      # Typewriter effect for chat bubbles
  lib/
    types.ts              # TypeScript interfaces
    constants.ts          # Quiz options, chat copy
    data-provider.ts      # Abstraction layer (mock or Supabase)
    mock-data.ts          # 20,000+ perfume database
    recommend.ts          # Scoring algorithm
    session.ts            # Server-side session management
```

## Quiz Flow (6 steps)
1. Past Perfumes — search & select up to 2 loved fragrances (optional)
2. Scent Families — multi-select from 6 families
3. Price Range — single choice
4. Occasion — single choice
5. Strength — single choice
6. Results — recommendations with explanations

## Recommendation Engine
Scores candidates by note/accord matching against past perfumes, scent family alignment, price range, occasion mapping, and sillage/strength preference. Returns top results with user-friendly reason strings.

## Admin Dashboard
- Protected by `ADMIN_API_KEY` env var (saved in localStorage)
- Shows: total sessions, completion rate, drop-off by step, top families/occasions/recommendations, device breakdown
- Auto-refreshes every 60s

## Environment Variables
```
ADMIN_API_KEY=                    # Admin dashboard protection
NEXT_PUBLIC_SUPABASE_URL=         # Phase 2+ (Supabase swap)
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Phase 2+
SUPABASE_SERVICE_ROLE_KEY=        # Phase 2+
```

## Deploy
Deployed on Vercel (root directory: `whifff`). Pushes to `master` trigger auto-build.

## Key Patterns
- `getDataProvider()` abstracts data source — swap mock for Supabase without changing components
- Session tracking records full quiz journey (device, timestamps per step, answers, recommendations)
- Ledger is public with offset-based pagination (20 per page)
- Color palette: blue (#4A8EC2, #8FC5E8, #1B3A5C), red accent (#D4191A)
