/* Reference-inspired Vikram / Pragyan science exhibit; no ascent stage. */
window.Chandrayaan3Region=(()=>{
 'use strict';
 const T=THREE,A=RoverArt;
 const hash=(x,z)=>{const n=Math.sin(x*127.1+z*311.7+83.2)*43758.5453;return n-Math.floor(n);};
 const mat=(color,extra={})=>new T.MeshStandardMaterial({color,map:A.texture('panel'),roughness:.62,metalness:.4,flatShading:true,...extra});
 function box(g,m,x,y,z,w,h,d){const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;g.add(o);return o;}
 function rod(g,m,a,b,r=.035){const p=new T.Vector3(...a),q=new T.Vector3(...b),v=q.clone().sub(p),o=new T.Mesh(new T.CylinderGeometry(r,r,v.length(),6),m);o.position.copy(p.add(q).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());o.castShadow=true;g.add(o);return o;}
 function palette(){return {gold:[mat(0xd4ab36,{metalness:.7}),mat(0xefcc67,{metalness:.68}),mat(0xa78029,{metalness:.65})],white:mat(0xe9e5d9),silver:mat(0xaeb6b7),dark:mat(0x26292b),solar:mat(0x182536,{roughness:.38})};}
 function panel(g,m,x,y,z,w,h,tilt=0){const p=new T.Group();p.position.set(x,y,z);p.rotation.x=tilt;g.add(p);box(p,m.silver,0,0,0,w,h,.065);box(p,m.solar,0,0,.04,w-.08,h-.08,.02);for(let i=1;i<8;i++)box(p,m.silver,-w/2+i*w/8,0,.055,.014,h-.08,.012);for(let j=1;j<10;j++)box(p,m.silver,0,-h/2+j*h/10,.056,w-.08,.012,.012);return p;}
 function lander(){
   const group=new T.Group(),m=palette();
   for(let j=0;j<10;j++){const y=1.05+j*.18,w=2.95-j*.07;box(group,m.gold[0],0,y,0,w,.185,w);
     for(let i=0;i<13;i++)for(const side of [-1,1]){const c=m.gold[Math.floor(hash(i,j+side*17)*3)];box(group,c,(i-6)*w/13,y,side*(w/2+.015),w/13,.18,.045);box(group,c,side*(w/2+.015),y,(i-6)*w/13,.045,.18,w/13);}}
   box(group,m.silver,0,2.8,0,2.33,.09,2.33);box(group,m.dark,0,.9,0,2.4,.2,2.4);
   for(const sx of [-1,1])for(const sz of [-1,1]){const foot=[sx*2.65,.13,sz*2.65];rod(group,m.gold[1],[sx*1.02,2.65,sz*1.02],foot,.068);rod(group,m.silver,[sx*1.4,1.15,sz*.72],foot,.05);rod(group,m.gold[2],[sx*.72,1.15,sz*1.4],foot,.045);box(group,m.gold[2],foot[0],.1,foot[2],.72,.19,.72);
     const engine=new T.Mesh(new T.CylinderGeometry(.16,.3,.42,8),m.dark);engine.position.set(sx*.8,.63,sz*.8);engine.castShadow=true;group.add(engine);}
   // Three body-mounted solar faces, rather than Chang'e-style horizontal wings.
   panel(group,m,-.58,1.88,1.45,1.05,1.5,.2);
   const side=new T.Group();side.rotation.y=Math.PI/2;group.add(side);panel(side,m,0,1.87,1.45,1.7,1.5,.2);
   const rear=new T.Group();rear.rotation.y=Math.PI;group.add(rear);panel(rear,m,0,1.87,1.45,1.7,1.5,.2);
   box(group,m.dark,.61,1.94,1.49,.7,1.57,.1);box(group,m.gold[1],.61,1.97,1.55,.4,.42,.05);
   for(const cy of [1.34,2.54])for(let x=0;x<4;x++)for(let y=0;y<3;y++)box(group,(x+y)%2?m.dark:m.white,.46+x*.09,cy+y*.075,1.554,.085,.07,.025);
   for(const x of [-.75,.75]){box(group,m.white,x,2.94,-.45,.36,.25,.32);rod(group,m.silver,[x,3.03,-.45],[x,3.36,-.45],.025);}
   const dome=new T.Mesh(new T.SphereGeometry(.45,8,4,0,Math.PI*2,0,Math.PI/2),m.gold[1]);dome.position.set(.15,2.91,.12);group.add(dome);rod(group,m.silver,[.15,2.9,.12],[.15,3.57,.12],.025);
   box(group,m.gold[0],-.8,3.03,.55,.37,.4,.37);box(group,m.dark,-.8,3.03,.75,.18,.18,.04);
   // Small tricolour spacecraft decal; the neighbouring Chinese flags remain separate.
   for(const [i,c] of [0xff9933,0xffffff,0x138808].entries())box(group,mat(c),-.42,2.59-i*.07,1.25,.35,.068,.025);
   box(group,mat(0x000080),-.42,2.52,1.267,.043,.043,.014);
   // Folded ramp, surface-temperature probe and instrument boxes.
   const ramp=box(group,m.silver,0,.55,-1.82,.83,.09,1.35);ramp.rotation.x=-.5;
   rod(group,m.gold[1],[1.3,1.28,.1],[1.75,.25,.1],.045);box(group,m.white,1.75,.21,.1,.3,.2,.3);
   group.name='Vikram / Chandrayaan-3';group.userData.landingLegs=4;A.batch(group);return {group,ascent:null,mission:'cy3'};
 }
 function rover(){const g=new T.Group(),m=palette();box(g,m.gold[0],0,.64,0,1.15,.42,1.45);box(g,m.silver,0,.9,0,1.1,.07,1.4);
   for(const side of [-1,1])for(let i=0;i<3;i++){const z=(i-1)*.62;rod(g,m.silver,[side*.43,.58,0],[side*.69,.32,z],.04);const w=new T.Mesh(new T.CylinderGeometry(.29,.29,.2,12),m.silver);w.rotation.z=Math.PI/2;w.position.set(side*.73,.3,z);w.castShadow=true;g.add(w);for(let j=0;j<12;j++){const a=j*Math.PI/6,t=box(g,m.dark,side*.73,.3+Math.cos(a)*.283,z+Math.sin(a)*.283,.23,.035,.065);t.rotation.x=a;}}
   rod(g,m.gold[1],[-.38,.87,-.44],[-.38,1.55,-.44],.025);rod(g,m.gold[1],[.38,.87,-.44],[.38,1.55,-.44],.025);panel(g,m,0,1.57,-.45,1.18,1.2,-.12);
   box(g,m.white,0,.78,.77,.8,.22,.14);for(const x of [-.27,.27])box(g,m.dark,x,.8,.86,.16,.15,.08);
   box(g,m.gold[2],0,.5,.8,.28,.24,.19);g.name='Pragyan / Chandrayaan-3';g.userData.wheelCount=6;A.batch(g);return g;
 }
 function heightAt(x,z){let h=2.8+Math.sin(x*.07)*.35+Math.cos(z*.09)*.3;
   for(const [cx,cz,r,d] of [[23,21,10,3],[-26,26,8,2.5],[29,-27,7,1.8]]){const t=Math.hypot(x-cx,z-cz)/r;if(t<1)h+=t>.76?Math.sin((t-.76)/.24*Math.PI)*.65:-d*Math.pow(1-t/.76,1.4);}
   for(const [cx,cz,r,v] of [[43,36,18,9],[-43,30,18,7],[38,-39,15,6]]){const t=Math.hypot(x-cx,z-cz)/r;if(t<1)h+=Math.pow(1-t,.9)*v;}return h;}
 const voxelY=(x,z)=>Math.round(heightAt((Math.floor(x*2)+.5)/2,(Math.floor(z*2)+.5)/2)*4)/4;
 function dressing(){const group=new T.Group(),rock=mat(0x99968e);for(let i=0;i<240;i++){const x=(hash(i,1)-.5)*114,z=(hash(i,2)-.5)*114,s=.16+hash(i,3)*.85;box(group,rock,x,voxelY(x,z)+s*.3,z,s,s*.6,s*.85);}for(const [x,z,s] of [[-35,-24,.6],[32,9,.7]]){const c=A.crystal();c.position.set(x,voxelY(x,z),z);c.scale.setScalar(s);group.add(c);}return {group,markers:[]};}
 const mission={id:'cy3',name:'月船三号',sub:'SOUTHERN HIGHLANDS / 2023',spawn:{x:-12,z:-15,yaw:.48},spots:[{x:23,z:21,title:'南部高纬度 · 撞击坑观察',card:'crater'},{x:30,z:32,title:'月船三号 · 高地岩石对照',card:'highlands'}]};
 return {mission,context:{heightAt,voxelY,dressing,groundColor:(x,z)=>hash(Math.floor(x*2),Math.floor(z*2))>.5?0xb0aca3:0x97958f},lander,rover};
})();
