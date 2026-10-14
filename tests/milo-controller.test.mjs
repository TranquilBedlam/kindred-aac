import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createMiloController} from '../src/maya/milo-controller.js';
function setup(sceneCount=7){
 const state={step:0,finished:false,history:[],paused:false,communicationPaused:false};
 const calls=[],pending=[];
 const story={get step(){return state.step;},set finished(v){state.finished=v;},get finished(){return state.finished;},choose(label){state.history.push(label);return {key:label,response:'response '+label};},next(){state.step++;},reset(){state.step=0;state.finished=false;state.history=[];}};
 const controller=createMiloController({story,audio:{narration:Array.from({length:sceneCount},(_,i)=>'s'+i),choices:{a:'a.mp3',b:'b.mp3','07-goodbye':'bye.mp3'}},play:(src,done)=>{calls.push(['play',src]);pending.push(done);},stop:()=>calls.push(['stop']),render:()=>calls.push(['render']),respond:text=>calls.push(['respond',text]),disableChoices:()=>calls.push(['disable']),setStatus:text=>calls.push(['status',text]),isPaused:()=>state.paused,isCommunicationPaused:()=>state.communicationPaused});
 return {controller,state,calls,pending};
}
test('narrates real MP3 and waits for response completion before advancing',()=>{
 const h=setup();h.controller.narrate();assert.deepEqual(h.calls.at(-1),['play','s0']);
 h.controller.choose('a');assert.equal(h.state.step,0);assert.deepEqual(h.calls.at(-1),['play','a.mp3']);
 h.pending.at(-1)();assert.equal(h.state.step,1);assert.deepEqual(h.calls.at(-1),['play','s1']);
});
test('AAC interruption prevents progression',()=>{
 const h=setup();h.controller.choose('a');h.state.communicationPaused=true;h.pending.at(-1)();assert.equal(h.state.step,0);
});
test('paused lesson rejects choices',()=>{const h=setup();h.state.paused=true;h.controller.choose('a');assert.equal(h.state.history.length,0);});
test('restart is immediate, replays scene 1',()=>{const h=setup();h.state.step=6;h.controller.choose('07-restart');assert.equal(h.state.step,0);assert.deepEqual(h.calls.at(-1),['play','s0']);});
test('final goodbye concludes story without going to scene 8',()=>{const h=setup();h.state.step=6;h.controller.choose('07-goodbye');h.pending.at(-1)();assert.equal(h.state.step,6);assert.equal(h.state.finished,true);});

test('a three-scene learning story finishes at its actual final scene',()=>{const h=setup(3);h.state.step=2;h.controller.choose('a');h.pending.at(-1)();assert.equal(h.state.step,2);assert.equal(h.state.finished,true);});
