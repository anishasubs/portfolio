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
- CSV files are parsed in-page via `FileReader`. Nothing is uploaded.
- Nothing is sent to any AI model. Every insight is computed by rules in this
  file, so your transaction history never leaves the machine.
- `.gitignore` blocks exported backups and any CSV/OFX/QFX statements dropped
  into `finance/`, so real data can't be committed by accident.

Anyone with access to the browser profile can read the data — don't use a
shared machine, and export backups regularly, since clearing site data erases it.

## Getting started

1. **Accounts** — add checking, savings (with its APY), credit cards, brokerage,
   and 401(k). Balances are snapshots you update; each update is kept as history,
   which is what draws the net-worth chart.
2. **Import** — export CSV from your bank and drop it in. Columns are auto-mapped
   and re-importing an overlapping statement is a no-op (transactions are
   fingerprinted on date + amount + merchant + account).
3. **Budgets / Goals** — set monthly limits and savings targets.
4. **Settings** — set the benchmark savings APY, emergency-fund target, and your
   401(k) limit and year-to-date contribution. These drive the advice.

Prefer to try it first? **Settings & Data → Load example data** fills it with a
fictional twelve-month history.

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
