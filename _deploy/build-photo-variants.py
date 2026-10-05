#!/usr/bin/env python3
"""Generate AVIF + WebP siblings for every JPEG under assets/photos and slides.

.htaccess content-negotiates them: a request for /assets/photos/x.jpg
is answered with x.jpg.avif or x.jpg.webp when the browser's Accept header
allows it, so no HTML has to change and the .jpg stays the universal fallback.
The siblings are named <file>.jpg.avif / <file>.jpg.webp (full original name +
new extension) so the rewrite is a plain suffix test.

Idempotent: skips a variant that is newer than its source. Requires Pillow with
AVIF support (Pillow >= 11.3 ships it).

    python _deploy/build-photo-variants.py
"""
import os
import sys
from PIL import Image

BASE = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
DIRS = [os.path.join(BASE, "assets", "photos"), os.path.join(BASE, "slides")]


def main() -> int:
    made = saved_jpg = saved_new = 0
    for folder, name in sorted((d, n) for d in DIRS for n in os.listdir(d)):
        if not name.lower().endswith((".jpg", ".jpeg")):
            continue
        src = os.path.join(folder, name)
        with Image.open(src) as im:
            im.load()
            rgb = im.convert("RGB")
        for ext, kwargs in (("avif", {"quality": 55, "speed": 6}), ("webp", {"quality": 78, "method": 6})):
            dst = f"{src}.{ext}"
            if os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src):
                continue
            rgb.save(dst, ext.upper(), **kwargs)
            made += 1
        saved_jpg += os.path.getsize(src)
        saved_new += min(os.path.getsize(f"{src}.avif"), os.path.getsize(f"{src}.webp"))
    print(f"wrote {made} variants; jpg {saved_jpg/1e6:.1f} MB -> best modern {saved_new/1e6:.1f} MB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
