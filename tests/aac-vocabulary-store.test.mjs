import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createVocabularyStore} from '../src/aac/vocabulary-store.js';
function storage(){const data=new Map();return {data,getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,String(value))};}
test('loads previously saved vocabulary from primary key',()=>{const db=storage();db.setItem('kindred-aac-vocabulary-v2',JSON.stringify({words:['yes']}));const store=createVocabularyStore(db);assert.deepEqual(store.read(),{words:['yes']});});
test('migrates legacy vocabulary without discarding data',()=>{const db=storage();db.setItem('kindred-aac-custom-vocabulary-v1',JSON.stringify({words:['help']}));assert.deepEqual(createVocabularyStore(db).read(),{words:['help']});});
test('current vocabulary takes precedence over legacy',()=>{const db=storage();db.setItem('kindred-aac-vocabulary-v2','{"words":["current"]}');db.setItem('kindred-aac-custom-vocabulary-v1','{"words":["old"]}');assert.deepEqual(createVocabularyStore(db).read(),{words:['current']});});
test('writes stable v2 data compatible with old installations',()=>{const db=storage();assert.equal(createVocabularyStore(db).write({words:['more']}),true);assert.deepEqual(JSON.parse(db.getItem('kindred-aac-vocabulary-v2')),{words:['more']});});
test('corrupt or inaccessible storage never crashes startup',()=>{const db=storage();db.setItem('kindred-aac-vocabulary-v2','{invalid');assert.equal(createVocabularyStore(db).read(),null);const blocked={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};assert.equal(createVocabularyStore(blocked).read(),null);assert.equal(createVocabularyStore(blocked).write({}),false);});
