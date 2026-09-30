const assert=require('node:assert/strict'),S=require('../colony-sim'),War=require('../colony-war');
const hq=s=>s.buildings.find(b=>b.type==='hq');
const s=S.create(12345),b=hq(s);assert.deepEqual(S.footprint(b),[2,2]);
const positions=new Set();for(const item of s.buildings)for(const [x,y] of S.cells(item)){assert.ok(!positions.has(x+','+y),'initial footprints do not overlap');positions.add(x+','+y);}
for(const [x,y] of S.cells(b)){assert.equal(S.at(s,x,y).id,b.id);assert.ok(War.blocked(s,x,y,S.terrain,S.types));assert.ok(!S.build(s,'road',x,y).ok);assert.ok(!S.command(s,s.units[0].id,x,y).ok);}
assert.equal(S.metrics(s).links.size,s.buildings.length,'all four network arms connected');
const route=War.path(s,{x:18,y:20},{x:21,y:20},S.terrain,S.types);assert.ok(route?.length);assert.ok(route.every(([x,y])=>S.at(s,x,y)?.type!=='hq'));
// Reconstruct the pre-upgrade starting layout, including the three crossing road cells.
const old=S.create(12345);old.version=4;hq(old).footprint=[1,1];for(const [x,y] of [[19,20],[20,19],[20,20]])old.buildings.push({id:old.nextId++,type:'road',x,y,health:100,remaining:0});
const upgraded=S.restore(old);assert.ok(upgraded);assert.deepEqual(S.footprint(hq(upgraded)),[2,2]);assert.equal(S.metrics(upgraded).links.size,upgraded.buildings.length);assert.deepEqual(upgraded.resources,old.resources);assert.deepEqual(upgraded.units,old.units);assert.equal(upgraded.marketSeed,old.marketSeed);assert.ok(S.restore(upgraded));
const crowded=structuredClone(old);S.at(crowded,20,20).type='battery';const kept=S.restore(crowded);assert.ok(kept);assert.deepEqual(S.footprint(hq(kept)),[1,1]);assert.equal(S.at(kept,20,20).type,'battery');assert.equal(kept.buildings.length,crowded.buildings.length);assert.deepEqual(S.footprint(hq(S.restore(kept))),[1,1]);
const parked=structuredClone(old);parked.units[0].x=20;parked.units[0].y=20;assert.deepEqual(S.footprint(hq(S.restore(parked))),[1,1]);
// With the enemy defeated, low reserves / moonlight / time alone never damage a structure.
const peaceful=S.create(12345);peaceful.empireArrived=true;peaceful.empireDefeated=true;peaceful.resources.credits=-5000;peaceful.resources.energy=0;
for(let i=0;i<720;i++)S.tick(peaceful);assert.ok(peaceful.buildings.every(b=>b.health===100));assert.ok(!peaceful.logs.some(l=>l.text.includes('磨损')));
// Combat remains the source of building damage; repair still restores it.
const attacked=S.create(12345);attacked.units=[];attacked.empireArrived=true;attacked.enemies=[War.make('enemy-test','tank',19,17,'enemy')];const solar=S.at(attacked,19,18);S.tick(attacked);assert.ok(solar.health<100);assert.ok(attacked.shots.some(s=>s.enemy));assert.ok(S.repair(attacked,solar.id).ok);assert.equal(solar.health,100);
console.log('PASS: true 2x2 HQ, network branches, collision and path detour, v4 road migration, crowded / parked-unit legacy saves, 720 peaceful days without damage, combat and repair');
