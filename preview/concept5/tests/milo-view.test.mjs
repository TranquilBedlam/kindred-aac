import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createMiloView} from '../src/maya/milo-view.js';
class FakeElement {
 constructor(tag='div'){this.tag=tag;this.hidden=false;this.textContent='';this.dataset={};this.attrs={};this.children=[];this.disabled=false;this.onclick=null;this.className='';}
 setAttribute(k,v){this.attrs[k]=v;} append(...x){this.children.push(...x);} replaceChildren(...x){this.children=x;}
}
function fixture(){
 const ids=['forest-scene','forest-caption','story-choices','learning-options','learning-back','learning-heading','learning-progress','learning-narration','milo-visual','milo-response','milo-prompt','milo-help','learning-replay'];
 const el=Object.fromEntries(ids.map(id=>[id,new FakeElement()]));
 const events=[];const view=createMiloView({get:id=>el[id],create:tag=>new FakeElement(tag),onChoose:label=>events.push(['choose',label]),onReplay:()=>events.push(['replay']),onSkip:()=>events.push(['skip']),onRecover:()=>events.push(['recover'])});
 const scene={title:'Rainy Picnic',line:'Original Pip narrator',emoji:'🐉',prompt:'What next?',actions:{'Open the door':['🚪','Response','01-open-door'],"Ask who's there":['💬','Response','01-ask-whos-there']}};
 return {el,events,view,scene};
}
test('story view renders exactly two accessible picture choices',()=>{
 const f=fixture();f.view.render({scene:f.scene,step:0,finished:false,lastResponse:'',boatItem:'',responding:false,communicationPaused:false});assert.equal(f.el['learning-options'].children.filter(x=>x.className==='learning-option').length,2);assert.equal(f.el['learning-progress'].textContent.includes('Scene 1 of 7'),true);f.el['learning-options'].children[0].onclick();assert.deepEqual(f.events[0],['choose','Open the door']);
});
test('communication pause disables choices and response state shows recovery',()=>{const f=fixture();f.view.render({scene:f.scene,step:0,finished:false,lastResponse:'Result',responding:true,communicationPaused:true});assert.equal(f.el['learning-options'].children[0].disabled,true);assert.equal(f.el['learning-options'].children.at(-1).textContent,'Continue if audio is unavailable →');});
test('final scene offers replay and preserves visible communication controls',()=>{const f=fixture();f.view.render({scene:f.scene,step:6,finished:true,lastResponse:'Goodbye',responding:false,communicationPaused:false});assert.equal(f.el['learning-options'].children.length,1);f.el['learning-options'].children[0].onclick();assert.deepEqual(f.events,[['replay']]);assert.equal(f.el['learning-back'].hidden,false);});
test('KISS: view writes scene heading and progress only once without changing child-facing text',()=>{
 const f=fixture();
 for(const id of ['learning-heading','learning-progress']){
  let writes=0,value='';
  Object.defineProperty(f.el[id],'textContent',{get(){return value;},set(v){writes++;value=v;}});
  f.el[id].writes=()=>writes;
 }
 f.view.render({scene:f.scene,step:2,finished:false,lastResponse:'',boatItem:'',responding:false,communicationPaused:false});
 assert.equal(f.el['learning-heading'].textContent,'Rainy Picnic');
 assert.equal(f.el['learning-progress'].textContent,'Milo the Dragon and the Rainy-Day Surprise · Scene 3 of 7');
 assert.equal(f.el['learning-heading'].writes(),1);
 assert.equal(f.el['learning-progress'].writes(),1);
});

test('progress label uses actual length of future shorter story',()=>{const f=fixture();f.view.render({scene:f.scene,step:1,totalScenes:3,finished:false,lastResponse:'',boatItem:'',responding:false,communicationPaused:false});assert.equal(f.el['learning-progress'].textContent,'Milo the Dragon and the Rainy-Day Surprise · Scene 2 of 3');});
