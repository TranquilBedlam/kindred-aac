import {test} from 'node:test';import assert from 'node:assert/strict';import {MiloStory,MILO_SCENES} from '../src/milo-story.js';
test('Milo has seven scenes and permits silent continuation',()=>{
 const m=new MiloStory();assert.equal(MILO_SCENES.length,7);
 for(let i=0;i<6;i++)assert.equal(m.next(),true);
 assert.equal(m.step,6);assert.equal(m.next(),false);assert.equal(m.finished,true);
});
test('choices preserve friendship, location and boat decoration',()=>{
 const m=new MiloStory();m.choose('Oh no!');m.next();m.choose('Stay inside');assert.equal(m.location,'Stay inside');m.next();m.next();
 m.choose('Flower');assert.equal(m.boatItem,'Flower');m.next();m.choose('Go');assert.equal(m.boatMotion,'Go');
 assert.equal(m.history.length,4);
});
test('boat Again respects last motion; Stop explicitly stops the boat',()=>{
 const m=new MiloStory();for(let i=0;i<4;i++)m.next();
 assert.match(m.choose('Again'),/ready/);m.choose('Go');assert.match(m.choose('Again'),/sails forward/);
 m.choose('Stop');assert.equal(m.boatMotion,'Stop');assert.match(m.choose('Again'),/stops/);
});
test('invalid actions cannot alter story and reset works',()=>{
 const m=new MiloStory();assert.throws(()=>m.choose('Help'));assert.equal(m.history.length,0);
 m.next();m.choose('Look outside');m.reset();assert.equal(m.step,0);assert.equal(m.location,'');assert.deepEqual(m.history,[]);
});
test('finished story has no active response actions',()=>{
 const m=new MiloStory();for(let i=0;i<7;i++)m.next();assert.throws(()=>m.choose('Oh no!'));
});

test('story narration follows the child's location and boat decoration choices',()=>{
 const indoor=new MiloStory();
 indoor.next();indoor.choose('Stay inside');indoor.next();
 assert.match(indoor.scene.line,/window/i);
 const outdoor=new MiloStory();
 outdoor.next();outdoor.choose('Look outside');outdoor.next();
 assert.match(outdoor.scene.line,/porch/i);
 outdoor.next();outdoor.choose('Flower');outdoor.next();
 assert.match(outdoor.scene.line,/daisy/i);
 const leaf=new MiloStory();
 leaf.next();leaf.next();leaf.next();leaf.choose('Leaf');leaf.next();
 assert.match(leaf.scene.line,/red leaf flag/i);
});
