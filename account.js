(() => {
 const api=window.MoonSave,$=id=>document.getElementById(id);let working=false,message='';
 const url=new URL(location.href),result=url.searchParams.get('login');
 const outcomes={success:'知乎授权已完成。存档同步状态请查看下方各模式记录。',invalid_state:'授权请求已过期或校验失败，请重新发起知乎登录。',invalid_code:'未收到有效授权码，请重新登录。',cancelled:'已取消授权，可继续使用游客本地存档。',unavailable:'授权暂时未完成，请稍后重试，或检查服务端登录配置。'};
 if(result){message=outcomes[result]||'';url.searchParams.delete('login');history.replaceState(null,'',url.pathname+url.search+url.hash);}
 function node(tag,text){const n=document.createElement(tag);n.textContent=text;return n;}
 function action(label,fn,disabled=false){const b=node('button',label);b.disabled=disabled||working;b.onclick=()=>run(fn);return b;}
 async function run(fn){working=true;render();try{message='';await fn();}catch(e){message=e.message;}finally{working=false;render();}}
 function render(){
  const s=api.status();$('accountIdentity').textContent=s.user?'当前账号：'+s.user.name+(s.online?'':'（待重新验证）'):'当前为游客模式';$('accountStatus').textContent=message||s.notice;
  $('zhihuLogin').hidden=!!s.user&&s.online;$('zhihuLogin').disabled=working||!s.configured;$('cloudSync').hidden=!s.user;$('zhihuLogout').hidden=!s.user;
  $('cloudSync').disabled=working||!s.online||s.halt;$('zhihuLogout').disabled=working||!s.online;
  if(!s.configured&&!s.user)$('accountStatus').textContent=message||'登录服务尚未启用，本地存档功能正常。';
  const list=$('accountSlots');list.replaceChildren();
  for(const slot of s.slots){const card=node('section','');card.className='account-slot';card.append(node('h2',slot.name));
   const status=slot.conflict?'云端与本机进度不同，请选择保留版本':slot.data===null?'暂无当前账号存档':s.user?(slot.dirty?'本机有待同步进度':'已同步 / 已缓存'):'已有游客本地存档';const p=node('p',status);if(slot.conflict)p.className='account-warning';card.append(p);
   if(slot.updatedAt)card.append(node('small','云端保存时间：'+new Date(slot.updatedAt*1000).toLocaleString()));
   const buttons=node('div','');buttons.className='account-actions';buttons.append(action('导出本机备份',()=>api.exportLocal(slot.key),slot.data===null));
   if(s.user){
    const unavailable=!s.online||s.halt;
    buttons.append(action('导入游客存档',async()=>{if(confirm('将此浏览器的游客进度上传到当前知乎账号？已有云存档将被替换。'))await api.resolve(slot.key,'guest');},unavailable||!slot.guest));
    buttons.append(action('恢复云端版本',async()=>{if(confirm('以云端版本替换此账号的本机进度？当前版本会先备份在本机。'))await api.resolve(slot.key,'cloud');},unavailable));
    if(slot.conflict)buttons.append(action('保留本机版本',async()=>{if(confirm('以当前账号的本机版本覆盖云端进度？'))await api.resolve(slot.key,'local');},unavailable));
   }card.append(buttons);list.append(card);
  }
 }
 $('zhihuLogin').onclick=()=>run(()=>api.login());$('cloudSync').onclick=()=>run(()=>api.flush());$('zhihuLogout').onclick=()=>run(async()=>{if(confirm('退出知乎登录并切回游客存档？未同步的账号进度会保留在本机。'))await api.logout();});
 window.addEventListener('moon-save-status',render);api.ready.then(render);
})();
