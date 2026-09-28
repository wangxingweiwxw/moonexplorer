/* Original isometric sprite geometry; all sizes use the same world grid. */
(function(root){
 'use strict';
 function building(type,types,compact=false,level=1,heading=6){
  const canvas=document.createElement('canvas');canvas.width=416;canvas.height=416;const c=canvas.getContext('2d'),ox=104,oy=132;c.scale(2,2);c.lineJoin='round';
  const pt=(x,y,h=0)=>[ox+(x-y)*32,oy+(x+y)*16-h];
  const poly=(ps,fill,stroke)=>{c.beginPath();ps.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}};
  const line=(a,b,color='#a9c5c9',w=1)=>{c.beginPath();c.moveTo(...a);c.lineTo(...b);c.strokeStyle=color;c.lineWidth=w;c.stroke();};
  const glow=(p,color='#79e9ff',r=1.3)=>{c.fillStyle=color;c.shadowColor=color;c.shadowBlur=3;c.fillRect(p[0]-r,p[1]-r,r*2,r*2);c.shadowBlur=0;};
  const panel=(x,y,w,d,h,fill,edge='#859baa')=>poly([pt(x,y,h),pt(x+w,y,h),pt(x+w,y+d,h),pt(x,y+d,h)],fill,edge);
  const box=(x,y,w,d,h,color='#bdc8ce',bottom=3)=>{
   poly([pt(x,y+d,bottom),pt(x+w,y+d,bottom),pt(x+w,y+d,h),pt(x,y+d,h)],'#718595','#263c4d');
   poly([pt(x+w,y,bottom),pt(x+w,y+d,bottom),pt(x+w,y+d,h),pt(x+w,y,h)],'#3e566a','#263744');
   panel(x,y,w,d,h,color,'#dde4df');
   line(pt(x,y+d,h-2),pt(x+w,y+d,h-2),'#cbd9dd',1.1);line(pt(x+w,y,h-2),pt(x+w,y+d,h-2),'#a6b9c6',.7);
   if(h-bottom>12){
    for(let i=1;i<Math.ceil(w*5);i++){const q=x+w*i/Math.ceil(w*5);line(pt(q,y+d,bottom+2),pt(q,y+d,h-4),'#344e62',.6);}
    for(let i=1;i<Math.ceil(d*5);i++){const q=y+d*i/Math.ceil(d*5);line(pt(x+w,q,bottom+2),pt(x+w,q,h-4),'#294053',.6);}
    for(let z=bottom+12;z<h-6;z+=13){
     line(pt(x+.035,y+d,z),pt(x+w-.035,y+d,z),'#9eafb9',.6);
     line(pt(x+w,y+.035,z),pt(x+w,y+d-.035,z),'#7b91a3',.6);
     for(let i=1;i<Math.ceil(d*4);i++){const v=y+d*i/Math.ceil(d*4);const q=pt(x+w,v,z+3);c.fillStyle='#b3c4cb';c.fillRect(q[0],q[1],.7,.7);}
    }
    line(pt(x+.04,y+d,bottom+4),pt(x+w-.04,y+d,bottom+4),'#9dafb4',1.5);
    for(const q of [x+.04,x+w-.04]){line(pt(q,y+d,bottom+1),pt(q,y+d,h-4),'#c4cdd0',2);glow(pt(q,y+d,bottom+6));}
   }
  };
  const faceWindows=(x,y,n,h)=>{for(let j=0;j<n;j++){const a=x+j*.14;
   poly([pt(a,y,h),pt(a+.10,y,h),pt(a+.10,y,h-5),pt(a,y,h-5)],j%3?'#153e61':'#25678e','#182e40');
   line(pt(a,y,h-1),pt(a+.10,y,h-1),'#7ddfff',1.2);line(pt(a,y,h-5),pt(a+.10,y,h-5),'#4c9bbd',.6);
  }};
  const vent=(x,y,w,d,h)=>{panel(x,y,w,d,h,'#243b4a','#b2c1ca');for(let j=1;j<5;j++)line(pt(x+w*.12,y+d*j/5,h+.5),pt(x+w*.88,y+d*j/5,h+.5),'#8aa2ad',.8);};
  const fan=(x,y,h,r=5)=>{const p=pt(x,y,h);c.fillStyle='#233744';c.strokeStyle='#b4c8d2';c.lineWidth=1;c.beginPath();c.ellipse(...p,r,r*.52,0,0,Math.PI*2);c.fill();c.stroke();for(let j=0;j<4;j++){const a=j*Math.PI/2;line(p,[p[0]+Math.cos(a)*r*.8,p[1]+Math.sin(a)*r*.4],'#869ea7',1.5);}glow(p,'#8bddea',.7);};
  const pipe=(points,color='#96b6c5')=>{for(let i=1;i<points.length;i++){line(pt(...points[i-1]),pt(...points[i]),'#253b49',4);line(pt(...points[i-1]),pt(...points[i]),color,2);}};
  const beacon=(x,y,h)=>{line(pt(x,y,h-13),pt(x,y,h),'#a8bdc9',1);glow(pt(x,y,h),'#ff976c',1);};
  const tank=(x,y,r,h,color='#d5dce0')=>{const [a,b]=pt(x,y),g=c.createLinearGradient(a-r,0,a+r,0);g.addColorStop(0,'#465d6d');g.addColorStop(.3,color);g.addColorStop(.55,'#b7c9d1');g.addColorStop(1,'#3b5267');
   c.fillStyle=g;c.fillRect(a-r,b-h,r*2,h-3);c.fillStyle=color;c.beginPath();c.ellipse(a,b-h,r,r*.43,0,0,Math.PI*2);c.fill();
   for(const v of [7,h*.58,h-4]){c.strokeStyle=v===7?'#d2af62':'#7792a4';c.lineWidth=v===7?2:1;c.beginPath();c.ellipse(a,b-v,r,r*.43,0,0,Math.PI);c.stroke();}
   line([a-r+3,b-h+4],[a-r+3,b-7],'#edf1ea',1.2);line([a+2,b-h+7],[a+2,b-9],'#233c50',3);line([a+2,b-h+8],[a+2,b-12],'#72d9f1',1.5);
   fan(x,y,h+.6,r*.5);pipe([[x+.19,y,h-6],[x+.19,y,6],[x+.34,y,6]]);
  };
  const dish=(x,y,h)=>{const p=pt(x,y,h);line(pt(x,y,h-19),p,'#566f7d',3);line(pt(x,y,h-19),p,'#c5d4db',1);
   poly([[p[0]-12,p[1]-7],[p[0]+11,p[1]-3],[p[0]+6,p[1]+5],[p[0]-5,p[1]+4]],'#d0dce1','#819eae');
   for(const q of [[-12,-7],[11,-3],[6,5],[-5,4]])line(p,[p[0]+q[0],p[1]+q[1]],'#92acba',.7);
   line(p,[p[0]-2,p[1]-11],'#ebeee2');glow([p[0]-2,p[1]-11],'#84d7ef',.8);
  };
  const f=compact?[1,1]:types[type].footprint||[1,1],x=-.46,y=-.46,w=f[0]-.08,d=f[1]-.08;
  if(type==='road'){
   panel(-.5,-.5,1,1,0,'#596573','#84929b');panel(-.39,-.39,.78,.78,.1,'#475461','#677a87');
   for(const v of [-.36,.36]){line(pt(-.5,v,1),pt(.5,v,1),'#acbcc6',1.4);line(pt(v,-.5,1),pt(v,.5,1),'#9baeba',1.4);}
   for(const v of [-.25,.25]){line(pt(-.5,v,1),pt(.5,v,1),'#4c90ab',.7);line(pt(v,-.5,1),pt(v,.5,1),'#4c90ab',.7);}
   for(const [a,b] of [[-.4,-.4],[.4,.4]])glow(pt(a,b,1),'#98d5df',.7);return canvas;
  }
  // A short, faint contact shadow hugs the foundation instead of floating below it.
  poly([pt(x+.015,y+.045),pt(x+w+.045,y+.045),pt(x+w+.045,y+d+.065),pt(x+.015,y+d+.065)],'#25313b2e');box(x,y,w,d,3,'#718491',0);
  for(let i=0;i<f[0];i++)for(let j=0;j<f[1];j++)panel(i-.38,j-.38,.76,.76,3.1,'#657885','#8b9ca5');
  for(const [a,b] of [[x+.04,y+.04],[x+w-.04,y+.04],[x+.04,y+d-.04],[x+w-.04,y+d-.04]])glow(pt(a,b,5),'#f6ca77',.8);
  if(type==='hq'){
   // Legacy cramped cities and the enemy outpost retain their one-cell collision size.
   if(compact){box(-.34,-.33,.68,.66,30,'#c6d4da');box(-.24,-.24,.48,.48,43,'#889fb2');faceWindows(-.28,.34,4,26);fan(0,0,44,7);dish(-.1,-.13,59);}
   else{
    box(-.28,-.26,1.55,1.53,17,'#b1c1cc');
    box(-.17,-.2,1.29,1.25,42,'#c6d3dc');
    // Sloping glazed operations deck above the white armored lower wings.
    poly([pt(-.17,1.05,42),pt(1.12,1.05,42),pt(.91,.84,62),pt(.04,.84,62)],'#23648b','#d4e5ea');
    poly([pt(1.12,-.2,42),pt(1.12,1.05,42),pt(.91,.84,62),pt(.91,.01,62)],'#174769','#abc9d9');
    panel(.04,.01,.87,.83,62,'#9bb6c8','#e6eef0');
    for(let i=0;i<5;i++){const u=i/4;line(pt(-.17+u*1.29,1.06,42),pt(.04+u*.87,.84,62),'#92c9df',1);line(pt(1.13,-.2+u*1.25,42),pt(.91,.01+u*.83,62),'#6595b5',1);}
    for(const [a,b] of [[-.32,-.3],[1.04,-.3],[-.32,1.0],[1.04,1.0]]){box(a,b,.29,.32,39,'#d7dfe1');vent(a+.04,b+.04,.19,.20,40);faceWindows(a+.05,b+.33,2,29);}
    faceWindows(.03,1.06,7,35);faceWindows(-.07,1.07,3,23);
    box(.36,1.06,.46,.24,24,'#acbecb');poly([pt(.4,1.31,5),pt(.77,1.31,5),pt(.77,1.31,21),pt(.4,1.31,21)],'#122e43','#7b9fb8');faceWindows(.43,1.315,2,19);
    for(let k=0;k<3;k++)panel(.4,1.32+k*.04,.37,.04,5-k*1.3,'#b3c1c5');
    box(.19,.17,.57,.42,66,'#d0dce2',62);fan(.39,.37,67,7);dish(.56,.48,89);beacon(-.19,-.18,69);
    pipe([[-.34,.03,10],[-.34,.75,10],[-.34,.75,29]]);pipe([[1.36,.04,10],[1.36,.7,10],[1.12,.7,26]]);
   }
  }else if(type==='habitat'){
   if(level<2){
    // A single pressurized residential floor; the existing tower is the expanded variant.
    box(-.36,-.34,.72,.68,23,'#c7d5df');
    faceWindows(-.29,.345,4,18);
    for(let j=0;j<4;j++){const v=-.27+j*.14;
     poly([pt(.365,v,9),pt(.365,v+.10,9),pt(.365,v+.10,18),pt(.365,v,18)],'#19455f','#819faf');
     line(pt(.37,v,17),pt(.37,v+.10,17),'#81dcf2',1.1);
    }
    panel(-.29,-.27,.58,.54,23.5,'#879eae','#dde8e9');
    line(pt(-.30,.02,24),pt(.30,.02,24),'#c3d1d7',.8);
    box(-.22,-.21,.25,.24,27,'#a9bdca',23);fan(-.095,-.09,28,4);
    vent(.08,-.20,.15,.34,24.5);
    box(-.11,.34,.25,.09,16,'#d2dce0');
    poly([pt(-.075,.435,4),pt(.105,.435,4),pt(.105,.435,14),pt(-.075,.435,14)],'#16384d','#9dc4d0');
    line(pt(-.065,.438,13),pt(.095,.438,13),'#81eaff',1.4);
    panel(-.13,.43,.29,.05,3.6,'#adbcc4');
    pipe([[-.37,-.23,7],[-.37,.23,7],[-.24,.23,7]]);
    for(const v of [-.30,.29])glow(pt(v,.36,21),'#84d9f1',.7);
   }else{

   box(-.31,-.33,.62,.66,62,'#abbcca');for(const h of [14,29,44,57]){faceWindows(-.25,.34,4,h);line(pt(-.32,.34,h+2),pt(.32,.34,h+2),'#a5b4af');}box(-.17,-.19,.3,.3,69,'#9ab3c8',62);fan(-.02,-.04,70,6);beacon(-.26,-.26,76);for(const h of [15,30,45]){poly([pt(.321,-.24,h+5),pt(.321,.25,h+5),pt(.321,.25,h),pt(.321,-.24,h)],'#23465f','#738e9f');line(pt(.322,-.24,h+4),pt(.322,.25,h+4),'#63c9ed',1.4);for(let j=0;j<4;j++)line(pt(.322,-.24+j*.12,h),pt(.322,-.24+j*.12,h+5),'#90acba',.7);}box(-.15,.35,.30,.08,12,'#d8e1e0');
   }
  }else if(type==='solar'){
   for(const j of [-.24,.22]){box(j,-.32,.13,.68,9,'#778b96');const ps=[pt(j-.14,-.39,20),pt(j+.15,-.39,20),pt(j+.15,.4,11),pt(j-.14,.4,11)];poly(ps,'#173953','#b9d1df');for(let k=1;k<6;k++){const v=-.39+k*.79/6;line(pt(j-.14,v,20-k*1.5),pt(j+.15,v,20-k*1.5),'#83a8c3');}for(let k=1;k<3;k++)line(pt(j-.14+k*.29/3,-.39,20),pt(j-.14+k*.29/3,.4,11),'#577f9f',.6);}
  }else if(type==='battery'){
   for(const j of [-.25,0,.25]){box(j,-.32,.17,.64,18,'#b2a771');line(pt(j+.03,.33,14),pt(j+.12,.33,14),'#eddc78',3);}line(pt(-.35,-.36,6),pt(.35,-.36,6),'#e5bc69',2);for(const j of [-.25,0,.25])vent(j+.02,-.25,.12,.45,19);
  }else if(type==='reactor'){
   tank(0,0,17,42,'#cfd0b3');const p=pt(0,0,44);c.fillStyle='#eac37e';c.beginPath();c.arc(p[0],p[1],8,0,Math.PI*2);c.fill();c.fillStyle='#273c47';c.font='bold 13px sans-serif';c.fillText('ϟ',p[0]-4,p[1]+5);box(.23,-.25,.13,.5,19,'#c19f79');beacon(-.2,-.2,53);pipe([[-.3,.1,4],[-.3,.3,4],[.2,.3,4]]);
  }else if(type==='mine'){
   box(-.38,-.3,.36,.6,15,'#a69373');for(const dx of [-.08,.34])line(pt(dx,-.22),pt(.14,-.1,47),'#c8ad76',3);line(pt(.14,-.1,46),pt(.14,-.1,3),'#344c55',3);for(let h=12;h<44;h+=8)line(pt(-.06,-.2,h),pt(.29,-.2,h),'#d6b978');box(.02,.16,.38,.2,7,'#5d6b70');vent(-.34,-.25,.27,.4,16);for(let h=9;h<41;h+=6)line(pt(.08,-.1,h),pt(.2,-.1,h+3),'#bdc5b8',2);beacon(.14,-.1,55);
  }else if(type==='water'){
   tank(-.15,-.12,12,24,'#b8dae0');box(.11,-.2,.25,.6,16,'#6ba2b5');line(pt(-.14,.14,11),pt(.28,.34,11),'#93e3e8',4);vent(.15,-.15,.16,.32,17);beacon(.25,-.25,32);
  }else if(type==='oxygen'){
   for(const [a,b] of [[-.21,-.2],[.21,-.2],[0,.21]])tank(a,b,8,35,'#c8ded2');pipe([[-.3,.35,10],[.34,.35,10],[.34,-.2,10]]);
  }else if(type==='farm'){
   for(const j of [-.2,.23]){const p=pt(j,-.24,8),q=pt(j,.34,8);poly([[p[0]-8,p[1]],[p[0]-6,p[1]-15],[p[0]+4,p[1]-17],[p[0]+9,p[1]-4],[q[0]+9,q[1]-4],[q[0]+3,q[1]-17],[q[0]-6,q[1]-14],[q[0]-8,q[1]]],'#286b78','#c1dbe5');for(let k=0;k<4;k++){const r=pt(j,-.2+k*.16,20);line([r[0]-6,r[1]],[r[0]+5,r[1]-3],'#b4e7ed');const leaf=pt(j,-.2+k*.16,10);line([leaf[0]-4,leaf[1]],[leaf[0]+3,leaf[1]-2],'#8ed590',2);}}
  }else if(type==='warehouse'){
   box(-.4,-.33,.8,.66,21,'#9fa6a0');poly([pt(-.4,-.33,21),pt(0,-.33,33),pt(.4,-.33,21),pt(.4,.33,21),pt(0,.33,33),pt(-.4,.33,21)],'#a4b3b3','#d3d3b8');for(let k=0;k<4;k++)line(pt(-.3+k*.17,.335,3),pt(-.3+k*.17,.335,19),'#263c46',3);vent(-.24,-.2,.28,.33,31);pipe([[.33,-.3,4],[.33,.3,4],[.33,.3,18]]);
  }else if(type==='lab'){
   // A glazed research dome on a compact armored laboratory; its gameplay footprint stays 1x1.
   box(-.36,-.35,.72,.70,21,'#d3e0e5');
   for(const side of [-.33,.24])box(side,.16,.09,.18,28,'#e0e8e5',3);
   faceWindows(-.27,.355,4,18);for(let j=0;j<4;j++){const y=-.27+j*.14;poly([pt(.362,y,6),pt(.362,y+.105,6),pt(.362,y+.105,18),pt(.362,y,18)],'#174766','#7bcce9');line(pt(.365,y,15),pt(.365,y+.105,15),'#8deaff',.8);}
   const center=pt(-.025,-.015,29),cx=center[0],cy=center[1],r=20,dh=27;
   // Metallic support ring and continuous blue equipment band.
   c.fillStyle='#48667f';c.beginPath();c.ellipse(cx,cy+4,r+2,10,0,0,Math.PI*2);c.fill();
   c.strokeStyle='#88e8ff';c.lineWidth=2;c.beginPath();c.ellipse(cx,cy+2,r+1,9,0,0,Math.PI);c.stroke();
   const glass=c.createRadialGradient(cx-7,cy-18,2,cx,cy-9,29);glass.addColorStop(0,'#acdfff');glass.addColorStop(.34,'#387da8');glass.addColorStop(.73,'#123d6b');glass.addColorStop(1,'#0b294d');
   c.beginPath();c.moveTo(cx-r,cy);c.bezierCurveTo(cx-r-1,cy-dh*.65,cx-r*.55,cy-dh,cx,cy-dh);c.bezierCurveTo(cx+r*.55,cy-dh,cx+r+1,cy-dh*.65,cx+r,cy);c.ellipse(cx,cy,r,8,0,0,Math.PI);c.closePath();c.fillStyle=glass;c.fill();c.strokeStyle='#96d9f3';c.lineWidth=.8;c.stroke();
   // Latitudinal rings, ribs and triangular glazing.
   for(let k=1;k<=3;k++){const z=k/4,w=r*Math.sqrt(1-z*z);c.strokeStyle='#6aaad4';c.lineWidth=.55;c.beginPath();c.ellipse(cx,cy-dh*z,w,7*(1-z),0,0,Math.PI*2);c.stroke();}
   for(let k=-2;k<=2;k++){const end=cx+k*r*.42;c.beginPath();c.moveTo(cx,cy-dh);c.quadraticCurveTo(end,cy-dh*.6,end,cy+5*(1-Math.abs(k)/3));c.strokeStyle=k%2?'#6badd3':'#b5e8f5';c.lineWidth=.6;c.stroke();}
   for(let j=0;j<3;j++){const y=cy-5-j*6,w=16-j*3;line([cx-w,y],[cx+w*.35,y-6],'#75b9e366',.65);line([cx+w,y],[cx-w*.35,y-6],'#75b9e366',.65);}
   // Luminous atomic exhibit inside the glass, not a solid opaque dome.
   c.save();c.shadowColor='#38cfff';c.shadowBlur=7;c.strokeStyle='#73e5ff';c.lineWidth=.9;
   for(const rot of [0,Math.PI/3,-Math.PI/3]){c.beginPath();c.ellipse(cx,cy-10,8,3.2,rot,0,Math.PI*2);c.stroke();}
   c.fillStyle='#d3ffff';c.beginPath();c.arc(cx,cy-10,2,0,Math.PI*2);c.fill();c.restore();
   c.strokeStyle='#e0edf0';c.lineWidth=2.4;c.beginPath();c.ellipse(cx,cy+1,r+1,8.8,0,0,Math.PI);c.stroke();
   // Dome crown, telemetry mast, side satellite dish and roof service modules.
   const capY=cy-dh;c.fillStyle='#e4edf0';c.beginPath();c.ellipse(cx,capY,6,2.8,0,0,Math.PI*2);c.fill();line([cx,capY],[cx,capY-14],'#b9d7e9',2.5);line([cx+.5,capY-2],[cx+.5,capY-13],'#44d3ff',1);glow([cx,capY-15],'#95f1ff',1);
   box(.23,-.34,.15,.22,30,'#d4dee1');vent(.25,-.31,.10,.15,31);dish(.3,-.25,46);beacon(-.3,-.28,43);
   box(-.13,.36,.26,.075,12,'#c4e0e9');faceWindows(-.095,.44,2,10);pipe([[-.35,-.20,6],[-.35,.28,6],[-.35,.28,19]]);
  }else if(type==='clinic'){
   box(-.38,-.34,.76,.32,22,'#d0c4b1');box(-.15,-.12,.3,.5,22,'#d0c4b1');const p=pt(0,0,24);c.fillStyle='#d67465';c.fillRect(p[0]-7,p[1]-2,14,4);c.fillRect(p[0]-2,p[1]-7,4,14);faceWindows(-.34,-.02,5,17);vent(-.32,-.3,.2,.19,23);beacon(.27,-.26,32);
  }else if(type==='education'){
   box(-.36,-.35,.3,.73,31,'#a4bfae');box(-.03,.08,.42,.3,20,'#c9c6a9');faceWindows(-.31,.39,5,17);dish(-.19,-.2,46);vent(.03,.1,.25,.2,21);faceWindows(-.3,.39,2,29);
  }else if(type==='turret'){
   // Silver armor, capacitor columns and a raised trunnion-mounted accelerator.
   const cyan='#53dfff',ivory='#dce6eb',dark='#23394f';
   const prism=(radius,bottom,top,color)=>{
    const ring=Array.from({length:8},(_,i)=>{const a=(i+.5)*Math.PI/4;return [Math.cos(a)*radius,Math.sin(a)*radius];});
    for(let i=0;i<8;i++){const p=ring[i],q=ring[(i+1)%8];if((q[1]-p[1])-(q[0]-p[0])>0)poly([pt(...p,bottom),pt(...q,bottom),pt(...q,top),pt(...p,top)],i<3?'#9fb3c3':'#627d92','#253e53');}
    poly(ring.map(p=>pt(...p,top)),color,'#dae7ec');
   };
   // Flush plate and illuminated safety trim; the collision footprint remains one cell.
   panel(-.42,-.42,.84,.84,4,'#374d60','#c9d7de');
   for(const v of [-.41,.41]){line(pt(-.40,v,4.5),pt(.40,v,4.5),'#e4b463',1.2);line(pt(v,-.40,4.5),pt(v,.40,4.5),'#a7dbe7',1);}
   line(pt(-.33,.435,3),pt(.33,.435,3),cyan,1.6);line(pt(.435,-.33,3),pt(.435,.33,3),'#41b9ed',1.6);
   const brace=(a)=>{const dx=Math.cos(a),dy=Math.sin(a),nx=-dy*.055,ny=dx*.055;
    poly([pt(dx*.42+nx,dy*.42+ny,5),pt(dx*.42-nx,dy*.42-ny,5),pt(dx*.22-nx,dy*.22-ny,25),pt(dx*.22+nx,dy*.22+ny,25)],ivory,'#718d9e');
    line(pt(dx*.40,dy*.40,8),pt(dx*.25,dy*.25,22),'#58768b',2.2);glow(pt(dx*.40,dy*.40,7),cyan,.8);
   };
   brace(Math.PI*1.25);brace(Math.PI*1.75);
   prism(.31,4,8,'#bbcbd4');prism(.255,8,36,'#c7d5de');
   // Tall inset energy channels on the visible armored facets.
   for(const a of [-Math.PI/8,Math.PI/8,Math.PI*3/8,Math.PI*5/8]){
    const dx=Math.cos(a),dy=Math.sin(a),p=pt(dx*.263,dy*.263,0);
    line([p[0],p[1]-10],[p[0],p[1]-32],dark,5.5);
    line([p[0],p[1]-12],[p[0],p[1]-30],'#23799d',3.4);
    line([p[0],p[1]-13],[p[0],p[1]-29],cyan,1.5);
    glow([p[0],p[1]-29],cyan,.75);glow([p[0],p[1]-13],'#b6f6ff',.65);
    line([p[0]-3,p[1]-9],[p[0]+3,p[1]-9],'#dfb669',1.2);
   }
   for(const a of [0,Math.PI/4,Math.PI/2]){const p=pt(Math.cos(a)*.30,Math.sin(a)*.30,0);line([p[0],p[1]-9],[p[0],p[1]-34],ivory,3.5);line([p[0]+1.4,p[1]-12],[p[0]+1.4,p[1]-31],'#738ea1',.7);}
   // Side power cabinet, louvers, cabling and external support legs.
   box(-.41,-.01,.15,.26,22,'#cddbe2');vent(-.39,.02,.10,.17,23);
   for(let j=0;j<6;j++)line(pt(-.39,.257,7+j*1.7),pt(-.28,.257,7+j*1.7),'#223f55',.8);
   pipe([[-.29,.17,7],[-.17,.24,7],[-.17,.24,15]],'#6ea9c5');
   brace(Math.PI*.25);brace(Math.PI*.75);
   prism(.27,35,39,'#cbdbe3');const bearing=pt(0,0,40);
   c.strokeStyle='#22476b';c.lineWidth=4;c.beginPath();c.ellipse(...bearing,10,4.5,0,0,Math.PI*2);c.stroke();
   c.strokeStyle=cyan;c.lineWidth=1.6;c.beginPath();c.ellipse(...bearing,10,4.5,0,0,Math.PI);c.stroke();
   for(const v of [-.37,.37]){line(pt(v,.36,4),pt(v,.36,10),'#b4cad4',1.5);glow(pt(v,.36,10),cyan,.85);}
   // All gun geometry rotates together, rather than rotating a flat image.
   const angle=heading*Math.PI/4,ca=Math.cos(angle),sa=Math.sin(angle),faces=[];
   const world=(u,v,h)=>[u*ca-v*sa,u*sa+v*ca,h];
   const gp=(u,v,h)=>pt(...world(u,v,h));
   const face=(ps,color,edge='#445c70',emissive=false)=>{const points=ps.map(p=>world(...p));faces.push({points,color,edge,emissive,depth:points.reduce((n,p)=>n+p[0]+p[1]+p[2]/40,0)/points.length});};
   const gunbox=(u,v,w,d,h,high,color)=>{
    const lo=[[u,v,h],[u+w,v,h],[u+w,v+d,h],[u,v+d,h]],hi=lo.map(p=>[p[0],p[1],high]);
    for(let i=0;i<4;i++){const j=(i+1)%4,p=world(...lo[i]),q=world(...lo[j]);if((q[1]-p[1])-(q[0]-p[0])>0)face([lo[i],lo[j],hi[j],hi[i]],i%2?'#617a90':'#8aa3b6');}
    face(hi,color,'#c1d4df');
   };
   gunbox(-.18,-.16,.36,.32,40,47,'#344e66');
   for(const v of [-.22,.14])gunbox(-.16,v,.29,.08,42,52,ivory);
   const start=.02,end=1.10,baseHeight=u=>44+12*u;
   const ring=(u,r=.115,ry=3.2)=>Array.from({length:8},(_,i)=>[u,Math.cos((i+.5)*Math.PI/4)*r,baseHeight(u)+Math.sin((i+.5)*Math.PI/4)*ry]);
   const tube=(u0,u1,r,ry)=>{const back=ring(u0,r,ry),front=ring(u1,r,ry);for(let i=0;i<8;i++)face([back[i],back[(i+1)%8],front[(i+1)%8],front[i]],i%3?ivory:'#45647e','#658498');face(front,'#203e58','#dcecf0');};
   tube(start,end,.11,3.0);
   for(const u of [.13,.41,.77,.99])tube(u,u+.05,.14,4.1);
   // Exposed acceleration rails, gold identification bands and segmented white armor.
   for(const side of [-1,1]){
    const v=side*.114;
    face([[.24,v,baseHeight(.24)-1],[.91,v,baseHeight(.91)-1],[.91,v,baseHeight(.91)+1],[.24,v,baseHeight(.24)+1]],cyan,'#8beeff',true);
    for(const u of [.33,.61,.87])face([[u,side*.118,baseHeight(u)+1.7],[u+.025,side*.118,baseHeight(u+.025)+1.7],[u+.025,side*.118,baseHeight(u+.025)+2.6],[u,side*.118,baseHeight(u)+2.6]],'#deb66c','#deb66c');
   }
   for(const f of faces.sort((a,b)=>a.depth-b.depth)){if(f.emissive){c.shadowColor=cyan;c.shadowBlur=3;}poly(f.points.map(p=>pt(...p)),f.color,f.edge);c.shadowBlur=0;}
   // Trunnion cap is placed on the camera-facing side of the rotating housing.
   const side=ca-sa>=0?1:-1,cap=gp(-.025,side*.225,47);c.fillStyle='#244966';c.strokeStyle='#b7d4e1';c.lineWidth=1;c.beginPath();c.ellipse(...cap,4.4,5.4,0,0,Math.PI*2);c.fill();c.stroke();c.strokeStyle=cyan;c.beginPath();c.ellipse(...cap,2.5,3.3,0,0,Math.PI*2);c.stroke();glow(cap,cyan,.65);
   // The face and combat emitter share the same local muzzle anchor.
   const muzzle=root.ColonyWar?.turretMuzzle||{offset:1.10,height:57.2};
   const nose=ring(muzzle.offset+.008,.105,2.8);poly(nose.map(p=>gp(...p)),'#123452','#b9eaff');
   poly(ring(muzzle.offset+.012,.065,1.75).map(p=>gp(...p)),cyan,'#c9ffff');glow(gp(muzzle.offset,0,muzzle.height),cyan,1.2);
  }else if(type==='port'){
   const mid=pt(.6,.64,5);c.strokeStyle='#d8c78e';c.lineWidth=2;c.beginPath();c.ellipse(mid[0],mid[1],35,17,0,0,Math.PI*2);c.stroke();c.fillStyle='#d8c78e';c.font='bold 19px monospace';c.fillText('H',mid[0]-6,mid[1]+6);box(-.36,-.35,.4,.42,49,'#d2c7a2');faceWindows(-.33,.09,3,40);dish(-.17,-.18,67);beacon(-.3,-.28,74);for(let j=0;j<6;j++){panel(.13+j*.19,1.24,.09,.10,5,'#d8bc78');}line(pt(.22,-.35,5),pt(1.4,-.35,5),'#92dff3',2);for(const [a,b] of [[-.42,1.4],[1.4,-.42],[1.4,1.4]]){const p=pt(a,b,5);c.fillStyle='#f8d689';c.fillRect(p[0]-2,p[1]-2,4,4);}
  }else if(type==='factory'){
   box(-.35,-.35,1.7,1.32,38,'#8ea3aa');poly([pt(-.35,-.35,38),pt(.5,-.35,54),pt(1.35,-.35,38),pt(1.35,.97,38),pt(.5,.97,54),pt(-.35,.97,38)],'#a4b6b8','#c1c7b5');for(let j=0;j<3;j++){box(-.21+j*.53,.97,.4,.08,27,'#263e4c');faceWindows(-.2+j*.53,1.06,3,23);}box(1.0,-.3,.3,.35,62,'#b7c5d0');for(let j=0;j<3;j++){fan(.02+j*.42,-.1,47,6);vent(-.2+j*.5,.4,.3,.35,48);}pipe([[-.36,-.29,10],[-.36,.88,10],[-.36,.88,28]]);beacon(1.15,-.13,76);for(let j=0;j<3;j++)panel(-.21+j*.53,1.1,.40,.18,5,'#919f9f');
  }else if(type==='workshop'){
   box(-.36,-.36,1.68,.65,20,'#aaa184');for(let j=0;j<2;j++){poly([pt(-.2+j*.78,.31,0),pt(.34+j*.78,.31,0),pt(.34+j*.78,.31,18),pt(-.2+j*.78,.31,18)],'#223742');}line(pt(-.32,-.28,32),pt(1.25,-.28,32),'#e0ba72',3);line(pt(-.32,-.28),pt(-.32,-.28,32),'#d1b57a',3);line(pt(1.25,-.28),pt(1.25,-.28,32),'#d1b57a',3);for(let j=0;j<3;j++)vent(-.26+j*.5,-.2,.3,.3,21);line(pt(.5,-.28,32),pt(.5,-.28,24),'#253c4a',2);beacon(1.25,-.28,40);
  }
  return canvas;
 }
 // Eight heading variants, generated once and cached by the renderer. Geometry stays on the world grid.
 function vehicle(type,enemy=false,heading=0){
  const canvas=document.createElement('canvas');canvas.width=192;canvas.height=160;const c=canvas.getContext('2d');c.scale(2,2);c.lineJoin='round';
  const angle=heading*Math.PI/4,ca=Math.cos(angle),sa=Math.sin(angle),faces=[];
  const world=p=>[p[0]*ca-p[1]*sa,p[0]*sa+p[1]*ca,p[2]];
  const screen=p=>[48+(p[0]-p[1])*32,55+(p[0]+p[1])*16-p[2]];
  const face=(ps,color,edge='#25394a')=>{const vs=ps.map(world);faces.push({vs,color,edge,depth:vs.reduce((n,p)=>n+p[0]+p[1]+p[2]/24,0)/vs.length});};
  const shade=(hex,k)=>'#'+[1,3,5].map(i=>Math.round(parseInt(hex.slice(i,i+2),16)*k).toString(16).padStart(2,'0')).join('');
  const cube=(x,y,w,d,b,h,color='#b7c9d5')=>{
   const corners=[[x,y,b],[x+w,y,b],[x+w,y+d,b],[x,y+d,b]],top=corners.map(p=>[p[0],p[1],h]);
   for(let i=0;i<4;i++){const j=(i+1)%4,a=world(corners[i]),v=world(corners[j]);if((v[1]-a[1])-(v[0]-a[0])>0)face([corners[i],corners[j],top[j],top[i]],shade(color,i%2?.49:.70));}
   face(top,color,shade(color,.75));
  };
  const light=enemy?'#ff9b72':'#71e6ff',armor=enemy?'#9b9c7d':'#d2dce1';
  c.fillStyle='#0b172a80';c.beginPath();c.ellipse(51,58,26,11,0,0,Math.PI*2);c.fill();
  // Eight-sided metal-mesh wheels, separate axles and dark tire sidewalls.
  const wheel=(x,y)=>{
   const ring=(v,r,h)=>Array.from({length:8},(_,i)=>[x+Math.cos(i*Math.PI/4)*r,v,5+Math.sin(i*Math.PI/4)*h]);
   const a=ring(y-.07,.087,4.4),b=ring(y+.07,.087,4.4);
   for(let i=0;i<8;i++){const j=(i+1)%8;face([a[i],a[j],b[j],b[i]],i%2?'#263440':'#425261','#14222b');}
   for(const side of [-1,1]){const v=y+side*.072;face(ring(v,.078,4),'#253746','#67818e');face(ring(v+side*.002,.036,2),'#a3b6bd','#344d5e');}
  };
  const rows=type==='scout'?3:4;
  for(const side of [-1,1])for(let i=0;i<rows;i++){
   const x=-.34+i*.68/(rows-1),y=side*.31;
   wheel(x,y);cube(x-.026,Math.min(y,0),.052,Math.abs(y),5,7,'#728796');
  }
  cube(-.37,-.24,.75,.48,5,12,armor);cube(-.30,-.19,.62,.38,12,16,armor);
  // Nose glazing and armored side skirts; +X is the vehicle's forward direction.
  cube(.16,-.15,.15,.30,16,20,enemy?'#626547':'#769bac');
  face([[.32,-.14,16],[.32,.14,16],[.24,.14,21],[.24,-.14,21]],'#174967','#9adcee');
  for(const side of [-1,1]){cube(-.26,side*.23-.025,.48,.05,9,14,armor);cube(.29,side*.16-.03,.065,.06,13,15,light);cube(-.35,side*.17-.025,.045,.05,12,14,'#edab62');}
  for(let j=0;j<4;j++)cube(-.29+j*.056,-.13,.024,.26,16,17,'#3b5368');
  if(type==='scout'){
   cube(-.08,-.035,.04,.07,16,31,'#a8c3ce');
   face([[-.28,-.13,32],[.10,-.13,32],[.08,.16,29],[-.26,.16,29]],'#d9e1e3','#7fa5bb');
   face([[-.26,-.11,32.2],[.08,-.11,32.2],[-.08,.025,33.5]],'#81b5c9');cube(-.30,.13,.02,.02,17,35,light);
  }else if(type==='rocket'){
   cube(-.18,-.18,.33,.36,16,20,'#526d82');
   for(let j=0;j<3;j++){const y=-.19+j*.14;cube(-.31,y,.51,.105,22,28,armor);cube(.20,y,.03,.105,22,28,'#243c4e');face([[.235,y+.02,23],[.235,y+.08,23],[.235,y+.08,27],[.235,y+.02,27]],'#151f29');cube(-.23,y+.015,.055,.075,28,29,light);}
  }else{
   cube(-.16,-.17,.33,.34,16,23,armor);cube(-.08,-.11,.18,.22,23,25,'#9aafbd');
   cube(.10,-.045,.45,.09,21,25,'#c6d2d9');cube(.49,-.064,.10,.128,20,26,'#536c7e');cube(.592,-.04,.008,.08,22,24,light);
   cube(-.15,.13,.015,.015,23,36,'#9ab6c1');
  }
  faces.sort((a,b)=>a.depth-b.depth);for(const f of faces){c.beginPath();f.vs.map(screen).forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.fillStyle=f.color;c.fill();c.strokeStyle=f.edge;c.lineWidth=.45;c.stroke();}
  return canvas;
 }
 root.ColonyArt={building,vehicle};
})(window);
