"""
Assign price_range and estimated price_usd to all perfumes based on brand tier.

Brands are classified into 3 tiers:
  $ (under $100)  — drugstore, mass market, affordable niche
  $$ ($100-200)   — designer, mid-range niche
  $$$ ($200+)     — luxury, high-end niche

Usage: python scripts/assign_prices.py
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Brand -> (price_range, estimated_price_usd)
# Only need to classify brands; unclassified defaults to $$ (designer mid-range)

LUXURY_BRANDS = {
    # $$$ — $200+
    "maison francis kurkdjian", "mfk", "tom ford", "creed", "xerjoff",
    "parfums de marly", "roja dove", "amouage", "boadicea the victorious",
    "clive christian", "bond no 9", "kilian", "initio parfums prives",
    "initio", "tiziana terenzi", "nishane", "memo paris", "byredo",
    "le labo", "frederic malle", "diptyque", "penhaligon s", "penhaligons",
    "m micallef", "widian", "floris london", "floris", "atelier cologne",
    "maison margiela", "acqua di parma", "serge lutens", "profumum roma",
    "orto parisi", "nasomatto", "chris collins", "vilhelm parfumerie",
    "goldfield banks", "house of oud", "montale", "mancera",
    "juliette has a gun", "parfums dusita", "electimuss", "sospiro",
    "moresque", "aj arabia", "fueguia 1833", "hiram green",
}

AFFORDABLE_BRANDS = {
    # $ — under $100
    "avon", "zara", "o boticario", "natura", "oriflame", "bath body works",
    "bath & body works", "armaf", "victoria s secret", "victoria's secret",
    "jeanne arthes", "faberlic", "yves rocher", "brocard", "coty",
    "elizabeth arden", "clean", "ariana grande", "billie eilish",
    "sol de janeiro", "glossier", "the body shop", "gap", "adidas",
    "nike", "revlon", "celebrity", "britney spears", "jennifer lopez",
    "paris hilton", "david beckham", "playboy", "benetton", "nautica",
    "ed hardy", "hollister", "abercrombie fitch", "aeropostale",
    "rue 21", "body fantasies", "pacifica", "al haramain perfumes",
    "rasasi", "lattafa perfumes", "swiss arabian", "ajmal", "afnan",
    "ard al zaafaran", "al rehab", "kayali", "juicy couture",
    "marc jacobs", "commodity", "clean reserve", "philosophy",
    "replica", "skylar", "ellis brooklyn", "phlur", "dedcool",
    "ariana grande", "rihanna", "nicki minaj", "sarah jessica parker",
    "kim kardashian", "jessica simpson", "taylor swift",
    "fragonard", "l occitane en provence", "l'occitane",
}

DESIGNER_BRANDS = {
    # $$ — $100-200
    "dior", "chanel", "guerlain", "yves saint laurent", "ysl",
    "givenchy", "giorgio armani", "calvin klein", "carolina herrera",
    "kenzo", "jo malone london", "jo malone", "jean paul gaultier",
    "lancome", "lancôme", "hugo boss", "donna karan", "dkny",
    "estee lauder", "paco rabanne", "dolce gabbana", "dolce & gabbana",
    "mugler", "thierry mugler", "gucci", "bvlgari", "bulgari",
    "salvatore ferragamo", "davidoff", "versace", "burberry",
    "ralph lauren", "coach", "michael kors", "tory burch",
    "narciso rodriguez", "issey miyake", "hermes", "hermès",
    "viktor rolf", "viktor & rolf", "roberto cavalli", "valentino",
    "prada", "bottega veneta", "balenciaga", "loewe", "chloe", "chloé",
    "cartier", "van cleef arpels", "van cleef & arpels",
    "oscar de la renta", "elie saab", "azzaro", "rochas",
    "maison margiela replica",
}


def classify_brand(brand: str) -> tuple[str, float]:
    """Returns (price_range, estimated_price_usd) for a brand."""
    b = brand.strip().lower().replace("'", "").replace("'", "")
    # Remove common suffixes
    for suffix in [" perfumes", " parfums", " paris", " london", " new york"]:
        if b.endswith(suffix):
            b = b[: -len(suffix)].strip()

    if b in LUXURY_BRANDS:
        return "$$$", 275.0
    if b in AFFORDABLE_BRANDS:
        return "$", 55.0
    if b in DESIGNER_BRANDS:
        return "$$", 135.0

    # Fuzzy fallback: check if brand contains a known brand name
    for lb in LUXURY_BRANDS:
        if lb in b or b in lb:
            return "$$$", 275.0
    for ab in AFFORDABLE_BRANDS:
        if ab in b or b in ab:
            return "$", 55.0
    for db in DESIGNER_BRANDS:
        if db in b or b in db:
            return "$$", 135.0

    # Default: designer mid-range
    return "$$", 120.0


def main():
    env_path = Path(__file__).parent.parent / ".env.local"
    if env_path.exists():
        load_dotenv(env_path)
    else:
        load_dotenv()

    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print("ERROR: Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")
        sys.exit(1)

    from supabase import create_client
    sb = create_client(url, key)

    # Fetch all perfumes without prices (paginate past Supabase 1000-row default)
    print("Fetching perfumes without prices...")
    perfumes = []
    page_size = 1000
    offset = 0
    while True:
        result = (
            sb.table("perfumes")
            .select("id, brand, price_usd")
            .is_("price_usd", "null")
            .range(offset, offset + page_size - 1)
            .execute()
        )
        batch = result.data or []
        perfumes.extend(batch)
        if len(batch) < page_size:
            break
        offset += page_size
    print(f"Found {len(perfumes)} perfumes without prices")

    if not perfumes:
        print("All perfumes already have prices!")
        return

    # Classify and batch update
    updates = []
    tier_counts = {"$": 0, "$$": 0, "$$$": 0}
    for p in perfumes:
        pr, price = classify_brand(p["brand"])
        tier_counts[pr] += 1
        updates.append({
            "id": p["id"],
            "price_usd": price,
            "price_range": pr,
        })

    print(f"Classification: $ = {tier_counts['$']}, $$ = {tier_counts['$$']}, $$$ = {tier_counts['$$$']}")

    # Batch update
    batch_size = 500
    updated = 0
    for i in range(0, len(updates), batch_size):
        batch = updates[i:i + batch_size]
        for item in batch:
            sb.table("perfumes").update({
                "price_usd": item["price_usd"],
                "price_range": item["price_range"],
            }).eq("id", item["id"]).execute()
            updated += 1
        print(f"  Updated {updated}/{len(updates)}...")

    print(f"\nDone: {updated} perfumes now have prices.")


if __name__ == "__main__":
    main()
