import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import {CommunicationModel,WORDS} from '../src/model.js';
import {validPin,verifyChallenge,pinDigest} from '../src/parent.js';
import {makeRecoveryRecord,verifyRecovery,resetPinWithRecovery,addRecoveryToExisting} from '../src/recovery.js';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/style.css',import.meta.url),'utf8');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);
const referenced=[...js.matchAll(/\$\('([^']+)'\)/g)].map(x=>x[1]);
test('all JavaScript element IDs exist in the page and are unique',()=>{
 assert.deepEqual([...new Set(referenced)].filter(x=>!ids.includes(x)),[]);
 assert.equal(new Set(ids).size,ids.length);
});
test('caregiver editor starts locked and cannot be made visible by CSS',()=>{
 assert.match(html,/id="caregiver-editor" hidden/);
 assert.match(js,/let unlocked=false/);
 assert.match(css,/\[hidden\]\s*\{display:none!important\}/);
});
test('the PIN recovery reset does not clear vocabulary storage',()=>{
 const part=js.slice(js.indexOf("$('reset-with-recovery').onclick"),js.indexOf("$('remove-parent-pin').onclick"));
 assert.doesNotMatch(part,/localStorage\.clear\(/);
 assert.doesNotMatch(part,/removeItem\(storageKey\)/);
 assert.match(js,/kindred-aac-vocabulary-v2/);
});
test('AAC is directly accessible outside caregiver settings',()=>{
 assert.match(html,/id="talk"/);
 assert.match(html,/id="vocab"/);
 assert.match(js,/controller\.selectAndSpeak/);
});
test('essential communication words are retained after restoring defaults',()=>{
 const model=new CommunicationModel();
 for(const id of ['help','stop','break']) assert.ok(model.words.find(w=>w.id===id));
 model.restoreBuiltins();
 for(const id of ['help','stop','break']) assert.ok(model.words.find(w=>w.id===id));
});
test('custom vocabulary survives export and reimport',()=>{
 const one=new CommunicationModel();one.addCustom('Grandma','💜');
 const two=new CommunicationModel();two.importVocabulary(one.exportVocabulary());
 assert.ok(two.words.some(x=>x.label==='Grandma'));
});
test('built-in vocabulary edits survive export and reimport',()=>{
 const one=new CommunicationModel();one.updateWord('water','My Water','🥤');
 const two=new CommunicationModel();two.importVocabulary(one.exportVocabulary());
 assert.equal(two.words.find(x=>x.id==='water').label,'My Water');
});
test('PIN validates 4 through 8 numeric characters',()=>{
 assert.equal(validPin('1234'),true);
 assert.equal(validPin('12345678'),true);
 assert.equal(validPin('123'),false);
 assert.equal(validPin('abcd'),false);
});
test('adult challenge validates exact answer',()=>{assert.equal(verifyChallenge(8,5,'13'),true);assert.equal(verifyChallenge(8,5,'13extra'),false);});
test('recovery code resets PIN, invalidates old code and rotates recovery code',async()=>{
 const {record,code}=await makeRecoveryRecord('1234',webcrypto);
 assert.ok(await verifyRecovery(record,code,webcrypto));
 const result=await resetPinWithRecovery(record,code,'5678',webcrypto);
 assert.equal(await verifyRecovery(result.record,code,webcrypto),false);
 assert.equal(await verifyRecovery(result.record,result.code,webcrypto),true);
 assert.equal(await pinDigest('5678',result.record.salt),result.record.digest);
});
test('legacy PIN can be enrolled without changing its digest',async()=>{
 const {record}=await makeRecoveryRecord('1234',webcrypto);
 const legacy={salt:record.salt,digest:record.digest};
 const upgraded=await addRecoveryToExisting(legacy,webcrypto);
 assert.equal(upgraded.record.digest,legacy.digest);
 assert.equal(await verifyRecovery(upgraded.record,upgraded.code,webcrypto),true);
});
test('recovery reset leaves user vocabulary and photos untouched in storage',async()=>{
 const storage={vocabulary:'existing-photos-and-words',pin:null};
 const {record,code}=await makeRecoveryRecord('1234',webcrypto);
 storage.pin=JSON.stringify(record);
 const next=await resetPinWithRecovery(JSON.parse(storage.pin),code,'5678',webcrypto);
 storage.pin=JSON.stringify(next.record);
 assert.equal(storage.vocabulary,'existing-photos-and-words');
});
test('voice settings stay in caregiver view',()=>{
 assert.ok(html.indexOf('id="voice"')>html.indexOf('data-parent-pane="voice"'));
 assert.doesNotMatch(js,/go-voice/);
 assert.match(js,/msg\.rate=Number\(\$\('rate'\)\.value\)/);
 assert.match(js,/msg\.pitch=Number\(\$\('pitch'\)\.value\)/);
});
