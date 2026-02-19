"""
Whifff ETL Pipeline — Load Kaggle perfume datasets into Supabase.

Prerequisites:
  1. Download 3 Kaggle CSVs into scripts/data/:
     - fragrantica.csv  (Fragrantica dataset — notes, accords, ratings)
     - parfumo.csv      (Parfumo dataset — sillage, longevity, ratings)
     - ecommerce.csv    (E-commerce dataset — prices)
  2. pip install -r scripts/requirements.txt
  3. Set env vars in .env.local (or .env):
     NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

Usage:
  python scripts/etl.py                   # full run
  python scripts/etl.py --dry-run         # preview without uploading
  python scripts/etl.py --limit 100       # process only first 100 rows
  python scripts/etl.py --skip-match      # skip fuzzy matching (reuse cached matches)
"""

import argparse
import json
import math
import os
import sys
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv
from thefuzz import fuzz

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

DATA_DIR = Path(__file__).parent / "data"
MATCH_CACHE = DATA_DIR / "_match_cache.json"
FUZZY_THRESHOLD = 82
BATCH_SIZE = 500

# Brand alias normalization
BRAND_ALIASES: dict[str, str] = {
    "maison francis kurkdjian": "maison francis kurkdjian",
    "mfk": "maison francis kurkdjian",
    "viktor&rolf": "viktor & rolf",
    "viktor and rolf": "viktor & rolf",
    "yves saint laurent": "yves saint laurent",
    "ysl": "yves saint laurent",
    "carolina herrera": "carolina herrera",
    "ch": "carolina herrera",
    "sol de janeiro": "sol de janeiro",
    "sdj": "sol de janeiro",
    "parfums de marly": "parfums de marly",
    "pdm": "parfums de marly",
    "juliette has a gun": "juliette has a gun",
    "jhag": "juliette has a gun",
    "lancome": "lancôme",
    "lancôme": "lancôme",
}


def deslugify(slug: str) -> str:
    """Convert a URL slug like 'jean-paul-gaultier' to 'Jean Paul Gaultier'."""
    if not slug or not isinstance(slug, str):
        return slug
    # Replace hyphens with spaces and title-case
    name = slug.replace("-", " ").strip()
    # Title case with exceptions for small words
    words = name.split()
    result = []
    small_words = {"de", "du", "des", "le", "la", "les", "et", "by", "for", "the", "a", "an", "of", "no"}
    for i, w in enumerate(words):
        if i > 0 and w.lower() in small_words:
            result.append(w.lower())
        else:
            result.append(w.capitalize())
    return " ".join(result)


def normalize_brand(brand: str) -> str:
    b = brand.strip().lower()
    return BRAND_ALIASES.get(b, b)


def normalize_notes(notes_str: str | float) -> list[str]:
    """Parse a comma/semicolon-separated notes string into a clean list."""
    if pd.isna(notes_str) or not isinstance(notes_str, str):
        return []
    delim = ";" if ";" in notes_str else ","
    return [n.strip().lower() for n in notes_str.split(delim) if n.strip()]


def classify_price(price: float | None) -> str | None:
    if price is None or math.isnan(price):
        return None
    if price < 100:
        return "$"
    if price < 200:
        return "$$"
    return "$$$"


def classify_sillage(sillage_str: str | float) -> str | None:
    if pd.isna(sillage_str) or not isinstance(sillage_str, str):
        return None
    s = sillage_str.strip().lower()
    if any(k in s for k in ("soft", "intimate", "light", "weak")):
        return "soft"
    if any(k in s for k in ("strong", "enormous", "heavy", "beast")):
        return "strong"
    return "moderate"


def popularity_score(rating: float, review_count: int) -> float:
    """Bayesian-weighted popularity: rating * log(review_count + 1)"""
    if math.isnan(rating) or math.isnan(review_count):
        return 0.0
    return rating * math.log(review_count + 1)


# ---------------------------------------------------------------------------
# Load CSVs
# ---------------------------------------------------------------------------

def load_datasets(limit: int | None = None) -> tuple[pd.DataFrame, pd.DataFrame | None, pd.DataFrame | None]:
    """Load available CSVs. Only fragrantica is required."""
    frag_path = DATA_DIR / "fragrantica.csv"
    if not frag_path.exists():
        print(f"ERROR: {frag_path} not found. Download the Fragrantica dataset first.")
        sys.exit(1)

    print(f"Loading {frag_path}...")
    # Auto-detect delimiter (some Kaggle CSVs use semicolons)
    with open(frag_path, "r", encoding="utf-8", errors="replace") as f:
        first_line = f.readline()
    sep = ";" if first_line.count(";") > first_line.count(",") else ","
    frag = pd.read_csv(frag_path, sep=sep, nrows=limit, encoding="latin-1")
    # Normalize column names to lowercase with underscores
    frag.columns = [c.strip().lower().replace(" ", "_") for c in frag.columns]
    print(f"  Fragrantica: {len(frag)} rows, columns: {list(frag.columns)}")

    parfumo = None
    parfumo_path = DATA_DIR / "parfumo.csv"
    if parfumo_path.exists():
        print(f"Loading {parfumo_path}...")
        parfumo = pd.read_csv(parfumo_path, nrows=limit)
        parfumo.columns = [c.strip().lower().replace(" ", "_") for c in parfumo.columns]
        print(f"  Parfumo: {len(parfumo)} rows, columns: {list(parfumo.columns)}")

    ecom = None
    ecom_path = DATA_DIR / "ecommerce.csv"
    if ecom_path.exists():
        print(f"Loading {ecom_path}...")
        ecom = pd.read_csv(ecom_path, nrows=limit)
        ecom.columns = [c.strip().lower().replace(" ", "_") for c in ecom.columns]
        print(f"  E-commerce: {len(ecom)} rows, columns: {list(ecom.columns)}")

    return frag, parfumo, ecom


# ---------------------------------------------------------------------------
# Fuzzy matching
# ---------------------------------------------------------------------------

def fuzzy_match_datasets(
    frag: pd.DataFrame,
    other: pd.DataFrame,
    other_name: str,
    skip_match: bool = False,
) -> dict[int, int]:
    """Match rows from `other` to `frag` by brand + name fuzzy match.
    Returns {other_index: frag_index}."""

    cache_key = f"{other_name}_matches"
    if skip_match and MATCH_CACHE.exists():
        cached = json.loads(MATCH_CACHE.read_text())
        if cache_key in cached:
            matches = {int(k): int(v) for k, v in cached[cache_key].items()}
            print(f"  Loaded {len(matches)} cached matches for {other_name}")
            return matches

    print(f"  Fuzzy matching {other_name} -> Fragrantica ({len(other)} x {len(frag)})...")

    # Detect brand and name columns flexibly
    def find_col(df: pd.DataFrame, candidates: list[str]) -> str | None:
        for c in candidates:
            if c in df.columns:
                return c
        return None

    frag_brand_col = find_col(frag, ["brand", "house", "designer", "brand_name"])
    frag_name_col = find_col(frag, ["name", "perfume", "perfume_name", "fragrance", "title"])
    other_brand_col = find_col(other, ["brand", "house", "designer", "brand_name"])
    other_name_col = find_col(other, ["name", "perfume", "perfume_name", "fragrance", "title"])

    if not all([frag_brand_col, frag_name_col, other_brand_col, other_name_col]):
        print(f"  WARNING: Could not identify brand/name columns for {other_name}. Skipping match.")
        return {}

    # Build lookup: normalized brand -> list of (frag_index, normalized_name)
    brand_index: dict[str, list[tuple[int, str]]] = {}
    for i, row in frag.iterrows():
        nb = normalize_brand(str(row[frag_brand_col]))
        nn = str(row[frag_name_col]).strip().lower()
        brand_index.setdefault(nb, []).append((int(i), nn))

    matches: dict[int, int] = {}
    matched = 0
    for j, row in other.iterrows():
        ob = normalize_brand(str(row[other_brand_col]))
        on = str(row[other_name_col]).strip().lower()

        candidates = brand_index.get(ob, [])
        if not candidates:
            continue

        best_score = 0
        best_idx = -1
        for fi, fn in candidates:
            score = fuzz.token_sort_ratio(on, fn)
            if score > best_score:
                best_score = score
                best_idx = fi
        if best_score >= FUZZY_THRESHOLD:
            matches[int(j)] = best_idx
            matched += 1

    print(f"  Matched {matched}/{len(other)} from {other_name}")

    # Cache matches
    cached = {}
    if MATCH_CACHE.exists():
        cached = json.loads(MATCH_CACHE.read_text())
    cached[cache_key] = {str(k): str(v) for k, v in matches.items()}
    MATCH_CACHE.write_text(json.dumps(cached, indent=2))

    return matches


# ---------------------------------------------------------------------------
# Merge + classify
# ---------------------------------------------------------------------------

def build_perfume_records(
    frag: pd.DataFrame,
    parfumo: pd.DataFrame | None,
    ecom: pd.DataFrame | None,
    parfumo_matches: dict[int, int],
    ecom_matches: dict[int, int],
) -> list[dict]:
    """Build final perfume records ready for Supabase upsert."""

    # Helper to find columns flexibly
    def find_col(df: pd.DataFrame, candidates: list[str]) -> str | None:
        for c in candidates:
            if c in df.columns:
                return c
        return None

    frag_name_col = find_col(frag, ["name", "perfume", "perfume_name", "fragrance", "title"]) or "name"
    frag_brand_col = find_col(frag, ["brand", "house", "designer", "brand_name"]) or "brand"
    frag_notes_col = find_col(frag, ["notes", "notes_all", "all_notes", "main_notes"])
    frag_accords_col = find_col(frag, ["accords", "main_accords", "top_accords"])
    frag_rating_col = find_col(frag, ["rating", "rating_value", "score"]) or "rating"
    frag_reviews_col = find_col(frag, ["reviews", "review_count", "rating_count", "number_votes", "num_reviews"]) or "reviews"
    frag_img_col = find_col(frag, ["image", "image_url", "img", "img_url", "picture"])

    # Check for separate Top/Middle/Base note columns (fra_cleaned.csv format)
    has_separate_notes = all(c in frag.columns for c in ["top", "middle", "base"])
    # Check for separate mainaccord1-5 columns
    accord_cols = [c for c in frag.columns if c.startswith("mainaccord")]
    has_separate_accords = len(accord_cols) > 0

    if has_separate_notes:
        print(f"  Detected separate Top/Middle/Base note columns")
    if has_separate_accords:
        print(f"  Detected {len(accord_cols)} mainaccord columns: {accord_cols}")

    # Parfumo columns
    p_sillage_col = find_col(parfumo, ["sillage", "projection"]) if parfumo is not None else None
    p_longevity_col = find_col(parfumo, ["longevity", "lasting", "duration"]) if parfumo is not None else None

    # E-commerce columns
    e_price_col = find_col(ecom, ["price", "price_usd", "amount"]) if ecom is not None else None

    # Reverse parfumo_matches: frag_idx -> parfumo_idx
    parfumo_rev: dict[int, int] = {v: k for k, v in parfumo_matches.items()}
    ecom_rev: dict[int, int] = {v: k for k, v in ecom_matches.items()}

    records: list[dict] = []
    for i, row in frag.iterrows():
        idx = int(i)
        raw_name = str(row.get(frag_name_col, "")).strip()
        raw_brand = str(row.get(frag_brand_col, "")).strip()
        if not raw_name or not raw_brand:
            continue
        # De-slugify if names look like URL slugs (all lowercase, possibly hyphenated)
        name = deslugify(raw_name) if raw_name == raw_name.lower() else raw_name
        brand = deslugify(raw_brand) if raw_brand == raw_brand.lower() else raw_brand

        # Extract notes: either from a single column or Top+Middle+Base
        if has_separate_notes:
            top = normalize_notes(row.get("top", ""))
            mid = normalize_notes(row.get("middle", ""))
            base = normalize_notes(row.get("base", ""))
            notes = list(dict.fromkeys(top + mid + base))  # dedupe, preserve order
        elif frag_notes_col:
            notes = normalize_notes(row.get(frag_notes_col, ""))
        else:
            notes = []

        # Extract accords: either from mainaccord1-5 columns or a single column
        if has_separate_accords:
            accords = []
            for ac in accord_cols:
                val = row.get(ac)
                if pd.notna(val) and str(val).strip():
                    accords.append(str(val).strip().lower())
        elif frag_accords_col:
            accords = normalize_notes(row.get(frag_accords_col, ""))
        else:
            accords = []

        # Handle European decimal format (comma as decimal separator: "4,12" -> 4.12)
        raw_rating = row.get(frag_rating_col)
        if isinstance(raw_rating, str):
            raw_rating = raw_rating.replace(",", ".")
        rating_val = pd.to_numeric(raw_rating, errors="coerce")
        rating = float(rating_val) if pd.notna(rating_val) else 0.0

        raw_reviews = row.get(frag_reviews_col)
        if isinstance(raw_reviews, str):
            raw_reviews = raw_reviews.replace(",", "").replace(".", "")
        reviews_val = pd.to_numeric(raw_reviews, errors="coerce")
        review_count = int(reviews_val) if pd.notna(reviews_val) else 0

        img_url = ""
        if frag_img_col and pd.notna(row.get(frag_img_col)):
            img_url = str(row[frag_img_col]).strip()
        elif "url" in frag.columns and pd.notna(row.get("url")):
            # Derive image URL from fragrantica URL (e.g., .../Name-12345.html -> fimgs.net ID)
            import re
            url_val = str(row["url"]).strip()
            m = re.search(r"-(\d+)\.html", url_val)
            if m:
                img_url = f"https://fimgs.net/mdimg/perfume/375x500.{m.group(1)}.jpg"

        # Merge from Parfumo
        sillage = None
        longevity = None
        if parfumo is not None and idx in parfumo_rev:
            p_row = parfumo.iloc[parfumo_rev[idx]]
            if p_sillage_col and pd.notna(p_row.get(p_sillage_col)):
                sillage = classify_sillage(str(p_row[p_sillage_col]))
            if p_longevity_col and pd.notna(p_row.get(p_longevity_col)):
                longevity = str(p_row[p_longevity_col]).strip()

        # Merge from E-commerce
        price_usd = None
        if ecom is not None and idx in ecom_rev:
            e_row = ecom.iloc[ecom_rev[idx]]
            if e_price_col and pd.notna(e_row.get(e_price_col)):
                price_val = pd.to_numeric(e_row[e_price_col], errors="coerce")
                if pd.notna(price_val):
                    price_usd = float(price_val)

        rec = {
            "name": name,
            "brand": brand,
            "notes_all": notes,
            "accords": accords,
            "rating": round(rating, 2),
            "review_count": review_count,
            "top_review": "",
            "price_usd": price_usd,
            "price_range": classify_price(price_usd),
            "sillage": sillage,
            "longevity": longevity,
            "image_url": img_url,
            "popularity_score": round(popularity_score(rating, review_count), 4),
        }
        records.append(rec)

    return records


# ---------------------------------------------------------------------------
# Upload to Supabase
# ---------------------------------------------------------------------------

def upload_to_supabase(records: list[dict], dry_run: bool = False) -> None:
    if dry_run:
        print(f"\n[DRY RUN] Would upload {len(records)} records to Supabase.")
        print(f"  Sample: {records[0]['brand']} - {records[0]['name']}")
        return

    from supabase import create_client

    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print("ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.")
        sys.exit(1)

    sb = create_client(url, key)
    total = len(records)
    uploaded = 0

    for i in range(0, total, BATCH_SIZE):
        batch = records[i : i + BATCH_SIZE]
        try:
            sb.table("perfumes").upsert(
                batch,
                on_conflict="name,brand",
            ).execute()
            uploaded += len(batch)
            print(f"  Uploaded {uploaded}/{total}...")
        except Exception as e:
            print(f"  ERROR at batch {i}: {e}")
            print(f"  First failing record: {batch[0]}")

    print(f"\nUpload complete: {uploaded}/{total} records.")


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------

def validate(records: list[dict], dry_run: bool = False) -> None:
    print(f"\n--- Validation ---")
    print(f"Total records: {len(records)}")

    with_price = sum(1 for r in records if r["price_usd"] is not None)
    with_sillage = sum(1 for r in records if r["sillage"] is not None)
    with_image = sum(1 for r in records if r["image_url"])
    print(f"With price: {with_price} ({with_price*100//len(records)}%)")
    print(f"With sillage: {with_sillage} ({with_sillage*100//len(records)}%)")
    print(f"With image: {with_image} ({with_image*100//len(records)}%)")

    # Spot-check known perfumes
    known = ["Baccarat Rouge 540", "Black Opium", "Coco Mademoiselle", "Cloud", "Flowerbomb"]
    found = 0
    for name in known:
        match = next((r for r in records if name.lower() in r["name"].lower()), None)
        if match:
            found += 1
            print(f"  OK {match['brand']} - {match['name']} (rating={match['rating']}, price={match['price_usd']})")
        else:
            print(f"  X {name} -- NOT FOUND")
    print(f"Known perfume check: {found}/{len(known)} found")

    if not dry_run:
        from supabase import create_client
        url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
        key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        if url and key:
            sb = create_client(url, key)
            result = sb.table("perfumes").select("id", count="exact").execute()
            print(f"Rows in Supabase perfumes table: {result.count}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Whifff ETL: Kaggle → Supabase")
    parser.add_argument("--dry-run", action="store_true", help="Preview without uploading")
    parser.add_argument("--limit", type=int, default=None, help="Limit rows per CSV")
    parser.add_argument("--skip-match", action="store_true", help="Reuse cached fuzzy matches")
    args = parser.parse_args()

    # Load env
    env_path = Path(__file__).parent.parent / ".env.local"
    if env_path.exists():
        load_dotenv(env_path)
    else:
        load_dotenv()

    # Step 1: Load
    print("=== Step 1: Loading datasets ===")
    frag, parfumo, ecom = load_datasets(limit=args.limit)

    # Step 2: Fuzzy match
    print("\n=== Step 2: Fuzzy matching ===")
    parfumo_matches: dict[int, int] = {}
    ecom_matches: dict[int, int] = {}

    if parfumo is not None:
        parfumo_matches = fuzzy_match_datasets(frag, parfumo, "parfumo", skip_match=args.skip_match)
    else:
        print("  Skipping Parfumo (file not found)")

    if ecom is not None:
        ecom_matches = fuzzy_match_datasets(frag, ecom, "ecommerce", skip_match=args.skip_match)
    else:
        print("  Skipping E-commerce (file not found)")

    # Step 3: Merge + classify
    print("\n=== Step 3: Building records ===")
    records = build_perfume_records(frag, parfumo, ecom, parfumo_matches, ecom_matches)
    print(f"  Built {len(records)} perfume records")

    # Step 4: Upload
    print("\n=== Step 4: Uploading to Supabase ===")
    upload_to_supabase(records, dry_run=args.dry_run)

    # Step 5: Validate
    validate(records, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
