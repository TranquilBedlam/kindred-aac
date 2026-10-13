const {test,expect}=require('@playwright/test');const {spawn}=require('node:child_process');let server;
test.beforeAll(async()=>{server=spawn('python3',['-m','http.server','8765','--bind','127.0.0.1'],{stdio:'ignore'});await new Promise(r=>setTimeout(r,1300));});test.afterAll(()=>server?.kill());
test('narrated story advances through scenes and can replay',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/');
 await page.locator('.story[data-choice="Bears"]').click();
 await expect(page.locator('#learning-progress')).toHaveText('Page 1 of 3');
 await page.getByRole('button',{name:'Bear',exact:true}).click();
 await expect(page.locator('#learning-progress')).toHaveText('Page 2 of 3');
 await page.getByRole('button',{name:'Trees',exact:true}).click();
 await page.getByRole('button',{name:'Bear',exact:true}).click();
 await expect(page.locator('#learning-progress')).toHaveText('The end!');
 await page.locator('#learning-replay').click();
 await expect(page.locator('#learning-progress')).toHaveText('Page 1 of 3');
 await page.locator('#learning-back').click();
 await expect(page.locator('#learning-step')).toBeVisible();
 await expect(page.locator('#maya-portrait')).toBeVisible();
 await expect(page.locator('#learning-narration')).toContainText('Would you like to explore');
 expect(errors).toEqual([]);
});
test('AAC is available during story, Maya can be hidden',async({page})=>{
 await page.goto('http://127.0.0.1:8765/');
 await page.locator('.story[data-choice="Space"]').click();
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
 const valid=await stage.locator('img').evaluateAll(images=>images.every(im=>im.complete&&im.naturalWidth>0));
 expect(valid).toBe(true);
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
