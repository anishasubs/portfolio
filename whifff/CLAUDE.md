# Whifff — AI Perfume Discovery Quiz

## What This Is
Whifff is a perfume recommendation quiz app for L'Oréal Brandstorm 2026. Guides users through scent preferences and returns personalized fragrance matches from a 20,000+ perfume database. Recommendations are filtered to L'Oréal Luxe portfolio brands only.

## Tech Stack
- **Framework**: Next.js 16 + React 19 + TypeScript
- **Styling**: Tailwind CSS v4 (PostCSS)
- **Animation**: Framer Motion + CSS keyframes
- **Data**: Kaggle Fragrantica CSV dataset (`scripts/data/fra_cleaned.csv`, latin-1 encoding). Supabase-ready via data provider abstraction.
- **Fonts**: Shrikhand (brand), Playfair Display (tagline/profile), Nunito (body), Pacifico (decorative)

## Project Structure
```
whifff/
  app/
    page.tsx              # Main quiz page (splash → 6-step quiz → results)
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
    VibeGrid.tsx          # L'Oréal segmentation vibe selector (4 territories)
    OccasionGrid.tsx      # Occasion selector (everyday, datenight, work, special)
    StrengthPicker.tsx    # Sillage/strength selector
    MixingAnimation.tsx   # Animated mixing with capsules + Scent Key
    ResultCard.tsx        # Individual perfume result card
    ScentProfileCard.tsx  # Buzzfeed-style scent profile result (share icon + explanation)
    DiscoveryKitCTA.tsx   # Discovery Kit order CTA card (wraps recs inside)
    ScentKeyAnim.tsx      # Animated Scent Key + capsules SVG
  hooks/
    useQuizState.ts       # Main quiz state machine (6 steps)
    useTypewriter.ts      # Typewriter effect for chat bubbles
  lib/
    types.ts              # TypeScript interfaces (includes Vibe, VibeOption)
    constants.ts          # Quiz options, VIBES, VIBE_MAP, OCC_MAP, chat copy
    data-provider.ts      # Abstraction layer (mock or Supabase)
    mock-data.ts          # 20,000+ perfume database
    recommend.ts          # Scoring algorithm (L'Oréal brand filter + vibe scoring)
    session.ts            # Server-side session management
```

## Quiz Flow (6 steps)
0. Past Perfumes — search & select up to 2 loved fragrances (optional)
1. Scent Families — multi-select from 6 families
2. Vibe — "how do you want to be perceived?" (L'Oréal 4 territories: Unforgettable, Effortlessly cool, Magnetic, Warm & approachable)
3. Occasion — single choice (everyday, date night, office, going out)
4. Strength — single choice (whisper, just right, announce me)
5. Mixing Animation — capsules + Scent Key assembling
→ Results — Scent Profile Card on top → Discovery Kit card with recs inside → Order CTA

## L'Oréal Integration
- **Vibe/Territory mapping** (`VIBES` in constants.ts): Maps L'Oréal Luxe Sociovision 2022 segmentation (Sensorial Stimulation, Personal Assertion, Social Impact, Mindful Wellness) to quiz-friendly labels
- **Scent Profile Card**: Buzzfeed-style result ("The Main Character", "The Signature", "The It Girl", "The Soft Life") with choice-based explanation and Web Share API
- **Brand filter**: `LOREAL_BRANDS` Set in recommend.ts — only recommends YSL, Lancôme, Giorgio Armani, Valentino, Prada, Mugler, Viktor & Rolf, Cacharel, Diesel, Maison Margiela, Atelier Cologne, Azzaro, Ralph Lauren
- **Vibe scoring**: `VIBE_MAP` maps each territory to accord keywords for recommendation scoring

## Results Page Layout
1. **ScentProfileCard** — gradient card with emoji, profile name, description, choice-based explanation, share icon (top-right)
2. **DiscoveryKitCTA** — frosted glass card containing "Your Discovery Kit is ready" heading + 3 ResultCards rendered as children + "Order Your Kit — $50" CTA button
3. **Start over** — subtle white text link below

## Recommendation Engine
Scores candidates by: past perfume note/accord matching (+3/+4), scent family alignment (+2/+3), vibe/territory accord match (+2), occasion accord match (+1), sillage match (+3), rating boost (+0.5×rating). Filters to L'Oréal brands only. Returns top 3 with human-readable reason strings.

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
- Vibe colors: sensorial (#C2544A), assertion (#8B6EC2), social (#4A8EC2), wellness (#5AAF6A)

## Pitch Deck Assets
- `whifff-deck-user-slide.html` — "Our User: Gen Z" section for Figma deck (L'Oréal Sociovision 2022 data, 3 insight cards)
