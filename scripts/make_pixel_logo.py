#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageEnhance


def crop_square(image: Image.Image) -> Image.Image:
    width, height = image.size
    side = min(width, height)
    left = (width - side) // 2
    top = (height - side) // 2
    return image.crop((left, top, left + side, top + side))


def make_pixel_logo(source: Path, destination: Path, size: int) -> None:
    image = Image.open(source).convert("RGBA")
    image = crop_square(image)

    enhancer = ImageEnhance.Color(image)
    image = enhancer.enhance(1.18)
    enhancer = ImageEnhance.Contrast(image)
    image = enhancer.enhance(1.12)

    image = image.resize((size, size), Image.Resampling.NEAREST)
    destination.parent.mkdir(parents=True, exist_ok=True)
    image.save(destination, "PNG", optimize=False)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    parser.add_argument("--size", type=int, default=32)
    args = parser.parse_args()

    make_pixel_logo(args.source, args.destination, args.size)


if __name__ == "__main__":
    main()
