/** Forest lesson view: pure UI updates, independent of AAC communication. */
export function renderForestScene(get,{choice,step,completed}){
 const forest=get('forest-scene');
 forest.hidden=choice!=='Bears';
 if(forest.hidden)return;
 forest.dataset.scene=completed?'home':String(step);
 get('forest-character').textContent=step>=2?'🐻🧣':'🐻';
 get('forest-object').textContent=step>=2?'🧣':step===1?'🍂':'❓';
 get('forest-bird').textContent=step>=1?'🐦':' ';
 get('forest-sky').textContent=completed?'🌈':step>1?'🌤️':'☀️';
 forest.setAttribute('aria-label',completed?'Pip is home with his blue scarf':step===2?'Pip finds the blue scarf':step===1?'Pip follows clues in the forest':'Pip searches for his lost scarf');
}
