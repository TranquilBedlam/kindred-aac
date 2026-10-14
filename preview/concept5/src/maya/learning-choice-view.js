/** Small MVC view for optional learning activities. AAC remains separate. */
export function renderLearningChoices({host,scene,create,onChoose}){
 host.replaceChildren();
 if(!scene)return;
 for(const [name,emoji] of scene.choices){
  const button=create('button');button.type='button';button.className='learning-option';
  button.setAttribute('aria-label',name);
  const picture=create('span');picture.textContent=emoji;picture.setAttribute('aria-hidden','true');
  const word=create('strong');word.textContent=name;
  button.append(picture,word);
  button.onclick=()=>onChoose(name);
  host.append(button);
 }
}
