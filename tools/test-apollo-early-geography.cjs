const assert=require('node:assert/strict'),G=require('../roam-geography'),L=require('../roam-layout'),M=require('../roam-math');
for(const [i,c,expected] of [[14,[.67416,23.47314],[965,379,630]],[15,[-3.0128,-23.4219],[1188,1187,1758]],[16,[-3.64589,-17.47194],[1095,1006,1607]]]){
 assert.deepEqual(G.coordinates[i],c);const d=G.coordinates.slice(0,3).map(a=>Math.round(M.distance(M.point(...a),M.point(...c))/1000));assert.deepEqual(d,expected);assert.equal(d.indexOf(Math.min(...d)),1);const p=L.toGeography(L.positions[i].x,L.positions[i].z);assert.ok(G.environment(p.x,p.z).earthVisible);
}
assert.ok(L.positions[14].x>L.positions[1].x&&L.positions[14].z<L.positions[1].z);
assert.ok(L.positions[16].x<L.positions[1].x&&L.positions[16].z<L.positions[1].z);
assert.ok(L.positions[15].x<L.positions[16].x&&L.positions[15].z<L.positions[16].z);
assert.equal(Math.round(M.distance(M.point(...G.coordinates[15]),M.point(...G.coordinates[16]))/1000),181);
console.log('PASS Apollo 11/12/14 coordinates, actual distances, directions and near-side lighting');
