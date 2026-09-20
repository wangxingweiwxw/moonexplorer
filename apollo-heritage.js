/* Voxel interpretation of the supplied reference; togglable mission / relic states. */
window.ApolloHeritage=(()=>{
  'use strict';
  const T=THREE,A=RoverArt;
  const random=(i,j)=>{const n=Math.sin(i*127.1+j*311.7)*43758.5453;return n-Math.floor(n);};
  const mat=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.76,metalness:.18,map:A.texture('panel'),flatShading:true,...extra});
  function box(g,m,x,y,z,w,h,d){const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;g.add(o);return o;}
  function strut(g,m,a,b,r=.045){const p=new T.Vector3(...a),q=new T.Vector3(...b),delta=q.clone().sub(p);const o=new T.Mesh(new T.CylinderGeometry(r,r,delta.length(),6),m);o.position.copy(p.add(q).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());o.castShadow=true;g.add(o);return o;}
  function dish(g,m,x,y,z,r){const root=new T.Group();root.position.set(x,y,z);root.rotation.x=-.5;const bowl=new T.Mesh(new T.ConeGeometry(r,r*.30,12,1,true),m);bowl.rotation.x=Math.PI;root.add(bowl);for(let i=0;i<12;i++){const a=i/12*Math.PI*2;strut(root,m,[0,-r*.15,0],[Math.cos(a)*r,r*.15,Math.sin(a)*r],.018);}strut(root,m,[0,0,0],[0,r*.65,0],.03);g.add(root);return root;}
  function flag(g,x,z){const cv=document.createElement('canvas');cv.width=260;cv.height=140;const c=cv.getContext('2d');c.fillStyle='#eee8d9';c.fillRect(0,0,260,140);c.fillStyle='#b83b32';for(let i=0;i<13;i+=2)c.fillRect(0,i*140/13,260,140/13);c.fillStyle='#243a60';c.fillRect(0,0,110,76);c.fillStyle='#f7f2df';for(let y=0;y<5;y++)for(let x=0;x<10;x++)c.fillRect(6+x*10,5+y*14,3,3);const tex=new T.CanvasTexture(cv);tex.colorSpace=T.SRGBColorSpace;tex.magFilter=T.NearestFilter;const silver=mat(0xb9c2c8);strut(g,silver,[x,0,z],[x,3.4,z],.035);strut(g,silver,[x,3.3,z],[x+1.65,3.3,z],.025);const cloth=new T.Mesh(new T.PlaneGeometry(1.65,.9,10,1),new T.MeshStandardMaterial({map:tex,side:T.DoubleSide,roughness:1}));const pos=cloth.geometry.attributes.position;for(let i=0;i<pos.count;i++)pos.setZ(i,Math.sin(pos.getX(i)*9)*.035);cloth.position.set(x+.82,2.86,z);cloth.castShadow=true;g.add(cloth);}
  function lander(mission=15){
    const group=new T.Group(),down=new T.Group(),up=new T.Group();group.add(down,up);
    const golds=[mat(0xc89636,{metalness:.66,roughness:.42}),mat(0xe9bf65,{metalness:.5}),mat(0x8f641e,{metalness:.6}),mat(0xf1ce7a,{metalness:.65})],white=mat(0xdfdfd5),grey=mat(0x969b9b),dark=mat(0x222b30),silver=mat(0xaab3b5);
    box(down,golds[0],0,1.55,0,3.4,1.8,3.4);box(down,dark,0,2.51,0,3.6,.18,3.6);
    // Small uneven tiles suggest the folded thermal foil, preserving a voxel silhouette.
    for(let face=0;face<4;face++)for(let x=0;x<16;x++)for(let y=0;y<8;y++){
      const a=(x-7.5)*.214,b=.77+y*.218,k=Math.floor(random(x+face*23,y)*4),out=1.71+random(x,y+face)*.07;
      const tile=box(down,golds[k],face<2?a:(face===2?out:-out),b,face<2?(face===0?out:-out):a,face<2?.215:.10,.22,face<2?.10:.215);tile.rotation.y=(random(x,y)-.5)*.12;
    }
    for(let i=0;i<4;i++){
      const a=Math.PI/4+i*Math.PI/2,x=Math.sin(a)*3.6,z=Math.cos(a)*3.6;
      strut(down,golds[2],[x*.43,2.3,z*.43],[x,.22,z],.09);strut(down,silver,[x*.34,.8,z*.34],[x*.83,.55,z*.83],.055);
      box(down,dark,x,.12,z,.8,.18,.8);box(down,golds[1],x,.23,z,.6,.07,.6);
    }
    for(let i=0;i<9;i++)box(down,silver,0,.35+i*.26,2.45-i*.055,.62,.07,.14);
    strut(down,silver,[-.36,.1,2.55],[-.36,2.6,2.05]);strut(down,silver,[.36,.1,2.55],[.36,2.6,2.05]);
    // Ascent cabin: clipped faces, black thermal panels and dark triangular windows.
    const cabin=new T.Mesh(new T.CylinderGeometry(1.36,1.67,2.2,8),white);cabin.position.set(0,3.72,0);cabin.rotation.y=Math.PI/8;cabin.castShadow=true;up.add(cabin);
    box(up,dark,0,3.3,-1.3,2.0,1.4,.65);box(up,grey,-1.55,3.2,-.2,.75,1.3,1.7);box(up,white,1.55,3.3,-.1,.68,1.1,1.4);
    box(up,white,0,2.95,1.46,1.03,.85,.6);box(up,dark,0,2.99,1.79,.69,.66,.04);
    for(const side of [-1,1]){
      const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute([side*.20,4.25,1.37,side*1.05,4.15,1.30,side*1.03,3.57,1.47],3));geo.computeVertexNormals();const win=new T.Mesh(geo,new T.MeshStandardMaterial({color:0x09141d,metalness:.75,roughness:.18,side:T.DoubleSide}));up.add(win);
      for(let i=0;i<25;i++){const x=side*(.25+random(i,7)*.9),y=2.8+random(i,18)*1.9;box(up,i%3?white:grey,x,y,1.43,.12+random(i,9)*.18,.13,.04);}
      box(up,dark,side*1.8,3.9,.2,.45,.6,.4);for(let k=0;k<3;k++){const thr=new T.Mesh(new T.ConeGeometry(.15,.28,6),dark);thr.position.set(side*(1.9+k*.06),3.8+k*.24,.35);thr.rotation.z=side*Math.PI/2;up.add(thr);}
    }
    strut(up,silver,[0,4.75,0],[0,5.65,0],.04);dish(up,silver,-.75,5.05,-.3,.45);dish(up,grey,.75,5.16,-.2,.35);
    // Reference-inspired panel layouts distinguish Orion and Challenger; not measured replicas.
    if(mission===16){
      box(up,white,-1.23,4.05,.22,.65,1.25,1.5);box(up,dark,1.31,3.78,.8,.48,1.65,.48);
      strut(up,silver,[-1.7,2.7,1.65],[-.4,4.6,1.5],.035);
      box(down,dark,.83,1.64,1.82,1.1,1.54,.12);
    }else if(mission===17){
      box(down,dark,0,1.55,1.84,1.35,1.85,.18);
      box(up,dark,0,4.08,1.48,.19,1.55,.08);
      box(up,white,-1.3,3.8,.25,.62,1.7,1.65);box(up,white,1.3,3.8,.25,.62,1.7,1.65);
      for(const side of [-1,1]){box(up,grey,side*1.3,4.55,.2,.8,.18,1.7);strut(up,silver,[side*1.3,4.6,-.3],[side*1.3,5.6,-.3],.035);dish(up,white,side*1.3,5.6,-.3,.32);}
    }
    // Early walking missions: reference-inspired foil panels, no LRV.
    if([11,12,14].includes(mission)){
      const foil=mat(0xd0d1c7,{metalness:.58,roughness:.5});
      for(let y=0;y<7;y++)for(let x=0;x<7;x++){
        const panel=box(down,(x+y)%4?foil:silver,-1.72,.87+y*.22,(x-3)*.23,.13,.22,.23);
        panel.rotation.z=(random(x,y)-.5)*.1;
      }
      box(up,dark,1.45,4.15,-.35,.48,1.25,1.35);
      if(mission===11){box(up,dark,-.82,4.35,1.48,.64,.32,.08);box(down,dark,1.78,1.76,-.3,.12,1.3,1.35);}
      if(mission===12){box(up,foil,-1.57,3.48,-.18,.14,1.52,1.7);box(down,dark,.93,1.36,1.87,.85,.7,.1);}
      if(mission===14){
        // Bright silver lower quadrant and dark upper panels echo the Apollo 14 photo.
        for(let y=0;y<7;y++)for(let x=0;x<6;x++)box(down,(x+y)%3?foil:silver,.45+x*.23,.88+y*.22,1.85,.23,.22,.10);
        box(up,dark,-.68,4.66,.18,1.25,.26,1.5);
        // MET hand cart, not a motorised lunar rover.
        box(down,silver,4.35,.65,-1.9,1.2,.12,1.65);
        for(const side of [-1,1]){const wheel=new T.Mesh(new T.CylinderGeometry(.32,.32,.16,12),dark);wheel.rotation.z=Math.PI/2;wheel.position.set(4.35+side*.72,.34,-1.9);down.add(wheel);strut(down,silver,[4.35+side*.5,.7,-1.2],[4.35+side*.5,1.05,.2],.035);}
        strut(down,silver,[3.85,1.05,.2],[4.85,1.05,.2],.04);
        for(let j=0;j<3;j++)box(down,white,4.35,.91,-2.4+j*.48,.85,.42,.36);
      }
      group.userData.walkingMission=true;group.userData.handCart=mission===14;
    }
    const cv=document.createElement('canvas');cv.width=256;cv.height=192;const ctx=cv.getContext('2d');ctx.fillStyle='#17232a';ctx.fillRect(0,0,256,192);ctx.fillStyle='#e3e6dc';ctx.textAlign='center';ctx.font='bold 32px monospace';ctx.fillText('UNITED',128,84);ctx.fillText('STATES',128,121);ctx.font='19px monospace';ctx.fillText('APOLLO '+mission,128,160);const decal=new T.Mesh(new T.PlaneGeometry(.87,.66),new T.MeshStandardMaterial({map:new T.CanvasTexture(cv),roughness:1}));decal.position.set(mission===17?0:.83,1.75,1.96);down.add(decal);
    flag(down,mission===16?4:-4,1.8);A.batch(down);A.batch(up);group.name='Apollo '+mission+' lunar module';return {group,ascent:up,mission};
  }
  function rover(mission=15){
    const g=new T.Group(),white=mat(0xd7d8cf),silver=mat(0x9ca5a4),dark=mat(0x4c4943),orange=mat(0xa76c3f),seat=mat(0xe9e2cb);
    box(g,silver,0,.55,0,1.65,.14,2.8);for(const side of [-1,1]){
      strut(g,silver,[side*.7,.65,-1.1],[side*.7,.65,1.4]);box(g,seat,side*.42,.85,.12,.65,.12,.7);box(g,seat,side*.42,1.21,-.18,.64,.74,.10).rotation.x=-.13;
      for(const z of [-.96,.97]){
        const wheel=new T.Group();wheel.position.set(side*.94,.39,z);wheel.rotation.y=Math.PI/2;
        const ring=new T.Mesh(new T.TorusGeometry(.35,.048,4,20),dark);wheel.add(ring);
        for(let i=0;i<16;i++){const a=i*Math.PI/8;box(wheel,silver,Math.cos(a)*.35,Math.sin(a)*.35,0,.09,.09,.19);strut(wheel,silver,[0,0,0],[Math.cos(a)*.32,Math.sin(a)*.32,0],.012);}
        box(wheel,silver,0,0,0,.12,.12,.23);g.add(wheel);box(g,orange,side*.94,.81,z,.34,.07,.63);
      }
    }
    box(g,white,0,.75,1.08,1.25,.3,.48);box(g,dark,0,1.02,.75,.28,.18,.26);strut(g,silver,[0,.7,.35],[0,1.16,.45]);box(g,dark,0,1.18,.45,.4,.06,.08);
    strut(g,silver,[.57,.7,1.2],[.57,2.3,1.2],.035);dish(g,mission===17?mat(0xc9aa70,{metalness:.5}):silver,.57,2.38,1.2,mission===17?.76:.61);
    strut(g,silver,[-.5,.7,1.2],[-.5,1.65,1.2],.025);box(g,white,-.5,1.7,1.2,.31,.24,.3);box(g,dark,-.5,1.7,1.37,.14,.14,.05);
    box(g,white,0,.9,-1.03,1.45,.55,.37);for(const side of [-1,1])strut(g,silver,[side*.7,.65,-1.25],[side*.7,1.3,-1.25]);
    if(mission>=16){
      for(const side of [-1,1]){strut(g,silver,[side*.68,.7,-1.35],[side*.68,1.65,-1.35],.03);box(g,white,side*.48,1.2,-1.12,.3,.5,.32);}
      strut(g,silver,[-.68,1.65,-1.35],[.68,1.65,-1.35],.035);
      strut(g,silver,[-.67,.7,-.9],[-.67,2.65,-.9],.018);
    }
    if(mission===17){
      for(let i=0;i<4;i++)box(g,white,-.48+i*.32,1.5,-1.24,.12,.68,.15);
      // The light patch recalls the field repair with maps; its shape is stylized.
      box(g,seat,-.94,.82,-1.23,.36,.045,.55);
      for(let i=0;i<3;i++)box(g,dark,-.94,.848,-1.4+i*.17,.37,.012,.02);
    }
    g.name='Apollo '+mission+' LRV';A.batch(g);return g;
  }
  return {lander,rover};
})();
