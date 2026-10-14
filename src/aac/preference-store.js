const VOICE_KEY='kindred-aac-preferred-voice-v1';
const TUNING_KEY='kindred-aac-voice-tuning-v1';
export function createAacPreferenceStore(storage){
 return {
  readVoice(){try{return storage.getItem(VOICE_KEY)||'';}catch{return '';}},
  saveVoice(value){try{storage.setItem(VOICE_KEY,String(value));return true;}catch{return false;}},
  readTuning(){try{const saved=JSON.parse(storage.getItem(TUNING_KEY)||'null');return saved&&typeof saved==='object'?saved:null;}catch{return null;}},
  saveTuning({pitch,rate}){try{storage.setItem(TUNING_KEY,JSON.stringify({pitch,rate}));return true;}catch{return false;}}
 };
}
