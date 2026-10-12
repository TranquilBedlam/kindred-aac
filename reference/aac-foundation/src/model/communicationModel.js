import {CORE_WORDS,validateVocabulary} from './vocabulary.js';
export class CommunicationModel{
  #vocabulary;#message=[];#revision=0;
  constructor(words=CORE_WORDS){this.#vocabulary=validateVocabulary(words);}
  get vocabulary(){return this.#vocabulary.map(w=>({...w}));}
  get message(){return [...this.#message];}
  get phrase(){return this.#message.map(id=>this.#vocabulary.find(w=>w.id===id)?.label).join(' ');}
  get revision(){return this.#revision;}
  select(id){if(!this.#vocabulary.some(w=>w.id===id))throw new Error('Unknown symbol');this.#message.push(id);this.#revision++;return this.phrase;}
  undo(){if(this.#message.length)this.#message.pop();this.#revision++;return this.phrase;}
  clear(){this.#message=[];this.#revision++;}
  replaceVocabulary(words){
    const valid=validateVocabulary(words);
    for(const id of this.#message)if(!valid.some(w=>w.id===id))throw new Error('Cannot remove a symbol from the current message');
    this.#vocabulary=valid;this.#revision++;
  }
}