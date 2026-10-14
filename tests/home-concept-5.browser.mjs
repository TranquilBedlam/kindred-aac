import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
import { strict as assert } from 'node:assert';
mkdirSync('concept-5-screenshots',{recursive:true});
const browser=await chromium.launch({headless:true});
try{
 for(const width of [390,768,1024,1440]){
  const context=await browser.newContext({viewport:{width,height:900},isMobile:width===390,hasTouch:width===390});
  const page=await context.newPage();
  await page.goto('http://127.0.0.1:8765/',{waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('#kindred-home').isVisible(),true,'home visible '+width);
  assert.equal(await page.locator('#kindred-home').evaluate(el=>getComputedStyle(el).backgroundImage.includes('concept5-landscape.svg')),true,'landscape stylesheet actually applied '+width);
  assert.equal(await page.locator('#kindred-home img').count(),3,'three illustrated home assets '+width);
  assert.equal(await page.locator('#kindred-home img').evaluateAll(images=>images.every(i=>i.complete&&i.naturalWidth>0)),true,'all vector artwork loaded '+width);
  await page.screenshot({path:`concept-5-screenshots/home-${width}.png`,fullPage:true});
  assert.equal(await page.locator('#talk').isVisible(),true,'Talk visible '+width);
  await page.locator('#talk').click();
  assert.equal(await page.locator('#pad').isVisible(),true,'AAC opens '+width);
  assert.ok(await page.locator('#vocab button').count()>=3,'AAC vocabulary renders '+width);
  await page.locator('#talk').click();
  await page.locator('#home-stories').click();
  assert.equal(await page.locator('#story-choices').isVisible(),true,'story menu visible '+width);
  assert.equal(await page.locator('.story[data-choice="Milo"]').isVisible(),true,'Milo story accessible '+width);
  await page.locator('#home-return').click();
  await page.locator('#home-games').click();
  assert.equal(await page.locator('.story[data-choice="Milo"]').isVisible(),false,'Milo not mislabeled game '+width);
  assert.equal(await page.locator('.story[data-choice="Bears"]').isVisible(),true,'game choice accessible '+width);
  await page.locator('#talk').click();
  assert.equal(await page.locator('#pad').isVisible(),true,'AAC during games '+width);
  await page.locator('#open-parent-settings').click();
  assert.equal(await page.locator('#caregiver-panel').isVisible(),true,'caregiver settings '+width);
  assert.equal(await page.locator('#kindred-home').isVisible(),false,'child home hidden in caregiver mode '+width);
  await context.close();
  console.log('PASS viewport '+width);
 }
}finally{await browser.close();}
