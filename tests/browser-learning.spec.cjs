const {test,expect}=require('@playwright/test');const {spawn}=require('node:child_process');let server;
test.beforeAll(async()=>{server=spawn('python3',['-m','http.server','8765','--bind','127.0.0.1'],{stdio:'ignore'});await new Promise(r=>setTimeout(r,1300));});test.afterAll(()=>server?.kill());
test('narrated story advances through scenes and can replay',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/');
 await page.locator('.story[data-choice="Bears"]').click();
 await expect(page.locator('#learning-progress')).toHaveText('Page 1 of 3');
 await page.getByRole('button',{name:'Look under leaves',exact:true}).click();
 await expect(page.locator('#learning-progress')).toHaveText('Page 2 of 3');
 await page.getByRole('button',{name:'Ask the bird',exact:true}).click();
 await page.getByRole('button',{name:'Head home',exact:true}).click();
 await expect(page.locator('#learning-progress')).toHaveText('The end!');
 await page.locator('#learning-replay').click();
 await expect(page.locator('#learning-progress')).toHaveText('Page 1 of 3');
 await page.locator('#learning-back').click();
 await expect(page.locator('#learning-step')).toBeVisible();
 await expect(page.locator('#maya-portrait')).toBeVisible();
 await expect(page.locator('#learning-narration')).toContainText('Milo the dragon');
 expect(errors).toEqual([]);
});
test('AAC is available during story, Maya can be hidden',async({page})=>{
 await page.goto('http://127.0.0.1:8765/');
 await page.locator('.story[data-choice="Space"]').click();
 await page.locator('.maya-preferences summary').click();
 await page.locator('#maya-toggle').click();
 await expect(page.locator('#maya-portrait')).toBeHidden();
 await page.locator('#talk').click();
 await expect(page.locator('#pad')).toBeVisible();
 await page.locator('#vocab button').first().click();
 await expect(page.locator('#phrase')).not.toBeEmpty();
 await page.locator('#close').click();
 await expect(page.locator('#learning-progress')).toHaveText('Page 1 of 3');
});

test('Maya original image layers load, can be hidden and do not block AAC',async({page})=>{
 await page.goto('http://127.0.0.1:8765/');
 await page.locator('.story[data-choice="Bears"]').click();
 const stage=page.locator('#maya-portrait .tp-stage');
 await expect(stage).toBeVisible();
 await expect(stage.locator('img')).toHaveCount(5);
 await expect.poll(()=>stage.locator('img').evaluateAll(images=>images.every(im=>im.complete&&im.naturalWidth>0))).toBe(true);
 await page.locator('.maya-preferences summary').click();
 await page.locator('#maya-toggle').click();
 await expect(page.locator('#maya-portrait')).toBeHidden();
 await page.locator('#talk').click();
 await expect(page.locator('#pad')).toBeVisible();
 await expect(page.locator('#vocab button').first()).toHaveAttribute('aria-label','Help');
});

test('Maya American voice selection and preview never change AAC voice',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/');
 await page.locator('.story[data-choice="Bears"]').click();
 await page.locator('.maya-preferences summary').click();
 await expect(page.locator('#maya-voice')).toBeVisible();
 await expect(page.locator('#maya-voice-preview')).toBeVisible();
 await page.locator('#maya-voice-preview').click();
 await expect(page.locator('#learning-voice-status')).not.toBeEmpty();
 await page.locator('#talk').click();
 await expect(page.locator('#pad')).toBeVisible();
 await page.locator('#vocab button').first().click();
 await expect(page.locator('#phrase')).not.toBeEmpty();
 expect(errors).toEqual([]);
});

test('Maya remains visible on the left as adventure choices change on phone',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/');
 const maya=page.locator('#maya-portrait');
 await expect(maya).toBeVisible();
 await expect(page.locator('#story-choices')).toBeVisible();
 const start=await maya.boundingBox(),choices=await page.locator('#story-choices').boundingBox();
 expect(start.x+start.width).toBeLessThan(choices.x+25);
 await page.locator('.story[data-choice="Space"]').click();
 await expect(maya).toBeVisible();
 await expect(page.locator('#story-choices')).toBeHidden();
 await expect(page.locator('#learning-progress')).toHaveText('Page 1 of 3');
 await page.getByRole('button',{name:'Moon',exact:true}).click();
 await expect(maya).toBeVisible();
 await expect(page.locator('#learning-progress')).toHaveText('Page 2 of 3');
 await page.locator('#learning-back').click();
 await expect(maya).toBeVisible();
 await expect(page.locator('#story-choices')).toBeVisible();
 expect(errors).toEqual([]);
 await context.close();
});

test('Forest story follows choice consequences without scripted confirmations',async({page})=>{
 await page.goto('http://127.0.0.1:8765/');
 await page.locator('.story[data-choice="Bears"]').click();
 await expect(page.locator('#learning-narration')).toContainText('lost his blue scarf');
 await page.getByRole('button',{name:'Follow the footprints'}).click();
 await expect(page.locator('#forest-caption')).toContainText('footprints');
 await page.getByRole('button',{name:'Ask the bird'}).click();
 await expect(page.locator('#forest-caption')).toContainText('gently nudges');
 await page.getByRole('button',{name:'Thank the bird'}).click();
 await expect(page.locator('#learning-progress')).toHaveText('The end!');
 await expect(page.locator('#forest-caption')).not.toContainText('You picked');
});

test('Forest illustration updates and AAC remains independent',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/');
 await expect(page.locator('#forest-scene')).toBeHidden();
 await page.locator('.story[data-choice="Bears"]').click();
 await expect(page.locator('#forest-scene')).toBeVisible();
 await expect(page.locator('#forest-scene')).toHaveAttribute('data-scene','0');
 await page.getByRole('button',{name:'Look under leaves'}).click();
 await expect(page.locator('#forest-scene')).toHaveAttribute('data-scene','1');
 await expect(page.locator('#forest-caption')).toContainText('feather');
 await page.locator('#talk').click();
 await expect(page.locator('#pad')).toBeVisible();
 await page.locator('#vocab button').first().click();
 await expect(page.locator('#phrase')).not.toBeEmpty();
 await page.locator('#close').click();
 await page.getByRole('button',{name:'Reach for the branch'}).click();
 await expect(page.locator('#forest-scene')).toHaveAttribute('data-scene','2');
 await page.getByRole('button',{name:'Head home'}).click();
 await expect(page.locator('#forest-scene')).toHaveAttribute('data-scene','home');
 await expect(page.locator('#forest-caption')).toContainText('cozy path');
 expect(errors).toEqual([]);
});


test('Milo story gives optional AAC participation and controllable boat',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/');
 await page.locator('.story[data-choice="Milo"]').click();
 await expect(page.locator('#learning-progress')).toHaveText('Scene 1 of 7');
 await page.getByRole('button',{name:'Oh no!',exact:true}).click();
 await expect(page.locator('#milo-response')).toContainText("rain" );
 await page.locator('#talk').click();
 await expect(page.locator('#pad')).toBeVisible();
 await expect(page.locator('#vocab button').first()).toHaveAttribute('aria-label','Help');
 await page.locator('#close').click();
 await expect(page.locator('#learning-progress')).toHaveText('Scene 1 of 7');
 await page.getByRole('button',{name:'Continue story without choosing'}).click();
 await page.getByRole('button',{name:'Stay inside'}).click();
 await page.getByRole('button',{name:'Continue story without choosing'}).click();
 await page.getByRole('button',{name:'Continue story without choosing'}).click();
 await page.getByRole('button',{name:'Flower'}).click();
 await page.getByRole('button',{name:'Continue story without choosing'}).click();
 await expect(page.locator('#milo-visual')).toContainText('🌼');
 await page.getByRole('button',{name:'Go',exact:true}).click();
 await expect(page.locator('#milo-response')).toContainText('sails forward');
 await page.getByRole('button',{name:'Stop',exact:true}).click();
 await expect(page.locator('#milo-response')).toContainText('stops');
 await page.getByRole('button',{name:'Again',exact:true}).click();
 await expect(page.locator('#milo-response')).toContainText('stops');
 await page.getByRole('button',{name:'Continue story without choosing'}).click();
 await page.getByRole('button',{name:'Continue story without choosing'}).click();
 await page.getByRole('button',{name:'Finish story'}).click();
 await expect(page.locator('#learning-progress')).toHaveText('The end!');
 await page.locator('#learning-replay').click();
 await expect(page.locator('#learning-progress')).toHaveText('Scene 1 of 7');
 expect(errors).toEqual([]);
});


test('Milo opening clearly explains interaction and allows no-response continuation',async({page})=>{
 await page.goto('http://127.0.0.1:8765/');
 await page.locator('.story[data-choice="Milo"]').click();
 await expect(page.locator('#milo-prompt')).toBeVisible();
 await expect(page.locator('#milo-prompt')).toContainText('Tap a picture');
 await expect(page.locator('#milo-help')).toContainText('Use Talk at any time');
 await expect(page.getByRole('button',{name:'Oh no!',exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Continue story without choosing'})).toBeVisible();
 await page.getByRole('button',{name:'Continue story without choosing'}).click();
 await expect(page.locator('#learning-progress')).toHaveText('Scene 2 of 7');
 await page.locator('#talk').click();
 await expect(page.locator('#pad')).toBeVisible();
 await page.locator('#close').click();
 await expect(page.locator('#learning-progress')).toHaveText('Scene 2 of 7');
});


test('welcome and Maya preview name all three available stories',async({page})=>{
 await page.goto('http://127.0.0.1:8765/');
 await expect(page.locator('#learning-narration')).toContainText('Milo the dragon');
 await expect(page.locator('.story[data-choice="Milo"]')).toBeVisible();
 await expect(page.locator('.story[data-choice="Bears"]')).toBeVisible();
 await expect(page.locator('.story[data-choice="Space"]')).toBeVisible();
 await page.locator('.story[data-choice="Milo"]').click();
 await expect(page.locator('#learning-progress')).toHaveText('Scene 1 of 7');
 await page.locator('#learning-back').click();
 await expect(page.locator('#learning-narration')).toContainText('Milo the dragon');
});
