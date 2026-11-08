// Original GB-03 model geometry from user-supplied Gravity Breaker 3D source.
// Viewer controls, pedestal, post-process shadows removed; preserve procedural geometry and movable fins.
function buildGravityBreaker(THREE){
const scene=new THREE.Scene();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mat = (color, metalness=.72, roughness=.32, extra={}) => new THREE.MeshStandardMaterial({color,metalness,roughness,...extra});
const steel = mat(0x1c252d,.87,.35);
const steelLight = mat(0x394550,.84,.31);
const blackMetal = mat(0x111820,.78,.42);
const gunmetal = mat(0x252b33,.91,.25);
const machined = mat(0x6a727a,.93,.23);
const silver = mat(0x8e989f,.86,.27);
const seam = mat(0x0c1015,.60,.47);
const recess = mat(0x090d10,.30,.71);
const copper = mat(0x8f5a31,.83,.32);
const copperBright = mat(0xf3ac62,.62,.24);
const lightAmber = new THREE.MeshStandardMaterial({color:0xffb956,emissive:0xff942c,emissiveIntensity:4.2,metalness:.22,roughness:.22});
const lightGold = new THREE.MeshStandardMaterial({color:0xffde9e,emissive:0xffb348,emissiveIntensity:5.2,metalness:.05,roughness:.18});
const dimAmber = new THREE.MeshStandardMaterial({color:0xb75b27,emissive:0xeb6218,emissiveIntensity:2.2,metalness:.35,roughness:.3});
const glass = new THREE.MeshPhysicalMaterial({color:0x9a5930,transparent:true,opacity:.52,metalness:.24,roughness:.08,transmission:.22,thickness:.28,depthWrite:false,side:THREE.DoubleSide});
const energyShell = new THREE.MeshBasicMaterial({color:0xffa536,transparent:true,opacity:.14,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
const edgeAmber = new THREE.LineBasicMaterial({color:0xf28c3b,transparent:true,opacity:.65});
const lineSlate = new THREE.LineBasicMaterial({color:0x9db4c1,transparent:true,opacity:.25});
const softAmber = new THREE.MeshBasicMaterial({color:0xffae55,transparent:true,opacity:.4,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});

function mesh(geo, material, parent=weapon) { const obj = new THREE.Mesh(geo,material); obj.castShadow=true; obj.receiveShadow=true; parent.add(obj); return obj; }
function bx(w,h,d,material,x=0,y=0,z=0,parent=weapon) { const o=mesh(new THREE.BoxGeometry(w,h,d),material,parent);o.position.set(x,y,z);return o; }
function cyl(radiusTop,radiusBottom,length,segments,material,x,y,z,parent=weapon) {
 const o=mesh(new THREE.CylinderGeometry(radiusTop,radiusBottom,length,segments),material,parent);
 o.rotation.z=Math.PI/2;o.position.set(x,y,z);return o;
}
function sphere(radius, material, x=0,y=0,z=0, parent=weapon, detail=2) {const o=mesh(new THREE.IcosahedronGeometry(radius,detail),material,parent);o.position.set(x,y,z);return o;}
function poly(points,z,depth,material,parent=weapon,bevel=.035) {
 const shape=new THREE.Shape();shape.moveTo(points[0][0],points[0][1]);
 for(let i=1;i<points.length;i++)shape.lineTo(points[i][0],points[i][1]);shape.closePath();
 const geo=new THREE.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:bevel>0,bevelThickness:bevel,bevelSize:bevel,bevelSegments:2,curveSegments:1});
 geo.computeVertexNormals();const o=mesh(geo,material,parent);o.position.z=z;return o;
}
function hexagonVertices(radius,angle=Math.PI/6){return Array.from({length:6},(_,i)=>[radius*Math.cos(angle+i*Math.PI/3),radius*Math.sin(angle+i*Math.PI/3)]);}
function hexRing(x,radius,inner,depth,material,parent=weapon,rot=0){
 const shape=new THREE.Shape();const vs=hexagonVertices(radius,Math.PI/6+rot);shape.moveTo(...vs[0]);for(let i=1;i<6;i++)shape.lineTo(...vs[i]);shape.closePath();
 const hole=new THREE.Path();const hs=hexagonVertices(inner,Math.PI/6+rot).reverse();hole.moveTo(...hs[0]);for(let i=1;i<6;i++)hole.lineTo(...hs[i]);hole.closePath();shape.holes.push(hole);
 const geo=new THREE.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:true,bevelSize:.028,bevelThickness:.035,bevelSegments:2});geo.rotateY(Math.PI/2);
 const o=mesh(geo,material,parent);o.position.x=x;return o;
}
function ring(radius,tube,x,material,parent=weapon, radial=9){
 const o=mesh(new THREE.TorusGeometry(radius,tube,radial,64),material,parent);o.rotation.y=Math.PI/2;o.position.x=x;return o;
}
function rod(a,b,radius,material,parent=weapon,sides=8){
 const v1=new THREE.Vector3(...a),v2=new THREE.Vector3(...b);const mid=v1.clone().add(v2).multiplyScalar(.5);
 const o=mesh(new THREE.CylinderGeometry(radius,radius,v1.distanceTo(v2),sides),material,parent);
 o.position.copy(mid);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v2.sub(v1).normalize());return o;
}
function frameLine(points,material,closed=false,parent=weapon){
 const geo = new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p)));
 const o=new THREE.LineLoop(geo,material); if(!closed){const l=new THREE.Line(geo,material);parent.add(l);return l;} parent.add(o);return o;
}
function bolt(x,y,z,side=1,r=.07,parent=weapon){
 const o=mesh(new THREE.CylinderGeometry(r,r,.035,8),machined,parent);o.rotation.x=Math.PI/2;o.position.set(x,y,z+side*.015);
 bx(r*1.23,.015,.018,seam,x,y,z+side*.041,parent).rotation.z=.8;return o;
}
function decal(text,w,h,x,y,z,parent=weapon){
 const c=document.createElement('canvas');c.width=1024;c.height=128;const ctx=c.getContext('2d');
 ctx.fillStyle='#ffba71';ctx.font='700 52px monospace';ctx.letterSpacing='5px';ctx.textBaseline='middle';ctx.fillText(text,20,64);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
 const p=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t,transparent:true,opacity:.84,depthWrite:false,side:THREE.DoubleSide}));p.position.set(x,y,z);parent.add(p);return p;
}
function glowTexture(){
 const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;const ctx=canvas.getContext('2d');
 const g=ctx.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,238,184,.92)');g.addColorStop(.1,'rgba(255,173,62,.77)');g.addColorStop(.35,'rgba(255,106,18,.30)');g.addColorStop(1,'rgba(255,106,18,0)');
 ctx.fillStyle=g;ctx.fillRect(0,0,128,128);const tx=new THREE.CanvasTexture(canvas);tx.colorSpace=THREE.SRGBColorSpace;return tx;
}
const glowMap=glowTexture();
function glow(x,y,z,scale,opacity=.7,parent=weapon){
 const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:glowMap,color:0xffa84e,transparent:true,opacity,blending:THREE.AdditiveBlending,depthWrite:false}));
 sprite.scale.set(scale,scale,1);sprite.position.set(x,y,z);parent.add(sprite);return sprite;
}
const weapon=new THREE.Group();scene.add(weapon);
const chassis=new THREE.Group();weapon.add(chassis);
const coreGroup=new THREE.Group();weapon.add(coreGroup);
const spinBits=[];const vents=[];const petals=[];const rotating=[];const bloomSprites=[];const pLights=[];

// ---------- SPINAL CHASSIS / TAPERED HEAVY FRAME ----------
cyl(.55,.62,5.3,8,seam,-.23,0,0,chassis);
cyl(.48,.53,4.8,8,steel,-.22,0,0,chassis);
for(const x of [-2.35,-1.78,.94,1.7,2.26]){
 hexRing(x,.72,.55,.14,gunmetal,chassis);
 hexRing(x+.07,.65,.565,.04,machined,chassis);
}
for(const s of [-1,1]){
 // Structural frame rails, exposed precision mechanics.
 rod([-2.72,s*.50,s*.45],[2.41,s*.58,s*.48],.12,steelLight,chassis,8);
 rod([-2.65,s*.44,-s*.47],[2.25,s*.49,-s*.45],.085,gunmetal,chassis,8);
 for(const x of [-2.0,-1.18,.05,1.18,2.1]){
  const a=bx(.12,.63,.31,machined,x,s*.31,s*.46,chassis);a.rotation.x=s*.19;
  bx(.16,.42,.18,seam,x,s*.35,s*.66,chassis);
 }
}

// rear damping cassette, stylized science-fiction assembly
cyl(.54,.54,.58,8,steel,-2.83,0,0);
hexRing(-3.12,.7,.48,.22,steelLight);
hexRing(-3.36,.64,.45,.15,gunmetal);
hexRing(-3.51,.66,.42,.13,machined);
cyl(.48,.49,.16,8,recess,-3.57,0,0);
hexRing(-3.68,.55,.35,.08,steel);
for(const sy of [-1,1])for(const sz of [-1,1]){
 rod([-3.75,sy*.39,sz*.35],[-2.67,sy*.39,sz*.35],.055,silver);
 sphere(.075,copperBright,-3.73,sy*.39,sz*.35);
}
for(let i=0;i<4;i++){
 const x=-3.08+i*.145;hexRing(x,.75,.61,.05, i%2?silver:steelLight);
}
// compact grip/anchor support under rear portion
const handAnchor=poly([[-3.27,-.46],[-2.44,-.48],[-2.27,-.84],[-2.54,-1.12],[-2.8,-1.15],[-3.16,-.89]],-.34,.68,gunmetal);
poly([[-2.95,-.96],[-2.51,-1.05],[-2.70,-1.70],[-2.93,-1.8],[-3.16,-1.58]],-.25,.5,blackMetal);
poly([[-2.99,-1.72],[-2.70,-1.65],[-2.73,-1.82],[-3.13,-1.88]],-.28,.56,machined);
for(let i=0;i<6;i++){
 const y=-1.2-i*.09;const p=bx(.29,.014,.51,steelLight,-2.89,y,.0);p.rotation.z=.12;
}
// stylized arcing cradle below chassis
poly([[-2.43,-.53],[-2.23,-.79],[-1.72,-1.01],[-.95,-.99],[-.70,-.71],[-1.22,-.65]],-.24,.48,steel);
poly([[-2.32,-.7],[-2.18,-.84],[-1.78,-.93],[-1.27,-.91],[-1.14,-.81],[-1.76,-.78]],-.29,.58,machined,weapon,.012);
for(const s of [-1,1])rod([-1.12,-.66,s*.32],[.82,-.55,s*.39],.08,gunmetal);

// ---------- CENTRAL AMBER COMPRESSION REACTOR ----------
const reactorBase=new THREE.Group();reactorBase.position.x=-.48;weapon.add(reactorBase);
const glassShell=mesh(new THREE.SphereGeometry(.79,24,16),glass,reactorBase);glassShell.scale.set(1.28,.80,.92);
const coreSphere=mesh(new THREE.IcosahedronGeometry(.46,3),lightAmber,reactorBase);coreSphere.scale.set(1.65,.7,.82);
const innerFacet=mesh(new THREE.IcosahedronGeometry(.31,1),lightGold,reactorBase);innerFacet.scale.set(1.4,.93,.93);
const elec=new THREE.PointLight(0xff9d47,11,7,2);elec.position.set(-.4,.1,.2);weapon.add(elec);pLights.push(elec);
for(let i=0;i<3;i++){
 const coreRing=mesh(new THREE.TorusGeometry(.72,.046,8,72),i===1?copperBright:steelLight,reactorBase);
 coreRing.rotation.y=i*Math.PI/3;coreRing.rotation.x=Math.PI/2-i*.33;coreRing.scale.set(1.19,.90,1);
 rotating.push({mesh:coreRing,speed:(i%2?-.27:.20)*(1+i*.2)});
}
for(let i=0;i<6;i++){
 const a=i*Math.PI/3;
 const support=rod([-.97,Math.sin(a)*.71,Math.cos(a)*.71],[.97,Math.sin(a)*.71,Math.cos(a)*.71],.041,silver,reactorBase);
 // rods coordinates local to reactor group, balancing translucent central shell
}
const emission=glow(-.4,0,0,2.5,.7,weapon);bloomSprites.push(emission);
for(const s of [-1,1]){
 // Heat exchanger combs adjacent to glowing engine.
 for(let i=0;i<8;i++){
  const x=-1.45+i*.235;
  const r=bx(.068,.56,.15,i%2?copper:steelLight,x,.01,s*.78);
  r.rotation.z=(i-3.5)*.018;
 }
 const gb=bx(1.84,.07,.17,blackMetal,-.50,-.58,s*.73);gb.rotation.z=.015;
 for(let i=0;i<5;i++){
  const x=-1.2+i*.37;
  bx(.19,.045,.06,dimAmber,x,-.60,s*.83);
 }
}
// twin reactor bands
hexRing(-1.45,.87,.69,.15,gunmetal);
hexRing(-1.35,.83,.71,.055,copperBright);
hexRing(.44,.87,.68,.15,gunmetal);
hexRing(.53,.84,.70,.055,copperBright);

// ---------- OUTER ARMOR; ANIMATED VENT COVERS ----------
for(const s of [-1,1]){
 const bracket=new THREE.Group();bracket.position.z=s*.89;weapon.add(bracket);
 const p1=poly([[-1.60,.22],[-1.38,.80],[-.87,1.05],[-.15,.97],[.42,.57],[.60,.21],[-.10,.40],[-.76,.36]],s<0?-.17:0,.17,steel,bracket);
 const p2=poly([[-1.46,.32],[-1.21,.77],[-.77,.91],[-.20,.85],[.14,.58],[-.42,.66],[-.98,.62]],s<0?-.198:.17,.027,gunmetal,bracket,.018);
 poly([[-1.24,.77],[-.82,.90],[-.15,.84],[-.33,.75],[-1.00,.77]],s<0?-.225:.20,.024,machined,bracket,.013);
 poly([[-1.12,.33],[-.87,.45],[.13,.50],[-.11,.36]],s<0?-.215:.21,.018,copper,bracket,.005);
 const strip=poly([[-.88,.46],[.22,.56],[.04,.48],[-.69,.43]],s<0?-.228:.225,.014,lightAmber,bracket,.002);
 for(const x of [-1.23,-.78,-.28])bolt(x,.66,s<0?-.25:.27,s,.056,bracket);
 vents.push({bracket,side:s,strip,baseZ:s*.89});
 const lower=new THREE.Group();lower.position.z=s*.76;weapon.add(lower);
 poly([[-1.65,-.20],[-.89,-.35],[.46,-.29],[.69,-.52],[.19,-.80],[-.96,-.77],[-1.48,-.48]],s<0?-.15:0,.15,gunmetal,lower);
 poly([[-1.45,-.43],[-.89,-.68],[.13,-.67],[.46,-.51],[-.90,-.57]],s<0?-.175:.15,.025,steelLight,lower,.018);
 for(const x of [-1.25,-.58,.22])bolt(x,-.58,s<0?-.21:.18,s,.058,lower);
 vents.push({bracket:lower,side:s,lower:true,baseZ:s*.76});
}

// ---------- FRONT HEAVY HEXAGONAL EMITTER ----------
// Barrel casing here is entirely fantastical, built as a layered hexagonal sculpture.
cyl(.73,.78,2.3,6,gunmetal,1.75,0,0);
hexRing(1.00,.88,.69,.24,steel);
hexRing(1.27,.84,.70,.08,machined);
hexRing(1.67,.92,.73,.18,steelLight);
hexRing(2.11,.98,.75,.25,gunmetal);
hexRing(2.37,.93,.77,.06,copper);
hexRing(2.53,1.04,.79,.18,steelLight);
hexRing(2.74,1.06,.83,.08,machined);
hexRing(3.08,1.19,.88,.26,blackMetal);
hexRing(3.35,1.19,.94,.17,silver);
hexRing(3.52,1.12,.97,.08,copperBright);
hexRing(3.61,1.08,.95,.04,steel);
hexRing(3.70,.97,.82,.07,lightAmber);
hexRing(3.79,.87,.66,.04,gunmetal);
const darkAperture=cyl(.67,.67,.035,6,recess,3.77,0,0);darkAperture.rotation.x=.52;
const innerLens=cyl(.39,.39,.045,6,blackMetal,3.809,0,0);
hexRing(3.83,.56,.47,.035,lightGold);
const reactorLens=cyl(.235,.235,.055,6,lightAmber,3.85,0,0);
const lensHeart=sphere(.14,lightGold,3.91,0,0);lensHeart.scale.x=.32;
const muzzleGlow=glow(3.88,0,0,2.12,.39);bloomSprites.push(muzzleGlow);
const frontLight=new THREE.PointLight(0xff923b,5,5,2);frontLight.position.set(3.85,0,.15);weapon.add(frontLight);
for(let i=0;i<6;i++){
 const a=Math.PI/6+i*Math.PI/3;
 const y=Math.sin(a)*1.05,z=Math.cos(a)*1.05;
 bx(.27,.11,.11,machined,3.47,y,z).rotation.x=a;
 rod([2.10,y*.73,z*.73],[3.5,y,z],.055,copper);
 sphere(.057,lightAmber,3.5,y,z,weapon,1);
}
// three floating concentric accelerator rings through mid section
for(let i=0;i<4;i++){
 const x=1.32+i*.37;
 const r=ring(.75+i*.045,.027,x,i%2?copper:dimAmber);
 rotating.push({mesh:r,speed:0,osc:true,index:i});
}

// ---------- SIX LARGE ARMOR PETALS; RADIAL FLOW DRIVE TRANSFORMATION ----------
for(let i=0;i<6;i++){
 const a=i*Math.PI/3;
 const pivot=new THREE.Group();pivot.position.x=1.18;pivot.rotation.x=a;weapon.add(pivot);
 const petal=new THREE.Group();pivot.add(petal);
 poly([[.0,.72],[.48,.98],[1.38,1.27],[2.16,1.34],[2.50,1.20],[1.96,1.03],[.88,.84]],-.18,.36,steel,petal,.042);
 poly([[.23,.86],[.62,1.02],[1.44,1.21],[2.12,1.26],[2.33,1.19],[1.44,1.07]],.195,.036,gunmetal,petal,.017);
 poly([[.46,.99],[1.20,1.17],[1.95,1.27],[1.79,1.21],[1.18,1.11]],.247,.013,machined,petal,.010);
 poly([[.78,.91],[1.78,1.12],[1.55,1.08],[.9,.97]],.265,.017,copperBright,petal,.006);
 bx(.33,.15,.4,blackMetal,.21,.71,0,petal).rotation.z=-.35;
 bx(.41,.12,.47,silver,2.24,1.22,0,petal).rotation.z=-.12;
 for(let j=0;j<3;j++)bolt(.81+j*.52,1.05+j*.105,.27,1,.045,petal);
 const filament=poly([[.30,.73],[1.95,1.03],[1.81,.95],[.47,.70]],-.207,.014,dimAmber,petal,.004);
 petals.push({pivot,petal,index:i,filament});
}

// ---------- SIDE REAR RESTRAINT WINGS; ANCHOR STRUCTURES ----------
for(const s of [-1,1]){
 const w=new THREE.Group();weapon.add(w);
 poly([[-2.93,.25],[-2.78,.76],[-2.36,.95],[-1.77,.77],[-1.63,.38],[-2.25,.44]],s*.65-.09,.18,steel,w);
 poly([[-2.72,.77],[-2.35,.86],[-1.86,.72],[-2.29,.67]],s*.65+(s>0?.105:-.115),.025,machined,w,.01);
 poly([[-2.71,.29],[-2.38,.47],[-1.78,.49],[-1.88,.42],[-2.48,.40]],s*.65+(s>0?.132:-.145),.017,copper,w,.004);
 for(const x of [-2.71,-2.22,-1.87])bolt(x,.66,s*.65+(s>0?.16:-.17),s,.052,w);
}

// ---------- SMALL SCI-FI INDUSTRIAL FEATURES ----------
for(const s of [-1,1]){
 for(let i=0;i<7;i++){
  const x=.88+i*.21;
  bx(.095,.09,.24,i%2?machined:steelLight,x,-.68,s*.37);
 }
 for(let j=0;j<3;j++){
  const y=.17+j*.14;
  rod([-2.10,y,s*.59],[-1.61,y,s*.57],.025,copperBright);
 }
}
// Back end side identification and warnings
// These decals form visible markings without any external texture downloads.
decal('GB-03 / GRAVITY',1.15,.14,-2.29,.56,.859);
decal('CORE // 08.7',.69,.12,-.69,.77,1.087);
decal('HEXA / FLUX',.72,.10,2.46,-.40,1.03);
// Decorative indicator lenses
for(let i=0;i<5;i++){
 const l=sphere(.046,i===0?lightGold:dimAmber,-1.13+i*.16,-.73,1.0,weapon,1);
 l.scale.set(1,.45,.65);
}

// ---------- NON-PHYSICAL VFX, PURELY VISUAL ----------
const effects=new THREE.Group();weapon.add(effects);
const shockwaves=[];
for(let i=0;i<4;i++){
 const m=ring(1,.045,3.7,new THREE.MeshBasicMaterial({color:i%2?0xffe1ab:0xff9637,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}),effects,12);
 m.visible=false;shockwaves.push(m);
}
const flash=sphere(.42,new THREE.MeshBasicMaterial({color:0xffcf85,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false}),3.82,0,0,effects,3);
flash.visible=false;flash.scale.x=.35;
const streaks=[];
for(let i=0;i<30;i++){
 const a=i*Math.PI*2/30;const rad=.55+(i%4)*.17;
 const rr=rod([3.73,Math.sin(a)*rad,Math.cos(a)*rad],[4.03,Math.sin(a)*(rad+.2),Math.cos(a)*(rad+.2)],.011,lightGold,effects,5);
 rr.visible=false;streaks.push(rr);
}
const crossSection=new THREE.Group();weapon.add(crossSection);
for(let i=0;i<12;i++){
 const a=2*Math.PI*i/12;
 const mark=bx(.14,.012,.012,copperBright,3.83,Math.sin(a)*.59,Math.cos(a)*.59,crossSection);mark.rotation.x=a;
}


const state={open:0,expand:0,shot:0};
const update=(dt,t,drive,charge,flash)=>{
 state.open+=(Number(drive)-state.open)*Math.min(1,dt*4.2);
 state.expand+=(Number(drive)-state.expand)*Math.min(1,dt*3.3);
 for(const r of rotating){if(r.osc){r.mesh.rotation.x=Math.sin(t*1.8+r.index*.4)*.016;}else r.mesh.rotation.z+=dt*r.speed;}
 innerFacet.rotation.x=t*.39;innerFacet.rotation.y=t*.53;
 coreSphere.rotation.x=t*.08;coreSphere.rotation.z=t*.12;
 lightAmber.emissiveIntensity=3.25+Math.sin(t*2.4)*.45+state.expand*1.7;
 lightGold.emissiveIntensity=4.5+Math.sin(t*2.7+.8)*.75+state.expand*1.1;
 dimAmber.emissiveIntensity=2+Math.sin(t*2.8)*.5+state.expand*1.1;
 elec.intensity=3+state.expand*2;
 frontLight.intensity=2+state.expand*3;
 glassShell.rotation.x=t*.04;
 emission.material.opacity=clamp(.35+Math.sin(t*2.1)*.14+state.expand*.25,.15,.8);
 muzzleGlow.material.opacity=clamp(.2+state.expand*.27+Math.sin(t*2.6)*.09,.1,.65);
 for(const v of vents){const amount=state.open*(v.lower?.62:1);v.bracket.position.z=v.baseZ+v.side*.46*amount;v.bracket.rotation.y=v.side*(v.lower?-.07:.16)*amount;v.bracket.rotation.x=v.side*(v.lower?-.05:.12)*amount;}
 for(const pet of petals){const w=state.expand;pet.petal.position.y=w*.50;pet.petal.position.x=w*.17;pet.petal.rotation.z=-w*.155;}
 state.shot=Math.max(flash,state.shot-dt*6);
 flashMesh.visible=state.shot>.05;flashMesh.material.opacity=state.shot*.52;
 };
const flashMesh=flash;
return {root:weapon,update,stats:{kind:'GB-03',meshCount:0}};
}

// ARC-RING HEAVY FRAME | Fiction-only decorative energy artifact
// Meshes remain rigid. Only deliberately articulated child groups animate.
function buildArcRing(THREE) {
  const root = new THREE.Group(); root.name = 'ARC_RING_HEAVY_FRAME';
  const exposed = { root, ringGroups: [], finParts: [], sideGroups: [], panelMetrics: {}, materials: {}, glowSprites: [], torusPulses: [], fx: {}, lights: [] };
  const M = exposed.materials;
  const standard = (color, metalness=.68, roughness=.32, additional={}) => new THREE.MeshStandardMaterial({color,metalness,roughness,...additional});
  M.armor = standard(0x273d4a,.84,.29);
  M.armorLite = standard(0x6a8295,.81,.26);
  M.armorEdge = standard(0x405b6b,.87,.33);
  M.black = standard(0x101d28,.58,.5);
  M.blackGloss = standard(0x142b3b,.83,.23);
  M.carbon = standard(0x111b24,.30,.64);
  M.silver = standard(0x91abbd,.88,.27);
  M.dusk = standard(0x3a375b,.75,.28);
  M.glow = standard(0x2b7287,.20,.25,{emissive:0x55e9ff,emissiveIntensity:2});
  M.glowHot = standard(0x5069ac,.15,.2,{emissive:0x9a7aff,emissiveIntensity:2.4});
  M.core = standard(0x46c1e9,.18,.14,{emissive:0x33cbff,emissiveIntensity:2.9,transparent:true,opacity:.9});
  M.coreInner = new THREE.MeshBasicMaterial({color:0xa1f9ff,transparent:true,opacity:.95});
  M.glowWhite = new THREE.MeshBasicMaterial({color:0xc8ffff});
  M.darkVoid = standard(0x050b15,.33,.77);
  M.bolt = standard(0xa2b5bf,.85,.38);
  const mesh = (g,m,parent=root,name='') => { const obj=new THREE.Mesh(g,m); obj.name=name; parent.add(obj); obj.castShadow=true; obj.receiveShadow=true; return obj; };
  const group = (name,parent=root) => { const g=new THREE.Group();g.name=name;parent.add(g);return g; };
  function poly(points, depth, z, mat, parent=root, name='', bevel=.024) {
    const sh=new THREE.Shape(); points.forEach(([x,y],i)=>i?sh.lineTo(x,y):sh.moveTo(x,y));sh.closePath();
    const geo=new THREE.ExtrudeGeometry(sh,{depth,bevelEnabled:bevel>0,bevelThickness:bevel,bevelSize:bevel,bevelSegments:2,curveSegments:1,steps:1});
    const ob=mesh(geo,mat,parent,name);ob.position.z=z;return ob;
  }
  function cub(w,h,d,x,y,z,mat,parent=root,name='',r=0){const g=new THREE.BoxGeometry(w,h,d);const ob=mesh(g,mat,parent,name);ob.position.set(x,y,z);ob.rotation.z=r;return ob;}
  function cylinder(r1,r2,len,segments,x,y,z,mat,axis='x',parent=root,name=''){
    const obj=mesh(new THREE.CylinderGeometry(r1,r2,len,segments,1),mat,parent,name);obj.position.set(x,y,z); if(axis==='x')obj.rotation.z=Math.PI/2;else if(axis==='z')obj.rotation.x=Math.PI/2;return obj;
  }
  function hexBolt(x,y,z,r=.045,parent=root){
    const ob=cylinder(r,r,.028,6,x,y,z,M.bolt,'z',parent,'bolt');
    cub(r*.75,r*.13,.033,x,y,z+(z>=0?.022:-.022),M.black,parent,'slot',.37);
    return ob;
  }
  function path(points, radius, mat, parent=root, name=''){
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),false,'centripetal');
    return mesh(new THREE.TubeGeometry(curve,Math.max(6,points.length*6),radius,5,false),mat,parent,name);
  }
  const wire = (a,b,r,mat,parent=root,name='beam') => {
    const mid=new THREE.Vector3().addVectors(new THREE.Vector3(...a),new THREE.Vector3(...b)).multiplyScalar(.5);
    const dir=new THREE.Vector3(...b).sub(new THREE.Vector3(...a));
    const ob=mesh(new THREE.CylinderGeometry(r,r,dir.length(),7),mat,parent,name);ob.position.copy(mid);ob.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());return ob;
  };
  const torus = (r,tube,x,y,z,mat,parent=root,name='ring',radial=8,tubular=64) => {
    const ob=mesh(new THREE.TorusGeometry(r,tube,radial,tubular),mat,parent,name);ob.position.set(x,y,z);return ob;
  };
  function bladesAt(x,zSide,parent=root){
    const g=group('microvent',parent);g.position.set(x,-.18,zSide);
    for(let k=0;k<6;k++){
      const slit=cub(.056,.13,.013,-.18+k*.073,0,0,k%2===0?M.armorLite:M.blackGloss,g,'vent-slat');slit.rotation.z=-.31;
    }
    return g;
  }
  // Structural core keel and stabilizer. A compound stylized artifact, not a mechanical firearm.
  poly([[-2.78,-.27],[-2.46,.44],[-1.61,.61],[.84,.46],[2.07,.15],[2.22,-.23],[1.62,-.59],[-1.87,-.66]],1.0,-.50,M.black,root,'keel');
  poly([[-2.52,-.09],[-2.2,.32],[-1.6,.43],[.71,.34],[1.86,.08],[1.86,-.21],[1.27,-.42],[-1.67,-.48]],1.12,-.56,M.armor,root,'keel-edge');
  // Center longitudinal translucent light guide, visible between armor plates.
  cub(4.34,.07,.95,-.13,.01,0,M.glow,root,'light-guide');
  cub(4.2,.13,.58,-.07,-.39,0,M.blackGloss,root,'under-keel');
  for (const s of [-1,1]) {
    const z=s*.565;
    // Aft asymmetric layered stabilizer wings.
    poly([[-3.12,.28],[-2.82,.72],[-1.53,.72],[-1.10,.42],[-1.39,.16],[-2.57,.10]],.18,z-s*.02,M.blackGloss,root,`aft-carapace-${s}`);
    poly([[-2.95,.37],[-2.70,.65],[-1.67,.62],[-1.35,.42],[-1.61,.32],[-2.53,.27]],.10,z+s*.17,M.armor,root,'aft-top-plating');
    poly([[-2.87,-.30],[-2.41,-.60],[-1.37,-.55],[-1.05,-.29],[-1.41,-.05],[-2.4,-.06]],.19,z,M.armor,root,'aft-lower-plate');
    poly([[-2.59,-.35],[-2.32,-.51],[-1.46,-.45],[-1.35,-.29],[-1.69,-.20],[-2.33,-.20]],.045,z+s*.21,M.armorLite,root,'aft-underlayer');
    // Forward armor sectors leave a distinctive visible void around the floating core.
    poly([[.67,.42],[1.05,.64],[2.76,.44],[3.04,.17],[2.52,-.01],[1.19,.07]],.18,z,M.armor,root,'front-upper-slab');
    poly([[.91,.36],[1.19,.51],[2.65,.36],[2.85,.19],[2.49,.12],[1.22,.19]],.065,z+s*.19,M.armorLite,root,'front-upper-inlay');
    poly([[.77,-.48],[1.33,-.23],[2.63,-.27],[2.95,-.46],[2.34,-.67],[1.12,-.64]],.16,z,M.blackGloss,root,'front-lower-slab');
    poly([[1.04,-.48],[1.34,-.34],[2.52,-.37],[2.68,-.46],[2.32,-.55],[1.16,-.55]],.06,z+s*.17,M.armorEdge,root,'front-under-inlay');
    // Three contrasting brass-like cyan inset cuts etched into each large side panel.
    for (let k=0;k<3;k++) {
      const x=1.40+k*.41;
      path([[x,.32,z+s*.265],[x+.15,.29,z+s*.265],[x+.25,.22,z+s*.265]],.009,M.glow,root,'fine-engraving');
    }
    // Chassis seam and illuminated upper-edge guide.
    path([[-2.61,.60,z+s*.28],[-1.70,.60,z+s*.28],[-1.40,.44,z+s*.28]],.011,M.glow,root,'aft-trace');
    path([[1.13,.55,z+s*.27],[2.66,.39,z+s*.27],[2.87,.19,z+s*.27]],.014,M.glow,root,'front-trace');
    path([[1.18,-.56,z+s*.25],[2.36,-.57,z+s*.25],[2.70,-.45,z+s*.25]],.008,M.glowHot,root,'lower-trace');
    // Recessed side cavity and micro vent sets.
    for (let k=0;k<4;k++) {
      const x=-2.36+k*.23;
      cub(.075,.19,.03,x,.11,z+s*.22,M.black,root,'rear-vent',.15);
      cub(.022,.16,.035,x,.11,z+s*.241,k%2?M.glow:M.silver,root,'rear-rib',.15);
    }
    bladesAt(2.01,z+s*.23,root);
    for (let k=0;k<3;k++){
      hexBolt(-2.66+k*.52,.50,z+s*.28,.042);
      hexBolt(1.63+k*.44,.36,z+s*.27,.032);
      hexBolt(1.62+k*.38,-.53,z+s*.25,.036);
    }
    // Raised shroud over central gimbal, mounted as separately animated shell.
    const side=group(`ARTICULATED_SIDE_ARMOR_${s}`);side.position.z=s*.80;
    poly([[-1.1,.70],[-.79,.91],[-.30,1.01],[.30,.96],[.70,.68],[.62,.39],[.33,.29],[-.56,.34]],.08,s*0.01,M.armor,side,'dorsal-floating-shield');
    poly([[-1.01,.72],[-.72,.84],[-.27,.92],[.24,.88],[.58,.67],[.43,.59],[-.33,.61]],.03,s*.01+s*.085,M.armorLite,side,'dorsal-inset');
    poly([[-1.12,-.65],[-.56,-.83],[.27,-.79],[.80,-.55],[.53,-.40],[-.61,-.44]],.08,s*.01,M.armor,side,'ventral-floating-shield');
    poly([[-.89,-.63],[-.45,-.70],[.29,-.69],[.53,-.58],[.32,-.53],[-.55,-.55]],.03,s*.01+s*.07,M.blackGloss,side,'ventral-inset');
    for(let i=0;i<8;i++){
      const x=-.69+i*.16; const y=.78+.1*Math.cos(i*.43);
      cub(.065,.035,.015,x,y,s*.11,M.black,side,'dorsal-pins');
    }
    path([[-.75,.81,s*.12],[-.30,.87,s*.12],[.31,.83,s*.12]],.014,M.glow,side,'dorsal-illumination');
    exposed.sideGroups.push({group:side,side:s,baseZ:s*.80});
  }
  // Gimbal core. Every ring is a whole rigid transform with discrete cosmetic details.
  const gc=group('CORE_GIMBAL');gc.position.set(-.13,.09,0);
  const innerRotor=mesh(new THREE.IcosahedronGeometry(.43,2),M.core,gc,'luminous-icosahedral-heart');innerRotor.scale.set(1.22,.91,.89);
  const innerFacet=mesh(new THREE.IcosahedronGeometry(.29,1),M.coreInner,gc,'prismatic-inner-core');innerFacet.rotation.z=.39;
  mesh(new THREE.IcosahedronGeometry(.51,1),new THREE.MeshBasicMaterial({color:0x4aa0dc,transparent:true,opacity:.16,depthWrite:false}),gc,'outer-energy-halo');
  for (const side of [-1,1]) {
    const rA=group(`CIRCULAR_GIMBAL_${side}`,gc);rA.position.z=side*.58;rA.rotation.y=side*.15;
    torus(.68,.064,0,0,0,M.armorLite,rA,'major-gimbal',7,56);
    torus(.68,.016,0,0,side*.05,M.glow,rA,'gimbal-microtrace',6,80);
    for(let k=0;k<12;k++){
      const a=k*Math.PI*2/12;
      const n=cub(.13,.06,.09,Math.cos(a)*.68,Math.sin(a)*.68,side*.015,k%3===0?M.silver:M.blackGloss,rA,'gimbal-buckles');n.rotation.z=a+Math.PI/2;
      if(k%2===0){const o=cub(.045,.03,.03,Math.cos(a)*.68,Math.sin(a)*.68,side*.095,M.glowHot,rA,'gimbal-led');o.rotation.z=a+Math.PI/2;}
    }
    exposed.ringGroups.push({group:rA,type:'near',direction:side,baseRotY:side*.15});
    const rB=group(`COUNTER_ORBIT_${side}`,gc);rB.position.z=side*.89;rB.rotation.y=side*.35;
    torus(.91,.034,0,0,0,M.armorEdge,rB,'orbital-guide',5,78);
    for(let k=0;k<24;k++){
      const a=k*Math.PI/12;
      const ob=cub(k%3===0?.16:.06,.025,.035,Math.cos(a)*.91,Math.sin(a)*.91,0,k%3===0?M.armorLite:M.glow,rB,'orbital-tick');ob.rotation.z=a+Math.PI/2;
    }
    exposed.ringGroups.push({group:rB,type:'outer',direction:side,baseRotY:side*.35});
  }
  // Orthogonal orbital gyroscope shows true 3D depth when inspected from an angle.
  const rC=group('AXIAL_TILTED_HALO',gc);rC.rotation.y=Math.PI*.39;rC.rotation.x=.33;
  torus(.77,.024,0,0,0,M.dusk,rC,'axial-dark-shell',7,70);
  torus(.74,.014,0,0,0,M.glowHot,rC,'axial-purple-trace',6,70);
  for(let k=0;k<6;k++){const a=k*Math.PI/3;const o=cub(.13,.07,.08,.78*Math.cos(a),.78*Math.sin(a),0,M.armorLite,rC,'axial-connectors');o.rotation.z=a+Math.PI/2;}
  exposed.ringGroups.push({group:rC,type:'axial',direction:1,baseRotY:Math.PI*.39});
  // Gimbal restraint rails pass under rather than through the center.
  for(const s of [-1,1]){
    wire([-.99,.03,s*.70],[-.69,.66,s*.89],.047,M.silver,root,'core-pillar');
    wire([.48,.65,s*.90],[.86,.22,s*.72],.053,M.armorLite,root,'core-pillar');
    wire([-.85,-.56,s*.84],[.39,-.58,s*.85],.036,M.blackGloss,root,'under-pillar');
  }
  // Front crystalline focusing assembly along +X. Not a real-world barrel.
  const front=group('FOCUSING_PYLON');
  cylinder(.41,.48,2.10,10,2.34,-.07,0,M.black,'x',front,'central-pylon');
  cylinder(.31,.34,1.95,10,2.36,-.07,0,M.armorLite,'x',front,'precision-conduit');
  cylinder(.23,.25,2.05,10,2.38,-.07,0,M.glow,'x',front,'illuminated-spine');
  for (const x of [1.40,1.67,2.14,2.65,3.02,3.31]) {
    const t=torus(x>3?.37:.48,x>3?.045:.07,x,-.07,0,x===3.31?M.glow:M.armorEdge,front,'precision-collar',7,10);t.rotation.y=Math.PI/2;
    const glow=torus(x>3?.305:.41,.012,x+.025,-.07,0,M.glow,front,'precision-collar-trace',7,12);glow.rotation.y=Math.PI/2;
  }
  cylinder(.29,.32,.21,8,3.39,-.07,0,M.darkVoid,'x',front,'front-void');
  const oct=cylinder(.18,.18,.22,8,3.49,-.07,0,M.coreInner,'x',front,'central-focal-disc');oct.rotation.x=.33;
  // Convergent ribs at four quadrants, with angular cutouts and visible hinge structures.
  for(let i=0;i<4;i++){
    const a=Math.PI*2*i/4;
    const pivot=group(`FRONT_EXPANDING_FIN_${i}`,front);pivot.position.set(1.60,-.07,0);pivot.rotation.x=a;
    const blade=group(`front_fin_blade_${i}`,pivot);
    poly([[-.14,.48],[.19,.78],[1.14,.66],[1.79,.36],[1.68,.21],[.40,.36]],.16,-.085,M.armor,blade,'multi-angled-focusing-fin',.03);
    poly([[.20,.62],[.48,.67],[1.21,.55],[1.56,.38],[1.34,.35],[.47,.51]],.035,.09,M.armorLite,blade,'fin-inset',.012);
    path([[.38,.58,.13],[1.16,.50,.13],[1.55,.37,.13]],.017,M.glow,blade,'moving-fin-light');
    for(let k=0;k<4;k++)cub(.055,.055,.028,.41+k*.28,.48-.035*k,.14,M.black,blade,'moving-fin-dimple');
    hexBolt(.35,.55,.15,.035,blade);
    exposed.finParts.push({pivot,blade,index:i});
  }
  // Aft prism lattice and fins.
  for(const s of [-1,1]){
    poly([[-3.43,.19],[-3.26,.56],[-2.92,.62],[-2.73,.44],[-2.91,.16]],.15,s*.32,M.blackGloss,root,'aft-cutout');
    poly([[-3.20,.38],[-3.07,.53],[-2.91,.50],[-2.87,.41]],.07,s*.53,M.glow,root,'aft-energy-vents');
    for(let i=0;i<5;i++){
      const x=-3.25+i*.13;
      path([[x,-.08,s*.45],[x+.05,.025,s*.46]],.017,i%2?M.glowHot:M.silver,root,'aft-heat-ribs');
    }
  }
  // Grasp module: a fictional contoured suspended handle, without real mechanical trigger parts.
  const hold=group('LOWER_HOLDING_POD');hold.position.set(-1.53,-.45,0);
  poly([[-.25,-.04],[.45,-.04],[.30,-.28],[.08,-1.35],[-.33,-1.55],[-.58,-1.36],[-.43,-.38]],.62,-.31,M.blackGloss,hold,'holding-pod');
  for(const s of [-1,1]){
    poly([[-.25,-.27],[.26,-.27],[.10,-1.20],[-.24,-1.41],[-.45,-1.23]],.055,s*.33,M.carbon,hold,'pod-rubberized-panel');
    poly([[-.33,-1.32],[-.13,-1.46],[.09,-1.36],[.16,-1.25],[-.12,-1.24]],.07,s*.31,M.armorLite,hold,'pod-metal-heel');
    for(let k=0;k<8;k++){
      const y=-.50-k*.085;
      path([[-.31,y,s*.392],[.07,y+.025,s*.392]],.011,k%2?M.armorEdge:M.black,hold,'pod-texture');
    }
    path([[-.34,-.40,s*.41],[-.39,-.99,s*.41],[-.23,-1.22,s*.41]],.014,M.glow,hold,'pod-light');
  }
  // The control collar has no real-world firing mechanism; visual only.
  cylinder(.31,.40,.32,8,-1.5,-.49,0,M.armorEdge,'y',root,'hand-pod-link');
  // Dorsal crest with mechanical plates and energy conduit.
  poly([[-2.19,.71],[-1.89,.88],[-.89,.90],[-.49,.77],[.73,.81],[1.67,.65],[2.35,.54],[2.43,.67],[1.62,.88],[.71,.99],[-.51,.94],[-1.18,1.12],[-1.84,1.08]],.27,-.135,M.black,root,'dorsal-bridge');
  poly([[-1.78,.98],[-1.49,1.02],[-1.06,1.03],[-.85,.88],[-1.39,.91]],.21,-.105,M.armorLite,root,'sensor-housing');
  for(let k=0;k<11;k++)cub(.07,.028,.36,-.41+k*.24,.86+(k<4?.07:-.01),0,k%2?M.armorLite:M.blackGloss,root,'spine-armor-buckles');
  path([[-1.78,1.05,0],[-1.22,1.11,0],[-.77,1.01,0],[.72,.98,0],[1.77,.84,0]],.022,M.glow,root,'dorsal-energy-spine');
  const sensor=group('TOP_FOLDING_SENSOR');sensor.position.set(.81,.93,0);
  poly([[-.21,0],[.23,0],[.24,.21],[-.04,.31],[-.24,.19]],.29,-.145,M.armor, sensor,'upper-sensor');
  poly([[-.07,.17],[.11,.16],[.09,.24],[-.12,.24]],.015,.15,M.glow,sensor,'sensor-window');
  exposed.sensor=sensor;
  // Detailing along aft and forward underside: precision recesses.
  for(const s of [-1,1]){
    for(let k=0;k<8;k++){
      const x=-2.3+k*.31;
      cub(.16,.047,.05,x,-.56,s*.38,k%4===0?M.armorLite:M.blackGloss,root,'lower-array');
    }
    for(let k=0;k<7;k++){
      const x=1.24+k*.24;
      cub(.05,.07,.09,x,-.67,s*.36,k%3===0?M.glow:M.armorLite,root,'front-under-microfin',-.15);
    }
  }
  // Subtle decorative labeling on the outer aft shell, generated without external assets.
  const c=document.createElement('canvas');c.width=512;c.height=128;
  const ct=c.getContext('2d');ct.clearRect(0,0,512,128);ct.font='800 52px Arial';ct.fillStyle='#a8d8e9';ct.fillText('A R C  //  0 7',15,58);ct.font='22px monospace';ct.fillStyle='#4fc6d8';ct.fillText('RESONANT ARTIFACT    •    07',17,99);
  const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;
  const tm=new THREE.MeshBasicMaterial({map:tx,transparent:true,depthWrite:false,side:THREE.DoubleSide,opacity:.87});
  for(const s of [-1,1]){
    const label=mesh(new THREE.PlaneGeometry(.82,.205),tm,root,'unit-label');label.position.set(-2.07,.42,s*.78);label.rotation.y=s===1?0:Math.PI;
  }
  // Additive bloom-like glows implemented as sprites for no postprocessing dependency.
  const grad=document.createElement('canvas');grad.width=grad.height=128;const cx=grad.getContext('2d');
  const gr=cx.createRadialGradient(64,64,0,64,64,64);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.17,'rgba(115,242,255,.70)');gr.addColorStop(.46,'rgba(48,148,255,.20)');gr.addColorStop(1,'rgba(19,93,255,0)');cx.fillStyle=gr;cx.fillRect(0,0,128,128);
  const gt=new THREE.CanvasTexture(grad);
  function glowAt(parent,x,y,z,scale,opacity=0.67){const mat=new THREE.SpriteMaterial({map:gt,color:0x56ceff,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity});const o=new THREE.Sprite(mat);o.position.set(x,y,z);o.scale.set(scale,scale,1);parent.add(o);exposed.glowSprites.push(o);return o;}
  const coreGlow=glowAt(gc,0,0,.08,2.3,.46);
  const lensGlow=glowAt(root,3.53,-.07,0,1.15,.49);
  const apertureFx=group('FOCAL_PULSE_FX');apertureFx.position.set(3.6,-.07,0);
  for(let k=0;k<3;k++){
    const a=torus(.46+k*.13,.020,0,0,0,k===1?M.glowHot:M.glow,apertureFx,'focal-expansion',5,80);a.rotation.y=Math.PI/2;a.visible=false;exposed.torusPulses.push(a);
  }
  const pulseFlash=glowAt(apertureFx,0,0,0,2.2,0);
  exposed.fx={innerRotor,innerFacet,coreGlow,lensGlow,apertureFx,pulseFlash,coreGroup:gc};
  const point=new THREE.PointLight(0x4cd9ff,3,5.3,2);point.position.set(-.13,.09,0);root.add(point);exposed.lights.push(point);
  const point2=new THREE.PointLight(0x746bff,1.65,3.4,2);point2.position.set(3.53,-.07,0);root.add(point2);exposed.lights.push(point2);
  // Expose exact named part handles for future game integration.
  exposed.partNames=['CORE_GIMBAL','CIRCULAR_GIMBAL_1','COUNTER_ORBIT_1','AXIAL_TILTED_HALO','FOCUSING_PYLON','FRONT_EXPANDING_FIN_0','ARTICULATED_SIDE_ARMOR_1','TOP_FOLDING_SENSOR','LOWER_HOLDING_POD'];
  return exposed;
}

function animateArcRing(w, time, dt, energy, burst, active, reducedMotion=false) {
  const st=active?1:.32;
  const pulse=Math.sin(time*2.4)*.5+.5;
  const q=energy;
  for(const {group,type,direction,baseRotY} of w.ringGroups){
    const v=type==='near'? .65 : type==='outer'? -.20:.23;
    if(type==='axial'){
      group.rotation.z=reducedMotion?0:time*(v+q*.64);
      group.rotation.y=baseRotY+Math.sin(time*.48)*.08;
    } else {
      group.rotation.z=reducedMotion?0:direction*time*(v+q*.75);
      group.rotation.y=baseRotY+(reducedMotion?0:Math.sin(time*.65+direction)*.065);
    }
  }
  for(const {group,side,baseZ} of w.sideGroups){
    group.position.z=baseZ+side*.22*q;
    group.rotation.y=side*.055*q;
  }
  for(const {blade} of w.finParts){blade.position.y=.17*q;blade.rotation.z=.125*q;}
  w.sensor.rotation.z=-.28*q;
  const intensity=st*(1+q*1.55)+burst*2.6;
  w.materials.core.emissiveIntensity=1.45+intensity*1.6;
  w.materials.glow.emissiveIntensity=.70+intensity*1.65;
  w.materials.glowHot.emissiveIntensity=.9+intensity*1.0;
  const core=w.fx.innerRotor;
  core.rotation.x=reducedMotion?0:time*.18;
  core.rotation.y=reducedMotion?0:time*.20;
  core.rotation.z=reducedMotion?0:time*.13;
  const cs=1+(reducedMotion?0:Math.sin(time*2.35)*.018)+q*.07+burst*.15;
  core.scale.set(1.22*cs,.91*cs,.89*cs);
  w.fx.innerFacet.rotation.y=reducedMotion?.4:time*-.61;
  w.fx.innerFacet.rotation.z=reducedMotion?.39:time*.46;
  w.fx.coreGlow.material.opacity=(.22+pulse*.07+q*.20+burst*.33)*st;
  w.fx.coreGlow.scale.setScalar(2.28+q*.42+burst*.8);
  w.fx.lensGlow.material.opacity=(.22+q*.28+burst*.36)*st;
  w.fx.lensGlow.scale.setScalar(1.15+q*.15+burst*1.7);
  w.fx.pulseFlash.material.opacity=burst*.82;
  w.fx.pulseFlash.scale.setScalar(1.1+burst*3.2);
  for(let k=0;k<w.torusPulses.length;k++){
    const obj=w.torusPulses[k];obj.visible=burst>.03;
    obj.scale.setScalar(1+(1-burst)*(1.5+k*.3));
  }
  w.lights[0].intensity=(.8+q*2.4+burst*6)*st;
  w.lights[1].intensity=(.35+q*2.5+burst*6)*st;
}

/*
 * AETHER/09 — PHASE ARCHIVE
 * Original, entirely fictional science-fiction energy artifact.
 * The mesh contains no simulation of real-world firearm mechanisms.
 * Public API: buildAether09(THREE) → { root, update, setPalette, setExploded,
 *                                       setCharged, setXray, dispose, stats }
 * Coordinates: longitudinal +X, up +Y, front-facing showcase side +Z.
 */
function buildAether09(THREE) {
  const root = new THREE.Group();
  root.name = 'AETHER-09 / Fictional Phase Device';
  const moving = [], translucentArmor = [], glowingMats = [], stripMats = [], panels = [];
  const palette = {
    ice: { main: 0x67dcff, deep: 0x087abb, soft: 0x3dc9fd, tip: 0xf4fbff },
    amber: { main: 0xffbe68, deep: 0xc86412, soft: 0xf59d43, tip: 0xfff1d4 },
    violet: { main: 0xb997ff, deep: 0x793bd8, soft: 0xa27dff, tip: 0xf5eaff }
  };
  let colors = palette.ice;
  let charge = 0, chargeTarget = 1, explosion = 0, explosionTarget = 0, xray = false, elapsed = 0;
  const baseMaterials = [];
  const M = {
    frame: new THREE.MeshStandardMaterial({color:0x131d2b, metalness:.89, roughness:.29}),
    black: new THREE.MeshStandardMaterial({color:0x070d16, metalness:.61, roughness:.40}),
    armor: new THREE.MeshPhysicalMaterial({color:0x25364b, metalness:.79, roughness:.27, clearcoat:.55, clearcoatRoughness:.21}),
    armorLight: new THREE.MeshPhysicalMaterial({color:0x41566b, metalness:.86, roughness:.29, clearcoat:.36}),
    inset: new THREE.MeshStandardMaterial({color:0x0c1b2a, metalness:.73, roughness:.35}),
    gunmetal: new THREE.MeshStandardMaterial({color:0x506579, metalness:.93, roughness:.24}),
    silver: new THREE.MeshStandardMaterial({color:0x8ca6b7, metalness:.91, roughness:.22}),
    chrome: new THREE.MeshPhysicalMaterial({color:0xc0d0dc, metalness:.96, roughness:.17, clearcoat:.35}),
    brass: new THREE.MeshPhysicalMaterial({color:0xb88c56, metalness:.88, roughness:.26, clearcoat:.2}),
    brassLit: new THREE.MeshStandardMaterial({color:0xefbd77, metalness:.78, roughness:.23}),
    grip: new THREE.MeshStandardMaterial({color:0x101a25, metalness:.23, roughness:.72}),
    rubber: new THREE.MeshStandardMaterial({color:0x0a111b, metalness:.07, roughness:.9}),
    vent: new THREE.MeshStandardMaterial({color:0x05090e, metalness:.38, roughness:.5}),
    glass: new THREE.MeshPhysicalMaterial({color:0x90c7e3, metalness:.12, roughness:.13, transparent:true, opacity:.38, clearcoat:1, clearcoatRoughness:.09, depthWrite:false, side:THREE.DoubleSide}),
    core: new THREE.MeshBasicMaterial({color:colors.main, blending:THREE.AdditiveBlending, transparent:true, opacity:.96, depthWrite:false}),
    charge: new THREE.MeshBasicMaterial({color:colors.main, blending:THREE.AdditiveBlending, transparent:true, opacity:.72, depthWrite:false}),
    filament: new THREE.MeshBasicMaterial({color:colors.tip}),
    plasmaGlass: new THREE.MeshPhysicalMaterial({color:0x3a9cc4, metalness:.15, roughness:.12, transparent:true, opacity:.3, clearcoat:1, depthWrite:false}),
    accent: new THREE.MeshStandardMaterial({color:colors.deep, metalness:.55, roughness:.24, emissive:colors.deep, emissiveIntensity:1.4}),
  };
  [M.frame,M.armor,M.armorLight,M.inset,M.gunmetal,M.silver,M.chrome,M.brass,M.brassLit].forEach(m => baseMaterials.push(m));
  glowingMats.push(M.core, M.charge, M.filament, M.accent);
  translucentArmor.push(M.armor, M.armorLight, M.frame, M.inset, M.gunmetal);
  const makeMat = (kind='core', alpha=.8) => {
    const m = new THREE.MeshBasicMaterial({color:colors.main, transparent:true, opacity:alpha, depthWrite:false, blending:THREE.AdditiveBlending, side:THREE.DoubleSide});
    if (kind === 'strip') stripMats.push(m); else glowingMats.push(m);
    return m;
  };

  const mesh = (g, mat, parent=root, name='') => {const obj=new THREE.Mesh(g,mat); obj.name=name; parent.add(obj); return obj;};
  const group = (parent=root,name='') => {const g=new THREE.Group();g.name=name;parent.add(g);return g;};
  function polygon(points, depth, mat, parent=root, z=0, bevel=.035, name='') {
    const s = new THREE.Shape();
    points.forEach(([x,y],i) => i ? s.lineTo(x,y) : s.moveTo(x,y));
    s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, {depth, bevelEnabled:bevel>0, bevelThickness:bevel, bevelSize:bevel, bevelSegments:2, curveSegments:2, steps:1});
    geo.translate(0,0,-depth/2);
    const obj=mesh(geo,mat,parent,name);obj.position.z=z;return obj;
  }
  function polygonWithHole(points, depth, mat, parent, z, hx, hy, hr, bevel=.035, name='') {
    const shape=new THREE.Shape();
    points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));
    shape.closePath();
    const hole=new THREE.Path();
    hole.absarc(hx,hy,hr,0,Math.PI*2,false);
    shape.holes.push(hole);
    const geo=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:3,curveSegments:32,steps:1});
    geo.translate(0,0,-depth/2);
    const obj=mesh(geo,mat,parent,name);obj.position.z=z;return obj;
  }
  function box(w,h,d,x,y,z,mat,parent=root,name='') {
    const o=mesh(new THREE.BoxGeometry(w,h,d),mat,parent,name);o.position.set(x,y,z);return o;
  }
  function beam(x1,y1,z1,x2,y2,z2,width,depth,mat,parent=root) {
    const a=new THREE.Vector3(x1,y1,z1), b=new THREE.Vector3(x2,y2,z2), mid=a.clone().add(b).multiplyScalar(.5);
    const o=mesh(new THREE.BoxGeometry(width,a.distanceTo(b),depth),mat,parent);
    o.position.copy(mid);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.sub(a).normalize());return o;
  }
  function cylinder(radiusTop,radiusBottom,length,x,y,z,mat,parent=root,sides=24) {
    const obj=mesh(new THREE.CylinderGeometry(radiusTop,radiusBottom,length,sides),mat,parent);
    obj.rotation.z=Math.PI/2;obj.position.set(x,y,z);return obj;
  }
  function ring(r,t,x,y,z,mat,parent=root,segments=64) {
    const o=mesh(new THREE.TorusGeometry(r,t,9,segments),mat,parent);
    o.rotation.y=Math.PI/2;o.position.set(x,y,z);return o;
  }
  function dot(x,y,z,r,mat,parent=root,seg=12) {
    const o=mesh(new THREE.SphereGeometry(r,seg,8),mat,parent);o.position.set(x,y,z);return o;
  }
  function tube(points,r,mat,parent=root,sides=6) {
    const path = new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    const o=mesh(new THREE.TubeGeometry(path,Math.max(12,points.length*7),r,sides,false),mat,parent);return o;
  }
  function bolt(x,y,z,parent=root,side=1,r=.049) {
    const m=mesh(new THREE.CylinderGeometry(r,r,.025,6),M.brass,parent);
    m.rotation.x=Math.PI/2;m.position.set(x,y,z);m.rotation.z=Math.PI/6;
    const c=box(r*.93,.012,.01,x,y,z+side*.021,M.black,parent);c.rotation.z=-.55;
    return m;
  }
  function cornerFacet(x,y,z,s=.12,mat=M.brass,parent=root) {
    return polygon([[x-s,y],[x,y+s*.75],[x+s,y],[x,y-s*.75]],.018,mat,parent,z,.003);
  }
  function labelTexture(text, sub, fg='#e5f2ff') {
    const c=document.createElement('canvas');c.width=1024;c.height=256;
    const q=c.getContext('2d');
    q.clearRect(0,0,c.width,c.height);
    q.fillStyle=fg;q.font='700 74px Arial, sans-serif';q.letterSpacing='7px';q.fillText(text,24,112);
    q.font='600 32px monospace';q.letterSpacing='5px';q.fillStyle='#8faabc';q.fillText(sub,27,183);
    q.fillStyle='#b99061';q.fillRect(25,209,680,4);
    q.fillStyle='#d9b87a';q.fillRect(25,209,115,7);
    const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;
    return tex;
  }
  function decal(tex,x,y,z,w,h,side=1,parent=root) {
    const o=mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,side:THREE.DoubleSide}),parent);
    o.position.set(x,y,z);if(side===-1)o.rotation.y=Math.PI;return o;
  }
  function spriteGlow(size,color=0x75e6ff,opacity=.5,parent=root) {
    const c=document.createElement('canvas');c.width=128;c.height=128;const q=c.getContext('2d');
    const g=q.createRadialGradient(64,64,0,64,64,63);
    g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.1,'rgba(190,243,255,.9)');g.addColorStop(.36,'rgba(76,189,255,.37)');g.addColorStop(1,'rgba(30,119,220,0)');
    q.fillStyle=g;q.fillRect(0,0,128,128);
    const mat=new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),color,transparent:true,opacity,blending:THREE.AdditiveBlending,depthWrite:false});
    const sp=new THREE.Sprite(mat);sp.scale.set(size,size,1);parent.add(sp);glowingMats.push(mat);return sp;
  }

  // ══ INTERIOR / STRUCTURAL SPINE ══════════════════════════════════════════
  const skeleton=group(root,'00 / forged monocoque');
  polygon([[-4.46,.18],[-3.91,.51],[-2.92,.57],[-2.47,.38],[1.88,.39],[2.69,.17],[3.06,-.06],[2.48,-.24],[1.50,-.4],[-2.31,-.38],[-2.94,-.52],[-3.95,-.35],[-4.51,-.10]],.64,M.frame,skeleton,0,.095,'Forged inner core');
  polygon([[-4.31,.14],[-3.72,.39],[-2.48,.34],[-1.84,.20],[1.89,.22],[2.51,.03],[2.47,-.17],[1.50,-.27],[-2.83,-.27],[-3.85,-.18]],.72,M.black,skeleton,0,.065,'Energy isolation enclosure');
  box(6.9,.105,.50,-.64,.46,0,M.chrome,skeleton);
  box(7,.07,.38,-.69,-.46,0,M.armorLight,skeleton);
  for(let i=0;i<34;i++) {
    const x=-3.65+i*.175;
    box(.072,.062,.62,x,.48,0,i%5===0?M.brass:M.inset,skeleton);
  }
  for(let side of [-1,1]) {
    const z=side*.352;
    // Inner axial power rails are visible in exploded assembly.
    box(5.9,.10,.075,-.74,-.20,z,M.gunmetal,skeleton);
    box(5.6,.040,.043,-.69,-.148,z+side*.056,M.accent,skeleton);
    for(let i=0;i<15;i++) {
      const x=-2.63+i*.285;
      box(.045,.31,.06,x,.02,z+side*.045,i%4===0?M.brass:M.armor,skeleton);
    }
  }

  // ══ REAR TAIL / FIELD STABILIZER ════════════════════════════════════════
  const rear=group(root,'01 / stabilizer tail');
  polygon([[-4.81,.26],[-4.45,.60],[-3.87,.75],[-3.53,.66],[-3.64,.38],[-4.09,.34],[-4.48,.04],[-4.84,-.06]],.88,M.armor,rear,0,.065,'Rear fin armor');
  polygon([[-4.83,.28],[-4.54,.42],[-4.14,.38],[-4.18,.13],[-4.61,-.08],[-4.86,-.02]],.93,M.inset,rear,0,.027);
  polygon([[-4.48,.47],[-4.08,.70],[-3.63,.66],[-3.81,.54],[-4.24,.52]],.94,M.brass,rear,0,.02);
  polygon([[-4.9,-.19],[-4.61,-.31],[-3.85,-.35],[-3.38,-.57],[-3.58,-.75],[-4.21,-.64],[-4.84,-.48]],.80,M.armor,rear,0,.045);
  for(let side of [-1,1]){
    polygon([[-4.62,.16],[-4.42,.34],[-3.91,.31],[-3.86,.15],[-4.20,.08]],.07,M.brass,rear,side*.50,.015);
    polygon([[-4.59,.14],[-4.37,.27],[-4.05,.25],[-4.11,.15]],.035,M.black,rear,side*.55,.006);
    for(let i=0;i<4;i++){
      const x=-4.37+i*.18;
      beam(x,-.43,side*.435,x+.095,-.56,side*.435,.026,.025,M.brass,rear);
    }
    bolt(-4.57,.39,side*.49,rear,side);bolt(-3.83,.56,side*.49,rear,side);
  }
  // rear vent, sci-fi optical nodes
  for(let i=0;i<7;i++) box(.035,.12,.08,-4.76+i*.12,-.315,-.02,M.black,rear);
  ring(.19,.045,-4.66,.03,0,M.brass,rear,32);
  ring(.133,.022,-4.70,.03,0,M.core,rear,32);
  dot(-4.73,.03,0,.10,M.core,rear,20);

  // ══ ANATOMICAL GRIP / FLOATING TRIGGER-GUARD-LIKE FRAME ════════════════
  // Stylized hand hold, with no realistic moving trigger or firearm internals.
  const grip=group(root,'02 / ergonomic control spar');
  polygon([[-2.52,-.28],[-1.58,-.27],[-1.33,-.54],[-1.59,-1.18],[-1.90,-1.86],[-2.30,-1.93],[-2.67,-1.69],[-2.34,-.92]],.65,M.armor,grip,0,.09,'Ergonomic hilt');
  polygon([[-2.48,-.48],[-1.72,-.47],[-1.66,-.66],[-1.99,-1.53],[-2.20,-1.72],[-2.49,-1.55],[-2.19,-.86]],.75,M.grip,grip,0,.038);
  polygon([[-2.32,-1.73],[-1.90,-1.65],[-1.77,-1.84],[-2.04,-2.09],[-2.50,-1.95],[-2.58,-1.78]],.75,M.gunmetal,grip,0,.052);
  polygon([[-2.45,-1.87],[-2.04,-1.99],[-2.10,-2.09],[-2.48,-1.98]],.79,M.brass,grip,0,.015);
  for(let side of [-1,1]) {
    polygon([[-2.40,-.65],[-1.86,-.63],[-1.97,-.95],[-2.27,-1.50],[-2.48,-1.49],[-2.23,-.92]],.015,M.black,grip,side*.403,.02);
    for(let i=0;i<11;i++){
      let y=-.76-i*.078;let x=-2.22-(Math.abs(y)-.8)*.22;
      beam(x-.12,y,side*.431,x+.20,y+.045,side*.431,.020,.009,i%4===0?M.brass:M.armorLight,grip);
    }
    polygon([[-2.37,-1.53],[-2.17,-1.66],[-2.02,-1.56],[-2.18,-1.45]],.022,M.brass,grip,side*.425,.008);
  }
  const handleLoop=group(root,'03 / control bridge');
  // Sculpted, non-functional control loop supports the futuristic silhouette.
  tube([[-1.34,-.37,.0],[-1.03,-.52,.0],[-.93,-.96,.0],[-1.06,-1.15,.0],[-1.40,-1.17,.0],[-1.66,-1.10,.0]],.091,M.gunmetal,handleLoop,8);
  tube([[-1.38,-.47,0],[-1.15,-.63,0],[-1.12,-.96,0],[-1.29,-1.05,0]],.025,M.brass,handleLoop);
  polygon([[-1.50,-.44],[-1.16,-.48],[-1.07,-.65],[-1.44,-.70]],.42,M.brass,handleLoop,0,.03);
  polygon([[-1.30,-.56],[-1.14,-.58],[-1.24,-.85],[-1.35,-.91]],.43,M.black,handleLoop,0,.024);

  // ══ UNDER-SLUNG CRYOGENIC ENERGY CAPSULES ════════════════════════════
  const cell=group(root,'04 / phase reservoir');
  polygon([[-.88,-.34],[1.72,-.33],[1.56,-.68],[1.10,-.98],[-.33,-1.06],[-.86,-.82]],.57,M.frame,cell,0,.065);
  polygon([[-.68,-.48],[1.45,-.46],[1.27,-.71],[-.42,-.80]],.65,M.black,cell,0,.028);
  for(let side of [-1,1]){
    const z=side*.32;
    polygon([[-.80,-.47],[1.46,-.45],[1.22,-.83],[-.44,-.90]],.07,M.armorLight,cell,side*.37,.035,'Capacitor skirt');
    polygon([[-.65,-.53],[1.20,-.52],[1.05,-.73],[-.40,-.76]],.025,M.inset,cell,side*.42,.02);
    const m=makeMat('strip',.8);
    beam(-.38,-.715,side*.449,.91,-.705,side*.449,.022,.016,m,cell);
    for(let i=0;i<6;i++){
      const x=-.36+i*.246;
      beam(x,-.54,side*.456,x-.08,-.70,side*.456,.031,.026,i%3===0?M.brass:M.gunmetal,cell);
    }
    bolt(-.66,-.65,side*.43,cell,side);bolt(1.27,-.62,side*.43,cell,side);
  }
  for(let k=0;k<3;k++){
    const z=(k-1)*.19;
    cylinder(.11,.11,1.70,.24,-.93,z,M.glass,cell,16);
    cylinder(.067,.067,1.69,.24,-.93,z,M.core,cell,12);
    for(let j=0;j<8;j++) ring(.115,.014,-.45+j*.19,-.93,z,j%3===0?M.brass:M.silver,cell,18);
  }
  for(let side of [-1,1]){
    tube([[.1,-.95,side*.35],[.61,-1.13,side*.3],[1.1,-1.03,side*.25],[1.63,-.43,side*.29]],.039,M.brass,cell);
    dot(.6,-1.12,side*.3,.076,M.gunmetal,cell);
  }

  // ══ CENTER ENERGY ENGINE / SUSPENDED REACTOR ══════════════════════════
  const engine=group(root,'05 / rotating phase chamber');
  polygon([[-1.17,.18],[-.79,.87],[.52,.94],[1.17,.48],[1.48,.11],[1.26,-.17],[.93,-.30],[-.77,-.31]],.63,M.black,engine,0,.044,'Primary inner engine cavity');
  // Six stacked concentric rings with an offset-axis crystalline chamber.
  for(const x of [-.82,-.56,-.24,.16,.53,.91]){
    ring(.408,x===-.82||x===.91?.071:.034,x,.18,0,x===-.82||x===.91?M.brass:M.gunmetal,engine,64);
    ring(.344,.018,x+.014,.18,0,M.core,engine,64);
  }
  const engineRotor=group(engine,'Animated floating gyroscopic phase hoops');
  for(let i=0;i<3;i++){
    const hoop=group(engineRotor,'Gyro hoop '+i);
    ring(.52,.036,.05,.18,0,i===1?M.brass:M.chrome,hoop,80);
    ring(.55,.012,.05,.18,0,M.core,hoop,80);
    hoop.rotation.z=i*(Math.PI/3)+.14;
    hoop.rotation.y=i*Math.PI/3;
    moving.push({type:'rotor',obj:hoop,index:i});
  }
  cylinder(.24,.24,1.56,.06,.18,0,M.plasmaGlass,engine,30);
  cylinder(.135,.135,1.61,.06,.18,0,M.core,engine,22);
  for(let k=0;k<13;k++){
    let x=-.68+k*.122;
    ring(.177,.016,x,.18,0,k%4===0?M.brass:M.filament,engine,32);
  }
  // Radial faceted engine retainer.
  for(let i=0;i<8;i++){
    let a=i*Math.PI/4;
    const y=.18+Math.cos(a)*.52,z=Math.sin(a)*.52;
    const y2=.18+Math.cos(a)*.39,z2=Math.sin(a)*.39;
    beam(-.66,y,z,.90,y,z,.047,.041,M.brass,engine);
    beam(-.46,y2,z2,.69,y2,z2,.022,.024,M.accent,engine);
    dot(-.64,y,z,.053,M.chrome,engine);
  }
  const engineAura=spriteGlow(1.80,colors.main,.22,engine);engineAura.position.set(.08,.18,.0);

  // ══ UPPER ARMOR / FLOATING BLADE-LIKE CREST ═════════════════════════════
  const crown=group(root,'06 / dorsal antenna ridge');
  polygon([[-3.86,.64],[-3.20,.84],[-2.63,.82],[-2.30,.73],[-.82,.75],[-.30,1.04],[.91,1.08],[1.70,.85],[2.60,.80],[3.18,.58],[3.08,.43],[1.78,.60],[.80,.78],[-.32,.74],[-2.41,.59],[-3.19,.63]],.70,M.frame,crown,0,.055,'Dorsal arched spine');
  polygon([[-3.59,.77],[-2.71,.88],[-2.50,.78],[-.50,.80],[-.20,1.08],[.92,1.12],[1.56,.93],[2.60,.87],[3.01,.69],[2.08,.74],[1.44,.82],[.63,.94],[-.30,.85],[-2.48,.69]],.59,M.armorLight,crown,0,.045);
  polygon([[-2.68,.88],[-.47,.90],[-.25,1.09],[.85,1.16],[1.41,.96],[2.38,.94],[2.72,.82],[1.29,.85],[.75,1.01],[-.19,.93],[-2.45,.79]],.22,M.brass,crown,0,.020);
  polygon([[-2.2,.93],[-.47,.94],[-.23,1.02],[.55,1.08],[1.15,.98],[2.09,.97]],.07,M.black,crown,0,.015);
  for(let side of [-1,1]){
    for(let i=0;i<20;i++){
      let x=-2.30+i*.221;
      let y= x<-.2?.945: x<.7?1.02: x<1.5?.98:.88;
      const item=box(.082,.012,.027,x,y,side*.40,i%4===0?M.brass:M.gunmetal,crown);
      item.rotation.z=.07;
    }
    const fiber=makeMat('strip',.85);
    tube([[-3.12,.70,side*.371],[-2.12,.75,side*.371],[-.42,.84,side*.371],[.38,1.02,side*.371],[1.17,.94,side*.371],[2.75,.75,side*.371]],.020,fiber,crown,5);
  }
  for(let i=0;i<11;i++){
    const x=-2.14+i*.43;
    box(.037,.125,.59,x,.76,0,i%3===0?M.brass:M.inset,crown);
  }
  // rear top holographic uplink node
  polygon([[-3.43,.77],[-3.11,1.18],[-2.77,1.26],[-2.63,.93]],.31,M.frame,crown,0,.034);
  polygon([[-3.22,1.02],[-3.00,1.27],[-2.80,1.22],[-2.91,1.00]],.32,M.brass,crown,0,.009);
  for(let side of [-1,1]) tube([[-3.23,1.03,side*.172],[-3.03,1.20,side*.172],[-2.88,1.18,side*.172]],.014,M.core,crown);

  // ══ OUTBOARD ARMOR CASINGS / EXPLODED VIEW ═════════════════════════════
  const serial = labelTexture('AETHER / 09', 'PHASE  //  0X-A9  ·  FIELD DIVISION');
  const diag = labelTexture('NOVA  SYSTEMS', 'A-09  /  SYNTHETIC ENERGY PLATFORM', '#c8dbe6');
  for(let side of [-1,1]){
    const shell=group(root,side===1?'07 / starboard modular armor':'08 / port modular armor');
    shell.userData.initialZ=side*.0;
    panels.push({obj:shell,side});
    const zz=side*.51;
    // Independent upper and aft plates compose the highly faceted hero silhouette.
    polygon([[-3.57,.52],[-2.81,.57],[-2.54,.35],[-1.22,.32],[-1.02,.09],[-1.63,-.13],[-2.24,-.14],[-2.49,.04],[-3.21,.14],[-3.53,.29]],.17,M.armor,shell,zz,.065,'Tail cheek armor');
    polygon([[-3.25,.38],[-2.88,.46],[-2.65,.32],[-1.59,.27],[-1.37,.10],[-1.69,.00],[-2.49,.03]],.03,M.inset,shell,side*.62,.024);
    polygon([[-3.22,.39],[-2.78,.49],[-2.61,.35],[-2.54,.35],[-2.83,.51],[-3.31,.46]],.04,M.brass,shell,side*.65,.015);
    polygonWithHole([[-.98,.35],[-.59,.82],[.55,.84],[1.13,.53],[1.45,.32],[1.27,-.13],[.91,-.28],[-.59,-.24],[-.87,-.06]],.19,M.armor,shell,zz,.08,.20,.326,.045,'Reactor outer shroud / genuine through-hole');
    polygon([[-.79,.38],[-.47,.69],[.53,.73],[1.05,.44],[1.12,.32],[.76,.39],[.39,.56],[-.37,.56]],.028,M.armorLight,shell,side*.633,.025);
    polygon([[-.70,-.05],[-.45,-.17],[.94,-.17],[1.13,-.06],[.82,-.03],[-.18,-.04]],.027,M.brass,shell,side*.647,.014);
    // Deliberately cut-out chamber aperture: not a painted-on circle.
    // The opening is a real mesh cut-out, so the internal spinning lattice
    // remains visible through the shroud rather than being a painted detail.
    const apertureGlass=mesh(new THREE.CircleGeometry(.315,64),M.plasmaGlass,shell);
    apertureGlass.position.set(.08,.20,side*.445);
    const faceRing=mesh(new THREE.TorusGeometry(.332,.028,8,66),M.brass,shell);
    faceRing.position.set(.08,.20,side*.687);
    const lum=mesh(new THREE.TorusGeometry(.285,.012,8,66),M.core,shell);
    lum.position.set(.08,.20,side*.709);
    for(let i=0;i<12;i++){
      const a=i*Math.PI/6;
      const y=.20+Math.cos(a)*.345,x=.08+Math.sin(a)*.345;
      const d=box(.046,.018,.02,x,y,side*.734,i%3===0?M.brass:M.silver,shell);d.rotation.z=-a;
    }
    // Front sloped shock-proof slabs.
    polygon([[1.40,.42],[2.52,.50],[3.40,.31],[3.85,.12],[3.74,-.03],[2.94,-.18],[1.79,-.17],[1.46,.01]],.18,M.armor,shell,side*.51,.051,'Forward cheek plating');
    polygon([[1.60,.30],[2.48,.38],[3.17,.21],[3.38,.11],[2.51,.18],[1.77,.16]],.032,M.inset,shell,side*.63,.019);
    polygon([[2.02,-.09],[2.99,-.08],[3.50,.03],[3.62,.11],[3.65,.00],[2.98,-.20],[2.0,-.19]],.037,M.brass,shell,side*.62,.012);
    // Staggered vent slats and their recessed black backing.
    polygon([[1.58,.03],[2.96,.02],[2.96,.13],[1.58,.17]],.029,M.vent,shell,side*.64,.008);
    for(let i=0;i<9;i++) {
      let x=1.72+i*.127;
      beam(x,.055,side*.668,x+.09,.142,side*.668,.033,.015,i%3===0?M.brass:M.gunmetal,shell);
    }
    // Decorative embossed side fins and asymmetric chamfered accents.
    polygon([[-3.46,.18],[-2.85,.10],[-2.51,-.08],[-3.07,-.03]],.034,M.brass,shell,side*.63,.008);
    polygon([[.97,.55],[1.34,.31],[1.39,.05],[1.53,.22],[1.56,.45]],.035,M.brass,shell,side*.654,.012);
    polygon([[2.77,.42],[3.48,.30],[3.70,.13],[3.37,.20]],.029,M.brass,shell,side*.641,.009);
    for(const [x,y] of [[-3.33,.26],[-2.53,.25],[-1.27,.14],[-.63,.67],[.84,.61],[1.25,-.07],[1.70,.31],[3.34,.22]]) bolt(x,y,side*.658,shell,side,.046);
    decal(serial,-2.30,.16,side*.676,1.30,.33,side,shell);
    decal(diag,2.31,.285,side*.676,1.25,.26,side,shell);
    // This small transparent optic remains visible in every color scheme.
    box(.58,.045,.026,-3.12,-.025,side*.676,M.glass,shell);
    const sideStrip=makeMat('strip',.77);
    tube([[1.72,-.205,side*.665],[2.73,-.214,side*.666],[3.41,-.052,side*.667]],.016,sideStrip,shell);
  }

  // ══ FOREFOCUS / RADIAL IRIS & QUAD REACTOR PETALS ════════════════════
  const focus=group(root,'09 / ion focus chamber');
  cylinder(.275,.312,1.96,3.64,.00,0,M.frame,focus,36);
  cylinder(.208,.21,2.11,3.70,0,0,M.gunmetal,focus,40);
  cylinder(.142,.143,2.12,3.72,0,0,M.core,focus,40);
  cylinder(.095,.095,2.27,3.80,0,0,M.filament,focus,20);
  for(let i=0;i<12;i++){
    const x=2.80+i*.17;
    ring(.315,i%4===0?.065:.021,x,0,0,i%4===0?M.brass:M.chrome,focus,46);
    ring(.25,.012,x+.017,0,0,M.charge,focus,46);
  }
  const focusingGlobe = dot(4.92,0,0,.22,M.core,focus,28);
  const fieldGlow=spriteGlow(1.45,colors.main,.30,focus);fieldGlow.position.set(4.96,0,0);
  const fieldGlow2=spriteGlow(.60,colors.main,.36,focus);fieldGlow2.position.set(4.96,0,0);
  for(let i=0;i<4;i++){
    const a=i*Math.PI/2;
    const petal=group(focus,'Iris focus petal '+i);
    petal.rotation.x=a;
    polygon([[2.74,.27],[3.37,.55],[4.64,.49],[5.06,.36],[5.19,.20],[4.55,.21],[3.31,.30]],.19,M.armor,petal,0,.046);
    polygon([[2.97,.37],[3.49,.53],[4.53,.46],[4.88,.32],[4.30,.39],[3.42,.44]],.22,M.armorLight,petal,0,.018);
    polygon([[3.19,.47],[3.57,.53],[4.54,.47],[4.75,.39],[3.75,.47]],.04,M.brass,petal,.121,.012);
    polygon([[3.05,.32],[4.36,.30],[4.84,.25],[4.45,.31],[3.32,.38]],.031,M.black,petal,.125,.009);
    tube([[3.21,.322,.144],[3.66,.322,.147],[4.40,.278,.147],[4.77,.249,.145]],.019,M.core,petal);
    for(let j=0;j<8;j++){
      let x=3.34+j*.181;
      let y=.38+Math.max(0,.04-Math.abs(x-3.9)*.03);
      box(.035,.10,.034,x,y,.146,j%3===0?M.brass:M.gunmetal,petal);
    }
    for(let p of [[3.17,.38],[4.65,.35]]) bolt(p[0],p[1],.152,petal,1,.038);
    moving.push({type:'petal',obj:petal,index:i,angle:a});
  }
  // Floating concentric forefocus loops are intentionally non-mechanical.
  const outerLoop=group(focus,'Animated concentric field loop');
  for(let i=0;i<3;i++) {
    const x=4.59+i*.19;
    ring(.35+i*.045,.015,x,0,0,i===1?M.brass:M.core,outerLoop,60);
  }
  moving.push({type:'field',obj:outerLoop});
  for(let i=0;i<6;i++){
    const a=i*Math.PI/3;
    tube([[2.65,.33*Math.cos(a),.33*Math.sin(a)],[2.85,.43*Math.cos(a),.43*Math.sin(a)],[3.10,.39*Math.cos(a),.39*Math.sin(a)]],.055,M.brass,focus);
  }

  // ══ SMALL PRECISION DETAILS: fasteners, vents, interconnects, etching ═══
  const precision=group(root,'10 / precision fasteners and inner piping');
  for(let side of [-1,1]){
    for(let k=0;k<10;k++){
      const x=-3.50+k*.60;
      const b=box(.17,.024,.024,x,.512,side*.36,k%3===0?M.brass:M.gunmetal,precision);
      b.rotation.z=k%2?.19:-.16;
    }
    tube([[-3.55,-.31,side*.29],[-2.66,-.34,side*.29],[-1.41,-.39,side*.31],[-.94,-.56,side*.26],[-.50,-.43,side*.26]],.031,M.brass,precision);
    tube([[1.15,-.49,side*.27],[1.52,-.45,side*.36],[2.17,-.36,side*.33],[2.86,-.24,side*.26]],.026,M.gunmetal,precision);
    for(let k=0;k<5;k++){
      const x=-.66+k*.22;
      const y=-.34;
      dot(x,y,side*.38,.028,k%2===0?M.filament:M.brass,precision,8);
    }
  }
  for(const x of [-3.29,-2.25,-1.53,1.5,2.43]){
    cylinder(.12,.12,.09,x,-.41,0,M.brass,precision,16);
    ring(.072,.013,x,-.41,0,M.core,precision,20);
  }

  const topLight=new THREE.PointLight(colors.main,5.5,5.0,2);topLight.position.set(.08,.47,.2);root.add(topLight);
  const noseLight=new THREE.PointLight(colors.main,6,5.5,2);noseLight.position.set(4.78,0,0);root.add(noseLight);

  function setPalette(name) {
    colors=palette[name]||palette.ice;
    [M.core,M.charge,M.filament].forEach((m,i)=>m.color.setHex(i===2?colors.tip:colors.main));
    M.accent.color.setHex(colors.deep);M.accent.emissive.setHex(colors.deep);
    glowingMats.forEach(m=>{ if(m.isSpriteMaterial)m.color.setHex(colors.main);else if(m!==M.core&&m!==M.charge&&m!==M.filament&&m!==M.accent)m.color.setHex(colors.main);});
    stripMats.forEach(m=>m.color.setHex(colors.soft));
    M.plasmaGlass.color.setHex(colors.deep);
    topLight.color.setHex(colors.main);noseLight.color.setHex(colors.main);
    return name in palette?name:'ice';
  }
  function setCharged(value) { chargeTarget=value?1:0; }
  function setExploded(value) { explosionTarget=value?1:0; }
  function setXray(value) {
    xray=!!value;
    for(let m of translucentArmor){m.transparent=xray;m.opacity=xray?.24:1;m.depthWrite=!xray;m.needsUpdate=true;}
    M.armor.side=xray?THREE.DoubleSide:THREE.FrontSide;
  }
  let pulse=0;
  function update(dt,t) {
    dt=Math.min(dt,.06);elapsed=t;
    const smooth=(from,to,speed)=>from+(to-from)*(1-Math.exp(-speed*dt));
    charge=smooth(charge,chargeTarget,2.7);
    explosion=smooth(explosion,explosionTarget,3.4);
    pulse=.5+.5*Math.sin(t*3.6);
    panels.forEach(({obj,side})=>{ obj.position.z=side*explosion*.76;obj.position.y=explosion*.055; });
    const speed=.35+charge*1.15;
    for(let m of moving){
      if(m.type==='rotor'){
        m.obj.rotation.x=t*(.24+m.index*.11)*speed+(m.index-1)*.37;
        m.obj.rotation.y=t*(.31+m.index*.12)*speed+m.index*Math.PI/3;
        m.obj.rotation.z=t*(.26+m.index*.07)*speed+m.index*Math.PI/3;
      } else if(m.type==='petal'){
        m.obj.rotation.x=m.angle+(1-charge)*.09*Math.sin(t*1.7+m.index);
        m.obj.position.y=Math.cos(m.angle)*(.035+.065*charge);
        m.obj.position.z=Math.sin(m.angle)*(.035+.065*charge);
      } else if(m.type==='field') {
        m.obj.rotation.x=t*.13*speed;
        m.obj.position.x=.04*Math.sin(t*1.4);
      }
    }
    engineAura.material.opacity=(.08+.25*charge+.04*pulse);
    fieldGlow.material.opacity=(.09+.38*charge+.11*pulse);
    fieldGlow2.material.opacity=(.12+.33*charge+.12*pulse);
    focusingGlobe.scale.setScalar(.75+.32*charge+.08*pulse);
    topLight.intensity=1.2+5.2*charge+.55*pulse;
    noseLight.intensity=.8+6.3*charge+1.5*pulse;
    M.core.opacity=.28+.65*charge;
    M.charge.opacity=.22+.54*charge;
    for(let mat of stripMats) mat.opacity=.17+.7*charge;
    // model core rotates slowly as a single non-realistic energy lattice
    const o=engineRotor; o.position.x=.018*Math.sin(t*.9);o.scale.setScalar(1+.018*pulse*charge);
  }
  function dispose(){
    const geos=new Set(),mats=new Set(),texs=new Set();
    root.traverse(o=>{if(o.geometry)geos.add(o.geometry);if(o.material){for(let m of (Array.isArray(o.material)?o.material:[o.material])){mats.add(m);if(m.map)texs.add(m.map);}}});
    geos.forEach(g=>g.dispose());texs.forEach(t=>t.dispose());mats.forEach(m=>m.dispose());
  }
  const stats={meshes:0,triangles:0};
  root.traverse(o=>{if(o.isMesh){stats.meshes++;if(o.geometry.index)stats.triangles+=o.geometry.index.count/3;else stats.triangles+=o.geometry.getAttribute('position').count/3;}});
  root.rotation.set(0,0,0);
  setPalette('ice');
  return {root,update,setPalette,setCharged,setExploded,setXray,dispose,stats};
}
