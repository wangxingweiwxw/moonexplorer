/* Shared save adapter. Guest keys stay intact; signed-in caches are namespaced by verified user ID. */
(() => {
 'use strict';
 const slots={'moonexplorer-v3':'2D / 3D 探险','moonexplorer-colony-v1':'月球殖民','moonexplorer-connected-drive-v1':'全月漫游','moonexplorer-rover-codex-v1':'月球车图鉴','moonexplorer-connected-codex-v1':'漫游图鉴','moonexplorer-pinball-best':'弹珠台最高分'};
 const ACTIVE='moon-account-active-v1', records=new Map(),used=new Set();let user=null,csrf=null,online=false,configured=false,halt=false,busy=false,timer,notice='本地存档',ready;
 const read=k=>{try{return localStorage.getItem(k);}catch{return null;}};
 const parse=v=>{try{return JSON.parse(v);}catch{return null;}};
 const key=k=>'moon-cloud-v1:'+user.id+':'+k;
 const stamp=()=>crypto.randomUUID?.()||Date.now()+'-'+Math.random();
 const blank=()=>({data:null,revision:0,dirty:false,stamp:stamp()});
 const changed=()=>window.dispatchEvent(new Event('moon-save-status'));
 function store(k,r){localStorage.setItem(key(k),JSON.stringify(r));records.set(k,r);changed();}
 async function api(path,options={}){
  const r=await fetch('/api/moon/'+path,{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(7000),...options,headers:{'Content-Type':'application/json',...(user?{'X-Moon-User':user.id,'X-Moon-CSRF':csrf||''}:{}),...options.headers}});
  let b;try{b=await r.json();}catch{throw Error('账号服务未部署，进度仍保存在本机');}
  if(!r.ok)throw Object.assign(Error(b.error||'云存档暂时不可用'),{status:r.status,conflict:b.conflict});return b;
 }
 function schedule(){clearTimeout(timer);if(user&&online&&!halt)timer=setTimeout(flush,2500);}
 function hold(message){halt=true;notice=message;changed();}
 async function bootstrap(){
  if(location.protocol==='file:'){notice='离线文件 · 本地存档';return;}
  try{
   const s=await api('session');configured=s.configured;user=s.user;csrf=s.csrf;online=!!user;
   try{localStorage.setItem(ACTIVE,JSON.stringify(user));}catch{}
  }catch{user=parse(read(ACTIVE));online=false;notice=user?'离线 · 使用此账号的本机缓存':'本地存档 · 账号服务暂不可用';}
  if(user&&!/^[a-f0-9]{64}$/.test(user.id)){user=null;online=false;}
  if(!user)return;
  for(const k of Object.keys(slots)){const r=parse(read(key(k)));records.set(k,r&&typeof r.revision==='number'?r:blank());}
  if(!online)return;
  try{
   const remote=(await api('saves')).saves;
   for(const k of Object.keys(slots)){
    const local=records.get(k),cloud=remote[k];
    if(local.dirty){
     if(cloud?.data===local.data)store(k,{...cloud,dirty:false,stamp:stamp()});
     else if((cloud?.revision||0)!==local.revision){local.conflict=true;store(k,local);}
    }else if(cloud&&(cloud.revision!==local.revision||cloud.data!==local.data))store(k,{...cloud,dirty:false,stamp:stamp()});
   }
   notice='已登录 · 自动云存档';schedule();
  }catch(e){online=false;notice=e.message;}
 }
 function getItem(k){used.add(k);if(!Object.hasOwn(slots,k))return read(k);return user?records.get(k)?.data??null:read(k);}
 function setItem(k,data){
  if(!Object.hasOwn(slots,k))throw Error('未知存档类型');if(halt)throw Error(notice);data=String(data);
  if(!user){localStorage.setItem(k,data);changed();return;}
  const r=records.get(k)||blank(),disk=parse(read(key(k)));
  if(disk&&disk.stamp!==r.stamp){hold('其他标签页已更新此存档，请刷新后继续，避免覆盖进度');throw Error(notice);}
  if(r.data===data)return;
  notice=online?'已保存本机 · 待同步':'离线 · 已保存到账号本机缓存';store(k,{...r,data,dirty:true,stamp:stamp()});schedule();
 }
 async function flush(){
  if(busy||halt||!user||!online)return;busy=true;
  try{
   for(const [k,r] of records){
    if(!r.dirty||r.conflict||halt)continue;
    try{
     const result=await api('saves/'+encodeURIComponent(k),{method:'PUT',body:JSON.stringify({data:r.data,revision:r.revision})});
     if(halt)break;
     const current=records.get(k),disk=parse(read(key(k)));
     if(disk?.stamp!==current.stamp){hold('其他标签页已更新存档，请刷新后继续');break;}
     store(k,{...current,revision:result.revision,updatedAt:result.updatedAt,dirty:current.data!==r.data,stamp:stamp()});
     notice='云存档已同步';
    }catch(e){
     if(e.conflict){store(k,{...records.get(k),conflict:true});notice='云端有其他进度，请在账号页面选择保留版本';}
     else{notice=e.message;if(e.status===401||e.status===409){online=false;csrf=null;}break;}
    }
   }
  }finally{busy=false;changed();if(online&&!halt&&[...records.values()].some(r=>r.dirty&&!r.conflict))timer=setTimeout(flush,30000);}
 }
 function status(){return {user,online,configured,halt,notice,busy,slots:Object.entries(slots).map(([k,name])=>({key:k,name,guest:read(k)!==null,...(user?records.get(k):{data:read(k)})}))};}
 async function login(){await ready;if(!configured)throw Error('账号服务尚未完成配置，请先继续使用游客本地存档');await flush();const r=await api('login',{method:'POST',body:'{}'});const target=new URL(r.url);if(target.origin!=='https://openapi.zhihu.com'||target.pathname!=='/authorize')throw Error('授权地址无效，请稍后重试');location.assign(target.href);}
 async function logout(){await flush();if(user&&online)await api('logout',{method:'POST',body:'{}'});else if(user)throw Error('请联网并重新登录后退出，以确认服务器会话已结束');halt=true;localStorage.setItem(ACTIVE,'null');location.assign('./account.html');}
 function backup(k){const r=records.get(k);if(!r?.data)return;const name='moon-backup-v1:'+user.id+':'+k,list=parse(read(name))||[];list.unshift({at:Date.now(),data:r.data});localStorage.setItem(name,JSON.stringify(list.slice(0,5)));}
 async function resolve(k,choice){
  if(!user||!online||halt)throw Error('请重新登录或刷新后操作');if(busy)throw Error('正在同步，请稍后重试');
  const cloud=(await api('saves')).saves[k];
  const local=records.get(k);backup(k);
  if(choice==='cloud'){
   if(!cloud)throw Error('此模式暂无云存档');halt=true;store(k,{...cloud,dirty:false,stamp:stamp()});location.reload();return;
  }
  const data=choice==='guest'?read(k):local.data;if(data===null)throw Error('没有可导入的存档');
  // Explicit version selection; revision CAS still protects against a later device write.
  store(k,{data,revision:cloud?.revision||0,dirty:true,conflict:false,stamp:stamp()});await flush();
 }
 function exportLocal(k){const data=getItem(k);if(data===null)throw Error('暂无存档');const a=document.createElement('a'),u=URL.createObjectURL(new Blob([data],{type:'application/json'}));a.href=u;a.download=k+'-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
 ready=bootstrap().catch(()=>{notice='无法同步 · 本地存档仍可使用';}).finally(changed);
 window.MoonSave={ready,getItem,setItem,status,flush,login,logout,resolve,exportLocal};
 window.addEventListener('storage',e=>{
  if(e.key===ACTIVE&&JSON.stringify(user)!==e.newValue)hold('账号已在其他页面切换，请刷新后继续');
  if(user&&e.key?.startsWith('moon-cloud-v1:'+user.id+':')){const k=e.key.slice(('moon-cloud-v1:'+user.id+':').length);if(used.has(k))hold('其他页面已更新当前游戏存档，请刷新后继续');else{const r=parse(e.newValue);if(r)records.set(k,r);changed();}}
 });
 window.addEventListener('online',()=>{notice='网络已恢复，请刷新以核验账号并同步';changed();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)flush();});
 function mount(){
  if(document.body.dataset.accountPage)return;
  const parent=document.querySelector('.gate-bar')||document.querySelector('.bottom-bar nav')||document.querySelector('#backBtn')?.parentElement||document.querySelector('header');
  const parents=[...new Set([parent,document.querySelector('.top-actions')].filter(Boolean))];
  for(const mount of parents){
   const compact=mount.matches('.top-actions'),link=document.createElement('a');link.className='moon-account-link';link.href='./account.html';link.textContent='账号 / 存档';link.setAttribute('aria-label','知乎账号与存档');mount.append(link);
   const update=()=>{link.textContent=compact?(halt?'存档 !':'账号'):halt?'存档待处理':user?(online?'云存档':'存档待同步'):'登录 / 本地存档';link.title=notice;link.classList.toggle('moon-account-alert',halt||[...records.values()].some(r=>r.conflict));};ready.then(update);window.addEventListener('moon-save-status',update);
  }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
