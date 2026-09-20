/* Azimuthal-equidistant exhibit layout centred on Apollo 15, not a spherical driving mesh. */
(function(root){
  'use strict';
  const M=typeof module!=='undefined'&&module.exports?require('./roam-math.js'):root.MoonMath;
  const scale=3500,coordinates=[[26.13239,3.63330],[-8.9734,15.5011],[20.1911,30.7723],[-41.6385,-153.9852],[-45.4561,177.5885],[18.5623,61.8103],[44.1214,-19.5116],[43.0576,-51.9161],[-69.373,32.319],[12.7142,62.2129],[3.7863,56.6242],[-.5137,56.3638],[38.23764,-35.00163],[25.9994,30.4076],[.67416,23.47314],[-3.0128,-23.4219],[-3.64589,-17.47194],[-2.4745,-43.3398],[-3.0162,-23.4180],[1.4551,23.1943],[.4742,-1.4275],[-40.9812,-11.5127],[7.08,-64.37],[18.87,-62.05]];
  const origin=M.point(...coordinates[0]),frame=M.frame(origin);
  const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
  function project(lat,lon){const p=M.point(lat,lon),h=M.toward(origin,p),d=M.distance(origin,p)/scale;return {x:M.dot(h,frame.east)*d,z:-M.dot(h,frame.north)*d};}
  const unproject=(x,z)=>M.offset(origin,x*scale,-z*scale);
  // Stitch the new local chart to CE-6. The original Apollo-centred projection strongly
  // distorts this near-antipodal pair; retain the real CE-6 -> CE-4 bearing and distance.
  const anchor=M.point(...coordinates[3]),anchorFrame=M.frame(anchor),anchorGame=project(...coordinates[3]);
  const ce4=M.point(...coordinates[4]),direction=M.toward(anchor,ce4),distance=M.distance(anchor,ce4)/scale;
  const delta={x:M.dot(direction,anchorFrame.east)*distance,z:-M.dot(direction,anchorFrame.north)*distance};
  const positions=coordinates.map((c,i)=>i===4?{x:anchorGame.x+delta.x,z:anchorGame.z+delta.z}:project(...c));
  function location(x,z){
    const dx=x-anchorGame.x,dz=z-anchorGame.z,weight=smooth((dx*delta.x+dz*delta.z)/(distance*distance));
    const global=unproject(x,z),local=M.offset(anchor,dx*scale,-dz*scale);
    return M.norm(M.add(M.scale(global,1-weight),local,weight));
  }
  function environment(x,z){
    const p=location(x,z),earthFacing=p[0],darkness=smooth((.45-earthFacing)/.95);
    // Ignore libration. Earth visibility and the chosen twilight art direction are separate.
    return {earthFacing,earthVisible:earthFacing>0,earthAltitude:Math.asin(Math.max(-1,Math.min(1,earthFacing)))/M.D,darkness,coordinates:M.coords(p)};
  }
  const api={scale,coordinates,project,unproject,positions,location,environment};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.RoamGeography=api;
})(typeof window==='undefined'?globalThis:window);
