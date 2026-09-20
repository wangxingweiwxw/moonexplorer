/* Blue Ghost Mission 1 / Firefly Aerospace. Reference-inspired voxel science exhibit. */
window.BlueGhostRegion=(()=>{
 'use strict';
 const T=THREE,A=RoverArt;
 const hash=(x,z)=>{const n=Math.sin(x*127.1+z*311.7+52.3)*43758.5453;return n-Math.floor(n);};
 const mat=(color,extra={})=>new T.MeshStandardMaterial({color,map:A.texture('panel'),roughness:.65,metalness:.35,flatShading:true,...extra});
 function box(g,m,x,y,z,w,h,d){const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;g.add(o);return o;}
 function rod(g,m,a,b,r=.04){const p=new T.Vector3(...a),q=new T.Vector3(...b),v=q.clone().sub(p),o=new T.Mesh(new T.CylinderGeometry(r,r,v.length(),6),m);o.position.copy(p.add(q).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());o.castShadow=true;g.add(o);return o;}
 function lander(){
   const group=new T.Group(),gold=[mat(0xb39b41,{metalness:.7}),mat(0xe0c36a,{metalness:.65}),mat(0x847631,{metalness:.6})],white=mat(0xe3dfd1),silver=mat(0xa7b0b5),dark=mat(0x23282c),solar=mat(0x101d2d,{metalness:.5,roughness:.36});
   // Stepped trapezoid and individual foil tiles retain the pixel silhouette.
   for(let j=0;j<10;j++){
     const y=1.1+j*.205,w=3.4-j*.075,d=2.8-j*.05;
     box(group,gold[0],0,y,0,w,.21,d);
     for(let i=0;i<16;i++)for(const side of [-1,1]){const x=(i-7.5)*w/16,m=gold[Math.floor(hash(i,j+side*15)*3)];box(group,m,x,y,side*(d/2+.018),w/16+.008,.21,.06);}
     for(let i=0;i<13;i++)for(const side of [-1,1])box(group,gold[Math.floor(hash(i+31,j+side*23)*3)],side*(w/2+.018),y,(i-6)*d/13,.06,.21,d/13+.008);
   }
   box(group,silver,0,3.07,0,2.82,.12,2.38);box(group,dark,0,.88,0,2.45,.24,1.95);
   for(const sx of [-1,1])for(const sz of [-1,1]){
     const foot=[sx*2.8,.17,sz*2.45];rod(group,gold[1],[sx*1.15,2.95,sz*1.03],foot,.072);rod(group,silver,[sx*1.55,1.12,sz*1.2],foot,.055);rod(group,gold[0],[sx*.6,1.0,sz*.65],foot,.04);
     const pad=new T.Mesh(new T.CylinderGeometry(.48,.53,.17,12),silver);pad.position.set(foot[0],.09,foot[2]);pad.castShadow=pad.receiveShadow=true;group.add(pad);
   }
   // Broad gridded solar panel, tilted outward at its lower edge as in the reference.
   const panel=new T.Group();panel.position.set(.34,2.04,1.56);panel.rotation.x=.15;group.add(panel);
   box(panel,silver,0,0,0,2.57,2.0,.085);box(panel,solar,0,0,.055,2.45,1.88,.03);
   for(let x=0;x<12;x++)box(panel,silver,-1.21+x*.22,0,.078,.012,1.87,.014);
   for(let y=0;y<9;y++)box(panel,silver,0,-.92+y*.23,.079,2.44,.012,.014);
   for(let x=0;x<11;x++)for(let y=0;y<8;y++)box(panel,white,-1.1+x*.22,-.805+y*.23,.09,.023,.023,.012);
   box(group,dark,.55,3.25,-.4,1.0,.3,.8);box(group,silver,.6,3.5,-.55,1.85,.055,.82);
   box(group,solar,.6,3.535,-.55,1.74,.015,.73);
   const antenna=new T.Group();antenna.position.set(-.67,3.64,.06);antenna.rotation.x=-.65;antenna.rotation.z=-.18;group.add(antenna);
   rod(group,silver,[-.67,3.08,.06],[-.67,3.66,.06],.07);box(antenna,white,0,.28,0,.96,1.12,.14);box(antenna,silver,0,.28,-.09,.82,1,.045);
   for(let i=0;i<4;i++)box(antenna,dark,-.5,-.12+i*.25,.0,.06,.07,.09);
   for(const x of [-1.02,1.02]){box(group,white,x,3.2,.55,.28,.25,.26);rod(group,silver,[x,3.22,.55],[x,3.61,.55],.025);box(group,white,x,3.67,.55,.18,.14,.16);}
   for(const x of [-.85,.85]){box(group,dark,x,.67,.25,.48,.35,.46);box(group,silver,x,.48,.25,.56,.06,.52);}
   // Roof science payloads, optics and landing cameras; no rover or ascent stage.
   for(const z of [-.7,.3]){box(group,white,-1.48,1.25,z,.35,.37,.4);box(group,dark,-1.675,1.25,z,.06,.17,.17);}
   group.name='Blue Ghost Mission 1 / Firefly Aerospace';group.userData.landingLegs=4;A.batch(group);return {group,ascent:null,mission:'bg1'};
 }
 function heightAt(x,z){let h=2.8+Math.sin(x*.095)*.35+Math.cos(z*.08)*.25;
   for(const [cx,cz,r,d] of [[18,17,9,2.6],[-25,22,6,1.5],[-29,-30,11,2.3]]){const t=Math.hypot(x-cx,z-cz)/r;if(t<1)h+=t>.76?Math.sin((t-.76)/.24*Math.PI)*.5:-d*Math.pow(1-t/.76,1.3);}
   for(const [cx,cz,r,v] of [[38,36,19,10],[44,-35,13,6],[-43,38,15,5]]){const t=Math.hypot(x-cx,z-cz)/r;if(t<1)h+=Math.pow(1-t,.8)*v;}
   return h;
 }
 const voxelY=(x,z)=>Math.round(heightAt((Math.floor(x*2)+.5)/2,(Math.floor(z*2)+.5)/2)*4)/4;
 function dressing(){const group=new T.Group(),rock=mat(0x999588);for(let i=0;i<230;i++){const x=(hash(i,1)-.5)*114,z=(hash(i,2)-.5)*114,s=.18+hash(i,3)*.9;box(group,rock,x,voxelY(x,z)+s*.3,z,s,s*.6,s*.85);}
   for(const [x,z,s] of [[-32,5,.65],[29,-15,.85],[42,24,.6]]){const c=A.crystal();c.position.set(x,voxelY(x,z),z);c.scale.setScalar(s);group.add(c);}return {group,markers:[]};}
 const mission={id:'bg1',name:'蓝色幽灵一号',sub:'MARE CRISIUM / 2025',spawn:{x:-12,z:-15,yaw:.56},spots:[{x:18,z:17,title:'危海 · 撞击坑观察',card:'crater'},{x:31,z:32,title:'危海岩石 · 对照月海与高地',card:'highlands'}]};
 return {mission,context:{heightAt,voxelY,dressing,groundColor:(x,z)=>hash(Math.floor(x*2),Math.floor(z*2))>.5?0xb9b2a2:0x9f9b91},lander};
})();
