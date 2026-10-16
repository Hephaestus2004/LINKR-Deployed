#!/usr/bin/env python3
"""
tools/qr_generate.py
Generates branded QR code PNGs for LINKR smart cards adhering to 06_OPERATIONS_SOP.md Section 3:
- Error correction Level H (30% recovery)
- Quiet zone >= 4 modules
- Logo centered <= 20% width
- Named <id>.png

Usage:
    python tools/qr_generate.py --csv tool_output/Batch-Stock.csv --out-dir tool_output/qrs
    python tools/qr_generate.py --id k7x2m9qa --domain linkr-tap.site
"""

import argparse
import csv
import sys
from pathlib import Path

try:
    import qrcode
    from PIL import Image
except ImportError:
    qrcode = None
    Image = None

def generate_qr(target_id: str, domain: str, out_dir: Path, logo_path: Path = None):
    url = f"https://{domain}/u/{target_id}"

    if qrcode is None:
        print("⚠️ 'qrcode' or 'Pillow' is not installed. Please run: pip install qrcode[pil]")
        return

    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=10,
        border=4
    )
    qr.add_data(url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="#243746", back_color="#ffffff").convert("RGBA")

    if logo_path and logo_path.exists():
        try:
            logo = Image.open(logo_path).convert("RGBA")
            # Max 20% of QR width
            max_logo_size = int(img.size[0] * 0.20)
            logo.thumbnail((max_logo_size, max_logo_size), Image.Resampling.LANCZOS)

            # Center logo
            pos = ((img.size[0] - logo.size[0]) // 2, (img.size[1] - logo.size[1]) // 2)
            img.paste(logo, pos, mask=logo)
        except Exception as e:
            print(f"Warning: Could not overlay logo: {e}")

    out_file = out_dir / f"{target_id}.png"
    img.save(out_file)
    print(f"Generated QR: {out_file} -> {url}")

def main():
    parser = argparse.ArgumentParser(description="Generate LINKR branded QR codes")
    parser.add_argument("--csv", type=str, help="Path to batch CSV file")
    parser.add_argument("--id", type=str, help="Single profile ID to generate QR for")
    parser.add_argument("--domain", type=str, default="linkr-tap.site", help="Domain")
    parser.add_argument("--logo", type=str, default="public/assets/contact-favicon.svg", help="Path to center logo")
    parser.add_argument("--out-dir", type=str, default="tool_output/qrs", help="Output directory")

    args = parser.parse_args()
    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    logo_file = Path(args.logo) if args.logo else None

    if args.id:
        generate_qr(args.id, args.domain, out_dir, logo_file)
    elif args.csv:
        csv_path = Path(args.csv)
        if not csv_path.exists():
            print(f"Error: CSV file not found: {csv_path}")
            sys.exit(1)

        with open(csv_path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            count = 0
            for row in reader:
                pid = row.get("id")
                if pid:
                    generate_qr(pid, args.domain, out_dir, logo_file)
                    count += 1
            print(f"\n🎉 Successfully created {count} QR codes in {out_dir}")
    else:
        print("Please provide either --id or --csv.")
        sys.exit(1)

if __name__ == "__main__":
    main()
