import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createAacPreferenceStore} from '../src/aac/preference-store.js';
const memory=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v)),data};};
test('retains existing preference keys for saved AAC voices',()=>{const db=memory();const s=createAacPreferenceStore(db);s.saveVoice('en-us-voice');assert.equal(db.getItem('kindred-aac-preferred-voice-v1'),'en-us-voice');assert.equal(s.readVoice(),'en-us-voice');});
test('retains existing tuning keys for AAC pitch and speed',()=>{const db=memory();const s=createAacPreferenceStore(db);s.saveTuning({pitch:'1.2',rate:'0.9'});assert.deepEqual(s.readTuning(),{pitch:'1.2',rate:'0.9'});});
test('handles malformed data without breaking AAC',()=>{const db=memory();db.setItem('kindred-aac-voice-tuning-v1','{bad json');assert.equal(createAacPreferenceStore(db).readTuning(),null);});
test('handles unavailable storage without throwing',()=>{const db={getItem(){throw Error('disabled');},setItem(){throw Error('disabled');}};const s=createAacPreferenceStore(db);assert.equal(s.readVoice(),'');assert.equal(s.saveVoice('x'),false);assert.equal(s.saveTuning({pitch:'1',rate:'1'}),false);});
