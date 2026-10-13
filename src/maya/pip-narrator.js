// Approved Runway Pip voice playback adapter. Preview links expire; do not ship
// as offline-ready until MP3 files are bundled inside this repository.
export const PIP_RECORDINGS=Object.freeze({
 welcome:{
 text:"Hi! I'm Maya. Would you like to help Milo the dragon on a rainy-day adventure, explore the forest, or travel into space? Tap a story picture to begin.",
 url:"https://dnznrvs05pmza.cloudfront.net/text_to_speech/0e66e443-c703-4e88-8ee0-541faddac8f0/Kindred_AAC_Maya_Pip_welcome_approved_voice.mp3?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiZGYxNGZhN2FjYTM0MjY2NSIsImJ1Y2tldCI6InJ1bndheS10YXNrLWFydGlmYWN0cyIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MjA0MTIxMH0.fu6rjpHTaifAKavLhUM7M3ATBVF_k_6ldWcuRCeV8t4"
 },
 scene0:{
 text:"Milo the dragon packed three strawberry sandwiches, a shiny red apple, and his favorite yellow blanket. Everything was perfect. Until... PITTER! PATTER! SPLASH! Rain splattered against the window! Milo folded his little arms and puffed out his cheeks. Hmph! Even my sandwiches are disappointed! Milo sat down with a dramatic little thump. Just then, there was a knock at the door.",
 url:"https://dnznrvs05pmza.cloudfront.net/text_to_speech/47254aa6-23b2-4f4b-bc3c-efc157810598/Kindred_AAC_Pip_voice_Milo_Scene_1___Picnic_Disaster.mp3?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiMjljYzRiZDRhYTM4M2EyOCIsImJ1Y2tldCI6InJ1bndheS10YXNrLWFydGlmbiIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MjA1NDYxMn0.EEKjgR0qIFwG-Uy15Or6Id9CEfMl8TtbK94voC7SQck"
 },
 scene4:{
 text:"Milo lowered the paper boat into the puddle. It wobbled and tipped, then floated! All aboard the Puddle Express! Pipkin cheered. The boat is ready for you to steer.",
 url:"https://dnznrvs05pmza.cloudfront.net/text_to_speech/6d39cdc9-cd9f-4bd6-84dc-38945492bd0e/Kindred_AAC_Milo_5___Puddle_Express.mp3?_jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJrZXlIYXNoIjoiODY5NDdjMzhkYjIzYjQyYSIsImJ1Y2tldCI6InJ1bndheS10YXNrLWFydGlmbiIsInN0YWdlIjoicHJvZCIsImV4cCI6MTc5MjA5NTY3Mn0.hkr-5urlyYJmzbEoGN-fsEPKgLT1lIuA7t-Qqk3H96Y"
 }
});
export class PipNarrator{
 constructor(makeAudio){this.makeAudio=makeAudio;this.current=null;this.onstop=null;}
 stop(){if(this.current){this.current.pause();this.current.currentTime=0;this.current=null;}this.onstop?.();this.onstop=null;}
 play(key,{onstart=()=>{},onend=()=>{},onerror=()=>{}}={}){
  const recording=PIP_RECORDINGS[key];
  if(!recording)return false;
  this.stop();
  const audio=this.makeAudio(recording.url);this.current=audio;
  audio.onplay=()=>{if(this.current===audio)onstart();};
  audio.onended=()=>{if(this.current===audio){this.current=null;onend();}};
  audio.onerror=()=>{if(this.current===audio){this.current=null;onerror();}};
  Promise.resolve(audio.play()).catch(()=>{if(this.current===audio){this.current=null;onerror();}});
  return true;
 }
}
