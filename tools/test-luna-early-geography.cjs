const assert=require('node:assert/strict'),G=require('../roam-geography'),L=require('../roam-layout'),M=require('../roam-math');
for(const [i,c,expected] of [[22,[7.08,-64.37],[2037,2462,2800]],[23,[18.87,-62.05],[1835,2466,2611]]]){assert.deepEqual(G.coordinates[i],c);const d=G.coordinates.slice(0,3).map(a=>Math.round(M.distance(M.point(...a),M.point(...c))/1000));assert.deepEqual(d,expected);assert.equal(d.indexOf(Math.min(...d)),0);const p=L.toGeography(L.positions[i].x,L.positions[i].z);assert.ok(G.environment(p.x,p.z).earthVisible);}
assert.equal(Math.round(M.distance(M.point(...G.coordinates[22]),M.point(...G.coordinates[23]))/10000)*10,360);
for(const [a,b] of [[17,22],[22,23]])assert.ok(L.edges.some(e=>e[0]===a&&e[1]===b));
assert.ok(L.positions[22].x<L.positions[17].x&&L.positions[22].z<L.positions[17].z);assert.ok(L.positions[23].z<L.positions[22].z);
console.log('PASS historical approximate coordinates, real lunar distances, western route bearings and near-side Earth');
