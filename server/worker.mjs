// Same-origin OAuth and save API. No provider credentials or tokens reach the browser.
export const SLOTS = ['moonexplorer-v3','moonexplorer-colony-v1','moonexplorer-connected-drive-v1','moonexplorer-rover-codex-v1','moonexplorer-connected-codex-v1','moonexplorer-pinball-best'];
const MAX_BYTES=512*1024, TTL=3600, enc=new TextEncoder();
const random=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,'0')).join('');
export async function digest(s){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(s))),x=>x.toString(16).padStart(2,'0')).join('');}
const headers={'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
function json(data,status=200){return Response.json(data,{status,headers});}
function fail(status,error){throw Object.assign(new Error(error),{status,publicMessage:error});}
function cookie(req,name){const values=(req.headers.get('Cookie')||'').split(';').map(x=>x.trim()).filter(x=>x.startsWith(name+'='));const value=values.length===1?values[0].slice(name.length+1):'';return /^[a-f0-9]{64}$/.test(value)?value:'';}
function setCookie(name,value,seconds){return `${name}=${value}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${seconds}`;}
function configReady(e){
 try {const u=new URL(e.PUBLIC_ORIGIN);return !!e.ZHIHU_APP_KEY&&e.ZHIHU_APP_ID==='849'&&u.protocol==='https:'&&u.origin===e.PUBLIC_ORIGIN&&(!e.ZHIHU_REDIRECT_URI||e.ZHIHU_REDIRECT_URI===u.origin+'/zhihu-callback')&&!!e.DB;}catch{return false;}
}
async function body(req){
 if(!req.headers.get('Content-Type')?.startsWith('application/json'))fail(415,'需要 JSON 请求');
 const reader=req.body?.getReader();if(!reader)fail(400,'请求为空');let size=0,parts=[];
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_BYTES*2+4096){await reader.cancel();fail(413,'存档过大');}parts.push(value);}}finally{reader.releaseLock();}
 const bytes=new Uint8Array(size);let offset=0;for(const p of parts){bytes.set(p,offset);offset+=p.length;}
 try{return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));}catch{fail(400,'无效 JSON');}
}
function validateData(slot,data){
 if(typeof data!=='string'||enc.encode(data).length>MAX_BYTES)fail(413,'存档过大或格式不正确');
 if(slot==='moonexplorer-pinball-best'){if(!/^\d{1,15}$/.test(data))fail(400,'无效分数');return;}
 let v;try{v=JSON.parse(data);}catch{fail(400,'存档不是 JSON');}
 if(!v||typeof v!=='object'||Array.isArray(v))fail(400,'无效存档');
 if(slot==='moonexplorer-colony-v1'&&(!Array.isArray(v.buildings)||!v.resources||!Number.isFinite(v.day)))fail(400,'无效殖民地存档');
 if(slot==='moonexplorer-connected-drive-v1'&&![v.x,v.z,v.yaw].every(Number.isFinite))fail(400,'无效漫游存档');
 if(slot.includes('codex')&&!Array.isArray(v.unlocked))fail(400,'无效图鉴存档');
}
async function providerJSON(url,options,fetcher){
 const r=await fetcher(url,{...options,redirect:'manual',signal:AbortSignal.timeout(10000)});
 if(!r.ok)fail(502,'知乎授权服务暂时不可用');
 try{
  const text=await r.text();if(text.length>128000)throw Error('size');
  // Zhihu uid can exceed Number.MAX_SAFE_INTEGER. Keep its original digits.
  const value=JSON.parse(text,(_key,v,context)=>typeof v==='number'&&Number.isInteger(v)&&!Number.isSafeInteger(v)?context?.source??null:v);
  if(!value||typeof value!=='object'||Array.isArray(value)||(value.code!=null&&![0,200,20000].includes(Number(value.code))))throw Error('provider');
  return value;
 }catch{fail(502,'知乎授权响应格式异常');}
}
export function profileIdentity(payload){
 const data=payload.data&&typeof payload.data==='object'?payload.data:payload;
 const user=data.user&&typeof data.user==='object'?data.user:data;
 let id=typeof user.hash_id==='string'&&/^[a-zA-Z0-9_-]{1,160}$/.test(user.hash_id)?user.hash_id:null;
 if(!id&&((typeof user.uid==='string'&&/^\d{1,30}$/.test(user.uid))||(Number.isSafeInteger(user.uid)&&user.uid>0)))id=String(user.uid);
 if(!id)fail(502,'未获得稳定的知乎用户标识');
 return {id,name:typeof user.fullname==='string'&&user.fullname.trim()?user.fullname.trim().slice(0,80):'知乎用户'};
}
function callbackResult(origin,result,sessionCookie){
 const h=new Headers({...headers,Location:origin+'/account.html?login='+result});
 h.append('Set-Cookie',setCookie('__Host-moon_oauth','',0));if(sessionCookie)h.append('Set-Cookie',sessionCookie);
 return new Response(null,{status:303,headers:h});
}
export async function handle(request,env,fetcher=fetch){
 try{
  const url=new URL(request.url),path=url.pathname,now=Math.floor(Date.now()/1000),origin=env.PUBLIC_ORIGIN||'https://moon.chipai.cc';
  if(url.origin!==origin)fail(403,'请在正式网站使用账号功能');
  if(!env.DB)return json({error:'云存档尚未配置',configured:false},503);
  const db=env.DB,query=(sql,...v)=>db.prepare(sql).bind(...v);
  if(!['GET','POST','PUT'].includes(request.method))fail(405,'不支持此操作');
  if(request.method!=='GET'&&request.headers.get('Origin')!==origin)fail(403,'跨站请求已拒绝');
  if(request.headers.get('Sec-Fetch-Site')==='cross-site'&&path!=='/zhihu-callback')fail(403,'跨站请求已拒绝');
  if(path==='/api/moon/login'&&request.method==='POST'){
   if(!configReady(env))return json({error:'知乎登录尚未配置完成，游客本地存档可正常使用。',configured:false},503);
   const ip=request.headers.get('CF-Connecting-IP')||'unknown',bucket=await digest(ip+':'+Math.floor(now/600));
   await query('DELETE FROM login_limits WHERE expires < ?',now).run();
   const limit=await query('INSERT INTO login_limits(bucket,count,expires) VALUES (?,1,?) ON CONFLICT(bucket) DO UPDATE SET count=count+1 RETURNING count',bucket,now+600).first();
   if(limit.count>10)fail(429,'登录过于频繁，请稍后重试');
   await query('DELETE FROM oauth_pending WHERE expires < ?',now).run();
   const state=random(),browser=random();
   const old=cookie(request,'__Host-moon_oauth');if(old)await query('DELETE FROM oauth_pending WHERE browser_hash=?',await digest(old)).run();
   await query('INSERT INTO oauth_pending(browser_hash,state_hash,expires) VALUES (?,?,?)',await digest(browser),await digest(state),now+600).run();
   const auth=new URL('https://openapi.zhihu.com/authorize');auth.search=new URLSearchParams({app_id:env.ZHIHU_APP_ID,redirect_uri:origin+'/zhihu-callback',response_type:'code',state}).toString();
   const r=json({url:auth.href});r.headers.append('Set-Cookie',setCookie('__Host-moon_oauth',browser,600));return r;
  }
  if(path==='/zhihu-callback'&&request.method==='GET'){
   if(!configReady(env))fail(503,'知乎登录尚未完成配置');
   const browser=cookie(request,'__Host-moon_oauth'),state=url.searchParams.get('state'),code=url.searchParams.get('authorization_code')||url.searchParams.get('code');
   if(!browser||!state||!/^[a-f0-9]{64}$/.test(state)||url.searchParams.getAll('state').length!==1)return callbackResult(origin,'invalid_state');
   // Atomic consumption prevents callback replay and parallel exchanges.
   const pending=await query('DELETE FROM oauth_pending WHERE browser_hash=? AND state_hash=? AND expires>? RETURNING browser_hash',await digest(browser),await digest(state),now).first();
   if(!pending)return callbackResult(origin,'invalid_state');
   if(url.searchParams.has('error'))return callbackResult(origin,'cancelled');
   if(!code||code.length>4096||url.searchParams.getAll('authorization_code').length>1||url.searchParams.getAll('code').length>1)return callbackResult(origin,'invalid_code');
   const result=await providerJSON('https://openapi.zhihu.com/access_token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({app_id:env.ZHIHU_APP_ID,app_key:env.ZHIHU_APP_KEY,grant_type:'authorization_code',redirect_uri:origin+'/zhihu-callback',code})},fetcher);
   const token=result.access_token||result.data?.access_token;
   const lifetime=Number(result.expires_in??result.data?.expires_in);
   if(typeof token!=='string'||!token||token.length>8192||!Number.isFinite(lifetime)||lifetime<1)fail(502,'未获得有效授权令牌');
   // Same basic-profile contract as the working 3Dschool integration.
   const profile=profileIdentity(await providerJSON('https://openapi.zhihu.com/user',{headers:{Authorization:'Bearer '+token,Accept:'application/json'}},fetcher));
   const uid=await digest('zhihu:849:'+profile.id),name=profile.name;
   const sid=random(),csrf=random(),expires=now+Math.min(TTL,Math.floor(lifetime));
   const old=cookie(request,'__Host-moon_session');if(old)await query('DELETE FROM sessions WHERE token_hash=?',await digest(old)).run();
   await query('DELETE FROM sessions WHERE expires < ?',now).run();
   await query('INSERT INTO sessions(token_hash,user_id,name,csrf,expires) VALUES (?,?,?,?,?)',await digest(sid),uid,name,csrf,expires).run();
   return callbackResult(origin,'success',setCookie('__Host-moon_session',sid,expires-now));
  }
  const token=cookie(request,'__Host-moon_session');
  const session=token?await query('SELECT user_id,name,csrf,expires FROM sessions WHERE token_hash=? AND expires>?',await digest(token),now).first():null;
  if(path==='/api/moon/session'&&request.method==='GET')return json({configured:configReady(env),user:session?{id:session.user_id,name:session.name}:null,csrf:session?.csrf||null});
  if(!session)fail(401,'登录已失效，请重新授权；本机进度仍保留');
  if(request.headers.get('X-Moon-User')!==session.user_id)fail(409,'账号已切换，请刷新页面');
  if(request.method!=='GET'&&request.headers.get('X-Moon-CSRF')!==session.csrf)fail(403,'安全校验失败，请刷新页面');
  if(path==='/api/moon/logout'&&request.method==='POST'){
   await query('DELETE FROM sessions WHERE token_hash=?',await digest(token)).run();const r=json({ok:true});r.headers.append('Set-Cookie',setCookie('__Host-moon_session','',0));return r;
  }
  if(path==='/api/moon/saves'&&request.method==='GET'){
   const {results}=await query('SELECT slot,data,revision,updated_at FROM saves WHERE user_id=?',session.user_id).all();return json({saves:Object.fromEntries(results.map(s=>[s.slot,{data:s.data,revision:s.revision,updatedAt:s.updated_at}]))});
  }
  if(path.startsWith('/api/moon/saves/')&&request.method==='PUT'){
   const slot=decodeURIComponent(path.slice('/api/moon/saves/'.length));if(!SLOTS.includes(slot))fail(400,'未知存档类型');
   const b=await body(request);if(!Number.isSafeInteger(b.revision)||b.revision<0)fail(400,'无效存档版本');validateData(slot,b.data);
   let row;
   if(b.revision===0)row=await query('INSERT INTO saves(user_id,slot,data,revision,updated_at) VALUES (?,?,?,1,?) ON CONFLICT(user_id,slot) DO NOTHING RETURNING revision,updated_at',session.user_id,slot,b.data,now).first();
   else row=await query('UPDATE saves SET data=?,revision=revision+1,updated_at=? WHERE user_id=? AND slot=? AND revision=? RETURNING revision,updated_at',b.data,now,session.user_id,slot,b.revision).first();
   if(!row)return json({error:'云端有更新，未覆盖任何存档',conflict:true},409);
   return json({revision:row.revision,updatedAt:row.updated_at});
  }
  return json({error:'接口不存在'},404);
 }catch(e){if(new URL(request.url).pathname==='/zhihu-callback')return callbackResult(new URL(request.url).origin,'unavailable');return json({error:e.publicMessage||'服务暂时不可用，请稍后重试'},e.status||500);}
}
export default {fetch(request,env){
 const path=new URL(request.url).pathname;
 if(path.startsWith('/api/')||path==='/zhihu-callback')return handle(request,env);
 return env.ASSETS?env.ASSETS.fetch(request):new Response('Not found',{status:404,headers});
}};
