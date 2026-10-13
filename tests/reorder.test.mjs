import test from 'node:test';
import assert from 'node:assert/strict';
import { CommunicationModel } from '../src/model.js';

test('reordering changes the pad order without changing word identity', () => {
 const m=new CommunicationModel();
 const original=m.words.length;
 m.moveWord('water','help');
 assert.equal(m.words[0].id,'water');
 assert.equal(m.words.length,original);
 for(const id of ['help','stop','break'])assert.ok(m.ids.has(id));
});
test('moving down one position works with after=true',()=>{
 const m=new CommunicationModel();
 m.moveWord('help','stop',true);
 assert.equal(m.words[0].id,'stop');assert.equal(m.words[1].id,'help');
});
test('saved order survives export/reload',()=>{
 const m=new CommunicationModel();m.addCustom('Grandma','💜');
 m.moveWord('custom-1','help');
 const reloaded=new CommunicationModel();reloaded.importVocabulary(m.exportVocabulary());
 assert.deepEqual(reloaded.words.map(w=>w.id),m.words.map(w=>w.id));
 assert.equal(reloaded.words[0].label,'Grandma');
});
test('existing vocabulary without order field remains compatible',()=>{
 const first=new CommunicationModel();first.addCustom('Grandma','💜');
 const old=first.exportVocabulary();delete old.order;
 const second=new CommunicationModel();second.importVocabulary(old);
 assert.ok(second.words.some(w=>w.label==='Grandma'));
});
test('invalid orders reject duplicates without losing existing words',()=>{
 const m=new CommunicationModel();const backup=m.words.map(w=>w.id);
 const data=m.exportVocabulary();data.order[1]=data.order[0];
 assert.throws(()=>m.importVocabulary(data),/Invalid saved word order/);
 assert.deepEqual(m.words.map(w=>w.id),backup);
});
test('unknown word moves reject safely',()=>{
 const m=new CommunicationModel();
 assert.throws(()=>m.moveWord('unknown','help'),/Unknown symbol/);
});
test('ordering does not change phrase construction',()=>{
 const m=new CommunicationModel();m.select('help');m.moveWord('help','water');
 assert.equal(m.phrase,'Help');
});
