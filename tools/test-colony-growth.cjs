const assert=require('node:assert/strict'),S=require('../colony-sim'),fs=require('node:fs'),s=S.restore(require('./test-colony.cjs'));
// Continue the tested early campaign using only public construction, trade and upgrade actions.

function place(type){const def=S.types[type];if(s.resources.metal<def.metal||s.resources.credits-def.cost<-S.CREDIT_LIMIT)return false;const occupied=new Set(s.buildings.flatMap(b=>S.cells(b).map(p=>p.join(',')))),m=S.metrics(s);for(const r of m.active.filter(b=>b.type==='road'||b.type==='hq'))for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const x=r.x+dx,y=r.y+dy;if(occupied.has(x+','+y))continue;if(!['mine','water'].includes(type)&&S.terrain(x,y)!=='plain')continue;if(!S.canBuild(s,type,x,y))return S.build(s,type,x,y).ok;}return false;}
function connectIce(){const occupied=new Set(s.buildings.filter(b=>b.type!=='road').flatMap(b=>S.cells(b).map(p=>p.join(',')))),m=S.metrics(s),q=m.active.filter(b=>b.type==='road').map(b=>[b.x,b.y]),prev=new Map(q.map(p=>[p.join(','),null]));let target;for(const u of s.units)occupied.add(u.x+','+u.y);
 for(let i=0;i<q.length&&!target;i++){const p=q[i];if(S.terrain(...p)==='ice'&&!S.at(s,...p)){target=p;break;}for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const n=[p[0]+dx,p[1]+dy],k=n.join(',');if(prev.has(k)||occupied.has(k)||!['plain','ice','ore'].includes(S.terrain(...n)))continue;prev.set(k,p);q.push(n);}}
 if(!target)return false;let route=[],p=prev.get(target.join(','));while(p&&prev.get(p.join(','))){route.unshift(p);p=prev.get(p.join(','));}for(const [x,y]of route)if(!S.at(s,x,y)&&!S.build(s,'road',x,y).ok)return false;return S.build(s,'water',...target).ok;
}
for(let d=s.day;d<1801&&!s.won&&!s.lost;d++){
 let m=S.metrics(s);if(m.port&&m.tradeOpen){for(const k of ['water','food','oxygen','metal'])while(s.resources[k]>(k==='metal'?500:Math.max(350,m.storage*.55)))S.trade(s,k,-50);}
 if(s.day%40===0)for(const b of s.buildings)if(b.type!=='road'&&b.health<95)S.repair(s,b.id);
 // Grow a connected construction grid, avoiding ice and ore sites.
 for(let j=0;j<(s.day%10===0?6:0);j++){m=S.metrics(s);const occupied=new Set(s.buildings.flatMap(b=>S.cells(b).map(p=>p.join(','))));const road=m.active.filter(b=>b.type==='road').flatMap(r=>[[r.x+1,r.y],[r.x-1,r.y],[r.x,r.y+1],[r.x,r.y-1]]).find(([x,y])=>!occupied.has(x+','+y)&&S.terrain(x,y)==='plain'&&(x%3===2||y%3===2)&&!S.canBuild(s,'road',x,y));if(road&&s.resources.metal>80)S.build(s,'road',...road);}
 m=S.metrics(s);const count=t=>s.buildings.filter(b=>b.type===t&&b.health>0).length;
 const future=Math.min(5200,Math.max(300,s.population*1.3)),farms=Math.ceil(future*.027/6.6),oxy=Math.ceil(future*.03/7.5),water=Math.ceil((future*.0195+(farms+oxy)*2)/12);
 if(count('mine')<5)place('mine');if(count('warehouse')<8)place('warehouse');
 const stablePower=m.active.filter(b=>b.type==='reactor').reduce((a,b)=>a+36*b.health/100,0);if(stablePower<m.demand+20)place('reactor');
 if(count('water')<water&&s.resources.metal>=18)connectIce();if(count('farm')<farms)place('farm');if(count('oxygen')<oxy)place('oxygen');
 if(m.capacity<Math.min(5300,s.population+400)&&s.resources.water>100&&s.resources.food>100&&s.resources.oxygen>100){const b=s.buildings.find(b=>b.type==='habitat'&&(b.level||1)<2);if(b)S.expandHousing(s,b.id);else place('habitat');}
 S.tick(s);if(s.population>=S.TARGET_POPULATION-30&&!s.won)fs.writeFileSync('_tmp/colony/500-near-goal.json',JSON.stringify(s));if(s.day%100===0)console.log(s.day,s.population,Math.floor(s.resources.credits),Math.floor(s.resources.water),Math.floor(s.resources.food),Math.floor(s.resources.oxygen),S.metrics(s).power.toFixed(2),s.buildings.length,count('water'),water);
}
assert.ok(s.won&&!s.lost);assert.ok(s.rewards.includes(5));assert.ok(s.mission.completedDay<=S.MISSION_DAYS);assert.ok(s.population>=S.TARGET_POPULATION);assert.ok(s.resources.water>0&&s.resources.food>0&&s.resources.oxygen>0);console.log('PASS five-year population growth without resource injection',S.formatDate(s.day),s.population);fs.writeFileSync('_tmp/colony/500-population-result.json',JSON.stringify(s));
