const assert=require('node:assert/strict'),G=require('../roam-geography'),L=require('../roam-layout'),M=require('../roam-math');
assert.deepEqual(G.coordinates[8],[-69.373,32.319]);
const distances=G.coordinates.slice(0,3).map(c=>Math.round(M.distance(M.point(...c),M.point(...G.coordinates[8]))/1000));
assert.deepEqual(distances,[2964,1861,2716]);assert.ok(L.edges.some(([a,b])=>a===1&&b===8));assert.ok(L.positions[8].z>L.positions[1].z);
const geo=L.toGeography(L.positions[8].x,L.positions[8].z),e=G.environment(geo.x,geo.z);assert.ok(e.earthVisible&&e.earthAltitude>15&&e.earthAltitude<20);assert.ok(Math.abs(e.coordinates.lat+69.373)<.06);
const old=[[0,0],[-4.031254166408284,168.1844426164684],[145,19.77272727272727],[-356.6562541664083,391.7429861671585],[-489.0312541664083,440.5538268751231],[296.375,-22.155989631549712],[-112.34329446064142,-132.875],[-250.3432944606414,-182.828125]];
old.forEach(([x,z],i)=>assert.ok(Math.hypot(L.positions[i].x-x,L.positions[i].z-z)<1e-8));
console.log('PASS Chandrayaan-3 coordinates, true distances, nearest Apollo 16, low visible Earth and unchanged eight exhibit centres');
