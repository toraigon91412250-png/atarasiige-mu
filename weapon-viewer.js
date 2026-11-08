/* OVERDRIVE v2.5 — GPU budget + rigid look-sway.
 * Bake STATIC sibling meshes into shared draw calls while preserving their original
 * 3D geometry, material, parent hierarchy and separately articulated parts.
 */
function batchStaticWeapon(THREE, root, animated){
  let before=0,after=0,batches=0,saved=0;
  root.traverse(o=>{if(o.isMesh)before++});
  const parents=[];root.traverse(o=>{if(o.children?.length)parents.push(o)});
  for(const parent of parents){
    const buckets=new Map();
    for(const mesh of parent.children){
      if(!mesh.isMesh||animated.has(mesh)||!mesh.visible||mesh.renderOrder!==0||
         !mesh.material||Array.isArray(mesh.material)||mesh.material.transparent||
         !mesh.geometry||mesh.geometry.morphAttributes?.position?.length||mesh.isSkinnedMesh)continue;
      const attrs=mesh.geometry.attributes; if(!attrs?.position||!attrs.normal)continue;
      const names=Object.keys(attrs).sort();
      if(names.some(n=>attrs[n].isInterleavedBufferAttribute||!(attrs[n].array instanceof Float32Array)))continue;
      const sig=names.map(n=>n+':'+attrs[n].itemSize+':'+attrs[n].normalized).join('|');
      const key=mesh.material.id+'@'+sig;
      if(!buckets.has(key))buckets.set(key,[]);
      buckets.get(key).push(mesh);
    }
    for(const meshes of buckets.values()){
      if(meshes.length<4)continue;
      const material=meshes[0].material;
      // Chunk to stay within WebGL1's 16-bit index capability on older iPhones.
      let group=[],vertices=0;
      function flush(){
        if(group.length<4){group=[];vertices=0;return;}
        const attrs=Object.keys(group[0].geometry.attributes).sort();
        const arrays=Object.fromEntries(attrs.map(n=>[n,[]]));
        const indices=[];let offset=0,geos=[];
        for(const m of group){
          m.updateMatrix();const g=m.geometry.clone();g.applyMatrix4(m.matrix);geos.push(g);
          const size=g.getAttribute('position').count;
          for(const n of attrs){const a=g.getAttribute(n);for(let i=0;i<a.array.length;i++)arrays[n].push(a.array[i]);}
          if(g.index){for(const j of g.index.array)indices.push(j+offset)}
          else{for(let i=0;i<size;i++)indices.push(offset+i)}
          offset+=size;
        }
        const geometry=new THREE.BufferGeometry();
        for(const n of attrs){const proto=group[0].geometry.getAttribute(n);
          geometry.setAttribute(n,new THREE.BufferAttribute(Float32Array.from(arrays[n]),proto.itemSize,proto.normalized));}
        geometry.setIndex(indices);
        const combined=new THREE.Mesh(geometry,material);
        combined.name='OPT_STATIC_BATCH_'+batches;
        combined.castShadow=false;combined.receiveShadow=false;
        // Same parent ensures any moving ancestor still animates this rigid block.
        parent.add(combined);
        for(const m of group)parent.remove(m);
        geos.forEach(g=>g.dispose());
        saved+=group.length-1;batches++;group=[];vertices=0;
      }
      for(const m of meshes){
        const count=m.geometry.getAttribute('position').count;
        if(vertices+count>55000)flush();
        if(count>55000)continue;
        group.push(m);vertices+=count;
      }
      flush();
    }
  }
  root.traverse(o=>{if(o.isMesh)after++});
  return {before,after,batches,saved};
}
function findAnimatedMeshes(root, pose){
  const all=[];root.traverse(o=>{if(o.isMesh)all.push(o)});
  function sig(o){const a=o.position,b=o.rotation,c=o.scale;
    return [a.x,a.y,a.z,b.x,b.y,b.z,c.x,c.y,c.z,o.visible?1:0].join(',');}
  const snapshots=new Map(all.map(o=>[o,sig(o)])), moving=new Set();
  for(const [dt,t,drive,charge,flash] of [[.016,.1,false,0,0],[.016,.6,true,1,1],[.05,2.2,true,1,0],[.06,3.2,false,0,0]]){
    pose(dt,t,drive,charge,flash);
    for(const mesh of all)if(sig(mesh)!==snapshots.get(mesh))moving.add(mesh);
  }
  return moving;
}
/* OVERDRIVE v2.4 — actual user-supplied Three.js 3D prop overlay.
   All viewport weapon transforms are applied to ONE rigid parent group.
   Real model part animations retain their original independent pivots.
   The original WebGL weapon remains as a fallback when the CDN/second GPU context is unavailable. */
(async()=>{
  const status={ready:false,model:-1,meshCount:0,renderMeshes:0,batches:0,drawsAvoided:0,quality:'balanced',errors:[],renders:0,source:'GB-03 / ARC-RING / AETHER-09'};
  window.__OVERDRIVE_MODEL_STATUS__=status;
  const mobile=('ontouchstart' in window)||navigator.maxTouchPoints>0;
  let THREE;
  for(const url of [
    'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js',
    'https://unpkg.com/three@0.180.0/build/three.module.js'
  ]){
    try{THREE=await import(url);break}catch(err){status.errors.push('3D runtime: '+String(err).slice(0,110));}
  }
  if(!THREE){console.warn('OVERDRIVE: source-model renderer unavailable; retaining legacy fallback');return;}
  let renderer,canvas;
  try{
    canvas=document.createElement('canvas');canvas.id='threeWeaponCanvas';canvas.setAttribute('aria-hidden','true');
    // Render only the right/lower weapon viewport; keep the same full-screen perspective via viewOffset.
    Object.assign(canvas.style,{position:'fixed',left:'18%',top:'8%',width:'82%',height:'92%',zIndex:'1',pointerEvents:'none',touchAction:'none',display:'none'});
    document.body.appendChild(canvas);
    renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:false,powerPreference:'high-performance',precision:mobile?'mediump':'highp'});
    renderer.setClearColor(0,0);
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=mobile?THREE.ReinhardToneMapping:THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.55;
    renderer.shadowMap.enabled=false; // mobile GPU: no secondary-context shadow atlas
    let modelDPR=mobile?.80:1.10;renderer.setPixelRatio(modelDPR);
  }catch(error){status.errors.push(String(error));canvas?.remove();return;}
  const scene=new THREE.Scene();
  scene.background=null;
  const camera=new THREE.PerspectiveCamera(mobile?79:75,1,.06,70);camera.position.set(0,0,0);camera.lookAt(0,0,-1);
  scene.add(new THREE.AmbientLight(0xc9d9fa,mobile?2.0:1.5));
  scene.add(new THREE.HemisphereLight(0xd5eeff,0x25354a,mobile?2.6:2.7));
  const key=new THREE.DirectionalLight(0xe2f2ff,4.5);key.position.set(2,6,8);scene.add(key);
  const rim=new THREE.DirectionalLight(0x77caff,3.1);rim.position.set(-3,-1,-5);scene.add(rim);
  const warm=new THREE.DirectionalLight(0xffd2a0,1.0);warm.position.set(4,-3,1);if(!mobile)scene.add(warm);
  // Lightweight procedural reflection environment, important for dark titanium material visibility.
  const envCanvas=document.createElement('canvas');envCanvas.width=mobile?128:256;envCanvas.height=mobile?64:128;
  const ctx=envCanvas.getContext('2d');
  const grad=ctx.createLinearGradient(0,0,0,envCanvas.height);grad.addColorStop(0,'#758fa6');grad.addColorStop(.30,'#334e63');grad.addColorStop(.65,'#152a38');grad.addColorStop(1,'#08121d');ctx.fillStyle=grad;ctx.fillRect(0,0,envCanvas.width,envCanvas.height);
  ctx.fillStyle='rgba(245,252,255,.85)';ctx.fillRect(envCanvas.width*.14,envCanvas.height*.1,envCanvas.width*.27,envCanvas.height*.12);ctx.fillRect(envCanvas.width*.68,envCanvas.height*.19,envCanvas.width*.15,envCanvas.height*.21);
  ctx.fillStyle='rgba(88,168,227,.45)';ctx.fillRect(0,envCanvas.height*.45,envCanvas.width,envCanvas.height*.05);
  const env=new THREE.CanvasTexture(envCanvas);env.mapping=THREE.EquirectangularReflectionMapping;env.colorSpace=THREE.SRGBColorSpace;scene.environment=env;scene.environmentIntensity=.88;
  const pivot=new THREE.Group();scene.add(pivot);
  const setSize=()=>{const w=Math.max(1,innerWidth),h=Math.max(1,innerHeight);
    const x=Math.floor(w*.18),y=Math.floor(h*.08),cw=w-x,ch=h-y;
    renderer.setSize(cw,ch,false);camera.aspect=w/h;camera.fov=mobile?79:75;
    camera.setViewOffset(w,h,x,y,cw,ch);camera.updateProjectionMatrix();};
  addEventListener('resize',setSize);setSize();
  let model=null,index=-1,shotSeen=-1,last=performance.now(),lastRendered=0,zero=0;
  let prevHeading=null,prevPitch=null,swayX=0,swayY=0,frameCounter=0,slowSamples=0;
  let overlayInterval=mobile?30:16;
  function destroy(){
    while(pivot.children.length){const root=pivot.children[0];pivot.remove(root);const geos=new Set(),materials=new Set(),textures=new Set();
      root.traverse(o=>{if(o.geometry)geos.add(o.geometry);if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material]){
        materials.add(m);if(m.map)textures.add(m.map);
      }}});geos.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());}
    model=null;
  }
  function load(i){
    if(i===index&&model)return;
    destroy();
    const m=i===0?buildGravityBreaker(THREE):i===1?buildArcRing(THREE):buildAether09(THREE);
    const root=m.root;
    // Source models run along local +X. Recenter within a single unbending parent rig.
    root.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(root);
    const center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
    root.position.sub(center);
    const length=Math.max(5,size.x);
    pivot.scale.setScalar((mobile?3.15:3.40)/length);
    pivot.rotation.set(-.02,1.04,0);pivot.position.set(mobile?1.53:1.50,-.92,-3.25);
    pivot.add(root);
    m.stats=m.stats||{};let n=0;root.traverse(o=>{if(o.isMesh)n++});
    // Probe source animation first so moving fins, rotors and core details are never baked.
    const pose=(dt,t,drive,charged,flash)=>{
      if(i===0)m.update(dt,t,drive,charged,flash);
      else if(i===1)animateArcRing(m,t,dt,drive?1:.12,flash,drive,mobile);
      else{m.setCharged(drive||charged>.15);m.setExploded(drive);m.update(dt,t);}
    };
    const moving=findAnimatedMeshes(root,pose);
    const perf=batchStaticWeapon(THREE,root,moving);
    if(i===2){m.setCharged(false);m.setExploded(false);}
    status.model=i;status.meshCount=n;status.renderMeshes=perf.after;status.drawsAvoided=perf.saved;status.batches=perf.batches;
    model=m;index=i;shotSeen=-1;zero=0;prevHeading=null;prevPitch=null;swayX=0;swayY=0;
  }
  function animate(st,dt){
    const flash=Math.min(1,st.flash/.18),charged=st.charge||0;
    const root=model.root;
    // Entire model receives camera sway, recoil and reload tilt as a RIGID GROUP.
    const tension=Math.min(1,st.reload/1.8);
    // Turn-responsive whole-weapon lag. Never deform or individually rotate the chassis.
    const deltaHeading=prevHeading===null?0:Math.atan2(Math.sin(st.heading-prevHeading),Math.cos(st.heading-prevHeading));
    const deltaPitch=prevPitch===null?0:st.pitch-prevPitch;
    prevHeading=st.heading;prevPitch=st.pitch;
    const targetX=THREE.MathUtils.clamp(-deltaHeading*6.5,-.15,.15);
    const targetY=THREE.MathUtils.clamp(deltaPitch*5.0,-.12,.12);
    const follow=1-Math.exp(-12*dt);swayX+=(targetX-swayX)*follow;swayY+=(targetY-swayY)*follow;
    const walk=st.airborne?0:Math.min(1,(st.moveSpeed||0)/18);
    const bobX=Math.sin(st.t*9)*.025*walk,bobY=Math.abs(Math.sin(st.t*9))*.024*walk;
    pivot.position.set((mobile?1.53:1.50)+swayX*.90+bobX,-.92-Math.sin(tension*Math.PI)*.13+swayY*.65-bobY,-3.25-Math.min(.35,st.kick)*.65);
    pivot.rotation.z=-Math.sin(tension*Math.PI)*.08-swayX*.20;
    pivot.rotation.y=1.04+swayX*.8;
    pivot.rotation.x=-.02+swayY*.55;
    if(index===0){model.update(dt,st.t,st.drive,charged,flash);}
    else if(index===1){animateArcRing(model,st.t,dt,st.drive?1:.12,flash,!!st.drive,mobile);}
    else{model.setCharged(!!st.drive||charged>.15);model.setExploded(!!st.drive);model.update(dt,st.t);}
    if(st.shot!==shotSeen){shotSeen=st.shot;zero=Math.max(zero,1);}zero=Math.max(0,zero-dt*4);
  }
  function frame(t){requestAnimationFrame(frame);
    const st=window.__OVERDRIVE_VISUAL_STATE__?.();
    if(!st||st.mode!=='playing'){canvas.style.display='none';return;}
    // Reduced overlay frame budget; the main FPS receives render priority.
    if(t-lastRendered<overlayInterval)return;
    const elapsed=t-lastRendered;const dt=Math.min(.06,Math.max(.001,(t-last)/1000));last=t;lastRendered=t;
    try{
      if(index!==st.weapon||!model)load(st.weapon);
      animate(st,dt);
      canvas.style.display='block';
      renderer.render(scene,camera);
      status.renders++;
      // Conservative automatic downshift on sustained frame stalls (no changes to game timing).
      if(mobile&&++frameCounter%50===0){
        if(elapsed>58)slowSamples++;else slowSamples=Math.max(0,slowSamples-1);
        if(slowSamples>=2&&modelDPR>.66){modelDPR=.66;overlayInterval=40;renderer.setPixelRatio(modelDPR);setSize();status.quality='low';}
      }
      if(!status.ready){status.ready=true;window.__OVERDRIVE_MODEL_READY__=true;}
    }catch(err){
      status.errors.push('3D model: '+String(err));console.error('3D prop integration failed, use fallback:',err);
      status.ready=false;window.__OVERDRIVE_MODEL_READY__=false;canvas.style.display='none';
      // Do not spam repeated errors; gameplay continues with original viewport rendering.
      renderer.setAnimationLoop?.(null);destroy();window.__OVERDRIVE_VISUAL_STATE__=null;
    }
  }
  requestAnimationFrame(frame);
})();
