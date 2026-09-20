/* Render-space spacing only. Geographic coordinates and public distances stay real. */
(function(root){
 'use strict';
 const G=typeof module!=='undefined'&&module.exports?require('./roam-geography.js'):root.RoamGeography;
 const halfSize=60,gapRatio=.25,edges=[[0,2],[0,1],[1,2],[1,3],[3,4],[2,5],[0,6],[6,7],[1,8],[5,9],[9,10],[10,11],[6,12],[2,13],[1,14],[1,16],[16,15],[15,17],[15,18],[14,19],[16,20],[16,21],[17,22],[22,23]];
 const legacy=G.positions.map(p=>({x:Math.round(p.x*2)/2,z:Math.round(p.z*2)/2}));
 const length=(a,b)=>Math.hypot(b.x-a.x,b.z-a.z);
 // Length of a centre-to-centre ray inside the two unchanged square exhibits.
 const inside=(a,b)=>2*halfSize*length(a,b)/Math.max(Math.abs(b.x-a.x),Math.abs(b.z-a.z));
 const gap=(a,b)=>length(a,b)-inside(a,b);
 function extend(a,oldA,oldB,minGap=-Infinity){const l=length(oldA,oldB),next=inside(oldA,oldB)+Math.max(minGap,gap(oldA,oldB)*gapRatio);return {x:a.x+(oldB.x-oldA.x)*next/l,z:a.z+(oldB.z-oldA.z)*next/l};}
 const positions=[{x:0,z:0},null,extend({x:0,z:0},legacy[0],legacy[2])];
 // Solve the Apollo triangle for its three shortened exterior gaps. Preserve the
 // 15 -> 17 bearing; allow the other two exhibit bearings to adjust slightly.
 let p=extend(positions[0],legacy[0],legacy[1]);
 const residual=p=>[gap(positions[0],p)-gap(legacy[0],legacy[1])*gapRatio,gap(positions[2],p)-gap(legacy[2],legacy[1])*gapRatio];
 for(let i=0;i<30;i++){const f=residual(p);if(Math.hypot(...f)<1e-9)break;const h=.001,dx=residual({x:p.x+h,z:p.z}),dz=residual({x:p.x,z:p.z+h}),a=(dx[0]-f[0])/h,b=(dz[0]-f[0])/h,c=(dx[1]-f[1])/h,d=(dz[1]-f[1])/h,det=a*d-b*c;p={x:p.x-(d*f[0]-b*f[1])/det,z:p.z-(-c*f[0]+a*f[1])/det};}
 positions[1]=p;positions[3]=extend(p,legacy[1],legacy[3]);positions[4]=extend(positions[3],legacy[3],legacy[4]);positions[5]=extend(positions[2],legacy[2],legacy[5]);
 positions[6]=extend(positions[0],legacy[0],legacy[6]);positions[7]=extend(positions[6],legacy[6],legacy[7]);positions[8]=extend(positions[1],legacy[1],legacy[8]);
 // Nearby real sites would overlap full exhibits at the old projection scale.
 // Keep the original nine interiors/centres and a short twelve-unit exterior lane.
 positions[9]=extend(positions[5],legacy[5],legacy[9],12);positions[10]=extend(positions[9],legacy[9],legacy[10],12);positions[11]=extend(positions[10],legacy[10],legacy[11],12);
 // Fit the western rover exhibit between the unchanged CE-3 and CE-5 sites.
 // Geographic labels and distances still use the measured landing coordinates.
 positions[12]={x:positions[6].x-132,z:positions[7].z+132};
 positions[13]=extend(positions[2],legacy[2],legacy[13],24);
 // Early Apollo sites keep their NE / W / WNW order around Apollo 16.
 // Full-size interiors require an adjusted bearing in render space only.
 positions[14]={x:positions[1].x+132,z:positions[2].z+132};
 positions[16]={x:positions[1].x-132,z:positions[1].z-24};
 positions[15]=extend(positions[16],legacy[16],legacy[15],12);
 // Surveyor branches retain all earlier centres and full-size exhibit interiors.
 // Dense near-equatorial sites use exhibit lanes; map anchors stay geographic.
 positions[17]={x:positions[15].x-132,z:positions[15].z-12};
 positions[18]={x:positions[15].x,z:positions[15].z+132};
 positions[19]={x:positions[8].x+132,z:positions[14].z+132};
 positions[20]={x:-122,z:12};
 positions[21]={x:positions[16].x,z:positions[16].z+132};
 // Early Luna historical landing areas, west of Surveyor 1 then northward.
 positions[22]=extend(positions[17],legacy[17],legacy[22],12);
 positions[23]=extend(positions[22],legacy[22],legacy[23],12);
 const boxDistance=(p,c)=>Math.hypot(Math.max(0,Math.abs(p.x-c.x)-halfSize),Math.max(0,Math.abs(p.z-c.z)-halfSize));
 // Preserve each exhibit's geographic neighbourhood exactly, blending only in
 // the exterior corridors. This keeps far-side Earth visibility independent of layout.
 function toGeography(x,z){const p={x,z};let sx=0,sz=0,total=0;for(let i=0;i<positions.length;i++){const d=boxDistance(p,positions[i]),dx=legacy[i].x-positions[i].x,dz=legacy[i].z-positions[i].z;if(d<1e-7)return {x:x+dx,z:z+dz};const w=1/Math.pow(d,4);sx+=dx*w;sz+=dz*w;total+=w;}return {x:x+sx/total,z:z+sz/total};}
 function migrateLegacy(x,z){const p={x,z};for(let i=0;i<Math.min(9,legacy.length);i++)if(boxDistance(p,legacy[i])<1e-7)return {x:x+positions[i].x-legacy[i].x,z:z+positions[i].z-legacy[i].z};let best=Infinity,out;
   for(const [a,b] of edges.filter(([,b])=>b<9)){const pa=legacy[a],pb=legacy[b],dx=pb.x-pa.x,dz=pb.z-pa.z,t=Math.max(0,Math.min(1,((x-pa.x)*dx+(z-pa.z)*dz)/(dx*dx+dz*dz))),rx=x-pa.x-dx*t,rz=z-pa.z-dz*t,d=Math.hypot(rx,rz);if(d<best){best=d;out={x:positions[a].x+(positions[b].x-positions[a].x)*t+rx*gapRatio,z:positions[a].z+(positions[b].z-positions[a].z)*t+rz*gapRatio};}}
   return out;
 }
 const api={halfSize,gapRatio,edges,legacy,positions,gap,toGeography,migrateLegacy};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.RoamLayout=api;
})(typeof window==='undefined'?globalThis:window);
