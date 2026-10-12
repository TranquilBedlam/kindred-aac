# AAC and Learning Foundation v0.1.0

**Status:** Tested headless JavaScript reference. Not an installable tablet app and not a clinically validated communication tool.

Node.js 20+ required. Run `npm test` from this directory.

Architecture: `src/model` contains vocabulary, message state, and lesson state; `src/controller` handles communication actions; `src/services` abstracts speech output. There is no View yet. Production is planned in Flutter/Dart, with isolated device speech services and persistent AAC access.

Rules: never gate AAC on speech, never infer child-authored messages, and never remove essential vocabulary. Device text-to-speech, tablet UI, accessibility, and hardware testing remain outstanding.
