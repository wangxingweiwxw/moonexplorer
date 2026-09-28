/* Short visual dialogue, shared by the sidebar and mobile advisor panel. */
(() => {
  'use strict';
  const active=new Map(),reduced=matchMedia('(prefers-reduced-motion: reduce)');
  function frame(large=false){
    const view=document.createElement('div');view.className='advisor-screen'+(large?' advisor-screen-large':'');
    const img=document.createElement('img');img.className=large?'advisor-large':'advisor-portrait';img.src='./assets/colony/advisor-fox-wide.png?v=20260927-advisor4';img.alt='佩戴耳麦的北极狐基地顾问';
    const signal=document.createElement('span');signal.className='advisor-signal';signal.setAttribute('aria-hidden','true');
    for(let i=0;i<5;i++)signal.append(document.createElement('i'));
    const label=document.createElement('span');label.className='advisor-state';label.textContent='待命';signal.append(label);view.append(img,signal);return view;
  }
  function cancel(view){const run=active.get(view);if(!run)return;cancelAnimationFrame(run.raf);run.ink.textContent=run.text;view.classList.remove('is-speaking');view.querySelector('.advisor-state').textContent='待命';active.delete(view);}
  function speak(view,paragraph,text,force=false){
    if(!force&&paragraph.dataset.message===text)return;
    cancel(view);paragraph.dataset.message=text;paragraph.classList.add('advisor-dialogue');paragraph.replaceChildren();
    // Reserve full text height to prevent controls jumping during typing.
    const accessible=document.createElement('span');accessible.className='sr-only';accessible.textContent=text;
    const reserve=document.createElement('span');reserve.className='dialogue-reserve';reserve.setAttribute('aria-hidden','true');reserve.textContent=text;
    const ink=document.createElement('span');ink.className='dialogue-ink';ink.setAttribute('aria-hidden','true');paragraph.append(accessible,reserve,ink);
    if(reduced.matches||document.hidden){ink.textContent=text;return;}
    const run={raf:0,ink,text,start:performance.now()},chars=Array.from(text),duration=Math.max(3000,Math.min(8500,chars.length*70));active.set(view,run);view.classList.add('is-speaking');view.querySelector('.advisor-state').textContent='通信中';
    function step(now){if(!view.isConnected||document.hidden||now-run.start>=duration){cancel(view);return;}ink.textContent=chars.slice(0,Math.ceil((now-run.start)/42)).join('');run.raf=requestAnimationFrame(step);}
    run.raf=requestAnimationFrame(step);
  }
  reduced.addEventListener('change',()=>{if(reduced.matches)for(const view of active.keys())cancel(view);});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)for(const view of active.keys())cancel(view);});
  window.ColonyAdvisor={frame,speak,cancel};
})();
