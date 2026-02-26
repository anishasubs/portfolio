# CLAUDE.md — Indē Wild Case Study

## Project Overview

This is a portfolio case study page for Anisha Subberwal's work as U.S. Growth Lead at Indē Wild (Summer 2025). It lives at `inde-wild-case-study/index.html` and is hosted at `https://anishasubs.github.io/portfolio/inde-wild-case-study/`.

---

## The Story (Read This First)

This is a **community-led growth story**, not a campaign case study. The case study documents how a TikTok presence and creator community was built from zero, which ultimately enabled a successful Labor Day sale campaign. The campaign is the payoff — the community is the story.

**The full arc in order:**
1. Started with no TikTok account, no US community, no playbook — crowded beauty space, scrappy budget, tight timelines
2. Identified the wedge user through intuition and content testing
3. Posted content building toward that user
4. Hosted a NYC event with a South Asian retail partner — got product into people's hands, built real in-person community
5. Went viral August 3rd — thesis validated
6. Seeded 160+ creators immediately while momentum was hot
7. Activated creators for Labor Day sale — 72 hours, $344K
8. Launched new product (spicy lip balm) — community ready to receive it
9. Hosted influencer dinner at the South Asian retail partner — deepened creator relationships
10. Result: TikTok Shop as a new revenue stream, 4.6K followers, organic tags still coming in without prompting

**The campaign (step 7) is the middle of the story, not the whole story.**

---

## The User

She is the strategic starting point for everything on this page.

- **Who:** 18–35, South Asian woman, US diaspora
- **Key insight:** She already knows Ayurvedic rituals — champi, turmeric, amla, oil pulling. These are her grandmother's practices. She's not looking to be educated about them. She wants a brand that treats them as beautiful and modern, not exotic.
- **The gap she feels:** Her rituals have been co-opted and sold back to her by brands that don't know her. She wants recognition, not an introduction.
- **Why Indē Wild:** Modern packaging for ingredients she already lives with. The whitespace is: Ayurvedic ingredients with packaging she's not embarrassed to leave on her bathroom counter.
- **Why TikTok worked:** She discovers through creators who look like her. Authenticity is the only thing that converts her — she sees through polished ads instantly.
- **Why she's the wedge:** She needs zero education. Emotional resonance is immediate. She becomes the most authentic creator because she's not performing interest — she genuinely has it. Her advocacy pulls in adjacent (Western) users more convincingly than any brand campaign.

**The founder (Diipa Khosla) had 2.6M Instagram followers — but it was primarily an Indian audience. The diaspora woman in the US already knew the brand existed, but didn't know the product was available to her here. The gap wasn't brand awareness. It was access awareness.**

---

## Key Facts & Metrics

| Metric | Value |
|--------|-------|
| Creators seeded | 160+ |
| Campaign window | 72 hours (Aug 27–31, 2025) |
| Sale posts generated | 45 |
| Activation rate | 28% (nearly 2× industry standard) |
| Total views | 481K+ |
| Community creators views | 31,837 |
| Macro influencer views | 450,052 |
| QTD Revenue | $344,729.80 |
| YoY revenue growth | +30% |
| Conversion rate lift | +20% |
| Follower growth | 867 → 1,015 (campaign period) → 4,600+ (now) |
| Organic tags/day (sustained) | 4+ |
| Viral date | August 3, 2025 |
| Labor Day sale dates | August 30–31, 2025 |

---

## Coding Rules

**Never remove or modify:**
- Navigation
- Hero video (`animate_this_optimized.mp4`)
- Product showcase cards
- Competitive positioning matrix (the Heritage vs. Modernity chart)
- TikTok videos (challenge video + 3 winner videos)
- 28% activation rate callout
- Key Learnings section
- "Applying to TikTok Shop Merchant Success" section
- Footer
- Any existing CSS variables, animations, or JS

**Always:**
- Append new CSS to the existing stylesheet — never create a new one
- Match existing fonts, colors, spacing, and card patterns exactly
- Use IntersectionObserver for any scroll-triggered animations
- Keep all changes additive — new sections insert between existing ones

**Never:**
- Introduce new color palettes that conflict with existing styles
- Add external font imports unless the font already exists on the page
- Rewrite existing copy unless a specific change is called out
- Use frameworks (React, Vue, etc.) — this is a vanilla HTML/CSS/JS site

---

## File Structure

```
inde-wild-case-study/
├── index.html          # Main page — all sections live here
├── [stylesheet]        # Check the <link> tag in <head> for the actual filename
├── animate_this_optimized.mp4
├── Tiktok-Challenge.mp4
├── Winner-1.mp4
├── Winner-2.mp4
├── Winner 3.mp4
├── shopify-analytics.png   # Static screenshot — will be replaced by animated chart
└── assets/
    ├── product-1.jpg
    ├── product-2.jpg
    └── product-3.jpg
```

---

## Planned Changes (Phased)

### Prompt 1 — Currently in scope
- [ ] Add "The User" section before "About Indē Wild"
- [ ] Update "The Challenge" section with constraints language and authenticity framing
- [ ] Replace `shopify-analytics.png` with animated SVG chart (vanilla JS, IntersectionObserver trigger)

### Prompt 2 — Next
- [ ] Add "What Do We Know" section (crowded space, scrappy budget, tight timelines, no online presence)
- [ ] Add prominent "My Role" callout card
- [ ] Reframe "The Foundation" section around the full growth arc
- [ ] Update "Strategic Execution" — Tier 1/Tier 2 mentioned once only, goals mirror results
- [ ] Add goals → results mirror table to "Campaign Impact"

### Prompt 3 — Later
- [ ] Add the full 8-step growth timeline (content → event → viral → seeding → campaign → product launch → dinner → revenue stream)
- [ ] Add the influencer dinner + South Asian retail partner narrative
- [ ] Update ending to reflect TikTok Shop as a new revenue stream + 4.6K followers + self-sustaining community

---

## Animated Chart Specs (Prompt 1)

Replaces `shopify-analytics.png`. Vanilla JS + inline SVG, no libraries.

### Two lines — this is a year-over-year comparison chart

Matches the actual Shopify Analytics view: solid line = 2025, dashed line = 2024.

**The story the chart tells:** 2024 had a sharp single-day flash sale spike with no community — it immediately crashed back to zero. 2025 built a wider peak across 4 days (Aug 29–Sep 1) that sustained at an elevated baseline through September. The curve beats the spike. Community beats a one-time promo.

---

**2025 data — solid line (Jul 1–Sep 10, 72 days):**
```js
// Days 0–55: flat baseline ~$600–$2,000
value = 800 + (Math.sin(i * 2.3 + 1.7) * 0.5 + 0.5) * 1200

// Days 56–58 (Aug 27–29): pre-sale ramp
value = 1400 + (Math.sin(i * 2.1 + 0.9) * 0.5 + 0.5) * 1200

// Day 59 (Aug 29): sale starts, ramp up
value = 18000

// Day 60 (Aug 30): peak
value = 58000

// Day 61 (Aug 31): sustained high
value = 44000

// Day 62 (Sep 1): sale end, still elevated
value = 28000

// Days 63–71: post-campaign elevated baseline ~$2,000–$4,000
value = 2200 + (Math.sin(i * 1.9 + 3.1) * 0.5 + 0.5) * 1600
```

**2024 data — dashed line (same 72-day window for alignment):**
```js
// Days 0–58: flat baseline, slightly lower than 2025 ~$400–$1,400
value = 500 + (Math.sin(i * 2.7 + 0.8) * 0.5 + 0.5) * 900

// Day 59 (Aug 29): no ramp, still flat
value = 600 + (Math.sin(59 * 2.7 + 0.8) * 0.5 + 0.5) * 900

// Day 60 (Aug 30): sharp single-day spike
value = 36000

// Day 61 (Aug 31): immediate crash
value = 8000

// Days 62–71: drops back to flat baseline, slightly below pre-spike
value = 400 + (Math.sin(i * 2.7 + 0.8) * 0.5 + 0.5) * 700
```

---

**Visual requirements:**
- Baseline sits in bottom 8% of chart height — spike must look dramatically tall
- Whitespace (flat days) should feel vast and intentional — this is a design choice, not a bug
- **2025 line:** solid, primary accent color matching page palette
- **2024 line:** dashed (stroke-dasharray), same color but 40% opacity
- Legend: small "— Jul 1–Sep 10, 2025" and "··· Jul 1–Sep 30, 2024" below chart, matching Shopify's own legend style
- Match existing page color palette exactly (check CSS variables)

**Annotations (fade in after both lines complete drawing):**
1. Subtle italic gray text centered over flat baseline region (days 10–50): `← weeks with no TikTok presence →`
2. Filled dot on 2025 peak (day 60) + callout box: `Aug 29–Sep 1 · Labor Day Sale / $58K peak · sustained lift through Sep`
3. Small label on 2024 spike: `2024: flash sale, no community` pointing to the sharp crash

**X-axis labels:** Jul 1 · Jul 15 · Aug 1 · Aug 15 · Aug 30 · Sep 10
**Y-axis labels:** $0 · $15K · $30K · $45K · $60K
**Trigger:** IntersectionObserver — animate when chart scrolls into view. Draw 2024 line first (dashed, fast ~1s), then draw 2025 line on top (solid, slower ~2s) so the improvement is the final thing the eye lands on.
**Hover:** Tooltip showing date + both year values

---

## Tone & Voice

- First person ("I built", "I identified", "I activated") — this is Anisha's work, emphasize her ownership
- Specific and metric-driven — no vague language like "helped with" or "assisted in"
- The word "authenticity" should appear as a strategic choice, not a buzzword
- Avoid "leveraged" and "utilized"
- The user (South Asian diaspora woman) should feel like a person, not a demographic segment
