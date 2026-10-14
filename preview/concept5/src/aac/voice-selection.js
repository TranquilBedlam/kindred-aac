// AAC voice preference helpers. Only locally installed voices are offline candidates;
// browser availability varies, and actual offline playback requires device testing.
export function englishVoices(voices){return [...voices].filter(v=>/^en(?:-|$)/i.test(v.lang||''));}
export function voiceLabel(v){return v.name+(v.localService?' (on-device)':' (may require internet)');}
export function chooseVoice(voices,preferred){
 const available=englishVoices(voices);
 const saved=available.find(v=>v.voiceURI===preferred);
 if(saved)return saved;
 const installed=available.filter(v=>v.localService);
 const american=installed.find(v=>/^en-US$/i.test(v.lang));
 return american||installed[0]||available.find(v=>/^en-US$/i.test(v.lang))||available[0]||null;
}
