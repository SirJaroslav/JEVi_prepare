/* JEVi visual / The feeling remains. Three.js r180, bundled locally. */
const roots = document.querySelectorAll('[data-jv-story]:not([data-jv-initialized])');
for (const root of roots) {
  root.dataset.jvInitialized = 'true';
  const button = root.querySelector('.jv-motion');
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let dispose = null;
  let revision = 0;
  let limited = preference.matches;
  async function activate() {
    const current = ++revision;
    if (dispose) { dispose(); dispose = null; }
    root.classList.remove('jv-ready');
    root.querySelectorAll('article').forEach(a => { a.removeAttribute('style'); a.removeAttribute('aria-hidden'); a.inert = false; });
    button.hidden = false;
    button.textContent = limited ? 'Zapnout pohyb' : 'Omezit pohyb';
    button.setAttribute('aria-pressed', String(limited));
    if (limited) return;
    try {
      const THREE = await import('./vendor/three.module.min.js');
      if (current !== revision) return;
      dispose = buildScene(root, THREE);
    } catch (error) {
      root.classList.remove('jv-ready');
      root.querySelector('.jv-world').replaceChildren();
      root.querySelectorAll('article').forEach(a => { a.removeAttribute('style'); a.removeAttribute('aria-hidden'); a.inert = false; });
      button.hidden = true;
      console.warn('JEVi: 3D není dostupné. Zobrazuji čitelnou verzi.', error);
    }
  }
  button.addEventListener('click', () => {
    const top = root.getBoundingClientRect().top + scrollY;
    const within = root.getBoundingClientRect().top <= 0 && root.getBoundingClientRect().bottom > 0;
    limited = !limited;
    activate();
    if (within) window.scrollTo({ top, behavior: 'instant' });
  });
  preference.addEventListener('change', e => { limited = e.matches; activate(); });
  activate();
}

function buildScene(root, T) {
  const stage = root.querySelector('.jv-stage');
  const host = root.querySelector('.jv-world');
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 700 ? 1.4 : 1.75));
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  renderer.shadowMap.enabled = innerWidth >= 700;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  host.append(renderer.domElement);
  const scene = new T.Scene();
  scene.background = new T.Color(0x666c6c);
  scene.fog = new T.FogExp2(0x666c6c, .027);
  const camera = new T.PerspectiveCamera(53, 1, .055, 180);
  scene.add(new T.HemisphereLight(0xdce0e0, 0x292b2b, 2));
  const moon = new T.DirectionalLight(0xe5e5e5, 2.5);
  moon.position.set(-20, 28, -12);
  moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048);
  Object.assign(moon.shadow.camera, { left: -32, right: 32, top: 35, bottom: -35, far: 100 });
  moon.shadow.bias = -.0008;
  moon.target.position.set(3, 0, -10);
  scene.add(moon, moon.target);
  const V = (x,y,z) => new T.Vector3(x,y,z);
  let seed = 42191;
  const rnd = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
  const materials = [];
  const mat = (color, options={}) => { const m = new T.MeshStandardMaterial({ color, roughness: .9, ...options }); materials.push(m); return m; };
  const wood = mat(0x555754), darkwood = mat(0x282b29), trim = mat(0x949691), bark = mat(0x31332f), iron = mat(0x363b3b, {metalness:.65,roughness:.5});
  const glass = mat(0x171e20, {metalness:.7,roughness:.2}), tire = mat(0x181b1b), chrome = mat(0x929899, {metalness:.9,roughness:.35});
  const groundMat = mat(0x414640);
  const textures=[];
  // Procedural timber grain: no remote imagery, fonts or asset requests.
  const texCanvas=document.createElement('canvas');texCanvas.width=256;texCanvas.height=256;
  const ctx=texCanvas.getContext('2d');ctx.fillStyle='#999';ctx.fillRect(0,0,256,256);
  for(let i=0;i<1600;i++){const v=65+rnd()*110;ctx.strokeStyle=`rgba(${v},${v},${v},${.08+rnd()*.2})`;ctx.beginPath();const y=rnd()*256;ctx.moveTo(rnd()*256,y);ctx.lineTo(rnd()*256,y+rnd()*2);ctx.stroke();}
  const woodTexture=new T.CanvasTexture(texCanvas);woodTexture.colorSpace=T.SRGBColorSpace;textures.push(woodTexture);wood.map=woodTexture;
  function mesh(g,m,parent=scene,x=0,y=0,z=0){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  const box=(w,h,d,m,p=scene,x=0,y=0,z=0)=>mesh(new T.BoxGeometry(w,h,d),m,p,x,y,z);
  function beam(a,b,r,m,parent=scene,r2=r){const delta=b.clone().sub(a);const o=mesh(new T.CylinderGeometry(r2,r,delta.length(),8),m,parent);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(V(0,1,0),delta.normalize());return o;}
  const ground=mesh(new T.PlaneGeometry(220,220),groundMat);ground.rotation.x=-Math.PI/2;ground.castShadow=false;
  // Old dirt track winding between the landmarks.
  const track=new T.CatmullRomCurve3([V(0,.012,20),V(-3,.012,4),V(-2,.012,-5),V(5,.012,-10),V(12,.012,-12),V(12,.012,-17)]);
  const roadMat=mat(0x555853);
  for(let i=0;i<90;i++){const p=track.getPoint(i/89);const o=mesh(new T.CircleGeometry(.9+rnd()*.45,10),roadMat,scene,p.x,.015,p.z);o.rotation.x=-Math.PI/2;o.castShadow=false;}
  // Grass removed. Retain the old random sequence so the existing trees do not change.
  seed=innerWidth<700?3197197733:1880911171;
  // Large crooked tree on the left. Recursive branches with dense leaf clusters.
  const tree=new T.Group();tree.position.set(-7,0,-3);scene.add(tree);
  const leafmat=mat(0x3f4540,{flatShading:true});
  const leafGeometry=new T.IcosahedronGeometry(1,1);
  function branch(a,dir,length,radius,depth){const end=a.clone().addScaledVector(dir,length);beam(a,end,radius,bark,tree,radius*.62);
    if(depth===0){for(let j=0;j<3;j++){const leaf=mesh(leafGeometry,leafmat,tree,end.x+(rnd()-.5)*1.7,end.y+(rnd()-.5),end.z+(rnd()-.5)*1.7);leaf.scale.set(1.1+rnd(),.55+rnd()*.65,.9+rnd());}return;}
    const count=depth===3?3:2;
    for(let j=0;j<count;j++){const direction=dir.clone().add(V((rnd()-.5)*1.9,.1+rnd()*.25,(rnd()-.5)*1.9)).normalize();branch(end,direction,length*(.62+rnd()*.15),radius*.59,depth-1);}
  }
  branch(V(0,0,0),V(.08,1,.02).normalize(),3.7,.55,3);
  beam(V(.1,3.8,0),V(3.5,4.4,.1),.22,bark,tree,.11);
  const swing=new T.Group();swing.position.set(2.35,4.25,.1);tree.add(swing);
  beam(V(-.47,0,0),V(-.47,-3.45,0),.016,trim,swing);beam(V(.47,0,0),V(.47,-3.45,0),.016,trim,swing);
  box(1.14,.11,.42,darkwood,swing,0,-3.45,0);
  // Abandoned 1970s-inspired sedan: low roof, long hood, inset wheels, open arches.
  const car=new T.Group();car.position.set(2.2,.015,-10);car.rotation.set(0,-.3,-.018);scene.add(car);
  const paint=mat(0x646969,{metalness:.25,roughness:.96});
  const fadedPaint=mat(0x4b5050,{metalness:.2,roughness:1});
  const corrosion=mat(0x292c2b,{metalness:.08,roughness:1});
  const dullMetal=mat(0x666b6b,{metalness:.55,roughness:.78});
  const deadGlass=mat(0x202626,{metalness:.25,roughness:.53,side:T.DoubleSide});
  // Grayscale mottled paint, generated once and reused across panels.
  const paintCanvas=document.createElement('canvas');paintCanvas.width=512;paintCanvas.height=256;
  const paintCtx=paintCanvas.getContext('2d');paintCtx.fillStyle='#a0a0a0';paintCtx.fillRect(0,0,512,256);
  const savedPaintSeed=seed;seed=70707;
  for(let i=0;i<3200;i++){
    const shade=Math.floor(45+rnd()*100);paintCtx.fillStyle=`rgba(${shade},${shade},${shade},${.04+rnd()*.23})`;
    paintCtx.fillRect(rnd()*512,rnd()*256,2+rnd()*21,1+rnd()*6);
  }
  seed=savedPaintSeed;
  const paintTexture=new T.CanvasTexture(paintCanvas);paintTexture.colorSpace=T.SRGBColorSpace;textures.push(paintTexture);paint.map=paintTexture;fadedPaint.map=paintTexture;
  function ellipsoid(w,h,d,m,p,x,y,z){const o=mesh(new T.SphereGeometry(1,20,12),m,p,x,y,z);o.scale.set(w,h,d);return o;}
  function quad(points,m,parent=car){
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points.flat(),3));
    g.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,1,1,0,1],2));g.setIndex([0,1,2,0,2,3]);g.computeVertexNormals();
    const o=mesh(g,m,parent);return o;
  }
  function slab(zBack,zFront,yBack,yFront,width,m){
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([
      -width,.5,zBack,width,.5,zBack,width,.5,zFront,-width,.5,zFront,
      -width,yBack,zBack,width,yBack,zBack,width,yFront,zFront,-width,yFront,zFront
    ],3));g.setIndex([4,7,6,4,6,5,3,2,6,3,6,7,0,4,5,0,5,1,0,3,7,0,7,4,1,5,6,1,6,2,0,1,2,0,2,3]);g.computeVertexNormals();
    // Use nonindexed faces for the deliberately hard panel edges and texture mapping.
    const flat=g.toNonIndexed();g.dispose();flat.computeVertexNormals();const uv=[];const pos=flat.attributes.position;
    for(let i=0;i<pos.count;i++)uv.push((pos.getX(i)+width)/(width*2),(pos.getZ(i)-zBack)/(zFront-zBack));flat.setAttribute('uv',new T.Float32BufferAttribute(uv,2));return mesh(flat,m,car);
  }
  box(1.52,.26,4.45,corrosion,car,0,.46,0);
  slab(.98,2.38,1.03,.88,.92,paint); // low, long hood
  slab(-2.35,-1.22,.85,1.01,.92,fadedPaint);
  box(1.76,.42,2.12,paint,car,0,.79,-.1);
  // Sheet-metal side profiles with real circular cut-outs instead of bulbous fenders.
  for(const side of [-1,1]){
    const shape=new T.Shape();shape.moveTo(-2.38,.35);shape.lineTo(-2.38,.86);shape.lineTo(-1.26,1.04);shape.lineTo(.98,1.04);shape.lineTo(2.4,.89);shape.lineTo(2.4,.35);
    for(const center of [1.48,-1.48]){
      shape.lineTo(center+.53,.35);
      for(let i=0;i<=24;i++){const angle=i/24*Math.PI;shape.lineTo(center+Math.cos(angle)*.53,.35+Math.sin(angle)*.53);}
    }
    shape.lineTo(-2.38,.35);
    const g=new T.ExtrudeGeometry(shape,{depth:.055,bevelEnabled:false,steps:1});
    // Shape X is the length of the vehicle, extrusion Z becomes lateral width.
    const panel=mesh(g,paint,car,side*.925,0,0);panel.rotation.y=-Math.PI/2;
    // Lower corroded door sills and narrow door shut-lines.
    box(.065,.065,1.76,corrosion,car,side*.963,.38,0);
    for(const z of [-1.0,-.15,.91])box(.008,.39,.014,corrosion,car,side*.985,.77,z);
    box(.015,.028,.2,dullMetal,car,side*.989,.94,-.3);
    box(.015,.028,.2,dullMetal,car,side*.989,.94,.72);
    // Cabin glazing follows the trapezoidal roof; separate panes and thin pillars.
    const lowerX=side*.9,upperX=side*.735;
    quad([[lowerX,1.055,.99],[upperX,1.57,.47],[upperX,1.57,-.08],[lowerX,1.055,-.08]],deadGlass);
    quad([[lowerX,1.055,-.16],[upperX,1.57,-.16],[upperX,1.57,-.83],[lowerX,1.055,-1.18]],deadGlass);
    for(const ends of [ [[lowerX,1.03,1.02],[upperX,1.6,.48]], [[lowerX,1.03,-.12],[upperX,1.6,-.12]], [[lowerX,1.03,-1.23],[upperX,1.6,-.86]] ])beam(V(...ends[0]),V(...ends[1]),.035,paint,car);
    beam(V(lowerX,1.04,-1.22),V(lowerX,1.04,1.02),.024,dullMetal,car);
    for(const z of [-1.48,1.48]){
      const flat=side===1&&z===1.48;
      const wheel=mesh(new T.CylinderGeometry(.395,.395,.21,32),tire,car,side*.9,flat?.315:.38,z);wheel.rotation.z=Math.PI/2;
      // Cylinder local X maps to height after rotation: compress that axis for a flat tire.
      if(flat)wheel.scale.x=.8;
      const rim=mesh(new T.CylinderGeometry(.225,.225,.225,24),corrosion,car,side*.925,flat?.315:.38,z);rim.rotation.z=Math.PI/2;
      const hub=mesh(new T.CylinderGeometry(.09,.09,.23,16),dullMetal,car,side*.93,flat?.315:.38,z);hub.rotation.z=Math.PI/2;
      for(let i=0;i<5;i++){const a=i/5*Math.PI*2;const bolt=mesh(new T.CylinderGeometry(.018,.018,.238,6),dullMetal,car,side*.93,(flat?.315:.38)+Math.sin(a)*.135,z+Math.cos(a)*.135);bolt.rotation.z=Math.PI/2;}
    }
  }
  const roof=box(1.5,.065,1.4,fadedPaint,car,0,1.62,-.2);roof.rotation.z=.012;
  quad([[-.9,1.055,1.02],[.9,1.055,1.02],[.735,1.585,.5],[-.735,1.585,.5]],deadGlass);
  quad([[.9,1.055,-1.24],[-.9,1.055,-1.24],[-.735,1.585,-.87],[.735,1.585,-.87]],deadGlass);
  box(1.57,.08,.045,dullMetal,car,0,1.03,1.05);
  // A small branching windshield crack lies on the sloping glass.
  const glassPoint=(x,y)=>V(x,y,1.02-(y-1.055)*(.52/.53)+.01);
  for(const points of [[[.31,1.31],[.12,1.43]],[[.31,1.31],[.44,1.52]],[[.31,1.31],[.57,1.2]],[[.31,1.31],[.08,1.12]]])beam(glassPoint(...points[0]),glassPoint(...points[1]),.0045,dullMetal,car);
  // Recessed grille, one empty headlight housing and a sagging bumper.
  box(1.02,.23,.045,corrosion,car,0,.7,2.405);
  for(let i=0;i<4;i++)box(.95,.015,.052,dullMetal,car,0,.61+i*.06,2.42);
  for(const side of [-1,1]){
    box(.43,.23,.07,corrosion,car,side*.72,.71,2.405);
    if(side===-1)box(.34,.17,.035,mat(0x747979,{roughness:.8}),car,side*.72,.71,2.447);
    else{box(.03,.18,.016,dullMetal,car,side*.72,.71,2.446).rotation.z=.35;}
    box(.36,.16,.05,corrosion,car,side*.7,.7,-2.39);
  }
  const bumper=box(2.01,.105,.16,dullMetal,car,.025,.41,2.49);bumper.rotation.z=-.055;bumper.rotation.y=.018;
  box(1.99,.1,.14,dullMetal,car,0,.42,-2.44);
  box(.4,.13,.03,corrosion,car,.1,.52,2.47);
  // Small irregular bare-metal scars around the sill and front wing.
  for(const side of [-1,1])for(let i=0;i<9;i++){
    const scar=mesh(new T.CircleGeometry(.025+(i%3)*.012,5),corrosion,car,side*.988,.45+(i%3)*.08,-.8+i*.19);
    scar.rotation.y=side*Math.PI/2;scar.scale.set(1.9,.55,1);
  }
  // Timber house, porch and real open doorway. Front points toward +Z.
  const house=new T.Group();house.position.set(12,0,-21);scene.add(house);
  box(8,.35,7.5,darkwood,house,0,.16,0);
  box(8,.16,3.4,wood,house,0,.48,5.25);
  for(let i=0;i<4;i++)box(2.8,.12,.48,wood,house,0,.08+i*.1,7.55-i*.43);
  // Side walls and back wall; front planks stop at the doorway and windows.
  for(let i=0;i<25;i++){
    const y=.55+i*.15;
    box(.16,.14,7.5,wood,house,-4,y,0);box(.16,.14,7.5,wood,house,4,y,0);box(8,.14,.16,wood,house,0,y,-3.75);
    if(y<3.15){box(2.96,.14,.16,wood,house,-2.52,y,3.75);box(2.96,.14,.16,wood,house,2.52,y,3.75);}else box(8,.14,.16,wood,house,0,y,3.75);
  }
  box(.15,2.8,.25,trim,house,-1.05,1.9,3.86);box(.15,2.8,.25,trim,house,1.05,1.9,3.86);box(2.25,.15,.25,trim,house,0,3.3,3.86);
  for(const x of [-2.65,2.65]){
    box(1.16,1.56,.12,darkwood,house,x,2,3.9);box(1,1.4,.06,glass,house,x,2,3.98);
    box(.075,1.5,.08,trim,house,x,2,4.04);box(1.12,.075,.08,trim,house,x,2,4.04);
    for(const s of [-1,1]){box(.08,1.6,.12,trim,house,x+s*.61,2,4);box(1.32,.08,.12,trim,house,x,2+s*.81,4);}
  }
  const roofMat=mat(0x252b2c);
  for(const s of [-1,1]){const roof=box(4.7,.16,8.4,roofMat,house,s*2.08,5.3,0);roof.rotation.z=-s*.5;}
  // Gable triangles close the upper wall.
  const gableGeo=new T.BufferGeometry();gableGeo.setAttribute('position',new T.Float32BufferAttribute([-4,4.23,3.76,4,4.23,3.76,0,6.44,3.76],3));gableGeo.computeVertexNormals();mesh(gableGeo,mat(0x464b47,{side:T.DoubleSide}),house);
  const porchRoof=box(8.65,.18,3.7,roofMat,house,0,3.78,5.4);porchRoof.rotation.x=.11;
  for(const x of [-3.7,3.7]){box(.16,3.3,.16,trim,house,x,2.1,6.7);box(2.55,.13,.13,trim,house,x>0?2.65:-2.65,1.5,6.7);for(let i=0;i<8;i++)box(.065,.93,.065,wood,house,(x>0?1.5:-3.8)+i*.32,1,6.7);}
  box(8,.2,.18,trim,house,0,3.5,6.7);
  const doorPivot=new T.Group();doorPivot.position.set(-.96,.52,3.77);house.add(doorPivot);
  box(1.92,2.66,.12,darkwood,doorPivot,.96,1.33,0);
  for(const y of [.66,1.94])box(1.55,.92,.025,wood,doorPivot,.96,y,.079);
  ellipsoid(.06,.06,.07,chrome,doorPivot,1.7,1.26,.13);
  // Dark interior, lit wall, floor boards and ceiling remain after the threshold.
  const interior=mat(0x272a28);
  box(7.7,.12,7.4,wood,house,0,.5,0);box(7.7,.12,7.4,interior,house,0,3.9,0);
  box(7.6,3.3,.1,interior,house,0,2.1,-3.58);
  for(let i=0;i<28;i++)box(.016,.013,7.3,darkwood,house,-3.7+i*.27,.57,0);
  const insideLight=new T.PointLight(0xd8d8d8,23,10,2);insideLight.position.set(0,2.9,-.3);house.add(insideLight);
  const lamp=mesh(new T.ConeGeometry(.33,.2,20,1,true),iron,house,0,3.3,-.3);beam(V(0,3.4,-.3),V(0,3.9,-.3),.013,iron,house);
  box(1.7,.65,.6,darkwood,house,-1.05,.9,-3.0);
  // Quiet human silhouette, seated facing the back wall (-Z), away from the viewer.
  const figure=new T.Group();figure.position.set(-1.05,.57,-1.98);house.add(figure);
  const coat=mat(0x181b1a,{roughness:1});
  const headMaterial=mat(0x353936,{roughness:1});
  const chairMaterial=mat(0x393d39,{roughness:.95});
  box(.54,.075,.5,chairMaterial,figure,0,.45,0);
  for(const x of [-.22,.22])for(const z of [-.19,.19])beam(V(x,0,z),V(x,.45,z),.026,chairMaterial,figure);
  for(const x of [-.24,.24])beam(V(x,.43,.22),V(x,1.03,.27),.024,chairMaterial,figure);
  for(const y of [.68,.85,1.01])box(.49,.055,.045,chairMaterial,figure,0,y,.255);
  ellipsoid(.255,.16,.23,coat,figure,0,.59,-.03);
  const torso=ellipsoid(.255,.36,.155,coat,figure,0,.96,-.05);torso.rotation.x=-.08;
  ellipsoid(.27,.125,.145,coat,figure,0,1.19,-.07);
  beam(V(0,1.22,-.06),V(0,1.36,-.1),.066,headMaterial,figure);
  const head=ellipsoid(.12,.168,.133,headMaterial,figure,0,1.46,-.1);head.rotation.x=-.1;
  for(const side of [-1,1]){
    beam(V(side*.21,1.15,-.07),V(side*.28,.84,-.19),.061,coat,figure,.054);
    beam(V(side*.28,.84,-.19),V(side*.16,.68,-.42),.05,coat,figure,.04);
    ellipsoid(.05,.045,.075,headMaterial,figure,side*.16,.675,-.42);
    beam(V(side*.135,.56,-.05),V(side*.16,.5,-.43),.087,coat,figure,.073);
    beam(V(side*.16,.5,-.43),V(side*.16,.1,-.47),.069,coat,figure,.048);
    ellipsoid(.071,.06,.15,coat,figure,side*.16,.065,-.55);
  }

  // Distant fence and bare woodland silhouettes make the world continuous.
  for(let i=0;i<27;i++){
    const x=-40+i*3.4;box(.12,1.25,.12,darkwood,scene,x,.6,-32);
    if(i<26){box(3.4,.1,.09,wood,scene,x+1.7,.5,-32);box(3.4,.1,.09,wood,scene,x+1.7,.95,-32);}
  }
  for(let i=0;i<65;i++){const x=(rnd()-.5)*130,z=-42-rnd()*35,h=5+rnd()*10;beam(V(x,0,z),V(x+.5,h,z),.2,bark);for(let j=0;j<4;j++)beam(V(x,h*(.4+j*.13),z),V(x+(rnd()-.5)*5,h*(.7+j*.08),z+(rnd()-.5)*4),.07,bark);}

  // Three sparse courtyard trees; leave the camera corridor and porch open.
  const yardTrees=[[-12,0,5,5.2],[8.8,0,1.8,5.8],[20,0,-16,6.4]];
  const yardSeed=seed;seed=8347;
  function twig(a,dir,len,r,depth,parent){
    const end=a.clone().addScaledVector(dir,len);beam(a,end,r,bark,parent,r*.57);
    if(depth<=0)return;
    for(let i=0;i<2;i++)twig(end,dir.clone().add(V((rnd()-.5)*1.5,.1,(rnd()-.5)*1.5)).normalize(),len*(.57+rnd()*.15),r*.52,depth-1,parent);
  }
  for(const [x,y,z,h] of yardTrees){
    const group=new T.Group();group.position.set(x,y,z);scene.add(group);
    twig(V(0,0,0),V(.07,1,.03).normalize(),h*.51,.18,4,group);
    twig(V(.1,h*.28,0),V(-.7,.65,.2).normalize(),h*.28,.09,3,group);
  }
  const shrub=new T.Group();shrub.position.set(7,0,-17);scene.add(shrub);
  for(let i=0;i<13;i++){
    const a=i/13*Math.PI*2;
    twig(V((rnd()-.5)*.6,0,(rnd()-.5)*.6),V(Math.cos(a)*.55,.6+rnd()*.4,Math.sin(a)*.55).normalize(),.6+rnd()*.45,.025,3,shrub);
  }
  seed=yardSeed;

  // Batch static geometry by material; preserve the two animated groups.
  scene.updateMatrixWorld(true);
  const batches=new Map(), originals=[];
  scene.traverse(o=>{
    if(!o.isMesh||o.isInstancedMesh||Array.isArray(o.material))return;
    for(let parent=o;parent;parent=parent.parent)if(parent===doorPivot||parent===swing)return;
    const key=o.material.uuid+String(o.castShadow)+String(o.receiveShadow);
    if(!batches.has(key))batches.set(key,{material:o.material,cast:o.castShadow,receive:o.receiveShadow,parts:[]});
    const g=(o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone()).applyMatrix4(o.matrixWorld);
    batches.get(key).parts.push(g);originals.push(o);
  });
  for(const batch of batches.values()){
    const g=new T.BufferGeometry();
    for(const name of ['position','normal','uv']){
      const itemSize=name==='uv'?2:3;
      const count=batch.parts.reduce((sum,p)=>sum+p.attributes.position.count,0);
      const array=new Float32Array(count*itemSize);let offset=0;
      for(const part of batch.parts){const a=part.getAttribute(name);if(a)array.set(a.array,offset);offset+=part.attributes.position.count*itemSize;}
      g.setAttribute(name,new T.BufferAttribute(array,itemSize));
    }
    g.computeBoundingSphere();const combined=new T.Mesh(g,batch.material);combined.castShadow=batch.cast;combined.receiveShadow=batch.receive;scene.add(combined);batch.parts.forEach(p=>p.dispose());
  }
  const oldGeometries=new Set();originals.forEach(o=>{oldGeometries.add(o.geometry);o.removeFromParent();});oldGeometries.forEach(g=>g.dispose());

  // Keyframes [scroll fraction, eye position, look target]. A hold is deliberate reading time.
  const frames=[
    [0,[0,1.7,18],[0,2,0]], [.10,[0,1.7,18],[0,2,0]],
    [.22,[-2.8,1.7,2.2],[-5.2,2.7,-3]], [.34,[-2.8,1.7,2.2],[-5.2,2.7,-3]],
    [.43,[-2.4,1.7,-5.8],[2.2,1.3,-10]],
    [.52,[5.9,1.7,-6.6],[1.5,1.3,-10]], [.63,[5.9,1.7,-6.6],[1.5,1.3,-10]],
    [.72,[12,1.7,-10.8],[12,1.9,-18]], [.81,[12,2.18,-14.3],[12,2.1,-21]],
    [.89,[12,2.18,-19.5],[12,2,-24.5]], [1,[12,2.18,-19.5],[12,2,-24.5]]
  ];
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const smooth=v=>{v=clamp(v);return v*v*(3-2*v);};
  function sample(p){let i=0;while(i<frames.length-2&&p>frames[i+1][0])i++;const a=frames[i],b=frames[i+1];const t=smooth((p-a[0])/(b[0]-a[0]));camera.position.fromArray(a[1]).lerp(V(...b[1]),t);camera.lookAt(V(...a[2]).lerp(V(...b[2]),t));}
  const articles=[...root.querySelectorAll('article')];
  const bar=root.querySelector('.jv-progress i');
  const counter=root.querySelector('.jv-chapter');
  const scrollHint=root.querySelector('.jv-scroll');
  let progress=0,target=0,raf=0,visible=true,dead=false,last=0;
  function resize(){const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w<h?69:53;camera.updateProjectionMatrix();measure();wake();}
  function measure(){const rect=root.getBoundingClientRect();target=clamp(-rect.top/Math.max(1,root.offsetHeight-stage.clientHeight));}
  function opacityFor(p,start,end,edge=.025){return smooth((p-start)/edge)*(1-smooth((p-end)/edge));}
  function draw(time){raf=0;if(dead||!visible||document.hidden)return;const dt=Math.min(.05,last?(time-last)/1000:.016);last=time;
    progress+= (target-progress)*(1-Math.exp(-dt*11));if(Math.abs(target-progress)<.00002)progress=target;
    sample(progress);
    doorPivot.rotation.y=-smooth((progress-.72)/.085)*Math.PI*.55;
    swing.rotation.x=Math.sin(progress*20)*.065;
    const indoors=smooth((progress-.83)/.06);scene.fog.density=.027*(1-indoors)+.018*indoors;scene.fog.color.set(0x666c6c).lerp(new T.Color(0x1a1d1b),indoors);
    const op=[1-smooth((progress-.105)/.05),opacityFor(progress,.215,.325),opacityFor(progress,.49,.615),smooth((progress-.887)/.033)];
    articles.forEach((a,i)=>{const show=op[i]>.005;a.style.opacity=op[i];a.style.visibility=show?'visible':'hidden';a.setAttribute('aria-hidden',String(!show));a.inert=!show;
      if(i===0){const t=clamp((progress-.10)/.09);a.style.transform=`translateY(-50%) translateZ(${t*850}px)`;}
      else if(i===2){const t=1-smooth((progress-.49)/.035);a.style.transform=`translate(${t*90}px, -50%)`;a.style.clipPath=`inset(0 ${t*100}% 0 0)`;}
      else a.style.transform='translateY(-50%)';
    });
    bar.style.transform=`scaleX(${progress})`;counter.textContent=`0${progress<.18?1:progress<.4?2:progress<.7?3:4} / 04`;scrollHint.style.opacity=1-smooth(progress/.06);
    renderer.render(scene,camera);
    if(Math.abs(progress-target)>.00001)wake();
  }
  function wake(){if(!raf&&visible&&!dead&&!document.hidden)raf=requestAnimationFrame(draw);}
  function scroll(){measure();wake();}
  function visibility(){last=0;if(!document.hidden){measure();wake();}}
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;last=0;if(visible){measure();progress=target;wake();}},{rootMargin:'150px'});observer.observe(root);
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(stage);
  window.addEventListener('scroll',scroll,{passive:true});window.addEventListener('resize',resize,{passive:true});document.addEventListener('visibilitychange',visibility);
  function contextLost(e){e.preventDefault();root.querySelector('.jv-motion').click();}
  renderer.domElement.addEventListener('webglcontextlost',contextLost);
  root.classList.add('jv-ready');resize();measure();progress=target;wake();
  return ()=>{dead=true;cancelAnimationFrame(raf);observer.disconnect();resizeObserver.disconnect();window.removeEventListener('scroll',scroll);window.removeEventListener('resize',resize);document.removeEventListener('visibilitychange',visibility);renderer.domElement.removeEventListener('webglcontextlost',contextLost);const geometries=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());renderer.dispose();host.replaceChildren();};
}
