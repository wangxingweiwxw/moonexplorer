import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {handle,SLOTS} from '../server/worker.mjs';
const sqlite=new DatabaseSync(':memory:');sqlite.exec(readFileSync(new URL('../server/schema.sql',import.meta.url),'utf8'));
const DB={prepare(sql){return {bind(...args){const stmt=sqlite.prepare(sql);return {async first(){return stmt.get(...args)||null;},async all(){return {results:stmt.all(...args)};},async run(){return stmt.run(...args);}};}};}};
const env={DB,PUBLIC_ORIGIN:'https://moon.chipai.cc',ZHIHU_APP_ID:'849',ZHIHU_APP_KEY:'test-only-secret',ZHIHU_REDIRECT_URI:'https://moon.chipai.cc/zhihu-callback'};
const origin=env.PUBLIC_ORIGIN;let providerCalls=0;
const fetcher=id=>async(url,options)=>{providerCalls++;if(url.endsWith('access_token')){assert.equal(new URLSearchParams(options.body).get('app_key'),env.ZHIHU_APP_KEY);return Response.json({code:20000,data:{access_token:'provider-secret-token',expires_in:3600}});}assert.equal(options.headers.Authorization,'Bearer provider-secret-token');return Response.json({code:20000,data:{hash_id:id,fullname:'User '+id}});};
const request=(path,method='GET',data,headers={})=>new Request(origin+path,{method,headers:{Origin:origin,'Content-Type':'application/json',...headers},...(data===undefined?{}:{body:JSON.stringify(data)})});
function responseCookie(r,name){return r.headers.getSetCookie().find(c=>c.startsWith(name+'=')).split(';')[0];}
async function start(){const r=await handle(request('/api/moon/login','POST',{}),env);assert.equal(r.status,200);const b=await r.json();return {state:new URL(b.url).searchParams.get('state'),cookie:responseCookie(r,'__Host-moon_oauth')};}
async function login(id){const s=await start(),r=await handle(request('/zhihu-callback?authorization_code=test-code&state='+s.state,'GET',undefined,{Cookie:s.cookie}),env,fetcher(id));assert.equal(r.status,303);assert.equal(r.headers.get('Location'),origin+'/account.html?login=success');assert.ok(!r.headers.get('Set-Cookie').includes('provider-secret-token'));const cookie=responseCookie(r,'__Host-moon_session'),session=await (await handle(request('/api/moon/session','GET',undefined,{Cookie:cookie}),env)).json();return {cookie,session,headers:{Cookie:cookie,'X-Moon-User':session.user.id,'X-Moon-CSRF':session.csrf}};}
assert.equal((await handle(request('/api/moon/login','POST',{}),{...env,ZHIHU_APP_KEY:''})).status,503);
assert.equal((await handle(request('/api/moon/login','POST',{}, {Origin:'https://evil.example'}),env)).status,403);
const pending=await start();let r=await handle(request('/zhihu-callback?authorization_code=malicious','GET',undefined,{Cookie:pending.cookie}),env,fetcher('bad'));assert.equal(r.status,303);assert.ok(r.headers.get('Location').endsWith('login=invalid_state'));assert.equal(providerCalls,0);
r=await handle(request('/zhihu-callback?authorization_code=malicious&state=wrong','GET',undefined,{Cookie:pending.cookie}),env,fetcher('bad'));assert.equal(r.status,303);assert.ok(r.headers.get('Location').endsWith('login=invalid_state'));assert.equal(providerCalls,0);
const callback=request('/zhihu-callback?authorization_code=real&state='+pending.state,'GET',undefined,{Cookie:pending.cookie});assert.equal((await handle(callback,env,fetcher('A'))).status,303);assert.ok((await handle(callback,env,fetcher('A'))).headers.get('Location').endsWith('login=invalid_state'));
const a=await login('A'),again=await login('A'),b=await login('B');assert.equal(a.session.user.id,again.session.user.id);assert.notEqual(a.session.user.id,b.session.user.id);
const slot=SLOTS[0],data=JSON.stringify({level:2,unlocked:['test']}),put=(revision,headers=a.headers)=>handle(request('/api/moon/saves/'+slot,'PUT',{revision,data},headers),env);
assert.equal((await put(0,{})).status,401);assert.equal((await put(0,{...a.headers,'X-Moon-CSRF':'wrong'})).status,403);assert.equal((await put(0,{...a.headers,'X-Moon-User':b.session.user.id})).status,409);
assert.equal((await put(0)).status,200);assert.equal((await put(0)).status,409);
const races=await Promise.all([put(1),put(1)]);assert.deepEqual(races.map(r=>r.status).sort(),[200,409]);
const get=async(who)=>(await (await handle(request('/api/moon/saves','GET',undefined,who.headers),env)).json()).saves;
assert.deepEqual(await get(b),{});assert.equal((await get(again))[slot].revision,2);
assert.equal((await handle(request('/api/moon/saves/arbitrary','PUT',{revision:0,data},a.headers),env)).status,400);
assert.equal((await handle(request('/api/moon/saves/'+slot,'PUT',{revision:2,data:'x'.repeat(530000)},a.headers),env)).status,413);
assert.equal((await handle(request('/api/moon/logout','POST',{},a.headers),env)).status,200);assert.equal((await put(2)).status,401);
assert.ok(!(JSON.stringify(await get(again))).includes(env.ZHIHU_APP_KEY));sqlite.close();
console.log('PASS OAuth binding/replay, fail-closed configuration, stable identity, account isolation, CSRF, stale-session account mismatch, atomic save conflicts, limits and logout. Provider is mocked, not live OAuth.');
