const assert=require('node:assert/strict'),G=require('../roam-geography'),M=require('../roam-math');
for(const coordinates of G.coordinates){const p=G.project(...coordinates),back=M.coords(G.unproject(p.x,p.z));assert.ok(Math.abs(back.lat-coordinates[0])<1e-8);assert.ok(Math.abs(back.lon-coordinates[1])<1e-8);}
const centres=G.coordinates.map(c=>G.project(...c)),ce=centres[3];
assert.ok(ce.x<0&&ce.z>centres[1].z);
const distances=G.coordinates.slice(0,3).map(c=>M.distance(M.point(...c),M.point(...G.coordinates[3]))/1000);
assert.ok(Math.abs(distances[0]-4728.364)<.01&&Math.abs(distances[1]-3895.8)<.01&&Math.abs(distances[2]-4796.458)<.01);
assert.equal(distances.indexOf(Math.min(...distances)),1);
for(const p of centres.slice(0,3)){const e=G.environment(p.x,p.z);assert.equal(e.earthVisible,true);assert.equal(e.darkness,0);}
assert.equal(G.environment(ce.x,ce.z).earthVisible,false);assert.equal(G.environment(ce.x,ce.z).darkness,1);
const a=centres[1];let previous=0,crossings=0,visible=true;
for(let i=0;i<=1000;i++){const t=i/1000,e=G.environment(a.x+(ce.x-a.x)*t,a.z+(ce.z-a.z)*t);assert.ok(e.darkness>=previous-1e-9);assert.ok(Math.abs(e.darkness-previous)<.005);if(e.earthVisible!==visible)crossings++;visible=e.earthVisible;previous=e.darkness;}
assert.equal(crossings,1);console.log('PASS coordinates, relative distances, continuous illumination and Earth horizon crossing');
