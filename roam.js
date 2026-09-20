(() => {
'use strict';
const $=id=>document.getElementById(id),T=window.THREE,ART=window.RoverArt,REG=window.RoverRegions,CODEX=window.RoverCodex,M=window.MoonMath;
if(!T||!REG){$('stage').innerHTML='<p class="webgl-error">3D 资源未加载，请刷新或检查项目文件是否完整。</p>';return;}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
const hash=(x,z)=>{const n=Math.sin(x*127.1+z*311.7)*43758.5453;return n-Math.floor(n);};
const GEO=window.RoamGeography,coordinates=GEO.coordinates,LAYOUT=window.RoamLayout;
const regions=[...REG.MISSIONS,Change6Region.mission,Change4Region.mission,BlueGhostRegion.mission,ChangeNearside.three.mission,ChangeNearside.five.mission,Chandrayaan3Region.mission,...LunaRegions.regions.map(r=>r.mission),...LunokhodRegions.regions.map(r=>r.mission),...ApolloEarlyRegions.regions.map(r=>r.mission),...SurveyorRegions.regions.map(r=>r.mission),...LunaEarlyRegions.regions.map(r=>r.mission)].map((m,i)=>{const p=M.point(...coordinates[i]),pos=LAYOUT.positions[i];return {...m,index:i,p,x:pos.x,z:pos.z,context:i>=22?LunaEarlyRegions.regions[i-22].context:i>=17?SurveyorRegions.regions[i-17].context:i>=14?ApolloEarlyRegions.regions[i-14].context:i>=12?LunokhodRegions.regions[i-12].context:i>=9?LunaRegions.regions[i-9].context:i===8?Chandrayaan3Region.context:i===7?ChangeNearside.five.context:i===6?ChangeNearside.three.context:i===5?BlueGhostRegion.context:i===4?Change4Region.context:i===3?Change6Region.context:REG.context(i)};});
const isFarRegion=i=>i===3||i===4;
const isChinaNear=i=>i===6||i===7||i===12;
const isLunaRegion=r=>(r.index>=9&&r.index<=13)||r.index>=22;
const isEarly=i=>i>=14&&i<=16;
const isSurveyor=i=>i>=17&&i<=21;
const isBottomLabel=i=>i>=17;
const branchParent={17:15,18:15,19:14,20:16,21:16,22:17,23:22};
const isLunaSample=i=>i>=9&&i<=11;
// Local exhibit positions share one source for models, level pads, interaction and collision.
const camps=[
 {index:0,x:-2,z:20,rx:-10,rz:24,yaw:-2.3,roverYaw:-.3,name:'猎鹰号',english:'FALCON',card:'falcon-lander',roverCard:'first-rover'},
 {index:1,x:-20,z:8,rx:-29,rz:10,yaw:-2.96,roverYaw:-2.65,name:'猎户座号',english:'ORION',card:'orion-lander',roverCard:'orion-lander'},
 {index:2,x:-25,z:16,rx:-34,rz:20,yaw:-3.06,roverYaw:-2.7,name:'挑战者号',english:'CHALLENGER',card:'challenger-lander',roverCard:'last-rover'},
 {index:3,x:0,z:4,yaw:-2.61,name:'嫦娥六号',english:"CHANG'E 6",card:'change6-lander',noRover:true},
 {index:4,x:0,z:8,rx:-12,rz:7,yaw:-2.66,roverYaw:-2.4,name:'嫦娥四号',english:"CHANG'E 4",title:'嫦娥四号着陆器',card:'change4-lander',roverCard:'yutu2-rover',roverTitle:'玉兔二号巡视器'},
 {index:5,x:0,z:4,yaw:-3.02,name:'蓝色幽灵一号',english:'BLUE GHOST 1',title:'蓝色幽灵一号着陆器',card:'blueghost-lander',noRover:true},
 {index:6,x:0,z:8,rx:-12,rz:7,yaw:-2.66,roverYaw:-2.4,name:'嫦娥三号',english:"CHANG'E 3",title:'嫦娥三号着陆器',card:'change3-lander',roverCard:'yutu-rover',roverTitle:'玉兔号巡视器'},
 {index:7,x:0,z:4,yaw:-2.61,name:'嫦娥五号',english:"CHANG'E 5",title:'嫦娥五号着陆器',card:'change5-lander',noRover:true},
 {index:8,x:0,z:8,rx:-12,rz:7,yaw:-2.66,roverYaw:-2.4,name:'维克拉姆号',english:'VIKRAM',title:'月船三号着陆器',card:'chandrayaan3-lander',roverCard:'chandrayaan3-lander',roverTitle:'智慧号 Pragyan 巡视器'},
 ...[24,20,16].map((n,j)=>({index:9+j,x:0,z:4,yaw:-2.61,name:'月球'+n+'号',english:'LUNA '+n,title:'Luna '+n+' 采样返回着陆器',card:'luna'+n+'-lander',noRover:true})),
 ...[17,21].map((n,j)=>({index:12+j,x:0,z:8,rx:-15,rz:8,yaw:-2.61,roverYaw:-2.5,name:'月球'+n+'号',english:'LUNA '+n,title:'Luna '+n+' 着陆平台',card:'luna'+n+'-lander',roverCard:'lunokhod'+(j+1)+'-rover',roverTitle:'月球车'+(j+1)+'号 · Lunokhod '+(j+1),padRadius:9,collisionRadius:8,readRange:11.5})),
 ...[11,12,14].map((n,j)=>({index:14+j,x:0,z:4,yaw:-2.61,name:ApolloEarlyRegions.titles[n][0],english:ApolloEarlyRegions.titles[n][1],title:'阿波罗 '+n+' · '+ApolloEarlyRegions.titles[n][0]+'登月舱',card:'apollo'+n+'-lander',noRover:true})),
 ...[1,3,5,6,7].map((n,j)=>({index:17+j,x:0,z:4,yaw:-2.61,name:'勘测者'+n+'号',english:'SURVEYOR '+n,title:'Surveyor '+n+' · 勘测者'+n+'号着陆器',card:'surveyor'+n+'-lander',noRover:true})),
 ...[9,13].map((n,j)=>({index:22+j,x:0,z:4,yaw:-2.61,name:'月球'+n+'号',english:'LUNA '+n,title:'Luna '+n+' · 月球'+n+'号自动站',card:'luna'+n+'-lander',noRover:true}))
].map(c=>({...c,x:c.x+regions[c.index].x,z:c.z+regions[c.index].z,rx:Number.isFinite(c.rx)?c.rx+regions[c.index].x:null,rz:Number.isFinite(c.rz)?c.rz+regions[c.index].z:null}));
const exhibitPads=camps.flatMap(c=>c.noRover?[{x:c.x,z:c.z,r:8}]:[{x:c.x,z:c.z,r:c.padRadius||5.8},{x:c.rx,z:c.rz,r:2.6}]);
const obstacles=camps.flatMap(c=>c.noRover?[{x:c.x,z:c.z,r:7.2}]:[{x:c.x,z:c.z,r:c.collisionRadius||4.7},{x:c.rx,z:c.rz,r:(c.index===4||c.index===6||c.index>=12)?2.6:1.9}]);
const heritageModels=[],relicModels=[],nationalFlags=[];
const roads=LAYOUT.edges.map(([a,b])=>({a:regions[a],b:regions[b]}));
const car={x:-16,z:8,y:3,yaw:.72,vx:0,vz:0,vy:0,yawRate:0,pitch:0,roll:0};
const SAVE='moonexplorer-connected-drive-v1';
let guidePath=[];
let cameraMode=0,photoMode=false,auto=false,heritage=true,region=0,selection=2,target={x:-2,z:20,title:'猎鹰号登月舱',card:'falcon-lander',index:0};
let renderer,scene,camera,vehicle,sun,ambient,fill,sky,earth,tracks,nearGround,farGround,routeDust;
let trackIndex=0,trackCount=0,trackDistance=0,last=0,accu=0,hudTimer=0,saveTimer=0,totalTravel=0,ready=false,frameMs=16,toastTimer;
let groundCentre={x:Infinity,z:Infinity},rebuilds=0,cam={x:0,y:0,z:0};
const holds=new Set(),points=[],regionModels=[],mapHits=[],d=new T.Object3D(),color=new T.Color();
const paused=()=>CODEX.isOpen()||$('atlas').open||$('history').open||document.hidden||!ready;
let environment=null,vehicleLights=[];
const visitedRegions=new Set([15]);
function toast(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3400);}
function stop(){holds.clear();auto=false;guidePath=[];car.vx=car.vz=car.vy=car.yawRate=0;accu=0;}
function save(){try{localStorage.setItem(SAVE,JSON.stringify({version:2,x:car.x,z:car.z,yaw:car.yaw,totalTravel,visited:[...visitedRegions],heritage}));}catch{}}
try{const v=JSON.parse(localStorage.getItem(SAVE));if([1,2].includes(v?.version)&&[v.x,v.z,v.yaw].every(Number.isFinite)&&Math.abs(v.x)<1e6&&Math.abs(v.z)<1e6){const pos=v.version===1?LAYOUT.migrateLegacy(v.x,v.z):v;car.x=pos.x;car.z=pos.z;car.yaw=v.yaw;totalTravel=Number.isFinite(v.totalTravel)?Math.max(0,v.totalTravel):0;if(Array.isArray(v.visited))v.visited.filter(n=>regions.some(r=>r.id===n)).forEach(n=>visitedRegions.add(n));heritage=v.heritage!==false;}}catch{}
function segment(x,z,a,b){const dx=b.x-a.x,dz=b.z-a.z,t=clamp(((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz),0,1);return {distance:Math.hypot(x-a.x-dx*t,z-a.z-dz*t),t};}
function worldHeight(x,z){
 const base=2.2+Math.sin(x*.035)*.35+Math.cos(z*.04)*.35;let nearest=regions[0],edge=Infinity;
 for(const r of regions){const e=Math.max(Math.abs(x-r.x),Math.abs(z-r.z));if(e<edge){nearest=r;edge=e;}}
 let h=base;
 if(edge<80){const lx=x-nearest.x,lz=z-nearest.z,raw=nearest.context.heightAt(clamp(lx,-60,60),clamp(lz,-60,60));h=lerp(raw,base,smooth((edge-49)/31));}
 // Leave the original science areas intact, opening gentle passes through outer hills.
 const radial=Math.hypot(x-nearest.x,z-nearest.z);
 if(radial>32){let path=Infinity;for(const r of roads)path=Math.min(path,segment(x,z,r.a,r.b).distance);const w=(1-smooth((path-3)/5))*smooth((radial-32)/18);h=lerp(h,base,w);}
 // Repeated small impact basins flank the long traverse; keep the marked driving lane gentle.
 const bridge=roads[3],dx=bridge.b.x-bridge.a.x,dz=bridge.b.z-bridge.a.z,len=Math.hypot(dx,dz),along=((x-bridge.a.x)*dx+(z-bridge.a.z)*dz)/len;
 const station=Math.round(along/84)*84;
 if(radial>65&&station>70&&station<len-70){const side=Math.round(station/84)%2?1:-1,cx=bridge.a.x+dx*station/len+dz/len*18*side,cz=bridge.a.z+dz*station/len-dx/len*18*side,t=Math.hypot(x-cx,z-cz)/8;if(t<1)h+=t>.76?Math.sin((t-.76)/.24*Math.PI)*.5:-2.2*Math.pow(1-t/.76,1.4);}
 // Small level exhibition pads keep the added heritage models above the original crater rim.
 for(const pad of exhibitPads){const d=Math.hypot(x-pad.x,z-pad.z);if(d<pad.r+1.5)h=lerp(h,3.5,1-smooth((d-pad.r)/1.5));}
 return h;
}
function floor(x,z){const sx=(Math.floor(x/.5)+.5)*.5,sz=(Math.floor(z/.5)+.5)*.5;return Math.max(-3,Math.round(worldHeight(sx,sz)*4)/4);}
function mat(c,extra={}){return new T.MeshStandardMaterial({color:c,map:ART.texture('panel'),roughness:.86,flatShading:true,...extra});}
function box(g,m,x,y,z,w,h,depth){const mesh=new T.Mesh(new T.BoxGeometry(w,h,depth),m);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;g.add(mesh);return mesh;}
function label(text,sub,x,z){const c=document.createElement('canvas');c.width=512;c.height=128;const q=c.getContext('2d');q.fillStyle='#071721ee';q.fillRect(0,0,512,128);q.strokeStyle='#80cdbc';q.strokeRect(2,2,508,124);q.fillStyle='#ebf3df';q.textAlign='center';q.font='bold 34px sans-serif';q.fillText(text,256,53);q.fillStyle='#9fbbb9';q.font='22px sans-serif';q.fillText(sub,256,96);const sprite=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(c),depthTest:true}));sprite.position.set(x,floor(x,z)+3.2,z);sprite.scale.set(4.2,1.05,1);scene.add(sprite);return sprite;}
function mergeProps(group){
 const cache=new Map();group.traverse(o=>{if(!o.isMesh||o.isInstancedMesh||!o.material?.isMeshStandardMaterial)return;
 const m=o.material,key=[m.type,m.color.getHex(),m.emissive.getHex(),m.emissiveIntensity,m.roughness,m.metalness,m.map?.uuid,m.transparent,m.opacity,m.side,m.depthWrite,m.vertexColors].join(':');
 if(cache.has(key)){o.material=cache.get(key);m.dispose();}else cache.set(key,m);
 });ART.batch(group);
}
function createRegions(){
 for(const r of regions){
   const root=new T.Group();root.position.set(r.x,0,r.z);
   const mesh=ART.terrain((x,z)=>floor(x+r.x,z+r.z),r.context.groundColor,.5,240);root.add(mesh);
   const decor=r.context.dressing();
   // Clear only decorative rocks/crystals inside the new exhibit pads; retain science flags and telescope.
   for(const child of [...decor.group.children]){
     if((!child.isGroup&&!child.isMesh)||child.isInstancedMesh||child.position.y>=10||decor.markers.some(m=>m.mesh===child))continue;
     if(decor.observationPoint&&Math.hypot(child.position.x-decor.observationPoint.x,child.position.z-decor.observationPoint.z)<.1)continue;
     if(exhibitPads.some(p=>Math.hypot(r.x+child.position.x-p.x,r.z+child.position.z-p.z)<p.r+.4))decor.group.remove(child);
   }
   // Align surface props with the smoothed route exits; airborne fantasy props keep their altitude.
   for(const child of decor.group.children){if(!child.isInstancedMesh&&child.position.y<10)child.position.y+=floor(r.x+child.position.x,r.z+child.position.z)-r.context.voxelY(child.position.x,child.position.z);}
   decor.markers.forEach(m=>decor.group.remove(m.mesh));mergeProps(decor.group);decor.markers.forEach(m=>root.add(m.mesh));root.add(decor.group);scene.add(root);regionModels.push(root);
   r.spots.forEach((s,i)=>{const card=s.card||CODEX.forSpot(r.id,i).id;points.push({x:r.x+s.x,z:r.z+s.z,title:s.title,card,index:r.index,flag:decor.markers[i]?.mesh,sample:r.index<3});});
   if(decor.observationPoint)points.push({x:r.x+decor.observationPoint.x,z:r.z+decor.observationPoint.z,title:'星空观察点',card:'star-colors',index:r.index,sample:false});
   label(r.name,r.sub,r.x-42,r.z+12);
 }
 for(const c of camps){
   const mission=regions[c.index].id,lander=c.index>=22?LunaEarlyRegions.regions[c.index-22].lander():c.index>=17?SurveyorRegions.regions[c.index-17].lander():c.index>=14?ApolloEarlyRegions.regions[c.index-14].lander():c.index>=12?LunokhodRegions.regions[c.index-12].lander():c.index>=9?LunaRegions.regions[c.index-9].lander():mission==='cy3'?Chandrayaan3Region.lander():mission===3?ChangeNearside.three.lander():mission===5?ChangeNearside.five.lander():mission==='bg1'?BlueGhostRegion.lander():mission===4?Change4Region.lander():c.noRover?Change6Region.lander():ApolloHeritage.lander(mission);heritageModels.push(lander);
   lander.group.position.set(c.x,floor(c.x,c.z),c.z);lander.group.rotation.y=c.yaw;lander.group.scale.setScalar(1.2);scene.add(lander.group);
   if(!c.noRover){const relic=c.index>=12?LunokhodRegions.regions[c.index-12].rover():mission==='cy3'?Chandrayaan3Region.rover():mission===3?ChangeNearside.three.rover():mission===4?Change4Region.rover():ApolloHeritage.rover(mission);relicModels[c.index]=relic;relic.position.set(c.rx,floor(c.rx,c.rz),c.rz);relic.rotation.y=c.roverYaw;scene.add(relic);}
   points.push({x:c.x,z:c.z,title:c.title||c.name+(c.noRover?'着陆器':'登月舱'),card:c.card,index:c.index,range:c.readRange||(c.noRover?10.5:8),sample:false});
   if(!c.noRover)points.push({x:c.rx,z:c.rz,title:c.roverTitle||'遗留月球车 LRV-'+(c.index+1),card:c.roverCard,index:c.index,range:5,sample:false});
   if([3,4,5,6].includes(mission)){const flag=ChangeNearside.nationalFlag();flag.position.set(c.x+9,floor(c.x+9,c.z+1),c.z+1);flag.rotation.y=c.yaw;scene.add(flag);nationalFlags.push({mission,group:flag});}
   label(c.english+' / '+c.name,c.index>=22?'展开花瓣 · 球形月面自动站':c.index>=17?'无人软着陆 · 三足桁架平台':c.index>=14?'步行探索任务 · 可切换遗址状态':c.index>=12?'双向下车坡道 · 八轮遥控巡视器':c.index>=9?'无人采样返回 · 可切换遗址状态':c.index===8?'VIKRAM / PRAGYAN · 南部高地展区':c.index===6?'着陆器与玉兔号 · 雨海科普展区':c.index===7?'表取与钻取 · 风暴洋科普展区':c.index===5?'萤火虫航天 · 危海科普展区':c.index===4?'着陆器与玉兔二号 · 月背科普展区':'任务时期复原 · 可切换遗址状态',c.x-3,c.z+5);
 }
 updateHeritage();
}
function createGround(){
 const geo=new T.PlaneGeometry(720,720,240,240);geo.rotateX(-Math.PI/2);
 nearGround=new T.Mesh(geo,mat(0xbcb5a6,{map:ART.texture('rock')}));nearGround.receiveShadow=true;nearGround.frustumCulled=false;scene.add(nearGround);
 const farGeo=new T.PlaneGeometry(5000,5000,40,40);farGeo.rotateX(-Math.PI/2);farGround=new T.Mesh(farGeo,mat(0x8e8a81,{map:ART.texture('rock')}));scene.add(farGround);
 rebuildGround();
 tracks=new T.InstancedMesh(new T.PlaneGeometry(.16,.24),new T.MeshBasicMaterial({color:0x564c3e,transparent:true,opacity:.3,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}),1600);tracks.count=0;tracks.frustumCulled=false;scene.add(tracks);
}
function rebuildGround(){
 const x=Math.round(car.x/96)*96,z=Math.round(car.z/96)*96;groundCentre={x,z};nearGround.position.set(x,0,z);const a=nearGround.geometry.attributes.position;
 for(let i=0;i<a.count;i++)a.setY(i,worldHeight(a.getX(i)+x,a.getZ(i)+z)-.38);a.needsUpdate=true;nearGround.geometry.computeVertexNormals();farGround.position.set(x,-5,z);rebuilds++;
}
function createRoads(){
 const root=new T.Group(),pole=mat(0x75868d),plate=mat(0x2d545b,{emissive:0x17424a,emissiveIntensity:.4}),amber=mat(0xe3b76c,{emissive:0x976228,emissiveIntensity:.9});
 for(const road of roads){const len=Math.hypot(road.b.x-road.a.x,road.b.z-road.a.z),nx=(road.b.z-road.a.z)/len,nz=-(road.b.x-road.a.x)/len;
   for(let step=42;step<len-30;step+=14){const t=step/len,x=lerp(road.a.x,road.b.x,t),z=lerp(road.a.z,road.b.z,t);if(regions.some(r=>Math.hypot(x-r.x,z-r.z)<45))continue;
     const side=Math.floor(step/14)%2?1:-1,px=x+nx*6*side,pz=z+nz*6*side,h=floor(px,pz);
     box(root,pole,px,h+.7,pz,.07,1.4,.07);box(root,isFarRegion(road.b.index)?amber:plate,px,h+1.4,pz,.55,.25,.08);
     if(!isFarRegion(road.b.index)&&Math.floor(step/14)%2===0){const crystal=ART.crystal();crystal.scale.setScalar(.5);crystal.position.set(x-nx*9,floor(x-nx*9,z-nz*9),z-nz*9);root.add(crystal);}
     for(let i=0;i<5;i++){const rx=x+nx*(8+hash(step,i)*8),rz=z+nz*(8+hash(i,step)*8),s=.3+hash(i,step+9);box(root,mat(0x9b958c),rx,floor(rx,rz)+s*.3,rz,s,s*.6,s);}
   }
 }
 const bridge=roads[3],dx=bridge.b.x-bridge.a.x,dz=bridge.b.z-bridge.a.z,len=Math.hypot(dx,dz);
 for(const [t,title,card] of [[.32,'盆地通道 · 撞击地貌','crater'],[.69,'月缘观察点 · 地球落下','star-colors'],[.85,'月背采样观察点','samples']]){
   const x=lerp(bridge.a.x,bridge.b.x,t)+dz/len*5,z=lerp(bridge.a.z,bridge.b.z,t)-dx/len*5;
   label(title,'科普游览路标 · E 阅读',x,z);points.push({x,z,title,card,index:t>.6?3:1,range:7,sample:false});
   for(const side of [-1,1])box(root,amber,x+side*.5,floor(x,z)+.6,z,.12,1.2,.12);
 }
 mergeProps(root);scene.add(root);
 // Two faint parallel tire traces show each continuous route without drawing roads from Earth.
 const count=roads.reduce((n,r)=>n+Math.floor(Math.hypot(r.b.x-r.a.x,r.b.z-r.a.z)/.8)*2,0);
 routeDust=new T.InstancedMesh(new T.PlaneGeometry(.15,.38),new T.MeshBasicMaterial({color:0x685d49,transparent:true,opacity:.22,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}),count);let i=0;
 for(const road of roads){const dx=road.b.x-road.a.x,dz=road.b.z-road.a.z,len=Math.hypot(dx,dz),yaw=Math.atan2(dx,dz);for(let step=0;step<Math.floor(len/.8);step++)for(const side of [-.65,.65]){const x=road.a.x+dx*step*.8/len+Math.cos(yaw)*side,z=road.a.z+dz*step*.8/len-Math.sin(yaw)*side;d.position.set(x,floor(x,z)+.025,z);d.rotation.set(-Math.PI/2,0,-yaw);d.scale.set(1,1,1);d.updateMatrix();routeDust.setMatrixAt(i++,d.matrix);}}
 routeDust.count=i;routeDust.frustumCulled=false;scene.add(routeDust);
}
function updateTracks(distance){trackDistance+=distance;if(trackDistance<.19)return;trackDistance=0;for(const side of [-.69,.69]){const x=car.x-Math.sin(car.yaw)*.9+Math.cos(car.yaw)*side,z=car.z-Math.cos(car.yaw)*.9-Math.sin(car.yaw)*side;d.position.set(x,floor(x,z)+.016,z);d.rotation.set(-Math.PI/2,0,-car.yaw);d.scale.set(1,1,1);d.updateMatrix();tracks.setMatrixAt(trackIndex,d.matrix);trackIndex=(trackIndex+1)%1600;trackCount=Math.min(1600,trackCount+1);}tracks.count=trackCount;tracks.instanceMatrix.needsUpdate=true;}
function updateHeritage(){for(const model of heritageModels)if(model.ascent)model.ascent.visible=heritage;$('heritageBtn').textContent=heritage?'查看遗址状态':'查看任务时期复原';$('heritageBtn').setAttribute('aria-pressed',String(!heritage));}
function updateEnvironment(){
 if(!scene||!earth||!ambient)return;
 const geoPosition=LAYOUT.toGeography(car.x,car.z);environment=GEO.environment(geoPosition.x,geoPosition.z);const shade=environment.darkness,portrait=camera.aspect<1;
 ambient.intensity=lerp(.85,.23,shade);fill.intensity=lerp(.36,.08,shade);sun.intensity=lerp(3,1.15,shade);
 sun.position.set(car.x-28,car.y+lerp(35,9,shade),car.z-18);sun.target.position.set(car.x,car.y,car.z);
 // The exaggerated Earth sinks below the visual horizon before being culled on the far side.
 earth.visible=environment.earthVisible;earth.position.set(portrait?104:73,lerp(-28,43,smooth(environment.earthFacing/.45)),portrait?155:182);
 sky.children[0].material.uniforms.expeditionDim.value=lerp(1,.12,shade);
 for(const lamp of vehicleLights)lamp.light.intensity=lamp.base*lerp(1,3.2,shade);
}
function updateCamera(blend=1){const fx=Math.sin(car.yaw),fz=Math.cos(car.yaw),rx=Math.cos(car.yaw),rz=-Math.sin(car.yaw),far=cameraMode===1,portrait=camera.aspect<1,back=far?6.5:portrait?5.6:4.6,side=far?-2.3:portrait?-.5:-1.8;cam.x=lerp(cam.x,car.x-fx*back+rx*side,blend);cam.z=lerp(cam.z,car.z-fz*back+rz*side,blend);cam.y=lerp(cam.y,Math.max(car.y+(far?4.1:2.35),floor(cam.x,cam.z)+.8),blend);camera.position.set(cam.x,cam.y,cam.z);camera.lookAt(car.x+fx*(far?2:8),car.y+(far?.6:1),car.z+fz*(far?2:8));}
function scan(){
 let nearest=null,best=Infinity;const unlocked=new Set(CODEX.stats().unlocked);
 for(const point of points){const distance=Math.hypot(car.x-point.x,car.z-point.z),range=point.range||4.5;
   if(distance<range){if(!unlocked.has(point.card)&&point.card!=='star-colors'){CODEX.unlock(point.card);unlocked.add(point.card);toast('已收录：'+point.title+' · E 阅读');}if(distance<best){nearest=point.card;best=distance;}}
   if(point.flag&&unlocked.has(point.card)){const cloth=point.flag.children[1]?.material;if(cloth){cloth.color.setHex(0x6fe8df);cloth.emissive.setHex(0x17606b);}}
 }
 CODEX.setNearby(nearest);
 const next=regions.map(r=>({r,d:Math.hypot(car.x-r.x,car.z-r.z)})).sort((a,b)=>a.d-b.d)[0];region=next.r.index;
 if(next.d<55&&!visitedRegions.has(next.r.id)){visitedRegions.add(next.r.id);toast('进入 '+next.r.name+' · 探索图鉴已接入');save();}
 updateHud();
}
function updateHud(){
 const r=regions[region],unlocked=new Set(CODEX.stats().unlocked),n=points.filter(p=>p.sample&&unlocked.has(p.card)).length;
 $('regionLabel').textContent=isSurveyor(r.index)?'SURVEYOR '+r.id.slice(8):isLunaRegion(r)?'LUNA '+r.id.slice(4):r.index>=3&&r.index<14?r.name:'APOLLO '+r.id;$('samp').textContent=n+'/9';$('hiLine').textContent=r.name+' · '+r.sub.split(' / ')[0]+(environment?.earthVisible?' · 月球正面':' · 月背 · 鹊桥中继');
 for(const rr of regions)$('m'+rr.id).classList.toggle('on',rr.index===region);
 const destination=guidePath[0]||target,dist=Math.hypot(destination.x-car.x,destination.z-car.z)+guidePath.reduce((sum,p,i)=>{const next=guidePath[i+1]||target;return sum+Math.hypot(next.x-p.x,next.z-p.z);},0);$('spotTitle').textContent=(auto?'引导驾驶 → ':'探索 → ')+target.title;
 $('spotText').textContent=dist<9?'靠近观察模型，按 E 阅读图鉴；按 M 规划下一段旅程。':(isFarRegion(region)?'月背低照度场景，地球不可见。沿琥珀路标往返嫦娥六号与嫦娥四号。':region===12?'Luna 17 携月球车1号抵达雨海。经嫦娥三号可返回阿波罗 15。':region===13?'Luna 21 携月球车2号抵达勒莫尼耶坑，向南可返回阿波罗 17。':isLunaSample(region)?'沿路标往返 Luna 24、20、16；经危海蓝色幽灵营地可返回阿波罗 17。':region===8?'月船三号位于正面南部高纬度，地球低悬。沿北向路标可返回阿波罗 16。':isChinaNear(region)?'沿路标探索嫦娥三号、玉兔与嫦娥五号；从三号营地可回到阿波罗 15。':'从 17 号沿路标探索危海的蓝色幽灵一号；16 号通往月背嫦娥营地。');
 const a=Math.atan2(destination.x-car.x,destination.z-car.z)-car.yaw;$('bearing').style.transform='rotate('+(-a)+'rad)';
}
function physics(dt){
 while(guidePath.length&&Math.hypot(guidePath[0].x-car.x,guidePath[0].z-car.z)<7)guidePath.shift();
 let throttle=(holds.has('w')||holds.has('arrowup')?1:0)-(holds.has('s')||holds.has('arrowdown')?.7:0),steer=(holds.has('a')||holds.has('arrowleft')?1:0)-(holds.has('d')||holds.has('arrowright')?1:0);
 if(auto){while(guidePath.length&&Math.hypot(guidePath[0].x-car.x,guidePath[0].z-car.z)<7)guidePath.shift();const destination=guidePath[0]||target;const distance=Math.hypot(destination.x-car.x,destination.z-car.z);if(distance<7){stop();toast('已抵达 '+target.title);return;}const desired=Math.atan2(destination.x-car.x,destination.z-car.z),error=Math.atan2(Math.sin(desired-car.yaw),Math.cos(desired-car.yaw));steer=clamp(error*1.8,-1,1);throttle=Math.abs(error)>.6?.25:Math.min(1,distance/14);}
 const oldX=car.x,oldZ=car.z,speed=Math.hypot(car.vx,car.vz),fx=Math.sin(car.yaw),fz=Math.cos(car.yaw),rx=Math.cos(car.yaw),rz=-Math.sin(car.yaw);
 car.vx+=fx*throttle*9.5*dt;car.vz+=fz*throttle*9.5*dt;car.yawRate=lerp(car.yawRate,steer*1.15*(.35+Math.min(1,speed/4)),1-Math.pow(.001,dt));car.yaw+=car.yawRate*dt;
 const drag=1.6+(throttle<0?3.2:0);car.vx*=Math.max(0,1-drag*dt);car.vz*=Math.max(0,1-drag*dt);const s=Math.hypot(car.vx,car.vz);if(s>7.2){car.vx*=7.2/s;car.vz*=7.2/s;}car.x+=car.vx*dt;car.z+=car.vz*dt;
 for(const obstacle of obstacles){const dx=car.x-obstacle.x,dz=car.z-obstacle.z,len=Math.hypot(dx,dz);if(len<obstacle.r){if(len>.001){car.x=obstacle.x+dx/len*obstacle.r;car.z=obstacle.z+dz/len*obstacle.r;}else{car.x=oldX;car.z=oldZ;}car.vx*=.2;car.vz*=.2;}}
 const sample=[[.9,.66],[.9,-.66],[-.9,.66],[-.9,-.66]].map(a=>floor(car.x+a[0]*fx-a[1]*rx,car.z+a[0]*fz-a[1]*rz));const [fl,fr,bl,br]=sample,wantY=(fl+fr+bl+br)/4+.12;
 car.vy+=((wantY-car.y)*18-car.vy*6.5-1.62*.35)*dt;car.y+=car.vy*dt;if(car.y<wantY){car.y=wantY;car.vy=Math.max(0,car.vy);}car.pitch=lerp(car.pitch,((bl+br)-(fl+fr))*.1,.12);car.roll=lerp(car.roll,((fl+bl)-(fr+br))*.1,.12);
 vehicle.mesh.position.set(car.x,car.y,car.z);vehicle.mesh.rotation.order='YXZ';vehicle.mesh.rotation.set(car.roll,car.yaw-Math.PI/2,-car.pitch);vehicle.wheels.forEach(w=>{w.mesh.rotation.z-=s*dt*3.4*(throttle<0?-1:1);if(w.front)w.hub.rotation.y=steer*.45;});
 const travelled=Math.hypot(car.x-oldX,car.z-oldZ);totalTravel+=travelled;updateTracks(travelled);updateCamera(1-Math.exp(-7*dt));
}
function node(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
function openMap(){stop();selection=region;$('atlas').showModal();renderMap();}
function nav(i,assist=false){
 const from=region;planNav(i,assist);if(from===i)return;
 // The expanded petals sit across the centre line. Approach the viewing bay
 // from its northern side, including when departing or passing through it.
 const approach=j=>({x:regions[j].x,z:regions[j].z-28});
 const points=[...guidePath,target],safe=[];
 if(from>=22)safe.push(approach(from));
 points.forEach((p,k)=>{const j=regions.findIndex((r,j)=>j>=22&&Math.hypot(p.x-r.x-r.spawn.x,p.z-r.z-r.spawn.z)<.01);if(j>=22)safe.push(approach(j));if(k<points.length-1&&j<22)safe.push(p);});
 guidePath=safe;updateHud();
}
function planNav(i,assist=false){
 const r=regions[i];let from=region;target={x:r.x+r.spawn.x,z:r.z+r.spawn.z,title:r.name+' · '+r.sub.split(' / ')[0],index:i};
 if($('atlas').open)$('atlas').close();stop();
 if(from===i){auto=assist;updateHud();return;}
 const earlyEntry=j=>({x:regions[j].x+regions[j].spawn.x,z:regions[j].z+regions[j].spawn.z});
 const surveyTail=[];
 // Resolve shared branch ancestors so adjacent sites never detour to the hub.
 const ancestry=j=>{const a=[j];while(branchParent[j]!==undefined){j=branchParent[j];a.push(j);}return a;};
 const fromBranch=ancestry(from),toBranch=ancestry(i),common=fromBranch.find(j=>toBranch.includes(j));
 if(common!==undefined){
   guidePath.push(...fromBranch.slice(1,fromBranch.indexOf(common)+1).map(earlyEntry));
   guidePath.push(...toBranch.slice(1,toBranch.indexOf(common)).reverse().map(earlyEntry));
   auto=assist;updateHud();return;
 }
 while(branchParent[from]!==undefined){from=branchParent[from];guidePath.push(earlyEntry(from));}
 while(branchParent[i]!==undefined){i=branchParent[i];surveyTail.unshift(earlyEntry(i));}
 if(from===i){guidePath.push(...surveyTail);auto=assist;updateHud();return;}
 const earlyJunction={x:regions[1].x+12,z:regions[1].z-30};
 const westJunction={x:regions[1].x-48,z:regions[1].z-30};
 const earlyTail=[];
 if(isEarly(from)){
   if(from===15&&i!==16)guidePath.push(earlyEntry(16));
   if((from===15&&i===16)||(from===16&&i===15)){guidePath.push(...surveyTail);auto=assist;updateHud();return;}
   if(from!==14)guidePath.push(westJunction);
   guidePath.push(earlyJunction);from=1;
 }
 if(isEarly(i)){
   earlyTail.push(earlyJunction);
   if(i!==14)earlyTail.push(westJunction);
   if(i===15)earlyTail.push(earlyEntry(16));
   i=1;
 }
 // Preserve the existing Apollo routes; the far-side extension passes through CE-6.
 const gate={x:regions[1].x-47,z:regions[1].z+36},entry={x:regions[1].x-24,z:regions[1].z-10};
 const ce6Entry={x:regions[3].x+regions[3].spawn.x,z:regions[3].z+regions[3].spawn.z};
 const entryBG={x:regions[5].x+regions[5].spawn.x,z:regions[5].z+regions[5].spawn.z},gateBG={x:regions[5].x+35,z:regions[5].z-12};
 const lunaEntry=j=>({x:regions[j].x+regions[j].spawn.x,z:regions[j].z+regions[j].spawn.z});
 if(isLunaSample(from)&&isLunaSample(i)){const step=i>from?1:-1;for(let j=from+step;step>0?j<i:j>i;j+=step)guidePath.push(lunaEntry(j));auto=assist;updateHud();toast('已标记 '+r.name+' · 方向键可接管');return;}
 if(isLunaSample(from)){for(let j=from-1;j>=9;j--)guidePath.push(lunaEntry(j));guidePath.push(gateBG,entryBG);from=5;}
 const entry15={x:regions[0].spawn.x,z:regions[0].spawn.z},entry3={x:regions[6].x+regions[6].spawn.x,z:regions[6].z+regions[6].spawn.z},gate3={x:regions[6].x-45,z:regions[6].z-10};
 if(isChinaNear(from)&&isChinaNear(i)){auto=assist;updateHud();toast('已标记 '+r.name+' · 方向键可接管');return;}
 if(isChinaNear(from)){if(from===7)guidePath.push(entry3);guidePath.push(gate3,entry15);from=0;}
 const south16={x:regions[1].x+8,z:regions[1].z+36};
 if(from===8&&i!==8){guidePath.push(south16,entry);from=1;}
 const routeTo=isChinaNear(i)?0:i===8?1:isLunaSample(i)?5:i===13?2:i;
 const entry17={x:regions[2].x+regions[2].spawn.x,z:regions[2].z+regions[2].spawn.z};
 if(from===13){guidePath.push(entry17);from=2;}
 if(from===5&&routeTo!==5){guidePath.push(entry17);from=2;}
 if(isFarRegion(routeTo)&&!isFarRegion(from)){if(from===0)guidePath.push({x:-27,z:35});if(from!==1)guidePath.push(entry);guidePath.push(gate);if(i===4)guidePath.push(ce6Entry);}
 else if(isFarRegion(from)&&!isFarRegion(routeTo)){if(from===4)guidePath.push(ce6Entry);guidePath.push(gate,entry);}
 else if(routeTo===1&&from===0)guidePath.push({x:-27,z:35});
 if(routeTo===5&&from!==5)guidePath.push(entry17);
 if(routeTo===0&&from!==0)guidePath.push({x:-27,z:8});
 if(isChinaNear(i)){guidePath.push(entry15,gate3);if(i===7)guidePath.push(entry3);}
 if(i===8&&from!==8)guidePath.push(entry,south16);
 if(i===13)guidePath.push(entry17);
 if(isLunaSample(i)){guidePath.push(entryBG,gateBG);for(let j=9;j<i;j++)guidePath.push(lunaEntry(j));}
 guidePath.push(...earlyTail,...surveyTail);
 auto=assist;updateHud();toast((assist?'开始引导驾驶：':'已标记路线：')+r.name+' · 随时用方向键接管');
}
function jump(i){stop();const r=regions[i];car.x=r.x+r.spawn.x;car.z=r.z+r.spawn.z;car.yaw=r.spawn.yaw;car.y=floor(car.x,car.z)+.12;car.pitch=car.roll=0;region=i;target={x:r.x+r.spots[0].x,z:r.z+r.spots[0].z,title:r.spots[0].title,index:i};const c=camps[i];target={x:c.x,z:c.z,title:c.title||c.name+(c.noRover?'着陆器':'登月舱'),index:i};if(ready){rebuildGround();updateCamera();updateEnvironment();}if($('atlas').open)$('atlas').close();scan();save();}
const mapBounds={minX:Math.min(...LAYOUT.legacy.map(r=>r.x)),maxX:Math.max(...LAYOUT.legacy.map(r=>r.x)),minZ:Math.min(...LAYOUT.legacy.map(r=>r.z)),maxZ:Math.max(...LAYOUT.legacy.map(r=>r.z))};
const mapScale=Math.min(620/(mapBounds.maxX-mapBounds.minX),490/(mapBounds.maxZ-mapBounds.minZ));
function mapXY(x,z){const p=LAYOUT.toGeography(x,z);return {x:85+(p.x-mapBounds.minX)*mapScale,y:105+(p.z-mapBounds.minZ)*mapScale};}
function realDistance(a,b){const d=M.distance(a.p,b.p);if(a.approximate||b.approximate)return (Math.round(d/10000)*10).toLocaleString('zh-CN')+' km';return d<1000?Math.round(d).toLocaleString('zh-CN')+' 米':Math.round(d/1000).toLocaleString('zh-CN')+' km';}
function drawMap(){const canvas=$('routeMap'),ctx=canvas.getContext('2d');ctx.clearRect(0,0,800,960);ctx.strokeStyle='#284252';ctx.lineWidth=1;for(let x=30;x<800;x+=45){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,960);ctx.stroke();}for(let y=20;y<960;y+=45){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(800,y);ctx.stroke();}
 ctx.fillStyle='#a2c9c9';ctx.font='bold 22px sans-serif';ctx.fillText('↑ 北 / N',40,53);ctx.font='16px sans-serif';ctx.fillStyle='#668993';ctx.fillText('真实月面距离 / REAL LUNAR DISTANCES',32,952);
 for(const road of roads){const a=mapXY(road.a.x,road.a.z),b=mapXY(road.b.x,road.b.z);ctx.strokeStyle='#6cac9e';ctx.lineWidth=3;ctx.setLineDash([8,8]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#b0c8c1';ctx.font='17px monospace';if((road.b.index>=3&&road.b.index<6)||road.b.index===8)ctx.fillText(realDistance(road.a,road.b),lerp(a.x,b.x,.5)+(road.b.id==='bg1'?-15:8),lerp(a.y,b.y,.5)+(road.b.id===4?34:road.b.id==='bg1'?42:0));}
 const bridge=roads[3];for(const [t,title] of [[.32,'盆地通道'],[.69,'月缘 · 地球落下'],[.85,'月背采样观察']]){const a=mapXY(bridge.a.x,bridge.a.z),b=mapXY(bridge.b.x,bridge.b.z),p={x:lerp(a.x,b.x,t),y:lerp(a.y,b.y,t)};ctx.fillStyle='#eac382';ctx.fillRect(p.x-4,p.y-4,8,8);ctx.font='15px sans-serif';ctx.fillText(title,p.x+12,p.y+5);}
 mapHits.length=0;for(const r of regions){
   const anchor=mapXY(r.x,r.z),a=r.index>=22?{x:230+(r.index-22)*300,y:870}:isSurveyor(r.index)?{x:80+(r.index-17)*160,y:758}:r.index>=14?{x:175,y:[275,465,365][r.index-14]}:r.index===12?{x:235,y:150}:r.index===13?{x:615,y:95}:r.index>=9?{x:752,y:[285,400,510][r.index-9]}:anchor;
   if(r.index>=9){ctx.strokeStyle='#87aaa7';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(anchor.x,anchor.y);ctx.lineTo(a.x,a.y);ctx.stroke();ctx.fillStyle='#edcea0';ctx.fillRect(anchor.x-3,anchor.y-3,6,6);}
   const chinese=[3,4,5,6].includes(r.id),above=r.id===15||r.id===6||r.id==='bg1';
   ctx.fillStyle=r.index===selection?'#e9c986':'#548889';ctx.beginPath();ctx.arc(a.x,a.y,22,0,Math.PI*2);ctx.fill();ctx.fillStyle='#06111b';ctx.textAlign='center';ctx.font='bold 20px monospace';ctx.fillText(isSurveyor(r.index)?'S'+r.id.slice(8):isLunaRegion(r)?'L'+r.id.slice(4):r.id==='cy3'?'CY3':r.id==='bg1'?'BG1':chinese?'嫦'+r.id:r.id,a.x,a.y+7);
   const west=r.id===3||r.id===5,labelX=isBottomLabel(r.index)?a.x:r.index>=9?a.x-30:r.id===5?a.x+25:west?a.x-34:chinese?a.x+34:a.x+25;ctx.textAlign=isBottomLabel(r.index)?'center':chinese&&!west?'left':'right';ctx.fillStyle='#ecf6e4';ctx.font='19px sans-serif';ctx.fillText(isLunaRegion(r)?'Luna '+r.id.slice(4):r.name,labelX,a.y+(isBottomLabel(r.index)?41:r.index>=9?4:r.id===5?-38:west||r.id===6?6:above?-38:48));ctx.font='13px sans-serif';ctx.fillStyle='#8eafb7';
   ctx.fillText(['哈德利—亚平宁','笛卡尔高地','陶拉斯—利特罗','月背 · 阿波罗盆地','月背 · 冯·卡门坑','危海 · 萤火虫航天','雨海 · 玉兔号','风暴洋 · 采样返回','南部高纬度 · VIKRAM','危海 · 深钻取样','高地 · 采样返回','丰富海 · 自动采样返回','雨海 · 月球车1号','勒莫尼耶坑 · 月球车2号','静海 · 鹰号','风暴洋 · 无畏号','弗拉·毛罗 · 心宿二号','风暴洋 · 美国首站','阿波罗12探访点','静海 · 月壤成分','中央湾 · 跃迁实验','第谷坑北部高地','风暴洋 · 历史概略位置','风暴洋 · 历史概略位置'][r.index],labelX,a.y+(isBottomLabel(r.index)?60:r.index>=9?24:r.id===5?-20:west||r.id===6?24:above?-20:66));ctx.textAlign='left';mapHits.push({...a,i:r.index});
 }

 const a=mapXY(car.x,car.z);if(a.x>=0&&a.x<=800&&a.y>=0&&a.y<=740){ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(a.x,a.y,7,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(a.x+Math.sin(car.yaw)*20,a.y+Math.cos(car.yaw)*20);ctx.stroke();}}
function renderMap(){drawMap();const choices=$('routeChoices');choices.replaceChildren();for(const r of regions){const b=node('button',isLunaRegion(r)?'Luna '+r.id.slice(4):r.name);b.title=r.name;b.setAttribute('aria-label',r.name);b.setAttribute('aria-pressed',String(selection===r.index));b.dataset.region=r.index;b.onclick=()=>{selection=r.index;renderMap();};choices.append(b);}
 const r=regions[selection],detail=$('mapSelection');detail.replaceChildren(node('h3',r.name),node('p',r.spots.map(s=>s.title).join(' · ')),node('p',region===selection?'当前所在展示区':regions[region].name+' → '+r.name+((r.approximate||regions[region].approximate)?'：月面距离估算约 ':'：真实月面距离约 ')+realDistance(regions[region],r)),node('p',(r.approximate?'历史概略坐标 ':'真实坐标 ')+Math.abs(coordinates[selection][0]).toFixed(r.approximate?2:4)+(coordinates[selection][0]<0?'°S / ':'°N / ')+Math.abs(coordinates[selection][1]).toFixed(r.approximate?2:4)+(coordinates[selection][1]<0?'°W':'°E')));
 if(r.approximate)detail.append(node('p','按历史公布区域定位，并非已确认的精确遗址；距离为估算。'));
 for(const [text,action,id] of [['标记路线，手动驾驶',()=>nav(selection),'nav'],['引导驾驶',()=>nav(selection,true),'guide'],['快速抵达',()=>jump(selection),'jump']]){const b=node('button',text);b.dataset.action=id;b.onclick=action;detail.append(b);}
 const facts=$('routeFacts');facts.replaceChildren(node('strong','展示区之间的真实月面距离'));for(const road of roads)facts.append(node('p',road.a.name+' ↔ '+road.b.name+((road.a.approximate||road.b.approximate)?'：估算约 ':'：约 ')+realDistance(road.a,road.b)));
}
function history(){stop();if($('atlas').open)$('atlas').close();$('historyScope').textContent=MOON_ROAM_DATA.scope;const body=$('historyCards');body.replaceChildren();for(const s of MOON_ROAM_DATA.sites.filter(s=>s.kind==='mission')){const a=MOON_ROAM_DATA.articles[s.read],codex=ROVER_CODEX_DATA.cards.find(c=>c.id===s.codexId),thumbnail=codex?.image||a.thumbnail,thumbnailLabel=codex?.imageLabel||a.thumbnailLabel,card=node('article',undefined,'history-card'),img=document.createElement('img');img.src=thumbnail;img.alt=thumbnailLabel;img.loading='lazy';const text=node('div',undefined,'history-copy');text.append(node('h3',s.name),node('p',s.date+' · '+s.region),node('p',s.summary),node('p',a.title+' · '+a.author),node('p',a.summary),node('p',thumbnailLabel));const link=node('a','知乎原文 ↗');link.href=a.url;link.target='_blank';link.rel='noopener noreferrer';text.append(link);card.append(img,text);body.append(card);}$('history').showModal();}
function layout(){const vv=visualViewport,w=vv?.width||innerWidth,h=vv?.height||innerHeight;document.documentElement.style.setProperty('--app-height',h+'px');document.documentElement.classList.toggle('is-portrait',h>w);document.documentElement.classList.toggle('is-touch',navigator.maxTouchPoints>0||matchMedia('(any-pointer:coarse)').matches);if(renderer){const r=$('stage').getBoundingClientRect();camera.aspect=r.width/Math.max(1,r.height);camera.updateProjectionMatrix();renderer.setSize(r.width,r.height,false);earth.scale.setScalar(r.width<r.height?.62:1);updateEnvironment();}}
function togglePhoto(){photoMode=!photoMode;document.documentElement.classList.toggle('photo-mode',photoMode);$('photoBtn').setAttribute('aria-pressed',String(photoMode));layout();}
function bind(){CODEX.init(stop);$('mapBtn').onclick=openMap;$('closeMap').onclick=()=>$('atlas').close();$('closeHistory').onclick=()=>$('history').close();$('historyBtn').onclick=history;for(const id of ['atlas','history'])$(id).addEventListener('close',()=>{holds.clear();accu=0;});
 for(const r of regions)$('m'+r.id).onclick=()=>nav(r.index);$('restartBtn').onclick=()=>jump(0);$('cameraBtn').onclick=()=>{cameraMode=1-cameraMode;$('cameraBtn').textContent=cameraMode?'近景视角':'全景视角';};$('photoBtn').onclick=$('photoExit').onclick=togglePhoto;$('heritageBtn').onclick=()=>{heritage=!heritage;updateHeritage();save();toast(heritage?'完整组合体：阿波罗、嫦娥五／六号与 Luna 采样返回任务复原':'遗址示意：隐藏已离开的上升级／上升器，保留着陆设备；嫦娥三号、四号、玉兔系列、蓝色幽灵、月船三号及 Luna 9／13、17／21 与月球车、勘测者系列保持完整');};
 $('routeMap').onclick=e=>{const canvas=$('routeMap'),rect=canvas.getBoundingClientRect(),x=(e.clientX-rect.left)*canvas.width/rect.width,y=(e.clientY-rect.top)*canvas.height/rect.height;const h=mapHits.find(p=>Math.hypot(p.x-x,p.y-y)<44);if(h){selection=h.i;renderMap();}};
 addEventListener('keydown',e=>{if(e.target.matches('input,select,textarea')||paused())return;const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){e.preventDefault();auto=false;holds.add(k);}if(e.repeat)return;if(k==='m')openMap();if(k==='j')CODEX.openGallery();if(k==='e')CODEX.activateNearby();if(k==='c')$('cameraBtn').click();if(k==='h')togglePhoto();if(k==='r')jump(0);if(k==='escape'){if(photoMode)togglePhoto();else openMap();}});
 addEventListener('keyup',e=>holds.delete(e.key.toLowerCase()));document.querySelectorAll('[data-hold]').forEach(b=>{b.onpointerdown=e=>{e.preventDefault();if(paused())return;auto=false;b.setPointerCapture(e.pointerId);holds.add(b.dataset.hold);};const up=()=>holds.delete(b.dataset.hold);b.onpointerup=b.onpointercancel=b.onlostpointercapture=up;});
 addEventListener('blur',()=>{stop();save();});addEventListener('pagehide',save);document.addEventListener('visibilitychange',()=>{stop();save();last=performance.now();});addEventListener('resize',layout);visualViewport?.addEventListener('resize',layout);
}
function tick(now){const dt=Math.min(.05,(now-last)/1000||.016);last=now;frameMs=lerp(frameMs,dt*1000,.04);if(!paused()){accu=Math.min(.15,accu+dt);while(accu>=1/120){physics(1/120);accu-=1/120;}}else accu=0;
 if(ready){updateEnvironment();if(Math.hypot(car.x-groundCentre.x,car.z-groundCentre.z)>96)rebuildGround();sky.position.copy(camera.position);renderer.render(scene,camera);}hudTimer+=dt;saveTimer+=dt;if(hudTimer>.16){hudTimer=0;scan();}if(saveTimer>4){saveTimer=0;save();}requestAnimationFrame(tick);}
function boot(){bind();try{renderer=new T.WebGLRenderer({canvas:$('view'),antialias:true,powerPreference:'high-performance'});}catch(e){$('stage').innerHTML='<div class="webgl-error"><h2>暂时无法启动 3D 画面</h2><p>请开启浏览器硬件加速。仍可通过顶部按钮查看地图和图鉴。</p></div>';return;}
 renderer.setPixelRatio(Math.min(1.5,devicePixelRatio||1));renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 scene=new T.Scene();scene.background=new T.Color(0x020710);scene.fog=new T.Fog(0x020710,310,900);camera=new T.PerspectiveCamera(54,1,.08,1100);
 ambient=new T.HemisphereLight(0xb9cde8,0x8f7d61,.85);scene.add(ambient);sun=new T.DirectionalLight(0xffefd5,3);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-24,right:24,top:24,bottom:-24,near:.5,far:110});sun.shadow.bias=-.00015;sun.shadow.normalBias=.035;scene.add(sun,sun.target);fill=new T.DirectionalLight(0x96bbeb,.36);fill.position.set(14,9,-22);scene.add(fill);
 sky=ART.sky();earth=ART.earth();earth.position.set(73,43,182);sky.add(earth);scene.add(sky);vehicle=createRoamVehicle();scene.add(vehicle.mesh);vehicle.mesh.traverse(o=>{if(o.isSpotLight)vehicleLights.push({light:o,base:o.intensity});});
 sky.children[0].material.uniforms.expeditionDim={value:1};sky.children[0].material.fragmentShader='uniform float expeditionDim; '+sky.children[0].material.fragmentShader.replace('clamp(a,0.,1.)','clamp(a,0.,1.)*expeditionDim');
 createGround();createRegions();createRoads();car.y=floor(car.x,car.z)+.12;vehicle.mesh.position.set(car.x,car.y,car.z);vehicle.mesh.rotation.y=car.yaw-Math.PI/2;
 ready=true;layout();updateCamera();scan();$('view').addEventListener('webglcontextlost',e=>{e.preventDefault();stop();ready=false;save();toast('3D 连接中断，进度已保存，请刷新恢复。');});last=performance.now();requestAnimationFrame(tick);
}
window.__roamDiagnostics=()=>({mode:'connected-apollo',ready,position:{x:car.x,y:car.y,z:car.z,yaw:car.yaw},region:regions[region].id,regions:regions.map(r=>({id:r.id,x:r.x,z:r.z})),target:{...target},auto,metres:totalTravel,visited:[...visitedRegions],heritage,environment:environment?{...environment,sun:sun.intensity,ambient:ambient.intensity,earthRendered:earth.visible}:null,guidePath:guidePath.map(p=>({...p})),exhibits:heritageModels.map((m,i)=>({mission:m.mission,instruments:m.group.userData,ascent:m.ascent?.visible??null,landerVisible:m.group.visible,roverVisible:relicModels[i]?.visible??null,roverWheels:relicModels[i]?.userData.wheelCount??null,lander:{x:camps[i].x,z:camps[i].z},rover:camps[i].noRover?null:{x:camps[i].rx,z:camps[i].rz},card:camps[i].card})),nationalFlags:nationalFlags.map(f=>({mission:f.mission,visible:f.group.visible,position:{x:f.group.position.x,z:f.group.position.z}})),tracks:trackCount,rebuilds,frameMs:Math.round(frameMs),codex:CODEX.stats(),calls:renderer?.info.render.calls,triangles:renderer?.info.render.triangles,geometries:renderer?.info.memory.geometries});
boot();
})();
