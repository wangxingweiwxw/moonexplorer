/* The rover's collection is separate from the 2D/3D main-story save. */
window.RoverCodex = (() => {
  'use strict';
  const DATA=window.ROVER_CODEX_DATA, cards=DATA.cards;
  const byId=new Map(cards.map(c=>[c.id,c]));
  const SAVE_KEY='moonexplorer-rover-codex-v1';
  let unlocked=new Set(),canSave=true,near=null,filter='all',returnFocus=null,onPause=()=>{};
  let dialog,body,heading,subtitle,filters,notice;
  const $=id=>document.getElementById(id);
  function el(tag,className,text) {
    const node=document.createElement(tag);if(className)node.className=className;
    if(text!==undefined)node.textContent=text;return node;
  }
  function readSave() {
    try {
      const raw=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');
      const ids=raw&&Array.isArray(raw.unlocked)?raw.unlocked:[];
      unlocked=new Set(ids.filter(id=>byId.has(id)));
    } catch (_) { unlocked=new Set(); }
  }
  function persist() {
    try { localStorage.setItem(SAVE_KEY,JSON.stringify({version:1,unlocked:[...unlocked]})); }
    catch (_) { canSave=false; }
  }
  function updateCount() {
    $('codexCount').textContent=unlocked.size+'/'+cards.length;
    $('codexBtn').setAttribute('aria-label','月面图鉴，已收录 '+unlocked.size+' / '+cards.length);
  }
  function sourceBadge(c) {
    return c.kind==='hot'?'知乎热榜收录 · '+c.retrievedAt:'知乎相关内容';
  }
  function image(c,caption) {
    const frame=el('figure','codex-picture'),img=el('img');
    img.alt=c.title+'主题配图';img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';
    const label=el('figcaption','',c.imageLabel);
    if(c.imageSource){
      const credit=el('a','',c.imageLabel);credit.href=c.imageSource;credit.target='_blank';credit.rel='noopener noreferrer';label.replaceChildren(credit);
    }
    img.addEventListener('error',()=>{
      if(img.dataset.fallback){img.hidden=true;return;}
      img.dataset.fallback='true';img.src=c.fallback;label.textContent='主题配图';
    });
    img.src=c.image;frame.append(img);if(caption)frame.append(label);return frame;
  }
  function link(text,url,primary) {
    const a=el('a',primary?'codex-source primary':'codex-source',text);
    const parsed=new URL(url);
    if(parsed.protocol!=='https:'||!(parsed.hostname==='zhihu.com'||parsed.hostname.endsWith('.zhihu.com')))return el('span','','来源暂不可用');
    a.href=parsed.href;a.target='_blank';a.rel='noopener noreferrer';return a;
  }
  function open() {
    if(!dialog.open){returnFocus=document.activeElement;onPause();dialog.showModal();}
    document.documentElement.classList.add('codex-open');
    notice.textContent=canSave?'图鉴会保存在本机；重新出发和切换任务不影响已收录内容。':'浏览器未允许保存，本次收录可能在刷新后丢失。';
    body.scrollTop=0;
  }
  function close() { if(dialog.open)dialog.close(); }
  function renderGallery() {
    heading.textContent='月面探索图鉴';subtitle.textContent='已收录 '+unlocked.size+' / '+cards.length+' · 抵达采样点自动收录，观星点按 E 收录。';
    filters.hidden=false;body.replaceChildren();
    for(const b of filters.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.filter===filter));
    const grid=el('div','rover-card-grid');
    const list=cards.filter(c=>filter==='all'||(filter==='unlocked'?unlocked.has(c.id):String(c.mission)===filter))
      .sort((a,b)=>Number(unlocked.has(b.id))-Number(unlocked.has(a.id)));
    if(!list.length)body.append(el('p','codex-empty','还没有收录图鉴。出发营地旁的望远镜，可以开启第一份星空档案。'));
    list.forEach(c=>{
      const got=unlocked.has(c.id),card=el('article','rover-card'+(got?'':' is-locked'));
      const button=el('button','codex-card-button');button.type='button';button.disabled=!got;
      button.dataset.card=c.id;button.setAttribute('aria-label',c.title+(got?'，阅读图鉴':'，尚未解锁'));
      button.append(image(c,false));
      const content=el('div','codex-card-content');
      content.append(el('span','codex-badge'+(c.kind==='hot'?' hot':''),sourceBadge(c)));
      content.append(el('h3','',c.title));
      content.append(el('p','codex-location',(c.mission?'阿波罗 '+c.mission+' · ':'')+c.location));
      content.append(el('p','codex-card-topic',got?c.topic:'抵达此处，收录对应知乎话题'));
      content.append(el('span','codex-card-state',got?'已收录 · 阅读档案 ↗':'尚未收录'));
      button.append(content);card.append(button);grid.append(card);
    });
    body.append(grid);open();
  }
  function showCard(id) {
    const c=byId.get(id);if(!c||!unlocked.has(id))return;
    heading.textContent=c.title;subtitle.textContent=(c.mission?'阿波罗 '+c.mission+' · ':'')+c.location;
    filters.hidden=true;body.replaceChildren();
    const back=el('button','codex-back','← 全部图鉴');back.type='button';back.onclick=renderGallery;
    const article=el('article','codex-detail');article.append(image(c,true));
    const text=el('div','codex-detail-text');
    text.append(el('span','codex-badge'+(c.kind==='hot'?' hot':''),sourceBadge(c)));
    text.append(el('h3','codex-topic',c.topic));
    text.append(el('p','codex-summary',c.summary));
    text.append(el('p','codex-credit',(c.answerUrl?'参考回答':'内容作者')+' · '+c.author));
    const links=el('div','codex-links');links.append(link(c.kind==='hot'?'在知乎查看话题 ↗':'在知乎阅读原文 ↗',c.url,true));
    if(c.answerUrl)links.append(link('阅读参考回答 ↗',c.answerUrl,false));
    text.append(links);
    text.append(el('p','codex-source-note',c.kind==='hot'?'收录于 '+c.retrievedAt+' 的热榜快照；热度与讨论可能变化。简介为阅读导览。':'根据知乎检索摘要整理的阅读导览，完整论述请查看原文。检索于 '+c.retrievedAt+'。'));
    article.append(text);body.append(back,article);open();
  }
  function unlock(id) {
    if(!byId.has(id)||unlocked.has(id))return false;
    unlocked.add(id);persist();updateCount();
    $('codexAnnouncement').textContent='新图鉴已收录：'+byId.get(id).title;
    renderNearby();return true;
  }
  function renderNearby() {
    const panel=$('nearbyCodex');panel.hidden=!near;document.documentElement.classList.toggle('codex-nearby',!!near);if(!near)return;
    const c=byId.get(near),got=unlocked.has(near);panel.replaceChildren();
    panel.append(image(c,false));const text=el('span','nearby-copy');
    text.append(el('small','',got?'已收录 · E 阅读':'发现观测点 · E 收录'));
    text.append(el('strong','',c.title));
    text.append(el('span','',c.kind==='hot'?'知乎热榜 · '+c.retrievedAt:'知乎科普图鉴'));
    panel.append(text);panel.setAttribute('aria-label',(got?'阅读图鉴：':'收录图鉴：')+c.title);
  }
  function setNearby(id) {
    const next=byId.has(id)?id:null;if(next===near)return;near=next;renderNearby();
  }
  function activateNearby() { if(near){unlock(near);showCard(near);} }
  function init(pause) {
    onPause=pause;dialog=$('roverCodexDialog');body=$('roverCodexBody');heading=$('roverCodexTitle');
    subtitle=$('roverCodexSubtitle');filters=$('roverCodexFilters');notice=$('roverCodexNotice');
    readSave();updateCount();
    $('codexBtn').onclick=()=>{filter='all';renderGallery();};
    $('roverCodexClose').onclick=close;$('roverCodexResume').onclick=close;$('nearbyCodex').onclick=activateNearby;
    body.addEventListener('click',e=>{const button=e.target.closest('[data-card]');if(button)showCard(button.dataset.card);});
    filters.addEventListener('click',e=>{const b=e.target.closest('[data-filter]');if(b){filter=b.dataset.filter;renderGallery();}});
    dialog.addEventListener('keydown',e=>{if(!dialog.open)return;e.stopPropagation();if(e.key.toLowerCase()==='j'){e.preventDefault();close();}});
    dialog.addEventListener('close',()=>{
      if(dialog.open)return;
      onPause();document.documentElement.classList.remove('codex-open');
      if(returnFocus&&returnFocus.isConnected&&!returnFocus.hidden)returnFocus.focus({preventScroll:true});
    });
  }
  return Object.freeze({init,unlock,setNearby,activateNearby,showCard,
    openGallery:()=>{filter='all';renderGallery();},isOpen:()=>!!dialog?.open,
    forSpot:(mission,spot)=>cards.find(c=>c.mission===mission&&c.spot===spot),
    stats:()=>({unlocked:[...unlocked],total:cards.length,canSave})});
})();
