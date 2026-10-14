// Concept 5 home-screen structural regressions. Run: node --test tests/home-concept-5.test.mjs
import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../src/main-pip-browser.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/style.css',import.meta.url),'utf8');
test('home has child-facing Stories and Games choices, no Me profile',()=>{
 assert.match(html,/id="kindred-home"/);
 assert.match(html,/id="home-stories"/);
 assert.match(html,/id="home-games"/);
 assert.doesNotMatch(html,/id="home-me"/);
});
test('Talk and caregiver controls keep original stable IDs',()=>{
 for(const id of ['talk','pad','open-parent-settings','caregiver-panel','vocab','learning-step','story-choices'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(js,/\$\('talk'\)\.onclick/);
 assert.match(js,/\$\('open-parent-settings'\)\.onclick/);
});
test('home navigation is wired and activity return exists',()=>{
 for(const id of ['home-stories','home-games','home-return'])assert.match(js,new RegExp("\\$\\('"+id+"'\\)"));
 assert.match(js,/data-choice="Milo"/);
 assert.match(html,/id="home-return"/);
});
test('AAC remains available above the learning layout',()=>{
 assert.match(css,/\.talk-controls\s*\{/);
 assert.match(css,/position:\s*sticky/);
 assert.match(html,/aria-label="Communication access"/);
});
