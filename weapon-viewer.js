/* OVERDRIVE v2.4 — actual user-supplied Three.js 3D prop overlay.
   All viewport weapon transforms are applied to ONE rigid parent group.
   Real model part animations retain their original independent pivots.
   The original WebGL weapon remains as a fallback when the CDN/second GPU context is unavailable. */
(async()=>{
  const status={ready:false,model:-1,meshCount:0,errors:[],renders:0,source:'GB-03 / ARC-RING / AETHER-09'};
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
    Object.assign(canvas.style,{position:'fixed',inset:'0',width:'100%',height:'100%',zIndex:'1',pointerEvents:'none',touchAction:'none',display:'none'});
    document.body.appendChild(canvas);
    renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:!mobile,powerPreference:'high-performance'});
    renderer.setClearColor(0,0);
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.55;
    renderer.shadowMap.enabled=false; // mobile GPU: no secondary-context shadow atlas
    renderer.setPixelRatio(mobile?Math.min(devicePixelRatio||1,1):Math.min(devicePixelRatio||1,1.45));
  }catch(error){status.errors.push(String(error));canvas?.remove();return;}
  const scene=new THREE.Scene();
  scene.background=null;
  const camera=new THREE.PerspectiveCamera(mobile?79:75,1,.06,70);camera.position.set(0,0,0);camera.lookAt(0,0,-1);
  scene.add(new THREE.AmbientLight(0xc9d9fa,1.5));
  scene.add(new THREE.HemisphereLight(0xd5eeff,0x25354a,2.7));
  const key=new THREE.DirectionalLight(0xe2f2ff,4.5);key.position.set(2,6,8);scene.add(key);
  const rim=new THREE.DirectionalLight(0x77caff,3.1);rim.position.set(-3,-1,-5);scene.add(rim);
  const warm=new THREE.DirectionalLight(0xffd2a0,1.0);warm.position.set(4,-3,1);scene.add(warm);
  // Lightweight procedural reflection environment, important for dark titanium material visibility.
  const envCanvas=document.createElement('canvas');envCanvas.width=512;envCanvas.height=256;
  const ctx=envCanvas.getContext('2d');
  const grad=ctx.createLinearGradient(0,0,0,256);grad.addColorStop(0,'#758fa6');grad.addColorStop(.30,'#334e63');grad.addColorStop(.65,'#152a38');grad.addColorStop(1,'#08121d');ctx.fillStyle=grad;ctx.fillRect(0,0,512,256);
  ctx.fillStyle='rgba(245,252,255,.85)';ctx.fillRect(65,27,132,33);ctx.fillRect(341,48,84,56);
  ctx.fillStyle='rgba(88,168,227,.45)';ctx.fillRect(0,116,512,14);
  const env=new THREE.CanvasTexture(envCanvas);env.mapping=THREE.EquirectangularReflectionMapping;env.colorSpace=THREE.SRGBColorSpace;scene.environment=env;scene.environmentIntensity=.88;
  const pivot=new THREE.Group();scene.add(pivot);
  const setSize=()=>{const w=Math.max(1,innerWidth),h=Math.max(1,innerHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=mobile?79:75;camera.updateProjectionMatrix();};
  addEventListener('resize',setSize);setSize();
  let model=null,index=-1,shotSeen=-1,last=performance.now(),frameTime=0,lastRendered=0,zero=0;
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
    status.model=i;status.meshCount=n;
    model=m;index=i;shotSeen=-1;zero=0;
  }
  function animate(st,dt){
    const flash=Math.min(1,st.flash/.18),charged=st.charge||0;
    const root=model.root;
    // Entire model receives camera sway, recoil and reload tilt as a RIGID GROUP.
    const tension=Math.min(1,st.reload/1.8);
    pivot.position.set(mobile?1.53:1.50,-.92-Math.sin(tension*Math.PI)*.13,-3.25-Math.min(.35,st.kick)*.65);
    pivot.rotation.z=-Math.sin(tension*Math.PI)*.08;
    pivot.rotation.y=1.04;
    pivot.rotation.x=-.02;
    if(index===0){model.update(dt,st.t,st.drive,charged,flash);}
    else if(index===1){animateArcRing(model,st.t,dt,st.drive?1:.12,flash,!!st.drive,mobile);}
    else{model.setCharged(!!st.drive||charged>.15);model.setExploded(!!st.drive);model.update(dt,st.t);}
    if(st.shot!==shotSeen){shotSeen=st.shot;zero=Math.max(zero,1);}zero=Math.max(0,zero-dt*4);
  }
  function frame(t){requestAnimationFrame(frame);
    const st=window.__OVERDRIVE_VISUAL_STATE__?.();
    if(!st||st.mode!=='playing'){canvas.style.display='none';return;}
    // Render weapon overlay at 30Hz on iPhone to reserve the GPU for the core FPS.
    const interval=mobile?30:16;
    if(t-lastRendered<interval)return;
    const dt=Math.min(.06,Math.max(.001,(t-last)/1000));last=t;lastRendered=t;
    try{
      if(index!==st.weapon||!model)load(st.weapon);
      animate(st,dt);
      canvas.style.display='block';
      renderer.render(scene,camera);
      status.renders++;
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
