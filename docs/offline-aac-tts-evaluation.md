# Offline neural AAC speech: engine selection and acceptance plan

Status: engineering evaluation, **not** a shipped neural voice. Preserve the existing speechSynthesis-based AAC path until hardware tests pass.

## Shortlist

1. **sherpa-onnx**: offline speech synthesis with JavaScript/WebAssembly and native Android/iOS support. Preferred candidate for a cross-device engine if an appropriately licensed, age-appropriate voice model and small enough runtime can be identified. Source: https://github.com/k2-fsa/sherpa-onnx
2. **Piper browser/WASM implementations**: ONNX Runtime-based in-browser speech; example implementation with local WASM and model files: https://github.com/Mintplex-Labs/piper-tts-web . Useful simpler browser proof of concept. **The runtime's license does not establish that any specific voice model can be redistributed.** Confirm separately.
3. **Installed OS/browser voice**: keep as a guaranteed independent fallback where the platform provides it. A browser voice labelled `localService` is a *candidate* for offline operation, not proof of offline support.

## Gate before engine integration
- Verify runtime and individual voice-model licenses, attribution and commercial distribution rights.
- Select one or more expressive English voices with child-appropriate pacing; do not claim a child voice without auditory evaluation. Never clone a child's voice.
- Bundle all runtime/model/phonemization files locally and ensure cache completeness before enabling a neural voice. **No network request during AAC speech.**
- Avoid WebGPU-only dependencies until entry-level Android tablets and iPads have passed. WASM/CPU fallback required.
- Isolation: separate asynchronous neural TTS service from synchronous, direct-tap browser speech. Do not delay emergency words behind model initialization.
- Preserve the user's chosen AAC voice and rate/pitch preferences. Neural support cannot silently override them.
- Maya's pre-recorded narration must never steal or permanently block AAC audio focus.
- Model download / install (if needed) must be caregiver initiated, size-labelled, and reversible.

## Measurement protocol (real physical hardware)
Test on affordable Android tablet and iPad in airplane mode, with a cold start and a warmed model, **after complete installation**.
Record model package size, memory peak, start time, and tap-to-audio latency for:
- single word: `Help`, `Stop`, `Break`, `Yes`, `No`
- custom phrase: `I need my blanket.`
- new arbitrary sentence with names
- rapid successive taps, voice setting changes, narration interruption, and switching between Quick/Build pads

Acceptance thresholds (provisional): emergency AAC words should start <= 300 ms on target hardware with fallback permitted; ordinary phrases <= 1 second warm. No lost taps or queue deadlocks. Test offline repeatedly, not only once. If thresholds cannot be met, neural voice must remain opt-in and default to the existing fast voice.

## Non-negotiable regression suite
Story navigation, Talk/pad open and close, Quick/Build messages, emergency Help/Stop/Break, phrase order and replay, user-created vocabulary, parent settings/PIN, changing selected voices, persistence, zero-connectivity operation, and audio error recovery.

## Release rule
Do not ship the neural engine until automated tests and hands-on tablet checks have been recorded. CI browser tests alone cannot verify sound quality, true offline speech, or real audio latency.
