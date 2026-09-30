const assert=require('node:assert/strict'),G=require('../roam-geography'),M=require('../roam-math');
const b=G.positions[5],q=M.point(...G.coordinates[5]);
const distances=G.coordinates.slice(0,3).map(c=>M.distance(M.point(...c),q)/1000);
assert.ok(Math.abs(distances[0]-1634.896)<.01&&Math.abs(distances[1]-1617.234)<.01&&Math.abs(distances[2]-887.973)<.01);
assert.equal(distances.indexOf(Math.min(...distances)),2);
const p=M.point(...G.coordinates[2]),h=M.toward(p,q),f=M.frame(p),bearing=Math.atan2(M.dot(h,f.east),M.dot(h,f.north))/M.D;
assert.ok(Math.abs(bearing-87.8416)<.001);
assert.ok(Math.abs(Math.hypot(b.x-G.positions[2].x,b.z-G.positions[2].z)-254.9686)<.001);
assert.ok(b.x>G.positions[2].x);const actual=M.coords(G.location(b.x,b.z));assert.ok(Math.abs(actual.lat-18.5623)<1e-8&&Math.abs(actual.lon-61.8103)<1e-8);
for(let i=0;i<=1000;i++){const t=i/1000,a=G.positions[2],e=G.environment(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t);assert.equal(e.earthVisible,true);assert.ok(e.darkness<.001);}
assert.deepEqual(G.positions.slice(0,5).map(p=>[Math.round(p.x*2)/2,Math.round(p.z*2)/2]),[[0,-0],[108,301.5],[220,30],[-942.5,967.5],[-1112,1030]]);
console.log('PASS Blue Ghost distances, bearing, nearest Apollo 17, unchanged original layout and bright near-side route');
