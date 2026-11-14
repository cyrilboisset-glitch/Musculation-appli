// ---------- Mannequin réaliste : corps MakeHuman (CC0) skinné, piloté par le moteur de poses de l'appli ----------
(function(){
if(!window.T3||!window.AN||!document.getElementById('bodymeta'))return;
const T=window.T3.THREE,{RoomEnvironment,RoundedBoxGeometry}=window.T3;
const V3=(x,y,z)=>new T.Vector3(x,y,z);
// moteur : x avant, y bas, z gauche (cm)  ->  scène : X gauche, Y haut, Z avant
const cv=p=>V3(p[2],-p[1],p[0]);
const ss=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)};

// ---------- données du corps ----------
function b64(s){const bin=atob(s),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u.buffer}
const META=JSON.parse(document.getElementById('bodymeta').textContent),BUF=b64(document.getElementById('bodybin').textContent.replace(/\s+/g,''));
function arr(n){const o=META.off[n],C={int16:Int16Array,int8:Int8Array,uint8:Uint8Array,uint16:Uint16Array}[o[2]];return new C(BUF,o[0],o[1])}

// ---------- matériau peau : teintes (cheveux, sourcils, lèvres), short, muscles qui s'allument ----------
const U={uP:{value:[0,0,0,0].map(()=>new T.Vector4())},uS:{value:[0,0,0,0].map(()=>new T.Vector4())},uF:{value:[0,0,0,0].map(()=>new T.Vector4())},uGlow:{value:0},uTime:{value:0},uShow:{value:1}};
function skinMaterial(){
 const m=new T.MeshPhysicalMaterial({color:0xffffff,roughness:.6,metalness:0,sheen:.32,sheenRoughness:.45,sheenColor:new T.Color(0xff7a5c),clearcoat:.05,clearcoatRoughness:.5});
 m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute vec4 mA0;attribute vec4 mA1;attribute vec4 mA2;attribute vec4 mA3;attribute vec4 tint;varying vec4 vM0;varying vec4 vM1;varying vec4 vM2;varying vec4 vM3;varying vec4 vT;varying vec3 vLP;')
   .replace('#include <begin_vertex>','#include <begin_vertex>\nvM0=mA0;vM1=mA1;vM2=mA2;vM3=mA3;vT=tint;vLP=position;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>',`#include <common>
uniform vec4 uP[4];uniform vec4 uS[4];uniform vec4 uF[4];uniform float uGlow;uniform float uTime;uniform float uShow;varying vec4 vM0;varying vec4 vM1;varying vec4 vM2;varying vec4 vM3;varying vec4 vT;varying vec3 vLP;
float hs(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}
float vn(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(mix(hs(i),hs(i+vec3(1.,0.,0.)),f.x),mix(hs(i+vec3(0.,1.,0.)),hs(i+vec3(1.,1.,0.)),f.x),f.y),mix(mix(hs(i+vec3(0.,0.,1.)),hs(i+vec3(1.,0.,1.)),f.x),mix(hs(i+vec3(0.,1.,1.)),hs(i+vec3(1.,1.,1.)),f.x),f.y),f.z);}
float mP(){return clamp(dot(vM0,uP[0])+dot(vM1,uP[1])+dot(vM2,uP[2])+dot(vM3,uP[3]),0.,1.);}
float mF(){return clamp(dot(vM0,uF[0])+dot(vM1,uF[1])+dot(vM2,uF[2])+dot(vM3,uF[3]),0.,1.);}
float mS(){return clamp(dot(vM0,uS[0])+dot(vM1,uS[1])+dot(vM2,uS[2])+dot(vM3,uS[3]),0.,1.);}`)
  .replace('#include <color_fragment>',`#include <color_fragment>
 float nz=vn(vLP*.55)*.6+vn(vLP*2.3)*.4;
 vec3 skin=vec3(.56,.30,.19)*(.93+.12*nz);
 skin=mix(skin,vec3(.50,.23,.15),.35*smoothstep(.55,.9,vn(vLP*.18)));
 skin=mix(skin,vec3(.05,.032,.022),vT.r*.92);
 skin=mix(skin,vec3(.50,.20,.16),vT.g*.7);
 skin=mix(skin,vec3(.36,.17,.12),vT.b*.75*(1.-step(.3,vM3.w)));
 float hairN=vn(vec3(vLP.x*6.,vLP.y*1.2,vLP.z*6.));
 skin=mix(skin,vec3(.028,.019,.014)*(.7+.6*hairN),vT.a);
 float sh=vM3.w;float weave=vn(vLP*3.1)*.5+.5*vn(vLP*9.);
 vec3 fab=vec3(.018,.016,.015)*(.85+.3*weave);
 float band=sh*smoothstep(.55,.95,sh)*(1.-smoothstep(.95,1.,sh));
 fab=mix(fab,vec3(.62,.42,.12),vT.b*step(.3,sh));
 skin=mix(skin,fab,sh);
 float gp=mP()*uShow*(1.-.65*vM3.w),gs=mS()*uShow*(1.-gp)*(1.-.65*vM3.w);
 skin=mix(skin,vec3(.80,.62,.30),mF()*(1.-gp)*(1.-vM3.w)*.08);
 skin=mix(skin,vec3(.86,.60,.16),gp*(.38+.3*uGlow));
 skin=mix(skin,vec3(.80,.36,.18),gs*(.18+.12*uGlow));
 diffuseColor.rgb=skin;`)
  .replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
 roughnessFactor=mix(roughnessFactor,.36,vT.g*.8);roughnessFactor=mix(roughnessFactor,.9,vT.a);roughnessFactor=mix(roughnessFactor,.95,vM3.w);roughnessFactor=mix(roughnessFactor,.4,vT.b*step(.3,vM3.w));`)
  .replace('#include <lights_physical_fragment>',`#include <lights_physical_fragment>
 material.sheenColor=mix(material.sheenColor,vec3(.10,.09,.08),vM3.w);material.sheenColor*=1.-vT.a*.8;
 material.clearcoat*=1.-max(vM3.w,vT.a);`)
  .replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
 {float gp=mP()*uShow*(1.-.65*vM3.w),gs=mS()*uShow*(1.-gp)*(1.-.65*vM3.w);float pul=.55+.45*sin(uTime*5.);
  totalEmissiveRadiance+=vec3(1.,.66,.18)*gp*(.07+.5*uGlow*pul)+vec3(.9,.38,.16)*gs*(.02+.12*uGlow);}`);
 };
 return m}

// ---------- œil : sphère avec iris peint ----------
function eyeTex(){const c=document.createElement('canvas');c.width=512;c.height=256;const g=c.getContext('2d');
 const bg=g.createLinearGradient(0,0,0,256);bg.addColorStop(0,'#cfc6bb');bg.addColorStop(.5,'#f4efe8');bg.addColorStop(1,'#cfc6bb');g.fillStyle=bg;g.fillRect(0,0,512,256);
 const cx=128,cy=128,rx=47,ry=94;g.save();g.translate(cx,cy);g.scale(1,ry/rx);
 const ir=g.createRadialGradient(0,0,4,0,0,rx);ir.addColorStop(0,'#1a0f08');ir.addColorStop(.38,'#2a1a0c');ir.addColorStop(.45,'#6b4a22');ir.addColorStop(.8,'#4a3016');ir.addColorStop(1,'#1c120a');
 g.fillStyle=ir;g.beginPath();g.arc(0,0,rx,0,7);g.fill();
 g.strokeStyle='rgba(201,154,52,.35)';g.lineWidth=1;for(let i=0;i<60;i++){const a=i/60*Math.PI*2;g.beginPath();g.moveTo(Math.cos(a)*15,Math.sin(a)*15);g.lineTo(Math.cos(a)*rx*.92,Math.sin(a)*rx*.92);g.stroke()}
 g.fillStyle='#050302';g.beginPath();g.arc(0,0,13,0,7);g.fill();g.restore();
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t}

// ---------- construction du corps ----------
function buildBody(){
 const nv=META.nv,g=new T.BufferGeometry();
 g.setAttribute('position',new T.BufferAttribute(Float32Array.from(arr('pos'),v=>v/50),3));
 g.setAttribute('normal',new T.BufferAttribute(Float32Array.from(arr('nrm'),v=>v/127),3));
 g.setAttribute('skinIndex',new T.BufferAttribute(Uint16Array.from(arr('j')),4));
 g.setAttribute('skinWeight',new T.BufferAttribute(Float32Array.from(arr('w'),v=>v/255),4));
 const mm=arr('m');for(let k=0;k<4;k++){const a=new Uint8Array(nv*4);for(let i=0;i<nv;i++)for(let c=0;c<4;c++)a[i*4+c]=mm[i*16+k*4+c];g.setAttribute('mA'+k,new T.BufferAttribute(a,4,true))}
 g.setAttribute('tint',new T.BufferAttribute(new Uint8Array(arr('c')),4,true));
 g.setIndex(new T.BufferAttribute(new Uint16Array(arr('t_skin')),1));
 const bones=META.bones.map(b=>{const o=new T.Bone();o.name=b.n;return o}),BY={};
 META.bones.forEach((b,i)=>{BY[b.n]=i;const h=V3(b.h[0],b.h[1],b.h[2]);if(b.p<0)bones[i].position.copy(h);else{const ph=META.bones[b.p].h;bones[i].position.copy(h).sub(V3(ph[0],ph[1],ph[2]));bones[b.p].add(bones[i])}});
 const mesh=new T.SkinnedMesh(g,skinMaterial());mesh.add(bones[0]);mesh.updateMatrixWorld(true);mesh.bind(new T.Skeleton(bones));
 mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;
 // yeux
 const tex=eyeTex(),em=new T.MeshPhysicalMaterial({map:tex,roughness:.12,clearcoat:1,clearcoatRoughness:.05});
 const hb=bones[BY.head],hh=META.bones[BY.head].h;
 for(const s of['L','R']){const e=META.eyes[s],o=new T.Mesh(new T.SphereGeometry(META.eyer[s]*.86,32,20),em);o.position.set(e[0]-hh[0],e[1]-hh[1],e[2]-hh[2]+.05);o.rotation.y=s=='L'?.06:-.06;hb.add(o)}
 return{mesh,bones,BY}}

// ---------- repères du squelette au repos ----------
function restInfo(BY){const H=n=>{const b=META.bones[BY[n]].h;return V3(b[0],b[1],b[2])},I={};
 I.hipc=H('upperleg01.L').add(H('upperleg01.R')).multiplyScalar(.5);I.rootH=H('root');
 I.trunkUp=H('neck01').sub(I.hipc).normalize();
 for(const s of['L','R']){const sg=s=='L'?1:-1;
  const sh=H('upperarm01.'+s),el=H('lowerarm01.'+s),wr=H('wrist.'+s),k2=H('finger2-1.'+s),k3=H('finger3-1.'+s),k5=H('finger5-1.'+s);
  const ua=el.clone().sub(sh).normalize(),fa=wr.clone().sub(el).normalize(),hd=k3.clone().sub(wr).normalize();
  // pli du coude vers l'avant : axe = bras × avant
  const bend0=V3(0,0,1).sub(ua.clone().multiplyScalar(ua.z)).normalize();
  const kn=k2.clone().sub(k5).normalize();
  let pn=hd.clone().cross(kn).normalize();if(pn.x*sg>0)pn.negate();   // paume vers le dedans
  const kmid=k2.clone().add(k5).multiplyScalar(.5);
  const grip=kmid.clone().addScaledVector(pn,2.7).addScaledVector(hd,-.6);
  I[s]={ua,fa,hd,bend0,hin0:ua.clone().cross(bend0).normalize(),kn,pn,grip,wr,
   th:H('upperleg02.'+s).sub(H('upperleg01.'+s)).normalize(),thA:H('lowerleg01.'+s).sub(H('upperleg01.'+s)).normalize(),
   sh_:H('foot.'+s).sub(H('lowerleg01.'+s)).normalize(),ft:H('toe1-1.'+s).sub(H('foot.'+s)).normalize()}}
 return I}
// rotation qui envoie le repère (a0,b0) sur (a,b)
const M1=new T.Matrix4(),M2=new T.Matrix4();
function frameQ(a0,b0,a,b,out){const x0=a0.clone().normalize(),y0=b0.clone().sub(x0.clone().multiplyScalar(b0.dot(x0))).normalize(),z0=x0.clone().cross(y0);
 const x1=a.clone().normalize(),y1=b.clone().sub(x1.clone().multiplyScalar(b.dot(x1))).normalize(),z1=x1.clone().cross(y1);
 M1.makeBasis(x1,y1,z1);M2.makeBasis(x0,y0,z0).transpose();return(out||new T.Quaternion()).setFromRotationMatrix(M1.multiply(M2))}
const perp=(v,d)=>v.clone().sub(d.clone().multiplyScalar(v.dot(d)));

// ---------- haltère à disques (charte : disques or et cuivre) ----------
function dumbbell(){const g=new T.Group(),chrome=new T.MeshStandardMaterial({color:0xd8d2c6,metalness:1,roughness:.22}),
 knurl=new T.MeshStandardMaterial({color:0x8e877c,metalness:1,roughness:.55}),
 gold=new T.MeshPhysicalMaterial({color:0xc99a34,metalness:.85,roughness:.32,clearcoat:.6,clearcoatRoughness:.25}),
 copper=new T.MeshPhysicalMaterial({color:0xb4643a,metalness:.8,roughness:.34,clearcoat:.6,clearcoatRoughness:.25}),
 dark=new T.MeshStandardMaterial({color:0x1e1c1b,metalness:.3,roughness:.6});
 const cyl=(r,l,m,y)=>{const o=new T.Mesh(new T.CylinderGeometry(r,r,l,40),m);o.position.y=y;o.castShadow=true;o.receiveShadow=true;g.add(o);return o};
 cyl(1.25,35,chrome,0);cyl(1.45,12.5,knurl,0);
 for(const s of[-1,1]){cyl(2.1,1.6,chrome,s*7.4);cyl(9.6,2.2,copper,s*9.4);cyl(4,2.3,dark,s*9.4);cyl(8.2,1.7,gold,s*11.4);cyl(3.4,1.8,dark,s*11.4);cyl(2.3,2.4,chrome,s*13.5)}
 return g}

// ---------- accessoires du moteur (banc, lit, chaise, tapis) ----------
function propMeshes(X){const g=new T.Group(),M={pr:new T.MeshPhysicalMaterial({color:0x16130f,roughness:.55,clearcoat:.12,clearcoatRoughness:.5,envMapIntensity:.3}),
 pr2:new T.MeshStandardMaterial({color:0x2a2622,metalness:.45,roughness:.45,envMapIntensity:.5}),mat:new T.MeshStandardMaterial({color:0x2b1d14,roughness:.95}),
 wall:new T.MeshStandardMaterial({color:0x1a1816,roughness:.9})};
 (X.pr||[]).forEach(q=>AN.boxes(q,X).forEach(b=>{const w=b.z1-b.z0,h=b.y1-b.y0,d=b.x1-b.x0,r=Math.min(b.r||0,w/2-.01,h/2-.01,d/2-.01);
  const geo=r>.3?new RoundedBoxGeometry(w,h,d,3,r):new RoundedBoxGeometry(w,h,d,1,.05),o=new T.Mesh(geo,M[q.c=='wall'?'wall':b.c]||M.pr);
  o.position.set((b.z0+b.z1)/2,-(b.y0+b.y1)/2,(b.x0+b.x1)/2);o.castShadow=true;o.receiveShadow=true;g.add(o)}));return g}

const tmpQ=new T.Quaternion(),tmpQ2=new T.Quaternion(),tmpV=new T.Vector3();
function setWorld(st,name,q){const b=st.B.bones[st.B.BY[name]],p=b.parent;p.updateWorldMatrix(true,false);p.getWorldQuaternion(tmpQ2);b.quaternion.copy(tmpQ2.invert().multiply(q))}
function local(st,name,q){st.B.bones[st.B.BY[name]].quaternion.copy(q)}
const ID=new T.Quaternion();

// pose complète à partir des points 3D du moteur
function applyPose(st,X,r){const Q=r.Q,p={},I=st.I;for(const k in Q.p)p[k]=cv(Q.p[k]);
 const B=st.B;B.bones.forEach(b=>b.quaternion.identity());
 const up=p.nb.clone().sub(p.hp).normalize(),lat=cv(Q.lat).normalize(),fwd=up.clone().cross(lat).normalize().negate();
 // tronc : légère répartition dans la colonne pour un dos naturel
 const qT=frameQ(I.trunkUp,V3(1,0,0),up,lat);
 const root=B.bones[0];root.quaternion.copy(qT);root.position.copy(p.hp.clone().sub(I.hipc.clone().sub(I.rootH).applyQuaternion(qT)));
 // tête
 const hu=cv(Q.hu).normalize(),fc=cv(Q.face).normalize(),qH=frameQ(V3(0,1,0),V3(0,0,1),hu,fc);
 root.updateMatrixWorld(true);
 setWorld(st,'neck01',qT.clone().slerp(qH,.35));setWorld(st,'neck03',qT.clone().slerp(qH,.75));setWorld(st,'head',qH);
 // jambes
 for(const[s,k]of[['L','l'],['R','L']]){const i=I[s],h=p[k+'h'],kn=p[k+'k'],an=p[k+'a'],to=p[k+'t'];
  const th=kn.clone().sub(h).normalize(),sh=an.clone().sub(kn).normalize();
  let hin=th.clone().cross(sh);const bend=hin.length();const hfb=perp(lat,th).normalize(),wb=ss(.05,.25,bend);
  hin=bend>.01?hin.normalize().multiplyScalar(wb).add(hfb.multiplyScalar(1-wb)).normalize():hfb;
  setWorld(st,'upperleg01.'+s,frameQ(i.thA,V3(1,0,0),th,hin));
  setWorld(st,'lowerleg01.'+s,frameQ(i.sh_,V3(1,0,0),sh,perp(hin,sh)));
  let ft=to?to.clone().sub(an).normalize():fwd.clone();
  if((k=='l'?r.P.f:r.P.F)==null&&Q.p[k+'a'][1]>-12){const hz=V3(ft.x,0,ft.z);if(hz.length()>.2)ft=hz.normalize().multiplyScalar(.97).add(V3(0,-.24,0)).normalize()}setWorld(st,'foot.'+s,frameQ(i.ft,V3(1,0,0),ft,perp(hin,ft)))}
 // bras + mains + haltères
 const Bd=X.db||{},hold=Bd.h=='aA'?'aA':Bd.h=='a'?'a':Bd.h=='A'?'A':Bd.h=='c'?'aA':'';
 const sup=/^Curl(?! marteau| Zottman| croisé)/.test(st.name||'');
 const axes={};
 for(const[s,k]of[['L','a'],['R','A']]){const i=I[s],sg=s=='L'?1:-1,sh=p[k+'s'],el=p[k+'e'],wr=p[k+'w'],hd=p[k+'h'];
  const ua=el.clone().sub(sh).normalize(),fa=wr.clone().sub(el).normalize();
  // pli du coude
  let bd=perp(fa,ua);const bl=bd.length();
  let fb=perp(fwd,ua);if(fb.length()<.35)fb=perp(up,ua);fb.normalize();
  bd=bl>.02?bd.normalize():fb.clone();const wb=ss(.1,.4,bl);const bend=bd.multiplyScalar(wb).add(fb.multiplyScalar(1-wb)).normalize();
  const hin=ua.clone().cross(bend).normalize();
  // clavicule : monte quand le bras passe au-dessus de l'horizontale
  const elev=Math.max(0,ua.dot(up)+.15);setWorld(st,'clavicle.'+s,new T.Quaternion().setFromAxisAngle(fwd,sg*elev*.22).multiply(qT));
  setWorld(st,'upperarm01.'+s,frameQ(i.ua,i.hin0,ua,hin));
  const qFa=frameQ(i.fa,i.hin0,fa,perp(hin,fa).length()>.05?perp(hin,fa):perp(fb,fa));
  // orientation de la main : axe des jointures = axe de l'haltère
  const hdir=hd.clone().sub(wr).normalize(),kn0=i.kn.clone().applyQuaternion(qFa);
  let kt=perp(kn0,hdir).normalize();
  const holds=hold.indexOf(k)>=0;
  if(holds){let a;const J=Q.J,fan=J[(Bd.h=='c'?'a':k)+'f'],w=Bd.h=='c'?(Bd.w!=null?Bd.w:1):((k=='A'?r.P.W:r.P.w)!=null?(k=='A'?r.P.W:r.P.w):(Bd.w!=null?Bd.w:0));
   const dr=x=>[Math.sin(x*Math.PI/180),Math.cos(x*Math.PI/180)];
   if(Bd.o=='a')a=cv(Q.mv(dr(fan)));else if(Bd.o=='t')a=up.clone();else{const ax=cv(Q.ax),m=cv(Q.mv(dr(fan+90)));a=ax.multiplyScalar(1-w).add(m.multiplyScalar(w))}
   a.normalize();axes[k]=a.clone();
   let at=perp(a,hdir);if(at.length()>.2){at.normalize();
    if(w<.5&&Bd.o!='t'&&Bd.o!='a'){const wantLat=sup?sg:-sg;if(at.dot(lat)*wantLat<0)at.negate()}else if(at.dot(kt)<0)at.negate();
    kt=at}}
  // torsion de l'avant-bras répartie (radius/cubitus) puis poignet
  const tw=Math.atan2(kn0.clone().cross(kt).dot(fa),kn0.dot(kt));
  setWorld(st,'lowerarm01.'+s,new T.Quaternion().setFromAxisAngle(fa,tw*.3).multiply(qFa));
  setWorld(st,'lowerarm02.'+s,new T.Quaternion().setFromAxisAngle(fa,tw*.7).multiply(qFa));
  setWorld(st,'wrist.'+s,frameQ(i.hd,i.kn,hdir,kt));
  // doigts : prise fermée sur la poignée, ou main relâchée
  const cl=holds?[1.05,1.25,.85]:[.25,.35,.2];
  for(let f=2;f<=5;f++){const b0=META.bones[st.B.BY['finger'+f+'-1.'+s]],fd=V3(b0.t[0]-b0.h[0],b0.t[1]-b0.h[1],b0.t[2]-b0.h[2]).normalize(),ax=fd.clone().cross(i.pn).normalize();
   for(let j=1;j<=3;j++)local(st,'finger'+f+'-'+j+'.'+s,new T.Quaternion().setFromAxisAngle(ax,cl[j-1]*(1+(f-3)*.06)))}
  {const b0=META.bones[st.B.BY['finger1-2.'+s]],fd=V3(b0.t[0]-b0.h[0],b0.t[1]-b0.h[1],b0.t[2]-b0.h[2]).normalize(),ax=fd.clone().cross(i.pn).normalize();
   local(st,'finger1-2.'+s,new T.Quaternion().setFromAxisAngle(ax,holds?.55:.15));local(st,'finger1-3.'+s,new T.Quaternion().setFromAxisAngle(ax,holds?.6:.15))}}
 root.updateMatrixWorld(true);
 // pieds au sol quand le moteur les pose au sol
 const grounded=Math.max(Q.p.la[1],Q.p.La[1])>-14&&Math.min(Q.p.la[1],Q.p.La[1])>-30;
 if(grounded){let mn=1e9;st.soles.forEach(o=>{tmpV.copy(o.o).applyMatrix4(o.b.matrixWorld);mn=Math.min(mn,tmpV.y)});root.position.y-=mn;root.updateMatrixWorld(true)}
 // haltères dans les mains
 const grip=s=>{const b=st.B.bones[st.B.BY['wrist.'+s]],h=META.bones[st.B.BY['wrist.'+s]].h,g=st.I[s].grip;return V3(g.x-h[0],g.y-h[1],g.z-h[2]).applyMatrix4(b.matrixWorld)};
 const yax=V3(0,1,0);
 st.db[0].visible=st.db[1].visible=false;
 if(Bd.h=='c'){const c=grip('L').add(grip('R')).multiplyScalar(.5),a=axes.a||up;st.db[0].visible=true;st.db[0].position.copy(c).addScaledVector(a,-6);st.db[0].quaternion.setFromUnitVectors(yax,a)}
 else{[['L','a',0],['R','A',1]].forEach(([s,k,n])=>{if(hold.indexOf(k)<0)return;const b=st.B.bones[st.B.BY['wrist.'+s]];b.getWorldQuaternion(tmpQ);
  const a=st.I[s].kn.clone().applyQuaternion(tmpQ).normalize();st.db[n].visible=true;st.db[n].position.copy(grip(s));st.db[n].quaternion.setFromUnitVectors(yax,a)})}}

// ---------- moteur de rendu partagé : un seul contexte WebGL, recopié dans le canevas de chaque lecteur ----------
let ST=null,FAIL=false;
function Stage(){
 const cvs=document.createElement('canvas');
 const R=new T.WebGLRenderer({canvas:cvs,antialias:true,alpha:true,premultipliedAlpha:false,powerPreference:'high-performance'});R.setPixelRatio(1);
 R.toneMapping=T.ACESFilmicToneMapping;R.toneMappingExposure=.95;R.outputColorSpace=T.SRGBColorSpace;R.shadowMap.enabled=true;R.shadowMap.type=T.PCFSoftShadowMap;
 const S=new T.Scene(),BG=new T.Color(0x0f0e0d);S.background=BG;
 const pm=new T.PMREMGenerator(R);S.environment=pm.fromScene(new RoomEnvironment(),.04).texture;S.environmentIntensity=.42;
 S.add(new T.HemisphereLight(0xfff1dc,0x1a1410,.35));
 const key=new T.DirectionalLight(0xfff0e2,2.3);key.castShadow=true;key.shadow.mapSize.set(1536,1536);
 Object.assign(key.shadow.camera,{left:-170,right:170,top:170,bottom:-170,near:10,far:900});key.shadow.bias=-.0003;key.shadow.normalBias=.6;key.shadow.radius=5;S.add(key);S.add(key.target);
 const rim=new T.DirectionalLight(0xf0cf73,2.4);S.add(rim);const rim2=new T.DirectionalLight(0xe9a178,1.5);S.add(rim2);const fill=new T.DirectionalLight(0xa9bccc,.45);S.add(fill);
 const flM=new T.MeshStandardMaterial({color:0x15120f,roughness:.82,metalness:.08});
 const fl=new T.Mesh(new T.CircleGeometry(340,96),flM);fl.rotation.x=-Math.PI/2;fl.receiveShadow=true;S.add(fl);
 const ring=new T.Mesh(new T.RingGeometry(118,119.2,128),new T.MeshBasicMaterial({color:0xc99a34,transparent:true,opacity:.35}));ring.rotation.x=-Math.PI/2;ring.position.y=.05;S.add(ring);
 const ring2=new T.Mesh(new T.RingGeometry(150,150.5,128),new T.MeshBasicMaterial({color:0x7d5a14,transparent:true,opacity:.25}));ring2.rotation.x=-Math.PI/2;ring2.position.y=.05;S.add(ring2);
 const cam=new T.PerspectiveCamera(30,1,5,2000);
 const B=buildBody(),I=restInfo(B.BY);S.add(B.mesh);
 const db=[dumbbell(),dumbbell()];db.forEach(d=>{d.visible=false;S.add(d)});
 const soles=[];B.mesh.updateMatrixWorld(true);
 for(const s of['L','R']){const fb=B.bones[B.BY['foot.'+s]],tb=B.bones[B.BY['toe1-1.'+s]],fh=META.bones[B.BY['foot.'+s]].h,th=META.bones[B.BY['toe1-1.'+s]].h;
  soles.push({b:fb,o:V3(0,-fh[1]+.4,-4.5)},{b:fb,o:V3(0,-fh[1]+.4,4)},{b:tb,o:V3(0,-th[1]+.4,4)})}
 const band=bandMesh();S.add(band);
 return{R,S,BG,cvs,cam,B,I,db,band,key,rim,rim2,fill,fl,ring,ring2,soles,props:null,W:0,H:0,ray:new T.Raycaster()}}
function setMask(u,list,map){const f=new Array(16).fill(0);(list||[]).forEach(m=>{(map?map[m]:[m]).forEach(k=>{const i=META.masks.indexOf(k);if(i>=0)f[i]=1})});for(let k=0;k<4;k++)u.value[k].set(f[k*4],f[k*4+1],f[k*4+2],f[k*4+3])}
// cache par exercice : accessoires 3D, centre et rayon du cadrage
function info(st,X){if(X.r3)return X.r3;const props=propMeshes(X);props.visible=false;st.S.add(props);
 const mn=V3(1e9,1e9,1e9),mx=V3(-1e9,-1e9,-1e9);for(let i=0;i<12;i++){const r=AN.pose3(X,X.T*i/12);applyPose(st,X,r);
  ['head','wrist.L','wrist.R','foot.L','foot.R','root','toe1-1.L','toe1-1.R','lowerleg01.L','lowerleg01.R'].forEach(n=>{st.B.bones[st.B.BY[n]].getWorldPosition(tmpV);mn.min(tmpV);mx.max(tmpV)})}
 mn.y=Math.max(0,mn.y-8);mx.y+=14;const c=mn.clone().add(mx).multiplyScalar(.5),sz=mx.clone().sub(mn);
 X.r3={props,c,rad:Math.max(sz.x,sz.y,sz.z)*.6+16,hy:sz.y/2+12,hw:Math.max(sz.x,sz.z)/2+14};return X.r3}
function place(st,c){st.key.target.position.copy(c);st.key.position.copy(c).add(V3(150,280,200));st.rim.position.copy(c).add(V3(-190,170,-190));st.rim2.position.copy(c).add(V3(200,110,-160));st.fill.position.copy(c).add(V3(-170,90,190))}
// caméra orbitale (mêmes conventions que les vues de l'appli : lacet 0 = profil, 90 = face)
function aim(st,V,c,rad,aspect,hy,hw){const cam=st.cam,a=V.yaw*Math.PI/180,b=Math.max(2,V.pitch)*Math.PI/180;cam.aspect=aspect;cam.updateProjectionMatrix();
 const tf=Math.tan(cam.fov*Math.PI/360),d=(hy?Math.max(hy/tf,hw/(tf*aspect)):rad/tf*Math.max(1,1/aspect))*1.04/(V.z||1),dir=V3(-Math.cos(a)*Math.cos(b),Math.sin(b),Math.sin(a)*Math.cos(b));
 const right=V3(0,1,0).cross(dir).normalize().negate(),upv=dir.clone().cross(right).negate().normalize();
 const tg=c.clone().addScaledVector(right,(V.px||0)).addScaledVector(upv,-(V.py||0));
 cam.position.copy(tg).addScaledVector(dir,d);cam.up.set(0,1,0);if(V.pitch>85)cam.up.copy(V3(Math.sin(a),0,Math.cos(a)));cam.lookAt(tg);cam.updateMatrixWorld();
 V.bw=rad*Math.max(1,aspect);V.bh=V.bw/aspect}
function blit(st,V,opt){const el=V.svg,dpr=Math.min(window.devicePixelRatio||1,opt.big?2:1.6),cw=el.clientWidth,ch=el.clientHeight;if(!cw||!ch)return null;
 const w=Math.round(cw*dpr),h=Math.round(ch*dpr);if(el.width!==w||el.height!==h){el.width=w;el.height=h}
 if(w>st.W||h>st.H){st.W=Math.max(w,st.W);st.H=Math.max(h,st.H);st.R.setSize(st.W,st.H,false)}
 st.R.setViewport(0,st.H-h,w,h);st.R.setScissor(0,st.H-h,w,h);st.R.setScissorTest(true);return{w,h,asp:w/h}}
function out(st,V,s,mir){const ctx=V.ctx||(V.ctx=V.svg.getContext('2d'));ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,s.w,s.h);
 if(mir){ctx.translate(s.w,0);ctx.scale(-1,1)}ctx.drawImage(st.cvs,0,0,s.w,s.h,0,0,s.w,s.h)}
function scene(st,tr){st.S.background=tr?null:st.BG;st.fl.visible=!tr;st.ring.visible=st.ring2.visible=!tr}
// élastique tissu : ruban bleu en boucle autour des deux genoux, chevilles ou poignets
function bandMesh(){const n=72,g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(new Float32Array(n*2*3),3));g.setAttribute('normal',new T.BufferAttribute(new Float32Array(n*2*3),3));
 const ix=[];for(let i=0;i<n;i++){const j=(i+1)%n;ix.push(i*2,j*2,i*2+1,i*2+1,j*2,j*2+1)}g.setIndex(ix);
 const m=new T.Mesh(g,new T.MeshStandardMaterial({color:0x2a3fbf,roughness:.92,metalness:0,side:T.DoubleSide}));m.castShadow=true;m.frustumCulled=false;m.visible=false;m.n=n;return m}
function bandPose(st,X){const m=st.band;if(!X||!X.el){m.visible=false;return}const P=n=>{const v=new T.Vector3();st.B.bones[st.B.BY[n]].getWorldPosition(v);return v};
 let A,B,ax,r,bw=6.5;
 if(X.el=='h'){const pa=P('wrist.L').lerp(P('finger3-1.L'),.35),pb=P('wrist.R').lerp(P('finger3-1.R'),.35);A=pa;B=pb;const ab=pb.clone().sub(pa).normalize();ax=new T.Vector3(0,1,0);ax.sub(ab.clone().multiplyScalar(ax.dot(ab)));if(ax.length()<.2)ax.set(0,0,1);ax.normalize();r=3.2;bw=6}
 else{const t=X.el=='k'?['upperleg01','lowerleg01',.8]:['lowerleg01','foot',.82],a0=P(t[0]+'.L'),a1=P(t[1]+'.L'),b0=P(t[0]+'.R'),b1=P(t[1]+'.R');
  A=a0.clone().lerp(a1,t[2]);B=b0.clone().lerp(b1,t[2]);ax=a1.clone().sub(a0).add(b1.clone().sub(b0)).normalize();r=X.el=='k'?6.6:4.6}
 const u=B.clone().sub(A);u.sub(ax.clone().multiplyScalar(u.dot(ax)));if(u.length()<.01)u.set(1,0,0);u.normalize();const w=ax.clone().cross(u).normalize();
 const n=m.n,pos=m.geometry.attributes.position,nor=m.geometry.attributes.normal,h=n/2,v=new T.Vector3(),d=new T.Vector3();
 for(let i=0;i<n;i++){const c=i<h?B:A,a=i<h?(i/(h-1))*Math.PI-Math.PI/2:((i-h)/(h-1))*Math.PI+Math.PI/2;
  d.copy(u).multiplyScalar(Math.cos(a)).addScaledVector(w,Math.sin(a));v.copy(c).addScaledVector(d,r);
  for(let k=0;k<2;k++){const q=v.clone().addScaledVector(ax,(k?.5:-.5)*bw);pos.setXYZ(i*2+k,q.x,q.y,q.z);nor.setXYZ(i*2+k,d.x,d.y,d.z)}}
 pos.needsUpdate=true;nor.needsUpdate=true;m.visible=true}
const PKM={cuisses:['quad','psoas'],ischios:['isch'],dos:['dos','trap'],pecs:['pec'],abdos:['abs','obl'],fessiers:['glu'],lombaires:['lomb'],mollets:['calf'],biceps:['bic'],triceps:['tri'],epaules:['delt']};
const ok=()=>{if(ST)return true;if(FAIL)return false;try{const t=document.createElement('canvas');if(!(t.getContext('webgl2')||t.getContext('webgl'))){FAIL=true;return false}ST=Stage();return true}catch(e){FAIL=true;window.console&&console.warn('3D indisponible',e);return false}};
window.R3={ok,
 // un lecteur d'exercice : pose du moteur r, vue V
 draw(p,V,r){const st=ST,X=p.X,inf=info(st,X);const s=blit(st,V,p);if(!s)return;
  if(st.props!==inf.props){if(st.props)st.props.visible=false;inf.props.visible=true;st.props=inf.props}
  st.name=p.name;applyPose(st,X,r);bandPose(st,X);setMask(U.uP,X.m);setMask(U.uS,X.m2);setMask(U.uF,[]);U.uGlow.value=r.ef;U.uShow.value=p.ang?1:0;U.uTime.value=performance.now()/1000;
  scene(st,!!p.tr3);place(st,inf.c);aim(st,V,inf.c,inf.rad,s.asp,V.pitch>50?0:inf.hy,inf.hw);st.R.render(st.S,st.cam);out(st,V,s,p.mir);
  const n=AN.vname?AN.vname(V.yaw,V.pitch):'';if(V.cap&&V.cn!==n){V.cn=n;V.cap.textContent=n}V.dirty=false},
 // mannequin de choix des muscles
 drawPk(p,V,k,has){const st=ST,s=blit(st,V,p);if(!s)return;if(st.props){st.props.visible=false;st.props=null}
  st.name='';applyPose(st,k.X,{Q:k.Q,P:k.P,ef:0});st.band.visible=false;const sel=Object.keys(PKM).filter(has);
  setMask(U.uP,sel,PKM);setMask(U.uS,[]);setMask(U.uF,Object.keys(PKM),PKM);U.uGlow.value=.55;U.uShow.value=1;U.uTime.value=0;
  const c=V3(0,87,0);scene(st,false);place(st,c);aim(st,V,c,96,s.asp,90,40);st.R.render(st.S,st.cam);out(st,V,s,false);
  V.pk={pos:st.cam.position.clone(),q:st.cam.quaternion.clone(),asp:s.asp};V.dirty=false},
 pick(p,V,k,x,y){const st=ST;if(!V.pk)return null;const r=V.svg.getBoundingClientRect(),cam=st.cam;
  st.name='';applyPose(st,k.X,{Q:k.Q,P:k.P,ef:0});st.B.mesh.updateMatrixWorld(true);
  cam.position.copy(V.pk.pos);cam.quaternion.copy(V.pk.q);cam.aspect=V.pk.asp;cam.updateProjectionMatrix();cam.updateMatrixWorld();
  st.ray.setFromCamera(new T.Vector2((x-r.left)/r.width*2-1,-(y-r.top)/r.height*2+1),cam);
  const h=st.ray.intersectObject(st.B.mesh,false)[0];if(!h||!h.face)return null;
  const m=st.B.mesh.geometry.attributes,sc={};let best=null,bv=.12;
  [h.face.a,h.face.b,h.face.c].forEach(vi=>{for(let q=0;q<4;q++){const a=m['mA'+q];for(let c=0;c<4;c++){const v=a.array[vi*4+c]/255,nm=META.masks[q*4+c];if(!nm)continue;for(const g in PKM)if(PKM[g].indexOf(nm)>=0)sc[g]=(sc[g]||0)+v/3}}});
  for(const g in sc)if(sc[g]>bv){bv=sc[g];best=g}return best}};
})();

