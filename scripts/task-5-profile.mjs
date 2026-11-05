// Run against npm run dev using a temporary Playwright install (see PROGRESS).
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import os from 'node:os';
import assert from 'node:assert/strict';
const require = createRequire(process.env.PLAYWRIGHT_PACKAGE || '/tmp/mycelium-browser-evidence/package.json');
const { chromium } = require('playwright');
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', error => errors.push(String(error)));
const base = process.env.PROFILE_URL || 'http://127.0.0.1:5173';
await page.goto(base);
await page.evaluate(async () => {
 const fiber = await import(performance.getEntriesByType('resource').find(e=>e.name.includes('/@react-three_fiber.js')).name);
 window.profileState = () => [...fiber._roots.values()][0]?.store.getState();
});
const setup = async (count) => {
 await page.evaluate(async count => {
  const {makeDemoEvents} = await import('/src/domain.ts');
  localStorage.setItem('mycelium.events.v1', JSON.stringify(makeDemoEvents(count)));
 }, count);
 await page.reload();
 await page.evaluate(async () => {
  const fiber = await import(performance.getEntriesByType('resource').find(e=>e.name.includes('/@react-three_fiber.js')).name);
  window.profileState = () => [...fiber._roots.values()][0]?.store.getState();
 });
 await page.waitForFunction(() => window.profileState()?.gl.info.render.calls > 5);
 await page.waitForTimeout(2000);
};
const snapshot = () => page.evaluate(() => {
 const s = window.profileState(); const trees=[]; let star;
 s.scene.traverse(o => { if(o.isInstancedMesh) trees.push(...o.instanceMatrix.array); if(o.type==='Points') star=o.material.uniforms.time?.value; });
 return {camera:s.camera.position.toArray(), trees, star};
});
const sample = () => page.evaluate(() => new Promise(resolve => {
 const intervals=[], calls=[]; let last; const start=performance.now();
 const tick = now => {if(last) {intervals.push(now-last); calls.push(window.profileState().gl.info.render.calls);} last=now;
 if(now-start<5000) requestAnimationFrame(tick); else { intervals.sort((a,b)=>a-b); resolve({frames:intervals.length, medianMs:intervals[Math.floor(intervals.length*.5)], p95Ms:intervals[Math.floor(intervals.length*.95)], drawCalls:[Math.min(...calls),Math.max(...calls)]}); }};requestAnimationFrame(tick);
}));
const results=[];
for(const count of [360,1000]) {
 await page.emulateMedia({reducedMotion:'no-preference'}); await setup(count);
 const activeA=await snapshot(); await page.waitForTimeout(400); const activeB=await snapshot();
 assert.notDeepEqual(activeA.camera, activeB.camera); assert.deepEqual(activeA.trees, activeB.trees); assert.notEqual(activeA.star,activeB.star);
 results.push({count,mode:'motion',...await sample()});
 await page.getByRole('button',{name:'Scene: detailed'}).click(); await page.waitForTimeout(2000);
 results.push({count,mode:'simple',...await sample()});
 await page.getByRole('button',{name:'Scene: simple'}).click(); await page.waitForTimeout(2000);
 await page.getByLabel('Inspect commit').selectOption({index:1}); await page.waitForTimeout(1100);
 assert(await page.getByLabel('Inspect commit').inputValue());
 assert(await page.evaluate(()=>!!window.profileState().scene.getObjectByName('selection-marker')));
 results.push({count,mode:'selected',...await sample()});
 await page.getByRole('button',{name:'Home',exact:true}).click(); await page.waitForTimeout(1100);
 // Drag orbit, change live OS preference while dragging, release; no inertia or automatic updates afterward.
 const box=await page.locator('canvas').boundingBox();
 await page.mouse.move(box.x+box.width*.5,box.y+box.height*.5); await page.mouse.down();
 await page.mouse.move(box.x+box.width*.6,box.y+box.height*.55,{steps:10});
 await page.emulateMedia({reducedMotion:'reduce'}); await page.mouse.up();
 await page.waitForTimeout(400); const frozenA=await snapshot(); await page.waitForTimeout(600);const frozenB=await snapshot();
 assert.deepEqual(frozenA,frozenB);
 results.push({count,mode:'reduced',...await sample()});
 await page.getByLabel('Timeline').fill('10');
 await page.getByTitle('Play',{exact:true}).click(); await page.waitForTimeout(700);
 const cursor=Number(await page.getByLabel('Timeline').inputValue()); assert(cursor>10);
 await page.getByTitle('Pause',{exact:true}).click(); await page.waitForTimeout(200);
 const replayA=await snapshot();await page.waitForTimeout(400);assert.deepEqual(replayA,await snapshot());
 results.push({count,motionChecks:'PASS: active camera/star changes; static instance matrices; live reduction freezes scene; reduced replay advances then freezes',replayCursor:cursor});
}
const environment=await page.evaluate(()=>{const s=window.profileState(),g=s.gl.getContext(),e=g.getExtension('WEBGL_debug_renderer_info');return {userAgent:navigator.userAgent,viewport:[innerWidth,innerHeight],canvas:[g.drawingBufferWidth,g.drawingBufferHeight],devicePixelRatio,rendererPixelRatio:s.gl.getPixelRatio(),gpu:e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):g.getParameter(g.RENDERER)};});
assert.deepEqual(errors,[]);
const report={device:{platform:os.platform(),release:os.release(),arch:os.arch(),cpu:os.cpus()[0].model,memoryGiB:os.totalmem()/1024**3},browser:await browser.version(),environment,results,pageErrors:errors,limits:'Headless Chrome on this host; RAF intervals include scheduling, not isolated GPU duration or physical display proof. Five-second samples after two-second warmup. No 60 FPS claim.'};
console.log(JSON.stringify(report,null,2));
writeFileSync(process.env.PROFILE_OUTPUT || 'docs/evidence/task-5-motion-profile.json',JSON.stringify(report,null,2)+'\n');
await browser.close();
