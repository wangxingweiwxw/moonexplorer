const assert=require('node:assert/strict'),S=require('../colony-sim'),War=require('../colony-war'),FX=require('../colony-combat-fx');
function fixture(){const s=S.create(12345);s.day=61;s.empireArrived=true;s.units=[War.make('u1','tank',21,23),War.make('u2','rocket',20,24),War.make('u3','scout',23,23)];s.nextUnit=4;s.enemies=[{id:'target',type:'command',x:24,y:23,hp:620,structure:true,side:'enemy'},War.make('e-first','tank',26,23,'enemy')];const turret=S.build(s,'turret',23,21);assert.ok(turret.ok);turret.building.remaining=0;return s;}
const s=fixture();S.tick(s);assert.deepEqual(new Set(s.shots.filter(s=>!s.enemy).map(s=>s.weapon)),new Set(['laser','rocket','pulse','arc']));assert.ok(s.shots.some(s=>s.enemy&&s.weapon==='laser'));
assert.equal(s.enemies.find(e=>e.id==='target').hp,620-15-26-6,'visual effects do not change weapon damage');
assert.equal(s.enemies.find(e=>e.id==='e-first').hp,190-22,'turret still prioritizes the weaker target');
for(const shot of s.shots){assert.ok(shot.sourceId);assert.ok(shot.targetId);assert.ok(Number.isInteger(shot.heading)&&shot.heading>=0&&shot.heading<8);assert.ok(Number.isFinite(shot.x)&&shot.height>0);}
const fx=FX.create();fx.emit(s.shots);assert.equal(fx.snapshot().length,s.shots.length);fx.update(.7);assert.ok(fx.snapshot().every(s=>s.weapon==='rocket'));fx.update(1);assert.equal(fx.snapshot().length,0);fx.emit(Array(200).fill(s.shots[0]));assert.equal(fx.snapshot().length,96);fx.clear();assert.equal(fx.snapshot().length,0);
assert.deepEqual(S.restore(s).shots,[]);module.exports=fixture;
console.log('PASS: weapon identities, muzzle metadata, damage unchanged, effect lifetime/cap and transient save cleanup');
