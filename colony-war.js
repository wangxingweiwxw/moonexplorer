/* Grid movement, orders and deterministic combat. No DOM or timers. */
(function(root){
  'use strict';
  const turretMuzzle={offset:1.10,height:57.2};
  const units={
    scout:{name:'雷达月球车',cost:450,metal:15,hp:90,damage:6,range:4,speed:2,desc:'轻型侦察车，移动较快。可引诱敌军进入炮塔射界。'},
    tank:{name:'装甲月球车',cost:850,metal:28,hp:190,damage:15,range:4,speed:1,desc:'以短促双脉冲激光进行近中程作战，保护基地和掩护火箭车。'},
    rocket:{name:'火箭月球车',cost:1500,metal:45,hp:110,damage:26,range:7,speed:1,tech:'weapons',desc:'发射带尾焰的远程火箭，射程超过帝国炮塔。需要火控研究。'}
  };
  const enemyTypes={command:{name:'帝国指挥部',hp:620,range:0,damage:0},factory:{name:'帝国战车工厂',hp:360,range:0,damage:0},turret:{name:'帝国哨戒炮塔',hp:240,range:5,damage:15}};
  function init(s){s.units=[make('u1','scout',18,23),make('u2','tank',21,23)];s.nextUnit=3;s.enemies=[];s.empireArrived=false;s.empireDefeated=false;s.lost=false;s.shots=[];s.kills=0;}
  function make(id,type,x,y,side='player'){return {id,type,x,y,px:x,py:y,hp:units[type].hp,side,order:null};}
  function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
  function cells(b,types){const d=types[b.type],f=b.footprint||d?.footprint||[1,1];const r=[];for(let x=b.x;x<b.x+f[0];x++)for(let y=b.y;y<b.y+f[1];y++)r.push([x,y]);return r;}
  function blocked(s,x,y,terrain,types){return !['plain','ore','ice'].includes(terrain(x,y))||s.buildings.some(b=>b.type!=='road'&&cells(b,types).some(p=>p[0]===x&&p[1]===y))||s.enemies.some(b=>b.structure&&b.hp>0&&b.x===x&&b.y===y);}
  function path(s,a,goal,terrain,types,range=0){
    const start=[Math.round(a.x),Math.round(a.y)],queue=[start],prev=new Map([[start.join(','),null]]);let found=null;
    for(let i=0;i<queue.length;i++){const [x,y]=queue[i];if(Math.hypot(x-goal.x,y-goal.y)<=range){found=[x,y];break;}for(const [dx,dy] of [[1,0],[0,1],[-1,0],[0,-1]]){const nx=x+dx,ny=y+dy,key=nx+','+ny;if(prev.has(key)||blocked(s,nx,ny,terrain,types))continue;prev.set(key,[x,y]);queue.push([nx,ny]);}}
    if(!found)return null;const result=[];let p=found;while(prev.get(p.join(','))){result.unshift(p);p=prev.get(p.join(','));}return result;
  }
  function command(s,id,x,y,terrain,types){const u=s.units.find(u=>u.id===id);if(!u)return {ok:false,error:'请先选择己方月球车'};const enemy=s.enemies.find(e=>e.hp>0&&e.x===x&&e.y===y);const route=path(s,u,{x,y},terrain,types,enemy?units[u.type].range:0);if(!route)return {ok:false,error:'目标不可达，请绕开建筑和陨石坑'};u.order=enemy?{kind:'attack',target:enemy.id}:{kind:'move',x,y};return {ok:true};}
  function step(s,m,terrain,types,log){
    s.shots=[];for(const u of [...s.units,...s.enemies]){u.px=u.x;u.py=u.y;}
    if(s.day>=60&&!s.empireArrived){s.empireArrived=true;for(const [type,x,y] of [['command',27,3],['factory',24,4],['turret',27,7]])s.enemies.push({id:'empire-'+type,type,x,y,hp:enemyTypes[type].hp,structure:true,side:'enemy'});s.enemies.push(make('e-first','tank',25,6,'enemy'));log(s,'帝国殖民军在东北部建立基地。第120天起出动巡逻队，尽快建设炮塔与维修厂。');}
    if(s.day>=120&&s.day%45===0&&s.enemies.some(e=>e.type==='factory'&&e.hp>0)&&s.enemies.filter(e=>!e.structure).length<6){s.enemies.push(make('e-'+s.day,'tank',25,5,'enemy'));log(s,'帝国战车正向基地推进！可用侦察车引敌进入炮塔防线。');}
    const hit=(a,b,damage)=>{
      if('hp'in b)b.hp-=damage;else b.health-=damage*.5;
      const weapon=a.type==='turret'?'arc':a.type==='rocket'?'rocket':a.type==='tank'?'laser':'pulse';
      const heading=(Math.round(Math.atan2(b.y-a.y,b.x-a.x)/(Math.PI/4))+8)%8,angle=heading*Math.PI/4;
      const offset=weapon==='arc'?turretMuzzle.offset:weapon==='laser'?.60:weapon==='rocket'?.235:.28;
      const footprint=b.structure?[1,1]:types[b.type]?.footprint&&!b.footprint?types[b.type].footprint:b.footprint||[1,1];
      s.shots.push({weapon,sourceId:a.id,targetId:b.id,heading,sourceX:a.x,sourceY:a.y,
        x:a.x+Math.cos(angle)*offset,y:a.y+Math.sin(angle)*offset,
        tx:b.x+(footprint[0]-1)/2,ty:b.y+(footprint[1]-1)/2,
        height:weapon==='arc'?turretMuzzle.height:weapon==='rocket'?25:weapon==='laser'?24:21,
        targetHeight:('health'in b||b.structure)?20:12,enemy:a.side==='enemy',seed:s.day*997+s.shots.length*71});
    };
    for(const u of s.units){if(u.hp<=0)continue;const stats=units[u.type];let target=u.order?.kind==='attack'?s.enemies.find(e=>e.id===u.order.target&&e.hp>0):null;if(u.order?.kind==='attack'&&!target)u.order=null;
      if(!target)target=s.enemies.filter(e=>e.hp>0&&distance(u,e)<=stats.range).sort((a,b)=>distance(u,a)-distance(u,b))[0];
      if(target&&distance(u,target)<=stats.range)hit(u,target,stats.damage*(s.tech.includes('weapons')?1.25:1));
      else {const dest=target||(u.order?.kind==='move'?u.order:null);if(dest){const route=path(s,u,dest,terrain,types,target?stats.range:0);if(route?.length){const p=route[Math.min(stats.speed,route.length)-1];u.x=p[0];u.y=p[1];}else if(route)u.order=null;}}
    }
    for(const b of m.active.filter(b=>b.type==='turret')){if(m.power<.5)continue;const target=s.enemies.filter(e=>e.hp>0&&distance(b,e)<=5).sort((a,b)=>a.hp-b.hp)[0];if(target)hit(b,target,22*b.health/100);}
    for(const e of s.enemies){if(e.hp<=0)continue;const stats=e.structure?enemyTypes[e.type]:units[e.type];if(!stats.damage)continue;
      const candidates=[...s.units.filter(u=>u.hp>0),...s.buildings.filter(b=>b.type!=='road'&&b.health>0)];const near=candidates.filter(a=>distance(e,a)<=stats.range).sort((a,b)=>distance(e,a)-distance(e,b));
      if(near[0]){hit(e,near[0],stats.damage);continue;}if(e.structure||s.day<120&&e.id==='e-first')continue;
      const target=candidates.sort((a,b)=>distance(e,a)-distance(e,b))[0];if(target){const route=path(s,e,target,terrain,types,stats.range);if(route?.length){e.x=route[0][0];e.y=route[0][1];}}
    }
    for(const b of s.buildings){if(b.health<0)b.health=0;if(b.type==='hq'&&b.health===0&&!s.lost){s.lost=true;log(s,'指挥中心失守。本次远征结束；可读取存档或开始新远征。');}}
    const workshops=m.active.filter(b=>b.type==='workshop');for(const u of s.units)if(u.hp>0&&u.hp<units[u.type].hp&&m.power>.5&&workshops.some(b=>distance(b,u)<4)&&s.resources.metal>=1){s.resources.metal--;u.hp=Math.min(units[u.type].hp,u.hp+12);}
    if(m.active.some(b=>b.type==='workshop')&&m.power>.5)for(const b of m.active.filter(b=>b.type==='turret'&&b.health<100))if(s.resources.metal>=.5){s.resources.metal-=.5;b.health=Math.min(100,b.health+3);}
    const dead=s.enemies.filter(e=>e.hp<=0);s.kills+=dead.length;for(const e of dead)log(s,(e.structure?enemyTypes[e.type].name:units[e.type].name)+'已被击毁。');s.enemies=s.enemies.filter(e=>e.hp>0);s.units=s.units.filter(u=>u.hp>0);
    if(s.empireArrived&&!s.enemies.length&&!s.empireDefeated){s.empireDefeated=true;log(s,'帝国指挥部、工厂与残余部队已清除，月面防线安全。');}
  }
  const api={turretMuzzle,units,enemyTypes,init,make,step,command,path,blocked,cells};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ColonyWar=api;
})(typeof window==='undefined'?globalThis:window);
