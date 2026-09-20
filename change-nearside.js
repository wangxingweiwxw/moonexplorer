/* Chang'e 3 / Yutu and Chang'e 5: near-side science exhibits. */
window.ChangeNearside=(()=>{
 'use strict';
 const T=THREE,A=RoverArt;
 function nationalFlag(){
   const g=new T.Group(),silver=new T.MeshStandardMaterial({color:0xd4d7d4,metalness:.65,roughness:.45});
   const pole=new T.Mesh(new T.CylinderGeometry(.045,.065,4.6,8),silver);pole.position.y=2.3;pole.castShadow=true;g.add(pole);
   const bar=new T.Mesh(new T.CylinderGeometry(.025,.025,2.4,8),silver);bar.rotation.z=Math.PI/2;bar.position.set(1.15,4.42,0);g.add(bar);
   const cv=document.createElement('canvas');cv.width=300;cv.height=200;const c=cv.getContext('2d');c.fillStyle='#de2910';c.fillRect(0,0,300,200);c.fillStyle='#ffde00';
   function star(x,y,r,angle=-Math.PI/2){c.beginPath();for(let i=0;i<10;i++){const a=angle+i*Math.PI/5,rr=i%2?r*.382:r;c.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}c.closePath();c.fill();}
   star(50,50,30);for(const [x,y] of [[100,20],[120,40],[120,70],[100,90]])star(x,y,10,Math.atan2(50-y,50-x));
   const tex=new T.CanvasTexture(cv);tex.colorSpace=T.SRGBColorSpace;tex.magFilter=T.NearestFilter;
   const flag=new T.Mesh(new T.PlaneGeometry(2.25,1.5),new T.MeshStandardMaterial({map:tex,side:T.DoubleSide,roughness:.85}));flag.position.set(1.16,3.64,0);flag.castShadow=true;g.add(flag);
   // Fixed support bar, no wind animation in lunar vacuum. Ground placement is a
   // deliberate exhibit sign, not a claim about the missions' actual flag mounting.
   const foot=new T.Mesh(new T.CylinderGeometry(.23,.3,.13,8),silver);foot.position.y=.065;g.add(foot);g.name='中国国旗 · 科普展示';return g;
 }
 function context(mission){
   const hash=(x,z)=>{const n=Math.sin(x*127.1+z*311.7+mission*19.3)*43758.5453;return n-Math.floor(n);};
   function heightAt(x,z){let h=2.7+Math.sin(x*.09)*.3+Math.cos(z*.12)*.2;
     const craters=mission===3?[[22,25,11,3.2],[-31,-23,8,2.1],[33,-25,7,1.6]]:[[22,24,9,2.2],[-27,-26,7,1.7],[35,-24,6,1.4]];
     for(const [cx,cz,r,d] of craters){const t=Math.hypot(x-cx,z-cz)/r;if(t<1)h+=t>.75?Math.sin((t-.75)*4*Math.PI)*.5:-d*Math.pow(1-t/.75,1.3);}
     for(const [cx,cz,r,v] of [[-43,37,15,6],[40,40,17,mission===3?7:5],[43,-38,14,5]]){const t=Math.hypot(x-cx,z-cz)/r;if(t<1)h+=Math.pow(1-t,.8)*v;}return h;
   }
   const voxelY=(x,z)=>Math.round(heightAt((Math.floor(x*2)+.5)/2,(Math.floor(z*2)+.5)/2)*4)/4;
   function dressing(){const group=new T.Group(),mat=new T.MeshStandardMaterial({color:mission===3?0x98938a:0x87877e,map:A.texture('rock'),roughness:.94});for(let i=0;i<205;i++){const x=(hash(i,1)-.5)*114,z=(hash(i,2)-.5)*114,s=.18+hash(i,3)*.85,o=new T.Mesh(new T.BoxGeometry(s,s*.6,s*.8),mat);o.position.set(x,voxelY(x,z)+s*.3,z);o.castShadow=o.receiveShadow=true;group.add(o);}return {group,markers:[]};}
   return {heightAt,voxelY,dressing,groundColor:(x,z)=>hash(Math.floor(x*2),Math.floor(z*2))>.5?0xaca79b:0x949286};
 }
 const three={mission:{id:3,name:'嫦娥三号',sub:'MARE IMBRIUM / 2013',spawn:{x:-12,z:-15,yaw:.48},spots:[{x:22,z:25,title:'雨海 · 撞击地貌观察',card:'crater'},{x:24,z:-14,title:'雨海月壤 · 地质对照',card:'samples'}]},context:context(3),lander:()=>Change4Region.lander(3),rover:()=>Change4Region.rover(3)};
 const five={mission:{id:5,name:'嫦娥五号',sub:'OCEANUS PROCELLARUM / 2020',spawn:{x:-16,z:-15,yaw:.7},spots:[{x:22,z:24,title:'风暴洋 · 玄武岩平原',card:'samples'},{x:23,z:-14,title:'表取与钻取 · 月壤样本',card:'samples'}]},context:context(5),lander:()=>Change6Region.lander(5)};
 return {three,five,nationalFlag};
})();
