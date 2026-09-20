/* Code-native voxel interpretation of the supplied Chang'e 6 reference. */
window.Change6Region=(()=>{
  'use strict';
  const T=THREE,A=RoverArt;
  const hash=(x,z)=>{const n=Math.sin(x*127.1+z*311.7+61.6)*43758.5453;return n-Math.floor(n);};
  const mat=(color,extra={})=>new T.MeshStandardMaterial({color,map:A.texture('panel'),roughness:.75,metalness:.2,flatShading:true,...extra});
  function box(g,m,x,y,z,w,h,d){const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;g.add(o);return o;}
  function rod(g,m,a,b,r=.05){const p=new T.Vector3(...a),q=new T.Vector3(...b),v=q.clone().sub(p),o=new T.Mesh(new T.CylinderGeometry(r,r,v.length(),6),m);o.position.copy(p.add(q).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());o.castShadow=true;g.add(o);return o;}
  function lander(mission=6){
    const group=new T.Group(),down=new T.Group(),up=new T.Group();group.add(down,up);
    const gold=[mat(0xc59747,{metalness:.65}),mat(0xf0ca7b,{metalness:.65}),mat(0x8e682c,{metalness:.6})],white=mat(0xe0ded2),silver=mat(0xaeb6bb),black=mat(0x232b31),blue=mat(0x152c49,{metalness:.5,roughness:.33}),grid=mat(0x69829b);
    box(down,mission===5?white:gold[0],0,1.85,0,2.9,1.7,2.6);box(down,black,0,2.78,0,3.12,.16,2.8);
    for(let f=0;f<4;f++)for(let i=0;i<12;i++)for(let j=0;j<7;j++){
      const a=(i-5.5)*.24,h=1.08+j*.24,k=Math.floor(hash(i+f*13,j)*3),out=(f<2?1.33:1.48)+hash(i,j)*.06;
      box(down,mission===5?(k===2?silver:white):gold[k],f<2?a:(f===2?out:-out),h,f<2?(f===0?out:-out):a,f<2?.25:.12,.25,f<2?.12:.25);
    }
    for(const x of [-1,1])for(const z of [-1,1]){
      rod(down,gold[1],[x*1.1,2.1,z],[x*2.8,.22,z*2.4],.085);rod(down,silver,[x*.8,1.1,z*.8],[x*2.6,.4,z*2.2],.045);
      box(down,gold[2],x*2.8,.15,z*2.4,.8,.16,.65);
    }
    box(down,white,0,.88,0,1.5,.25,1.3);
    // Silver instrument panels, black radiator strips and exposed brackets break up the foil body.
    box(down,silver,-.48,2.02,1.46,1.25,.92,.18);box(down,black,-.48,2.04,1.57,.98,.64,.07);
    for(let i=0;i<7;i++)box(down,silver,-.94+i*.15,2.04,1.62,.055,.62,.04);
    box(down,white,.83,2.15,1.43,.48,.82,.2);box(down,gold[2],.83,1.51,1.43,.46,.42,.19);
    for(const side of [-1,1]){rod(down,silver,[side*1.32,1.05,1.38],[side*1.32,2.78,1.38],.04);box(down,white,side*1.14,2.65,.92,.48,.17,.55);}
    for(const side of [-1,1]){
      rod(down,silver,[side*1.2,2.2,0],[side*2.5,2.2,0],.07);
      box(down,silver,side*3.55,2.19,0,3.8,.12,1.65);box(down,blue,side*3.55,2.265,0,3.7,.035,1.56);
      for(let i=0;i<15;i++)box(down,grid,side*3.55-1.75+i*.25,2.29,0,.016,.015,1.56);
      for(let i=0;i<5;i++)box(down,grid,side*3.55,2.29,-.75+i*.375,3.7,.015,.015);
      box(down,white,side*1.52,2.05,.62,.28,.95,.55);
    }
    // Surface sampler, elbow joints, scoop and side-mounted drill.
    const arm=mission===5?[[-1.2,2.6,1.2],[-1.3,3.8,1.35],[-2.2,2.05,1.7],[-2.25,.8,2]]:[[-1.2,2.6,1.2],[-2.65,3.55,1.6],[-4.05,1.4,2],[-4.65,1.25,2.1]];
    for(let i=1;i<arm.length;i++){rod(down,white,arm[i-1],arm[i],.07);box(down,silver,...arm[i],.22,.22,.22);}
    box(down,black,arm[3][0],arm[3][1]-.09,arm[3][2],.65,.12,.3);
    rod(down,white,[1.25,3.2,1.3],[1.25,.38,1.3],.14);box(down,gold[0],1.25,.9,1.3,.36,.48,.36);
    if(mission===5){for(const side of [-1,1]){rod(down,silver,[side*.85,2.8,-.65],[side*.45,3.5,.35],.055);rod(down,silver,[side*.85,2.8,.65],[side*.45,3.5,-.35],.055);}up.position.y=.42;}
    box(up,mission===5?white:gold[0],0,3.2,-.12,1.9,.7,1.7);box(up,white,0,3.66,-.12,1.85,.22,1.7);
    box(up,silver,0,3.27,.77,1.68,.37,.09);
    for(let i=0;i<6;i++)box(up,i%2?gold[1]:white,-.7+i*.28,3.29,.84,.16,.22,.08);
    for(let i=0;i<18;i++)box(up,i%3?white:gold[1],(hash(i,4)-.5)*1.7,3.85+hash(i,8)*.18,(hash(i,3)-.5)*1.5,.16,.2,.2);
    for(const side of [-1,1]){box(up,white,side*.96,3.4,0,.3,.7,.43);rod(up,silver,[side*.65,3.7,-.4],[side*.65,4.3,-.4],.025);}
    rod(down,silver,[.8,2.8,-1],[.8,4.6,-1],.025);
    if(mission===5){box(down,gold[1],1.05,1.85,1.48,.46,1.45,.25);for(let i=0;i<7;i++)box(down,gold[2],1.05,1.2+i*.18,1.63,.48,.025,.025);rod(down,silver,[-1.1,2.8,-.9],[-1.1,5.1,-.9],.025);}
    const dish=new T.Mesh(new T.ConeGeometry(.35,.12,12,1,true),silver);dish.position.set(.8,4.58,-1);dish.rotation.x=2.1;down.add(dish);
    // Small national flag on the lander, retained after ascent.
    const c=document.createElement('canvas');c.width=240;c.height=160;const q=c.getContext('2d');q.fillStyle='#c9252e';q.fillRect(0,0,240,160);q.fillStyle='#ffdf70';
    function star(x,y,r,angle=-Math.PI/2){q.beginPath();for(let i=0;i<10;i++){const a=angle+i*Math.PI/5,rr=i%2?r*.4:r;q.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}q.closePath();q.fill();}
    star(43,43,22);for(const [x,y] of [[79,18],[96,37],[96,62],[79,82]])star(x,y,8,Math.atan2(43-y,43-x));
    const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.magFilter=T.NearestFilter;
    rod(down,silver,[-1.55,2.5,1],[-1.55,3.6,1],.025);const flag=new T.Mesh(new T.PlaneGeometry(.78,.52),new T.MeshStandardMaterial({map:tex,side:T.DoubleSide}));flag.position.set(-1.17,3.32,1);down.add(flag);
    A.batch(down);A.batch(up);group.name="Chang'e "+mission+" lander and ascender";return {group,ascent:up,mission};
  }
  function heightAt(x,z){let h=2.5+Math.sin(x*.12)*.25+Math.cos(z*.11)*.3;
    for(const [cx,cz,r,depth] of [[14,18,11,2.4],[-18,-21,8,1.8],[30,-22,7,1.4]]){const t=Math.hypot(x-cx,z-cz)/r;if(t<1)h+=t>.75?Math.sin((t-.75)*4*Math.PI)*depth*.12:-depth*Math.pow(1-t/.75,1.3);}
    const edge=Math.max(Math.abs(x),Math.abs(z));if(edge>35)h+=(edge-35)*.13*(1+Math.sin(x*.16)*.2);return h;
  }
  const voxelY=(x,z)=>Math.round(heightAt((Math.floor(x*2)+.5)/2,(Math.floor(z*2)+.5)/2)*4)/4;
  function dressing(){const group=new T.Group(),stone=mat(0x8d8b85);for(let i=0;i<145;i++){const x=(hash(i,1)-.5)*112,z=(hash(i,2)-.5)*112,s=.25+hash(i,3)*1.1;box(group,stone,x,voxelY(x,z)+s*.3,z,s,s*.6,s*.8);}return {group,markers:[]};}
  const mission={id:6,name:'嫦娥六号',sub:'APOLLO BASIN / 2024',spawn:{x:-16,z:-15,yaw:.7},spots:[
    {x:14,z:18,title:'盆地撞击坑 · 复用撞击图鉴',card:'crater'},
    {x:22,z:-12,title:'月壤观察点 · 复用样本图鉴',card:'samples'}]};
  const context={heightAt,voxelY,groundColor:(x,z)=>hash(Math.floor(x*2),Math.floor(z*2))>.5?0xaaa8a0:0x93928e,dressing};
  return {mission,context,lander};
})();
