import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {APPROVED_STORY,APPROVED_AUDIO} from '../src/milo-approved-story.js';
import {MiloStory,MILO_SCENES} from '../src/milo-story-maya-choice-qa.js';
const js=readFileSync('src/main-pip-browser.js','utf8');
const html=readFileSync('index.html','utf8');
test('seven approved scenes and exactly two choices each',()=>{
 assert.equal(APPROVED_STORY.length,7);assert.equal(MILO_SCENES.length,7);
 for(const [index,scene] of APPROVED_STORY.entries()){
  assert.equal(scene.options.length,2,'Scene '+(index+1));
  assert.ok(scene.narration.length>150);
  assert.equal(scene.narration,MILO_SCENES[index].line);
 }
});
test('all original 20 MP3s exist and are nonempty with correct audio signatures',()=>{
 const files=[...APPROVED_AUDIO.narration,...Object.values(APPROVED_AUDIO.choices)];
 assert.equal(files.length,20);assert.equal(new Set(files).size,20);
 for(const file of files){
  assert.ok(file.startsWith('audio/'),file);
  assert.ok(statSync(file).size>1500,file);
  const buf=readFileSync(file);const mp3=buf.subarray(0,3).toString()==='ID3'||(buf[0]===255&&(buf[1]&224)===224);
  assert.ok(mp3,'Not MP3: '+file);
 }
});
test('each choice corresponds to its own named recording, except replay',()=>{
 assert.equal(Object.keys(APPROVED_AUDIO.choices).length,13);
 for(const scene of APPROVED_STORY)for(const choice of scene.options)if(choice.key!=='07-restart')
  assert.equal(APPROVED_AUDIO.choices[choice.key],'audio/'+choice.key+'.mp3');
});
test('choice changes do not advance until audio ends',()=>{
 const m=new MiloStory();
 for(let i=0;i<7;i++){
  assert.equal(m.step,i);
  assert.equal(m.scene.actions[APPROVED_STORY[i].options[0].label][2],APPROVED_STORY[i].options[0].key);
  const result=m.choose(APPROVED_STORY[i].options[0].label);
  assert.equal(m.step,i);assert.equal(result.key,APPROVED_STORY[i].options[0].key);
  if(i<6){assert.equal(m.next(),true);assert.equal(m.step,i+1);}
 }
 m.reset();assert.equal(m.step,0);assert.equal(m.history.length,0);
});
test('browser entry uses recorded Pip story module not old robotic story',()=>{
 assert.match(html,/src\/main-pip-browser.js/);
 assert.match(js,/playMiloClip\(APPROVED_AUDIO.narration\[milo.step\]\)/);
 assert.match(js,/APPROVED_AUDIO.choices\[key\]/);
 assert.match(js,/a.onended=\(\)=>/);
 assert.match(js,/milo.next\(\);render\(\);narrateMilo\(\)/);
 assert.doesNotMatch(js,/new SpeechSynthesisUtterance\(words\)/);
 assert.match(js,/new SpeechSynthesisUtterance\(text\)/);
});
test('independent communication and interrupt controls stay present',()=>{
 for(const id of ['talk','pad','vocab','pin','learning-replay','maya-portrait','milo-response'])assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(js,/miloCommunicationPaused=true/);
 assert.match(js,/stopMiloAudio\(\)/);
 assert.match(js,/key==='07-restart'/);
});
