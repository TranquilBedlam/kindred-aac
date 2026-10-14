/**
 * AAC voice service is independent of narrated Pip MP3s.
 * Speech must be requested synchronously from a child interaction.
 */
export function createAacSpeechService({engine,Utterance,getSettings,chooseVoice,onStatus}){
 return text=>{
  if(!engine||!Utterance)throw new Error('This browser cannot speak. Try Chrome, Edge, or Safari with a voice installed.');
  const msg=new Utterance(text);
  const {rate,pitch,voiceURI}=getSettings();
  msg.lang='en-US';msg.rate=Number(rate)||1;msg.pitch=Number(pitch)||1;
  const voices=engine.getVoices();
  const chosen=chooseVoice(voices,voiceURI);
  if(chosen)msg.voice=chosen;
  engine.speak(msg);
  if(engine.paused)engine.resume();
  onStatus('Speaking: '+text);
  msg.onerror=event=>onStatus('Audio did not play ('+(event.error||'unknown error')+'). Check your browser voice and sound settings.');
  msg.onend=()=>onStatus('Spoken: '+text);
  return Promise.resolve(true);
 };
}
