const assert=require('node:assert/strict'),S=require('../colony-sim');
function empty(){const s=S.create(12345);s.buildings=s.buildings.filter(b=>b.type==='hq');s.units=[];return s;}
function add(s,type,x,y,extra={}){const b={id:s.nextId++,type,x,y,health:100,remaining:0,...extra};s.buildings.push(b);return b;}
// Every type can relay a connection, and every type can receive one from another building.
const types=Object.keys(S.types).filter(t=>t!=='hq');
for(const first of types)for(const second of types){const s=empty(),relay=add(s,first,21,19),target=add(s,second,21+S.footprint(relay)[0],19),m=S.metrics(s);assert.ok(m.links.has(relay.id),first+' HQ attachment');assert.ok(m.links.has(target.id),first+' -> '+second);assert.ok(m.active.some(b=>b.id===target.id));}
// Any perimeter edge of a multi-cell building carries the network, including its far corners.
for(const type of ['port','factory','workshop'])for(const edge of ['east','north','south']){const s=empty(),relay=add(s,type,21,19),[w,h]=S.footprint(relay),[x,y]=edge==='east'?[21+w,19+h-1]:edge==='north'?[21+w-1,18]:[21+w-1,19+h];const target=add(s,'habitat',x,y,{level:2});assert.ok(S.metrics(s).links.has(target.id),type+' '+edge);}
const chain=empty(),bridge=add(chain,'habitat',21,19,{level:2}),last=add(chain,'habitat',22,19,{level:2});
assert.equal(S.metrics(chain).capacity,280);bridge.remaining=1;assert.equal(S.metrics(chain).capacity,24);S.tick(chain);assert.equal(S.metrics(chain).capacity,280,'completion immediately reconnects the chain');bridge.health=0;assert.equal(S.metrics(chain).capacity,24);assert.ok(S.repair(chain,bridge.id).ok);assert.equal(S.metrics(chain).capacity,280);S.demolish(chain,bridge.id);assert.equal(S.metrics(chain).capacity,24);assert.ok(!S.metrics(chain).links.has(last.id));
const diagonal=empty(),corner=add(diagonal,'habitat',21,21,{level:2}),gap=add(diagonal,'habitat',23,19,{level:2});assert.ok(!S.metrics(diagonal).links.has(corner.id));assert.ok(!S.metrics(diagonal).links.has(gap.id));
const island=empty();for(const [x,y] of [[27,20],[28,20],[28,21],[27,21]])add(island,'habitat',x,y,{level:2});assert.equal(S.metrics(island).capacity,24,'an isolated cycle cannot power itself');
// Exact reported layout: three homes have a road edge; the fourth touches only another home.
const four=S.create(12345);four.buildings.find(b=>b.type==='habitat').level=2;for(const [x,y] of [[21,18],[21,17],[22,17]])add(four,'habitat',x,y,{level:2});assert.equal(S.metrics(four).capacity,536);assert.equal(S.metrics(S.restore(four)).capacity,536);
Object.assign(four.resources,{water:0,food:0,oxygen:0,energy:0});assert.equal(S.metrics(four).capacity,536,'supply shortages do not subtract beds');
console.log('PASS: all '+types.length*types.length+' building relay pairs, multi-cell edges, finish/repair/demolish, diagonal/gap/island isolation, four homes = 536 and old-save recalculation');
module.exports=four;
