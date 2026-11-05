import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const { chromium } = createRequire('/tmp/mycelium-browser-evidence/package.json')('playwright');
const data = JSON.parse(await readFile(new URL('../local/history.json', import.meta.url)));
const browser = await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
try {
 const page = await browser.newPage({reducedMotion:'reduce',viewport:{width:1440,height:1000}});
 const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5187/?history=local');
 await page.waitForFunction(n=>JSON.parse(localStorage.getItem('mycelium.events.v1')).length===n,data.commits.length);
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('mycelium.events.v1')));
 assert.equal(saved.length,data.commits.length);
 for(const c of [data.commits[0],data.commits.at(-1),data.commits[100]]) {
  const event=saved.find(e=>e.projectId===c.projectId && e.payload.sha===c.sha); assert.ok(event); assert.deepEqual(event.payload.parents,c.parents);
  await page.getByLabel('Inspect commit').selectOption(event.id);
  await page.getByText(data.projects.find(p=>p.id===c.projectId).label,{exact:true}).waitFor();
 }
 await page.getByLabel('Timeline').fill('10');
 assert.equal(await page.getByLabel('Inspect commit').locator('option').count(),11);
 await page.getByLabel('Timeline').fill(String(saved.length));
 await page.screenshot({path:'/tmp/task7-real-history.png'});
 await page.getByRole('button',{name:'Load local history',exact:true}).click();
 assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('mycelium.events.v1'))),saved);
 await page.getByLabel('Import history JSON').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{')});
 await page.getByRole('alert').waitFor();
 assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('mycelium.events.v1'))),saved);
 await page.goto('http://127.0.0.1:5187/'); await page.reload();
 assert.equal(await page.getByLabel('Inspect commit').locator('option').count(),saved.length+1);
 await page.getByRole('button',{name:'Synthetic demo',exact:true}).click();
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('mycelium.events.v1')).length===360);
 for(const path of ['/local/history.json','/@fs'+new URL('../local/history.json',import.meta.url).pathname]) {const r=await page.request.get('http://127.0.0.1:5187'+path); assert.notEqual(r.status(),200);}
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({commits:saved.length,projects:data.projects.length,matching:data.coverage.matchingRepositoryCount,checks:'samples, selection, repeat import, invalid preservation, reload, demo, static privacy passed'}));
} finally {await browser.close();}
