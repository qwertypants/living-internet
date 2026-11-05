import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const {chromium}=createRequire('/tmp/mycelium-browser-evidence/package.json')('playwright');
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
try {
for(const width of [1440,390]) {
const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});
await page.goto('http://127.0.0.1:5182');
await page.evaluate(async()=>{const f=await import(performance.getEntriesByType('resource').find(e=>e.name.includes('/@react-three_fiber.js')).name);window.state=()=>[...f._roots.values()][0].store.getState();});
await page.waitForTimeout(500);
const select=page.getByLabel('Inspect commit');
await select.selectOption({index:1});
await page.waitForTimeout(100);
assert(await page.locator('.inspector').isVisible());
assert(await page.evaluate(()=>window.state().controls.target.length()>0));
await page.getByRole('button',{name:'Home',exact:true}).focus();await page.keyboard.press('Enter');
await page.waitForTimeout(100);
assert(await page.evaluate(()=>window.state().controls.target.length()<0.001));
await select.selectOption({index:360});await page.getByLabel('Timeline').fill('0');await page.waitForTimeout(100);
assert.equal(await page.locator('.inspector').count(),0);
await page.getByLabel('Timeline').fill('360');
await page.getByTitle('Toggle reduced motion').click();await select.selectOption({index:1});await page.waitForTimeout(120);
const box=await page.locator('canvas').boundingBox();await page.mouse.move(box.x+box.width*.5,box.y+box.height*.15);await page.mouse.down();await page.mouse.move(box.x+box.width*.6,box.y+box.height*.155,{steps:5});await page.mouse.up();
await page.waitForTimeout(100);const a=await page.evaluate(()=>window.state().camera.position.toArray());await page.waitForTimeout(1000);assert.deepEqual(await page.evaluate(()=>window.state().camera.position.toArray()),a);
await select.selectOption({index:2});await page.waitForTimeout(1100);
console.log(width,'PASS reduced snap, keyboard Home, rewind clear, manual cancellation, reselection');await page.close();
}
} finally {await browser.close();}
