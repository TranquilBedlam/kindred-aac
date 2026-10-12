export const CORE_WORDS = Object.freeze([
  {id:'help',label:'Help',category:'support'}, {id:'stop',label:'Stop',category:'support'},
  {id:'break',label:'Break',category:'support'}, {id:'no',label:'No',category:'response'},
  {id:'yes',label:'Yes',category:'response'}, {id:'hurt',label:'Hurt',category:'support'},
  {id:'more',label:'More',category:'request'}, {id:'different',label:'Different',category:'response'},
  {id:'play',label:'Play',category:'activity'}, {id:'water',label:'Water',category:'request'},
  {id:'like',label:'Like',category:'comment'}, {id:'dont-like',label:"Don't like",category:'comment'}
]);
export const ESSENTIAL_IDS = Object.freeze(['help','stop','break','no','yes','hurt']);
export function validateVocabulary(words) {
  if(!Array.isArray(words)||!words.length) throw new Error('Vocabulary must be nonempty');
  const ids=new Set();
  for(const w of words){
    if(!w||typeof w.id!=='string'||!/^[a-z0-9-]+$/.test(w.id)||typeof w.label!=='string'||!w.label.trim())throw new Error('Invalid vocabulary item');
    if(ids.has(w.id))throw new Error(`Duplicate vocabulary id: ${w.id}`);
    ids.add(w.id);
  }
  for(const id of ESSENTIAL_IDS)if(!ids.has(id))throw new Error(`Cannot remove essential communication: ${id}`);
  return words.map(w=>({...w}));
}