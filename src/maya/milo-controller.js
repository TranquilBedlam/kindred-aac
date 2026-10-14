/**
 * Story Controller (MVC): coordinates choices and recorded audio without touching the DOM.
 * Its caller owns views, the story model, and communication pause state.
 */
export function createMiloController({story,audio,play,stop,render,respond,disableChoices,setStatus,isPaused,isCommunicationPaused}){
 let responding=false;
 const blocked=()=>responding||isPaused()||isCommunicationPaused();
 const narrate=()=>{if(!isCommunicationPaused())play(audio.narration[story.step]);};
 const choose=label=>{
  if(blocked())return;
  const {response,key}=story.choose(label);
  stop();responding=true;render();respond(response||'');disableChoices();
  if(key==='07-restart'){
   story.reset();responding=false;render();narrate();return;
  }
  const complete=()=>{
   if(isPaused()||isCommunicationPaused())return;
   responding=false;
   if(story.step===audio.narration.length-1){story.finished=true;render();setStatus('The end.');}
   else {story.next();render();narrate();}
  };
  const file=audio.choices[key];
  if(file)play(file,complete);
 };
 const resetResponse=()=>{responding=false;};
 return {narrate,choose,resetResponse,get responding(){return responding;}};
}
