import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fixture,tokens} from './account-runtime-fixture.mjs';
import {digest} from '../server/worker.mjs';
const require=createRequire(import.meta.url),colony=require('../colony-sim.js');
let calls=0,exchanges=0,kind='normal';
const {mf,db,origin,owners}=await fixture({provider:async r=>{
 calls++;
 if(r.url==='https://openapi.zhihu.com/access_token'){
  exchanges++;const b=await r.formData();assert.equal(b.get('app_id'),'849');assert.equal(b.get('app_key'),'test-key');assert.equal(b.get('redirect_uri'),'https://moon.chipai.cc/zhihu-callback');assert.equal(b.get('code'),'code-test');
  if(kind==='expired')return Response.json({access_token:'token',expires_in:0});
  return Response.json({code:20000,data:{access_token:'token',expires_in:3600}});
 }
 assert.equal(r.url,'https://openapi.zhihu.com/user');assert.equal(r.headers.get('authorization'),'Bearer token');
 if(kind==='redirect')return new Response(null,{status:302,headers:{Location:'https://other.invalid/'}});
 if(kind==='error')return Response.json({code:20001,data:{uid:'123',fullname:'wrong'}});
 return new Response('{"code":20000,"data":{"uid":969570047710216200,"fullname":"正式格式用户","phone":"discard-this","email":"private@example.com"}}');
}});
let ip=1;
const dispatch=(path,options={})=>mf.dispatchFetch(origin+path,{...options,redirect:'manual'});
const cookie=(response,name)=>response.headers.getSetCookie().find(s=>s.startsWith(name+'='))?.split(';')[0];
async function start(){const r=await dispatch('/api/moon/login',{method:'POST',headers:{Origin:origin,'CF-Connecting-IP':'192.0.2.'+ip++}});assert.equal(r.status,200);const url=new URL((await r.json()).url);assert.equal(url.searchParams.get('app_id'),'849');return {state:url.searchParams.get('state'),cookie:cookie(r,'__Host-moon_oauth')};}
const callback=flow=>dispatch('/zhihu-callback?authorization_code=code-test&state='+flow.state,{headers:{Cookie:flow.cookie}});
async function api(path,{account='alice',method='GET',body,headers={}}={}){
 const r=await dispatch('/api/moon/'+path,{method,headers:{Origin:origin,...(account?{Cookie:'__Host-moon_session='+tokens[account],'X-Moon-User':owners[account],'X-Moon-CSRF':'test-csrf'}:{}),...(body!==undefined?{'Content-Type':'application/json'}:{}),...headers},...(body!==undefined?{body:JSON.stringify(body)}:{})});
 assert.equal(r.headers.get('cache-control'),'no-store');return {status:r.status,data:await r.json()};
}
try{
 const flow=await start();let r=await dispatch('/zhihu-callback?authorization_code=code-test',{headers:{Cookie:flow.cookie}});assert.match(r.headers.get('location'),/invalid_state$/);assert.equal(calls,0);
 r=await dispatch('/zhihu-callback?authorization_code=code-test&state='+flow.state+'&state='+flow.state,{headers:{Cookie:flow.cookie}});assert.match(r.headers.get('location'),/invalid_state$/);
 const results=await Promise.all([callback(flow),callback(flow)]);assert.equal(exchanges,1);
 const success=results.find(r=>r.headers.get('location').endsWith('success'));assert.ok(success);assert.ok(results.some(r=>r.headers.get('location').endsWith('invalid_state')));
 const sessionCookie=cookie(success,'__Host-moon_session');assert.ok(sessionCookie);assert.ok(success.headers.get('set-cookie').includes('HttpOnly'));
 const session=await (await dispatch('/api/moon/session',{headers:{Cookie:sessionCookie}})).json();assert.equal(session.user.id,owners.alice);assert.equal(session.user.name,'正式格式用户');
 const again=await callback(await start());const same=await (await dispatch('/api/moon/session',{headers:{Cookie:cookie(again,'__Host-moon_session')}})).json();assert.equal(same.user.id,session.user.id);
 for(kind of ['expired','redirect','error']){const invalid=await callback(await start());assert.match(invalid.headers.get('location'),/unavailable$/);assert.equal(cookie(invalid,'__Host-moon_session'),undefined);}kind='normal';
 const cancel=await start();r=await dispatch('/zhihu-callback?error=access_denied&state='+cancel.state,{headers:{Cookie:cancel.cookie}});assert.match(r.headers.get('location'),/cancelled$/);
 assert.equal((await api('saves',{account:null})).status,401);
 const saves={
  'moonexplorer-v3':JSON.stringify({cards:['test'],scene:2,score:42}),
  'moonexplorer-colony-v1':JSON.stringify(colony.create(123)),
  'moonexplorer-connected-drive-v1':JSON.stringify({version:2,x:1,z:2,yaw:.5,visited:['apollo15']}),
  'moonexplorer-rover-codex-v1':JSON.stringify({unlocked:['first-rover']}),
  'moonexplorer-connected-codex-v1':JSON.stringify({unlocked:['first-rover']}),
  'moonexplorer-pinball-best':'1234'
 };
 for(const [slot,data] of Object.entries(saves))assert.equal((await api('saves/'+slot,{method:'PUT',body:{data,revision:0}})).status,200);
 const loaded=(await api('saves',{account:'second'})).data.saves;for(const slot in saves)assert.equal(loaded[slot].data,saves[slot]);
 assert.deepEqual((await api('saves',{account:'bob'})).data.saves,{});
 const slot='moonexplorer-v3',body={data:JSON.stringify({scene:3}),revision:1};
 assert.equal((await api('saves/'+slot,{method:'PUT',body,headers:{Origin:'https://other.invalid'}})).status,403);
 assert.equal((await api('saves/'+slot,{method:'PUT',body,headers:{'X-Moon-CSRF':'wrong'}})).status,403);
 assert.equal((await api('saves/'+slot,{method:'PUT',body,headers:{'X-Moon-User':owners.bob}})).status,409);
 const race=await Promise.all([api('saves/'+slot,{method:'PUT',body}),api('saves/'+slot,{account:'second',method:'PUT',body})]);assert.deepEqual(race.map(r=>r.status).sort(),[200,409]);
 assert.equal((await api('saves/'+slot,{method:'PUT',body:{data:JSON.stringify({text:'x'.repeat(524288)}),revision:2}})).status,413);
 assert.equal((await api('saves/moonexplorer-colony-v1',{method:'PUT',body:{data:'{}',revision:1}})).status,400);
 assert.equal((await api('saves/not-a-mode',{method:'PUT',body})).status,400);
 const data=JSON.stringify({text:'🌙'.repeat(60000)});assert.equal((await api('saves/'+slot,{method:'PUT',body:{data,revision:2}})).status,200);assert.equal((await api('saves',{account:'second'})).data.saves[slot].data,data);
 await db.prepare('UPDATE sessions SET expires=0 WHERE token_hash=?').bind(await digest(tokens.alice)).run();assert.equal((await api('saves')).status,401);
 assert.equal((await api('logout',{account:'second',method:'POST'})).status,200);assert.equal((await api('saves',{account:'second'})).status,401);
 const rows=JSON.stringify((await db.prepare('SELECT * FROM sessions').all()).results);assert.ok(!rows.includes('discard-this')&&!rows.includes('private@example.com')&&!rows.includes('test-key'));
 console.log('PASS real workerd + D1: App 849 OAuth, raw int64 identity, repeated login, atomic state/replay, cancellation, provider rejection, all six save modes, two devices, account/CSRF isolation, CAS conflicts, Unicode/size validation, expiration and logout.');
}finally{await mf.dispose();}
