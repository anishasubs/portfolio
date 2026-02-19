"""
Whifff Image Pipeline — Download perfume images and upload to Supabase Storage.

Fetches bottle images from fimgs.net URLs stored in the perfumes table,
uploads them to a Supabase Storage bucket, and updates the image_url column
with the public CDN URL.

Prerequisites:
  pip install -r scripts/requirements.txt
  Set env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

Usage:
  python scripts/fetch_images.py                # process all perfumes missing images
  python scripts/fetch_images.py --limit 50     # process only 50
  python scripts/fetch_images.py --dry-run      # preview without uploading
"""

import argparse
import os
import sys
import time
from pathlib import Path
from urllib.parse import urlparse

import requests
from dotenv import load_dotenv

BUCKET_NAME = "perfume-images"
RATE_LIMIT_DELAY = 1.0  # seconds between downloads


def main():
    parser = argparse.ArgumentParser(description="Whifff: Download + upload perfume images")
    parser.add_argument("--limit", type=int, default=None, help="Max images to process")
    parser.add_argument("--dry-run", action="store_true", help="Preview without downloading/uploading")
    args = parser.parse_args()

    env_path = Path(__file__).parent.parent / ".env.local"
    if env_path.exists():
        load_dotenv(env_path)
    else:
        load_dotenv()

    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print("ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.")
        sys.exit(1)

    from supabase import create_client
    sb = create_client(url, key)

    # Ensure bucket exists
    if not args.dry_run:
        try:
            sb.storage.get_bucket(BUCKET_NAME)
        except Exception:
            print(f"Creating storage bucket '{BUCKET_NAME}'...")
            sb.storage.create_bucket(BUCKET_NAME, options={"public": True})

    # Fetch perfumes with external image URLs (fimgs.net or similar)
    query = sb.table("perfumes").select("id, name, brand, image_url")
    result = query.execute()
    perfumes = result.data or []

    # Filter to those with external URLs (not already on Supabase storage)
    to_process = [
        p for p in perfumes
        if p["image_url"]
        and "fimgs.net" in p["image_url"]
    ]

    if args.limit:
        to_process = to_process[:args.limit]

    print(f"Found {len(to_process)} perfumes with external images to process")

    if args.dry_run:
        for p in to_process[:5]:
            print(f"  Would download: {p['brand']} - {p['name']}: {p['image_url']}")
        return

    success = 0
    failed = 0

    for i, p in enumerate(to_process):
        try:
            # Download image
            resp = requests.get(p["image_url"], timeout=15, headers={
                "User-Agent": "Mozilla/5.0 (Whifff Image Pipeline)"
            })
            resp.raise_for_status()

            # Determine file extension from URL
            parsed = urlparse(p["image_url"])
            ext = Path(parsed.path).suffix or ".jpg"
            storage_path = f"{p['id']}{ext}"

            # Upload to Supabase Storage
            content_type = "image/jpeg" if ext in (".jpg", ".jpeg") else f"image/{ext.lstrip('.')}"
            sb.storage.from_(BUCKET_NAME).upload(
                storage_path,
                resp.content,
                file_options={"content-type": content_type, "upsert": "true"},
            )

            # Get public URL
            public_url = f"{url}/storage/v1/object/public/{BUCKET_NAME}/{storage_path}"

            # Update perfume row
            sb.table("perfumes").update({"image_url": public_url}).eq("id", p["id"]).execute()

            success += 1
            print(f"  [{i+1}/{len(to_process)}] ✓ {p['brand']} - {p['name']}")

        except Exception as e:
            failed += 1
            print(f"  [{i+1}/{len(to_process)}] ✗ {p['brand']} - {p['name']}: {e}")

        time.sleep(RATE_LIMIT_DELAY)

    print(f"\nDone: {success} uploaded, {failed} failed")


if __name__ == "__main__":
    main()
