/* Procedural art for the rover. All textures are generated locally; no network assets. */
window.RoverArt = (() => {
  'use strict';
  const fract = n => n - Math.floor(n);
  const rand = (x, y) => fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453);
  const textures = {};
  function texture(kind) {
    if (textures[kind]) return textures[kind];
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const ctx = c.getContext('2d');
    const image = ctx.createImageData(128, 128);
    for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
      const coarse = rand(Math.floor(x / 16), Math.floor(y / 16));
      const medium = rand(Math.floor(x / 4) + 31, Math.floor(y / 4) + 17);
      const fine = rand(x + 19, y + 37);
      let v = kind === 'rock' ? 163 + coarse * 38 + medium * 34 + fine * 18 : 216 + coarse * 15 + medium * 15 + fine * 9;
      if (kind === 'rock' && fine < 0.055) v -= 42;
      const i = (y * 128 + x) * 4;
      image.data[i] = v; image.data[i + 1] = v * .983; image.data[i + 2] = v * .95; image.data[i + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    textures[kind] = t;
    return t;
  }
  function glowTexture() {
    if (textures.glow) return textures.glow;
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const ctx = c.getContext('2d'), g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.12, 'rgba(255,255,255,.7)');
    g.addColorStop(.35, 'rgba(255,255,255,.14)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
    return textures.glow = new THREE.CanvasTexture(c);
  }
  function glow(parent, color, x, y, z, size, opacity) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture(),color,transparent:true,opacity,
      blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));
    s.position.set(x,y,z); s.scale.set(size,size,1); parent.add(s); return s;
  }
  // Merge fixed model parts by material, keeping lights and animated wheels independent.
  function batch(group) {
    group.updateMatrixWorld(true);
    const groups = new Map(), remove = [];
    const inv = new THREE.Matrix4().copy(group.matrixWorld).invert();
    group.traverse(o => {
      if (!o.isMesh || o.isInstancedMesh || Array.isArray(o.material)) return;
      const key = o.material.uuid;
      if (!groups.has(key)) groups.set(key, {material:o.material,p:[],n:[],uv:[]});
      const out = groups.get(key), geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      geo.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld));
      for (const [name,dest] of [['position',out.p],['normal',out.n],['uv',out.uv]]) {
        const attr=geo.getAttribute(name); if(attr) for(let i=0;i<attr.array.length;i++) dest.push(attr.array[i]);
      }
      geo.dispose(); remove.push(o);
    });
    remove.forEach(o=>o.parent.remove(o));
    groups.forEach(o=>{
      const geo=new THREE.BufferGeometry();
      geo.setAttribute('position',new THREE.Float32BufferAttribute(o.p,3));
      geo.setAttribute('normal',new THREE.Float32BufferAttribute(o.n,3));
      geo.setAttribute('uv',new THREE.Float32BufferAttribute(o.uv,2));
      const m=new THREE.Mesh(geo,o.material);m.castShadow=m.receiveShadow=true;group.add(m);
    });
  }
  function terrain(height, colorAt, cell, grid) {
    const half=cell*grid/2, heights=new Float32Array(grid*grid);
    for(let z=0;z<grid;z++)for(let x=0;x<grid;x++)heights[z*grid+x]=height((x+.5)*cell-half,(z+.5)*cell-half);
    const get=(x,z)=>x<0||z<0||x>=grid||z>=grid ? -7 : heights[z*grid+x];
    const pos=[],norm=[],uv=[],colors=[],idx=[];
    const c=new THREE.Color();
    function quad(points,normal,color,shade,vertical) {
      const start=pos.length/3;
      for(let i=0;i<4;i++){
        const p=points[i];pos.push(...p);norm.push(...normal);
        uv.push((normal[0] ? p[2] : p[0])*1.4,(vertical?p[1]:p[2])*1.4);
        const ao=vertical&&i<2 ? shade*.77 : shade;
        colors.push(color.r*ao,color.g*ao,color.b*ao);
      }
      idx.push(start,start+1,start+2,start,start+2,start+3);
    }
    for(let z=0;z<grid;z++)for(let x=0;x<grid;x++){
      const x0=x*cell-half,x1=x0+cell,z0=z*cell-half,z1=z0+cell,h=get(x,z);
      const neighbors=[get(x-1,z),get(x+1,z),get(x,z-1),get(x,z+1)];
      c.setHex(colorAt(x0+cell/2,z0+cell/2,h));
      const ao=1-Math.min(.23,neighbors.reduce((a,n)=>a+Math.max(0,n-h)*.12,0));
      quad([[x0,h,z1],[x1,h,z1],[x1,h,z0],[x0,h,z0]],[0,1,0],c,ao,false);
      if(neighbors[0]<h)quad([[x0,neighbors[0],z0],[x0,neighbors[0],z1],[x0,h,z1],[x0,h,z0]],[-1,0,0],c,.86,true);
      if(neighbors[1]<h)quad([[x1,neighbors[1],z1],[x1,neighbors[1],z0],[x1,h,z0],[x1,h,z1]],[1,0,0],c,.94,true);
      if(neighbors[2]<h)quad([[x1,neighbors[2],z0],[x0,neighbors[2],z0],[x0,h,z0],[x1,h,z0]],[0,0,-1],c,.88,true);
      if(neighbors[3]<h)quad([[x0,neighbors[3],z1],[x1,neighbors[3],z1],[x1,h,z1],[x0,h,z1]],[0,0,1],c,.94,true);
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
    geo.setAttribute('normal',new THREE.Float32BufferAttribute(norm,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
    geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setIndex(idx);geo.computeBoundingSphere();
    const material=new THREE.MeshStandardMaterial({map:texture('rock'),bumpMap:texture('rock'),bumpScale:.055,vertexColors:true,roughness:1,metalness:0});
    const mesh=new THREE.Mesh(geo,material);mesh.receiveShadow=mesh.castShadow=true;return mesh;
  }
  function sky() {
    const root=new THREE.Group(), pos=[], colors=[], sizes=[];
    for(let i=0;i<6000;i++){
      const y=rand(i,1)*2-1,a=rand(i,2)*Math.PI*2,r=Math.sqrt(Math.max(0,1-y*y));
      pos.push(Math.cos(a)*r*240,y*240,Math.sin(a)*r*240);
      const bright=rand(i,8);colors.push(.55+bright*.45,.7+bright*.3,1);sizes.push(bright>.98?5.5:bright>.78?2.8:1.5);
    }
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
    geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geo.setAttribute('size',new THREE.Float32BufferAttribute(sizes,1));
    const mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,vertexColors:true,
      vertexShader:'attribute float size; varying vec3 vColor; void main(){vColor=color;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_PointSize=size;}',
      fragmentShader:'varying vec3 vColor; void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.23,.09,d)+exp(-d*9.)*.5;gl_FragColor=vec4(vColor,clamp(a,0.,1.));}' });
    root.add(new THREE.Points(geo,mat));return root;
  }
  function earth() {
    const root=new THREE.Group(), vox=[];
    const continents=[
      [[-168,68],[-130,72],[-110,55],[-78,50],[-53,48],[-80,23],[-98,16],[-117,31],[-128,49]],
      [[-82,12],[-61,9],[-36,-6],[-47,-24],[-68,-56],[-77,-22]],
      [[-17,36],[10,38],[34,28],[49,10],[34,-31],[18,-35],[7,-5],[-17,12]],
      [[-10,36],[-9,60],[28,72],[63,68],[96,78],[178,63],[144,40],[120,18],[104,0],[76,7],[43,30]],
      [[112,-12],[139,-10],[153,-28],[133,-39],[113,-29]],
      [[-53,58],[-22,62],[-26,82],[-57,80]]];
    function inside(x,y,p){let yes=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;}
    const r=21;
    for(let x=-r;x<=r;x++)for(let y=-r;y<=r;y++)for(let z=-r;z<=r;z++){
      const len=Math.hypot(x,y,z);if(len>r||len<r-1.18)continue;
      const lat=Math.asin(y/len)*180/Math.PI,lon=Math.atan2(z,x)*180/Math.PI;
      const land=continents.some(p=>inside(lon,lat,p)),n=rand(x+y*7,z+15);
      const cloud=Math.sin(lon*.09+Math.sin(lat*.15)*2)+Math.cos(lat*.21-lon*.033)+n*.8;
      let color=land?(n>.65?0xa2a579:n>.25?0x598565:0x305943):(n>.65?0x2584b8:n>.25?0x176596:0x124979);
      if(Math.abs(lat)>72||cloud>1.65)color=n>.5?0xf1f4df:0xb5d4dd;
      vox.push([x,y,z,color]);
    }
    const mesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1.06,1.06,1.06),new THREE.MeshStandardMaterial({roughness:1,metalness:0,emissive:0x143556,emissiveIntensity:.2,fog:false}),vox.length);
    const d=new THREE.Object3D(),c=new THREE.Color();
    vox.forEach((v,i)=>{d.position.set(v[0],v[1],v[2]);d.updateMatrix();mesh.setMatrixAt(i,d.matrix);mesh.setColorAt(i,c.setHex(v[3]));});
    root.add(mesh);root.rotation.y=.5;root.rotation.z=.17;
    const atm=new THREE.Mesh(new THREE.SphereGeometry(21.9,48,32),new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.BackSide,
      uniforms:{},vertexShader:'varying vec3 n;varying vec3 v;void main(){vec4 p=modelViewMatrix*vec4(position,1.);n=normalize(normalMatrix*normal);v=normalize(-p.xyz);gl_Position=projectionMatrix*p;}',
      fragmentShader:'varying vec3 n;varying vec3 v;void main(){float rim=pow(1.-abs(dot(normalize(n),normalize(v))),3.);gl_FragColor=vec4(.16,.52,1.,rim*.3);}' }));
    root.add(atm);return root;
  }
  function crystal() {
    const geo=new THREE.CylinderGeometry(.16,.24,1,5,1,false);
    const tip=new THREE.ConeGeometry(.16,.4,5);
    tip.translate(0,.7,0);
    const root=new THREE.Group();
    for(let i=0;i<9;i++){
      const p=new THREE.Group(),scale=i===0?1.8:.55+rand(i,7)*.9;
      const m=new THREE.MeshStandardMaterial({color:i%2?0x4dd9f4:0x12a7d2,map:texture('panel'),emissive:0x087399,emissiveIntensity:.38,roughness:.22,metalness:.25,flatShading:true});
      p.add(new THREE.Mesh(geo,m),new THREE.Mesh(tip,m));
      p.scale.set(.75,scale,.75);p.position.set(i?Math.cos(i*2.4)*.45:0,scale*.5,i?Math.sin(i*2.4)*.45:0);
      p.rotation.z=i?Math.cos(i*2.4)*-.36:0;p.rotation.x=i?Math.sin(i*2.4)*.36:0;root.add(p);
    }
    batch(root);return root;
  }
  return {texture,glow,batch,terrain,sky,earth,crystal};
})();
