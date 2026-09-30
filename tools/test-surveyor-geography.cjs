const assert=require('node:assert/strict'),G=require('../roam-geography'),L=require('../roam-layout'),M=require('../roam-math');
const cases=[[17,[-2.4745,-43.3398],[1626,1784,2305],0],[18,[-3.0162,-23.418],[1188,1187,1758],1],[19,[1.4551,23.1943],[941,392,611],1],[20,[.4742,-1.4275],[792,586,1127],1],[21,[-40.9812,-11.5127],[2079,1211,2204],1]];
for(const [i,c,expected,nearest] of cases){assert.deepEqual(G.coordinates[i],c);const d=G.coordinates.slice(0,3).map(a=>Math.round(M.distance(M.point(...a),M.point(...c))/1000));assert.deepEqual(d,expected);assert.equal(d.indexOf(Math.min(...d)),nearest);const p=L.toGeography(L.positions[i].x,L.positions[i].z);assert.ok(G.environment(p.x,p.z).earthVisible);}
assert.equal(Math.round(M.distance(M.point(...G.coordinates[18]),M.point(...G.coordinates[15]))),157);
assert.equal(Math.round(M.distance(M.point(...G.coordinates[19]),M.point(...G.coordinates[14]))/1000),25);
for(const [a,b] of [[15,17],[15,18],[14,19],[16,20],[16,21]])assert.ok(L.edges.some(e=>e[0]===a&&e[1]===b));
console.log('PASS Surveyor LROC coordinates, actual Apollo distances, 157 m Apollo 12 neighbour, 25 km Apollo 11 neighbour and near-side Earth');
