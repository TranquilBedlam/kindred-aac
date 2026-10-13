// An isolated, dependency-injected experiment. Not wired to production AAC.
// Only route to neural speech when a bundled engine is READY; never wait for
// downloads/model initialization from a child's communication tap.
export function createAacSpeechRouter({neural, fallback}) {
 if(typeof fallback!=='function')throw new TypeError('A fallback speech function is required');
 let ready=false;
 let enabled=false;
 return {
  get status(){return {ready,enabled};},
  setReady(value){ready=value===true;},
  setEnabled(value){enabled=value===true;},
  speak(text,{urgent=false}={}){
   if(typeof text!=='string'||!text.trim())return Promise.resolve({route:'none'});
   // Urgent messages never wait for an experimental synthesizer.
   if(urgent||!ready||!enabled||typeof neural!=='function') {
    fallback(text);return Promise.resolve({route:'fallback'});
   }
   try {
    return Promise.resolve(neural(text)).then(()=>({route:'neural'}),()=>{
     fallback(text);return {route:'fallback'};
    });
   } catch {
    fallback(text);return Promise.resolve({route:'fallback'});
   }
  }
 };
}
