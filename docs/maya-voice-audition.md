# Maya recorded-voice audition (preproduction)

Status: scripts prepared; **no generated or approved audio yet**.
No changes to the published website, AAC, or narrator playback.

## Voice identity
- Adult American woman, playful, energetic, friendly, conversational.
- Animated curiosity and excitement rather than fast, loud or exaggerated delivery.
- Clear consonants, natural pauses, steady comfortable volume.
- No imitation of a recognizable person or character.
- Generate WAV or high-quality lossless master; create compressed local copies only after voice approval.

## Three audition clips
`maya-greeting`
"Hi! I'm Maya. Would you like to explore the forest or go into space?"
Direction: inviting and curious; pause naturally before the two destinations.

`maya-forest-problem`
"Oh no! Pip the little bear has lost his blue scarf. Can you help us look for it?"
Direction: caring surprise on "Oh no!", then warm and curious; do not sound alarmed.

`maya-forest-discovery`
"Look! Tiny footprints in the leaves! I wonder where they lead."
Direction: delighted discovery on "Look!", then soften into curiosity.

## Approval gate
One consistent licensed voice across all three clips. No full-story recording or production integration until the product manager listens and approves the same voice and style.

## Audio and timing contract
- Use stable IDs, exact accessible transcript, local .ogg/.mp3 or .wav asset, and phoneme timestamps aligned against **final** mastered audio.
- Lip-sync scheduler follows HTMLAudioElement.currentTime; pause, seek, interruption and end must close mouth.
- Keep Maya narration in a separate service from AAC speech. Talk/Help/Stop retain independent operation; story interaction may be used with sound muted.
- User-gesture start for iOS/tablet audio rules; never autoplay without browser permission.
- Test offline playback, audio missing, phoneme alignment and fallback, AAC interruptions, keyboard/touch, reduced motion, and live Pages version/asset verification.
- No external API calls from the child's browser. Pre-generated audio assets only.

## Release rules
Do not merge audition assets or playback code into gh-pages until licensed voice is approved, automated tests pass, and the public Pages endpoint is checked.
