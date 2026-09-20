/* Moon-fixed Cartesian coordinates; metres, east-positive longitude. No polar clamps. */
(function(root) {
  'use strict';
  const R=1737400, D=Math.PI/180;
  const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  const add=(a,b,s=1)=>a.map((v,i)=>v+b[i]*s);
  const scale=(a,s)=>a.map(v=>v*s);
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const norm=a=>scale(a,1/Math.hypot(...a));
  const clamp=v=>Math.max(-1,Math.min(1,v));
  const point=(lat,lon)=>[Math.cos(lat*D)*Math.cos(lon*D),Math.sin(lat*D),Math.cos(lat*D)*Math.sin(lon*D)];
  const coords=p=>({lat:Math.asin(clamp(p[1]))/D,lon:Math.atan2(p[2],p[0])/D});
  function frame(p) {
    const lon=Math.atan2(p[2],p[0]), east=[-Math.sin(lon),0,Math.cos(lon)];
    return {up:p,east,north:cross(east,p)};
  }
  function forward(p,bearing) {const f=frame(p);return add(scale(f.north,Math.cos(bearing)),f.east,Math.sin(bearing));}
  function move(p,heading,metres) {
    const a=metres/R,c=Math.cos(a),s=Math.sin(a);
    return {p:norm(add(scale(p,c),heading,s)),heading:norm(add(scale(heading,c),p,-s))};
  }
  function turn(p,heading,radians) {return norm(add(scale(heading,Math.cos(radians)),cross(p,heading),Math.sin(radians)));}
  const distance=(a,b)=>Math.atan2(Math.hypot(...cross(a,b)),clamp(dot(a,b)))*R;
  function toward(a,b) {const t=add(b,a,-dot(a,b));return Math.hypot(...t)<1e-10?frame(a).north:norm(t);}
  function offset(p,east,north) {const f=frame(p),d=Math.hypot(east,north);return d?move(p,norm(add(scale(f.east,east),f.north,north)),d).p:p.slice();}
  const api={R,D,dot,add,scale,cross,norm,point,coords,frame,forward,move,turn,distance,toward,offset};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MoonMath=api;
})(typeof window==='undefined'?globalThis:window);
