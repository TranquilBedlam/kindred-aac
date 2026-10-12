import {validPin,verifyChallenge,createChallenge,pinDigest} from './parent.js';
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
const newChallenge=()=>{challenge=createChallenge();$('parent-question').textContent=`Adult question: ${challenge.a} + ${challenge.b} = ?`;$('parent-answer').value='';};
const setUnlocked=value=>{unlocked=value;$('caregiver-editor').hidden=!value;$('parent-gate').hidden=value;if(!value)newChallenge();};
newChallenge();
$('caregiver-panel').addEventListener('toggle',()=>{if(!$('caregiver-panel').open)setUnlocked(false);});
$('unlock-parent').onsubmit=async e=>{
 e.preventDefault();
 const answer=$('parent-answer').value.trim(),record=storedPin();
 let okay=false;
 if(record){okay=validPin(answer)&&await pinDigest(answer,record.salt)===record.digest;}
 else okay=verifyChallenge(challenge.a,challenge.b,answer);
 if(okay){$('parent-status').textContent='';setUnlocked(true);}else{$('parent-status').textContent=record?'Incorrect PIN. Please try again.':'Try the adult question again.';newChallenge();}
};
$('lock-parent').onclick=()=>setUnlocked(false);
$('set-parent-pin').onclick=async()=>{
 if(!unlocked)return;
 const pin=$('parent-pin').value;
 if(!validPin(pin)){$('edit-status').textContent='Use 4 to 8 digits for the PIN.';return;}
 if(!confirm('Set this device’s caregiver PIN? Remember it: losing it may require clearing local data.'))return;
 const salt=[...crypto.getRandomValues(new Uint8Array(16))].map(x=>x.toString(16).padStart(2,'0')).join('');
 try{localStorage.setItem(parentKey,JSON.stringify({salt,digest:await pinDigest(pin,salt)}));$('edit-status').textContent='Caregiver PIN saved on this browser.';$('parent-pin').value='';}
 catch{$('edit-status').textContent='Could not save PIN on this device.';}
};
$('remove-parent-pin').onclick=()=>{
 if(!unlocked||!storedPin())return;
 if(!confirm('Remove this caregiver PIN? Future access will use an adult question.'))return;
 try{localStorage.removeItem(parentKey);$('edit-status').textContent='Caregiver PIN removed.';}catch{$('edit-status').textContent='Could not remove PIN.';}
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
   edit.onclick=()=>{editor.classList.toggle('hidden');if(!editor.classList.contains('hidden'))symbolInput.focus();};
   editor.onsubmit=async e=>{e.preventDefault();try{const photo=noPhoto.checked?null:photoInput.files?.length?await compressPhoto(photoInput.files[0]):w.photo??null;model.updateWord(w.id,wordInput.value,symbolInput.value,photo);if(!saveVocabulary())return;$('edit-status').textContent='Saved changes to '+wordInput.value.trim();renderVocabulary();render();}catch(error){$('edit-status').textContent=error.message;}};
   const del=document.createElement('button');del.type='button';del.className='quiet';del.textContent='Remove';del.disabled=['help','stop','break'].includes(w.id);del.title=del.disabled?'This essential communication button cannot be removed':'';del.onclick=()=>{if(!confirm('Remove '+w.label+' from the pad?'))return;try{model.removeWord(w.id);}catch(err){$('edit-status').textContent=err.message;return;}saveVocabulary();$('edit-status').textContent='Removed '+w.label;renderVocabulary();render();};
   row.append(label,edit,del);$('custom-list').append(row,editor);
 }
};
$('add-word').onsubmit=async e=>{e.preventDefault();try{const photo=await compressPhoto($('new-photo').files?.[0]);const w=model.addCustom($('new-word').value,$('new-symbol').value,photo);saveVocabulary();$('new-word').value='';$('new-symbol').value='💬';$('new-photo').value='';$('add-icon-picker').resetSelection();$('edit-status').textContent='Added '+w.label;renderVocabulary();render();}catch(err){$('edit-status').textContent=err.message;}};
$('restore-builtins').onclick=()=>{
 if(!confirm('Restore all original built-in words and pictures? Your added words will stay.'))return;
 model.restoreBuiltins();saveVocabulary();$('edit-status').textContent='Original words restored. Your added words are unchanged.';renderVocabulary();render();
};
renderVocabulary();
$('open-parent-settings').onclick=()=>{
 // Caregiver controls are nested in the pad; make both containers visible.
 if(controller.mode==='closed'){controller.open();render();}
 const panel=$('caregiver-panel');panel.open=true;
 panel.scrollIntoView({behavior:'auto',block:'start'});
 if($('parent-gate').hidden){$('lock-parent').focus();}else{$('parent-answer').focus();}
};
$('talk').onclick=()=>{if(controller.mode==='closed')controller.open();else if(controller.mode==='slide')controller.close();else controller.open('always');render();};
$('pin').onclick=()=>{if(controller.mode==='always')controller.open('slide');else controller.open('always');render();};
$('close').onclick=()=>{controller.close();render();};
$('speak').onclick=()=>perform(()=>controller.speak());
$('quick-mode').onclick=()=>{controller.setCommunicationMode('quick');render();};
$('build-mode').onclick=()=>{controller.setCommunicationMode('build');render();};
$('preview-voice').onclick=()=>perform(()=>speaker('Hello! This is my voice.'));
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
 try{localStorage.setItem(voiceStorageKey,$('voice').value);}catch{}
});

refreshVoices();if('speechSynthesis' in window)window.speechSynthesis.addEventListener?.('voiceschanged',refreshVoices);
$('undo').onclick=()=>{controller.undo();render();};
$('clear').onclick=()=>{controller.clear();render();};
$('sensory').onclick=()=>{const on=document.body.classList.toggle('calm');$('sensory').setAttribute('aria-pressed',String(on));};
for(const b of document.querySelectorAll('.story'))b.onclick=()=>{if(lesson.paused)return;lesson.choose(b.dataset.choice);document.querySelectorAll('.story').forEach(x=>x.classList.toggle('selected',x===b));render();};
render();