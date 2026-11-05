import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const {chromium}=createRequire('/tmp/mycelium-browser-evidence/package.json')('playwright');
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
try {
for(const width of [1440,390]) {
const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'no-preference'});
await page.goto(process.env.APP_URL || 'http://127.0.0.1:5184');
await page.waitForTimeout(700);
await page.evaluate(async()=>{const f=await import(performance.getEntriesByType('resource').find(e=>e.name.includes('/@react-three_fiber.js')).name);window.state=()=>[...f._roots.values()][0].store.getState();});
for(const mode of ['overview','low','close','simple','reduced']) {
if(mode==='reduced') { await page.getByRole('button',{name:'Scene: simple'}).click(); await page.emulateMedia({reducedMotion:'reduce'}); }
if(mode==='low') await page.evaluate(()=>{const s=window.state();s.controls.autoRotate=false;s.camera.position.set(10,1,12);s.controls.target.set(0,-1,0);s.controls.update();});
if(mode==='close') {await page.getByLabel('Inspect commit').selectOption({index:1});}
if(mode==='simple') await page.getByRole('button',{name:'Scene: detailed'}).click();
await page.waitForTimeout(300);
const evidence=await page.evaluate(()=>{const s=window.state(),g=s.scene.getObjectByName('rocky-island').geometry,p=g.attributes.position;let max=-Infinity,min=Infinity;for(let i=0;i<p.count;i++){max=Math.max(max,p.getY(i));min=Math.min(min,p.getY(i));}return {max,min,batches:(()=>{let n=0;s.scene.traverse(o=>{if(o.isInstancedMesh)n++;});return n;})(),roots:s.scene.getObjectByName('decorative-roots').userData.decorative,mist:!!s.scene.getObjectByName('decorative-mist')};});
assert.equal(evidence.max,0);assert(evidence.min < -3);assert(evidence.roots);assert.equal(evidence.batches,6);assert.equal(evidence.mist,mode!=='simple' && mode!=='reduced');
await page.screenshot({path:`/tmp/island-${width}-${mode}.png`});
console.log(width,mode,evidence);
}
await page.getByRole('button',{name:'Home',exact:true}).click();
await page.emulateMedia({reducedMotion:'reduce'});
await page.waitForTimeout(200);
for (const polar of [0.01, Math.PI * 0.49]) {
 for (let azimuth=0;azimuth<4;azimuth++) {
  await page.evaluate(({polar,azimuth})=>{const s=window.state();s.controls.autoRotate=false;s.controls.target.set(0,0,0);s.camera.position.setFromSphericalCoords(16,polar,azimuth*Math.PI/2);s.controls.update();},{polar,azimuth});
  await page.waitForTimeout(50);
  await page.screenshot({path:`/tmp/island-${width}-orbit-${polar.toFixed(2)}-${azimuth}.png`});
 }
}
await page.close();
}
}finally{await browser.close();}
