# Kindred AAC entry points and architecture

## Production
- `index.html` loads `src/main-pip-browser.js`. This is the only primary child-facing app entry point.
- The production script coordinates the AAC model and the independent AAC speech, vocabulary and preference services; Milo's controller, view, and Pip audio playback; plus other learning activity views.
- Communication must remain reachable during every learning activity. Spoken responses are optional and never required to use AAC.

## Historical previews (preserve links)
| Page | Entrypoint |
| --- | --- |
| `maya-017.html`, `maya-led-0172.html`, `story-0173.html`, `verify-0152.html` | `src/main.js` |
| `pip-preview.html` | `src/main-pip-preview.js` |
| `maya-choice-gateway-qa.html` | `src/main-maya-choice-qa.js` |

These files are **not dead code** while their preview pages are published. Do not merge their behavior into production or delete them casually. To retire a preview, first obtain approval to remove that URL, change the tests and verify the redirect or replacement.

## K.I.S.S. rules
1. Test first, change the minimum amount of production code, run full unit and browser regressions.
2. Preserve the current approved seven-scene story, recorded Maya/Pip narration and independent child AAC speech.
3. Keep Model (data/rules), View (DOM/presentation), Controller (choices/transitions) and Services (audio/storage) separate where doing so reduces complexity.
4. Do not build elaborate plugin systems or speculative architecture. New lessons should be possible without duplicating the main application.
5. Regressions in story pause/resume, Help, Stop, Break, Talk, or saved AAC vocabulary block a release.

## Deferred work
- Thorough production AAC interaction and accessibility audit (including browser and physical tablet distinctions).
- Final release-wide end-to-end acceptance checks.
- New 13 Pip choice recordings are generated but not yet published; their deployment is separate from code refactoring.
