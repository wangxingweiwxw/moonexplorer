(async () => {
'use strict';
if(window.MoonSave)await window.MoonSave.ready;
const saveStore=window.MoonSave||localStorage;
const S=window.ColonySim,$=id=>document.getElementById(id),canvas=$('colonyCanvas'),ctx=canvas.getContext('2d'),mini=$('minimap'),mc=mini.getContext('2d'),KEY='moonexplorer-colony-v1';
let state=S.create(),loaded=false,saveAvailable=true;
try{const saved=S.restore(saveStore.getItem(KEY));if(saved){state=saved;loaded=true;}}catch{saveAvailable=false;}
let camera={x:20,y:20,zoom:1.35},paused=false,speed=1,category='全部',buildType=null,selected=null,hover=null,grid=false,drag=null,accumulator=0,lastTime=0,toastUntil=0,dirty=true,modalKind='',selectedUnit=null,lastDelta={},width=800,height=500;
const keys=new Set(),tileW=64,tileH=32,sprites={},tiles={},vehicleSprites=new Map(),vehicleHeadings=new Map(),spriteMasks=new WeakMap();
let fadedBuildings=[],pendingTrade=null;
const tradeDrafts=new Map(),combatFX=window.ColonyCombatFX.create(),turretHeadings=new Map();
const advisor=window.ColonyAdvisor,advisorScreen=advisor.frame();$('advisorPortraitMount').append(advisorScreen);
const fmt=n=>Math.floor(n).toLocaleString('zh-CN');
function el(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
function button(text,fn,cls){const b=el('button',text,cls);b.type='button';b.onclick=fn;return b;}
function notify(text){$('toast').textContent=text;toastUntil=performance.now()+3200;$('toast').classList.add('show');}
function save(manual=false){try{saveStore.setItem(KEY,JSON.stringify(state));saveAvailable=true;if(manual)notify('殖民地已保存到本机' + (window.MoonSave?.status().user?'，云端同步状态见账号页':''));}catch{saveAvailable=false;if(manual)notify('浏览器未允许保存，请保持此页面打开');}}
function resize(){const r=canvas.getBoundingClientRect();width=r.width;height=r.height;const dpr=Math.min(2,devicePixelRatio||1);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);ctx.imageSmoothingEnabled=false;dirty=true;}
function project(x,y){return {x:width/2+(x-y-camera.x+camera.y)*tileW/2*camera.zoom,y:height*.53+(x+y-camera.x-camera.y)*tileH/2*camera.zoom};}
function unproject(x,y){const a=(x-width/2)/(tileW/2*camera.zoom),b=(y-height*.53)/(tileH/2*camera.zoom);return {x:Math.floor((a+b)/2+camera.x+.5),y:Math.floor((b-a)/2+camera.y+.5)};}
function polygon(c,points,fill,stroke){c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}}
function makeTile(type,seed){const c=document.createElement('canvas');c.width=68;c.height=60;const q=c.getContext('2d'),h=S.hash(seed,9),base=type==='crater'?'#3c4448':type==='ice'?'#70888b':type==='ore'?'#817463':type==='rock'?'#797c76':['#6b7272','#6d7473','#697172','#707574'][seed%4];polygon(q,[[34,20],[66,36],[34,52],[2,36]],base,'#85877a0a');
 for(let j=0;j<65;j++){const x=S.hash(seed,j)*54-27,y=S.hash(j,seed+18)*26-13;if(Math.abs(x)/30+Math.abs(y)/15>1)continue;q.fillStyle=j%3?'#c5c6af22':'#1d303532';q.fillRect(34+x,36+y,1+(j%3),1);}
 if(type==='ice'||type==='ore')for(let i=0;i<8;i++){const x=23+S.hash(seed,i+20)*23,y=29+S.hash(i+22,seed)*12;polygon(q,[[x,y],[x+3,y-2],[x+5,y],[x+2,y+2]],type==='ice'?'#b1dce0':'#cfab74');}
 if(type==='rock'){polygon(q,[[17,34],[23,22],[36,17],[44,24],[54,36],[38,46],[20,40]],'#5b666a');polygon(q,[[17,34],[23,22],[36,17],[38,31],[28,36],[20,40]],'#8c9187');polygon(q,[[36,17],[44,24],[54,36],[38,46],[38,31]],'#465359');polygon(q,[[21,30],[29,24],[35,27],[31,34]],'#a4a796');q.fillStyle='#b9b9a661';q.fillRect(24,28,3,2);q.fillRect(31,21,4,2);}
 return c;}
for(const t of ['plain','crater','ice','ore','rock'])tiles[t]=Array.from({length:8},(_,i)=>makeTile(t,i));
const makeBuilding=type=>window.ColonyArt.building(type,S.types);
for(const t of Object.keys(S.types))sprites[t]=makeBuilding(t);
sprites.turretHeadings=Array.from({length:8},(_,i)=>window.ColonyArt.building('turret',S.types,false,1,i));
sprites.habitatExpanded=window.ColonyArt.building('habitat',S.types,false,2);
sprites.hqCompact=window.ColonyArt.building('hq',S.types,true);
function paintSprite(type,p,z,alpha=1,compact=false,level=1,heading=6){ctx.globalAlpha=alpha;ctx.drawImage(type==='turret'?sprites.turretHeadings[heading]:compact&&type==='hq'?sprites.hqCompact:type==='habitat'&&level>=2?sprites.habitatExpanded:sprites[type],p.x-104*z,p.y-132*z,208*z,208*z);ctx.globalAlpha=1;}
// Compare solid sprite pixels in zoom-independent isometric space. Transparent canvas
// margins and ground shadows must not make neighbouring buildings fade unnecessarily.
function turretHeading(b){const shot=state.shots.find(s=>s.sourceId===b.id);if(shot)turretHeadings.set(b.id,shot.heading);return turretHeadings.get(b.id)??6;}
function buildingSprite(b){const type=b.structure?(b.type==='command'?'hq':b.type==='factory'?'warehouse':'turret'):b.type;return type==='turret'?sprites.turretHeadings[turretHeading(b)]:type==='hq'&&(b.structure||S.footprint(b)[0]===1)?sprites.hqCompact:type==='habitat'&&(b.level||1)>=2?sprites.habitatExpanded:sprites[type];}
function spriteMask(sprite){
 if(spriteMasks.has(sprite))return spriteMasks.get(sprite);
 const c=document.createElement('canvas');c.width=c.height=208;const q=c.getContext('2d',{willReadFrequently:true});q.drawImage(sprite,0,0,208,208);
 const pixels=q.getImageData(0,0,208,208).data,solid=new Uint8Array(208*208);let left=208,top=208,right=0,bottom=0;
 for(let y=0;y<208;y++)for(let x=0;x<208;x++)if(pixels[(y*208+x)*4+3]>180){solid[y*208+x]=1;left=Math.min(left,x);right=Math.max(right,x+1);top=Math.min(top,y);bottom=Math.max(bottom,y+1);}
 const result={solid,left,top,right,bottom};spriteMasks.set(sprite,result);return result;
}
function overlapsBuilding(front,back){
 const a=spriteMask(buildingSprite(front)),b=spriteMask(back.maskSprite||buildingSprite(back));
 const dx=Math.round((front.x-front.y-back.x+back.y)*32),dy=Math.round((front.x+front.y-back.x-back.y)*16);
 const left=Math.max(b.left,a.left+dx),right=Math.min(b.right,a.right+dx),top=Math.max(b.top,a.top+dy),bottom=Math.min(b.bottom,a.bottom+dy);let covered=0;
 for(let y=top;y<bottom;y+=2)for(let x=left;x<right;x+=2)if(b.solid[y*208+x]&&a.solid[(y-dy)*208+x-dx]&&++covered>=4)return true;
 return false;
}
const entityDepth=b=>b.x+b.y+(b.building?S.footprint(b).reduce((n,v)=>n+v-1,0):0);
function vehiclePosition(u){const blend=paused?1:Math.min(1,accumulator/S.DAY_SECONDS*2);return {x:(u.px??u.x)+(u.x-(u.px??u.x))*blend,y:(u.py??u.y)+(u.y-(u.py??u.y))*blend};}
function vehicleSprite(u){
 const enemy=u.side==='enemy';let dx=u.x-(u.px??u.x),dy=u.y-(u.py??u.y);const shot=state.shots.find(s=>s.sourceId===u.id&&!!s.enemy===enemy);if(shot){dx=Math.cos(shot.heading*Math.PI/4);dy=Math.sin(shot.heading*Math.PI/4);}
 if(dx||dy)vehicleHeadings.set(u.id,((Math.round(Math.atan2(dy,dx)/(Math.PI/4))%8)+8)%8);
 const heading=vehicleHeadings.get(u.id)??6,key=u.type+':'+enemy+':'+heading;
 if(!vehicleSprites.has(key)){
  const sprite=window.ColonyArt.vehicle(u.type,enemy,heading),maskSprite=document.createElement('canvas');maskSprite.width=maskSprite.height=416;
  maskSprite.getContext('2d').drawImage(sprite,112,154,192,160);sprite.maskSprite=maskSprite;vehicleSprites.set(key,sprite);
 }
 return vehicleSprites.get(key);
}
function selectedOccluders(entities){
 const result=new Set(),targets=[];
 if(!selectedUnit&&!buildType){const index=entities.findIndex(b=>b.building&&b.id===selected);if(index>=0)targets.push({b:entities[index],index});}
 // Vehicles stay visible, including while they are crossing behind a building.
 for(let i=0;i<entities.length;i++){const u=entities[i];if(!u.building&&!u.structure)targets.push({b:{...u,maskSprite:vehicleSprite(u.renderUnit||u).maskSprite},index:i});}
 if(buildType&&hover&&S.terrain(hover.x,hover.y)!=='void'){
  const preview={...hover,type:buildType,building:true},depth=entityDepth(preview);targets.push({b:preview,preview:true,depth});
 }
 for(const target of targets)for(let i=0;i<entities.length;i++){
  const b=entities[i];if(!(b.building||b.structure)||(b.health??b.hp)<=0)continue;
  if(target.preview?entityDepth(b)<=target.depth:i<=target.index)continue;
  if(overlapsBuilding(b,target.b))result.add(b.id);
 }
 return result;
}
function outline(b,color,fill='#ffffff0b'){const f=S.footprint(b),z=camera.zoom,ps=[[b.x-.5,b.y-.5],[b.x+f[0]-.5,b.y-.5],[b.x+f[0]-.5,b.y+f[1]-.5],[b.x-.5,b.y+f[1]-.5]].map(q=>{const p=project(...q);return [p.x,p.y];});polygon(ctx,ps,fill,color);}
function healthBar(p,value,max,enemy,z){if(value>=max)return;ctx.fillStyle='#142126';ctx.fillRect(p.x-15*z,p.y-36*z,30*z,4*z);ctx.fillStyle=enemy?'#df796a':'#8ecbb2';ctx.fillRect(p.x-15*z,p.y-36*z,30*z*Math.max(0,value/max),4*z);}
function drawVehicle(u){const source=u.renderUnit||u,pos=vehiclePosition(source),p=project(pos.x,pos.y),z=camera.zoom,enemy=u.side==='enemy',sprite=vehicleSprite(source);
 ctx.drawImage(sprite,p.x-48*z,p.y-55*z,96*z,80*z);
 if(u.id===selectedUnit){ctx.strokeStyle='#efdc9c';ctx.beginPath();ctx.ellipse(p.x,p.y+3*z,25*z,13*z,0,0,Math.PI*2);ctx.stroke();}healthBar(p,u.hp,S.unitTypes[u.type].hp,enemy,z);
 if(u.id===selectedUnit&&u.order){const target=u.order.kind==='move'?u.order:state.enemies.find(e=>e.id===u.order.target);if(target){const t=project(target.x,target.y);ctx.setLineDash([5,6]);ctx.strokeStyle=u.order.kind==='attack'?'#f8997b':'#c5d9b7';ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(t.x,t.y);ctx.stroke();ctx.setLineDash([]);}}
}
function drawShip(m){const port=m.active.find(b=>b.type==='port');if(!port||!m.port||m.flight.phase==='away')return;const p=project(port.x+.6,port.y+.65),z=camera.zoom,phase=m.flight.phase,t=paused?0:accumulator/S.DAY_SECONDS;let altitude=phase==='landing'?Math.max(0,1-m.flight.progress-t/2)*95:phase==='departing'?(m.flight.progress+t/2)*95:0;
 ctx.save();ctx.translate(p.x,p.y);ctx.scale(z,z);ctx.fillStyle='#09182266';ctx.beginPath();ctx.ellipse(0,0,29-altitude*.1,12,0,0,Math.PI*2);ctx.fill();ctx.translate(0,-altitude-10);
 if(phase!=='docked'){ctx.fillStyle='#eab572';ctx.beginPath();ctx.ellipse(-12,16,6,12+Math.sin(performance.now()/90)*3,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(12,16,6,12,0,0,Math.PI*2);ctx.fill();}
 polygon(ctx,[[-31,6],[-10,-10],[0,-37],[10,-10],[31,6],[12,11],[0,17],[-12,11]],'#bccbd1','#e3e4c8');polygon(ctx,[[-8,-16],[0,-29],[8,-16],[0,-11]],'#356f91','#8fd8e1');polygon(ctx,[[-11,1],[0,-6],[11,1],[0,12]],'#608197');ctx.fillStyle='#d8b975';ctx.fillRect(-25,7,9,4);ctx.fillRect(16,7,9,4);ctx.restore();
}
function isDisconnected(b,m){return b.type!=='road'&&b.type!=='hq'&&b.health>0&&b.remaining===0&&!m.links.has(b.id);}
function drawConnectionWarnings(m){
 const labels=[],z=camera.zoom;ctx.save();
 for(const b of state.buildings){
  if(!isDisconnected(b,m))continue;
  const f=S.footprint(b),ground=project(b.x+(f[0]-1)/2,b.y+(f[1]-1)/2),origin=project(b.x,b.y),mask=spriteMask(buildingSprite(b));
  const roof=origin.y+(mask.top-132)*z;
  if(ground.x<-40||ground.x>width+40||ground.y<-30||roof>height+30)continue;
  ctx.setLineDash([5,3]);outline(b,'#ffba63','#ff923017');ctx.setLineDash([]);
  const w=92,h=24,x=Math.max(4,Math.min(width-w-4,ground.x-w/2));let y=Math.max(4,Math.min(height-h-4,roof-h-9));
  // Keep neighbouring warning labels apart while anchoring each to its own roof.
  for(let tries=0;tries<8&&labels.some(r=>x<r.x+w+3&&x+w+3>r.x&&y<r.y+h+3&&y+h+3>r.y);tries++)y=Math.max(4,y-h-4);
  labels.push({x,y});ctx.strokeStyle='#ffbd72';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+w/2,y+h);ctx.lineTo(ground.x,Math.max(roof, y+h+3));ctx.stroke();
  ctx.fillStyle='#34251af2';ctx.fillRect(x,y,w,h);ctx.strokeStyle='#ffb45e';ctx.strokeRect(x+.5,y+.5,w-1,h-1);
  polygon(ctx,[[x+12,y+5],[x+5,y+18],[x+19,y+18]],'#ffbd66');
  ctx.fillStyle='#34251a';ctx.font='bold 11px sans-serif';ctx.fillText('!',x+10,y+16);
  ctx.fillStyle='#ffe5c3';ctx.font='bold 12px sans-serif';ctx.fillText('未接管道',x+25,y+16);
 }
 ctx.restore();
}
function draw(){
 ctx.clearRect(0,0,width,height);ctx.fillStyle='#202b30';ctx.fillRect(0,0,width,height);const m=S.metrics(state),z=camera.zoom;
 for(let sum=0;sum<S.SIZE*2;sum++)for(let x=Math.max(0,sum-S.SIZE+1);x<=Math.min(S.SIZE-1,sum);x++){const y=sum-x,p=project(x,y);if(p.x<-100*z||p.x>width+100*z||p.y<-100*z||p.y>height+130*z)continue;ctx.drawImage(tiles[S.terrain(x,y)][Math.floor(S.hash(x,y)*8)],p.x-34*z,p.y-36*z,68*z,60*z);if(grid)outline({x,y,type:'road'},'#c9d4b629','#00000000');}
 for(const b of state.buildings.filter(b=>b.type==='road')){paintSprite('road',project(b.x,b.y),z);if(b.id===selected)outline(b,'#f4d58a');}
 const entities=[...state.buildings.filter(b=>b.type!=='road').map(b=>({...b,building:true})),...state.units.map(u=>({...u,...vehiclePosition(u),renderUnit:u})),...state.enemies.map(u=>u.structure?u:{...u,...vehiclePosition(u),renderUnit:u})].sort((a,b)=>entityDepth(a)-entityDepth(b));
 const occluders=selectedOccluders(entities);fadedBuildings=[...occluders];
 for(const b of entities){const p=project(b.x,b.y);if(p.x<-160*z||p.x>width+160*z||p.y<-70*z||p.y>height+160*z)continue;
 if(b.building){paintSprite(b.type,p,z,occluders.has(b.id)?.24:b.health===0?.25:b.remaining?.45:1,S.footprint(b)[0]===1,b.level||1,b.type==='turret'?turretHeading(b):6);if(b.remaining){ctx.fillStyle='#eed298';ctx.font='11px monospace';ctx.fillText(b.remaining+'天',p.x-12,p.y-48*z);}if(b.health<100&&b.type!=='road')healthBar({...p,y:p.y-30*z},b.health,100,false,z);}
 else if(b.structure){const type=b.type==='command'?'hq':b.type==='factory'?'warehouse':'turret';paintSprite(type,p,z,occluders.has(b.id)?.24:1,true,1,b.type==='turret'?turretHeading(b):6);outline({x:b.x,y:b.y,type:'road'},'#dd897a','#ae40332a');const flag=project(b.x-.3,b.y);ctx.strokeStyle='#bd8472';ctx.beginPath();ctx.moveTo(flag.x,flag.y);ctx.lineTo(flag.x,flag.y-50*z);ctx.stroke();polygon(ctx,[[flag.x,flag.y-50*z],[flag.x+15*z,flag.y-47*z],[flag.x,flag.y-39*z]],'#a43e38');healthBar({...p,y:p.y-24*z},b.hp,S.enemyTypes[b.type].hp,true,z);}
 else drawVehicle(b);
 }
 drawShip(m);
 const focused=state.buildings.find(b=>b.id===selected);if(focused&&!selectedUnit&&!buildType){outline(focused,'#ffe3a2','#ffdd7715');if(occluders.size){const f=S.footprint(focused),p=project(focused.x+(f[0]-1)/2,focused.y+(f[1]-1)/2),label=S.types[focused.type].name;ctx.font='12px sans-serif';const w=ctx.measureText(label).width+16;ctx.fillStyle='#172b35e8';ctx.fillRect(p.x-w/2,p.y+12*z,w,21);ctx.fillStyle='#ffe3a2';ctx.fillText(label,p.x-w/2+8,p.y+12*z+15);}}

 if(hover&&S.terrain(hover.x,hover.y)!=='void'){const error=buildType?S.canBuild(state,buildType,hover.x,hover.y):'';outline({...hover,type:buildType||'road'},error?'#f7997d':'#d2deb4',error?'#d8685838':'#d8e6bf22');if(buildType)paintSprite(buildType,project(hover.x,hover.y),z,.55);}
 if(!m.daylight){ctx.fillStyle='#13203436';ctx.fillRect(0,0,width,height);}combatFX.draw(ctx,project,z);drawConnectionWarnings(m);drawMini(m);dirty=false;
}
function drawMini(m){mc.fillStyle='#192528';mc.fillRect(0,0,240,150);for(let y=0;y<S.SIZE;y++)for(let x=0;x<S.SIZE;x++){const t=S.terrain(x,y);mc.fillStyle=t==='rock'?'#899080':t==='crater'?'#273a40':t==='ore'?'#c6a475':t==='ice'?'#8ac3d3':'#526561';mc.fillRect(x*6,y*3.75,6,3.75);}for(const b of state.buildings){mc.fillStyle=b.type==='road'?'#aab9a4':b.type==='hq'?'#f0d587':isDisconnected(b,m)?'#ffb45e':'#76d1b1';const f=S.footprint(b);mc.fillRect(b.x*6,b.y*3.75,6*f[0],3.75*f[1]);}for(const u of state.units){mc.fillStyle=u.id===selectedUnit?'#ffe7a0':'#6ce1e3';mc.fillRect(u.x*6-1,u.y*3.75-1,5,5);}for(const u of state.enemies){mc.fillStyle='#f28471';mc.fillRect(u.x*6-1,u.y*3.75-1,u.structure?8:5,u.structure?6:4);}mc.strokeStyle='#f1dfae';mc.lineWidth=1.3;const corners=[[0,0],[width,0],[width,height],[0,height]].map(p=>unproject(...p));mc.beginPath();corners.forEach((p,i)=>i?mc.lineTo(p.x*6,p.y*3.75):mc.moveTo(p.x*6,p.y*3.75));mc.closePath();mc.stroke();}
function palette(){const body=$('buildPalette');body.replaceChildren();for(const [id,d] of Object.entries(S.types)){if(id==='hq'||category!=='全部'&&category!==d.category)continue;const b=button('',()=>choose(id),'build-item'+(buildType===id?' active':''));b.dataset.build=id;b.title=d.desc;const icon=document.createElement('canvas');icon.width=52;icon.height=45;icon.getContext('2d').drawImage(sprites[id],0,60,416,340,0,0,52,45);b.append(icon,el('b',d.name),el('small','₡'+d.cost+' / '+d.metal+'▥'));if(d.tech&&!state.tech.includes(d.tech)){b.title='研究后解锁：'+d.desc;b.append(el('small','🔒 科研解锁'));}body.append(b);}}
function choose(id){const d=S.types[id];if(d.tech&&!state.tech.includes(d.tech)){notify('请先在科研面板完成“裂变供能”');return;}buildType=id;selected=null;selectedUnit=null;canvas.classList.add('building');palette();updateUI();dirty=true;}
function cancel(){buildType=null;selectedUnit=null;selected=null;canvas.classList.remove('building');palette();updateUI();dirty=true;}
function details(container){container.replaceChildren();const b=state.buildings.find(a=>a.id===selected),d=b?S.types[b.type]:buildType?S.types[buildType]:null,m=S.metrics(state);
 if(selectedUnit){const u=state.units.find(u=>u.id===selectedUnit);if(u){const def=S.unitTypes[u.type];container.append(el('h3',def.name),el('p',def.desc),el('p','装甲 '+Math.ceil(u.hp)+' / '+def.hp+' · 射程 '+def.range+' 格'),el('p','点击空地移动，点击红色帝国目标进攻。没有指令时自动攻击射程内敌军。'),button('原地驻守',()=>act(S.stop(state,u.id))));return;}selectedUnit=null;}if(!d){container.append(el('h3','让一座城市，从月尘中生长。'),el('p','点击下方设施，再点击月面地块。密封通道把建筑接入基地；铜色与蓝色地块分别提供月矿与水冰。','empty'),el('span','等待建设指令','badge'));return;}
 container.append(el('h3',d.name),el('p',d.desc));
 const row=(label,value)=>{const r=el('div',undefined,'detail-row');r.append(el('span',label),el('b',value));container.append(r);};
 if(b){if(isDisconnected(b,m)&&b.type!=='habitat')container.append(el('p','⚠ 未连接管道 · 设施尚未接入基地。请用密封通道，或与已联网的完工建筑共边相邻，接入指挥中心网络。','connection-warning'));row('状态',b.health<=0?'已损毁':b.remaining?'建设中 · '+b.remaining+'天':m.links.has(b.id)?'已接入基地':'未连接通道');if(b.health<100)row('设施完整度',Math.round(b.health)+'%');row('占地',S.footprint(b).join(' × ')+' 格');if(b.type==='habitat'){row('额定居住容量',S.housingCapacity(b)+'人');const available=b.health>0&&b.remaining===0&&m.links.has(b.id);row('已计入总容量',(available?S.housingCapacity(b):0)+'人');if(!available)container.append(el('p','本舱 '+S.housingCapacity(b)+' 个床位尚未计入：'+(b.health<=0?'建筑已损毁，请先维修。':b.remaining>0?'尚在施工，等待完工并联网。':'尚未接入管网，请补设管道或与已联网的完工建筑共边相邻。'),'connection-warning'));if((b.level||1)<2){const ready=S.housingClinicReady(state),upgrade=button('扩建至128人（₡1200 / 40月矿）',()=>act(S.expandHousing(state,b.id)));upgrade.disabled=!ready;container.append(upgrade,el('small',ready?'医疗站已建成，可进行唯一一次扩容':'扩容条件：先建成医疗站','note'));}else row('扩容状态','已完成 · 上限128人');}row('用电',d.power+' / 天');const actions=el('div',undefined,'actions');if(b.type!=='hq'){if(b.health<100)actions.append(button('维修',()=>act(S.repair(state,b.id))));actions.append(button('拆除',()=>{openPanel('demolish');},'danger'));}container.append(actions);}
 else{row('建造费用','₡'+d.cost+' + '+d.metal+'月矿');row('建造时间',d.time+'天');row('每日用电',d.power+'单位');row('占地',(d.footprint||[1,1]).join(' × ')+' 格');container.append(el('span','点击地图放置 · Esc 取消','badge'));}
}
function updateResourceRail(m){
 const rail=$('resources'),open=m.port&&m.tradeOpen&&!state.lost;
 for(const [key,[name,icon,color]] of Object.entries(S.resources)){
  if(key==='credits')continue;let r=rail.querySelector('[data-stock="'+key+'"]');
  if(!r){r=el('div',undefined,'resource');r.dataset.stock=key;r.style.setProperty('--color',color);const label=el('div',undefined,'r-label');label.append(el('span',name),el('span',icon,'r-icon'));const track=el('div',undefined,'r-track');track.append(el('i'));const footer=el('div',undefined,'resource-footer');footer.append(el('small',undefined,'resource-delta'));r.append(label,el('b'),track,footer);
   if(S.priceBands[key]){const range=el('input'),review=button('',()=>reviewRailTrade(key),'resource-review');range.type='range';range.className='resource-ratio';range.step='5';range.min='-100';range.max='100';range.value='0';range.setAttribute('aria-label',name+'交易比例：左卖右买');range.dataset.tradeSlider=key;review.dataset.tradeReview=key;review.hidden=true;
    range.addEventListener('input',()=>{const n=Number(range.value);tradeDrafts.set(key,Number.isInteger(n)?Math.max(-100,Math.min(100,n)):0);updateResourceRail(S.metrics(state));});
    range.addEventListener('pointercancel',()=>{tradeDrafts.delete(key);updateResourceRail(S.metrics(state));});
    const marker=el('span',undefined,'resource-safe-marker');marker.setAttribute('aria-hidden','true');track.append(marker,range);footer.append(review);
   }rail.append(r);
  }
  if(!open)tradeDrafts.delete(key);
  const percent=tradeDrafts.get(key)||0,order=S.priceBands[key]?S.proportionalTrade(state,key,percent):null;
  const stock=state.resources[key],capacity=key==='energy'?m.battery:key==='science'?100:m.storage,track=r.querySelector('.r-track');
  r.classList.toggle('low',!!order&&stock<order.reserve);r.querySelector('b').textContent=fmt(stock);track.querySelector('i').style.width=Math.min(100,stock/capacity*100)+'%';
  if(order){const marker=r.querySelector('.resource-safe-marker');marker.style.left=Math.min(100,order.reserve/capacity*100)+'%';r.dataset.safeReserve=order.reserve;
   const hint='当前库存 '+fmt(stock)+'；安全保留量 '+order.reserve+'。竖线为库存安全界限'+(order.reserve>capacity?'（已超出储存容量）':'')+(stock<order.reserve?'；库存低于安全界限':'');r.title=hint;track.title=hint;
  }
  const delta=key==='energy'?m.generation-m.demand:lastDelta[key]||0,deltaLabel=r.querySelector('.resource-delta');deltaLabel.textContent=(delta>=0?'+':'')+delta.toFixed(1)+'/天';
  const range=r.querySelector('.resource-ratio');if(!range)continue;const review=r.querySelector('.resource-review');range.hidden=!open;r.classList.toggle('can-trade',open);range.value=percent;range.disabled=!open||!order.buy&&!order.sell;
  range.title='安全保留量 '+order.reserve+'（竖线）；左卖出／右买入：安全可交易数量的比例；可卖 '+order.sell+'、可买 '+order.buy+'。调节后点击百分比核对订单。';range.setAttribute('aria-description','库存安全保留量 '+order.reserve+'，当前库存 '+fmt(stock)+(stock<order.reserve?'，低于安全界限':''));range.setAttribute('aria-valuetext',percent?(percent>0?'买入':'卖出')+Math.abs(percent)+'%，约'+Math.abs(order.quantity)+'单位':'0%，不交易');
  review.hidden=!open||!percent;review.disabled=!order.quantity;review.textContent=(percent>0?'买':'卖')+Math.abs(percent)+'%'+(order.quantity?' ✓':' —');review.setAttribute('aria-label','核对'+S.resources[key][0]+(percent>0?'买入':'卖出')+Math.abs(percent)+'%订单');review.title=order.quantity?'点击核对实际数量和金额':'当前比例不足1单位或没有安全可交易额度';deltaLabel.hidden=open&&!!percent;
 }
}
function reviewRailTrade(key){
 const order=S.proportionalTrade(state,key,tradeDrafts.get(key)||0),{quantity,percent}=order;if(!quantity||!order.open){notify('当前比例没有可交易数量，请重新调整');return;}
 pendingTrade={key,quantity,percent,available:order.available,voyage:order.voyage,price:quantity>0?order.quote.buy:order.quote.sell};openPanel('safeTrade');
}
function updateUI(){if(state.lost)paused=true;const m=S.metrics(state);$('day').textContent=S.formatDate(state.day);$('population').textContent=state.population+' / '+m.capacity;$('population').title='可用容量 = 指挥中心24人 + 已完工、未损毁且联网的居住舱 '+(m.capacity-24)+' 人。水、食品、氧气和供电影响人口增长，不扣减床位。';$('funds').textContent='₡ '+fmt(state.resources.credits);$('lightLabel').textContent=m.daylight?'日照充足':'低照阶段';$('pauseBtn').textContent=paused?'▶ 继续':'Ⅱ 暂停';$('speedBtn').textContent=speed+'×';$('speedBtn').title=(S.DAY_SECONDS/speed)+'秒 / 游戏日';$('missionProgress').textContent=state.won?'总目标已达成 · 自由建设':state.mission.status==='expired'?'五年挑战已结束 · 自由建设':'五年计划 · '+fmt(state.population)+' / 500人 · 剩余'+Math.max(0,S.MISSION_DAYS-state.day+1)+'天';$('news').textContent=state.logs[0]?.text||'';$('morale').value=state.morale;$('moraleValue').textContent=Math.round(state.morale)+'%';$('powerValue').textContent=Math.round(m.generation)+' / '+m.demand+' ϟ';
 updateResourceRail(m);
 const tips=state.won?'五年500人口目标已达成！你可以继续自由建设和探索。':state.mission.status==='expired'?'五年期限已到。你仍可继续扩展殖民地，本次挑战不再计为按期达成。':state.lost?'指挥中心已经失守。可读取保存的远征，或重新开局。':state.empireArrived&&!state.empireDefeated?'帝国位于东北方。用炮塔守路口，维修厂维护防线，火箭车在敌塔射程外逐个摧毁目标。':!m.port?'优先接通太空港，首班货船第15天停泊。不要一次扩建太多住宅，先保证月矿、水和电力。':state.won?'殖民地已达成全部目标！你可以继续扩张、优化供电和出口。':!saveAvailable?'当前浏览器不能写入存档，请保持页面打开。':m.power<.8?'电网供给不足，生产正在减速。增加太阳能阵列、蓄电站，或研究稳定电源。':state.resources.water<35?'水储量偏低。建设冰矿提取站，或等待货船买入水。':state.resources.food<35?'食品储量偏低，增加水培温室并确保水、电充足。':state.resources.oxygen<35?'氧气储量偏低，检查制氧工厂是否供水、供电和联网。':state.population>=m.capacity?'居住名额已满。扩建居住舱，并同步保障水、食品和氧气。':!S.goals(state,m)[0].done?'蓝色地块建设冰矿提取站，铜色地块建设月壤采矿站。记得用通道接入基地。':'资源链正在运转。科研、医疗与货运将把营地变成一座城市。';advisor.speak(advisorScreen,$('advice'),tips);
 $('flightStatus').textContent=(!m.port?'太空港待接通 · ':'')+({landing:'货船正在降落',docked:'货船停泊 · '+m.flight.daysLeft+'天后离港',departing:'货船正在离港',away:'下一班货船 · '+m.tradeIn+'天后'})[m.flight.phase];const unit=state.units.find(u=>u.id===selectedUnit);if(!unit)selectedUnit=null;$('unitCommand').hidden=!unit;$('unitName').textContent=unit?S.unitTypes[unit.type].name:'';if(state.lost)paused=true;
 $('placementHint').textContent=unit?'已选择月球车 · 点击空地移动 / 点击红色敌军攻击':buildType?S.types[buildType].name+' · 点击空地建设'+(hover?' · '+(S.canBuild(state,buildType,hover.x,hover.y)||'可以放置'):''):'选择设施建设 · 拖动地图平移 · 点击建筑查看';$('placementHint').classList.toggle('build',!!buildType);details($('inspectorContent'));
 if($('panel').open&&['research','trade','report','missions','army','inspect'].includes(modalKind))renderPanel();
}
function act(result){if(!result.ok)notify(result.error);else{save();dirty=true;palette();updateUI();}}
function pendingMission(){return state.mission.status!=='active'&&!state.mission.acknowledged;}
function showMissionResult(){if(!pendingMission()||state.lost)return false;accumulator=0;save();openPanel(state.mission.status==='achieved'?'victory':'deadline');return true;}
function continueMission(){S.acknowledgeMission(state);save();$('panel').close();paused=false;accumulator=0;updateUI();}
function openPanel(kind){modalKind=kind;renderPanel();if(!$('panel').open)$('panel').showModal();}
function renderPanel(){const body=$('panelBody'),m=S.metrics(state);const oldPortrait=body.querySelector('.advisor-screen');if(oldPortrait)advisor.cancel(oldPortrait);body.replaceChildren();$('panelTitle').textContent=({research:'科技研发',trade:'轨道补给贸易',report:'殖民地运营报表',missions:'五年计划 · 500人月面城市',victory:'任务目标达成',deadline:'五年期限已到',inspect:'设施情报',safeTrade:'核对靠港交易',demolish:'拆除设施',restart:'重新开始',load:'读取存档',army:'月面部队指挥',advisor:'北极狐 · 基地顾问'})[modalKind];
 if(modalKind==='safeTrade'&&pendingTrade){
  const order={...pendingTrade},q=order.quantity,limits=S.safeTradeLimits(state,order.key),cost=q*order.price;
  body.append(el('h3',(q>0?'买入':'卖出')+S.resources[order.key][0]+' · '+Math.abs(order.percent)+'%'),el('p','按本次安全可'+(q>0?'买':'卖')+'数量 '+order.available+' × '+Math.abs(order.percent)+'%，向下取整为 '+Math.abs(q)+' 单位。'),el('p','单价 ₡'+order.price+' · '+(q>0?'支付':'获得')+' ₡'+Math.abs(cost)),el('p','成交后库存 '+fmt(state.resources[order.key]+q)+' · 资金 ₡'+fmt(state.resources.credits-cost)),el('p','安全库存至少 '+limits.reserve+'；卖出比例以扣除安全库存后的余量为基数，买入比例以现金与剩余容量允许的数量为基数。买入不新增欠款，拖动或松手不会自动成交。','note'));
  const commit=button('确认'+(q>0?'买入':'卖出'),()=>{if(!pendingTrade)return;pendingTrade=null;commit.disabled=true;tradeDrafts.delete(order.key);const result=S.safeTrade(state,order.key,q,order);if(result.ok){save();$('panel').close();dirty=true;updateUI();notify('交易完成');}else{body.append(el('p',result.error,'note'));updateResourceRail(S.metrics(state));}});commit.id='confirmSafeTrade';body.append(commit,button('取消订单',()=>{pendingTrade=null;tradeDrafts.delete(order.key);$('panel').close();updateResourceRail(S.metrics(state));}));
 }
 if(modalKind==='research'){body.append(el('p','科研点：'+fmt(state.resources.science)+' · 建设并接通研究中心以持续产出。','note'));for(const [id,t] of Object.entries(S.technologies)){const row=el('div',undefined,'management-row'),text=el('div');text.append(el('h3',t.name),el('p',t.desc),el('p','需要 '+t.science+' 科研点 / ₡'+t.cost));const b=button(state.tech.includes(id)?'已完成':'开始研究',()=>act(S.research(state,id)));b.disabled=state.tech.includes(id);b.dataset.research=id;row.append(text,b);body.append(row);}}
 if(modalKind==='trade'){
   const market=S.marketQuotes(state);
   body.append(el('p',!m.port?'建设并接通太空交易港后，货船停泊期间可交易。':m.tradeOpen?'货船已停稳 · 还有'+m.flight.daysLeft+'天离港':'下一次停泊：'+m.tradeIn+'天后（降落与离港阶段均不能交易）','note'));
   body.append(el('p','第'+market.voyage+'班货船报价 · 每班重新定价，停泊期间保持不变。买入价比当班卖出价高15%～25%。','note'),el('p','可欠款至 −₡5000。电力交易使用蓄电库存与容量，仓库不增加蓄电容量。累计出口：₡'+fmt(state.tradeEarned),'note'));
   for(const [key,quote] of Object.entries(market.quotes)){
     const capacity=key==='energy'?m.battery:m.storage,row=el('div',undefined,'management-row market-row'),text=el('div'),buttons=el('div',undefined,'buttons');row.dataset.resource=key;
     text.append(el('h3',S.resources[key][0]+' · '+fmt(state.resources[key])+' / '+capacity),el('p','买入 ₡'+quote.buy+' / 卖出 ₡'+quote.sell+' 每单位','market-quote'),el('p','卖出基准 ₡'+quote.base+' · 波动范围 ₡'+quote.min+'–'+quote.max));
     for(const n of [10,50,-10,-50]){const unitPrice=n>0?quote.buy:quote.sell,b=button((n>0?'买入':'卖出')+Math.abs(n),()=>act(S.trade(state,key,n)));b.disabled=!m.port||!m.tradeOpen;b.title=(n>0?'支付':'获得')+' ₡'+Math.abs(n)*unitPrice;b.dataset.quantity=n;buttons.append(b);}
     row.append(text,buttons);body.append(row);
   }
 }
 if(modalKind==='missions'){const status=state.mission.status;body.append(el('h3','总任务：5年内将人口扩充为500人'),el('p','当前 '+S.formatDate(state.day)+' · 人口 '+fmt(state.population)+' / 500 · '+(status==='achieved'?'任务目标已达成':status==='expired'?'已超过五年期限':'剩余 '+(S.MISSION_DAYS-state.day+1)+' 个游戏日'),'note'),el('p','游戏历每月30天、每年12个月；最后期限为5年12月30日。1×时每游戏日5秒，2×时2.5秒，5×时1秒。达到目标后点击继续可自由游玩。'),el('h3','可选发展里程碑（不作为通关条件）'));body.append(el('p','建立航线 → 采矿与生命保障 → 科研和炮塔防守 → 维修与造车 → 击败帝国 → 扩张月面新城。目标只记录成就，资金依靠出口。首次货船第15天停泊10天，此后每60天一班。','note'));S.goals(state,m).forEach((g,i)=>{const row=el('div',undefined,'management-row'),text=el('div');text.append(el('h3',g.title),el('p',g.text));row.append(text,el('strong',state.rewards.includes(i)?'✓ 已达成':'进行中',state.rewards.includes(i)?'complete':''));body.append(row);});body.append(el('p','科学说明：水冰矿区为教学性场景配置，不代表静海真实冰矿分布。光照周期与建造时间为经营节奏缩短；月球没有可驱动风力发电的稠密大气。所有作物都在密闭温室中生长。','note'));}
 if(modalKind==='report'){const table=el('table'),head=el('tr');for(const x of ['设施','总数','联网','用电/天'])head.append(el('th',x));table.append(head);for(const [id,d] of Object.entries(S.types)){const bs=state.buildings.filter(b=>b.type===id);if(!bs.length)continue;const row=el('tr');[d.name,bs.length,bs.filter(b=>m.links.has(b.id)).length,bs.length*d.power].forEach(v=>row.append(el('td',v)));table.append(row);}body.append(table,el('h3','基地日志'));state.logs.slice(0,12).forEach(l=>{const row=el('div',undefined,'log-entry');row.append(el('small',S.formatDate(l.day)),el('span',l.text));body.append(row);});}
 if(modalKind==='advisor'){const portrait=advisor.frame(true),message=el('p');message.setAttribute('aria-live','polite');const text=$('advice').dataset.message||'';body.append(portrait,el('h3','指挥官，先稳住生产，再推进防线。'),message,button('重播对话',()=>advisor.speak(portrait,message,text,true),'advisor-replay'),el('p','开局建议：太空港 → 采矿站与冰矿站 → 研究中心、仓库与教育中心 → 电源 → 2～3座炮塔、维修厂 → 兵工厂与火箭月球车。别过早扩张人口。敌军第60天抵达，第120天后开始向基地推进。'));advisor.speak(portrait,message,text,true);}
 if(modalKind==='army'){
   body.append(el('h3','兵工厂 · 装配车辆'));for(const [id,d] of Object.entries(S.unitTypes)){const row=el('div',undefined,'management-row'),text=el('div');text.append(el('h3',d.name),el('p',d.desc),el('p','₡'+d.cost+' / '+d.metal+'月矿'));const b=button('生产',()=>act(S.train(state,id)));b.dataset.train=id;row.append(text,b);body.append(row);}
   body.append(el('h3','现有部队'));
   body.append(el('p','点击部队进入地图指挥；选中后点空地移动，点敌人攻击。炮塔自动开火，维修厂消耗月矿维护车辆与炮塔。','note'));
   for(const u of state.units){const row=el('div',undefined,'management-row');row.append(el('span',S.unitTypes[u.type].name+' · 装甲 '+Math.ceil(u.hp)+' / '+S.unitTypes[u.type].hp),button('选择并定位',()=>{selectedUnit=u.id;selected=null;buildType=null;camera.x=u.x;camera.y=u.y;$('panel').close();updateUI();dirty=true;}));body.append(row);}
   body.append(el('h3','帝国目标'));if(!state.empireArrived)body.append(el('p','第60天抵达东北部。趁现在组织防线。'));for(const e of state.enemies){const row=el('div',undefined,'management-row');row.append(el('span',(e.structure?S.enemyTypes[e.type]:S.unitTypes[e.type]).name+(!e.structure||e.hp<S.enemyTypes[e.type].hp?' · 装甲 '+Math.ceil(e.hp):'')),button('定位',()=>{camera.x=e.x;camera.y=e.y;$('panel').close();dirty=true;}));body.append(row);}
 }
 if(modalKind==='victory'||modalKind==='deadline'){
   const won=state.mission.status==='achieved';body.append(el('h3',won?'已在5年内将人口扩充至500人！':'本次未在五年内达到500人'),el('p',won?'达成日期：'+S.formatDate(state.mission.completedDay)+'。你可以保留全部建筑、资源和部队，继续自由建设。':'当前人口 '+fmt(state.population)+' 人。可以继续经营当前殖民地，也可以从菜单开启新挑战。','note'));const next=button('继续游玩',continueMission,'mission-continue');next.id='continueMission';body.append(next);
 }
 if(modalKind==='inspect')details(body);
 if(modalKind==='demolish'){body.append(el('p','拆除所选设施并回收35%的月矿（不返还资金）。拆除承担管网中继的通道或建筑，可能使后方区域断开供给。'));body.append(button('确认拆除',()=>{S.demolish(state,selected);selected=null;$('panel').close();save();dirty=true;updateUI();},'danger'));}
 if(modalKind==='restart'){body.append(el('p','重新开始会覆盖本机的月球殖民存档，其他游戏进度不受影响。'));body.append(button('确认新开局',()=>{state=S.create();tradeDrafts.clear();pendingTrade=null;vehicleHeadings.clear();turretHeadings.clear();combatFX.clear();lastDelta={};camera={x:20,y:20,zoom:1.35};selected=null;selectedUnit=null;cancel();paused=false;$('panel').close();save();updateUI();},'danger'));}
 if(modalKind==='load'){body.append(el('p','读取上次自动或手动保存的殖民地，替换当前状态。'));body.append(button('确认读取',()=>{try{const restored=S.restore(saveStore.getItem(KEY));if(!restored){notify('没有可用存档');return;}state=restored;tradeDrafts.clear();pendingTrade=null;vehicleHeadings.clear();turretHeadings.clear();combatFX.clear();lastDelta={};selected=null;selectedUnit=null;cancel();$('panel').close();dirty=true;updateUI();notify('已恢复本机殖民地');}catch{notify('浏览器未允许读取存档');}}));}
}
function clickTile(p){if(buildType){const r=S.build(state,buildType,p.x,p.y);if(!r.ok)notify(r.error);else{notify(S.types[buildType].name+(r.building.remaining?'施工中':'已铺设'));save();dirty=true;updateUI();}}else{
 const u=state.units.find(u=>u.x===p.x&&u.y===p.y);if(u){selectedUnit=u.id;selected=null;dirty=true;updateUI();return;}
 if(selectedUnit){const result=S.command(state,selectedUnit,p.x,p.y);act(result);if(result.ok)notify(state.enemies.some(e=>e.x===p.x&&e.y===p.y)?'攻击指令已下达':'移动指令已下达');return;}
 const e=state.enemies.find(e=>e.x===p.x&&e.y===p.y);if(e){notify((e.structure?S.enemyTypes[e.type]:S.unitTypes[e.type]).name+(!e.structure||e.hp<S.enemyTypes[e.type].hp?' · 装甲 '+Math.ceil(e.hp):'')+'；先选择己方月球车再点击进攻');return;}
 const b=S.at(state,p.x,p.y);selected=b?.id||null;dirty=true;updateUI();if(b&&width<500)openPanel('inspect');}}
canvas.addEventListener('pointerdown',e=>{if(e.button!==0&&e.button!==1)return;canvas.focus();canvas.setPointerCapture(e.pointerId);drag={id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,moved:false};});
canvas.addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect();hover=unproject(e.clientX-r.x,e.clientY-r.y);$('coordinate').textContent='SECTOR 01 · '+hover.x+' / '+hover.y;if(drag&&drag.id===e.pointerId){const dx=e.clientX-drag.lastX,dy=e.clientY-drag.lastY;if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>5)drag.moved=true;if(drag.moved){camera.x-=(dx/32+dy/16)/2/camera.zoom;camera.y-=(dy/16-dx/32)/2/camera.zoom;camera.x=Math.max(-3,Math.min(43,camera.x));camera.y=Math.max(-3,Math.min(43,camera.y));}drag.lastX=e.clientX;drag.lastY=e.clientY;}dirty=true;if(buildType)updateUI();});
canvas.addEventListener('pointerup',e=>{if(!drag||drag.id!==e.pointerId)return;const r=canvas.getBoundingClientRect();if(!drag.moved)clickTile(unproject(e.clientX-r.x,e.clientY-r.y));drag=null;});canvas.addEventListener('pointercancel',()=>drag=null);canvas.addEventListener('pointerleave',()=>{if(!drag){hover=null;dirty=true;}});
function zoom(value){camera.zoom=Math.max(.55,Math.min(2.5,value));dirty=true;}
canvas.addEventListener('wheel',e=>{e.preventDefault();zoom(camera.zoom*(e.deltaY>0?.9:1.1));},{passive:false});mini.addEventListener('pointerdown',e=>{const r=mini.getBoundingClientRect();camera.x=(e.clientX-r.left)/r.width*S.SIZE;camera.y=(e.clientY-r.top)/r.height*S.SIZE;dirty=true;});
$('zoomIn').onclick=()=>zoom(camera.zoom*1.2);$('zoomOut').onclick=()=>zoom(camera.zoom/1.2);$('centerBtn').onclick=$('centerNews').onclick=()=>{camera.x=20;camera.y=20;dirty=true;};$('gridBtn').onclick=()=>{grid=!grid;$('gridBtn').setAttribute('aria-pressed',grid);dirty=true;};$('pauseBtn').onclick=()=>{paused=!paused;updateUI();};$('speedBtn').onclick=()=>{speed=speed===1?2:speed===2?5:1;updateUI();};$('cancelBuild').onclick=cancel;
for(const [id,kind] of [['armyBtn','army'],['advisorBtn','advisor'],['researchBtn','research'],['tradeBtn','trade'],['reportBtn','report'],['missionBtn','missions'],['newBtn','restart'],['loadBtn','load']])$(id).onclick=()=>openPanel(kind);
$('stopUnit').onclick=()=>act(S.stop(state,selectedUnit));$('unitInfo').onclick=()=>openPanel('inspect');$('clearUnit').onclick=()=>{selectedUnit=null;updateUI();dirty=true;};$('enemyBtn').onclick=()=>{camera.x=26;camera.y=8;dirty=true;notify(state.empireArrived?'帝国前哨 · 选择己方月球车后点击敌方目标':'帝国预计第60天抵达此区域');};
$('replayAdvisor').onclick=()=>advisor.speak(advisorScreen,$('advice'),$('advice').dataset.message||'',true);
$('saveBtn').onclick=()=>save(true);$('closePanel').onclick=()=>{if(['victory','deadline'].includes(modalKind))continueMission();else $('panel').close();};$('panel').addEventListener('cancel',e=>{if(['victory','deadline'].includes(modalKind))e.preventDefault();});$('panel').addEventListener('close',()=>{if(modalKind==='safeTrade'){pendingTrade=null;tradeDrafts.clear();updateResourceRail(S.metrics(state));}const portrait=$('panelBody').querySelector('.advisor-screen');if(portrait)advisor.cancel(portrait);const wasBriefing=modalKind==='missions';modalKind='';accumulator=0;if(pendingMission()){showMissionResult();return;}if(wasBriefing)advisor.speak(advisorScreen,$('advice'),$('advice').dataset.message||'',true);});$('categories').onclick=e=>{const b=e.target.closest('[data-category]');if(!b)return;category=b.dataset.category;for(const c of $('categories').children)c.classList.toggle('active',c===b);palette();};
window.addEventListener('keydown',e=>{if($('panel').open||e.target.closest('input,select,textarea'))return;if([' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))e.preventDefault();if(e.key==='Escape')cancel();if(e.code==='Space'&&!e.repeat){paused=!paused;updateUI();}keys.add(e.key.toLowerCase());});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{keys.clear();drag=null;save();});document.addEventListener('visibilitychange',()=>{lastTime=performance.now();accumulator=0;if(document.hidden)save();});window.addEventListener('pagehide',()=>save());new ResizeObserver(resize).observe($('viewport'));
function loop(now){const dt=Math.min(.1,(now-lastTime)/1000||0);lastTime=now;if(!document.hidden&&!$('panel').open){let dx=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),dy=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);if(dx||dy){camera.x=Math.max(-3,Math.min(43,camera.x+(dx+dy)*dt*7));camera.y=Math.max(-3,Math.min(43,camera.y+(dy-dx)*dt*7));dirty=true;}if(!paused&&!state.lost){dirty=true;combatFX.update(dt);accumulator+=dt*speed;while(accumulator>=S.DAY_SECONDS){accumulator-=S.DAY_SECONDS;lastDelta=S.tick(state);combatFX.emit(state.shots);dirty=true;updateUI();if(state.day%10===0)save();if(showMissionResult())break;}}}if(dirty)draw();if(now>toastUntil)$('toast').classList.remove('show');requestAnimationFrame(loop);}
// Read-only diagnostics support regression checks without exposing gameplay mutation.
window.__colonyDiagnostics=()=>({state:JSON.parse(JSON.stringify(state)),camera:{...camera},paused,speed,buildType,selected,selectedUnit,fadedBuildings:[...fadedBuildings],combatEffects:combatFX.snapshot(),disconnectedBuildings:state.buildings.filter(b=>isDisconnected(b,S.metrics(state))).map(b=>b.id),metrics:{...S.metrics(state),links:[...S.metrics(state).links]},screen:(x,y)=>project(x,y)});
palette();resize();updateUI();requestAnimationFrame(loop);if(!showMissionResult()){if(!loaded)openPanel('missions');else notify('已恢复静海前哨 · '+S.formatDate(state.day));}
})();
