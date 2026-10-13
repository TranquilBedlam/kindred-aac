// Child-directed story action controls are separate from general AAC messages.
// Never inspect or reinterpret arbitrary AAC communication as a story command.
export const MILO_SCENES=[
 {title:'The Picnic Disaster',emoji:'🏡🌧️🐉',line:"Milo packed three strawberry sandwiches, a shiny apple, and his yellow blanket. PITTER! PATTER! SPLASH! Rain covered the window. Milo folded his arms and puffed out his cheeks. 'Hmph! Even my sandwiches are disappointed!' Pipkin, his best friend, knocked on the door.",prompt:'Milo is disappointed. Tap a picture to tell him something, or choose Continue to just listen.',actions:{"Oh no!":["🌧️","Milo: I know! It's raining on my picnic!"],"I'm here":["💜","Milo: Thanks for being here with me."],"Want a hug?":["🤗","Pipkin: A hug sounds nice. Milo smiles a little."],"Look, Pipkin!":["🐸","Milo: It's Pipkin! My best friend came to visit!"]}},
 {title:'A Best Friend at the Door',emoji:'🐸🍃🐉',line:"Pipkin arrived holding a leaf like an umbrella. 'Special delivery! One wet frog and one big hello!' Milo sighed, 'My picnic is RUINED.' Pipkin said, 'That sounds disappointing. Want some company?' 'Fine,' said Milo. 'But I'm keeping my pout.'",prompt:'Help the friends decide. Tap Stay inside or Look outside, or choose Continue.',actions:{"Stay inside":["🏡","Milo wraps his yellow blanket around his shoulders. Pipkin sits beside him at the window."],"Look outside":["🌧️","Milo puts on boots and Pipkin joins him beneath the covered porch."]}},
 {title:'The Puddle Mirror',emoji:'🐉💦🐸',line:"The rain softened. Milo and Pipkin watched a shiny puddle from the porch. Milo saw an upside-down dragon! He stuck out his tongue. The puddle dragon did too. PLIP! A raindrop landed on his nose, and Milo giggled.",prompt:'Look at the puddle! Tap a picture to tell Milo what you see or what to try.',actions:{Funny:["😄","Milo: Even my nose thinks so!"],Wet:["💧","Milo: Very wet! Luckily, I have my boots!"],"Make ripples":["💦","Milo taps the puddle with one claw. Pipkin taps too, and the ripples meet."],"Find reflections":["🪞","Pipkin points to their silly upside-down faces in the water."]}},
 {title:'The Little Yellow Boat',emoji:'🍃⛵🐉',line:"A yellow leaf floated past Milo. 'A tiny boat!' Pipkin exclaimed. Milo folded a clean sheet of paper from his picnic notebook. Fold. Fold. TUCK! 'Behold! The magnificent Puddle Explorer!' he declared.",prompt:'Help decorate the boat! Tap Flower or Leaf. Your choice will travel with the boat.',actions:{Flower:["🌼","Milo places a fallen daisy in the boat. Pipkin calls it Captain Daisy."],Leaf:["🍁","Milo adds a red leaf flag. Pipkin salutes the Puddle Explorer."]}},
 {title:'The Puddle Express',emoji:'⛵💦🐸',line:"Milo lowered the paper boat into the puddle. It wobbled and tipped, then floated! 'All aboard the Puddle Express!' Pipkin cheered. The boat is ready for you to steer.",prompt:'You are the boat captain! Tap Go to move, Stop to pause, Slow to glide, or Again to repeat.',actions:{Go:["▶️","Pipkin: Here we go! The boat sails forward."],Stop:["⏸️","Milo: Anchors down! The boat stops."],Slow:["🐢","Pipkin: Nice and easy. The boat glides slowly."],Again:["🔁","The last boat movement happens again."]}},
 {title:'A Different Kind of Picnic',emoji:'🧺🐉🐸',line:"They brought the basket beneath the porch. Milo spread his yellow blanket. Pipkin shared cucumber slices. Milo said, 'This wasn't the picnic I planned. I was pretty sad. But I liked making a boat with you.' 'Me too,' said Pipkin.",prompt:'Tell the friends what you liked, or choose Continue to keep listening.',actions:{Boat:["⛵","Milo: My magnificent Puddle Explorer!"],Puddle:["💦","Pipkin: That puddle was full of surprises!"],Funny:["😄","Milo: Especially my upside-down dragon face!"],"Don't like":["👎","Maya: That's okay. You don't have to like every part."]}},
 {title:'The Rainy-Day Surprise',emoji:'🌈🐉🐸',line:"The clouds parted. A rainbow stretched over the trees! 'Oh, my stars and dragon scales!' Milo cried. 'I still wish it hadn't rained,' he told Pipkin. 'I know, buddy,' said his best friend. 'But I'm glad you came over,' Milo said. 'Next time, let's build TWO boats!' They laughed beneath the rainbow. The end.",prompt:'You can say goodbye to the friends, or finish the story.',actions:{Goodbye:["👋","Milo and Pipkin wave goodbye!"],Friend:["💜","Pipkin: That's what best friends are for!"]}}
];
export class MiloStory {
 constructor(){this.reset();}
 reset(){this.step=0;this.finished=false;this.history=[];this.lastResponse='';this.boatItem='';this.boatMotion='';this.boatPrevious='';this.location='';}
 get scene(){
  const base=MILO_SCENES[this.step];
  // Return a derived scene, keeping the published story script immutable.
  if(this.step===2 && this.location==='Stay inside')
   return {...base,line:"From the cozy window, Milo and Pipkin spotted a shining puddle. Milo saw an upside-down dragon in the glass reflection! He stuck out his tongue. The reflection dragon did too. PLIP! A raindrop tapped the window, and Milo giggled."};
  if(this.step===4 && this.boatItem==='Flower')
   return {...base,line:"The fallen daisy, Captain Daisy, rode in Milo's paper boat. Milo lowered it into the puddle. It wobbled and tipped, then floated! 'All aboard the Puddle Express!' Pipkin cheered. The boat is ready for you to steer."};
  if(this.step===4 && this.boatItem==='Leaf')
   return {...base,line:"Milo's paper boat flew its red leaf flag. Milo lowered it into the puddle. It wobbled and tipped, then floated! 'All aboard the Puddle Express!' Pipkin cheered. The boat is ready for you to steer."};
  return base;
 }
 choose(action){
  if(this.finished||!(action in this.scene.actions))throw Error('Choose a story action');
  let response=this.scene.actions[action][1];
  if(this.step===1)this.location=action;
  if(this.step===3)this.boatItem=action;
  if(this.step===4){
   if(action==='Again'){response=this.boatPrevious?this.scene.actions[this.boatPrevious][1]:'The little boat is ready. Choose Go or Slow.';}
   else {this.boatMotion=action;this.boatPrevious=action;}
  }
  this.history.push({step:this.step,action});this.lastResponse=response;return response;
 }
 next(){if(this.finished)return false;this.lastResponse='';if(this.step===MILO_SCENES.length-1){this.finished=true;return false;}this.step+=1;return true;}
}
