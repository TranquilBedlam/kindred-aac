import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createAacSpeechRouter} from '../src/aac/neural-voice-prototype.js';
test('uses existing AAC voice until explicitly enabled and ready',async()=>{
 const spoken=[];const r=createAacSpeechRouter({neural:t=>spoken.push('new:'+t),fallback:t=>spoken.push('old:'+t)});
 assert.equal((await r.speak('Hello')).route,'fallback');r.setEnabled(true);assert.equal((await r.speak('Hello')).route,'fallback');r.setReady(true);assert.equal((await r.speak('Hello')).route,'neural');assert.deepEqual(spoken,['old:Hello','old:Hello','new:Hello']);
});
test('urgent speech never waits for neural voice',async()=>{const spoken=[];const r=createAacSpeechRouter({neural:()=>{throw Error('must not run')},fallback:t=>spoken.push(t)});r.setReady(true);r.setEnabled(true);assert.equal((await r.speak('Help',{urgent:true})).route,'fallback');assert.deepEqual(spoken,['Help']);});
test('synchronous engine failure falls back',async()=>{const spoken=[];const r=createAacSpeechRouter({neural:()=>{throw Error('offline engine failed')},fallback:t=>spoken.push(t)});r.setReady(true);r.setEnabled(true);assert.equal((await r.speak('Break')).route,'fallback');assert.deepEqual(spoken,['Break']);});
test('asynchronous engine failure falls back',async()=>{const spoken=[];const r=createAacSpeechRouter({neural:async()=>{throw Error('out of memory')},fallback:t=>spoken.push(t)});r.setReady(true);r.setEnabled(true);assert.equal((await r.speak('I need my blanket')).route,'fallback');assert.deepEqual(spoken,['I need my blanket']);});
test('does not speak empty text',async()=>{const r=createAacSpeechRouter({fallback:()=>{throw Error('unexpected')}});assert.equal((await r.speak('   ')).route,'none');});
