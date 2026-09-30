const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'C:/Users/win/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),output=path.join(root,'_tmp/change4');fs.mkdirSync(output,{recursive:true});
const server=http.createServer((req,res)=>{const f=path.join(root,decodeURIComponent(req.url.split('?')[0]));if(path.relative(root,f).startsWith('..')||!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.html':'text/html'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));});
const state=p=>p.evaluate(()=>__roamDiagnostics());
async function select(p,i,action){await p.locator('#mapBtn').click();await p.locator(`[data-region="${i}"]`).click();await p.locator(`[data-action="${action}"]`).click();await p.waitForTimeout(250);}
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true}),report={errors:[],routes:[],mobile:[]};
try{
 const p=await browser.newPage({viewport:{width:1440,height:900}});p.on('pageerror',e=>report.errors.push(String(e)));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());});
 await p.goto(origin+'/roam.html');await p.waitForFunction(()=>window.__roamDiagnostics?.().ready);assert.equal((await state(p)).codex.total,38);
 // Apollo -> CE-4 navigation must pass through CE-6, and manual input must cancel assistance.
 await select(p,4,'guide');let s=await state(p);const ce6=s.regions[3];assert.ok(s.guidePath.some(p=>Math.hypot(p.x-(ce6.x-16),p.z-(ce6.z-15))<1));await p.keyboard.press('a');assert.equal((await state(p)).auto,false);
 await select(p,4,'jump');await p.waitForTimeout(700);s=await state(p);assert.equal(s.region,4);assert.equal(s.environment.earthRendered,false);assert.equal(s.environment.darkness,1);assert.equal(s.exhibits[4].ascent,null);assert.equal(s.exhibits[4].roverWheels,6);
 await p.screenshot({path:path.join(output,'change4-camp.png')});
 await p.locator('#heritageBtn').click();s=await state(p);assert.equal(s.exhibits[3].ascent,false);assert.equal(s.exhibits[4].landerVisible,true);assert.equal(s.exhibits[4].roverVisible,true);await p.locator('#heritageBtn').click();
 await p.keyboard.down('w');await p.waitForTimeout(4300);await p.keyboard.up('w');await p.waitForTimeout(250);assert.ok((await state(p)).codex.unlocked.includes('change4-lander'));await p.keyboard.press('e');assert.ok((await p.locator('#roverCodexTitle').innerText()).includes('嫦娥四号'));await p.screenshot({path:path.join(output,'change4-codex.png')});await p.locator('#roverCodexClose').click();
 // Reach the separate rover using real keyboard steering, then read its separate entry.
 await select(p,4,'jump');await p.keyboard.down('d');await p.waitForFunction(()=>__roamDiagnostics().position.yaw<.025,null,{timeout:4000});await p.keyboard.up('d');await p.waitForTimeout(200);
 await p.keyboard.down('w');await p.waitForTimeout(4000);await p.keyboard.up('w');await p.waitForTimeout(250);assert.ok((await state(p)).codex.unlocked.includes('yutu2-rover'));await p.keyboard.press('e');assert.ok((await p.locator('#roverCodexTitle').innerText()).includes('玉兔二号'));
 assert.ok(await p.locator('#roverCodexBody img').evaluate(i=>i.complete&&i.naturalWidth>0));assert.equal(await p.locator('#roverCodexBody a[href*="cnsa.gov.cn"]').count(),1);await p.screenshot({path:path.join(output,'yutu2-codex.png')});await p.locator('#roverCodexClose').click();
 await p.reload();await p.waitForFunction(()=>window.__roamDiagnostics?.().ready);s=await state(p);assert.equal(s.region,4);assert.equal(s.environment.earthRendered,false);assert.ok(s.visited.includes(4)&&s.codex.unlocked.includes('yutu2-rover'));
 await p.locator('#codexBtn').click();await p.locator('[data-filter="4"]').click();assert.equal(await p.locator('.rover-card').count(),2);assert.ok(!(await p.locator('#roverCodexBody').innerText()).includes('阿波罗 4'));await p.locator('#roverCodexClose').click();
 await p.locator('#mapBtn').click();assert.equal(await p.locator('#routeChoices button').count(),24);await p.screenshot({path:path.join(output,'five-station-map.png')});await p.locator('#closeMap').click();
 await select(p,3,'jump');const startTravel=(await state(p)).metres;
 for(const destination of [4,3]){
   await select(p,destination,'guide');const start=Date.now();assert.equal((await state(p)).auto,true);
   while((s=await state(p)).auto){assert.ok(Date.now()-start<75000,'stalled '+JSON.stringify(s.position));assert.equal(s.environment.earthRendered,false);assert.equal(s.environment.darkness,1);await p.waitForTimeout(800);}
   assert.equal(s.region,destination===4?4:6);report.routes.push(s);console.log('Arrived '+s.region+'; '+Math.round(s.metres-startTravel)+' m');
 }
 assert.ok((await state(p)).metres-startTravel>220);
 // Original near/far behavior must survive the extension, including viewport/camera changes.
 for(const i of [0,1,2,3,4]){await select(p,i,'jump');assert.equal((await state(p)).environment.earthRendered,i<3);await p.locator('#cameraBtn').click();assert.equal((await state(p)).environment.earthRendered,i<3);await p.locator('#cameraBtn').click();}
 await select(p,1,'guide');s=await state(p);assert.ok(s.guidePath.some(p=>Math.hypot(p.x-(ce6.x-16),p.z-(ce6.z-15))<1));await p.keyboard.press('d');assert.equal((await state(p)).auto,false);
 const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});phone.on('pageerror',e=>report.errors.push(String(e)));await phone.goto(origin+'/roam.html');await phone.waitForFunction(()=>window.__roamDiagnostics?.().ready);await select(phone,4,'jump');
 for(const [width,height] of [[320,568],[390,844],[844,390]]){await phone.setViewportSize({width,height});await phone.waitForTimeout(400);assert.equal((await state(phone)).environment.earthRendered,false);const buttons=await phone.locator('#pad button').evaluateAll(bs=>bs.map(b=>{const r=b.getBoundingClientRect();return r.top>=0&&r.bottom<=visualViewport.height+.5&&r.left>=0&&r.right<=visualViewport.width+.5&&document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===b;}));assert.ok(buttons.every(Boolean));report.mobile.push({width,height,buttons});await phone.screenshot({path:path.join(output,'change4-phone-'+width+'.png')});}
 assert.deepEqual(report.errors,[]);report.status='PASS';fs.writeFileSync(path.join(output,'verification.json'),JSON.stringify(report,null,2));console.log('PASS CE-4 / Yutu-2 models, separate codex unlocks, round trip, navigation chain, lighting, heritage, save and mobile');
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
