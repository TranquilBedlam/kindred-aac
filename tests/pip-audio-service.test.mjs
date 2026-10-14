import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createPipAudioPlayer} from '../src/aac/pip-audio-service.js';
function harness(){
 const audios=[],statuses=[],events=[];
 let completionAllowed=true;
 const player=createPipAudioPlayer({
  createAudio(src){
   const audio={src,onplay:null,onended:null,onerror:null,paused:false,removed:false,
    play(){audio.onplay?.();return Promise.resolve();},
    pause(){audio.paused=true;},
    removeAttribute(){audio.removed=true;}};
   audios.push(audio);return audio;
  },
  onStart:()=>events.push('start'),
  onStop:()=>events.push('stop'),
  onStatus:msg=>statuses.push(msg),
  canComplete:()=>completionAllowed
 });
 return {player,audios,statuses,events,setAllowed:v=>completionAllowed=v};
}
test('Pip recording plays and completes exactly once',async()=>{
 const h=harness();let ended=0;h.player.play('scene-1.mp3',()=>ended++);
 await Promise.resolve();assert.equal(h.audios.length,1);
 h.audios[0].onended();assert.equal(ended,1);
 assert.equal(h.statuses.at(-1),'Maya is speaking.');
});
test('stop cancels old clip and prevents stale completion',async()=>{
 const h=harness();let ended=0;h.player.play('one.mp3',()=>ended++);
 await Promise.resolve();const callback=h.audios[0].onended;
 h.player.stop();assert.ok(h.audios[0].paused);callback();assert.equal(ended,0);
 h.player.play('two.mp3',()=>ended++);await Promise.resolve();
 assert.equal(h.audios.length,2);h.audios[1].onended();assert.equal(ended,1);
});
test('AAC interruption prevents audio-led scene advancement',async()=>{
 const h=harness();let advanced=false;h.player.play('response.mp3',()=>advanced=true);
 await Promise.resolve();h.setAllowed(false);h.audios[0].onended();assert.equal(advanced,false);
});
test('missing recording reports error and cannot trigger a next scene',()=>{
 const h=harness();let advanced=false;h.player.play(null,()=>advanced=true);
 assert.equal(advanced,false);assert.match(h.statuses.at(-1),/missing/);
});
test('audio error never synthesizes a robot fallback',async()=>{
 const h=harness();h.player.play('wrong.mp3');await Promise.resolve();
 h.audios[0].onerror();assert.match(h.statuses.at(-1),/No replacement voice/);
});
