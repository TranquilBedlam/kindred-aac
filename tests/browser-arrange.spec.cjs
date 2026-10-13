const {test,expect}=require('@playwright/test');
const {spawn}=require('node:child_process');
let server;
test.beforeAll(async()=>{server=spawn('python3',['-m','http.server','8765','--bind','127.0.0.1'],{stdio:'ignore'});await new Promise(r=>setTimeout(r,1200));});
test.afterAll(()=>server?.kill());
async function unlock(page){
 await page.goto('http://127.0.0.1:8765/');
 await page.locator('#open-parent-settings').click();
 const q=await page.locator('#parent-question').innerText();
 const parts=q.match(/(\d+)\s*\+\s*(\d+)/);
 expect(parts).not.toBeNull();
 await page.locator('#parent-answer').fill(String(Number(parts[1])+Number(parts[2])));
 await page.locator('#unlock-parent button[type="submit"]').click();
 await expect(page.locator('#caregiver-editor')).toBeVisible();
 await page.locator('[data-parent-tab="arrange"]').click();
 await expect(page.locator('#arrange-grid')).toBeVisible();
}
test('arrange mode starts locked and cannot affect child view',async({page})=>{
 await page.goto('http://127.0.0.1:8765/');
 await page.locator('#open-parent-settings').click();
 await expect(page.locator('#caregiver-editor')).toBeHidden();
 await expect(page.locator('#arrange-grid')).toBeHidden();
 await page.locator('#exit-parent').click();
 await page.locator('#talk').click();
 await expect(page.locator('#vocab button').first()).toHaveAttribute('aria-label','Help');
 await expect(page.locator('#vocab .arrange-tile')).toHaveCount(0);
});
test('actual picture tiles rearrange by pointer drag and save across reload',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await unlock(page);
 const first=page.locator('#arrange-grid .arrange-tile').first();
 await expect(first).toHaveAttribute('data-word-id','help');
 await page.locator('#arrange-grid .arrange-tile[data-word-id="water"]').dragTo(first,{targetPosition:{x:24,y:24}});
 await expect(first).toHaveAttribute('data-word-id','water');
 await page.reload();
 await page.locator('#talk').click();
 await expect(page.locator('#vocab button').first()).toHaveAttribute('aria-label','Water');
 await page.locator('#vocab button').first().click();
 await expect(page.locator('#phrase')).toContainText('Water');
 expect(errors).toEqual([]);
});
test('Move Earlier and Move Later work on picture tiles',async({page})=>{
 await unlock(page);
 await page.getByRole('button',{name:'Move later: Help'}).click();
 await expect(page.locator('#arrange-grid .arrange-tile').first()).toHaveAttribute('data-word-id','stop');
 await page.getByRole('button',{name:'Move earlier: Help'}).click();
 await expect(page.locator('#arrange-grid .arrange-tile').first()).toHaveAttribute('data-word-id','help');
});
test('real touch events rearrange picture tiles on tablet emulation',async({browser})=>{
 const context=await browser.newContext({viewport:{width:820,height:1180},isMobile:true,hasTouch:true});
 const page=await context.newPage();
 await unlock(page);
 const from=page.locator('#arrange-grid .arrange-tile[data-word-id="water"] .arrange-grip');
 const to=page.locator('#arrange-grid .arrange-tile[data-word-id="help"] .arrange-grip');
 await from.scrollIntoViewIfNeeded();
 const a=await from.boundingBox(),b=await to.boundingBox();
 const x1=a.x+a.width/2,y1=a.y+a.height/2,x2=b.x+b.width/2,y2=b.y+b.height/2;
 const cdp=await context.newCDPSession(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x1,y:y1}]});
 for(let i=1;i<=12;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x1+(x2-x1)*i/12,y:y1+(y2-y1)*i/12}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await expect(page.locator('#arrange-grid .arrange-tile').first()).toHaveAttribute('data-word-id','water');
 await context.close();
});

test('phone touch gesture on drag handle moves picture without scrolling page',async({browser})=>{
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
 const page=await context.newPage();
 await unlock(page);
 const from=page.locator('#arrange-grid .arrange-tile[data-word-id="stop"] .arrange-grip');
 const to=page.locator('#arrange-grid .arrange-tile[data-word-id="help"] .arrange-grip');
 await from.scrollIntoViewIfNeeded();
 const a=await from.boundingBox(),b=await to.boundingBox();
 const sx=a.x+a.width/2,sy=a.y+a.height/2,dx=b.x+b.width/2,dy=b.y+b.height/2;
 const before=await page.evaluate(()=>window.scrollY);
 const cdp=await context.newCDPSession(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:sx,y:sy}]});
 for(let k=1;k<=14;k++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:sx+(dx-sx)*k/14,y:sy+(dy-sy)*k/14}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await expect(page.locator('#arrange-grid .arrange-tile').first()).toHaveAttribute('data-word-id','stop');
 expect(Math.abs((await page.evaluate(()=>window.scrollY))-before)).toBeLessThan(5);
 await context.close();
});
