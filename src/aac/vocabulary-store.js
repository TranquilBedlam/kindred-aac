const CURRENT='kindred-aac-vocabulary-v2';
const LEGACY='kindred-aac-custom-vocabulary-v1';
/** Storage adapter for the AAC model. No DOM access or story dependencies. */
export function createVocabularyStore(storage){
 return {
  read(){try{const serialized=storage.getItem(CURRENT)||storage.getItem(LEGACY);return serialized?JSON.parse(serialized):null;}catch{return null;}},
  write(value){try{storage.setItem(CURRENT,JSON.stringify(value));return true;}catch{return false;}}
 };
}
