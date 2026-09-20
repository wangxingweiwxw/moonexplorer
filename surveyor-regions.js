/* Reference-inspired voxel Surveyor spacecraft. No ascent stage or rover. */
window.SurveyorRegions=(()=>{
 'use strict';
 const T=THREE,A=RoverArt;
 const mat=(color,extra={})=>new T.MeshStandardMaterial({color,map:A.texture('panel'),roughness:.68,metalness:.32,flatShading:true,...extra});
 function box(g,m,x,y,z,w,h,d){const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;g.add(o);return o;}
 function rod(g,m,a,b,r=.035){const p=new T.Vector3(...a),q=new T.Vector3(...b),v=q.clone().sub(p),o=new T.Mesh(new T.CylinderGeometry(r,r,v.length(),5),m);o.position.copy(p.add(q).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());o.castShadow=true;g.add(o);return o;}
 function cyl(g,m,x,y,z,r,h){const o=new T.Mesh(new T.CylinderGeometry(r,r,h,10),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;g.add(o);return o;}
 function lander(n){
   const g=new T.Group(),white=mat(0xe1e1d5),silver=mat(0xb5babc),dark=mat(0x273037),gold=mat(0xb2914b),solar=mat(0x202f41),lens=mat(0x071b24,{roughness:.2,metalness:.7});
   const vertices=[0,1,2].map(i=>{const a=i*Math.PI*2/3;return [Math.sin(a)*1.08,1.18,Math.cos(a)*1.08];});
   // Lightweight triangular aluminium frame, rather than an enclosed cabin.
   for(let i=0;i<3;i++){
     const v=vertices[i],next=vertices[(i+1)%3],foot=[v[0]*2.65,.15,v[2]*2.65];
     rod(g,white,v,next,.055);rod(g,silver,v,[0,2.18,0],.035);
     rod(g,white,[v[0]*.55,1.7,v[2]*.55],foot,.07);
     rod(g,silver,vertices[(i+1)%3],foot,.03);rod(g,silver,vertices[(i+2)%3],foot,.03);
     const shock=[v[0]*1.68,.68,v[2]*1.68];rod(g,silver,[v[0]*.8,1.5,v[2]*.8],shock,.10);
     cyl(g,white,foot[0],.11,foot[2],.43,.2);cyl(g,gold,foot[0],.22,foot[2],.25,.035);
     const engine=new T.Mesh(new T.ConeGeometry(.16,.34,8,1,true),dark);engine.position.set(v[0]*.65,.58,v[2]*.65);g.add(engine);
     cyl(g,silver,v[0]*.65,.84,v[2]*.65,.15,.22);
   }
   box(g,white,-.67,1.48,.1,.75,.6,.92);box(g,white,.53,1.34,-.43,.85,.49,.71);
   box(g,dark,-.68,1.51,.575,.48,.28,.035);box(g,gold,.54,1.34,-.79,.66,.35,.025);
   for(let j=0;j<5;j++)box(g,silver,-1.06,1.27+j*.095,.12,.035,.03,.68);
   // Tall mast supports a solar array and separate flat high-gain antenna.
   rod(g,white,[0,1.15,0],[0,3.35,0],.07);rod(g,silver,[-.75,1.47,-.3],[0,2.85,0],.025);rod(g,silver,[.72,1.4,-.3],[0,2.85,0],.025);
   const panel=new T.Group();panel.position.set(.58,3.4,0);panel.rotation.set(.85,.16,-.55);g.add(panel);
   box(panel,white,0,0,0,2.1,.10,1.12);
   for(let x=0;x<12;x++)for(let z=0;z<6;z++)box(panel,solar,-.945+x*.172,.067,-.455+z*.182,.157,.025,.164);
   const antenna=box(g,white,-.97,3.47,-.18,1.45,.08,1.12);antenna.rotation.z=.45;
   rod(g,silver,[0,3.24,0],[-1.4,3.65,-.18],.03);
   // TV camera: rotating mirror head, barrel, sun hood on the later variants.
   rod(g,silver,[.6,1.1,.65],[.6,2.35,.65],.045);cyl(g,white,.6,2.1,.65,.17,.65);
   const head=cyl(g,white,.6,2.46,.74,.21,.33);head.rotation.x=Math.PI/2;
   const glass=cyl(g,lens,.6,2.46,.915,.15,.025);glass.rotation.x=Math.PI/2;
   if(n>=6){box(g,white,.6,2.72,.86,.52,.07,.6);box(g,white,.86,2.49,.82,.05,.42,.42);}
   rod(g,silver,[-.5,1.6,-.5],[-1.65,2.6,-.95],.02);rod(g,silver,[.4,1.5,-.5],[1.6,2.13,-1],.02);
   // Only 3 and 7 carried the articulated soil-mechanics sampler.
   if(n===3||n===7){rod(g,white,[-.55,1.28,.6],[-1.6,1.15,1.2],.065);rod(g,silver,[-1.6,1.15,1.2],[-2.2,.35,1.65],.05);box(g,silver,-1.6,1.15,1.2,.22,.24,.25);box(g,gold,-2.25,.24,1.77,.46,.16,.48);box(g,white,-2.25,.39,1.96,.46,.2,.07);}
   // 5/6/7 lower an alpha-scattering instrument to inspect surface composition.
   if(n>=5){box(g,white,1.5,.22,-1.35,.52,.32,.5);box(g,gold,1.5,.40,-1.35,.48,.04,.46);rod(g,dark,[.65,1.44,-.6],[1.5,.4,-1.35],.017);}
   const cv=document.createElement('canvas');cv.width=256;cv.height=96;const q=cv.getContext('2d');q.fillStyle='#e5e4d7';q.fillRect(0,0,256,96);q.fillStyle='#253a4e';q.textAlign='center';q.font='bold 27px monospace';q.fillText('SURVEYOR '+n,128,40);q.font='19px monospace';q.fillText('NASA / JPL',128,74);
   const plate=new T.Mesh(new T.PlaneGeometry(.83,.31),new T.MeshStandardMaterial({map:new T.CanvasTexture(cv)}));plate.position.set(-.68,1.48,.605);g.add(plate);
   g.name='Surveyor '+n+' lunar lander';g.userData={landingLegs:3,surfaceSampler:n===3||n===7,alphaAnalyzer:n>=5,solarPanels:1,rover:false};A.batch(g);return {group:g,ascent:null,mission:'surveyor'+n};
 }
 const locations={1:['风暴洋','OCEANUS PROCELLARUM / 1966'],3:['风暴洋 · 阿波罗12探访点','APOLLO 12 VISIT / 1967'],5:['静海','MARE TRANQUILLITATIS / 1967'],6:['中央湾','SINUS MEDII / 1967'],7:['第谷坑北侧溅射区','TYCHO HIGHLANDS / 1968']};
 const regions=[1,3,5,6,7].map(n=>({mission:{id:'surveyor'+n,name:'勘测者 '+n,sub:locations[n][1],spawn:{x:-12,z:-15,yaw:.56},spots:[{x:23,z:22,title:locations[n][0]+' · 撞击地貌',card:'crater'},{x:31,z:32,title:n===7?'高地成分与月海对照':'无人探路 · 月壤观察',card:n===7?'highlands':'samples'}]},context:LunaRegions.context(n===7?20:n+30),lander:()=>lander(n)}));
 return {regions,lander,locations};
})();
