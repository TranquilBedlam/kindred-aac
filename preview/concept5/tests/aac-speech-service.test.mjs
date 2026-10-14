import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createAacSpeechService} from '../src/aac/speech-service.js';
function fixture(){
 const calls=[],engine={paused:true,getVoices(){return [{name:'Device American',voiceURI:'local'}];},speak(x){calls.push(['speak',x]);},resume(){calls.push(['resume']);},cancel(){calls.push(['cancel']);}};
 class Utterance{constructor(text){this.text=text;}}
 const status=[];
 const speech=createAacSpeechService({engine,Utterance,getSettings:()=>({pitch:1.25,rate:0.85,voiceURI:'local'}),chooseVoice:vs=>vs[0],onStatus:text=>status.push(text)});
 return {calls,engine,status,speech};
}
test('AAC speech sends immediate device utterance without cancelling existing speech',()=>{const f=fixture();f.speech('Help');assert.equal(f.calls[0][0],'speak');assert.equal(f.calls[0][1].text,'Help');assert.equal(f.calls.some(x=>x[0]==='cancel'),false);});
test('AAC speech keeps configured pitch, rate, locale and selected voice',()=>{const f=fixture();f.speech('I want water');const u=f.calls[0][1];assert.equal(u.lang,'en-US');assert.equal(u.pitch,1.25);assert.equal(u.rate,0.85);assert.equal(u.voice.voiceURI,'local');});
test('paused speech engine resumes and completion updates message',()=>{const f=fixture();f.speech('More');assert.equal(f.calls[1][0],'resume');f.calls[0][1].onend();assert.match(f.status.at(-1),/Spoken: More/);});
test('AAC speech error leaves visible diagnostic',()=>{const f=fixture();f.speech('Stop');f.calls[0][1].onerror({error:'network'});assert.match(f.status.at(-1),/network/);});
test('unavailable device synthesis reports unsupported browser',()=>{const f=createAacSpeechService({engine:null,Utterance:null,getSettings:()=>({}),chooseVoice:()=>null,onStatus:()=>{}});assert.throws(()=>f('Help'),/cannot speak/);});
