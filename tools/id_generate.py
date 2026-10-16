#!/usr/bin/env python3
"""
tools/id_generate.py
Generates unique 8-character Crockford Base32 IDs for LINKR batches.
Outputs both CSV (id, url, seq, batch_label) and SQL insert statements for Cloudflare D1.

Usage:
    python tools/id_generate.py --size 100 --label Batch-2026-10-A --domain linkr-tap.site
"""

import argparse
import secrets
import csv
import sys
from pathlib import Path

# Crockford Base32 alphabet: 32 chars without I, L, O, U
ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz"

def generate_id(length=8):
    return "".join(secrets.choice(ALPHABET) for _ in range(length))

def main():
    parser = argparse.ArgumentParser(description="Generate LINKR stock ID batches")
    parser.add_argument("--size", type=int, default=50, help="Number of IDs to generate")
    parser.add_argument("--label", type=str, default="Batch-Stock", help="Batch label")
    parser.add_argument("--domain", type=str, default="linkr-tap.site", help="Domain for URLs")
    parser.add_argument("--start-seq", type=int, default=1, help="Starting sequence number")
    parser.add_argument("--tier", type=str, default="full", choices=["direct", "redirect", "full"])
    parser.add_argument("--out-dir", type=str, default="tool_output", help="Output directory")

    args = parser.parse_args()

    out_path = Path(args.out_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    ids = set()
    rows = []
    current_seq = args.start_seq

    while len(ids) < args.size:
        cid = generate_id()
        if cid not in ids:
            ids.add(cid)
            url = f"https://{args.domain}/u/{cid}"
            rows.append({
                "id": cid,
                "seq": current_seq,
                "url": url,
                "batch_label": args.label,
                "tier": args.tier
            })
            current_seq += 1

    # 1. Write CSV
    csv_filename = out_path / f"{args.label}.csv"
    with open(csv_filename, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["id", "seq", "url", "batch_label", "tier"])
        writer.writeheader()
        writer.writerows(rows)

    # 2. Write D1 SQL
    sql_filename = out_path / f"{args.label}.sql"
    with open(sql_filename, mode="w", encoding="utf-8") as f:
        f.write(f"-- Batch: {args.label} Size: {args.size}\n")
        f.write(f"INSERT INTO batches (label, size) VALUES ('{args.label}', {args.size});\n")
        f.write("BEGIN TRANSACTION;\n")
        for r in rows:
            f.write(
                f"INSERT INTO profiles (id, seq, status, tier, data) "
                f"VALUES ('{r['id']}', {r['seq']}, 'unassigned', '{args.tier}', '{{}}');\n"
            )
        f.write("COMMIT;\n")

    print(f"✅ Generated {len(rows)} IDs successfully.")
    print(f"📁 CSV file: {csv_filename}")
    print(f"📁 SQL file: {sql_filename}")

if __name__ == "__main__":
    main()
