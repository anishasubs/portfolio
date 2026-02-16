"""
Assign price_range and estimated price_usd to all perfumes via batch SQL.
Much faster than individual updates — uses a single RPC call per tier.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Brand lists by tier (lowercased, deslugified)
LUXURY = [
    "maison francis kurkdjian", "tom ford", "creed", "xerjoff",
    "parfums de marly", "roja dove", "amouage", "boadicea the victorious",
    "clive christian", "bond no 9", "kilian", "initio parfums prives",
    "initio", "tiziana terenzi", "nishane", "memo paris", "byredo",
    "le labo", "frederic malle", "diptyque", "penhaligon s", "penhaligons",
    "m micallef", "widian", "floris london", "floris", "atelier cologne",
    "acqua di parma", "serge lutens", "profumum roma",
    "orto parisi", "nasomatto", "vilhelm parfumerie",
    "montale", "mancera", "juliette has a gun",
    "parfums dusita", "electimuss", "sospiro", "moresque",
    "fueguia 1833", "hiram green", "maison margiela",
    "house of oud", "chris collins", "goldfield banks",
]

AFFORDABLE = [
    "avon", "zara", "o boticario", "natura", "oriflame",
    "bath body works", "bath & body works", "armaf",
    "victoria s secret", "victoria's secret",
    "jeanne arthes", "faberlic", "yves rocher", "brocard", "coty",
    "elizabeth arden", "clean", "ariana grande", "billie eilish",
    "sol de janeiro", "glossier", "the body shop", "gap", "adidas",
    "nike", "revlon", "britney spears", "jennifer lopez",
    "paris hilton", "david beckham", "playboy", "benetton", "nautica",
    "ed hardy", "hollister", "abercrombie fitch",
    "al haramain perfumes", "rasasi", "lattafa perfumes",
    "swiss arabian", "ajmal", "afnan", "ard al zaafaran", "al rehab",
    "kayali", "juicy couture", "marc jacobs", "commodity",
    "philosophy", "skylar", "ellis brooklyn", "phlur", "dedcool",
    "rihanna", "nicki minaj", "sarah jessica parker",
    "kim kardashian", "jessica simpson", "taylor swift",
    "fragonard", "l occitane en provence",
]


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

    # Build SQL that classifies all perfumes by brand in one shot
    lux_list = ", ".join(f"'{b}'" for b in LUXURY)
    aff_list = ", ".join(f"'{b}'" for b in AFFORDABLE)

    sql = f"""
    -- Luxury brands: $$$, ~$275
    UPDATE perfumes
    SET price_range = '$$$', price_usd = 275
    WHERE LOWER(brand) IN ({lux_list})
      AND price_usd IS NULL;

    -- Affordable brands: $, ~$55
    UPDATE perfumes
    SET price_range = '$', price_usd = 55
    WHERE LOWER(brand) IN ({aff_list})
      AND price_usd IS NULL;

    -- Everything else: designer $$, ~$135
    UPDATE perfumes
    SET price_range = '$$', price_usd = 135
    WHERE price_usd IS NULL;
    """

    print("Running batch price assignment via SQL...")
    print(f"  Luxury brands ({len(LUXURY)}): $$$")
    print(f"  Affordable brands ({len(AFFORDABLE)}): $")
    print(f"  Everything else: $$")

    # Execute via RPC
    result = sb.rpc("exec_sql", {"query": sql}).execute()
    # If exec_sql doesn't exist, fall back to running statements individually
    # Actually, let's just write the SQL to clipboard
    print("\nSQL generated. Copying to clipboard...")

    # Write SQL to file and copy to clipboard
    sql_path = Path(__file__).parent / "_assign_prices.sql"
    sql_path.write_text(sql)
    os.system(f'type "{sql_path}" | clip')
    print("Copied to clipboard! Paste into Supabase SQL Editor and run.")
    print(f"\nAlso saved to: {sql_path}")


if __name__ == "__main__":
    main()
