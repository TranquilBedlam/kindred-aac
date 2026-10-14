export function createMiloView({get:$,create,onChoose,onReplay,onSkip,onRecover}){
 return {render({scene,step,finished,lastResponse,boatItem,responding,communicationPaused}){
 $('forest-scene').hidden=true;
 $('forest-caption').textContent=lastResponse;
 $('story-choices').hidden=true;$('learning-options').hidden=false;$('learning-back').hidden=false;
 $('learning-heading').textContent='Milo the Dragon and the Rainy-Day Surprise';
 $('learning-progress').textContent=finished?'The end!':`Scene ${step+1} of 7`;
 $('learning-narration').textContent=scene.line;
 $('milo-visual').hidden=false;
 $('milo-visual').textContent=scene.emoji+(boatItem?' '+(boatItem==='04-flower'?'🌼':'🍁'):'');
 $('milo-visual').setAttribute('aria-label',scene.title+' illustration placeholder');
 $('milo-visual').dataset.scene=String(step+1);
 $('milo-response').hidden=!lastResponse;
 $('milo-response').textContent=lastResponse;
 $('milo-prompt').hidden=finished;
 $('milo-prompt').textContent=scene.prompt;
 $('learning-heading').textContent=scene.title;
 $('learning-progress').textContent='Milo the Dragon and the Rainy-Day Surprise · Scene '+(step+1)+' of 7';
 $('milo-help').textContent='Maya will respond to your choice and continue to the next scene. Talk is always available.';
 $('learning-replay').textContent=finished?'Read story again':'🔊 Hear Maya';
 const host=$('learning-options');host.replaceChildren();
 if(finished){const again=create('button');again.type='button';again.className='learning-option';again.textContent='Read again';again.onclick=()=>onReplay();host.append(again);return;}
 for(const [label,[emoji]] of Object.entries(scene.actions)){
  const button=create('button');button.type='button';button.className='learning-option';
  const pic=create('span');pic.textContent=emoji;pic.setAttribute('aria-hidden','true');
  const word=create('strong');word.textContent=label;button.append(pic,word);
  button.setAttribute('aria-label',label);button.disabled=responding||communicationPaused;
  button.onclick=()=>onChoose(label);host.append(button);
 }
 // Accessibility escape hatch only; never required after making a choice.
 if(!responding&&step<6){
  const skip=create('button');skip.type='button';skip.className='learning-option milo-continue';skip.textContent='Continue without choosing →';
  skip.onclick=()=>onSkip();
  host.append(skip);
 }
 if(responding){
  const recovery=create('button');recovery.type='button';recovery.className='learning-option milo-continue';recovery.textContent='Continue if audio is unavailable →';
  recovery.onclick=()=>onRecover();host.append(recovery);
 }
 }};
}
