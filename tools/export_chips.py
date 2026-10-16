#!/usr/bin/env python3
"""
tools/export_chips.py
Exports NFC chip writer CSV with columns (id, url, lock_chip)
Ready for NFC batch writers and encoding apps (NFC Tools, desktop RFID encoders).

Usage:
    python tools/export_chips.py --csv tool_output/Batch-Stock.csv --out tool_output/nfc_chips.csv
"""

import argparse
import csv
import sys
from pathlib import Path

def main():
    parser = argparse.ArgumentParser(description="Export LINKR NFC chip encoding list")
    parser.add_argument("--csv", type=str, required=True, help="Input batch CSV")
    parser.add_argument("--out", type=str, default="tool_output/nfc_chips.csv", help="Output NFC encoding CSV")
    parser.add_argument("--lock", action="store_true", default=True, help="Set write-lock flag to true")

    args = parser.parse_args()

    in_path = Path(args.csv)
    if not in_path.exists():
        print(f"Error: {in_path} not found.")
        sys.exit(1)

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    records = []
    with open(in_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            records.append({
                "id": row.get("id"),
                "url": row.get("url"),
                "lock_chip": "yes" if args.lock else "no"
            })

    with open(out_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["id", "url", "lock_chip"])
        writer.writeheader()
        writer.writerows(records)

    print(f"✅ Exported {len(records)} chip records to {out_path}")

if __name__ == "__main__":
    main()
