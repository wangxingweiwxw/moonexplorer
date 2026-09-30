const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'C:/Users/win/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),output=path.join(root,'_tmp/apollo-16-17');fs.mkdirSync(output,{recursive:true});
const server=http.createServer((req,res)=>{const f=path.join(root,decodeURIComponent(req.url.split('?')[0]));if(path.relative(root,f).startsWith('..')||!fs.existsSync(f)||!fs.statSync(f).isFile()){res.writeHead(404);return res.end();}res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.html':'text/html'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));});
const state=p=>p.evaluate(()=>__roamDiagnostics());
async function pad(page){const r=await page.evaluate(()=>[...document.querySelectorAll('#pad button')].map(b=>{const r=b.getBoundingClientRect();return{label:b.textContent,visible:r.x>=0&&r.y>=0&&r.right<=visualViewport.width+.5&&r.bottom<=visualViewport.height+.5,hit:document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)===b};}));for(const b of r)assert.ok(b.visible&&b.hit,JSON.stringify(r));return r;}
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true}),report={errors:[],routes:[],mobile:[]};
try{
 const context=await browser.newContext({viewport:{width:1440,height:900}}),p=await context.newPage();p.on('pageerror',e=>report.errors.push(String(e)));p.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());});
 await p.goto(origin+'/roam.html');await p.waitForFunction(()=>window.__roamDiagnostics?.().ready);let s=await state(p);assert.equal(s.region,15);assert.equal(s.codex.total,38);assert.equal(await p.locator('#rate,#speed,#spd').count(),0);assert.ok(s.regions[2].x>s.regions[1].x&&s.regions[1].z>s.regions[2].z);assert.ok(s.calls<250);
 assert.deepEqual(s.exhibits.map(e=>e.mission),[15,16,17,6,4,'bg1',3,5,'cy3','luna24','luna20','luna16','luna17','luna21',11,12,14,'surveyor1','surveyor3','surveyor5','surveyor6','surveyor7','luna9','luna13']);
 // Verify turn direction in the driver's frame: right = (-cos(yaw), sin(yaw)).
 for(const [key,sign] of [['a',-1],['d',1],['ArrowLeft',-1],['ArrowRight',1]]){
   await p.locator('#restartBtn').click();const before=(await state(p)).position;
   await p.keyboard.down('w');await p.keyboard.down(key);await p.waitForTimeout(900);await p.keyboard.up(key);await p.keyboard.up('w');
   const after=(await state(p)).position,right=-(after.x-before.x)*Math.cos(before.yaw)+(after.z-before.z)*Math.sin(before.yaw);
   assert.ok(right*sign>.08,key+' must move to driver-relative '+(sign<0?'left':'right')+': '+right);assert.ok((after.yaw-before.yaw)*sign<-.1);
 }
 await p.locator('#restartBtn').click();
 await p.screenshot({path:path.join(output,'connected-start.png')});await p.locator('#heritageBtn').click();assert.equal((await state(p)).heritage,false);assert.ok((await state(p)).exhibits.every(e=>!e.ascent));await p.screenshot({path:path.join(output,'descent-relic.png')});await p.locator('#heritageBtn').click();
 await p.keyboard.down('w');await p.waitForTimeout(2600);await p.keyboard.up('w');await p.waitForTimeout(200);s=await state(p);assert.ok(s.metres>8);assert.ok(s.codex.unlocked.includes('falcon-lander'));await p.keyboard.press('e');assert.equal(await p.locator('#roverCodexDialog').isVisible(),true);assert.ok((await p.locator('#roverCodexBody').innerText()).includes('猎鹰'));await p.screenshot({path:path.join(output,'falcon-codex.png')});await p.locator('#roverCodexClose').click();
 await p.locator('#restartBtn').click();
 // Enter each new camp using the UI, approach its exhibit, and read the actual codex.
 for(const [i,id,name] of [[1,'orion-lander','猎户座'],[2,'challenger-lander','挑战者']]){
   await p.locator('#mapBtn').click();await p.locator(`[data-region="${i}"]`).click();await p.locator('[data-action="jump"]').click();await p.waitForTimeout(300);
   await p.screenshot({path:path.join(output,'camp-'+(i+15)+'.png')});
   await p.keyboard.down('w');await p.waitForTimeout(2800);await p.keyboard.up('w');await p.waitForTimeout(200);
   assert.ok((await state(p)).codex.unlocked.includes(id));await p.keyboard.press('e');assert.ok((await p.locator('#roverCodexBody').innerText()).includes(name));
   assert.ok(await p.locator('#roverCodexBody img').evaluate(img=>img.complete&&img.naturalWidth>0));
   await p.screenshot({path:path.join(output,id+'.png')});await p.locator('#roverCodexClose').click();
 }
 await p.locator('#restartBtn').click();
 // Drive the three legs continuously through the actual input/navigation path; no teleport API.
 for(const i of (process.env.ROAM_REVERSE?[1,2,0]:[2,1,0])){await p.locator('#mapBtn').click();await p.locator(`[data-region="${i}"]`).click();await p.locator('[data-action="guide"]').click();await p.waitForTimeout(200);assert.equal((await state(p)).auto,true);await p.waitForFunction(()=>!__roamDiagnostics().auto,null,{timeout:95000});s=await state(p);assert.equal(s.region,[15,16,17][i]);report.routes.push(s);console.log('Driven to Apollo '+s.region+'; total '+Math.round(s.metres)+' m');await p.screenshot({path:path.join(output,'arrived-'+s.region+'.png')});}
 assert.deepEqual((await state(p)).visited.slice().sort(),[15,16,17]);assert.ok((await state(p)).tracks>100);const travelled=(await state(p)).metres;await p.reload();await p.waitForFunction(()=>window.__roamDiagnostics?.().ready);assert.ok((await state(p)).metres>=travelled-2);
 await p.locator('#mapBtn').click();await p.screenshot({path:path.join(output,'connected-map.png')});await p.locator('#historyBtn').click();assert.equal(await p.locator('.history-card').count(),24);await p.locator('#closeHistory').click();
 await p.goto(origin+'/rover.html');await p.waitForFunction(()=>window.__roverDiagnostics);for(const id of [16,17,15]){await p.locator('#m'+id).click();await p.waitForTimeout(100);assert.equal(await p.evaluate(()=>__roverDiagnostics().mission),id);}assert.equal(await p.evaluate(()=>__roverDiagnostics().codex.total),10);await p.keyboard.down('w');await p.waitForTimeout(400);await p.keyboard.up('w');assert.ok(await p.evaluate(()=>__roverDiagnostics().tracks>0));
 await context.close();
 const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),phone=await mobile.newPage();phone.on('pageerror',e=>report.errors.push(String(e)));await phone.goto(origin+'/roam.html');await phone.waitForFunction(()=>window.__roamDiagnostics?.().ready);
 for(const [width,height] of [[320,568],[390,844],[844,390]]){await phone.setViewportSize({width,height});await phone.waitForTimeout(150);report.mobile.push({width,height,buttons:await pad(phone)});await phone.screenshot({path:path.join(output,`phone-${width}.png`)});}
 await phone.setViewportSize({width:390,height:844});await phone.evaluate(()=>{Object.defineProperty(visualViewport,'height',{configurable:true,get:()=>640});visualViewport.dispatchEvent(new Event('resize'));});await phone.waitForTimeout(150);await pad(phone);await phone.screenshot({path:path.join(output,'phone-toolbar.png')});
 const r=await phone.locator('[data-hold="w"]').boundingBox(),cdp=await mobile.newCDPSession(phone);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width/2,y:r.y+r.height/2,id:1}]});await phone.waitForFunction(()=>__roamDiagnostics().metres>1,null,{timeout:5000});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.ok((await state(phone)).metres>1);
 for(const [key,sign] of [['a',-1],['d',1]]){
   // Two real touch points: throttle plus steering, matching the phone controls.
   await phone.locator('#restartBtn').click();const before=(await state(phone)).position;
   const a=await phone.locator('[data-hold="w"]').boundingBox(),b=await phone.locator(`[data-hold="${key}"]`).boundingBox();
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:a.x+a.width/2,y:a.y+a.height/2,id:1},{x:b.x+b.width/2,y:b.y+b.height/2,id:2}]});await phone.waitForFunction(({before,sign})=>{const a=__roamDiagnostics().position;return (-(a.x-before.x)*Math.cos(before.yaw)+(a.z-before.z)*Math.sin(before.yaw))*sign>.08;},{before,sign},{timeout:5000});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   const after=(await state(phone)).position,right=-(after.x-before.x)*Math.cos(before.yaw)+(after.z-before.z)*Math.sin(before.yaw);assert.ok(right*sign>.08,'touch '+key+' direction: '+right);
 }
 await phone.locator('#mapBtn').tap();await phone.locator('[data-region="1"]').tap();await phone.locator('[data-action="jump"]').tap();assert.equal((await state(phone)).region,16);await phone.locator('#codexBtn').tap();assert.equal(await phone.locator('.rover-card').count(),38);await phone.locator('#roverCodexClose').tap();await mobile.close();
 assert.deepEqual(report.errors,[]);report.status='PASS';fs.writeFileSync(path.join(output,process.env.ROAM_REVERSE?'verification-reverse.json':'verification.json'),JSON.stringify(report,null,2));console.log('PASS connected routes, shared scenes, codex, history, save, mobile and touch');
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
