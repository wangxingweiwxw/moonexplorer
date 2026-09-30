const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),S=require('../colony-sim'),War=require('../colony-war');
let s=S.create(12345);const initial=s.resources.credits;
assert.ok(!S.build(s,'mine',15,15).ok);assert.ok(!S.build(s,'solar',NaN,20).ok);assert.equal(s.resources.credits,initial);
assert.ok(S.build(s,'habitat',3,3).ok);for(let i=0;i<6;i++)S.tick(s);assert.equal(S.metrics(s).capacity,56);assert.ok(!S.metrics(s).links.has(S.at(s,3,3).id));assert.equal(S.demolish(s,S.at(s,19,19).id),false);
assert.ok(!S.trade(s,'metal',50).ok);assert.ok(!S.research(s,'reactor').ok);assert.ok(!S.aid(s).ok);
s=S.create(12345);assert.ok(S.build(s,'port',26,19).ok);assert.equal(S.at(s,27,20).type,'port');assert.ok(!S.build(s,'solar',27,20).ok);while(s.day<13)S.tick(s);assert.ok(S.metrics(s).port);for(const [day,phase] of [[13,'landing'],[14,'landing'],[15,'docked'],[24,'docked'],[25,'departing'],[26,'departing'],[27,'away'],[75,'docked']]){s.day=day;assert.equal(S.flight(s).phase,phase);assert.equal(S.trade(s,'metal',-1).ok,phase==='docked');}
s.day=15;s.resources.credits=-4700;const quote=S.marketQuotes(s).quotes.metal;assert.ok(!S.trade(s,'metal',50).ok);assert.ok(S.trade(s,'metal',1).ok);assert.equal(s.resources.credits,-4700-quote.buy);assert.ok(S.trade(s,'metal',-10).ok);assert.equal(s.resources.credits,-4700-quote.buy+10*quote.sell);
const credits=s.resources.credits;S.tick(s);assert.ok(s.resources.credits<credits,'no tax or goal cash grant');assert.ok(S.restore(s));
s=S.create(12345);const u=s.units[0];assert.ok(S.command(s,u.id,18,25).ok);S.tick(s);assert.equal(u.y,25);assert.ok(!S.command(s,u.id,19,19).ok);assert.ok(!War.blocked(s,u.x,u.y,S.terrain,S.types));assert.ok(S.stop(s,u.id).ok);
// Imported pre-campaign ports retain their original single-tile footprint.
const legacy=S.create(12345);legacy.version=1;legacy.buildings.push({id:legacy.nextId++,type:'port',x:25,y:19,remaining:0,health:100});delete legacy.units;delete legacy.enemies;const migrated=S.restore(legacy);assert.ok(migrated);assert.equal(migrated.version,S.VERSION);assert.deepEqual(S.footprint(migrated.buildings.at(-1)),[1,1]);assert.equal(migrated.units.length,2);
assert.equal(S.restore('{broken'),null);assert.equal(S.restore({...S.create(12345),resources:{...S.create(12345).resources,credits:-5001}}),null);const duplicate=S.create(12345);duplicate.buildings.push({...duplicate.buildings[0]});assert.equal(S.restore(duplicate),null);
// Full campaign: no resource injection, only public build/research/trade/order actions.
s=S.create(12345);const queue=[['port',26,19],['water',17,21],['mine',22,21],['solar',23,21],['solar',24,21],['warehouse',24,19],['lab',23,19],['education',25,19],['workshop',25,21],['factory',21,24],['turret',19,16],['turret',21,16],['solar',19,23],['clinic',19,24],['habitat',21,18],['habitat',19,17],['habitat',21,17]];
for(let y=16;y>=13;y--)assert.ok(S.build(s,'road',20,y).ok);let lowest=Infinity,lowestCash=initial,wonDay=0,sawEnemyAttack=false,sawPlayerAttack=false;
const output=path.join(__dirname,'../_tmp/colony');fs.mkdirSync(output,{recursive:true});
for(let i=0;i<440&&!s.lost;i++){
 for(let n=0;n<queue.length;n++)if(S.build(s,...queue[n]).ok)queue.splice(n--,1);
 for(const k of Object.keys(S.technologies))if(!s.tech.includes(k))S.research(s,k);
 if(s.tech.includes('reactor')&&!s.buildings.some(b=>b.type==='reactor'))S.build(s,'reactor',19,22);
 if(S.metrics(s).port&&S.metrics(s).tradeOpen)for(const k of ['metal','water','food','oxygen'])while(s.resources[k]>230)assert.ok(S.trade(s,k,-50).ok);
 if(s.tech.includes('weapons')&&s.units.filter(u=>u.type==='rocket').length<3&&s.resources.metal>100)S.train(s,'rocket');
 if(s.day>110)for(const u of s.units.filter(u=>u.type==='rocket')){const target=s.enemies.find(e=>e.type==='turret')||s.enemies.find(e=>e.type==='factory')||s.enemies[0];if(target)S.command(s,u.id,target.x,target.y);}
 if(s.day%40===0)for(const b of s.buildings)if(b.health>0&&b.health<80)S.repair(s,b.id);
 S.tick(s);lowest=Math.min(lowest,s.resources.water,s.resources.food,s.resources.oxygen);lowestCash=Math.min(lowestCash,s.resources.credits);sawEnemyAttack||=s.shots.some(e=>e.enemy);sawPlayerAttack||=s.shots.some(e=>!e.enemy);if(s.won&&!wonDay)wonDay=s.day;
 for(const [key,v] of Object.entries(s.resources))assert.ok(Number.isFinite(v)&&v>=(key==='credits'?-S.CREDIT_LIMIT:0));
 if([13,15,25,80,145,180].includes(s.day))fs.writeFileSync(path.join(output,'campaign-day-'+s.day+'.json'),JSON.stringify(s));
}
assert.ok(!s.won);assert.equal(s.rewards.length,5);assert.ok(!s.lost);assert.equal(s.enemies.length,0);assert.ok(s.empireDefeated&&sawEnemyAttack&&sawPlayerAttack);assert.ok(lowest>0);assert.ok(lowestCash>=-5000);assert.equal(S.restore(JSON.stringify(s)).population,s.population);
fs.writeFileSync(path.join(output,'campaign-expansion-start.json'),JSON.stringify(s));
// Losing the HQ freezes simulation, and disconnected or powerless turrets cannot fire.
const lose=S.create(12345);lose.buildings.find(b=>b.type==='hq').health=0;S.tick(lose);assert.ok(lose.lost);const day=lose.day;S.tick(lose);assert.equal(lose.day,day);assert.ok(!S.train(lose,'tank').ok);
const isolated=S.create(12345);S.build(isolated,'turret',3,3);S.at(isolated,3,3).remaining=0;isolated.empireArrived=true;isolated.enemies=[War.make('enemy-test','tank',3,5,'enemy')];S.tick(isolated);assert.ok(!isolated.shots.some(e=>!e.enemy));
console.log('PASS: 440-day campaign, optional milestones, ship phases, dock-only trading, credit ceiling, footprints, movement, combat, defeat, v1 migration and corrupt-save checks');console.log(JSON.stringify({wonDay,population:s.population,lowestLifeSupport:lowest,lowestCash,exportRevenue:s.tradeEarned}));

module.exports=structuredClone(s);
