export class CommunicationController{
  constructor(model,speechService){this.model=model;this.speechService=speechService;}
  selectSymbol(id){return this.model.select(id);}
  undo(){return this.model.undo();}
  clear(){this.model.clear();}
  async speak(){const phrase=this.model.phrase;return this.speechService.speak(phrase);}
  async speakEssential(id){
    if(!['help','stop','break','no','yes','hurt'].includes(id))throw new Error('Not an essential communication command');
    const symbol=this.model.vocabulary.find(w=>w.id===id);
    return this.speechService.speak(symbol.label);
  }
}