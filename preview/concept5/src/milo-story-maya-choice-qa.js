import {APPROVED_STORY} from './milo-approved-story.js';
export const MILO_SCENES=APPROVED_STORY.map((scene,i)=>({
  title:scene.title,
  emoji:['🏡🌧️🐉','🐉🐸🧺','🍂💧🐸','🐉⛵🌸','⛵💦🐸','🧺🥪🍎','🌈🐉🐸'][i],
  line:scene.narration,
  prompt:i===6?'Would you like to hear Milo’s story again?':'Choose what happens next.',
  actions:Object.fromEntries(scene.options.map(o=>[o.label,[o.icon,o.response||'',o.key]]))
}));
export class MiloStory{
 constructor(){this.reset();}
 reset(){this.step=0;this.finished=false;this.history=[];this.lastResponse='';this.boatItem='';this.boatMotion='';this.boatPrevious='';this.location='';}
 get scene(){return MILO_SCENES[this.step];}
 choose(action){
  if(this.finished||!Object.hasOwn(this.scene.actions,action))throw Error('Choose a story action');
  const [icon,response,key]=this.scene.actions[action];
  this.history.push({step:this.step,action,key});
  this.lastResponse=response;
  if(this.step===3)this.boatItem=key;
  if(this.step===4)this.boatMotion=key;
  if(this.step===1)this.location=key;
  return {response,key};
 }
 next(){if(this.finished)return false;this.lastResponse='';if(this.step===MILO_SCENES.length-1){this.finished=true;return false;}this.step++;return true;}
}