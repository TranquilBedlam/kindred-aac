// Maya's layered portrait adapter. Animation remains optional and never gates AAC.
export class TalkingPortrait {
 static async create(host,folder){
  const response=await fetch(folder+'/layers.json');
  if(!response.ok)throw Error('Maya artwork unavailable');
  const data=await response.json();
  return new TalkingPortrait(host,folder,data);
 }
 constructor(host,folder,data){
  this.host=host;this.layers={};this.mouth='closed';
  host.replaceChildren();host.classList.add('tp');
  const stage=document.createElement('div');stage.className='tp-stage';host.append(stage);
  const make=(name,box)=>{
   const image=document.createElement('img');image.src=folder+'/'+name+'.webp';
   image.alt='';image.draggable=false;image.decoding='async';
   const pct=n=>((n/data.size)*100)+'%';
   Object.assign(image.style,{left:pct(box.x),top:pct(box.y),width:pct(box.w),height:pct(box.h)});
   stage.append(image);return image;
  };
  make('base',{x:0,y:0,w:data.size,h:data.size});
  for(const [name,box] of Object.entries(data.layers)){
   this.layers[name]=make(name,box);this.layers[name].style.opacity='0';
  }
  this.closed=false;this.blinkTimer=setInterval(()=>this.blink(),3600);
 }
 blink(){
  if(this.closed)return;
  const eyes=this.layers.eyes_closed;if(!eyes)return;
  eyes.style.opacity='1';setTimeout(()=>{if(!this.closed)eyes.style.opacity='0';},140);
 }
 setMouth(shape){
  if(this.closed)return;
  for(const key of ['ah','half','oh']){
   const el=this.layers['mouth_'+key];if(el)el.style.opacity=shape===key?'1':'0';
  }
 }
 begin(){
  this.stopMotion();
  this.host.classList.add('tp-talking');
  // Gentle fallback when the browser does not report spoken word boundaries.
  const frames=['half','ah','half','closed'];
  let i=0;this.mouthTimer=setInterval(()=>this.setMouth(frames[i++%frames.length]),185);
 }
 word(spoken){
  // Word boundaries are browser-dependent, not phoneme timestamps.
  // Approximate a suitable mouth shape without pretending exact lip sync.
  if(this.closed||!this.mouthTimer)return;
  const word=String(spoken||'').trim().toLowerCase();
  this.setMouth(/[ou]/.test(word)?'oh':/[aei]/.test(word)?'ah':'half');
 }
 end(){this.stopMotion();this.setMouth('closed');}
 stopMotion(){clearInterval(this.mouthTimer);this.mouthTimer=null;this.host.classList.remove('tp-talking');}
 destroy(){this.closed=true;this.stopMotion();clearInterval(this.blinkTimer);this.host.replaceChildren();}
}
