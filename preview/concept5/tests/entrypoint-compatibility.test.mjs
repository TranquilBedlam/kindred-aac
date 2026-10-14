import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const pages={
 'index.html':'src/main-pip-browser.js',
 'maya-017.html':'src/main.js',
 'maya-led-0172.html':'src/main.js',
 'story-0173.html':'src/main.js',
 'verify-0152.html':'src/main.js',
 'pip-preview.html':'src/main-pip-preview.js',
 'maya-choice-gateway-qa.html':'src/main-maya-choice-qa.js'
};
test('one production entry point remains separate from historical previews',()=>{
 const html=readFileSync('index.html','utf8');
 assert.match(html,/src\/main-pip-browser\.js/);
 assert.doesNotMatch(html,/src\/main(?:-pip-preview|-maya-choice-qa)?\.js(?:\?|["'])/);
});
test('historical browser preview links continue to resolve',()=>{
 for(const [page,script] of Object.entries(pages)){
  assert.ok(existsSync(page),page);
  assert.ok(existsSync(script),script);
  assert.ok(readFileSync(page,'utf8').includes(script),page+' should keep '+script);
 }
});
test('production entry imports separated AAC and story services',()=>{
 const source=readFileSync(pages['index.html'],'utf8');
 for(const path of ['aac/speech-service.js','aac/vocabulary-store.js','aac/preference-store.js','maya/milo-controller.js','maya/milo-view.js','maya/learning-choice-view.js']){
  assert.ok(source.includes(path),path+' integration should stay intact');
 }
});
