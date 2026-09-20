/* Ye-6 / Ye-6M deployed automatic stations, enlarged for readable voxel exhibits. */
window.LunaEarlyRegions=(()=>{
 'use strict';
 const T=THREE,A=RoverArt;
 const mat=(color,extra={})=>new T.MeshStandardMaterial({color,map:A.texture('panel'),roughness:.63,metalness:.4,flatShading:true,...extra});
 function box(g,m,x,y,z,w,h,d){const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;g.add(o);return o;}
 function rod(g,m,a,b,r=.025){const p=new T.Vector3(...a),q=new T.Vector3(...b),v=q.clone().sub(p),o=new T.Mesh(new T.CylinderGeometry(r,r,v.length(),5),m);o.position.copy(p.add(q).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());o.castShadow=true;g.add(o);return o;}
 function cyl(g,m,x,y,z,r,h){const o=new T.Mesh(new T.CylinderGeometry(r,r,h,12),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;g.add(o);return o;}
 function lander(n){
   const g=new T.Group(),silver=mat(0xb7c3c6),white=mat(0xe0e4df),grey=mat(0x91a2a6),dark=mat(0x23353a),rim=mat(0xcad6d7),glass=mat(0x091d28,{roughness:.2});
   // Stepped spherical pressure vessel. No rocket stage remained attached to it.
   for(let y=0;y<12;y++)for(let x=-7;x<=7;x++)for(let z=-7;z<=7;z++){
     const xx=x*.14,yy=(y-5.5)*.135,zz=z*.14,r=xx*xx+zz*zz+yy*yy*1.2;
     if(r>.94*.94||r<.75*.75)continue;
     box(g,(x+y+z)%9===0?grey:(x+y)%3?silver:white,xx,.98+yy,zz,.145,.14,.145);
   }
   cyl(g,dark,0,.89,0,.957,.055);cyl(g,rim,0,.93,0,.963,.034);
   // Four unfolded shell petals: curved trays, with voxel edges and hinge ribs.
   for(let k=0;k<4;k++){
     const petal=new T.Group();petal.rotation.y=k*Math.PI/2;g.add(petal);
     for(let j=0;j<11;j++){
       const t=j/10,z=.73+j*.18,w=.36+1.08*Math.pow(Math.sin(Math.PI*t),.65),y=.15+.44*(1-t)**2;
       box(petal,white,0,y,z,w,.065,.185);
       for(const side of [-1,1]){box(petal,silver,side*w/2,y+.055,z,.06,.13,.19);}
       box(petal,rim,0,y+.039,z,.04,.03,.19);
     }
     cyl(petal,dark,0,.61,.79,.14,.12);rod(petal,silver,[-.22,.59,.7],[.22,.59,.7],.035);
   }
   // Panorama camera's mirror turret and four spring antenna whips.
   cyl(g,grey,0,1.82,0,.19,.28);cyl(g,white,0,2.01,0,.21,.08);
   for(let k=0;k<10;k++){const a=k*Math.PI/5;rod(g,dark,[Math.sin(a)*.17,1.74,Math.cos(a)*.17],[Math.sin(a)*.17,1.92,Math.cos(a)*.17],.013);}
   box(g,glass,0,1.85,.195,.14,.11,.025);
   for(const [x,z] of [[-.57,-.57],[.57,-.57],[.57,.57],[-.57,.57]]){cyl(g,dark,x,1.52,z,.07,.18);rod(g,silver,[x,1.56,z],[x*2.02,3.5+(x>0?.2:0),z*2.02],.017);}
   for(const side of [-1,1]){const p=cyl(g,dark,side*.52,1.35,.65,.10,.08);p.rotation.x=Math.PI/2;box(g,white,side*.73,1.1,.50,.19,.25,.20);}
   if(n===13){
     // Two hinged instrument booms, not a sample-return drilling system.
     for(const side of [-1,1]){const a=[side*.76,.92,-.2],b=[side*1.66,.75,-.45],c=[side*2.6,.24,-.7];rod(g,silver,a,b,.04);rod(g,rim,b,c,.033);box(g,grey,...b,.16,.15,.16);if(side<0){cyl(g,dark,c[0],.29,c[2],.10,.35);cyl(g,silver,c[0],.52,c[2],.15,.16);}else{box(g,white,c[0],.23,c[2],.37,.25,.30);box(g,dark,c[0],.087,c[2],.27,.025,.24);}}
   }
   const cv=document.createElement('canvas');cv.width=256;cv.height=80;const q=cv.getContext('2d');q.fillStyle='#c6d0ce';q.fillRect(0,0,256,80);q.fillStyle='#25383e';q.textAlign='center';q.font='bold 27px sans-serif';q.fillText('ЛУНА '+n+' / CCCP',128,50);
   const plate=new T.Mesh(new T.PlaneGeometry(.72,.225),new T.MeshStandardMaterial({map:new T.CanvasTexture(cv)}));plate.position.set(0,1.09,.985);g.add(plate);
   g.name='Luna '+n+' deployed automatic lunar station';g.userData={petals:4,antennas:4,regolithProbes:n===13?2:0,batteryPowered:true,rover:false};A.batch(g);return {group:g,ascent:null,mission:'luna'+n};
 }
 const regions=[9,13].map(n=>({mission:{id:'luna'+n,name:'Luna '+n+' · 月球'+n+'号',sub:n===9?'FIRST SOFT LANDING / 1966':'REGOLITH STUDIES / 1966',approximate:true,spawn:{x:-12,z:-15,yaw:.56},spots:[{x:23,z:22,title:'风暴洋 · 撞击坑观察',card:'crater'},{x:31,z:32,title:n===9?'月面承载 · 软着陆先驱':'月壤物性 · 原位测量',card:'samples'}]},context:LunaRegions.context(n+50),lander:()=>lander(n)}));
 return {regions,lander};
})();
