#!/usr/bin/env python3
"""Download a Piper voice for *local evaluation only*. No changes to live AAC."""
import argparse
import hashlib
from pathlib import Path
from urllib.request import urlopen

BASE = "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/lessac/medium/"
NAME = "en_US-lessac-medium.onnx"
SHA256 = "5efe09e69902187827af646e1a6e9d269dee769f9877d17b16b1b46eeaaf019f"
FILES = ("MODEL_CARD", NAME + ".json", NAME)

def fetch(url, destination, sha256=None):
    tmp = destination.with_suffix(destination.suffix + ".part")
    digest = hashlib.sha256()
    try:
        with urlopen(url, timeout=60) as response, tmp.open("wb") as output:
            while chunk := response.read(1024 * 1024):
                output.write(chunk)
                digest.update(chunk)
        if sha256 and digest.hexdigest() != sha256:
            raise ValueError("Voice file checksum mismatch; do not use.")
        tmp.replace(destination)
    finally:
        tmp.unlink(missing_ok=True)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=Path("local-voice-evaluation/lessac"))
    parser.add_argument("--acknowledge-license", action="store_true",
                        help="Confirm you reviewed individual model/dataset terms for evaluation; NOT approval to redistribute.")
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    card = args.output / "MODEL_CARD"
    fetch(BASE + "MODEL_CARD", card)
    print("Voice model card saved to:", card)
    print("Review the license URL in MODEL_CARD, including any separate dataset terms.")
    if not args.acknowledge_license:
        print("Stopping before downloading model. Re-run with --acknowledge-license after review.")
        return
    for name in FILES[1:]:
        target = args.output / name
        fetch(BASE + name, target, SHA256 if name == NAME else None)
        print("Downloaded and checked:", target)
    print("Evaluation files ready. This is NOT integrated with the app.")

if __name__ == "__main__":
    main()
