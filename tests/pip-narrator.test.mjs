import {test} from 'node:test';import assert from 'node:assert/strict';
import {PipNarrator,PIP_RECORDINGS} from '../src/maya/pip-narrator.js';
function harness(){
 const made=[];const narrator=new PipNarrator(url=>{
  const audio={src:url,paused:false,currentTime:0,play(){this.paused=false;return Promise.resolve();},pause(){this.paused=true;},onplay:null,onended:null,onerror:null};
  made.push(audio);return audio;
 });return {narrator,made};
}
test('approved narration keys include the welcome and known story scenes',()=>{
 assert.match(PIP_RECORDINGS.welcome.text,/Milo the dragon/);
 assert.ok(PIP_RECORDINGS.scene0.url.startsWith('https://'));
 assert.ok(PIP_RECORDINGS.scene4.url.startsWith('https://'));
});
test('unknown scene falls back without creating audio',()=>{
 const h=harness();assert.equal(h.narrator.play('scene6'),false);assert.equal(h.made.length,0);
});
test('opening AAC can interrupt narration immediately',()=>{
 const h=harness();h.narrator.play('welcome');h.narrator.stop();
 assert.equal(h.made[0].paused,true);assert.equal(h.made[0].currentTime,0);
});
test('new narration stops the old audio rather than overlapping',()=>{
 const h=harness();h.narrator.play('welcome');h.narrator.play('scene0');
 assert.equal(h.made[0].paused,true);assert.equal(h.made.length,2);
});
test('recorded narration errors invoke fallback callback',()=>{
 const h=harness();let failures=0;h.narrator.play('scene0',{onerror:()=>failures++});h.made[0].onerror();
 assert.equal(failures,1);assert.equal(h.narrator.current,null);
});
