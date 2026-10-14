const {test,expect}=require('@playwright/test');
const {spawn}=require('node:child_process');
let server;
test.beforeAll(async()=>{server=spawn('python3',['-m','http.server','8768','--bind','127.0.0.1'],{stdio:'ignore'});await new Promise(r=>setTimeout(r,1200));});
test.afterAll(()=>server?.kill());
test('communication stays usable during Milo and does not require spoken output',async({page})=>{
 await page.goto('http://127.0.0.1:8768/');
 await page.locator('.story[data-choice="Milo"]').click();
 await expect(page.locator('#learning-progress')).toContainText('Scene 1 of 7');
 await page.locator('#talk').click();
 await expect(page.locator('#pad')).toBeVisible();
 for(const word of ['Help','Stop','Break']){
  await expect(page.locator('#vocab button[aria-label="'+word+'"]')).toBeVisible();
 }
 await expect(page.locator('#learning-progress')).toContainText('Scene 1 of 7');
});
test('AAC remains reachable on a narrow touch device during learning',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const page=await context.newPage();
 await page.goto('http://127.0.0.1:8768/');
 await page.locator('.story[data-choice="Milo"]').click();
 await page.locator('#talk').click();
 await expect(page.locator('#pad')).toBeVisible();
 for(const word of ['Help','Stop','Break'])await expect(page.locator('#vocab button[aria-label="'+word+'"]')).toBeVisible();
 await context.close();
});
