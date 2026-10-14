import {validPin,verifyChallenge,createChallenge,pinDigest} from './parent.js';
import {TalkingPortrait} from './maya/talking-portrait.js';
import {MiloStory,MILO_SCENES} from './milo-story-maya-choice-qa.js';
import {APPROVED_AUDIO} from './milo-approved-story.js';
import {englishVoices,voiceLabel,chooseVoice} from './aac/voice-selection.js';
import {makeRecoveryRecord,addRecoveryToExisting,resetPinWithRecovery} from './recovery.js';
import {WORDS,CommunicationModel,LessonModel,PadController} from './model.js';
import {ICON_CATEGORIES,getIcons} from './iconCatalog.js';
const $=id=>document.getElementById(id);
const model=new CommunicationModel(),lesson=new LessonModel(),milo=new MiloStory();
let miloActive=false;
const storageKey='kindred-aac-vocabulary-v2';
const legacyStorageKey='kindred-aac-custom-vocabulary-v1';
try{const saved=localStorage.getItem(storageKey)||localStorage.getItem(legacyStorageKey);if(saved)model.importVocabulary(JSON.parse(saved));}catch(e){console.warn('Could not load custom vocabulary',e);}
const saveVocabulary=()=>{try{localStorage.setItem(storageKey,JSON.stringify(model.exportVocabulary()));return true;}catch(e){$('edit-status').textContent='Could not save on this device. Check available storage.';return false;}};

// Speak from the same direct tap event. Do not cancel immediately before every
// utterance: on some browsers that silences the first requested word.
const speaker=text=>{
  if(!('speechSynthesis' in window)||!('SpeechSynthesisUtterance' in window))
    throw new Error('This browser cannot speak. Try Chrome, Edge, or Safari with a voice installed.');
  const engine=window.speechSynthesis;
  const msg=new SpeechSynthesisUtterance(text);
  msg.lang='en-US'; msg.rate=Number($('rate').value)||1; msg.pitch=Number($('pitch').value)||1;
  const voices=engine.getVoices();
  const chosen=chooseVoice(voices,$('voice').value);
  if(chosen)msg.voice=chosen;
  engine.speak(msg);
  if(engine.paused)engine.resume();
  $('speech-status').textContent='Speaking: '+text;
  msg.onerror=event=>{$('speech-status').textContent='Audio did not play ('+(event.error||'unknown error')+'). Check your browser voice and sound settings.';};
  msg.onend=()=>{$('speech-status').textContent='Spoken: '+text;};
  return Promise.resolve(true);
};
// Small local images avoid network dependency and reduce storage pressure.
async function compressPhoto(file){
 if(!file)return null;
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Choose a JPG, PNG, or WebP photo.');
 if(file.size>8*1024*1024)throw Error('Photo too large (8 MB maximum input).');
 const url=URL.createObjectURL(file);
 try{
   const bitmap=await createImageBitmap(file);
   try{
     const max=220,ratio=Math.min(1,max/Math.max(bitmap.width,bitmap.height));
     const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*ratio));canvas.height=Math.max(1,Math.round(bitmap.height*ratio));
     canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);
     let data=canvas.toDataURL('image/jpeg',0.72);
     if(data.length>140000)throw Error('Photo still too large after resizing. Choose a simpler image.');
     return data;
   }finally{bitmap.close?.();}
 }finally{URL.revokeObjectURL(url);}
}
function visualFor(word){
 if(word.photo){const image=document.createElement('img');image.className='word-photo';image.alt='';image.src=word.photo;image.setAttribute('aria-hidden','true');return image;}
 const icon=document.createElement('span');icon.className='emoji';icon.setAttribute('aria-hidden','true');icon.textContent=word.emoji;return icon;
}
const controller=new PadController(model,lesson,speaker);

let mayaPortrait=null;
let mayaEnabled=true;
TalkingPortrait.create($('maya-portrait'),'src/maya/characters/maya').then(p=>{
 mayaPortrait=p;
 if(!mayaEnabled)p.host.hidden=true;
}).catch(()=>{
 $('maya-portrait').setAttribute('aria-label','Maya artwork is not installed; story choices remain available.');
});
$('maya-toggle').onclick=()=>{
 mayaEnabled=!mayaEnabled;
 $('maya-toggle').setAttribute('aria-pressed',String(mayaEnabled));
 $('maya-toggle').textContent=mayaEnabled?'Maya on':'Maya off';
 $('maya-portrait').hidden=!mayaEnabled;
 if(!mayaEnabled)mayaPortrait?.end();
};
// Story grammar: character, small problem, meaningful choices, resolution.
const storyScenes={
 Bears:[
  {line:'Pip the bear has lost his blue scarf. Cold wind whispers through the forest. Where could it be?',choices:[['Look under leaves','🍂'],['Follow the footprints','🐾']],responses:{'Look under leaves':'Pip lifts the golden leaves. A little feather is hiding beneath them!','Follow the footprints':'Pip follows tiny footprints. They lead toward the tallest tree.'}},
  {line:'A friendly bird flutters above a low branch. Something blue waves in the breeze. How can Pip get closer?',choices:[['Ask the bird','🐦'],['Reach for the branch','🌿']],responses:{'Ask the bird':'The bird chirps and gently nudges the blue scarf down to Pip.','Reach for the branch':'Pip stretches up, up, up, and the soft blue scarf slips into his paws!'}},
  {line:'Pip has his scarf again. He feels warm and safe. How should we finish the adventure?',choices:[['Thank the bird','💛'],['Head home','🏡']],responses:{'Thank the bird':'Pip waves his scarf to say thank you. The bird sings a happy little song.','Head home':'Pip follows the cozy path home. He snuggles up as the sun goes down.'}}
 ],
 Space:[
  {line:'Nova the little astronaut is ready to visit the moon, but her rocket needs a destination. Where shall she go?',choices:[['Rocket','🚀'],['Moon','🌙']],responses:{Rocket:'Nova checks every button. The engines begin to hum!',Moon:'Nova points to the bright moon. That is the perfect place to explore!'}},
  {line:'Whoosh! Nova flies among the stars. A sparkling trail leads ahead. What should she explore?',choices:[['Moon','🌙'],['Rocket','🚀']],responses:{Moon:'The moon shines brighter and brighter as Nova gets closer.',Rocket:'Nova watches the rocket windows glow with tiny stars.'}},
  {line:'Nova lands safely and sees Earth shining far away. What should she visit before heading home?',choices:[['Rocket','🚀'],['Moon','🌙']],responses:{Rocket:'Nova climbs aboard for a gentle trip home. What an adventure!',Moon:'Nova makes one little moon-hop before heading home. What an adventure!'}}
 ]
};
const mayaVoiceKey='kindred-maya-voice-v1';
const mayaVoices=()=>('speechSynthesis' in window?window.speechSynthesis.getVoices():[]).filter(v=>/^en-US$/i.test(v.lang));
const rankMayaVoice=v=>{
 const name=v.name.toLowerCase();
 const girl=/\b(samantha|ava|allison|jenny|aria|zira|susan|karen|victoria|serena|joanna|salli|kimberly|ivy|female)\b/i.test(name);
 const natural=/enhanced|premium|natural|neural|high quality/i.test(name);
 return (girl?100:0)+(natural?35:0)+(v.localService?15:0);
};
const selectMayaVoice=()=>{
 const voices=mayaVoices();
 let stored='';try{stored=localStorage.getItem(mayaVoiceKey)||'';}catch{}
 return voices.find(v=>v.voiceURI===stored)||[...voices].sort((a,b)=>rankMayaVoice(b)-rankMayaVoice(a))[0]||null;
};
const refreshMayaVoices=()=>{
 const el=$('maya-voice');if(!el)return;
 const voices=mayaVoices(),selected=selectMayaVoice();
 el.replaceChildren(new Option('Automatic American English', ''));
 for(const v of voices)el.add(new Option(v.name+(v.localService?' (on-device)':''),v.voiceURI));
 let stored='';try{stored=localStorage.getItem(mayaVoiceKey)||'';}catch{}
 el.value=voices.some(v=>v.voiceURI===stored)?stored:'';
 $('maya-voice-note').textContent=selected?'Using: '+selected.name+'. Naturalness depends on your device.':'No American English voice detected yet. Voice options may load after you tap Preview.';
};
$('maya-voice').onchange=()=>{
 try{localStorage.setItem(mayaVoiceKey,$('maya-voice').value);}catch{}
 refreshMayaVoices();
};
$('maya-voice-preview').onclick=()=>{if(miloActive){narrateMilo();}else{playMiloClip(APPROVED_AUDIO.narration[0]);}};
refreshMayaVoices();
if('speechSynthesis' in window)window.speechSynthesis.addEventListener?.('voiceschanged',refreshMayaVoices);
const tellStory=(words)=>{
 if(!('speechSynthesis' in window)||!('SpeechSynthesisUtterance' in window)){
  $('learning-voice-status').textContent='Voice is unavailable here. Follow the written story or try a browser with speech.';
  return;
 }
 try{
  const engine=window.speechSynthesis;
  // Avoid cancelling an idle speech engine before first narration: that
  // can silence initial speech on some mobile browsers.
  if(engine.speaking)engine.cancel();
  mayaPortrait?.end();
  const utterance=new SpeechSynthesisUtterance(words);
  utterance.lang='en-US';
  utterance.rate=.88;
  const preferred=selectMayaVoice();
  if(preferred)utterance.voice=preferred;
  utterance.pitch=1.04;
  utterance.onstart=()=>{if(mayaEnabled)mayaPortrait?.begin();$('learning-voice-status').textContent='Maya is telling the story.';};
  utterance.onboundary=event=>{if(mayaEnabled&&event.name==='word')mayaPortrait?.word(words.slice(event.charIndex,event.charIndex+(event.charLength||12)));};
  utterance.onend=()=>{mayaPortrait?.end();$('learning-voice-status').textContent='Story narration finished.';};
  utterance.onerror=e=>{mayaPortrait?.end();$('learning-voice-status').textContent='Audio unavailable ('+(e.error||'unknown')+'). The story remains readable.';};
  engine.speak(utterance);
  if(engine.paused)engine.resume();
  $('learning-voice-status').textContent='Starting narration…';
 }catch(error){mayaPortrait?.end();$('learning-voice-status').textContent=error.message;}
};
// Dedicated Pip recordings for the Milo experience. AAC speech uses the independent device voice.
let miloAudio=null, miloAudioToken=0, miloResponding=false, miloCommunicationPaused=false;
const stopMiloAudio=()=>{
 miloAudioToken++;
 if(miloAudio){miloAudio.onended=null;miloAudio.onerror=null;miloAudio.pause();miloAudio.removeAttribute('src');miloAudio=null;}
 mayaPortrait?.end();
};
const playMiloClip=(file,onEnd)=>{
 stopMiloAudio();
 const token=miloAudioToken;
 if(!file){$('learning-voice-status').textContent='Pip audio file is missing. The written story remains available.';return;}
 const a=new Audio(file);miloAudio=a;
 a.onplay=()=>{if(token!==miloAudioToken)return;if(mayaEnabled)mayaPortrait?.begin();$('learning-voice-status').textContent='Maya is speaking.';};
 a.onended=()=>{if(token!==miloAudioToken)return;mayaPortrait?.end();miloAudio=null;if(!miloCommunicationPaused&&onEnd)onEnd();};
 a.onerror=()=>{if(token!==miloAudioToken)return;mayaPortrait?.end();$('learning-voice-status').textContent='Pip MP3 unavailable. No replacement voice will be used.';miloAudio=null;};
 a.play().catch(()=>{if(token!==miloAudioToken)return;mayaPortrait?.end();$('learning-voice-status').textContent='Tap Hear Maya to enable audio, or continue with the picture choices.';});
};
const narrateMilo=()=>{if(!miloCommunicationPaused)playMiloClip(APPROVED_AUDIO.narration[milo.step]);};
const chooseMilo=(label)=>{
 if(miloResponding||miloCommunicationPaused||lesson.paused)return;
 const {response,key}=milo.choose(label);
 stopMiloAudio();miloResponding=true;
 render();
 $('milo-response').hidden=false;$('milo-response').textContent=response||'';
 $('learning-options').querySelectorAll('button').forEach(b=>b.disabled=true);
 if(key==='07-restart'){milo.reset();miloResponding=false;render();narrateMilo();return;}
 const complete=()=>{
  if(miloCommunicationPaused||lesson.paused)return;
  miloResponding=false;
  if(milo.step===6){milo.finished=true;render();$('learning-voice-status').textContent='The end.';}
  else {milo.next();render();narrateMilo();}
 };
 const file=APPROVED_AUDIO.choices[key];
 // The real recording ending is the gateway. If missing, keep the scene and
 // show a manual recovery control instead of inventing timing or synthetic Maya.
 if(file)playMiloClip(file,complete);
};
const mayaWelcome="Hi! I'm Maya. Would you like to help Milo the dragon on a rainy-day adventure, explore the forest, or travel into space? Tap a story picture to begin.";
const renderForest=()=>{
 const forest=$('forest-scene');forest.hidden=lesson.choice!=='Bears';if(forest.hidden)return;
 const step=lesson.step;
 forest.dataset.scene=lesson.completed?'home':String(step);
 $('forest-character').textContent=step===0?'🐻':step===1?'🐻':'🐻🧣';
 $('forest-object').textContent=step>=2?'🧣':step===1?'🍂':'❓';
 $('forest-bird').textContent=step>=1?'🐦':' '; 
 $('forest-sky').textContent=lesson.completed?'🌈':step>1?'🌤️':'☀️';
 forest.setAttribute('aria-label',lesson.completed?'Pip is home with his blue scarf':step===2?'Pip finds the blue scarf':step===1?'Pip follows clues in the forest':'Pip searches for his lost scarf');
};
const renderMilo=()=>{
 $('forest-scene').hidden=true;
 $('forest-caption').textContent=milo.lastResponse;
 $('story-choices').hidden=true;$('learning-options').hidden=false;$('learning-back').hidden=false;
 $('learning-heading').textContent='Milo the Dragon and the Rainy-Day Surprise';
 $('learning-progress').textContent=milo.finished?'The end!':`Scene ${milo.step+1} of ${MILO_SCENES.length}`;
 const scene=milo.scene;
 $('learning-narration').textContent=scene.line;
 $('milo-visual').hidden=false;
 $('milo-visual').textContent=scene.emoji+(milo.boatItem?' '+(milo.boatItem==='04-flower'?'🌼':'🍁'):'');
 $('milo-visual').setAttribute('aria-label',scene.title+' illustration placeholder');
 $('milo-visual').dataset.scene=String(milo.step+1);
 $('milo-response').hidden=!milo.lastResponse;
 $('milo-response').textContent=milo.lastResponse;
 $('milo-prompt').hidden=milo.finished;
 $('milo-prompt').textContent=scene.prompt;
 $('learning-heading').textContent=scene.title;
 $('learning-progress').textContent='Milo the Dragon and the Rainy-Day Surprise · Scene '+(milo.step+1)+' of 7';
 $('milo-help').textContent='Maya will respond to your choice and continue to the next scene. Talk is always available.';
 $('learning-replay').textContent=milo.finished?'Read story again':'🔊 Hear Maya';
 const host=$('learning-options');host.replaceChildren();
 if(milo.finished){const again=document.createElement('button');again.type='button';again.className='learning-option';again.textContent='Read again';again.onclick=()=>{stopMiloAudio();milo.reset();miloResponding=false;render();narrateMilo();};host.append(again);return;}
 for(const [label,[emoji]] of Object.entries(scene.actions)){
  const button=document.createElement('button');button.type='button';button.className='learning-option';
  const pic=document.createElement('span');pic.textContent=emoji;pic.setAttribute('aria-hidden','true');
  const word=document.createElement('strong');word.textContent=label;button.append(pic,word);
  button.setAttribute('aria-label',label);button.disabled=miloResponding||miloCommunicationPaused;
  button.onclick=()=>chooseMilo(label);host.append(button);
 }
 // Accessibility escape hatch only; never required after making a choice.
 if(!miloResponding&&milo.step<6){
  const skip=document.createElement('button');skip.type='button';skip.className='learning-option milo-continue';skip.textContent='Continue without choosing →';
  skip.onclick=()=>{if(miloCommunicationPaused||lesson.paused)return;stopMiloAudio();milo.next();render();narrateMilo();};
  host.append(skip);
 }
 if(miloResponding){
  const recovery=document.createElement('button');recovery.type='button';recovery.className='learning-option milo-continue';recovery.textContent='Continue if audio is unavailable →';
  recovery.onclick=()=>{if(miloCommunicationPaused||lesson.paused)return;stopMiloAudio();miloResponding=false;if(milo.step===6)milo.finished=true;else milo.next();render();if(!milo.finished)narrateMilo();};host.append(recovery);
 }
};
const renderLearning=()=>{
 document.querySelector('.shell')?.classList.toggle('maya-story-active',miloActive);
 $('milo-visual').hidden=!miloActive;
 $('milo-help').hidden=!miloActive;
 $('milo-response').hidden=true;
 $('milo-prompt').hidden=true;
 if(miloActive){renderMilo();return;}
 renderForest();
 const scenes=lesson.choice?storyScenes[lesson.choice]:null;
 $('story-choices').hidden=!!lesson.choice;
 $('learning-options').hidden=!lesson.choice||lesson.completed;
 $('learning-back').hidden=!lesson.choice;
 $('learning-heading').textContent=!lesson.choice?'What adventure would you like?':lesson.choice==='Bears'?'The Little Forest Bear':'A Rocket Adventure';
 $('learning-progress').textContent=!lesson.choice?'Choose an adventure':lesson.completed?'The end!':`Page ${lesson.step+1} of 3`;
 const scene=lesson.choice&&!lesson.completed?scenes[lesson.step]:null;
 $('learning-narration').textContent=!lesson.choice?mayaWelcome:scene?scene.line:`The end of our ${lesson.choice==='Bears'?'forest':'space'} adventure! Choose another story or play again.`;
 $('forest-caption').textContent=lesson.choice==='Bears'?lesson.lastEvent:'';
 $('learning-replay').textContent=!lesson.choice?'🔊 Hear Maya':lesson.completed?'Play story again':'🔊 Hear story again';
 const options=$('learning-options');options.replaceChildren();
 if(!scene)return;
 for(const [name,emoji] of scene.choices){
  const button=document.createElement('button');button.type='button';button.className='learning-option';
  button.setAttribute('aria-label',name);
  const picture=document.createElement('span');picture.textContent=emoji;picture.setAttribute('aria-hidden','true');
  const word=document.createElement('strong');word.textContent=name;
  button.append(picture,word);
  button.onclick=()=>{
   if(lesson.paused)return;
   const response=scene.responses[name];
   lesson.explore(name);
   lesson.lastEvent=response;
   render();
   const next=lesson.completed?' The end.':(' '+scenes[lesson.step].line);
   const branch=lesson.choice==='Bears'&&lesson.step===2?(lesson.path[0]==='Follow the footprints'?' The footprints helped Pip find the scarf.':' The feather helped Pip find his bird friend.') : '';
   tellStory(response+branch+next);
  };
  options.append(button);
 }
};
$('learning-replay').onclick=()=>{
 if(lesson.paused)return;
 if(miloActive){if(milo.finished){milo.reset();miloResponding=false;render();}miloCommunicationPaused=false;narrateMilo();return;}
 if(lesson.completed){const choice=lesson.choice;lesson.choose(choice);render();}
 tellStory($('learning-narration').textContent);
};
$('learning-back').onclick=()=>{if(lesson.paused)return;stopMiloAudio();miloActive=false;miloResponding=false;miloCommunicationPaused=false;milo.reset();lesson.back();document.querySelectorAll('.story').forEach(x=>x.classList.remove('selected'));$('learning-voice-status').textContent='';render();};
const render=()=>{
 $('pad').classList.toggle('hidden',controller.mode==='closed');
 $('talk').setAttribute('aria-expanded',String(controller.mode!=='closed'));
 $('pin').setAttribute('aria-pressed',String(controller.mode==='always'));
 $('pin').textContent=controller.mode==='always'?'Unpin pad':'Keep open';
 $('phrase').textContent=model.phrase||(controller.communicationMode==='quick'?'Tap any picture to speak':'Choose pictures to make a message');
 $('quick-mode').setAttribute('aria-pressed',String(controller.communicationMode==='quick'));
 $('build-mode').setAttribute('aria-pressed',String(controller.communicationMode==='build'));
 $('message-label').textContent=controller.communicationMode==='quick'?'Last word':'My message';
 $('speak').textContent=controller.communicationMode==='quick'?'🔊 Repeat last word':'🔊 Repeat full message';
 $('close').hidden=controller.mode==='always';
 renderLearning();
 $('lesson-status').textContent=lesson.paused?'Lesson paused while you talk.':miloActive?(milo.finished?'Milo story complete.':'Choose a story picture to continue. Talk is always available.'):lesson.completed?'Story complete! Choose another story or play again.':lesson.choice?'Tap a picture to continue the story, or open Talk anytime.':'You can choose a story, or open Talk anytime.';
};
const perform=async fn=>{if(miloActive){stopMiloAudio();miloCommunicationPaused=true;}try{$('speech-status').textContent='';await fn();}catch(e){$('speech-status').textContent=e.message;}finally{render();}};
function buildIconPicker(host,input){
 host.replaceChildren();
 const groups=document.createElement('div');groups.className='icon-category-tabs';groups.setAttribute('aria-label','Icon categories');
 const choices=document.createElement('div');choices.className='icon-options';choices.setAttribute('aria-label','Choose an icon');
 const selected=document.createElement('div');selected.className='icon-selection';selected.setAttribute('role','status');
 const buttons=[];
 const updatePicker=()=>{
   for(const button of choices.children)button.setAttribute('aria-pressed',String(button.textContent===input.value));
   selected.textContent='Selected icon: '+(input.value||'none');
 };
 const showCategory=name=>{
   for(const btn of buttons)btn.setAttribute('aria-pressed',String(btn.textContent===name));
   choices.replaceChildren();
   for(const symbol of getIcons(name)){
     const btn=document.createElement('button');btn.type='button';btn.className='icon-choice';btn.textContent=symbol;
     btn.setAttribute('aria-label','Choose '+symbol+' icon');
     btn.onclick=()=>{input.value=symbol;updatePicker();};choices.append(btn);
   }
   updatePicker();
 };
 for(const category of ICON_CATEGORIES){
   const btn=document.createElement('button');btn.type='button';btn.className='icon-category';btn.textContent=category.name;
   btn.onclick=()=>showCategory(category.name);buttons.push(btn);groups.append(btn);
 }
 host.append(groups,selected,choices);
 input.addEventListener('input',updatePicker);
 const found=ICON_CATEGORIES.find(c=>c.icons.includes(input.value));
 showCategory(found?.name||'Emotions');
 // Expose reset for adding multiple custom words without rebuilding the editor.
 host.resetSelection=()=>{showCategory('Symbols');updatePicker();};
}
// Caregiver access controls never wrap or disable the communication buttons.
const parentKey='kindred-parent-pin-v1';
let unlocked=false;
let challenge=createChallenge();
const storedPin=()=>{try{return JSON.parse(localStorage.getItem(parentKey)||'null');}catch{return null;}};
const newChallenge=()=>{
 challenge=createChallenge();
 $('forgot-pin').hidden=!storedPin();
 $('recover-panel').hidden=true;
 const hasPin=Boolean(storedPin());
 $('parent-question').textContent=hasPin?'Enter caregiver PIN':`Adult question: ${challenge.a} + ${challenge.b} = ?`;
 $('parent-answer').value='';
 $('parent-answer').setAttribute('autocomplete',hasPin?'current-password':'off');
 $('parent-answer').setAttribute('maxlength',hasPin?'8':'3');
 $('parent-unlock-hint').textContent=hasPin?'Enter your saved 4–8 digit PIN to unlock settings.':'Answer the adult question to unlock caregiver settings.';
};
const setUnlocked=value=>{unlocked=value;$('caregiver-editor').hidden=!value;$('parent-gate').hidden=value;$('parent-lock-label').textContent=value?'🔓 Unlocked':'🔒 Locked';if(!value){renderVocabulary();$('recovery-code-output').textContent='';$('recovery-code-display').hidden=true;newChallenge();}};
newChallenge();
const closeParent=()=>{$('caregiver-panel').hidden=true;document.body.classList.remove('parent-active');setUnlocked(false);$('open-parent-settings').focus();};
$('exit-parent').onclick=closeParent;
const selectParentTab=tab=>{for(const el of document.querySelectorAll('[data-parent-tab]')){const current=el.dataset.parentTab===tab;el.classList.toggle('active',current);el.setAttribute('aria-selected',String(current));}for(const pane of document.querySelectorAll('[data-parent-pane]'))pane.hidden=pane.dataset.parentPane!==tab;};
for(const tab of document.querySelectorAll('[data-parent-tab]'))tab.onclick=()=>{selectParentTab(tab.dataset.parentTab);if(tab.dataset.parentTab==='arrange')renderArrange();};

$('word-search').oninput=()=>{const q=$('word-search').value.trim().toLowerCase();for(const el of $('custom-list').querySelectorAll('.custom-row')){const next=el.nextElementSibling;const hide=!el.textContent.toLowerCase().includes(q);el.hidden=hide;if(next?.classList.contains('edit-word'))next.hidden=hide;}};
$('unlock-parent').onsubmit=async e=>{
 e.preventDefault();
 const answer=$('parent-answer').value.trim(),record=storedPin();
 let okay=false;
 if(record){okay=validPin(answer)&&await pinDigest(answer,record.salt)===record.digest;}
 else okay=verifyChallenge(challenge.a,challenge.b,answer);
 if(okay){$('parent-status').textContent='';setUnlocked(true);renderVocabulary();}else{$('parent-status').textContent=record?'Incorrect PIN. Please try again.':'Try the adult question again.';newChallenge();}
};
$('lock-parent').onclick=()=>setUnlocked(false);
const showRecoveryCode=code=>{$('recovery-code-output').textContent=code;$('recovery-code-display').hidden=false;$('recovery-setup-status').textContent='Save this code in a safe place. Anyone with it and access to this browser can reset the PIN.';};
$('hide-recovery-code').onclick=()=>{$('recovery-code-output').textContent='';$('recovery-code-display').hidden=true;$('recovery-setup-status').textContent='Recovery code hidden. Store your copy safely.';};
$('set-parent-pin').onclick=async()=>{
 const status=$('pin-status');
 if(!unlocked){status.textContent='Unlock Parent Settings first.';return;}
 const pin=$('parent-pin').value.trim();
 if(!validPin(pin)){status.textContent='PIN must contain 4 to 8 numbers only.';return;}
 if(!confirm('Save your PIN and generate a recovery code? Store the code safely.'))return;
 try{
  const {record,code}=await makeRecoveryRecord(pin);
  localStorage.setItem(parentKey,JSON.stringify(record));
  if(storedPin()?.recoveryDigest!==record.recoveryDigest)throw Error('Could not verify saved recovery information.');
  $('parent-pin').value='';
  status.textContent='PIN saved. Store the new recovery code before locking settings.';
  showRecoveryCode(code);newChallenge();
 }catch(e){status.textContent='PIN not saved: '+(e?.message||'storage unavailable');}
};
$('generate-recovery').onclick=async()=>{
 if(!unlocked)return;
 try{
  const old=storedPin();if(!old)throw Error('Set a PIN first.');
  if(!confirm('Create a new recovery code? Any previous recovery code will stop working.'))return;
  const {record,code}=await addRecoveryToExisting(old);
  localStorage.setItem(parentKey,JSON.stringify(record));
  if(storedPin()?.recoveryDigest!==record.recoveryDigest)throw Error('Could not verify saved recovery code.');
  showRecoveryCode(code);
 }catch(e){$('recovery-setup-status').textContent='Recovery code not saved: '+(e?.message||'unknown error');}
};
$('forgot-pin').onclick=()=>{
 $('recover-panel').hidden=false;$('unlock-parent').hidden=true;$('forgot-pin').hidden=true;
 $('recovery-status').textContent=storedPin()?.recoveryDigest?'Enter the recovery code saved when you set up your PIN.':'This PIN has no recovery code yet. A code must be created while Parent Settings is unlocked; this prototype cannot bypass an existing PIN.';
 $('recovery-code-input').focus();
};
$('cancel-recovery').onclick=()=>{$('recovery-result-code').textContent='';$('recovery-result').hidden=true;$('reset-with-recovery').disabled=false;$('unlock-parent').hidden=false;newChallenge();};
$('reset-with-recovery').onclick=async()=>{
 const status=$('recovery-status'),code=$('recovery-code-input').value,pin=$('replacement-pin').value.trim();
 try{
  const result=await resetPinWithRecovery(storedPin(),code,pin);
  localStorage.setItem(parentKey,JSON.stringify(result.record));
  if(storedPin()?.recoveryDigest!==result.record.recoveryDigest)throw Error('Unable to verify saved credentials.');
  $('recovery-code-input').value='';$('replacement-pin').value='';
  $('recovery-result').hidden=false;
  $('recovery-result-code').textContent=result.code;
  status.textContent='PIN reset! Save this NEW recovery code before returning to unlock. The old code no longer works.';
  $('reset-with-recovery').disabled=true;
 }catch(e){status.textContent=(e.message==='Invalid recovery code.'?'Recovery code incorrect. Please try again.':e.message);}
};
$('remove-parent-pin').onclick=()=>{
 if(!unlocked||!storedPin())return;
 if(!confirm('Remove this caregiver PIN? Future access will use an adult question.'))return;
 try{localStorage.removeItem(parentKey);$('pin-status').textContent='Caregiver PIN removed.';$('recovery-code-output').textContent='';$('recovery-code-display').hidden=true;newChallenge();}catch{$('pin-status').textContent='Could not remove PIN.';}
};
buildIconPicker($('add-icon-picker'),$('new-symbol'));

const movePicture=(source,target,after=false)=>{
 if(!unlocked){$('arrange-status').textContent='Unlock Parent Settings to arrange pictures.';return;}
 if(source===target)return;
 const before=model.exportVocabulary();
 try{
  model.moveWord(source,target,after);
  if(!saveVocabulary()){model.importVocabulary(before);$('arrange-status').textContent='Could not save arrangement. Previous order restored.';renderVocabulary();return;}
  $('arrange-status').textContent='Picture order saved on this device.';
  renderVocabulary();
 }catch(error){model.importVocabulary(before);$('arrange-status').textContent=error.message;renderVocabulary();}
};
const renderArrange=()=>{
 const grid=$('arrange-grid');grid.replaceChildren();
 if(!unlocked)return;
 for(let i=0;i<model.words.length;i++){
  const word=model.words[i],tile=document.createElement('div');
  tile.className='arrange-tile symbol'+(['help','stop','break','hurt'].includes(word.id)?' urgent':'');
  tile.dataset.wordId=word.id;tile.setAttribute('aria-label',word.label+', position '+(i+1));
  const pic=document.createElement('div');pic.className='arrange-picture';pic.append(visualFor(word));
  const label=document.createElement('span');label.textContent=word.label;
  const grip=document.createElement('div');grip.className='arrange-grip';grip.textContent='⠿ Drag picture';grip.setAttribute('aria-hidden','true');
  tile.append(pic,label,grip);
  const controls=document.createElement('div');controls.className='arrange-controls';
  for(const [text,other,after] of [['↑',model.words[i-1],false],['↓',model.words[i+1],true]]){
   const btn=document.createElement('button');btn.type='button';btn.className='quiet';btn.textContent=text;
   btn.setAttribute('aria-label',(after?'Move later: ':'Move earlier: ')+word.label);
   btn.disabled=!other;
   btn.onclick=()=>{if(other)movePicture(word.id,other.id,after);};
   controls.append(btn);
  }
  tile.append(controls);
  // Pointer capture prevents tablet scrolling from stealing the drag.
  tile.addEventListener('pointerdown',e=>{
   if(!unlocked||e.button!==0||e.target.closest('button'))return;
   e.preventDefault();
   const id=e.pointerId,originX=e.clientX,originY=e.clientY;
   tile.setPointerCapture(id);
   let hover=null;
   const targetAt=(x,y)=>{
    const el=document.elementFromPoint(x,y)?.closest('.arrange-tile');
    return el&&el!==tile?el:null;
   };
   const cleanup=()=>{
    hover?.classList.remove('arrange-drop');
    tile.classList.remove('arrange-moving');
    tile.removeEventListener('pointermove',moving);
    tile.removeEventListener('pointerup',finish);
    tile.removeEventListener('pointercancel',cancel);
    tile.removeEventListener('lostpointercapture',cancel);
    if(tile.hasPointerCapture(id))tile.releasePointerCapture(id);
   };
   const moving=ev=>{
    if(Math.hypot(ev.clientX-originX,ev.clientY-originY)>8)tile.classList.add('arrange-moving');
    const next=targetAt(ev.clientX,ev.clientY);
    if(next!==hover){hover?.classList.remove('arrange-drop');hover=next;hover?.classList.add('arrange-drop');}
   };
   const finish=ev=>{
    const target=targetAt(ev.clientX,ev.clientY),moved=Math.hypot(ev.clientX-originX,ev.clientY-originY)>12;
    cleanup();
    if(moved&&target)movePicture(word.id,target.dataset.wordId);
   };
   const cancel=()=>cleanup();
   tile.addEventListener('pointermove',moving);
   tile.addEventListener('pointerup',finish);
   tile.addEventListener('pointercancel',cancel);
   tile.addEventListener('lostpointercapture',cancel);
  });
  grid.append(tile);
 }
};
$('finish-arranging').onclick=()=>selectParentTab('words');

const renderVocabulary=()=>{
 $('vocab').replaceChildren();
 for(const word of model.words){const button=document.createElement('button');button.className='symbol'+(['help','stop','break','hurt'].includes(word.id)?' urgent':'');button.type='button';button.setAttribute('aria-label',word.label);const icon=visualFor(word);const label=document.createElement('span');label.textContent=word.label;button.append(icon,label);button.onclick=()=>{controller.selectAndSpeak(word.id).catch(e=>{$('speech-status').textContent=e.message;});render();};$('vocab').append(button);}
 renderArrange();
 $('custom-list').replaceChildren();
 for(const w of model.words){
   const row=document.createElement('div');row.className='custom-row';
   const label=document.createElement('span');label.textContent=w.label+(w.custom?'':' (built-in)')+' ';label.prepend(visualFor(w));
   const edit=document.createElement('button');edit.type='button';edit.className='quiet';edit.textContent='Change word / icon';
   const editor=document.createElement('form');editor.className='edit-word hidden';
   const textLabel=document.createElement('label');textLabel.textContent='Word or phrase';
   const wordInput=document.createElement('input');wordInput.value=w.label;wordInput.maxLength=100;wordInput.required=true;textLabel.append(wordInput);
   const symbolLabel=document.createElement('label');symbolLabel.textContent='Icon (tap a picture below or type an emoji)';
   const symbolInput=document.createElement('input');symbolInput.value=w.emoji;symbolInput.maxLength=16;symbolInput.setAttribute('aria-label','Icon for '+w.label);symbolLabel.append(symbolInput);
   const photoLabel=document.createElement('label');photoLabel.textContent='Personal photo (optional)';const photoInput=document.createElement('input');photoInput.type='file';photoInput.accept='image/png,image/jpeg,image/webp';photoLabel.append(photoInput);
   const useIcon=document.createElement('label');const noPhoto=document.createElement('input');noPhoto.type='checkbox';useIcon.append(noPhoto,document.createTextNode('Remove photo / use emoji instead'));
   const picker=document.createElement('div');picker.className='icon-picker';picker.setAttribute('aria-label','Choose icon for '+w.label);
   buildIconPicker(picker,symbolInput);
   const save=document.createElement('button');save.type='submit';save.className='primary';save.textContent='Save changes';
   const cancel=document.createElement('button');cancel.type='button';cancel.className='quiet';cancel.textContent='Cancel';cancel.onclick=()=>editor.classList.add('hidden');
   editor.append(textLabel,symbolLabel,photoLabel,useIcon,picker,save,cancel);
   edit.onclick=()=>{if(!unlocked){$('parent-status').textContent='Unlock Parent Settings before changing words.';return;}editor.classList.toggle('hidden');if(!editor.classList.contains('hidden'))symbolInput.focus();};
   editor.onsubmit=async e=>{e.preventDefault();if(!unlocked){$('parent-status').textContent='Unlock Parent Settings before changing words.';return;}try{const photo=noPhoto.checked?null:photoInput.files?.length?await compressPhoto(photoInput.files[0]):w.photo??null;model.updateWord(w.id,wordInput.value,symbolInput.value,photo);if(!saveVocabulary())return;$('edit-status').textContent='Saved changes to '+wordInput.value.trim();renderVocabulary();render();}catch(error){$('edit-status').textContent=error.message;}};
   const del=document.createElement('button');del.type='button';del.className='quiet';del.textContent='Remove';del.disabled=['help','stop','break'].includes(w.id);del.title=del.disabled?'This essential communication button cannot be removed':'';del.onclick=()=>{if(!unlocked){$('parent-status').textContent='Unlock Parent Settings before changing words.';return;}if(!confirm('Remove '+w.label+' from the pad?'))return;try{model.removeWord(w.id);}catch(err){$('edit-status').textContent=err.message;return;}saveVocabulary();$('edit-status').textContent='Removed '+w.label;renderVocabulary();render();};
   row.append(label,edit,del);$('custom-list').append(row,editor);
 }
};
$('add-word').onsubmit=async e=>{e.preventDefault();if(!unlocked){$('parent-status').textContent='Unlock Parent Settings before changing words.';return;}try{const photo=await compressPhoto($('new-photo').files?.[0]);const w=model.addCustom($('new-word').value,$('new-symbol').value,photo);saveVocabulary();$('new-word').value='';$('new-symbol').value='💬';$('new-photo').value='';$('add-icon-picker').resetSelection();$('edit-status').textContent='Added '+w.label;renderVocabulary();render();}catch(err){$('edit-status').textContent=err.message;}};
$('restore-builtins').onclick=()=>{if(!unlocked){$('parent-status').textContent='Unlock Parent Settings before changing words.';return;}
 if(!confirm('Restore all original built-in words and pictures? Your added words will stay.'))return;
 model.restoreBuiltins();saveVocabulary();$('edit-status').textContent='Original words restored. Your added words are unchanged.';renderVocabulary();render();
};
renderVocabulary();
$('open-parent-settings').onclick=()=>{$('caregiver-panel').hidden=false;document.body.classList.add('parent-active');selectParentTab('words');$('caregiver-panel').scrollIntoView({block:'start'});if(unlocked)$('word-search').focus();else $('parent-answer').focus();};
$('talk').onclick=()=>{if(miloActive){stopMiloAudio();miloCommunicationPaused=true;}mayaPortrait?.end();if('speechSynthesis' in window)window.speechSynthesis.cancel();if(controller.mode==='closed')controller.open();else if(controller.mode==='slide')controller.close();else controller.open('always');render();};
$('pin').onclick=()=>{if(miloActive){stopMiloAudio();miloCommunicationPaused=true;}mayaPortrait?.end();if('speechSynthesis' in window)window.speechSynthesis.cancel();if(controller.mode==='always')controller.open('slide');else controller.open('always');render();};
$('close').onclick=()=>{controller.close();if(miloActive){miloCommunicationPaused=false;miloResponding=false;}render();};
$('speak').onclick=()=>perform(()=>controller.speak());
$('quick-mode').onclick=()=>{controller.setCommunicationMode('quick');render();};
$('build-mode').onclick=()=>{controller.setCommunicationMode('build');render();};
$('preview-voice').onclick=()=>{
 // Preview may cancel an earlier sample; regular AAC taps never cancel speech.
 if('speechSynthesis' in window)window.speechSynthesis.cancel();
 $('voice-settings-status').textContent='Previewing at pitch '+$('pitch').value+' and speed '+$('rate').value+'. If it sounds unchanged, try an on-device voice; some engines ignore these controls.';
 perform(()=>speaker('Hello! This is my voice. Let us explore together and see how I sound today.'));
};
const voiceStorageKey='kindred-aac-preferred-voice-v1';
const refreshVoices=()=>{
 if(!('speechSynthesis' in window))return;
 const selection=$('voice'),previous=selection.value;
 let stored='';
 try{stored=localStorage.getItem(voiceStorageKey)||'';}catch{}
 selection.replaceChildren(new Option('Device default',''));
 const voices=englishVoices(window.speechSynthesis.getVoices());
 for(const v of voices)selection.add(new Option(voiceLabel(v),v.voiceURI));
 const preferred=[previous,stored].find(value=>value&&voices.some(v=>v.voiceURI===value));
 const chosen=chooseVoice(voices,preferred);
 selection.value=preferred||chosen?.voiceURI||'';
 $('voice-hint').textContent=chosen?(chosen.localService?'Preferred on-device voice: ':'Voice may require internet: ')+chosen.name+'. Preview to confirm speech quality and availability.':'No English voice detected. Install an English device voice in system settings; AAC text remains visible.';
};
$('voice').addEventListener('change',()=>{
 try{localStorage.setItem(voiceStorageKey,$('voice').value);$('voice-settings-status').textContent='Voice preference saved on this device.';}catch{$('voice-settings-status').textContent='Could not save voice selection.';}
});

const tuningKey='kindred-aac-voice-tuning-v1';
try{const saved=JSON.parse(localStorage.getItem(tuningKey)||'null');if(saved){for(const id of ['pitch','rate']){const value=String(saved[id]??'');if([...$(id).options].some(o=>o.value===value))$(id).value=value;}}}catch{}
for(const id of ['pitch','rate'])$(id).addEventListener('change',()=>{
 try{localStorage.setItem(tuningKey,JSON.stringify({pitch:$('pitch').value,rate:$('rate').value}));$('voice-settings-status').textContent='Preferences saved. Pitch '+$('pitch').value+', speed '+$('rate').value+'. Tap Preview to hear a new sample; your browser voice may ignore the adjustment.';}
 catch{$('voice-settings-status').textContent='Could not save voice preferences.';}
});
refreshVoices();if('speechSynthesis' in window)window.speechSynthesis.addEventListener?.('voiceschanged',refreshVoices);
$('undo').onclick=()=>{controller.undo();render();};
$('clear').onclick=()=>{controller.clear();render();};
$('sensory').onclick=()=>{const on=document.body.classList.toggle('calm');$('sensory').setAttribute('aria-pressed',String(on));};
for(const b of document.querySelectorAll('.story'))b.onclick=()=>{if(lesson.paused)return;if(b.dataset.choice==='Milo'){miloActive=true;miloCommunicationPaused=false;miloResponding=false;milo.reset();render();narrateMilo();return;}stopMiloAudio();miloActive=false;lesson.choose(b.dataset.choice);document.querySelectorAll('.story').forEach(x=>x.classList.toggle('selected',x===b));render();tellStory($('learning-narration').textContent);};
render();