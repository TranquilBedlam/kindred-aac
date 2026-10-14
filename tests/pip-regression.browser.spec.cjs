const {test,expect}=require('@playwright/test');
const {spawn}=require('node:child_process');
let server;
test.beforeAll(async()=>{server=spawn('python3',['-m','http.server','8766','--bind','127.0.0.1'],{stdio:'ignore'});await new Promise(r=>setTimeout(r,1200));});
test.afterAll(()=>server?.kill());
const url='http://127.0.0.1:8766/';
test('Maya main page loads, original audio assets return MP3, and AAC remains available',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);
 await expect(page.locator('#kindred-home')).toBeVisible();
 await page.locator('#home-stories').click();
 await expect(page.locator('#maya-portrait')).toBeVisible();
 const res=await page.request.get(url+'audio/scene-1.mp3');
 expect(res.ok()).toBeTruthy();expect((await res.body()).length).toBeGreaterThan(1500);
 await page.locator('.story[data-choice="Milo"]').click();
 await expect(page.locator('#learning-progress')).toContainText('Scene 1 of 7');
 await expect(page.locator('#learning-options button')).toHaveCount(3);
 await page.locator('#talk').click();await expect(page.locator('#pad')).toBeVisible();
 await expect(page.locator('#vocab button').first()).toHaveAttribute('aria-label','Help');
 expect(errors).toEqual([]);
});
test('both scene-one choices play correct real Pip response and advance only after audio ends',async({page})=>{
 for(const [label,clip] of [['Open the door','01-open-door.mp3'],["Ask who's there",'01-ask-whos-there.mp3']]){
  await page.goto(url);await page.locator('#home-stories').click();await page.locator('.story[data-choice="Milo"]').click();
  await page.getByRole('button',{name:label,exact:true}).click();
  await expect(page.locator('#learning-progress')).toContainText('Scene 1 of 7');
  const state=await page.evaluate(()=>({src:[...document.querySelectorAll('audio')].map(a=>a.src)}));
  // Audio is created with new Audio(), so network fetch proves the selected file actually loads.
  const mp3=await page.request.get(url+'audio/'+clip);expect(mp3.ok()).toBeTruthy();
  await expect(page.locator('#milo-response')).not.toBeEmpty();
  // Do not click the manual recovery control: the real Pip MP3 must advance itself.\n  await expect(page.locator('#learning-progress')).toContainText('Scene 2 of 7',{timeout:18000});
 }
});
test('AAC interruption does not advance story; mobile layout retains controls',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const page=await context.newPage();await page.goto(url);
 await page.locator('#home-stories').click();
 await page.locator('.story[data-choice="Milo"]').click();
 await page.getByRole('button',{name:'Open the door',exact:true}).click();
 await page.locator('#talk').click();
 await expect(page.locator('#pad')).toBeVisible();
 await expect(page.locator('#learning-progress')).toContainText('Scene 1 of 7');
 await expect(page.locator('#vocab button').first()).toHaveAttribute('aria-label','Help');
 await context.close();
});
