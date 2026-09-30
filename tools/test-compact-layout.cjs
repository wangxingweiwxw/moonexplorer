const assert=require('node:assert/strict'),L=require('../roam-layout'),G=require('../roam-geography');
for(const [a,b] of L.edges){const actual=L.gap(L.positions[a],L.positions[b]);if(b<9)assert.ok(Math.abs(actual/L.gap(L.legacy[a],L.legacy[b])-.25)<1e-9);else if(b<=11)assert.ok(Math.abs(actual-12)<1e-8);else if(b===13)assert.ok(Math.abs(actual-24)<1e-8);else if(b<14)assert.ok(actual>=12&&actual<20);else if(b<17)assert.ok(actual>=12&&actual<16);else assert.ok(actual>=12-1e-8&&actual<17);}
for(let a=0;a<L.positions.length;a++)for(let b=a+1;b<L.positions.length;b++)assert.ok(Math.max(Math.abs(L.positions[a].x-L.positions[b].x),Math.abs(L.positions[a].z-L.positions[b].z))>=120,'exhibit overlap');
for(let i=0;i<L.positions.length;i++)for(const [x,z] of [[0,0],[-12,-15],[-34,20],[59,59],[-59,-59]]){
 const old={x:L.legacy[i].x+x,z:L.legacy[i].z+z},now={x:L.positions[i].x+x,z:L.positions[i].z+z},back=L.toGeography(now.x,now.z),migrated=L.migrateLegacy(old.x,old.z);
 assert.ok(Math.hypot(back.x-old.x,back.z-old.z)<1e-7);if(i<9)assert.ok(Math.hypot(migrated.x-now.x,migrated.z-now.z)<1e-7);
 assert.equal(G.environment(back.x,back.z).earthVisible,i<3||i>=5);
}
let previous=null,visible=false,hidden=false;
for(let j=0;j<=2000;j++){const a=L.positions[1],b=L.positions[3],t=j/2000,p=L.toGeography(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t),e=G.environment(p.x,p.z);visible||=e.earthVisible;hidden||=!e.earthVisible;if(previous!==null)assert.ok(Math.abs(e.darkness-previous)<.025);previous=e.darkness;}
assert.ok(visible&&hidden);console.log('PASS original exterior gaps exactly 1/4, nearby Luna sites separated by short safe lanes, unchanged 120 m exhibits, no overlap, legacy migration and continuous near/far lighting');
