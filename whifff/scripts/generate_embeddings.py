"""
Whifff: Generate note_vector embeddings for perfumes (Phase D — placeholder).

This script will:
  1. Load all perfumes from Supabase
  2. Concatenate notes + accords into a text string per perfume
  3. Generate 384-dim embeddings using sentence-transformers/all-MiniLM-L6-v2
  4. Batch-update the note_vector column in Supabase

Prerequisites:
  pip install sentence-transformers supabase python-dotenv

Usage:
  python scripts/generate_embeddings.py
  python scripts/generate_embeddings.py --limit 100
  python scripts/generate_embeddings.py --dry-run

TODO: Implement when ready to enable vector-based recommendations.
  The SupabaseDataProvider already documents the integration path:
    1. Average past-perfume note_vectors
    2. Call match_perfumes_by_vector RPC
    3. Re-rank results with scoreAndRank
"""

import argparse
import os
import sys
from pathlib import Path

from dotenv import load_dotenv


def main():
    parser = argparse.ArgumentParser(description="Generate perfume embeddings")
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

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

    # Fetch perfumes without embeddings
    query = sb.table("perfumes").select("id, name, brand, notes_all, accords").is_("note_vector", "null")
    if args.limit:
        query = query.limit(args.limit)
    result = query.execute()
    perfumes = result.data or []
    print(f"Found {len(perfumes)} perfumes without embeddings")

    if not perfumes:
        print("Nothing to do.")
        return

    # Build text representations
    texts = []
    for p in perfumes:
        notes = " ".join(p.get("notes_all") or [])
        accords = " ".join(p.get("accords") or [])
        texts.append(f"{p['name']} by {p['brand']}. Notes: {notes}. Accords: {accords}.")

    if args.dry_run:
        print(f"\n[DRY RUN] Would generate embeddings for {len(texts)} perfumes.")
        print(f"  Sample text: {texts[0][:120]}...")
        return

    # Generate embeddings
    print("Loading sentence-transformers model (all-MiniLM-L6-v2)...")
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer("all-MiniLM-L6-v2")

    print(f"Generating {len(texts)} embeddings...")
    embeddings = model.encode(texts, show_progress_bar=True, batch_size=64)

    # Upload to Supabase
    print("Uploading embeddings...")
    batch_size = 100
    updated = 0
    for i in range(0, len(perfumes), batch_size):
        batch_perfumes = perfumes[i : i + batch_size]
        batch_embeddings = embeddings[i : i + batch_size]

        for p, emb in zip(batch_perfumes, batch_embeddings):
            sb.table("perfumes").update({
                "note_vector": emb.tolist()
            }).eq("id", p["id"]).execute()
            updated += 1

        print(f"  Updated {updated}/{len(perfumes)}...")

    print(f"\nDone: {updated} embeddings generated and uploaded.")


if __name__ == "__main__":
    main()
