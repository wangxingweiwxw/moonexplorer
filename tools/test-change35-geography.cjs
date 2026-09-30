const assert=require('node:assert/strict'),G=require('../roam-geography'),L=require('../roam-layout'),M=require('../roam-math');
for(const [i,expected] of [[6,[786.624,1874.740,1451.603]],[7,[1449.290,2431.129,2157.819]]]){const d=G.coordinates.slice(0,3).map(c=>M.distance(M.point(...c),M.point(...G.coordinates[i]))/1000);d.forEach((v,j)=>assert.ok(Math.abs(v-expected[j])<.002));assert.equal(d.indexOf(Math.min(...d)),0);assert.equal(G.environment(...Object.values(G.positions[i])).earthVisible,true);}
assert.ok(Math.abs(M.distance(M.point(...G.coordinates[6]),M.point(...G.coordinates[7]))/1000-707.825)<.002);
assert.ok(L.positions[6].x<0&&L.positions[6].z<0&&L.positions[7].x<L.positions[6].x);
console.log('PASS CE-3 / CE-5 real distances, nearest Apollo 15, northwest exhibit chain and near-side Earth');
