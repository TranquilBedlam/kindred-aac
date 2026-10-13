# Offline AAC candidate voice 01: Piper lessac (medium)

**Stage:** downloadable evaluation candidate, NOT approved production voice, NOT installed on the live site.

- English (US), single-speaker, 22,050 Hz output.
- Model: `en_US-lessac-medium.onnx` (about 63.2 MB) plus matching JSON configuration and phonemizer/runtime files.
- Upstream: https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_US/lessac/medium
- Model card: https://huggingface.co/rhasspy/piper-voices/blob/main/en/en_US/lessac/medium/MODEL_CARD
- Model SHA-256: `5efe09e69902187827af646e1a6e9d269dee769f9877d17b16b1b46eeaaf019f`.
- Separate dataset license terms must be reviewed before redistribution: https://www.cstr.ed.ac.uk/projects/blizzard/2013/lessac_blizzard2013/license.html

## Evaluation download
`python3 scripts/fetch-evaluation-voice.py --output local-voice-evaluation/lessac`

The script downloads only the model card initially. Inspect its linked dataset terms and then rerun with `--acknowledge-license` to download model/config for local evaluation. This flag is NOT a claim that commercial redistribution is authorized.

## Next blocking work
1. Run offline synthesis of new arbitrary AAC messages, not prerecorded clips.
2. Audit runtime + model + training dataset terms for shipping in a commercial AAC app.
3. Compare actual audio against another candidate, measure tablet latency/offline startup, and explicitly test `Help`, `Stop`, `Break`.
4. Do not wire into the production Communication tab or merge this research PR before these gates pass.
