const assert=require('node:assert/strict'),G=require('../roam-geography'),M=require('../roam-math');
const a=G.positions[3],b=G.positions[4],p=M.point(...G.coordinates[3]),q=M.point(...G.coordinates[4]);
const distance=M.distance(p,q),heading=M.toward(p,q),f=M.frame(p);
assert.ok(Math.abs(distance/1000-631.9547)<.001);
assert.ok(Math.abs(Math.hypot(b.x-a.x,b.z-a.z)*G.scale-distance)<1e-6);
assert.ok(b.x<a.x&&b.z>a.z);
assert.ok(Math.abs(Math.atan2(b.x-a.x,-(b.z-a.z))-Math.atan2(M.dot(heading,f.east),M.dot(heading,f.north)))<1e-10);
for(let i=0;i<4;i++)assert.deepEqual(G.positions[i],G.project(...G.coordinates[i]));
const actual=M.coords(G.location(b.x,b.z));assert.ok(Math.abs(actual.lat-G.coordinates[4][0])<1e-8&&Math.abs(actual.lon-G.coordinates[4][1])<1e-8);
let previous=null;
for(let i=0;i<=1000;i++){const t=i/1000,e=G.environment(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t);assert.equal(e.earthVisible,false);assert.equal(e.darkness,1);if(previous!==null)assert.ok(Math.abs(e.earthFacing-previous)<.005);previous=e.earthFacing;}
console.log('PASS CE-6 -> CE-4 real distance/bearing, unchanged old layout, far-side continuity and site coordinates');
