/* Chang'e 4 and Yutu-2: reference-inspired voxel exhibits, not current telemetry. */
window.Change4Region=(()=>{
 'use strict';
 const T=THREE,A=RoverArt;
 const hash=(x,z)=>{const n=Math.sin(x*127.1+z*311.7+41.9)*43758.5453;return n-Math.floor(n);};
 const mat=(color,extra={})=>new T.MeshStandardMaterial({color,map:A.texture('panel'),roughness:.73,metalness:.25,flatShading:true,...extra});
 function box(g,m,x,y,z,w,h,d){const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;g.add(o);return o;}
 function rod(g,m,a,b,r=.04){const p=new T.Vector3(...a),q=new T.Vector3(...b),v=q.clone().sub(p),o=new T.Mesh(new T.CylinderGeometry(r,r,v.length(),6),m);o.position.copy(p.add(q).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());o.castShadow=true;g.add(o);return o;}
 function lens(g,silver,black,x,y,z,r){const ring=new T.Mesh(new T.CylinderGeometry(r,r,.06,12),silver);ring.rotation.x=Math.PI/2;ring.position.set(x,y,z);g.add(ring);const glass=new T.Mesh(new T.CylinderGeometry(r*.7,r*.7,.075,12),black);glass.rotation.x=Math.PI/2;glass.position.set(x,y,z+.015);g.add(glass);}
 function flag(g,x,y,z,w){const cv=document.createElement('canvas');cv.width=240;cv.height=160;const c=cv.getContext('2d');c.fillStyle='#c6242d';c.fillRect(0,0,240,160);c.fillStyle='#fbe36b';
   function star(x,y,r,angle=-Math.PI/2){c.beginPath();for(let i=0;i<10;i++){const a=angle+i*Math.PI/5,rr=i%2?r*.4:r;c.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}c.closePath();c.fill();}
   star(43,43,22);for(const [x,y] of [[79,18],[96,37],[96,62],[79,82]])star(x,y,8,Math.atan2(43-y,43-x));const tex=new T.CanvasTexture(cv);tex.colorSpace=T.SRGBColorSpace;tex.magFilter=T.NearestFilter;
   const decal=new T.Mesh(new T.PlaneGeometry(w,w*2/3),new T.MeshStandardMaterial({map:tex,side:T.DoubleSide}));decal.position.set(x,y,z);g.add(decal);
 }
 function lander(mission=4){
   const group=new T.Group(),gold=[mat(0xd8ac47,{metalness:.6}),mat(0xf0cf75,{metalness:.65}),mat(0x96712f,{metalness:.65})],white=mat(0xe2e1d8),silver=mat(0xaeb8bb),black=mat(0x222c35),blue=mat(0x152c48);
   box(group,gold[0],0,1.95,0,2.9,1.65,2.7);box(group,silver,0,2.83,0,3.02,.13,2.82);
   for(let face=0;face<4;face++)for(let i=0;i<13;i++)for(let j=0;j<8;j++){
     const a=(i-6)*.219,h=1.17+j*.202,out=(face<2?1.37:1.48)+hash(i,j+face)*.035;
     box(group,gold[Math.floor(hash(i+face*17,j)*3)],face<2?a:(face===2?out:-out),h,face<2?(face===0?out:-out):a,face<2?.22:.07,.21,face<2?.07:.22);
   }
   for(const sx of [-1,1])for(const sz of [-1,1]){rod(group,gold[1],[sx*1.1,2.35,sz*1.05],[sx*2.7,.18,sz*2.5],.095);rod(group,silver,[sx*.9,1.3,sz*.8],[sx*2.5,.4,sz*2.25]);box(group,gold[2],sx*2.7,.12,sz*2.5,.8,.16,.7);}
   box(group,black,0,1.0,0,1.2,.35,1.2);box(group,white,0,2.99,0,1.65,.22,1.6);
   for(const side of [-1,1]){box(group,gold[1],side*1.6,2.08,.2,.45,1.15,1.4);lens(group,silver,black,side*1.62,2.4,.94,.12);rod(group,silver,[side*1.05,2.85,.3],[side*1.05,3.6,.3],.027);box(group,white,side*1.05,3.66,.3,.26,.15,.22);
     const panel=new T.Group();panel.position.set(side*(mission===3?2.2:2.08),mission===3?2.35:2.5,-.6);panel.rotation.z=side*(mission===3?-.65:.45);group.add(panel);box(panel,blue,0,0,0,mission===3?1.6:1.15,.07,1.7);if(mission===3){for(let j=0;j<7;j++)box(panel,silver,-.72+j*.24,.05,0,.015,.015,1.65);for(let j=0;j<5;j++)box(panel,silver,0,.05,-.8+j*.4,1.5,.015,.015);}
     for(let i=0;i<5;i++)box(group,silver,side*1.42,1.55+i*.2,1.42,.14,.05,.06);
   }
   // The tall radio antennas are the main silhouette in the supplied reference.
   if(mission===4){rod(group,silver,[.4,2.9,-.6],[.4,7.2,-.6],.018);box(group,white,.4,3.25,-.6,.2,.7,.2);}
   else {const dish=new T.Mesh(new T.ConeGeometry(.48,.15,12,1,true),white);dish.position.set(.55,3.32,-.38);dish.rotation.x=1.1;group.add(dish);box(group,black,-.6,3.04,.5,.64,.42,.6);lens(group,silver,black,-.6,3.12,.84,.19);}
   if(mission===4){rod(group,black,[-1.2,2.8,-.7],[-2.5,1.6,-.7],.034);rod(group,black,[1.2,2.8,-.7],[2.4,4,-.7],.034);}
   rod(group,silver,[-.5,3,0],[-.5,3.8,0],.035);box(group,white,-.5,3.85,0,.3,.16,.25);lens(group,silver,black,-.5,3.85,.15,.075);
   // Paired deployment tracks; the display rover is already on the surface.
   for(const side of [-1,1]){rod(group,silver,[side*.53,1.15,1.3],[side*.53,.14,3.6],.075);for(let i=0;i<10;i++)box(group,black,side*.53,1.13-i*.1,1.4+i*.23,.35,.08,.18);}
   flag(group,-.35,2.35,1.48,.52);A.batch(group);group.name="Chang'e "+mission+" lander";
   // CE-4 has no ascent stage. The shared heritage toggle must leave it intact.
   return {group,ascent:null,mission};
 }
 function rover(mission=4){
   const g=new T.Group();g.userData.yutuGeneration=mission===3?1:2;const silver=mat(0xbfc4c1),foil=mat(0xe2dfd3),gold=mat(0x9b7b37),dark=mat(0x22282c),blue=mat(0x12395e,{metalness:.5,roughness:.35}),grid=mat(0x7090aa);
   box(g,gold,0,.65,0,1.25,.2,1.5);box(g,foil,0,1,0,1.45,.6,1.65);box(g,silver,0,1.34,0,1.58,.12,1.78);
   for(let i=0;i<36;i++){const x=(hash(i,5)-.5)*1.4,y=.76+hash(i,8)*.52;const o=box(g,i%3?foil:silver,x,y,.85,.16,.16,.035);o.rotation.z=(hash(i,4)-.5)*.4;}
   for(const side of [-1,1]){
     rod(g,silver,[side*.62,.74,-.7],[side*.92,.45,0],.05);rod(g,silver,[side*.92,.45,0],[side*.92,.34,.78],.05);rod(g,silver,[side*.92,.45,0],[side*.92,.34,-.78],.05);
     for(const z of [-.8,0,.8]){const wheel=new T.Mesh(new T.CylinderGeometry(.3,.3,.21,16),dark);wheel.rotation.z=Math.PI/2;wheel.position.set(side*.94,.33,z);wheel.castShadow=true;g.add(wheel);
       for(let i=0;i<14;i++){const a=i*Math.PI/7,o=box(g,silver,side*.94,.33+Math.sin(a)*.29,z+Math.cos(a)*.29,.23,.05,.09);o.rotation.x=-a;}
       box(g,gold,side*1.065,.33,z,.06,.16,.16);
     }
     box(g,silver,side*1.37,1.33,0,1.2,.05,1.65);box(g,blue,side*1.37,1.365,0,1.14,.025,1.58);
     for(let i=0;i<7;i++)box(g,grid,side*1.37-.54+i*.18,1.39,0,.012,.01,1.58);
     for(let i=0;i<5;i++)box(g,grid,side*1.37,1.39,-.76+i*.38,1.14,.01,.012);
     lens(g,silver,dark,side*.52,.96,.87,.085);
   }
   rod(g,silver,[0,1.4,.35],[0,2.42,.35],.045);box(g,silver,0,2.45,.35,1.02,.22,.25);
   for(const x of [-.34,.34])lens(g,silver,dark,x,2.46,.5,.085);
   const dish=new T.Mesh(new T.ConeGeometry(mission===3?.5:.35,.11,12,1,true),mission===3?foil:silver);dish.position.set(0,1.96,.45);dish.rotation.x=1.1;g.add(dish);
   for(const side of [-1,1])rod(g,dark,[side*.68,1.4,-.6],[side*.8,2.15,-.8],.014);
   flag(g,0,1.05,.883,.3);g.name=mission===3?'Yutu six-wheel rover':'Yutu-2 six-wheel rover';g.userData.wheelCount=6;A.batch(g);return g;
 }
 function heightAt(x,z){let h=2.8+Math.sin(x*.11)*.35+Math.cos(z*.095)*.25;
   for(const [cx,cz,r,d] of [[18,23,10,2.7],[-25,-25,8,1.9],[32,-18,6,1.5]]){const t=Math.hypot(x-cx,z-cz)/r;if(t<1)h+=t>.76?Math.sin((t-.76)/.24*Math.PI)*.4:-d*Math.pow(1-t/.76,1.3);}
   for(const [cx,cz,r,hill] of [[-42,31,15,7],[35,40,16,8],[42,-40,14,6]]){const d=Math.hypot(x-cx,z-cz)/r;if(d<1)h+=Math.pow(1-d,.8)*hill;}
   return h;
 }
 const voxelY=(x,z)=>Math.round(heightAt((Math.floor(x*2)+.5)/2,(Math.floor(z*2)+.5)/2)*4)/4;
 function dressing(){const group=new T.Group(),stone=mat(0x96958d);for(let i=0;i<170;i++){const x=(hash(i,1)-.5)*112,z=(hash(i,2)-.5)*112,s=.2+hash(i,3)*1.05;box(group,stone,x,voxelY(x,z)+s*.3,z,s,s*.6,s*.8);}return {group,markers:[]};}
 const mission={id:4,name:'嫦娥四号',sub:'VON KÁRMÁN / 2019',spawn:{x:-12,z:-15,yaw:.48},spots:[{x:18,z:23,title:'冯·卡门坑 · 撞击地貌',card:'crater'},{x:23,z:-16,title:'月背高地 · 岩石观察',card:'highlands'}]};
 return {mission,context:{heightAt,voxelY,dressing,groundColor:(x,z)=>hash(Math.floor(x*2),Math.floor(z*2))>.5?0xb1afa7:0x999890},lander,rover};
})();
