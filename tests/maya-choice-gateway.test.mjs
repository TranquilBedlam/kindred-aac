import assert from 'node:assert/strict';
import {APPROVED_STORY,APPROVED_AUDIO} from '../src/milo-approved-story.js';
import {MiloStory,MILO_SCENES} from '../src/milo-story.js';
assert.equal(APPROVED_STORY.length,7);
assert.equal(MILO_SCENES.length,7);
assert.equal(APPROVED_AUDIO.narration.length,7);
assert.equal(Object.keys(APPROVED_AUDIO.choices).length,13);
for(let i=0;i<7;i++){
 const scene=APPROVED_STORY[i];
 assert.equal(scene.options.length,2,`scene ${i+1} must offer exactly two choices`);
 assert.ok(scene.narration.includes('?'),`scene ${i+1} asks question`);
 for(const o of scene.options){if(o.key!=='07-restart')assert.ok(APPROVED_AUDIO.choices[o.key],`missing audio mapping for ${o.key}`);}
}
for(let selection=0;selection<2;selection++){
 const game=new MiloStory();
 for(let i=0;i<7;i++){
  assert.equal(game.step,i);
  const chosen=APPROVED_STORY[i].options[selection];
  const result=game.choose(chosen.label);
  assert.equal(result.key,chosen.key);
  assert.equal(game.step,i,'choice must not advance before response ends');
  if(i<6){assert.equal(game.next(),true);assert.equal(game.step,i+1);}
 }
 assert.equal(game.history.length,7);
 game.reset();assert.equal(game.step,0);assert.equal(game.history.length,0);
}
const raw=await (await import('node:fs/promises')).readFile(new URL('../src/main.js',import.meta.url),'utf8');
assert.match(raw,/playMiloClip\(file,complete\)/);
assert.match(raw,/milo\.next\(\);render\(\);narrateMilo\(\)/);
assert.match(raw,/miloCommunicationPaused=true/);
assert.ok(!raw.includes("tellStory(milo.scene.line"),'Do not use robotic browser voice for Milo');
console.log('PASS Maya choices: seven scenes, thirteen clips, gateway sequencing, restart, interruption hooks');
