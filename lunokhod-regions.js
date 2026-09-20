/* Ye-8 landing platforms and separately readable Lunokhod rovers, after deployment. */
window.LunokhodRegions=(()=>{
 'use strict';
 const T=THREE,A=RoverArt;
 const mat=(color,extra={})=>new T.MeshStandardMaterial({color,map:A.texture('panel'),roughness:.67,metalness:.4,flatShading:true,...extra});
 function box(g,m,x,y,z,w,h,d){const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;g.add(o);return o;}
 function rod(g,m,a,b,r=.035){const p=new T.Vector3(...a),q=new T.Vector3(...b),v=q.clone().sub(p),o=new T.Mesh(new T.CylinderGeometry(r,r,v.length(),6),m);o.position.copy(p.add(q).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());o.castShadow=true;g.add(o);return o;}
 function cyl(g,m,x,y,z,r,h){const o=new T.Mesh(new T.CylinderGeometry(r,r,h,12),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;g.add(o);return o;}
 function tank(g,m,x,y,z,r){for(let j=0;j<9;j++){const yy=-r+(j+.5)*2*r/9,w=2*Math.sqrt(Math.max(0,r*r-yy*yy));const o=cyl(g,m,x,y+yy,z,w/2,2*r/9);o.rotation.y=Math.PI/12;}}
 function badge(g,text,x,y,z,w=.85){const c=document.createElement('canvas');c.width=256;c.height=96;const q=c.getContext('2d');q.fillStyle='#dce1dd';q.fillRect(0,0,256,96);q.fillStyle='#202b31';q.font='bold 34px sans-serif';q.textAlign='center';q.fillText(text,128,61);const o=new T.Mesh(new T.PlaneGeometry(w,w*.375),new T.MeshStandardMaterial({map:new T.CanvasTexture(c),roughness:.9}));o.position.set(x,y,z);g.add(o);}
 function lander(n){const g=new T.Group(),silver=mat(0xb7bdba),dark=mat(0x3b4447),foil=mat(0xa6a99c),white=mat(0xe0e3dc);
   cyl(g,dark,0,.78,0,1.15,.5);cyl(g,dark,0,.38,0,.48,.38);box(g,silver,0,1.7,0,3.25,.15,3.65);
   for(const sx of [-1,1])for(const sz of [-1,1]){tank(g,foil,sx*1.1,1.05,sz*1.13,.67);const foot=[sx*2.5,.12,sz*2.4];rod(g,silver,[sx*1.2,1.66,sz*1.35],foot,.065);rod(g,dark,[sx*.7,.73,sz*.8],foot,.045);cyl(g,silver,foot[0],.09,foot[2],.42,.17);}
   box(g,dark,0,1.81,0,2.3,.07,3.15);for(const x of [-1.02,1.02])box(g,white,x,1.88,0,.18,.07,3.25);
   // Two alternative descent directions, each with a pair of wheel tracks.
   for(const side of [-1,1])for(const x of [-1.02,1.02]){const start=[x,1.8,side*1.8],end=[x,.14,side*6.2];for(const dx of [-.28,.28])rod(g,silver,[x+dx,start[1],start[2]],[x+dx,end[1],end[2]],.045);for(let j=0;j<=16;j++){const t=j/16,y=start[1]+(end[1]-start[1])*t,z=start[2]+(end[2]-start[2])*t;const b=box(g,silver,x,y,z,.58,.07,.19);b.rotation.x=side*Math.atan2(1.66,4.4);}}
   rod(g,silver,[-1.6,1.72,.25],[-1.6,3.15,.25],.028);for(let j=0;j<6;j++)box(g,white,-1.6,2.65+j*.085,.25,.24-j*.025,.028,.08);
   box(g,white,1.72,1.44,.3,.37,.35,.45);box(g,dark,1.92,1.44,.3,.04,.13,.2);badge(g,'ЛУНА '+n,0,1.45,1.87,1.0);
   g.name='Luna '+n+' Ye-8 rover delivery platform';g.userData.landingLegs=4;g.userData.rampDirections=2;A.batch(g);return {group:g,ascent:null,mission:'luna'+n};
 }
 function rover(generation){const g=new T.Group(),silver=mat(generation===1?0xc4c9c4:0xaeb8b9),white=mat(0xe3e5dd),dark=mat(0x2f373b),solar=mat(0x162a3c,{roughness:.4}),rim=mat(0x8d9797);
   box(g,dark,0,.62,0,1.6,.22,2.55);
   // Eight independently driven wheels with open spokes and tread bars.
   for(const side of [-1,1])for(let i=0;i<4;i++){const z=(i-1.5)*.73,x=side*1.22;rod(g,silver,[side*.69,.73,z],[x,.45,z],.065);
     const wheel=new T.Group();wheel.position.set(x,.45,z);g.add(wheel);const torus=new T.Mesh(new T.TorusGeometry(.4,.045,4,16),rim);torus.rotation.y=Math.PI/2;wheel.add(torus);
     const hub=cyl(wheel,silver,0,0,0,.105,.26);hub.rotation.z=Math.PI/2;
     for(let j=0;j<12;j++){const a=j*Math.PI/6,yy=Math.cos(a)*.4,zz=Math.sin(a)*.4;rod(wheel,rim,[0,0,0],[0,yy,zz],.016);const tread=box(wheel,dark,0,yy,zz,.23,.045,.09);tread.rotation.x=a;}}
   // Stepped tub body, wider at the top, evokes the reference's inverted cone.
   for(let j=0;j<8;j++){const o=cyl(g,silver,0,.92+j*.12,0,.82+j*.047,.125);o.scale.z=1.14;}
   const top=cyl(g,white,0,1.86,0,1.19,.09);top.scale.z=1.14;
   const lid=new T.Group();lid.position.set(0,1.88,-1.29);lid.rotation.x=generation===1?-1.03:-1.2;g.add(lid);
   const cover=cyl(lid,silver,0,0,1.27,1.21,.075);cover.scale.z=1.12;
   for(let x=-5;x<=5;x++)for(let z=-5;z<=5;z++){if((x*.21)**2+(z*.235)**2<1.15**2)box(lid,solar,x*.21,-.053,1.27+z*.235,.195,.025,.22);}
   rod(g,silver,[-.8,1.2,-.7],[-.9,2.66,-.75],.03);rod(g,silver,[-.9,2.66,-.75],[-1.45,3.47,-.75],.022);for(let j=0;j<8;j++){const t=j/7;rod(g,white,[-.9-.55*t-.2,2.66+.81*t,-.75],[-.9-.55*t+.2,2.66+.81*t,-.75],.016);}
   rod(g,silver,[.75,1.6,-.4],[.75,2.67,-.4],.025);for(let j=0;j<6;j++)box(g,white,.75,2.28+j*.065,-.4,.19-j*.02,.026,.08);
   // Second rover's raised navigation camera distinguishes the two generations.
   const cy=generation===2?2.55:1.52;if(generation===2)rod(g,silver,[0,1.7,1.05],[0,cy,1.05],.045);
   box(g,white,0,cy,1.24,.78,.22,.24);for(const x of [-.25,.25])box(g,dark,x,cy,1.385,.14,.13,.055);
   box(g,white,.61,1.4,1.04,.36,.3,.12);for(let x=0;x<3;x++)for(let y=0;y<2;y++)box(g,dark,.49+x*.12,1.34+y*.12,1.115,.08,.08,.025);
   if(generation===2)rod(g,silver,[.9,1.28,.4],[1.95,1.45,.65],.025);
   badge(g,'ЛУНОХОД '+generation,0,1.13,1.02,.95);g.name='Lunokhod '+generation;g.userData.wheelCount=8;g.userData.generation=generation;A.batch(g);return g;
 }
 const regions=[17,21].map((n,i)=>({mission:{id:'luna'+n,name:'Luna '+n+' · 月球'+n+'号',sub:i?'LE MONNIER / 1973':'MARE IMBRIUM / 1970',spawn:{x:-15,z:-18,yaw:.52},spots:[{x:23,z:22,title:(i?'勒莫尼耶坑':'雨海')+' · 撞击地貌',card:'crater'},{x:31,z:32,title:'巡视器科学 · 月壤观察',card:'samples'}]},context:LunaRegions.context(n),lander:()=>lander(n),rover:()=>rover(i+1)}));
 return {regions,lander,rover};
})();
