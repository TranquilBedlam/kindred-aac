import {validPin,verifyChallenge,createChallenge,pinDigest} from './parent.js';
import {makeRecoveryRecord,addRecoveryToExisting,resetPinWithRecovery} from './recovery.js';
import {WORDS,CommunicationModel,LessonModel,PadController} from './model.js';
import {ICON_CATEGORIES,getIcons} from './iconCatalog.js';
const $=id=>document.getElementById(id);
const model=new CommunicationModel(),lesson=new LessonModel();
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
  const chosen=voices.find(v=>v.voiceURI===$('voice').value);
  if(chosen)msg.voice=chosen;else{const english=voices.find(v=>v.lang==='en-US')||voices.find(v=>v.lang?.startsWith('en'));if(english)msg.voice=english;}
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
 $('lesson-status').textContent=lesson.paused?'Lesson paused while you talk.':lesson.choice?`You chose ${lesson.choice}. You can still use Talk anytime.`:'You can choose a story, or open Talk anytime.';
};
const perform=async fn=>{try{$('speech-status').textContent='';await fn();}catch(e){$('speech-status').textContent=e.message;}finally{render();}};
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
for(const tab of document.querySelectorAll('[data-parent-tab]'))tab.onclick=()=>selectParentTab(tab.dataset.parentTab);

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
const renderVocabulary=()=>{
 $('vocab').replaceChildren();
 for(const word of model.words){const button=document.createElement('button');button.className='symbol'+(['help','stop','break','hurt'].includes(word.id)?' urgent':'');button.type='button';button.setAttribute('aria-label',word.label);const icon=visualFor(word);const label=document.createElement('span');label.textContent=word.label;button.append(icon,label);button.onclick=()=>{controller.selectAndSpeak(word.id).catch(e=>{$('speech-status').textContent=e.message;});render();};$('vocab').append(button);}
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
   const move=(id,targetId,after=false)=>{
     if(!unlocked){$('edit-status').textContent='Unlock Parent Settings to move words.';return;}
     if(id===targetId)return;
     const backup=model.exportVocabulary();
     try{
       model.moveWord(id,targetId,after);
       if(!saveVocabulary()){model.importVocabulary(backup);renderVocabulary();return;}
       $('edit-status').textContent='Moved word. New order saved to this device.';
       renderVocabulary();
     }catch(err){model.importVocabulary(backup);$('edit-status').textContent=err.message;}
   };
   const index=model.words.findIndex(item=>item.id===w.id);
   const previous=model.words[index-1],next=model.words[index+1];
   const up=document.createElement('button');up.type='button';up.className='quiet move-word';up.textContent='↑';up.title='Move '+w.label+' up';up.setAttribute('aria-label',up.title);up.disabled=!previous;
   up.onclick=()=>{if(previous)move(w.id,previous.id);};
   const down=document.createElement('button');down.type='button';down.className='quiet move-word';down.textContent='↓';down.title='Move '+w.label+' down';down.setAttribute('aria-label',down.title);down.disabled=!next;
   down.onclick=()=>{if(next)move(w.id,next.id,true);};
   row.dataset.wordId=w.id;row.setAttribute('aria-label',w.label+', position '+(index+1)+' of '+model.words.length);
   const grip=document.createElement('span');grip.className='drag-handle';grip.textContent='⠿';grip.title='Drag to move '+w.label;grip.setAttribute('aria-hidden','true');
   // Use pointer events rather than HTML5 drag/drop: works on mouse and touch.
   grip.addEventListener('pointerdown',start=>{
     if(!unlocked||start.button!==0)return;
     start.preventDefault();
     const originX=start.clientX,originY=start.clientY;
     let lastTarget=null;
     const findTarget=e=>document.elementFromPoint(e.clientX,e.clientY)?.closest('.custom-row');
     const clear=()=>{
       document.removeEventListener('pointermove',moving);
       document.removeEventListener('pointerup',finish);
       document.removeEventListener('pointercancel',cancel);
       document.querySelectorAll('.drop-target').forEach(el=>el.classList.remove('drop-target'));
     };
     const moving=e=>{
       if(!unlocked)return;
       const candidate=findTarget(e);
       if(lastTarget!==candidate){lastTarget?.classList.remove('drop-target');lastTarget=candidate;}
       if(lastTarget?.dataset.wordId!==w.id)lastTarget?.classList.add('drop-target');
     };
     const finish=e=>{
       const target=findTarget(e),distance=Math.hypot(e.clientX-originX,e.clientY-originY);
       clear();
       if(unlocked&&distance>=12&&target?.dataset.wordId&&target.dataset.wordId!==w.id)move(w.id,target.dataset.wordId);
     };
     const cancel=()=>clear();
     document.addEventListener('pointermove',moving);
     document.addEventListener('pointerup',finish);
     document.addEventListener('pointercancel',cancel);
   });
   row.addEventListener('dragover',e=>{if(!unlocked)return;e.preventDefault();e.dataTransfer.dropEffect='move';row.classList.add('drop-target');});
   row.addEventListener('dragleave',()=>row.classList.remove('drop-target'));
   row.addEventListener('dragend',()=>document.querySelectorAll('.drop-target').forEach(el=>el.classList.remove('drop-target')));
   row.addEventListener('drop',e=>{e.preventDefault();row.classList.remove('drop-target');if(!unlocked)return;const dragged=e.dataTransfer.getData('text/plain');if(!model.ids.has(dragged))return;move(dragged,w.id);});
   row.append(grip,label,up,down,edit,del);$('custom-list').append(row,editor);
 }
};
$('add-word').onsubmit=async e=>{e.preventDefault();if(!unlocked){$('parent-status').textContent='Unlock Parent Settings before changing words.';return;}try{const photo=await compressPhoto($('new-photo').files?.[0]);const w=model.addCustom($('new-word').value,$('new-symbol').value,photo);saveVocabulary();$('new-word').value='';$('new-symbol').value='💬';$('new-photo').value='';$('add-icon-picker').resetSelection();$('edit-status').textContent='Added '+w.label;renderVocabulary();render();}catch(err){$('edit-status').textContent=err.message;}};
$('restore-builtins').onclick=()=>{if(!unlocked){$('parent-status').textContent='Unlock Parent Settings before changing words.';return;}
 if(!confirm('Restore all original built-in words and pictures? Your added words will stay.'))return;
 model.restoreBuiltins();saveVocabulary();$('edit-status').textContent='Original words restored. Your added words are unchanged.';renderVocabulary();render();
};
renderVocabulary();
$('open-parent-settings').onclick=()=>{$('caregiver-panel').hidden=false;document.body.classList.add('parent-active');selectParentTab('words');$('caregiver-panel').scrollIntoView({block:'start'});if(unlocked)$('word-search').focus();else $('parent-answer').focus();};
$('talk').onclick=()=>{if(controller.mode==='closed')controller.open();else if(controller.mode==='slide')controller.close();else controller.open('always');render();};
$('pin').onclick=()=>{if(controller.mode==='always')controller.open('slide');else controller.open('always');render();};
$('close').onclick=()=>{controller.close();render();};
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
 const voices=window.speechSynthesis.getVoices().filter(v=>v.lang?.toLowerCase().startsWith('en'));
 for(const v of voices){
  const google=/google us english/i.test(v.name)&&v.lang?.toLowerCase().startsWith('en-us');
  selection.add(new Option((google?'★ ':'')+v.name+(v.localService?' (on-device)':' (may need internet)'),v.voiceURI));
 }
 const preferred=[previous,stored].find(value=>value&&voices.some(v=>v.voiceURI===value));
 const google=voices.find(v=>/google us english/i.test(v.name)&&v.lang?.toLowerCase().startsWith('en-us'));
 selection.value=preferred||(google?.voiceURI||'');
 $('voice-hint').textContent=google?'Google US English is available. Preview it to hear whether it suits your child. This is not a verified boy voice.':'Google US English is not offered by this browser. Choose another voice and use Hear voice to preview it.';
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
for(const b of document.querySelectorAll('.story'))b.onclick=()=>{if(lesson.paused)return;lesson.choose(b.dataset.choice);document.querySelectorAll('.story').forEach(x=>x.classList.toggle('selected',x===b));render();};
render();