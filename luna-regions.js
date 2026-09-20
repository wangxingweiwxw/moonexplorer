/* Luna 16 / 20: Ye-8-5; Luna 24: Ye-8-5M. Stylised sample-return exhibits. */
window.LunaRegions=(()=>{
 'use strict';
 const T=THREE,A=RoverArt;
 const hash=(x,z)=>{const n=Math.sin(x*127.1+z*311.7+24.16)*43758.5453;return n-Math.floor(n);};
 const mat=(color,extra={})=>new T.MeshStandardMaterial({color,map:A.texture('panel'),roughness:.63,metalness:.48,flatShading:true,...extra});
 function box(g,m,x,y,z,w,h,d){const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;g.add(o);return o;}
 function rod(g,m,a,b,r=.035){const p=new T.Vector3(...a),q=new T.Vector3(...b),v=q.clone().sub(p),o=new T.Mesh(new T.CylinderGeometry(r,r,v.length(),6),m);o.position.copy(p.add(q).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());o.castShadow=true;g.add(o);return o;}
 function cylinder(g,m,x,y,z,top,bottom,h){const o=new T.Mesh(new T.CylinderGeometry(top,bottom,h,12),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;g.add(o);return o;}
 // Layered square cross-sections give the spherical tanks a voxel silhouette.
 function tank(g,m,x,y,z,r){const step=.16;for(let iy=-r+step/2;iy<r;iy+=step){const ring=Math.sqrt(Math.max(0,r*r-iy*iy));for(let ix=-ring+step/2;ix<ring;ix+=step){const depth=2*Math.sqrt(Math.max(0,ring*ring-ix*ix));if(depth>.03)box(g,m,x+ix,y+iy,z,step,step,depth);}}}
 function badge(g,n){const c=document.createElement('canvas');c.width=256;c.height=128;const q=c.getContext('2d');q.fillStyle='#d7dbd8';q.fillRect(0,0,256,128);q.fillStyle='#20292a';q.textAlign='center';q.font='bold 48px sans-serif';q.fillText('СССР',128,53);q.font='bold 29px sans-serif';q.fillText('ЛУНА '+n,128,102);const o=new T.Mesh(new T.PlaneGeometry(.9,.45),new T.MeshStandardMaterial({map:new T.CanvasTexture(c),roughness:.9}));o.position.set(0,4.25,.64);g.add(o);}
 function lander(n){
   const group=new T.Group(),down=new T.Group(),up=new T.Group();group.add(down,up);
   const silver=mat(0xb8bfc0),white=mat(0xe0e2dd),dark=mat(0x343a3d),bronze=mat(n===24?0x968b68:0x9b9b8a),foil=mat(0xc9c8b8);
   // Four-legged descent platform, clustered tanks and central braking engine.
   cylinder(down,dark,0,1.04,0,1.3,1.3,.42);box(down,silver,0,1.36,0,2.5,.14,2.5);cylinder(down,dark,0,.67,0,.35,.66,.5);
   for(const sx of [-1,1])for(const sz of [-1,1]){const foot=[sx*2.5,.12,sz*2.5];rod(down,silver,[sx*1.06,1.63,sz*1.06],foot,.065);rod(down,dark,[sx*1.19,1.07,sz*.65],foot,.04);rod(down,silver,[sx*.65,1.07,sz*1.19],foot,.04);cylinder(down,silver,foot[0],.09,foot[2],.42,.48,.17);tank(down,bronze,sx*.9,1.82,sz*.91,.59);}
   for(const side of [-1,1]){cylinder(down,silver,side*1.36,2.0,0,.32,.32,.6);box(down,white,side*1.35,2.32,0,.55,.12,.58);}
   cylinder(down,silver,0,2.22,0,1.04,1.15,.27);box(down,dark,0,2.39,0,1.35,.09,1.35);
   // Ascent rocket with three propellant spheres, instrument drum and return capsule.
   cylinder(up,dark,0,2.58,0,.23,.43,.4);cylinder(up,silver,0,3.24,0,.35,.4,1.0);
   for(let i=0;i<3;i++){const a=i*Math.PI*2/3+.2;tank(up,foil,Math.sin(a)*.63,3.06,Math.cos(a)*.63,.48);rod(up,dark,[Math.sin(a)*.8,2.43,Math.cos(a)*.8],[0,3.9,0],.045);}
   cylinder(up,white,0,4.05,0,.6,.65,1.1);cylinder(up,dark,0,3.64,0,.66,.66,.07);cylinder(up,silver,0,4.54,0,.61,.61,.1);tank(up,white,0,4.96,0,.44);badge(up,n);
   // Side radiator/antenna panel, rigid aerials and optical head.
   const wing=box(up,white,.87,4.66,-.12,1.25,.08,.88);wing.rotation.z=.3;rod(up,silver,[.35,4.13,0],[1.45,4.86,-.1],.024);
   rod(down,silver,[-1.32,2.25,-.2],[-1.65,4.6,-.2],.025);for(let j=0;j<6;j++)box(down,white,-1.65,4.13+j*.09,-.2,.23-j*.022,.035,.09);
   rod(down,silver,[1.1,2.2,-.5],[1.5,3.2,-.5],.04);box(down,white,1.5,3.27,-.5,.35,.25,.33);box(down,dark,1.5,3.27,-.315,.13,.13,.04);
   if(n===24){
     // Ye-8-5M: tall lattice drill mast for a roughly two-metre core.
     for(const x of [1.48,1.9])rod(down,silver,[x,.15,1.0],[x,4.64,1.0],.035);
     for(let j=0;j<15;j++){const y=.22+j*.29;rod(down,silver,[1.48,y,1],[1.9,y,1],.025);if(j<14)rod(down,dark,[1.48,y,1],[1.9,y+.29,1],.018);}
     rod(down,dark,[1.7,.08,1.02],[1.7,2.6,1.02],.055);box(down,white,1.7,2.43,1.05,.62,.42,.48);rod(down,silver,[1.12,1.5,.5],[1.9,.32,1],.05);
   }else{
     // Ye-8-5: articulated sampling arm with a compact terminal drill head.
     const end=n===20?[2.18,.37,1.58]:[2.12,.33,.92];rod(down,silver,[1.0,2.25,.52],[1.85,1.84,.8],.085);rod(down,white,[1.85,1.84,.8],end,.065);cylinder(down,dark,end[0],end[1],end[2],.16,.12,.52);box(down,silver,1.87,1.82,.8,.32,.3,.3);
   }
   group.name='Luna '+n+' sample-return spacecraft';group.userData.landingLegs=4;group.userData.sampling=n===24?'deep-core-mast':'articulated-drill';A.batch(down);A.batch(up);return {group,ascent:up,mission:'luna'+n};
 }
 function context(n){
   function heightAt(x,z){let h=2.7+Math.sin(x*.08)*.3+Math.cos(z*.07)*.25;for(const [cx,cz,r,d] of [[23,22,10,2.8],[-25,28,8,1.8],[34,-24,7,1.6]]){const t=Math.hypot(x-cx,z-cz)/r;if(t<1)h+=t>.76?Math.sin((t-.76)/.24*Math.PI)*.6:-d*Math.pow(1-t/.76,1.4);}for(const [cx,cz,r,v] of [[40,38,19,n===20?13:6],[-43,27,17,n===20?11:5],[35,-39,16,5]]){const t=Math.hypot(x-cx,z-cz)/r;if(t<1)h+=Math.pow(1-t,.85)*v;}return h;}
   const voxelY=(x,z)=>Math.round(heightAt((Math.floor(x*2)+.5)/2,(Math.floor(z*2)+.5)/2)*4)/4;
   function dressing(){const group=new T.Group(),rock=mat(n===20?0xaaa596:0x949591);for(let i=0;i<215;i++){const x=(hash(i,n)-.5)*114,z=(hash(i,n+1)-.5)*114,s=.18+hash(i,n+2)*.95;box(group,rock,x,voxelY(x,z)+s*.3,z,s,s*.6,s*.85);}for(const [x,z] of [[-34,-26],[33,7]]){const c=A.crystal();c.position.set(x,voxelY(x,z),z);c.scale.setScalar(.6);group.add(c);}return {group,markers:[]};}
   return {heightAt,voxelY,dressing,groundColor:(x,z)=>hash(Math.floor(x*2),Math.floor(z*2))>.5?(n===20?0xbdb6a6:0xa4a69e):(n===20?0xa49f93:0x8e928e)};
 }
 const names={24:['危海','MARE CRISIUM / 1976'],20:['阿波洛尼乌斯高地','APOLLONIUS HIGHLANDS / 1972'],16:['丰富海','MARE FECUNDITATIS / 1970']};
 const regions=[24,20,16].map(n=>({mission:{id:'luna'+n,name:'Luna '+n+' · 月球'+n+'号',sub:names[n][1],spawn:{x:-12,z:-15,yaw:.56},spots:[{x:23,z:22,title:names[n][0]+' · 撞击坑观察',card:'crater'},{x:31,z:32,title:names[n][0]+' · 岩石对照',card:n===20?'highlands':'samples'}]},context:context(n),lander:()=>lander(n)}));
 return {regions,lander,context};
})();
