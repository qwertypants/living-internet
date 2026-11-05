import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const { chromium } = createRequire(process.env.PLAYWRIGHT_PACKAGE || '/tmp/mycelium-browser-evidence/package.json')('playwright');
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
try {
 for (const count of [360, 1000]) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const errors=[]; page.on('pageerror',error=>errors.push(String(error)));
  await page.goto(process.env.APP_URL || 'http://127.0.0.1:5182');
  for (const reversed of [false,true]) {
   await page.evaluate(async ({count,reversed}) => {const d=await import('/src/domain.ts');const events=d.makeDemoEvents(count); localStorage.setItem('mycelium.events.v1',JSON.stringify(reversed?events.reverse():events));}, {count,reversed});
   await page.reload();
   await page.evaluate(async()=>{const f=await import(performance.getEntriesByType('resource').find(e=>e.name.includes('/@react-three_fiber.js')).name);window.state=()=>[...f._roots.values()][0]?.store.getState();});
   await page.waitForFunction(()=>window.state()?.gl.info.render.calls>5);
   for(const cursor of [count,30,count]) {
    await page.getByLabel('Timeline').fill(String(cursor));
    await page.getByRole('button',{name:'Home',exact:true}).click();
    await page.waitForTimeout(120);
    const candidates=await page.evaluate(async({count,cursor})=>{
     const THREE=await import('/node_modules/.vite/deps/three.js');const d=await import('/src/domain.ts');const trees=d.replay(d.makeDemoEvents(count),cursor); const s=window.state();
     const meshes=[];s.scene.traverse(o=>{if(o.isInstancedMesh)meshes.push(o)});
     const r=s.gl.domElement.getBoundingClientRect();const ray=new THREE.Raycaster();const result=[];
     // Derive expected IDs from canonical world positions, not renderer lookup metadata.
     for(const tree of [...trees].sort((a,b)=>Math.hypot(b.x,b.z)-Math.hypot(a.x,a.z))) {
      const p=new THREE.Vector3(tree.x,tree.height*.92,tree.z).project(s.camera);
      if(Math.abs(p.x)>.9||Math.abs(p.y)>.9)continue;
      ray.setFromCamera(new THREE.Vector2(p.x,p.y),s.camera);
      const hit=ray.intersectObjects(meshes,false)[0];if(!hit||hit.instanceId===undefined)continue;
      const matrix=new THREE.Matrix4();hit.object.getMatrixAt(hit.instanceId,matrix);const position=new THREE.Vector3().setFromMatrixPosition(matrix);
      if(Math.abs(position.x-tree.x)>.0001||Math.abs(position.z-tree.z)>.0001)continue;
      const x=r.x+(p.x+1)*r.width/2,y=r.y+(1-p.y)*r.height/2;
      if(document.elementFromPoint(x,y)!==s.gl.domElement)continue;
      const species=hit.object.userData.species;
      if(!result.some(v=>v.species===species))result.push({x,y,id:tree.id,sha:tree.payload.sha,species});
      if(result.length===3)break;
     }
     return result;
    },{count,cursor});
    assert(candidates.length>0,'at least one exposed tree can be picked');
    for(const pick of candidates) {
     await page.mouse.click(pick.x,pick.y);
     await page.waitForTimeout(80);
     assert.equal(await page.getByLabel('Inspect commit').inputValue(),pick.id,'pointer resolves canonical event');
     assert.equal(await page.locator('.commitline code').textContent(),pick.sha.slice(0,8));
     await page.getByRole('button',{name:'Home',exact:true}).click();await page.waitForTimeout(80);
    }
    const expected=await page.evaluate(async({count,cursor})=>{const d=await import('/src/domain.ts');return d.replay(d.makeDemoEvents(count),cursor)[0]}, {count,cursor});
    await page.getByLabel('Inspect commit').focus();await page.keyboard.press('ArrowDown');
    assert.equal(await page.getByLabel('Inspect commit').inputValue(),expected.id,'keyboard resolves first canonical event');
    assert.equal(await page.locator('.commitline code').textContent(),expected.payload.sha.slice(0,8));
    assert(await page.evaluate(()=>!!window.state().scene.getObjectByName('selection-marker')));
   }
  }
  await page.screenshot({path:`/tmp/mycelium-forest-${count}-desktop.png`});
  await page.setViewportSize({width:390,height:1000});await page.waitForTimeout(200);
  await page.screenshot({path:`/tmp/mycelium-forest-${count}-narrow.png`});
  await page.getByRole('button',{name:'Forest: detailed',exact:true}).click();
  assert(await page.getByRole('button',{name:'Forest: simple',exact:true}).isVisible());
  assert.deepEqual(errors,[]);console.log(`${count}: PASS pointer/keyboard canonical SHA after reorder, rewind and fast-forward; marker and quality toggle`);
  await page.close();
 }
} finally { await browser.close(); }
