# Kindred AAC Milo story player: QA only

This is an isolated seven-scene interaction prototype, **not a replacement for the approved Kindred AAC app**. The visual art is placeholder and does not replace approved Maya/Milo imagery.

Run from an HTTP server and test with Chromium Playwright: `python -m pip install playwright && python -m playwright install chromium && python tests/test_browser.py`.

The 7 Pip narration MP3s and 13 choice responses were generated and verified in Runway, **but the permanent audio bytes are not bundled here**. The browser warns on missing audio and never substitutes a robotic story narrator. Audio files needed:

- `audio/scene-1.mp3` through `audio/scene-7.mp3`
- `audio/01-open-door.mp3`, `01-ask-whos-there.mp3`, `02-basket.mp3`, `02-blanket.mp3`, `03-leaf.mp3`, `03-stick.mp3`, `04-flower.mp3`, `04-leaf.mp3`, `05-blow.mp3`, `05-push.mp3`, `06-sandwiches.mp3`, `06-apple.mp3`, `07-goodbye.mp3`

AAC communication stays available independently. Choice consequences and transitions are functional in the prototype, but actual 20-file playback, offline availability, and real tablet testing are not yet verified.

**Do not merge this QA folder into the production experience or interpret browser interaction tests as real device or audio playback validation.**
