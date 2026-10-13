// Child-directed story action controls are separate from general AAC messages.
// Never inspect or reinterpret arbitrary AAC communication as a story command.
export const MILO_SCENES=[
 {title:'The Picnic Disaster',emoji:'🏡🌧️🐉',line:"Milo packed three strawberry sandwiches, a shiny apple, and his yellow blanket. PITTER! PATTER! SPLASH! Rain covered the window. Milo folded his arms and puffed out his cheeks. 'Hmph! Even my sandwiches are disappointed!' Pipkin, his best friend, knocked on the door.",prompt:'What would you like to tell Milo?',actions:{Sad:["😢","Pipkin: Milo was really looking forward to that picnic."],Mad:["😠","Milo: I AM mad at that silly rain!"],Hug:["🤗","Pipkin: I could give my best friend a hug."],"I'm here":["💜","Milo: Thanks. It's nice having someone here."]}},
 {title:'A Best Friend at the Door',emoji:'🐸🍃🐉',line:"Pipkin arrived holding a leaf like an umbrella. 'Special delivery! One wet frog and one big hello!' Milo sighed, 'My picnic is RUINED.' Pipkin said, 'That sounds disappointing. Want some company?' 'Fine,' said Milo. 'But I'm keeping my pout.'",prompt:'Where should the best friends go?',actions:{"Stay inside":["🏡","Milo wraps his yellow blanket around his shoulders. Pipkin sits beside him at the window."],"Look outside":["🌧️","Milo puts on boots and Pipkin joins him beneath the covered porch."]}},
 {title:'The Puddle Mirror',emoji:'🐉💦🐸',line:"The rain softened. Milo and Pipkin watched a shiny puddle from the porch. Milo saw an upside-down dragon! He stuck out his tongue. The puddle dragon did too. PLIP! A raindrop landed on his nose, and Milo giggled.",prompt:'What do you notice?',actions:{Funny:["😄","Milo: Even my nose thinks so!"],Wet:["💧","Milo: Very wet! Luckily, I have my boots!"],"Make ripples":["💦","Milo taps the puddle with one claw. Pipkin taps too, and the ripples meet."],"Find reflections":["🪞","Pipkin points to their silly upside-down faces in the water."]}},
 {title:'The Little Yellow Boat',emoji:'🍃⛵🐉',line:"A yellow leaf floated past Milo. 'A tiny boat!' Pipkin exclaimed. Milo folded a clean sheet of paper from his picnic notebook. Fold. Fold. TUCK! 'Behold! The magnificent Puddle Explorer!' he declared.",prompt:'What should go in the boat?',actions:{Flower:["🌼","Milo places a fallen daisy in the boat. Pipkin calls it Captain Daisy."],Leaf:["🍁","Milo adds a red leaf flag. Pipkin salutes the Puddle Explorer."]}},
 {title:'The Puddle Express',emoji:'⛵💦🐸',line:"Milo lowered the paper boat into the puddle. It wobbled and tipped, then floated! 'All aboard the Puddle Express!' Pipkin cheered. The boat is ready for you to steer.",prompt:'You control the boat. Choose Go, Stop, Slow, or Again.',actions:{Go:["▶️","Pipkin: Here we go! The boat sails forward."],Stop:["⏸️","Milo: Anchors down! The boat stops."],Slow:["🐢","Pipkin: Nice and easy. The boat glides slowly."],Again:["🔁","The last boat movement happens again."]}},
 {title:'A Different Kind of Picnic',emoji:'🧺🐉🐸',line:"They brought the basket beneath the porch. Milo spread his yellow blanket. Pipkin shared cucumber slices. Milo said, 'This wasn't the picnic I planned. I was pretty sad. But I liked making a boat with you.' 'Me too,' said Pipkin.",prompt:'What was your favorite part?',actions:{Boat:["⛵","Milo: My magnificent Puddle Explorer!"],Puddle:["💦","Pipkin: That puddle was full of surprises!"],Funny:["😄","Milo: Especially my upside-down dragon face!"],"Don't like":["👎","Maya: That's okay. You don't have to like every part."]}},
 {title:'The Rainy-Day Surprise',emoji:'🌈🐉🐸',line:"The clouds parted. A rainbow stretched over the trees! 'Oh, my stars and dragon scales!' Milo cried. 'I still wish it hadn't rained,' he told Pipkin. 'I know, buddy,' said his best friend. 'But I'm glad you came over,' Milo said. 'Next time, let's build TWO boats!' They laughed beneath the rainbow. The end.",prompt:'Would you like to say goodbye or read again?',actions:{Goodbye:["👋","Milo and Pipkin wave goodbye!"],Friend:["💜","Pipkin: That's what best friends are for!"]}}
];
export class MiloStory {
 constructor(){this.reset();}
 reset(){this.step=0;this.finished=false;this.history=[];this.lastResponse='';this.boatItem='';this.boatMotion='';this.boatPrevious='';this.location='';}
 get scene(){return MILO_SCENES[this.step];}
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
