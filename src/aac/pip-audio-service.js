/**
 * Audio service. No story state, DOM selectors or scene decisions live here.
 * The controller decides what a completed recording means.
 */
export function createPipAudioPlayer({createAudio=(src)=>new Audio(src),onStart=()=>{},onStop=()=>{},onStatus=()=>{},canComplete=()=>true}={}){
 let active=null,token=0;
 function stop(){
  token++;
  if(active){
   active.onended=null;active.onerror=null;
   active.pause();active.removeAttribute?.('src');active=null;
  }
  onStop();
 }
 function play(src,onEnd){
  stop();
  const current=token;
  if(!src){onStatus('Pip audio file is missing. The written story remains available.');return;}
  const audio=createAudio(src);active=audio;
  audio.onplay=()=>{if(current!==token)return;onStart();onStatus('Maya is speaking.');};
  audio.onended=()=>{if(current!==token)return;active=null;onStop();if(canComplete())onEnd?.();};
  audio.onerror=()=>{if(current!==token)return;active=null;onStop();onStatus('Pip MP3 unavailable. No replacement voice will be used.');};
  Promise.resolve().then(()=>audio.play()).catch(()=>{
   if(current!==token)return;
   onStop();
   onStatus('Tap Hear Maya to enable audio, or continue with the picture choices.');
  });
 }
 return {play,stop};
}
