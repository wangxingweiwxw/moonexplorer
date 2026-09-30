const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'C:/Users/win/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),output=path.join(root,'_tmp/change6');fs.mkdirSync(output,{recursive:true});
const server=http.createServer((req,res)=>{const f=path.join(root,decodeURIComponent(req.url.split('?')[0]));if(path.relative(root,f).startsWith('..')||!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.html':'text/html'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));});
const state=p=>p.evaluate(()=>__roamDiagnostics());
async function select(p,i,action){await p.locator('#mapBtn').click();await p.locator(`[data-region="${i}"]`).click();await p.locator(`[data-action="${action}"]`).click();await p.waitForTimeout(250);}
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true}),report={errors:[],samples:[],routes:[]};
try{
 const p=await browser.newPage({viewport:{width:1440,height:900}});p.on('pageerror',e=>report.errors.push(String(e)));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());});
 await p.goto(origin+'/roam.html');await p.waitForFunction(()=>window.__roamDiagnostics?.().ready);assert.equal((await state(p)).codex.total,38);
 await select(p,3,'jump');let s=await state(p);assert.equal(s.region,6);assert.equal(s.environment.earthRendered,false);assert.equal(s.environment.darkness,1);assert.equal(s.exhibits[3].rover,null);
 await p.locator('#cameraBtn').click();assert.equal((await state(p)).environment.earthRendered,false);await p.locator('#cameraBtn').click();await p.screenshot({path:path.join(output,'change6-camp.png')});await p.locator('#heritageBtn').click();assert.equal((await state(p)).exhibits[3].ascent,false);await p.screenshot({path:path.join(output,'change6-relic.png')});await p.locator('#heritageBtn').click();
 await p.keyboard.down('w');await p.waitForTimeout(4400);await p.keyboard.up('w');await p.waitForTimeout(200);assert.ok((await state(p)).codex.unlocked.includes('change6-lander'));await p.keyboard.press('e');
 assert.ok((await p.locator('#roverCodexTitle').innerText()).includes('嫦娥六号'));assert.ok(!(await p.locator('#roverCodexSubtitle').innerText()).includes('阿波罗 6'));
 assert.ok(await p.locator('#roverCodexBody img').evaluate(i=>i.complete&&i.naturalWidth>0));assert.equal(await p.locator('#roverCodexBody a[href*="cnsa.gov.cn"]').count(),1);
 await p.screenshot({path:path.join(output,'change6-codex.png')});await p.locator('#roverCodexClose').click();await p.reload();await p.waitForFunction(()=>window.__roamDiagnostics?.().ready);assert.equal((await state(p)).region,6);assert.equal((await state(p)).environment.earthRendered,false);assert.ok((await state(p)).visited.includes(6));
 await p.locator('#mapBtn').click();assert.equal(await p.locator('#routeChoices button').count(),24);await p.screenshot({path:path.join(output,'four-station-map.png')});await p.locator('#closeMap').click();
 await select(p,1,'jump');assert.equal((await state(p)).environment.earthRendered,true);
 // Actual driving in both directions, with normal vehicle speed and no teleport during either leg.
 for(const destination of [3,1]){
   await select(p,destination,'guide');assert.equal((await state(p)).auto,true);const start=Date.now();let logAt=0,shot=false;
   while((s=await state(p)).auto){
     const elapsed=Date.now()-start;assert.ok(elapsed<360000,'route stalled: '+JSON.stringify(s.position));
     report.samples.push({destination,x:s.position.x,z:s.position.z,shade:s.environment.darkness,earth:s.environment.earthRendered});
     if(s.environment.darkness>.25&&s.environment.darkness<.45&&!shot){shot=true;await p.screenshot({path:path.join(output,'horizon-'+destination+'.png')});}
     if(elapsed-logAt>30000){logAt=elapsed;console.log('Driving '+destination+': '+Math.round(elapsed/1000)+'s; shade '+s.environment.darkness.toFixed(2));}
     await p.waitForTimeout(1800);
   }
   assert.equal(s.region,destination===3?6:16);assert.equal(s.environment.earthRendered,destination!==3);report.routes.push(s);console.log('Arrived '+s.region+'; '+Math.round(s.metres)+' m');
 }
 assert.ok(report.samples.some(s=>s.shade>0&&s.shade<1));assert.ok(report.routes[0].metres>350);assert.ok(report.routes[1].metres-report.routes[0].metres>350);
 const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await phone.goto(origin+'/roam.html');await phone.waitForFunction(()=>window.__roamDiagnostics?.().ready);await select(phone,3,'jump');
 for(const [width,height] of [[320,568],[390,844],[844,390]]){await phone.setViewportSize({width,height});await phone.waitForTimeout(200);assert.equal((await state(phone)).environment.earthRendered,false);const buttons=await phone.locator('#pad button').evaluateAll(bs=>bs.map(b=>{const r=b.getBoundingClientRect();return r.top>=0&&r.bottom<=visualViewport.height+.5&&r.left>=0&&r.right<=visualViewport.width+.5&&document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===b;}));assert.ok(buttons.every(Boolean));await phone.screenshot({path:path.join(output,'change6-phone-'+width+'.png')});}
 assert.deepEqual(report.errors,[]);report.status='PASS';fs.writeFileSync(path.join(output,'verification.json'),JSON.stringify(report,null,2));console.log('PASS Chang’e 6 model, codex, route round trip, lighting, Earth occlusion, save and mobile');
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
