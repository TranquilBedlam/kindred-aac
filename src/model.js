export const WORDS = Object.freeze([
  ['help','🆘','Help'],['stop','✋','Stop'],['break','🌤️','Break'],
  ['yes','✅','Yes'],['no','❌','No'],['hurt','🩹','Hurt'],
  ['want','💬','I want'],['water','💧','Water'],['eat','🍎','Eat'],
  ['play','🧸','Play'],['more','➕','More'],['again','🔁','Again'],
  ['please','🙏','Please'],['thank-you','💜','Thank you'],
  ['like','💜','I like'],['different','🔀','Different'],['bathroom','🚻','Bathroom']
].map(([id,emoji,label])=>Object.freeze({id,emoji,label})));
export class CommunicationModel {
  constructor(words=WORDS){this.base=words.map(w=>({...w}));this.words=this.base.map(w=>({...w}));this.ids=new Set(this.words.map(w=>w.id));this.message=[];this.sequence=0;}
  select(id){if(!this.ids.has(id))throw new Error('Unknown symbol');this.message.push(id);return this.phrase;}
  undo(){this.message.pop();return this.phrase;}
  clear(){this.message=[];}
  get phrase(){return this.message.map(id=>this.words.find(w=>w.id===id)?.label||'').filter(Boolean).join(' ');}
  validate(label,emoji,exclude=null){
    if(typeof label!=='string'||!label.trim()||label.trim().length>100)throw new Error('Enter a word or phrase (1–100 characters).');
    if(typeof emoji!=='string'||emoji.length>16)throw new Error('Invalid symbol.');
    if(this.words.some(w=>w.id!==exclude&&w.label.toLowerCase()===label.trim().toLowerCase()))throw new Error('This word or phrase already exists.');
  }
  validatePhoto(photo){
    if(photo==null)return null;
    if(typeof photo!=='string'||photo.length>140000||!/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(photo))throw new Error('Invalid or oversized photo.');
    return photo;
  }
  addCustom(label,emoji='💬',photo=null){
    this.validate(label,emoji);photo=this.validatePhoto(photo);this.sequence++;const entry={id:'custom-'+this.sequence,label:label.trim(),emoji:emoji||'💬',photo,custom:true};
    this.words.push(entry);this.ids.add(entry.id);return {...entry};
  }
  updateCustom(id,label,emoji='💬',photo=null){
    const item=this.words.find(w=>w.id===id);if(!item?.custom)throw new Error('Built-in words cannot be edited.');
    this.validate(label,emoji,id);photo=this.validatePhoto(photo);item.label=label.trim();item.emoji=emoji||'💬';item.photo=photo;return {...item};
  }
  removeCustom(id){const item=this.words.find(w=>w.id===id);if(!item?.custom)throw new Error('Built-in words cannot be removed.');this.words=this.words.filter(w=>w.id!==id);this.ids.delete(id);this.message=this.message.filter(x=>x!==id);}
  updateWord(id,label,emoji='💬',photo=null){
    const item=this.words.find(w=>w.id===id);if(!item)throw new Error('Unknown symbol');
    this.validate(label,emoji,id);photo=this.validatePhoto(photo);
    item.label=label.trim();item.emoji=emoji||'💬';item.photo=photo;return {...item};
  }
  removeWord(id){
    if(['help','stop','break'].includes(id))throw new Error('Help, Stop and Break stay available for safety. You can change their names or pictures.');
    const item=this.words.find(w=>w.id===id);if(!item)throw new Error('Unknown symbol');
    this.words=this.words.filter(w=>w.id!==id);this.ids.delete(id);this.message=this.message.filter(x=>x!==id);
  }
  moveWord(id,targetId,after=false){
    const from=this.words.findIndex(w=>w.id===id),to=this.words.findIndex(w=>w.id===targetId);
    if(from<0||to<0)throw new Error('Unknown symbol');
    if(from===to)return false;
    const [word]=this.words.splice(from,1);
    const destination=this.words.findIndex(w=>w.id===targetId);
    this.words.splice(destination+(after?1:0),0,word);
    return true;
  }
  restoreBuiltins(){
    const custom=this.words.filter(w=>w.custom);
    this.words=[...this.base.map(w=>({...w})),...custom];
    this.ids=new Set(this.words.map(w=>w.id));
    this.message=this.message.filter(id=>this.ids.has(id));
  }
  exportVocabulary(){
    const builtins={};
    for(const base of this.base){
      const current=this.words.find(w=>w.id===base.id);
      if(!current){builtins[base.id]=null;continue;}
      if(current.label!==base.label||current.emoji!==base.emoji||(current.photo??null)!==null)
        builtins[base.id]={label:current.label,emoji:current.emoji,photo:current.photo??null};
    }
    return {version:2,builtins,custom:this.exportCustom(),order:this.words.map(w=>w.id)};
  }
  importVocabulary(data){
    if(Array.isArray(data)){this.importCustom(data);return;}
    if(!data||data.version!==2||!Array.isArray(data.custom)||!data.builtins||typeof data.builtins!=='object'||Array.isArray(data.builtins))
      throw new Error('Invalid saved vocabulary.');
    const fresh=new CommunicationModel(this.base);fresh.importCustom(data.custom);
    for(const [id,override] of Object.entries(data.builtins)){
      if(!this.base.some(w=>w.id===id))throw new Error('Invalid built-in word ID.');
      if(override===null){fresh.removeWord(id);continue;}
      if(!override||typeof override!=='object')throw new Error('Invalid built-in word.');
      fresh.updateWord(id,override.label,override.emoji,override.photo??null);
    }
    if(data.order!==undefined){
      if(!Array.isArray(data.order)||data.order.length!==fresh.words.length||
        new Set(data.order).size!==data.order.length||
        data.order.some(id=>typeof id!=='string'||!fresh.ids.has(id)))
        throw new Error('Invalid saved word order.');
      const lookup=new Map(fresh.words.map(w=>[w.id,w]));
      fresh.words=data.order.map(id=>lookup.get(id));
    }
    this.words=fresh.words;this.ids=fresh.ids;this.sequence=fresh.sequence;
    this.message=this.message.filter(id=>this.ids.has(id));
  }
  exportCustom(){return this.words.filter(w=>w.custom).map(w=>({...w}));}
  importCustom(data){
    if(!Array.isArray(data)||data.length>150)throw new Error('Invalid saved vocabulary.');
    const fresh=new CommunicationModel(this.base);
    const seen=new Set();
    for(const item of data){
      if(!item||typeof item.id!=='string'||!/^custom-[1-9][0-9]*$/.test(item.id)||seen.has(item.id)||fresh.ids.has(item.id))throw new Error('Invalid or reserved saved vocabulary ID.');
      fresh.validate(item.label,item.emoji);const photo=fresh.validatePhoto(item.photo??null);seen.add(item.id);
      fresh.words.push({id:item.id,label:item.label.trim(),emoji:item.emoji||'💬',photo,custom:true});fresh.ids.add(item.id);
      fresh.sequence=Math.max(fresh.sequence,Number(item.id.slice(7)));
    }
    this.words=fresh.words;this.ids=fresh.ids;this.sequence=fresh.sequence;this.message=this.message.filter(id=>this.ids.has(id));
  }
}
export class LessonModel {
  constructor(){this.activity='story';this.choice=null;this.discovery=null;this.step=0;this.completed=false;this.paused=false;}
  choose(choice){ if(!['Bears','Space'].includes(choice))throw new Error('Invalid choice');this.choice=choice;this.discovery=null;this.step=0;this.completed=false;}
  explore(item){const options=this.choice==='Bears'?['Bear','Trees']:this.choice==='Space'?['Rocket','Moon']:[];if(!options.includes(item))throw new Error('Choose a story picture first');this.discovery=item;this.step=Math.min(3,this.step+1);this.completed=this.step===3;}
  back(){this.choice=null;this.discovery=null;this.step=0;this.completed=false;}
  pause(){this.paused=true;}
  resume(){this.paused=false;}
}
export class PadController {
  constructor(model,lesson,speaker){this.model=model;this.lesson=lesson;this.speaker=speaker;this.mode='closed';this.communicationMode='quick';}
  open(mode='slide'){if(!['slide','always'].includes(mode))throw new Error('Invalid pad mode');this.mode=mode;if(mode==='slide')this.lesson.pause();else this.lesson.resume();}
  close(){this.mode='closed';this.lesson.resume();}
  setCommunicationMode(mode){if(!['quick','build'].includes(mode))throw new Error('Invalid communication mode');if(this.communicationMode!==mode){this.model.clear();this.communicationMode=mode;}}
  select(id){return this.model.select(id);}
  async selectAndSpeak(id){const word=this.model.words.find(w=>w.id===id);if(!word)throw new Error('Unknown symbol');if(this.communicationMode==='quick')this.model.clear();this.model.select(id);await this.speaker(word.label);return this.model.phrase;}
  undo(){return this.model.undo();}
  clear(){this.model.clear();}
  async speak(){const phrase=this.model.phrase;if(!phrase)return false;await this.speaker(phrase);return true;}
  async urgent(id){if(!['help','stop','break','hurt','no','yes'].includes(id))throw new Error('Not an urgent word');const label=this.model.words.find(w=>w.id===id)?.label;if(!label)throw new Error('Unavailable urgent word');await this.speaker(label);return true;}
}