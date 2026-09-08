# Ledger — personal finance agent

A single-file, zero-network app for managing real money: accounts, imported
transactions, budgets, goals, and an agent that reads the data and tells you
what to do about it.

Open `finance/index.html` in a browser. There is no build step and no server.

## Why it's built this way

This repository is public and deploys to GitHub Pages, so the app is designed
so that **the code can be public while the data never is**:

- The page loads no external scripts, fonts, or stylesheets and makes **no
  network requests of any kind**. Verify in the browser's Network tab, or just
  run it with the network off.
- Transactions are stored in `localStorage` under the key `ledger.v1`, scoped to
  whatever origin you opened the page from.
- Files you drop — CSV, PDF, or screenshot — are read in-page via `FileReader`.
  Nothing is uploaded.
- PDF text extraction and screenshot OCR run **on your machine**, using
  [pdf.js](https://mozilla.github.io/pdf.js/) and
  [tesseract.js](https://tesseract.projectnaptha.com/) vendored under
  `finance/vendor/` (both Apache-2.0). They are loaded lazily, only when you
  import a file, so opening the app stays instant.
- Every insight on the Overview tab is computed by rules in this file, and OCR
  runs locally rather than through a vision API.
- **One exception, off by default: the AI advisor.** See below.
- `.gitignore` blocks exported backups and any CSV/OFX/QFX statements dropped
  into `finance/`, so real data can't be committed by accident.

Anyone with access to the browser profile can read the data — don't use a
shared machine, and export backups regularly, since clearing site data erases it.

## Getting started

1. **Accounts** — add checking, savings (with its APY), credit cards, brokerage,
   and 401(k). Balances are snapshots you update; each update is kept as history,
   which is what draws the net-worth chart.
2. **Import** — drop in a CSV export, a PDF statement, or a screenshot of your
   account activity. See [Importing statements](#importing-statements) below.
   Re-importing an overlapping statement is a no-op: transactions are
   fingerprinted on date + amount + merchant + account.
3. **Budgets / Goals** — set monthly limits and savings targets.
4. **Settings** — set the benchmark savings APY, emergency-fund target, and your
   401(k) limit and year-to-date contribution. These drive the advice.

Prefer to try it first? **Settings & Data → Load example data** fills it with a
fictional twelve-month history.

## Importing statements

Three file types, all parsed locally.

| Type | How it's read | Works from `file://` |
|---|---|---|
| `.csv` | Columns auto-mapped; handles single-amount and split debit/credit layouts, `$`/`£`, comma grouping, parenthesised negatives, and US/UK/ISO dates | Yes |
| `.pdf` | Text extracted with pdf.js, rebuilding rows from glyph positions so columns survive | Yes |
| `.png` `.jpg` | OCR via tesseract.js, upscaled 2× first (measurably better on small UI text) | **No — needs http** |

Everything lands in a **review screen** before it is saved. Every date,
description, category and amount is editable, rows can be deselected, and all
signs can be flipped at once. Nothing is written until you confirm.

### Running it for screenshots

OCR needs the app served over http, because browsers block a `file://` page
from loading the OCR engine off disk. From the repo root:

```
python3 -m http.server 8000
```

then open `http://localhost:8000/finance/`. That is still entirely local —
nothing goes over the internet. PDFs and CSVs work either way.

### What gets pulled out

- **Transactions** — date, description, amount, auto-categorized.
- **Balances** — ending/current/statement balance, applied to the selected
  account as a new snapshot.
- **401(k) contributions year-to-date** — written straight into the setting that
  drives the contribution-pacing insight.

Two layouts are handled: printed statements (date, description and amount on one
row) and banking apps (merchant and amount on one line, date on the next).

**Sign conventions are verified, not guessed.** When a statement has a running
balance column, consecutive balances are differenced against each row's amount;
if they agree, the column is dropped and the sign convention is confirmed from
the statement itself. Card statements that print charges as bare positives are
detected and flipped, with payments and refunds kept positive.

**Investment and 401(k) statements yield balances only.** Their number columns
are share counts and holdings values, not spending — reading them as
transactions would be worse than reading nothing. Holdings are not tracked; the
account value is what feeds net worth.

### Limits worth knowing

- A **scanned** PDF has no text layer. The app says so and suggests
  screenshotting it instead, which routes through OCR.
- OCR is very good on crisp app screenshots and less good on photos of paper.
  Check the amounts in the review screen — that is what it is there for.
- Statement layouts vary enormously. If a file parses badly, expand *"Show the
  raw text that was read from the file"* to see exactly what the parser saw.

## The AI advisor (opt-in)

The only part of Ledger that sends anything off the device. It is **off until you
turn it on**, and even then sends nothing until you press Ask.

### What it does

Answers questions about your own numbers — how much to keep in checking, whether
your savings account is costing you, how to allocate your 401(k) — using the
balances already in the app.

### What is sent

An aggregated summary: account names and balances, APYs, average monthly spend
**by category**, income, savings rate, budgets, goals, 401(k) contributions, and
the optional profile fields (age, retirement age, risk comfort, employer match,
card APR, fund menu).

**Individual transactions and merchant names are never sent** — only category
totals. Account numbers are never sent because the app never stores them. Expand
*"Show exactly what will be sent"* to inspect the payload before every send.

While the advisor is on, the header badge changes from *Local only · no network*
to *Advisor on · summary sent when you ask*, so the page never overstates the
guarantee.

### Setup

The advisor calls your own proxy so the API key stays server-side rather than in
a public page. The endpoint lives in `kaisey-proxy/api/advice.ts` and reuses the
`OPENAI_API_KEY` already configured there. Deploy it once:

```
cd kaisey-proxy && npx vercel --prod
```

Then set the endpoint under **Settings & Data → Advisor endpoint** (it defaults to
`https://kaisey-proxy.vercel.app/api/advice`).

The system prompt lives on the server, not in the client, so it can't be edited
from the browser. The endpoint rate-limits to 10 requests/minute, caps payload
size, and never logs request bodies.

### What it will not do

The model has **no live data**. It cannot look up current savings rates, fund
prices, or this year's contribution limit, and is instructed to say so rather
than inventing a number. It recommends fund *types* and allocations rather than
individual stocks, and points you to a CPA or fiduciary for anything with tax
consequences. It is general education, not licensed financial advice.

## What the agent checks

Findings are ranked by severity, with the most urgent first:

| Area | What it looks for |
|---|---|
| Savings APY | Balance earning below the benchmark rate, and the annual dollars that costs |
| Idle cash | Checking well above a six-week float, and what moving the excess would earn |
| Emergency fund | Liquid cover in months against your real average spending |
| 401(k) | Year-end projection against the annual limit; employer-match warnings |
| Credit cards | Outstanding balances, and whether liquid cash covers them |
| Budgets | Over-budget categories, and month-end pacing on the ones trending over |
| Spending spikes | Categories running well above their trailing 3-month average |
| Recurring charges | Detected subscriptions, the discretionary subtotal, and lapsed ones |
| Duplicates | The same merchant and amount charged within a few days |
| Fees | Fees and interest paid over the last 12 months |
| Savings rate | Income vs. spending for the last complete month |
| Goals | Monthly amount needed to hit each target date |
| Net worth | Movement since the previous snapshot |

Projections only extrapolate the *variable* part of a category. A gym fee billed
once on the 6th is fully incurred, so it isn't multiplied out as if it accrued
daily — otherwise every fixed cost would look like an overrun early in the month.

## Categorization

Merchants are matched against built-in rules. When you change a category, the
agent learns that merchant and applies it to every past and future match; the
learned rules are listed under Settings & Data.

## Two numbers to check yourself

The benchmark savings APY and the 401(k) contribution limit are **editable
defaults, not live data** — the app can't look anything up. Verify the current
figures and set them in Settings.
