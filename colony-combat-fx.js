/* Canvas combat presentation. Real-time visual ages are independent of the economic clock. */
(function(root){
 'use strict';
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 const noise=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
 function flightTime(shot){return clamp(.30+Math.hypot(shot.tx-shot.x,shot.ty-shot.y)*.065,.40,.82);}
 function duration(shot){return shot.weapon==='rocket'?flightTime(shot)+.72:shot.weapon==='arc'?.64:shot.weapon==='laser'?.46:.34;}
 function paint(c,shot,age,project,z){
  if(age<0||age>=duration(shot))return;
  const a=project(shot.x,shot.y),b=project(shot.tx,shot.ty),seed=shot.seed||1;
  a.y-=(shot.height||24)*z;b.y-=(shot.targetHeight||12)*z;
  const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len;
  const color=shot.enemy?'#ff9b66':shot.weapon==='arc'?'#60d9ff':'#d6ff87';
  c.save();c.lineCap='round';c.lineJoin='round';
  const line=(points,tint,width,alpha=1)=>{c.globalAlpha=clamp(alpha,0,1);c.strokeStyle=tint;c.lineWidth=width*z;c.beginPath();points.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();};
  const light=(p,r,tint,alpha=1)=>{c.globalAlpha=clamp(alpha,0,1);const g=c.createRadialGradient(p.x,p.y,0,p.x,p.y,r*z);g.addColorStop(0,'#fffbe9');g.addColorStop(.16,tint);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(p.x-r*z,p.y-r*z,r*z*2,r*z*2);};
  const sparks=(at,t,amount,tint,power=1)=>{if(t<0||t>.55)return;for(let i=0;i<amount;i++){
   const theta=noise(seed+i*17)*Math.PI*2,speed=(12+noise(seed+i*29)*26)*power;
   const vx=Math.cos(theta)*speed,vy=Math.sin(theta)*speed*.6-10;
   const p={x:at.x+vx*t*z,y:at.y+(vy*t+18*t*t)*z};
   const old=Math.max(0,t-.045);line([{x:at.x+vx*old*z,y:at.y+(vy*old+18*old*old)*z},p],tint,1,(1-t/.55)*.9);
  }};
  if(shot.weapon==='rocket'){
   const flight=flightTime(shot),t=clamp(age/flight,0,1),arc=Math.min(46,18+len/z*.085)*z;
   const at=q=>({x:a.x+dx*q,y:a.y+dy*q-4*arc*q*(1-q)});
   if(age<flight){
    const p=at(t),tangent={x:dx,y:dy-4*arc*(1-2*t)},angle=Math.atan2(tangent.y,tangent.x);
    // Sparse exhaust expands and disperses; it is not a terrestrial smoke column.
    for(let i=12;i>=1;i--){const q=t-i*.016;if(q<0)continue;const v=at(q),r=(1+i*.20)*z;c.globalAlpha=(1-i/14)*.22;c.fillStyle=i<5?'#ffc681':'#a6abb0';c.beginPath();c.ellipse(v.x,v.y,r,r*.65,angle,0,Math.PI*2);c.fill();}
    c.save();c.translate(p.x,p.y);c.rotate(angle);c.scale(z,z);c.globalAlpha=1;
    const flame=12+Math.sin(age*87+seed)*3;c.fillStyle='#ff803c';c.beginPath();c.moveTo(-5,-2);c.lineTo(-5-flame,0);c.lineTo(-5,2);c.fill();
    c.fillStyle='#fff2ba';c.beginPath();c.moveTo(-5,-.9);c.lineTo(-13,0);c.lineTo(-5,.9);c.fill();
    c.fillStyle='#879caa';c.beginPath();c.moveTo(-4,-1.5);c.lineTo(-7,-4);c.lineTo(-6,4);c.lineTo(-4,1.5);c.fill();
    c.fillStyle='#dbe6ea';c.fillRect(-5,-1.6,9,3.2);c.fillStyle=shot.enemy?'#dc795c':'#7bb8d1';c.beginPath();c.moveTo(4,-1.6);c.lineTo(8,0);c.lineTo(4,1.6);c.fill();c.restore();
    light(p,9,'#ffb464',.5);if(age<.13)light(a,12,'#ffd48c',1-age/.13);
   }else{
    const t=age-flight,p=project(shot.tx,shot.ty);if(t<.18)light(b,10+30*t/.18,'#ffbd66',1-t/.18);
    // Low ballistic ejecta with a short, flattened ground dust front.
    c.globalAlpha=.30*(1-t/.72);c.strokeStyle='#c3b29a';c.lineWidth=(3-2*t/.72)*z;c.beginPath();c.ellipse(p.x,p.y,(5+37*t)*z,(2+16*t)*z,0,0,Math.PI*2);c.stroke();
    sparks(b,t,17,'#ffdf9c',2.1);
    for(let i=0;i<10;i++){const angle=noise(seed+i*37)*Math.PI*2,v=15+noise(seed+i*11)*29,x=p.x+Math.cos(angle)*v*t*z,y=p.y+(Math.sin(angle)*v*.44*t-12*t+19*t*t)*z;c.globalAlpha=(1-t/.72)*.56;c.fillStyle=i%2?'#b8aa91':'#6c777b';c.fillRect(x,y,(1+noise(i+seed)*1.4)*z,1.2*z);}
   }
  }else if(shot.weapon==='arc'){
   if(age<.12){light(a,5+age*70,color,.5+age*3);}
   const active=age>=.12&&age<.36&&Math.floor((age-.12)/.045)%2===0;
   if(active){
    const phase=Math.floor(age*60),n=Math.max(6,Math.ceil(len/(17*z))),points=[a];
    for(let i=1;i<n;i++){const q=i/n,j=(noise(seed+i*7+phase*11)-.5)*9*z;points.push({x:a.x+dx*q-uy*j,y:a.y+dy*q+ux*j});}points.push(b);
    line(points,color,6,.14);line(points,color,2.1,.95);line(points,'#f2fdff',.8,1);
    for(let i=2;i<n-1;i+=3){const p=points[i],q=points[i+1],j=(noise(seed+i+phase)-.5)*22*z;line([p,{x:q.x-uy*j,y:q.y+ux*j}],color,.75,.55);}
    light(a,13,color,.85);light(b,17,color,.9);
   }
   sparks(b,age-.14,10,color,1.1);
  }else{
   const scout=shot.weapon==='pulse',on=scout?age<.065:age<.07||age>=.14&&age<.205;
   if(on){line([a,b],color,scout?3:4,.10);line([a,b],color,scout?.8:1.2,.88);line([a,b],'#ffffef',.45,.95);light(a,scout?6:10,color,.8);light(b,scout?6:11,'#ffe9b4',.85);}
   sparks(b,age,scout?4:8,'#ffe0a1',scout?.5:.9);
  }
  c.restore();
 }
 function create(){let effects=[];return {
  emit(shots){effects.push(...shots.map(s=>({shot:{...s},age:0})));if(effects.length>96)effects=effects.slice(-96);},
  update(dt){for(const e of effects)e.age+=dt;effects=effects.filter(e=>e.age<duration(e.shot));},
  draw(c,project,z){for(const e of effects)paint(c,e.shot,e.age,project,z);},
  clear(){effects=[];},
  snapshot(){return effects.map(e=>({...e.shot,age:e.age}));}
 };}
 const api={create,paint,flightTime,duration};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ColonyCombatFX=api;
})(typeof window==='undefined'?globalThis:window);
