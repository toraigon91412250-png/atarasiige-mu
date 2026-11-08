/* OVERDRIVE v2.4: integrated sci-fi model adapters, game balance and flight. */
(()=>{'use strict';
const $=id=>document.getElementById(id),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rnd=(a,b)=>a+Math.random()*(b-a),TAU=Math.PI*2;
const dom={crosshair:$('crosshair'),world:$('world'),hud:$('hud'),overlay:$('overlay'),touch:$('touch'),wave:$('waveNo'),hp:$('hpNum'),hpBar:$('hpBar'),shieldBar:$('shieldBar'),energy:$('energyNum'),energyBar:$('energyBar'),ammo:$('ammoCount'),weapon:$('weaponLabel'),score:$('score'),enemies:$('enemyCount'),dash:$('dashStatus'),combo:$('comboText'),radar:$('radarDots'),announce:$('announcement'),hit:$('hitmarker'),float:$('floatingDamage'),damage:$('damageFlash'),dashFlash:$('dashFlash'),title:$('menuTitle'),subtitle:$('menuSubtitle'),desc:$('menuDesc'),eyebrow:$('eyebrow'),main:$('mainBtn'),secondary:$('secondaryBtn'),choices:$('choiceContainer'),foot:$('menuFoot')};
const touchCap=('ontouchstart' in window)||navigator.maxTouchPoints>0;let vw=1,vh=1,dpr=1,mode='menu',now=0,frame=0,announceTime=0,hitTime=0,flashTime=0,dashFlashTime=0,toastTime=0,shake=0;
const gl=dom.world.getContext('webgl',{antialias:!touchCap,alpha:false,powerPreference:'high-performance'}) || dom.world.getContext('experimental-webgl');
if(!gl){dom.desc.textContent='このブラウザではWebGLが使用できないため、3D描画を開始できません。';dom.main.disabled=true;return;}
const VS=`attribute vec3 p;attribute vec3 n;uniform mat4 vp;uniform mat4 m;varying vec3 wn;varying vec3 wp;void main(){vec4 w=m*vec4(p,1.);wp=w.xyz;wn=normalize(mat3(m)*n);gl_Position=vp*w;}`;
const FS=`precision mediump float;varying vec3 wn;varying vec3 wp;uniform vec3 tint;uniform float glow;uniform vec3 cam;uniform float grid;uniform float clarity;void main(){vec3 light=normalize(vec3(-.48,.86,.35));float d=max(dot(normalize(wn),light),0.);float ambient=mix(.42,.76,clarity);vec3 c=tint*(ambient+(1.-ambient)*d)+tint*glow*1.15;if(grid>0.5){float a=abs(fract(wp.x/4.)-.5);float b=abs(fract(wp.z/4.)-.5);float lines=max(smoothstep(.485,.5,a),smoothstep(.485,.5,b));c+=vec3(.038,.20,.24)*lines;}float dist=distance(wp,cam);float f=clamp((dist-12.)/82.,0.,.84)*(1.-.89*clarity);c=mix(c,vec3(.025,.065,.11),f);gl_FragColor=vec4(c,1.);}`;
function makeShader(type,src){const sh=gl.createShader(type);gl.shaderSource(sh,src);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));return sh;}
const prog=gl.createProgram();gl.attachShader(prog,makeShader(gl.VERTEX_SHADER,VS));gl.attachShader(prog,makeShader(gl.FRAGMENT_SHADER,FS));gl.linkProgram(prog);if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(prog));gl.useProgram(prog);
const uni={vp:gl.getUniformLocation(prog,'vp'),m:gl.getUniformLocation(prog,'m'),tint:gl.getUniformLocation(prog,'tint'),glow:gl.getUniformLocation(prog,'glow'),cam:gl.getUniformLocation(prog,'cam'),grid:gl.getUniformLocation(prog,'grid'),clarity:gl.getUniformLocation(prog,'clarity')};const attr={p:gl.getAttribLocation(prog,'p'),n:gl.getAttribLocation(prog,'n')};
const mats={};function mesh(verts,norms,indices){const mesh={size:indices.length};mesh.v=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,mesh.v);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(verts),gl.STATIC_DRAW);mesh.n=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,mesh.n);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(norms),gl.STATIC_DRAW);mesh.i=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,mesh.i);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);return mesh;}
function createCube(){const v=[],n=[],idx=[];const faces=[[[1,0,0],[[1,-1,-1],[1,1,-1],[1,1,1],[1,-1,1]]],[[-1,0,0],[[-1,-1,1],[-1,1,1],[-1,1,-1],[-1,-1,-1]]],[[0,1,0],[[-1,1,-1],[-1,1,1],[1,1,1],[1,1,-1]]],[[0,-1,0],[[-1,-1,1],[-1,-1,-1],[1,-1,-1],[1,-1,1]]],[[0,0,1],[[1,-1,1],[1,1,1],[-1,1,1],[-1,-1,1]]],[[0,0,-1],[[-1,-1,-1],[-1,1,-1],[1,1,-1],[1,-1,-1]]]];faces.forEach(([normal,points])=>{let s=v.length/3;points.forEach(p=>{v.push(...p);n.push(...normal)});idx.push(s,s+1,s+2,s,s+2,s+3)});return mesh(v,n,idx)}
function createCylinder(segs=12){const v=[],n=[],idx=[];for(let j=0;j<=segs;j++){let a=j*TAU/segs,c=Math.cos(a),s=Math.sin(a);for(let y of [-1,1]){v.push(c,y,s);n.push(c,0,s)}}for(let j=0;j<segs;j++){let t=j*2;idx.push(t,t+1,t+3,t,t+3,t+2)}for(const y of [-1,1]){let start=v.length/3;v.push(0,y,0);n.push(0,y,0);for(let j=0;j<=segs;j++){let a=j*TAU/segs;v.push(Math.cos(a),y,Math.sin(a));n.push(0,y,0)}for(let j=0;j<segs;j++){if(y>0)idx.push(start,start+j+1,start+j+2);else idx.push(start,start+j+2,start+j+1)}}return mesh(v,n,idx)}
function createSphere(segments=12,rings=7){const v=[],n=[],idx=[];for(let r=0;r<=rings;r++){let t=r*Math.PI/rings;for(let j=0;j<=segments;j++){let a=j*TAU/segments,x=Math.sin(t)*Math.cos(a),y=Math.cos(t),z=Math.sin(t)*Math.sin(a);v.push(x,y,z);n.push(x,y,z)}}for(let r=0;r<rings;r++)for(let j=0;j<segments;j++){let s=r*(segments+1)+j;idx.push(s,s+1,s+segments+1,s+1,s+segments+2,s+segments+1)}return mesh(v,n,idx)}
mats.box=createCube();mats.cyl=createCylinder();mats.sphere=createSphere();
function mul(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];return o}
function perspective(fovy,aspect,near,far){let f=1/Math.tan(fovy/2),out=new Float32Array(16);out[0]=f/aspect;out[5]=f;out[10]=(far+near)/(near-far);out[11]=-1;out[14]=2*far*near/(near-far);return out}
function lookAt(e,c){let z=norm([e[0]-c[0],e[1]-c[1],e[2]-c[2]]),x=norm([z[2],0,-z[0]]),y=[z[1]*x[2]-z[2]*x[1],z[2]*x[0]-z[0]*x[2],z[0]*x[1]-z[1]*x[0]];return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,e),-dot(y,e),-dot(z,e),1])}
const norm=v=>{let l=Math.hypot(...v)||1;return v.map(x=>x/l)},dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);function model(x,y,z,sx,sy,sz,ry=0,rz=0){let c=Math.cos(ry),s=Math.sin(ry),k=Math.cos(rz),h=Math.sin(rz);return new Float32Array([c*k*sx,h*sx,-s*k*sx,0,-c*h*sy,k*sy,s*h*sy,0,s*sz,0,c*sz,0,x,y,z,1])}
let VP,drawcalls=0;function draw(g,x,y,z,sx,sy,sz,color,glow=0,ry=0,rz=0,grid=0,clarity=0){let a=mats[g];if(!a)return;gl.uniformMatrix4fv(uni.m,false,model(x,y,z,sx,sy,sz,ry,rz));gl.uniform3fv(uni.tint,color);gl.uniform1f(uni.glow,glow);gl.uniform1f(uni.grid,grid);gl.uniform1f(uni.clarity,clarity);gl.bindBuffer(gl.ARRAY_BUFFER,a.v);gl.enableVertexAttribArray(attr.p);gl.vertexAttribPointer(attr.p,3,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ARRAY_BUFFER,a.n);gl.enableVertexAttribArray(attr.n);gl.vertexAttribPointer(attr.n,3,gl.FLOAT,false,0,0);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,a.i);gl.drawElements(gl.TRIANGLES,a.size,gl.UNSIGNED_SHORT,0);drawcalls++}
function resize(){vw=window.innerWidth;vh=window.innerHeight;dpr=Math.min(window.devicePixelRatio||1,touchCap?1.15:1.8);dom.world.width=Math.max(1,Math.floor(vw*dpr));dom.world.height=Math.max(1,Math.floor(vh*dpr));gl.viewport(0,0,dom.world.width,dom.world.height)}window.addEventListener('resize',resize);resize();gl.enable(gl.DEPTH_TEST);gl.enable(gl.CULL_FACE);gl.clearColor(.018,.044,.09,1);
const COLORS={floor:[.036,.091,.15],wall:[.075,.16,.23],metal:[.10,.21,.29],metalHi:[.17,.31,.38],teal:[.21,.91,.82],cyan:[.24,.65,.95],coral:[1,.22,.31],orange:[1,.54,.19],white:[.85,.95,1],purple:[.59,.33,.99],gold:[1,.77,.30],enemyRed:[1,.37,.29],enemyRedLight:[1,.63,.49],enemyYellow:[1,.87,.16],enemyPink:[1,.43,.77],enemyPinkLight:[1,.68,.91],enemyWhite:[.93,.97,1],enemyDark:[.055,.09,.13],enemyFace:[1,1,.95],enemyBoss:[1,.58,.24],floorLine:[.10,.32,.37]};
// FLAT ARENA TEST: no cover, elevated decks, or jump pads.
// Retain empty geometry collections so all gameplay collisions explicitly have zero interior solids.
const obstacles=[],platforms=[],jumpPads=[],solids=[];
function touchingXZ(x,z,r,s){return Math.abs(x-s.x)<s.w/2+r&&Math.abs(z-s.z)<s.d/2+r}
function collide(x,z,r=.5){if(Math.abs(x)>40-r||Math.abs(z)>40-r)return true;return obstacles.some(o=>touchingXZ(x,z,r,o))}
function collide3D(x,z,r,feet,head){if(Math.abs(x)>40-r||Math.abs(z)>40-r)return true;return solids.some(o=>touchingXZ(x,z,r,o)&&feet<o.y1-.035&&head>o.y0+.035)}
function solidAt(x,y,z,r=.25){return solids.some(o=>touchingXZ(x,z,r,o)&&y+r>o.y0&&y-r<o.y1)}
function updateVertical(dt){
 // No interior solids: always land on the main floor (y=0) after a jump or jetpack flight.
 if(p.driveActive){const cruise=input.jetHeld?12.2:(p.y>2.8?-1.45:0);p.vy+=(cruise-p.vy)*Math.min(1,dt*(input.jetHeld?4.6:2.9))}
 else if(p.softLanding>0&&p.y>2.0){p.softLanding=Math.max(0,p.softLanding-dt);p.vy+=(-3.2-p.vy)*Math.min(1,dt*3.3)}
 else p.vy=Math.max(-35,p.vy-25*dt);
 let nextFeet=p.y-1.75+p.vy*dt;
 if(nextFeet<=0){nextFeet=0;if(p.vy<=0){p.vy=0;p.jumpLeft=2+p.extraJump}}
 p.y=clamp(nextFeet+1.75,1.75,27);
 if(p.y>=27&&p.vy>0)p.vy=0;
}
const weapons=[{name:'GRAVITY BREAKER GB-03',clip:7,rate:.85,damage:13,range:24,pellets:8,spread:.09,reload:1.8,color:COLORS.orange},{name:'ARC-RING HEAVY FRAME',clip:36,rate:.115,damage:14,range:60,pellets:1,spread:.010,reload:1.45,color:COLORS.cyan},{name:'AETHER / 09',clip:8,rate:.46,damage:42,range:80,pellets:1,spread:.003,reload:1.75,color:COLORS.cyan}];
const upgrades=[{id:'flux',name:'FLUX ENGINE',label:'MOBILITY',desc:'最高速度 +16%。FLOWの獲得量 +35%。'},{id:'chain',name:'ARC CASCADE',label:'SYNERGY',desc:'射撃命中時、近くの別の敵にも電撃が連鎖する。'},{id:'dash',name:'BLINK IMPACT',label:'MOBILITY',desc:'ダッシュ再使用が速くなる。軌跡上の敵に衝撃を与える。'},{id:'haste',name:'OVER CLOCK',label:'FIRE RATE',desc:'全エミッターの連射速度 +22%。'},{id:'aerial',name:'SKYBOUND',label:'AIR CONTROL',desc:'追加ジャンプ +1。空中からの攻撃ダメージ +20%。'},{id:'armor',name:'LATTICE SHIELD',label:'DEFENSE',desc:'最大シールド +30。シールドを即時回復。'},{id:'siphon',name:'VITAL SIPHON',label:'SUSTAIN',desc:'敵撃破時に体力を回復。'},{id:'pierce',name:'PHASE SLICER',label:'DAMAGE',desc:'全エミッターの攻撃 +20%。PRISMが敵を貫通。'},{id:'echo',name:'ECHO CHAMBER',label:'SYNERGY',desc:'4発に1発、追加のエネルギー弾を発射。'},{id:'shock',name:'ION BURST',label:'AREA',desc:'敵撃破時に周囲にもダメージを与える。'},{id:'battery',name:'CAPACITOR',label:'KINETIC',desc:'すべての攻撃ダメージ +15%。'},{id:'heal',name:'REPAIR PULSE',label:'SUSTAIN',desc:'体力を35回復。最大体力 +12。'}];
let p,enemy=[],bullets=[],effects=[],particles=[],wave=1,score=0,kills=0,shotCount=0,record=0,selected=0,runSeed=0,spawnTick=0,bossAlive=false,unlocked=0;
try{record=Number(localStorage.getItem('overdrive-best'))||0;unlocked=Number(localStorage.getItem('overdrive-wins'))||0}catch(e){}
const input={keys:new Set(),fire:false,jetHeld:false,dx:0,dz:0,lookId:null,stickId:null,lastLook:null};let audio=null,lastTone=0;
// Direction monitor compares stick intent with the movement that actually reached the world.
// A collision reports BLOCKED, not a false reversal. This is a temporary diagnostic UI.
const moveDebug={enabled:false,stickY:0,stickX:0,requestedForward:0,actualForward:0,requestedStrafe:0,actualStrafe:0,blocked:false,dash:false};
const diagToggle=$('diagToggle'),diagPanel=$('diagPanel');
function directionName(x){return x>.075?'FORWARD':x<-.075?'BACK':'STOP'}
function resetMobileInput(){input.dx=0;input.dz=0;input.stickId=null;input.lookId=null;input.lastLook=null;input.fire=false;input.jetHeld=false;if(p){p.chargeState=0;p.chargeTime=0}moveDebug.stickY=0;moveDebug.stickX=0;const knob=$('stickKnob');if(knob)knob.style.transform='translate(0,0)'}
function renderMoveDebug(){if(!moveDebug.enabled||!p||mode!=='playing')return;const intent=directionName(moveDebug.requestedForward),actual=directionName(moveDebug.actualForward);const physicallyMoving=Math.hypot(p.dx,p.dz)>.18;
 const display=moveDebug.dash?'DASH LOCK':moveDebug.blocked&&!physicallyMoving?'BLOCKED':actual;
 $('diagStick').textContent='STICK: '+(Math.abs(moveDebug.stickY)>.07?(moveDebug.stickY<0?'DOWN':'UP'):'CENTER')+' '+moveDebug.stickY.toFixed(2);
 $('diagIntent').textContent='REQUEST: '+intent+' '+moveDebug.requestedForward.toFixed(2);
 $('diagActual').textContent='ACTUAL: '+display+' '+moveDebug.actualForward.toFixed(2);
 $('diagDash').textContent='DASH: '+(moveDebug.dash?'ACTIVE':'OFF')+(moveDebug.blocked?' / WALL':'');
 $('diagAngle').textContent='YAW: '+((p.yaw*180/Math.PI%360+360)%360).toFixed(0)+'°';
 let mismatch=!moveDebug.dash&&!moveDebug.blocked&&Math.abs(moveDebug.requestedForward)>.4&&moveDebug.actualForward*moveDebug.requestedForward<-.045;
 diagPanel.classList.toggle('is-mismatch',mismatch);
 if(mismatch)$('diagHeading').textContent='DIRECTION MISMATCH';else $('diagHeading').textContent='MOVE CHECK';}
diagToggle.addEventListener('click',e=>{e.preventDefault();moveDebug.enabled=!moveDebug.enabled;diagToggle.setAttribute('aria-pressed',String(moveDebug.enabled));diagPanel.classList.toggle('is-hidden',!moveDebug.enabled)});

function tone(freq=190,duration=.065,type='sawtooth',vol=.045,end=null){try{audio=audio||new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();if(now-lastTone<.018)return;lastTone=now;const o=audio.createOscillator(),g=audio.createGain();o.type=type;o.frequency.setValueAtTime(freq,audio.currentTime);if(end)o.frequency.exponentialRampToValueAtTime(end,audio.currentTime+duration);g.gain.setValueAtTime(vol,audio.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audio.currentTime+duration);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration)}catch(e){}}
function notify(s){$('toast').textContent=s;$('toast').style.opacity=1;toastTime=now+2.1}
function announcement(s){dom.announce.textContent=s;dom.announce.style.opacity=1;announceTime=now+1.8}
function initPlayer(){p={x:0,z:6,y:1.75,vy:0,yaw:0,pitch:0,health:120,maxHealth:120,shield:30,maxShield:30,flowCharge:0,flowGainMult:1,nextFlowHit:0,nextNearMiss:0,driveActive:false,driveTime:0,driveKills:0,skyBreakReady:false,softLanding:0,padCd:0,sp:0,dx:0,dz:0,dash:0,dashCd:0,dashVX:0,dashVZ:0,slide:0,jumpLeft:2,extraJump:0,lastHit:-50,weapon:0,ammo:weapons.map(w=>w.clip),reload:0,reloads:[0,0,0],chargeState:0,chargeTime:0,gravityCooldown:0,arcHits:0,arcLastHit:-100,arcBoostTime:0,fireCd:0,shot:0,weaponKick:0,weaponFlash:0,weaponHeat:0,voltChain:0,voltTime:0,prismFocus:0,aimLockId:null,aimShots:0,aimHits:0,speedBonus:1,dmgBonus:1,fireBonus:1,airBonus:1,chain:0,pierce:0,siphon:0,explosion:0,echo:0,blink:0,capacitor:0,combo:1,comboLife:0};}
function startRun(){resetMobileInput();initPlayer();wave=1;score=0;kills=0;shotCount=0;selected=0;enemy=[];bullets=[];effects=[];particles=[];spawnTick=0;bossAlive=false;mode='playing';dom.overlay.classList.add('hidden');dom.hud.classList.remove('hidden');dom.touch.classList.toggle('hidden',!touchCap);startWave();if(!touchCap&&dom.world.requestPointerLock)dom.world.requestPointerLock().catch(()=>{});tone(320,.12,'sine',.06,550)}
function startWave(){enemy=[];bullets=[];effects=[];particles=[];bossAlive=wave===6;p.x=0;p.z=6;p.y=1.75;p.vy=0;p.dashCd=0;p.jumpLeft=2;p.flowCharge=p.driveActive?0:Math.round(p.flowCharge*.7);p.driveActive=false;p.driveTime=0;p.softLanding=0;p.skyBreakReady=false;p.aimLockId=null;p.health=Math.min(p.maxHealth,p.health+12);p.shield=p.maxShield;spawnTick=0;
 if(wave===6){spawnEnemy('boss',10,-29);spawnEnemy('striker',-13,-12);spawnEnemy('orbit',13,-12);}else{let types=['striker','orbit','sentry','bulwark'];for(let i=0;i<3+wave;i++){let t=types[(i+wave+Math.floor(i/3))%Math.min(4,2+Math.floor(wave/2))];let a=i*2.399+wave,d=rnd(20,33),x=Math.sin(a)*d,z=Math.cos(a)*d;while(collide(x,z,2)||Math.hypot(x,z-6)<13){a+=.29;d=rnd(16,33);x=Math.sin(a)*d;z=Math.cos(a)*d}spawnEnemy(t,x,z)}}announcement(wave===6?'FINAL SECTOR // HELIX CORE':'SECTOR '+String(wave).padStart(2,'0')+' // ENGAGE');updateHUD();}
let eid=0;function spawnEnemy(type,x,z){const stats={striker:{hp:65,speed:9.2,r:1.1,dmg:10,range:20,rate:1.85},orbit:{hp:55,speed:7.4,r:1,dmg:9,range:28,rate:1.3},sentry:{hp:56,speed:4.7,r:1.05,dmg:17,range:35,rate:2.8},bulwark:{hp:165,speed:3.2,r:1.8,dmg:10,range:23,rate:2.5},boss:{hp:1400,speed:3.1,r:4,dmg:14,range:40,rate:1.5}}[type];let mult=1+(wave-1)*.11;enemy.push({id:++eid,type,x,z,y:type==='boss'?5:type==='orbit'?3.5:1.1,heading:0,t:rnd(0,5),hp:stats.hp*mult,max:stats.hp*mult,speed:stats.speed,r:stats.r,dmg:stats.dmg,range:stats.range,rate:stats.rate,cd:rnd(.5,1.7),wind:0,aimX:0,aimZ:0,lunge:0,stagger:0,phase:0,flash:0,spawn:rnd(0,2),reinforced:false,contactCd:0,dead:false});}
function facing(){return[ Math.sin(p.yaw)*Math.cos(p.pitch),Math.sin(p.pitch),-Math.cos(p.yaw)*Math.cos(p.pitch)]}
function moveAxis(){let x=0,z=0;if(input.keys.has('KeyW')||input.keys.has('ArrowUp'))z+=1;if(input.keys.has('KeyS')||input.keys.has('ArrowDown'))z-=1;if(input.keys.has('KeyA')||input.keys.has('ArrowLeft'))x-=1;if(input.keys.has('KeyD')||input.keys.has('ArrowRight'))x+=1;x+=input.dx;z+=input.dz;let l=Math.hypot(x,z);if(l>1){x/=l;z/=l}return[x*Math.cos(p.yaw)+z*Math.sin(p.yaw),x*Math.sin(p.yaw)-z*Math.cos(p.yaw)]}
function tryJump(){if(mode!=='playing'||!p)return;if(p.driveActive){p.vy=Math.max(p.vy,3.0);return}if(p.jumpLeft<=0)return;if(p.y<1.81&&p.vy<=0)p.vy=10.3;else p.vy=9.3;p.jumpLeft--;tone(230,.09,'triangle',.035,350)}
function awardFlow(n){if(!p||p.driveActive||mode!=='playing')return;p.flowCharge=clamp(p.flowCharge+n*p.flowGainMult,0,100)}
function activateDrive(){if(mode!=='playing'||!p||p.driveActive||p.flowCharge<99.99)return false;p.flowCharge=0;p.driveActive=true;p.driveTime=12;p.driveKills=0;p.skyBreakReady=false;p.vy=Math.max(p.vy,8.5);announcement('FLOW DRIVE // FREE FLIGHT');tone(370,.28,'sawtooth',.055,950);updateHUD();return true}
function endDrive(){if(!p||!p.driveActive)return;p.driveActive=false;p.driveTime=0;p.softLanding=p.y>3?1.45:0;p.skyBreakReady=false;input.jetHeld=false;announcement('DRIVE OFFLINE // KEEP MOVING');tone(600,.20,'triangle',.037,220)}
function tryDash(){if(mode!=='playing'||!p||p.dashCd>0)return;let [x,z]=moveAxis();if(Math.hypot(x,z)<.1){x=Math.sin(p.yaw);z=-Math.cos(p.yaw)}p.dashVX=x;p.dashVZ=z;p.dash=.29;p.dashCd=p.blink?1.5:2.6;if(p.driveActive&&p.skyBreakReady){p.skyBreakReady=false;p.driveKills=0;for(const e of enemy)if(!e.dead&&Math.hypot(e.x-p.x,e.z-p.z)<5.2&&Math.abs(e.y-p.y)<5)rewardDmg(65,e);spawnBurst(p.x,p.y-.8,p.z,COLORS.gold,22,9);announcement('SKY BREAK')}shake=.025;dashFlashTime=now+.15;dom.dashFlash.style.opacity=.22;tone(140,.18,'sawtooth',.045,630);}
function trySlide(){if(mode!=='playing'||!p)return;p.slide=.72;tone(90,.16,'triangle',.025,45)}
function swapWeapon(i){if(mode!=='playing'||!p)return;p.chargeState=0;p.chargeTime=0;p.weapon=(i===undefined?p.weapon+1:i+3)%3;p.reload=p.reloads[p.weapon];p.fireCd=0;p.weaponKick=0;p.weaponFlash=0;p.prismFocus=0;updateHUD();tone(540,.065,'sine',.02,300)}
function reload(){if(!p||mode!=='playing'||p.reload>0)return;let w=weapons[p.weapon];if(p.ammo[p.weapon]===w.clip)return;p.reload=w.reload;p.reloads[p.weapon]=w.reload;p.fireCd=.2;notify('RECHARGING '+w.name);tone(p.weapon===1?130:p.weapon===2?420:220,.14,p.weapon===1?'triangle':'sine',.028,p.weapon===2?260:480)}
function rewardDmg(n,e){e.hp-=n;e.flash=.15;if(e.hp<=0&&!e.dead){e.dead=true;killEnemy(e)}}
function spawnBurst(x,y,z,col,count=10,strength=5){for(let i=0;i<count;i++)particles.push({x,y,z,vx:rnd(-strength,strength),vy:rnd(0,strength*1.1),vz:rnd(-strength,strength),life:rnd(.3,.85),max:.85,col,s:rnd(.04,.13)});if(particles.length>180)particles.splice(0,particles.length-180)}
function killEnemy(e){let boss=e.type==='boss';kills++;p.comboLife=5;p.combo=Math.min(3.6,p.combo+.25);score+=Math.round((boss?3000:100)*p.combo);if(p.driveActive){p.driveTime=Math.min(18,p.driveTime+(p.y>2.8?2:1.5));if(p.y>2.8)p.shield=Math.min(p.maxShield,p.shield+10);p.driveKills++;if(p.driveKills>=3)p.skyBreakReady=true}else awardFlow(p.y>2.8?18:12);if(p.siphon)p.health=Math.min(p.maxHealth,p.health+5+2*p.siphon);if(p.explosion){for(const other of enemy)if(!other.dead&&other!==e&&Math.hypot(other.x-e.x,other.z-e.z)<7)rewardDmg(24*p.explosion,other)}spawnBurst(e.x,e.y,e.z,boss?COLORS.purple:e.type==='sentry'?COLORS.coral:COLORS.teal,boss?15:6,boss?5:2.6);effects.push({type:'ring',x:e.x,z:e.z,r:.4,life:.45,col:e.type==='boss'?COLORS.purple:COLORS.teal});if(boss){tone(90,.65,'sawtooth',.09,28)}else tone(260,.13,'triangle',.045,700);}
function hitEnemy(e,dmg){let base=dmg*p.dmgBonus*(p.driveActive?1.8:1)*(p.capacitor?1.15:1)*(p.y>2? p.airBonus:1);rewardDmg(base,e);if(now>=p.nextFlowHit){awardFlow(2);p.nextFlowHit=now+.17}dom.hit.style.opacity=1;hitTime=now+.095;shake=Math.min(.04,shake+.006);if(p.chain>0){let target=enemy.filter(x=>!x.dead&&x!==e&&Math.hypot(x.x-e.x,x.z-e.z)<9).sort((a,b)=>Math.hypot(a.x-e.x,a.z-e.z)-Math.hypot(b.x-e.x,b.z-e.z))[0];if(target){rewardDmg(base*.33*p.chain,target);effects.push({type:'beam',x:e.x,y:e.y,z:e.z,x2:target.x,y2:target.y,z2:target.z,life:.16,col:COLORS.cyan})}}}
function raySphere(o,d,c,r){const v=[c[0]-o[0],c[1]-o[1],c[2]-o[2]],t=dot(v,d),sq=dot(v,v)-t*t,disc=r*r-sq;if(disc<0)return Infinity;const k=t-Math.sqrt(disc);return k>0?k:Infinity}
function weakHit(e,origin,dir){
 if(e.type==='boss')return Number.isFinite(raySphere(origin,dir,[e.x,e.y,e.z],1.19));
 if(e.type!=='bulwark')return false;
 const frontX=Math.sin(e.heading),frontZ=-Math.cos(e.heading),viewer=(origin[0]-e.x)*frontX+(origin[2]-e.z)*frontZ;
 if(viewer>-.55)return false;const center=[e.x-frontX*1.06,e.y+.35,e.z-frontZ*1.06];return Number.isFinite(raySphere(origin,dir,center,.48));
}
function rayWall(o,d,max){let nearest=max;for(const a of solids){const low=[a.x-a.w/2,a.y0,a.z-a.d/2],hi=[a.x+a.w/2,a.y1,a.z+a.d/2];let tmin=0,tmax=nearest;for(let i=0;i<3;i++){if(Math.abs(d[i])<.00001){if(o[i]<low[i]||o[i]>hi[i]){tmin=Infinity;break}}else{let t1=(low[i]-o[i])/d[i],t2=(hi[i]-o[i])/d[i];if(t1>t2)[t1,t2]=[t2,t1];tmin=Math.max(tmin,t1);tmax=Math.min(tmax,t2)}}if(tmax>=tmin&&tmin<nearest)nearest=tmin}return nearest}
// KINETIC AIM: small, player-guided assistance. Never turn the camera toward a target.
const AIM_CONES={touchNormal:9,touchDrive:14,mouseNormal:2,mouseDrive:4};
function aimCone(){return (touchCap?(p.driveActive?AIM_CONES.touchDrive:AIM_CONES.touchNormal):(p.driveActive?AIM_CONES.mouseDrive:AIM_CONES.mouseNormal))*Math.PI/180}
function aimCandidate(origin=[p.x,p.y-.06,p.z],forward=facing(),wide=1){
 if(!p||mode!=='playing')return null;
 const cone=aimCone()*wide,weapon=weapons[p.weapon];let best=null,score=Infinity;
 for(const e of enemy){
  if(e.dead)continue;
  // Only a visible, front-facing target inside the selected gun's range is eligible.
  const center=[e.x,e.type==='boss'?e.y:e.y+.1,e.z],off=[center[0]-origin[0],center[1]-origin[1],center[2]-origin[2]],dist=Math.hypot(...off);
  if(dist<.8||dist>weapon.range+e.r)continue;
  const dir=off.map(v=>v/dist),cos=dot(forward,dir);
  if(cos<=0||cos<Math.cos(cone))continue;
  const angle=Math.acos(clamp(cos,-1,1));
  if(rayWall(origin,dir,dist-.15)<dist-.15)continue;
  const candidateScore=angle/cone+dist*.0025-(e.id===p.aimLockId?.11:0);
  if(candidateScore<score){score=candidateScore;best={enemy:e,angle,cone,distance:dist,dir}}
 }
 return best;
}
function aimLookScale(){
 if(!p||mode!=='playing')return 1;
 const target=aimCandidate([p.x,p.y-.06,p.z],facing(),1.18);
 if(!target)return 1;
 const intensity=clamp((1-target.angle/(target.cone))/.65,0,1);
 return 1-intensity*(touchCap?.34:.20);
}
function assistedDirection(origin,forward,weapon){
 const target=aimCandidate(origin,forward);
 if(!target){p.aimLockId=null;return {dir:forward,target:null,power:0}}
 p.aimLockId=target.enemy.id;
 const e=target.enemy,off=[e.x-origin[0],(e.type==='boss'?e.y:e.y+.1)-origin[1],e.z-origin[2]],dist=dot(off,forward);
 const miss=Math.sqrt(Math.max(0,dot(off,off)-dist*dist));
 // Preserve deliberate hits (especially the manually targeted boss/rear weak spots).
 if(dist>0&&miss<e.r+(touchCap?.35:.08))return {dir:forward,target,power:0};
 const power=clamp((target.cone-target.angle)/(target.cone*.20),0,1)*(touchCap?1:.98);
 return {dir:norm(forward.map((v,i)=>v*(1-power)+target.dir[i]*power)),target,power};
}
function updateAimReticle(){
 if(!p||mode!=='playing'){dom.crosshair.classList.remove('aim-assist','drive-assist');return}
 const target=aimCandidate();
 dom.crosshair.classList.toggle('aim-assist',!!target&&target.angle<target.cone*.78);
 dom.crosshair.classList.toggle('drive-assist',p.driveActive&&!!target&&target.angle<target.cone*.78);
}
function beginFire(){if(mode!=='playing'||!p)return;input.fire=true;if(p.weapon===2){if(p.chargeState===0&&p.reload<=0&&p.fireCd<=0&&p.ammo[2]>0){p.chargeState=1;p.chargeTime=0}}else shoot()}
function releaseFire(){if(input.fire&&p?.weapon===2&&p.chargeState===1&&mode==='playing')shoot(p.chargeTime/1.05);if(p){p.chargeState=0;p.chargeTime=0}input.fire=false}
function shoot(chargeLevel=0){if(mode!=='playing'||!p||p.reload>0||p.fireCd>0)return;let w=weapons[p.weapon];const isMax=p.weapon===2&&chargeLevel>=.999,charged=p.weapon===2&&chargeLevel>=.25;const cost=isMax?2:1;if(p.ammo[p.weapon]<cost){reload();return}p.fireCd=w.rate/p.fireBonus/(p.weapon===1&&p.driveActive&&p.arcBoostTime>0?1.2:1);
 p.ammo[p.weapon]-=cost;shotCount++;p.shot++;p.aimShots++;
 p.weaponKick=[.32,.13,.37][p.weapon];p.weaponFlash=[.15,.075,.20][p.weapon];p.weaponHeat=Math.min(1,p.weaponHeat+.28);
 const chargeDamage=p.weapon===2?(charged?42+118*Math.min(1,chargeLevel):42):w.damage;
 if(p.weapon===2)p.prismFocus=0;
 let shotHit=false,hitTargets=new Set(),hitCounts=new Map();let origin=[p.x,p.y-.06,p.z],raw=facing(),aim=assistedDirection(origin,raw,w),d=aim.dir,right=[Math.cos(p.yaw),0,Math.sin(p.yaw)];let barrel=[origin[0]+right[0]*.28+d[0]*.45,origin[1]-.22,origin[2]+right[2]*.28+d[2]*.45],shotColor=p.driveActive?COLORS.gold:w.color;
 for(let k=0;k<w.pellets;k++){let sx=(Math.random()-.5)*w.spread*2,sy=(Math.random()-.5)*w.spread*2,dir=norm([d[0]+right[0]*sx,d[1]+sy,d[2]+right[2]*sx]),hits=[];for(let e of enemy){if(e.dead)continue;let cy=e.type==='boss'?e.y:e.y+.1;let o=[e.x-origin[0],cy-origin[1],e.z-origin[2]],t=dot(o,dir);if(t<.1||t>w.range)continue;let dist=Math.sqrt(Math.max(0,dot(o,o)-t*t));if(dist<e.r+(touchCap?.35:.08))hits.push({e,t,weak:weakHit(e,origin,dir)})}hits.sort((a,b)=>a.t-b.t);let reached=rayWall(origin,dir,w.range);hits=hits.filter(h=>h.t<reached);if(hits.length){p.aimHits++;let max=p.weapon===2&&isMax&&p.driveActive?2:(p.pierce>0&&p.weapon===2?3:1);for(let j=0;j<Math.min(hits.length,max);j++){let h=hits[j];shotHit=true;hitTargets.add(h.e);hitCounts.set(h.e,(hitCounts.get(h.e)||0)+1);
 hitEnemy(h.e,chargeDamage*(h.weak?[1.45,1.75,1.65][p.weapon]:1)*(p.echo&&shotCount%4===0?1.65:1)*(j===1&&isMax?.65:1));if(h.weak)spawnBurst(h.e.x,h.e.y+.3,h.e.z,COLORS.gold,7,3);reached=h.t;if(j===0||max===1)spawnBurst(h.e.x,h.e.y+.2,h.e.z,shotColor,4,2)} }effects.push({type:'beam',x:barrel[0],y:barrel[1],z:barrel[2],x2:origin[0]+dir[0]*reached,y2:origin[1]+dir[1]*reached,z2:origin[2]+dir[2]*reached,life:p.weapon===2?.24:.105,col:shotColor});}
 // Each prop has its own rhythm. Effects are deliberately small for sightline clarity.
 if(p.weapon===0){
   for(const [e,count] of hitCounts){if(count>=4&&!e.dead&&e.type!=='boss')e.stagger=Math.max(e.stagger,.18);
    if(p.driveActive&&count>=4&&now>=p.gravityCooldown){p.gravityCooldown=now+.95;
     for(const neighbor of enemy.filter(v=>v!==e&&!v.dead&&v.type!=='boss'&&Math.hypot(v.x-e.x,v.z-e.z)<3.5).slice(0,2))neighbor.stagger=Math.max(neighbor.stagger,.30);
    }
   }
   tone(130,.13,'triangle',.050,52);
 }else if(p.weapon===1){
   if(shotHit&&p.driveActive){p.arcHits=now-p.arcLastHit>1.4?1:p.arcHits+1;p.arcLastHit=now;
    if(p.arcHits>=5){p.arcBoostTime=1.5;p.arcHits=0;}}
   tone(290,.065,'sine',.03,530);
 }else{
   tone(isMax?360:430,.16,'sine',.035,isMax?120:590);
 }
 if(p.ammo[p.weapon]<=0)reload();}
function enemyShot(e,tx,tz,sp=17,spread=0,damageScale=1){if(bullets.length>=10)return;let dx=tx-e.x+rnd(-spread,spread),dz=tz-e.z+rnd(-spread,spread),d=Math.hypot(dx,dz)||1;let startY=e.type==='boss'?e.y:e.y+.4;let projectile=e.type==='striker'?COLORS.enemyRed:e.type==='orbit'?COLORS.enemyPink:e.type==='sentry'?COLORS.enemyYellow:e.type==='bulwark'?COLORS.enemyWhite:COLORS.enemyBoss;bullets.push({x:e.x,y:startY,z:e.z,vx:dx/d*sp,vy:(p.y-startY)/Math.max(d,1)*sp,vz:dz/d*sp,life:3.05,r:e.type==='boss'?.36:.26,damage:e.dmg*damageScale,col:projectile});}
function hurt(amount){if(p.dash>0)return;let n=amount*(p.driveActive&&p.y>2.8?.68:1);p.lastHit=now;if(p.shield>0){let a=Math.min(p.shield,n);p.shield-=a;n-=a}p.health-=n;flashTime=now+.12;dom.damage.style.opacity=.16;shake=Math.max(shake,.027);tone(80,.22,'sawtooth',.055,45);if(p.health<=0){p.health=0;endRun(false)}}
function lineBlock(ax,az,bx,bz){let n=9;for(let i=1;i<n;i++){let t=i/n;if(collide(ax+(bx-ax)*t,az+(bz-az)*t,.15))return true}return false}
function enemyLogic(e,dt){if(e.dead)return;let dx=p.x-e.x,dz=p.z-e.z,dist=Math.hypot(dx,dz)||1,ux=dx/dist,uz=dz/dist;e.t+=dt;e.flash=Math.max(0,e.flash-dt);const targetHeading=Math.atan2(dx,-dz),deltaHeading=Math.atan2(Math.sin(targetHeading-e.heading),Math.cos(targetHeading-e.heading));e.heading+=clamp(deltaHeading,-(e.type==='bulwark'?.95:2.6)*dt,(e.type==='bulwark'?.95:2.6)*dt);if(e.stagger>0){e.stagger-=dt;return}
 let desired=e.type==='sentry'?22:e.type==='orbit'?14:e.type==='bulwark'?15:e.type==='boss'?24:7;let move=dist>desired+2?1:dist<desired-3?-.7:0,side=e.type==='orbit'?Math.sin(e.t*.53)>0?1:-1:e.type==='striker'?Math.sin(e.t*2.8):e.type==='boss'?Math.sin(e.t*.6):0;
 if(e.type==='orbit')e.y=3.7+Math.sin(e.t*2.8)*.85;let speed=e.speed*dt,tx=(ux*move+uz*side*.8)*speed,tz=(uz*move-ux*side*.8)*speed;let nx=e.x+tx,nz=e.z+tz;if(!collide(nx,e.z,e.r*.7))e.x=nx;if(!collide(e.x,nz,e.r*.7))e.z=nz;
 e.cd-=dt;if(e.type==='striker'){if(dist>11&&dist<25&&e.cd<.42&&!lineBlock(e.x,e.z,p.x,p.z)){e.lunge=.34}if(e.lunge>0){e.lunge-=dt;let bx=e.x+ux*dt*13,bz=e.z+uz*dt*13;if(!collide(bx,bz,e.r*.7)){e.x=bx;e.z=bz}}if(e.cd<=0&&dist<23){enemyShot(e,p.x+p.dx*.24,p.z+p.dz*.24,20,1.0);e.cd=e.rate}}
 else if(e.type==='orbit'){if(e.cd<=0&&dist<29){enemyShot(e,p.x+p.dx*.18,p.z+p.dz*.18,19,.75);e.cd=e.rate}}
 else if(e.type==='sentry'){if(e.wind>0){e.wind-=dt;if(e.wind<=0){enemyShot(e,e.aimX,e.aimZ,32,.03,1.3);e.cd=e.rate;}}else if(e.cd<=0&&dist<35&&!lineBlock(e.x,e.z,p.x,p.z)){e.wind=.95;e.aimX=p.x+p.dx*.35;e.aimZ=p.z+p.dz*.35}}
 else if(e.type==='bulwark'){if(e.cd<=0&&dist<26){if(Math.abs(deltaHeading)>1.1){e.cd=.16}else for(let a of [-1,1])enemyShot(e,p.x+dz/dist*a*2.0,p.z-dx/dist*a*2.0,15,0,.9);e.cd=e.rate}}
 else if(e.type==='boss'){e.y=5+Math.sin(e.t*2)*.7;e.phase=e.hp/e.max;if(e.cd<=0&&dist<42){if(e.phase>.55){for(let i=-1;i<=1;i+=2){let a=i*.21;enemyShot(e,p.x+Math.cos(a)*i*2.3,p.z+Math.sin(a)*i*2.3,17,0,1.1)}}else{for(let i=0;i<3;i++){let a=i*TAU/3+e.t*.33;enemyShot(e,e.x+Math.cos(a)*20,e.z+Math.sin(a)*20,16,0,.8)}enemyShot(e,p.x,p.z,27,0,1.3)}e.cd=e.phase>.55?2.7:2.15;spawnBurst(e.x,e.y,e.z,COLORS.purple,3,1.8)}if(e.hp/e.max<.35&&!e.reinforced){e.reinforced=true;e.spawn=8;spawnEnemy('orbit',e.x+5,e.z+4);spawnEnemy('striker',e.x-4,e.z-3);announcement('CORE BREACH // PHASE 02')}e.spawn-=dt;}
 e.contactCd=Math.max(0,e.contactCd-dt);if(dist<e.r+.55&&Math.abs(p.y-e.y)<2.5&&e.contactCd<=0){hurt(11);e.contactCd=1.05;}
}
function update(dt){now+=dt;frame++;if(mode==='playing'){
 let startX=p.x,startZ=p.z;let [mx,mz]=moveAxis(),requestedX=mx,requestedZ=mz,wasDashing=p.dash>0,targetSpeed=10.3*p.speedBonus*(p.slide>0?1.42:1)*(p.driveActive?(p.y>2.8?2.12:1.66):1),speed=p.dash>0?(p.driveActive?51:35):targetSpeed;if(p.dash>0){p.dash=Math.max(0,p.dash-dt);mx=p.dashVX;mz=p.dashVZ;if(p.blink>0){for(let e of enemy)if(!e.dead&&Math.hypot(e.x-p.x,e.z-p.z)<2)rewardDmg(11*p.blink*dt*15,e)}}if(p.slide>0)p.slide=Math.max(0,p.slide-dt);let moving=Math.hypot(mx,mz)>.06;let steps=Math.max(1,Math.ceil(speed*dt/.42)),sx=mx*speed*dt/steps,sz=mz*speed*dt/steps;
  for(let i=0;i<steps;i++){let feet=p.y-1.75,head=feet+1.72;if(!collide3D(p.x+sx,p.z,.52,feet+.08,head))p.x+=sx;if(!collide3D(p.x,p.z+sz,.52,feet+.08,head))p.z+=sz}
  p.dx=(p.x-startX)/Math.max(dt,.001);p.dz=(p.z-startZ)/Math.max(dt,.001);
  const cameraForwardX=Math.sin(p.yaw),cameraForwardZ=-Math.cos(p.yaw);
  moveDebug.requestedForward=requestedX*cameraForwardX+requestedZ*cameraForwardZ;
  moveDebug.requestedStrafe=requestedX*Math.cos(p.yaw)+requestedZ*Math.sin(p.yaw);
  moveDebug.actualForward=((p.x-startX)*cameraForwardX+(p.z-startZ)*cameraForwardZ)/Math.max(dt,.001);
  moveDebug.actualStrafe=((p.x-startX)*Math.cos(p.yaw)+(p.z-startZ)*Math.sin(p.yaw))/Math.max(dt,.001);
  moveDebug.blocked=Math.abs((p.x-startX)-mx*speed*dt)+Math.abs((p.z-startZ)-mz*speed*dt)>.025;
  moveDebug.dash=wasDashing;
 updateVertical(dt);if(p.driveActive){p.driveTime-=dt;if(p.driveTime<=0)endDrive()}p.dashCd=Math.max(0,p.dashCd-dt);p.fireCd=Math.max(0,p.fireCd-dt);
 p.weaponKick=Math.max(0,p.weaponKick-dt*2.6);p.weaponFlash=Math.max(0,p.weaponFlash-dt);
 p.weaponHeat=Math.max(0,p.weaponHeat-dt*.28);
 if(p.voltTime>0)p.voltTime-=dt;else p.voltChain=0;
 p.gravityCooldown=Math.max(0,p.gravityCooldown-dt);p.arcBoostTime=Math.max(0,p.arcBoostTime-dt);
 p.prismFocus=p.weapon===2&&p.chargeState===1?Math.min(1,p.chargeTime/1.05):0;
 for(let w=0;w<3;w++){if(p.reloads[w]>0){p.reloads[w]=Math.max(0,p.reloads[w]-dt);if(p.reloads[w]===0){p.ammo[w]=weapons[w].clip;tone(460,.05,'sine',.03,800)}}}p.reload=p.reloads[p.weapon];if(p.comboLife>0)p.comboLife-=dt;else p.combo+=(1-p.combo)*dt*2;if(now-p.lastHit>5)p.shield=Math.min(p.maxShield,p.shield+11*dt);
 if(input.fire){if(p.weapon===2){if(p.chargeState===0&&p.reload<=0&&p.fireCd<=0&&p.ammo[2]>0){p.chargeState=1;p.chargeTime=0}
 if(p.chargeState===1){p.chargeTime=Math.min(1.05,p.chargeTime+dt);if(p.chargeTime>=1.05){shoot(1);p.chargeState=2}}}else shoot()}for(const e of [...enemy])enemyLogic(e,dt);
 for(let i=bullets.length-1;i>=0;i--){let b=bullets[i];b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;b.life-=dt;if(b.life<=0||solidAt(b.x,b.y,b.z,.25)){bullets.splice(i,1);continue}if(!b.nearAwarded&&Math.hypot(p.x-b.x,p.z-b.z)<2.5&&Math.abs(p.y-b.y)<2.4){b.nearAwarded=true;if(now>=p.nextNearMiss&&Math.hypot(p.x-b.x,p.z-b.z)>b.r+.75&&Math.hypot(p.dx,p.dz)>4.5){awardFlow(8);p.nextNearMiss=now+.85}}if(Math.hypot(p.x-b.x,p.z-b.z)<b.r+.49&&Math.abs(p.y-b.y)<1.42){hurt(b.damage);bullets.splice(i,1);if(mode!=='playing')break}}
 for(const e of enemy){if(e.dead)continue;if(Math.hypot(e.x-p.x,e.z-p.z)<e.r+.4&&Math.abs(e.y-p.y)<2.5&&p.dash>0){rewardDmg(24*dt*12,e)}}
 enemy=enemy.filter(e=>!e.dead);if(enemy.length===0&&mode==='playing'){if(wave>=6){endRun(true)}else enterUpgrade()}
 }
 for(let i=effects.length-1;i>=0;i--){effects[i].life-=dt;if(effects[i].life<=0)effects.splice(i,1)}for(let i=particles.length-1;i>=0;i--){let a=particles[i];a.x+=a.vx*dt;a.y+=a.vy*dt;a.z+=a.vz*dt;a.vy-=14*dt;a.life-=dt;if(a.life<=0)particles.splice(i,1)}if(now>announceTime)dom.announce.style.opacity=0;if(now>hitTime)dom.hit.style.opacity=0;if(now>flashTime)dom.damage.style.opacity=0;if(now>dashFlashTime)dom.dashFlash.style.opacity=0;if(now>toastTime)$('toast').style.opacity=0;shake=Math.max(0,shake-dt*.7);if(frame%5===0&&p&&mode==='playing'){updateHUD();renderMoveDebug();}}
function updateHUD(){if(!p)return;updateAimReticle();dom.wave.innerHTML=String(wave).padStart(2,'0')+' <em>/ 06</em>';dom.hp.textContent=Math.ceil(p.health);dom.hpBar.style.width=(p.health/p.maxHealth*100)+'%';dom.shieldBar.style.width=(p.shield/p.maxShield*100)+'%';dom.energy.textContent=p.driveActive?p.driveTime.toFixed(1)+'s':Math.floor(p.flowCharge)+'%';dom.energyBar.style.width=(p.driveActive?p.driveTime/18*100:p.flowCharge)+'%';dom.energyBar.classList.toggle('drive-active',p.driveActive);document.body?.classList?.toggle('flow-flight',p.driveActive&&p.y>2.8);let alt=$('altitudeReadout');if(alt)alt.textContent=p.driveActive?'ALT '+Math.max(0,Math.round(p.y-1.75))+'m  /  '+(input.jetHeld?'ASCEND':p.vy>2.5?'CLIMB':'GLIDE'):'';$('mobileDrive').classList.toggle('hidden',p.driveActive||p.flowCharge<99.99);dom.ammo.textContent=p.reload>0?'··':String(p.ammo[p.weapon]).padStart(2,'0');dom.weapon.textContent=String(p.weapon+1).padStart(2,'0')+' / '+weapons[p.weapon].name;dom.score.textContent=String(score).padStart(6,'0');dom.enemies.textContent=enemy.length+' THREATS';dom.dash.textContent=p.dashCd<=0?'DASH READY':'DASH '+p.dashCd.toFixed(1)+'s';dom.combo.textContent=p.driveActive?(p.skyBreakReady?'SKY BREAK READY':p.weapon===1&&p.arcBoostTime>0?'OVERCLOCK ×1.2':p.weapon===2?'PHASE / DRIVE':'DRIVE ACTIVE')
 :p.weapon===2&&p.prismFocus>.05?'CHARGE '+Math.round(p.prismFocus*100)+'%':'COMBO ×'+p.combo.toFixed(1);dom.radar.innerHTML=enemy.filter(e=>!e.dead).slice(0,20).map(e=>{let dx=e.x-p.x,dz=e.z-p.z,rr=50,rx=(dx*Math.cos(p.yaw)+dz*Math.sin(p.y))/43*rr,ry=(dx*Math.sin(p.yaw)-dz*Math.cos(p.yaw))/43*rr;return `<span class="dot" style="left:${clamp(50+rx,8,91)}%;top:${clamp(50+ry,8,91)}%;background:${e.type==='boss'?'#c196ff':'#ff817c'}"></span>`}).join('')}
function enterUpgrade(){resetMobileInput();if(document.pointerLockElement)document.exitPointerLock?.();mode='upgrade';dom.overlay.classList.remove('hidden');dom.touch.classList.add('hidden');dom.eyebrow.textContent='// SECTOR '+String(wave).padStart(2,'0')+' CLEARED';dom.title.innerHTML='SELECT <span>UPGRADE</span>';dom.subtitle.innerHTML='ADAPT YOUR BUILD <span>///</span> CHOOSE ONE';dom.desc.textContent='次のセクターへ進む前に、強化モジュールを1つ選択。';dom.foot.classList.add('hidden');dom.main.classList.add('hidden');dom.secondary.classList.add('hidden');let opts=[...upgrades].sort(()=>Math.random()-.5).slice(0,3);dom.choices.innerHTML='';opts.forEach((u,i)=>{let b=document.createElement('button');b.className='upgrade';b.innerHTML=`<span>${String(i+1).padStart(2,'0')} // ${u.label}</span><b>${u.name}</b><small>${u.desc}</small>`;b.addEventListener('click',()=>{applyUpgrade(u.id);wave++;dom.overlay.classList.add('hidden');dom.touch.classList.toggle('hidden',!touchCap);mode='playing';startWave();if(!touchCap)dom.world.requestPointerLock?.().catch(()=>{})});dom.choices.appendChild(b)});tone(700,.35,'sine',.05,900)}
function applyUpgrade(id){if(id==='flux'){p.speedBonus*=1.16;p.flowGainMult*=1.35}else if(id==='chain')p.chain+=1;else if(id==='dash')p.blink+=1;else if(id==='haste')p.fireBonus*=1.22;else if(id==='aerial'){p.extraJump++;p.jumpLeft++;p.airBonus*=1.2}else if(id==='armor'){p.maxShield+=30;p.shield=p.maxShield}else if(id==='siphon')p.siphon++;else if(id==='pierce'){p.dmgBonus*=1.2;p.pierce++}else if(id==='echo')p.echo++;else if(id==='shock')p.explosion++;else if(id==='battery')p.capacitor++;else if(id==='heal'){p.maxHealth+=12;p.health=Math.min(p.maxHealth,p.health+35)}notify('MODULE INSTALLED // '+id.toUpperCase())}
function endRun(win){resetMobileInput();mode='end';dom.touch.classList.add('hidden');dom.overlay.classList.remove('hidden');if(!touchCap&&document.pointerLockElement)document.exitPointerLock?.();if(score>record){record=score;try{localStorage.setItem('overdrive-best',score)}catch(e){}}if(win){unlocked++;try{localStorage.setItem('overdrive-wins',unlocked)}catch(e){}}dom.eyebrow.textContent=win?'// ALL SYSTEMS NOMINAL':'// SIGNAL LOST';dom.title.innerHTML=win?'SYSTEM <span>BREACHED</span>':'RUN <span>ENDED</span>';dom.subtitle.textContent=win?'HELIX CORE NEUTRALIZED':'YOU CAN GO FURTHER';dom.desc.innerHTML=`SCORE <b>${score}</b>　/　KILLS <b>${kills}</b><br>BEST <b>${record}</b>　/　SECTORS <b>${wave} / 6</b>`;dom.foot.classList.add('hidden');dom.choices.innerHTML='';dom.main.classList.remove('hidden');dom.main.innerHTML='NEW RUN <span>↗</span>';dom.secondary.classList.add('hidden');tone(win?650:110,.45,'triangle',.06,win?1200:50)}
function showPause(){if(mode!=='playing')return;resetMobileInput();mode='pause';dom.overlay.classList.remove('hidden');dom.touch.classList.add('hidden');dom.eyebrow.textContent='// SIMULATION ON HOLD';dom.title.innerHTML='PAU<span>SED</span>';dom.subtitle.textContent='TACTICAL BREAK';dom.desc.innerHTML='狙った敵の周辺では照準がゆっくり動き、弾道が補正される。<br>敵弾を避けながらFLOWを溜めよう。';dom.choices.innerHTML='';dom.foot.classList.remove('hidden');dom.main.classList.remove('hidden');dom.main.innerHTML='RESUME <span>↗</span>';dom.secondary.classList.remove('hidden');dom.secondary.textContent='RESTART';if(document.pointerLockElement)document.exitPointerLock?.()}
function resume(){mode='playing';dom.overlay.classList.add('hidden');dom.touch.classList.toggle('hidden',!touchCap);if(!touchCap)dom.world.requestPointerLock?.().catch(()=>{})}
function begin(){if(mode==='pause')resume();else startRun()}
dom.main.addEventListener('click',begin);dom.secondary.addEventListener('click',startRun);$('pauseBtn').addEventListener('click',showPause);
window.addEventListener('keydown',e=>{if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();input.keys.add(e.code);if(e.repeat)return;if(e.code==='Escape'){if(mode==='playing')showPause();else if(mode==='pause')resume();return}if(mode!=='playing')return;if(e.code==='Space'){input.jetHeld=true;tryJump()}if(e.code==='KeyE')activateDrive();if(e.code==='ShiftLeft'||e.code==='ShiftRight')tryDash();if(e.code==='KeyC'||e.code==='ControlLeft')trySlide();if(e.code==='KeyR')reload();if(e.code==='Digit1')swapWeapon(0);if(e.code==='Digit2')swapWeapon(1);if(e.code==='Digit3')swapWeapon(2);if(e.code==='KeyQ')swapWeapon()});window.addEventListener('keyup',e=>{input.keys.delete(e.code);if(e.code==='Space')input.jetHeld=false});window.addEventListener('blur',()=>{input.keys.clear();resetMobileInput();if(mode==='playing')showPause()});
dom.world.addEventListener('click',()=>{if(mode==='playing'&&!touchCap&&document.pointerLockElement!==dom.world)dom.world.requestPointerLock?.().catch(()=>{})});dom.world.addEventListener('mousedown',e=>{if(e.button===0&&mode==='playing'&&!touchCap)beginFire()});window.addEventListener('mouseup',e=>{if(e.button===0)releaseFire()});document.addEventListener('mousemove',e=>{if(mode!=='playing'||document.pointerLockElement!==dom.world)return;let friction=aimLookScale();p.yaw+=e.movementX*.00225*friction;p.pitch=clamp(p.pitch-e.movementY*.0020*friction,-1.35,1.35);updateAimReticle()});dom.world.addEventListener('wheel',e=>{if(mode==='playing'){e.preventDefault();swapWeapon()}},{passive:false});
function onButton(id,down,up){let el=$(id);el.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();el.setPointerCapture?.(e.pointerId);el.classList.add('active');down()});el.addEventListener('pointerup',e=>{e.preventDefault();el.classList.remove('active');up?.()});el.addEventListener('pointercancel',()=>{el.classList.remove('active');up?.()})}
onButton('mobileFire',beginFire,releaseFire);onButton('mobileJump',()=>{input.jetHeld=true;tryJump()},()=>input.jetHeld=false);onButton('mobileDrive',activateDrive);onButton('mobileDash',tryDash);onButton('mobileSlide',trySlide);onButton('mobileReload',reload);onButton('mobileSwap',()=>swapWeapon());
const stick=$('stickZone'),knob=$('stickKnob'),look=$('lookZone');function moveStick(e){let rect=document.querySelector('.stick-ring').getBoundingClientRect(),cx=rect.left+rect.width/2,cy=rect.top+rect.height/2,dx=e.clientX-cx,dz=e.clientY-cy,len=Math.hypot(dx,dz),limit=47,k=Math.min(1,limit/(len||1)),x=dx*k,z=dz*k;knob.style.transform=`translate(${x}px,${z}px)`;const sx=x/limit,sz=-z/limit,deadzone=.06;input.dx=Math.abs(sx)<deadzone?0:sx;input.dz=Math.abs(sz)<deadzone?0:sz;moveDebug.stickX=input.dx;moveDebug.stickY=input.dz}
stick.addEventListener('pointerdown',e=>{if(mode!=='playing'||input.stickId!==null)return;e.preventDefault();input.stickId=e.pointerId;stick.setPointerCapture(e.pointerId);moveStick(e)});stick.addEventListener('pointermove',e=>{if(e.pointerId===input.stickId)moveStick(e)});function releaseStick(e){if(e.pointerId===input.stickId){input.stickId=null;input.dx=0;input.dz=0;moveDebug.stickY=0;moveDebug.stickX=0;knob.style.transform='translate(0,0)'}}stick.addEventListener('pointerup',releaseStick);stick.addEventListener('pointercancel',releaseStick);stick.addEventListener('lostpointercapture',releaseStick);
look.addEventListener('pointerdown',e=>{e.preventDefault();input.lookId=e.pointerId;input.lastLook=[e.clientX,e.clientY];look.setPointerCapture(e.pointerId)});look.addEventListener('pointermove',e=>{if(e.pointerId!==input.lookId||mode!=='playing')return;let prev=input.lastLook;let friction=aimLookScale();p.yaw+=(e.clientX-prev[0])*.005*friction;p.pitch=clamp(p.pitch-(e.clientY-prev[1])*.0045*friction,-1.3,1.3);updateAimReticle();input.lastLook=[e.clientX,e.clientY]});function releaseLook(e){if(e.pointerId===input.lookId){input.lookId=null;input.lastLook=null}}look.addEventListener('pointerup',releaseLook);look.addEventListener('pointercancel',releaseLook);look.addEventListener('lostpointercapture',releaseLook);
function drawWorld(t){drawcalls=0;gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);let yaw=p?p.yaw:Math.sin(t*.13)*.4,pitch=p?p.pitch:-.11,eye=p?[p.x,p.y,p.z]:[0,3.5,7],f=[Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)];let jitter=shake>0?rnd(-shake,shake):0;eye=[eye[0]+jitter,eye[1]+jitter*.5,eye[2]];let view=lookAt(eye,[eye[0]+f[0],eye[1]+f[1],eye[2]+f[2]]),proj=perspective((p?.driveActive?(touchCap?83:80):(touchCap?79:75))*Math.PI/180,vw/vh,.07,180);VP=mul(proj,view);gl.uniformMatrix4fv(uni.vp,false,VP);gl.uniform3fv(uni.cam,eye);
 // Flat arena: only floor and the four perimeter walls remain as level geometry.
 // Remove the overlapping central rings/grid/decks/pads that may cause Z-fighting near spawn.
 draw('box',0,-2.3,0,43,2.1,43,COLORS.floor,0,0,0,1);
 draw('box',0,-.16,0,41,.17,41,COLORS.metal,0,0,0,1);
 for(let i=0;i<4;i++){const side=i<2?(i===0?-1:1):0;
  if(i<2)draw('box',side*41,7,0,1.2,7,41,COLORS.wall);
  else draw('box',0,7,(i===2?-1:1)*41,41,7,1.2,COLORS.wall);
 }
 for(let e of enemy)if(!e.dead)drawEnemy(e,t);for(let b of bullets){const distance=Math.hypot(b.x-eye[0],b.y-eye[1],b.z-eye[2]);if(distance<.65)continue;const r=Math.min(.13,Math.max(.020,distance*.008));draw('sphere',b.x,b.y,b.z,r,r,r,b.col,.65,0,0,0,1);const vx=b.vx/(Math.hypot(b.vx,b.vz)||1),vz=b.vz/(Math.hypot(b.vx,b.vz)||1);draw('box',b.x-vx*.11,b.y-b.vy*.004,b.z-vz*.11,r*.45,r*.45,r*1.3,b.col,.32,Math.atan2(vx,vz))}
 for(let e of effects){if(e.type==='beam'){let dx=e.x2-e.x,dy=e.y2-e.y,dz=e.z2-e.z,l=Math.hypot(dx,dy,dz);draw('box',(e.x+e.x2)/2,(e.y+e.y2)/2,(e.z+e.z2)/2,.045,.055,l/2,e.col,1.3,Math.atan2(dx,dz))}else if(e.type==='ring'){for(let i=0;i<10;i++){let a=i*TAU/10,r=.5+(1-e.life/.45)*5;draw('box',e.x+Math.sin(a)*r,.1,e.z+Math.cos(a)*r,.9,.025,.08,e.col,.9,a)}}}
 for(let a of particles)draw('box',a.x,a.y,a.z,a.s*.6,a.s*.6,a.s*.6,a.col,.38);
 if(p&&mode!=='menu'&&!window.__OVERDRIVE_MODEL_READY__)drawWeapon(eye,yaw,pitch,t);
}
function drawEnemy(e,t){
 // High-luminance, low-poly enemy language: strong full-body colors, unique silhouette and small part count.
 // All enemy colors bypass the arena's atmospheric fade so distant targets never merge with cyan scenery.
 const bob=Math.sin(e.t*5)*.10,ry=e.heading,y=e.y+bob;
 const role=e.type==='striker'?COLORS.enemyRed:e.type==='orbit'?COLORS.enemyPink:e.type==='sentry'?COLORS.enemyYellow:e.type==='bulwark'?COLORS.enemyWhite:COLORS.enemyBoss;
 const body=e.flash>0?COLORS.enemyFace:role;
 function part(shape,lx,ly,lz,sx,sy,sz,c,shine=0,roll=0){const co=Math.cos(ry),si=Math.sin(ry);draw(shape,e.x+lx*co+lz*si,y+ly,e.z+lx*si-lz*co,sx,sy,sz,c,shine,ry,roll,0,1)}
 if(e.type==='striker'){
  // RED: squat sprinting brawler, square head and heavy forearms.
  part('box',0,.18,0,.72,.68,.60,body,.24);
  part('box',0,.80,-.02,.62,.21,.55,COLORS.enemyRedLight,.12);
  part('box',0,.17,.62,.53,.27,.095,COLORS.enemyDark);
  part('box',0,.16,.73,.39,.095,.045,COLORS.enemyFace,.35);
  for(const side of [-1,1]){part('box',side*.99,-.22,0,.29,.53,.39,body,.18);part('box',side*.40,-.89,0,.25,.30,.34,COLORS.enemyRedLight,.15);part('box',side*1.16,.35,-.30,.13,.36,.19,COLORS.enemyDark,.28,side*.25)}part('sphere',0,.19,.76,.24,.13,.062,COLORS.enemyFace,.66)
 }else if(e.type==='orbit'){
  // PINK: sharply separated swept wings, no complex skeletal animation.
  part('box',0,.18,0,.62,.51,.58,body,.27);
  part('box',0,.22,.59,.47,.29,.075,COLORS.enemyDark);
  for(const side of [-1,1]){part('box',side*.19,.20,.69,.19,.085,.04,COLORS.enemyFace,.45,-side*.36);part('box',side*.98,-.12,.02,.24,.67,.31,body,.25,side*.41);part('box',side*.46,.79,-.05,.19,.27,.29,COLORS.enemyPinkLight,.16,side*.18)}
  part('box',0,-.52,0,.19,.36,.19,COLORS.enemyPinkLight,.12);part('cyl',0,.55,-.17,.37,.045,.37,COLORS.enemyPink,.44,0,0,0,1);part('sphere',0,.19,.72,.20,.12,.07,COLORS.enemyFace,.55);
 }else if(e.type==='sentry'){
  // YELLOW: hovering square turret with two wide rectangular wings.
  part('box',0,.20,0,.63,.63,.55,body,.28);
  part('box',0,.20,.56,.44,.41,.07,COLORS.enemyDark);
  part('box',0,.20,.64,.29,.26,.045,COLORS.enemyFace,.5);
  for(const side of [-1,1])part('box',side*1.04,.23,.04,.47,.16,.32,body,.32,-side*.15);
  part('box',0,-.57,0,.19,.31,.25,COLORS.enemyYellow,.19);part('cyl',0,.67,-.13,.27,.05,.27,COLORS.enemyYellow,.55);part('box',0,.86,-.09,.08,.16,.09,COLORS.enemyDark,.20);
 }else if(e.type==='bulwark'){
  // WHITE: bulky shielded walker, visible at distance without a cyan body.
  part('box',0,.26,0,1.04,.94,.84,body,.16);
  part('box',0,.40,.86,.73,.50,.095,COLORS.enemyDark);
  part('box',0,.40,.97,.44,.32,.055,COLORS.enemyFace,.37);
  for(const side of [-1,1]){part('box',side*1.58,.10,.04,.42,1.04,.65,body,.19);part('box',side*.55,-.95,0,.35,.42,.48,COLORS.enemyWhite,.13)}
  part('sphere',0,.35,-1.06,.45,.45,.45,COLORS.enemyBoss,1.05);part('box',0,1.35,.18,.83,.14,.45,COLORS.enemyDark,.15);part('sphere',0,.46,1.03,.26,.22,.075,COLORS.enemyFace,.50);
 }else{
  // BOSS: clean white outer shell with a contrasting hot-orange central eye.
  draw('sphere',e.x,e.y,e.z,3.15,3.15,3.15,COLORS.enemyDark,0,0,0,0,1);
  draw('sphere',e.x,e.y,e.z,2.6,2.6,2.6,COLORS.enemyWhite,.20,0,0,0,1);
  draw('sphere',e.x,e.y,e.z,1.28,1.28,1.28,COLORS.enemyBoss,.85,0,0,0,1);
  for(let i=0;i<4;i++){let a=i*TAU/4+e.t*.25;draw('box',e.x+Math.sin(a)*4.0,e.y+Math.cos(a)*1.2,e.z+Math.cos(a)*4.0,.40,.75,.80,COLORS.enemyWhite,.18,a,0,0,1)}
 }
 if(e.type==='sentry'&&e.wind>0){const time=clamp(e.wind/.95,0,1);draw('sphere',e.x,e.y+1.13,e.z,.22+(.2*(1-time)),.07,.22+(.2*(1-time)),COLORS.enemyYellow,.55,0,0,0,1)}
 // One small role-colored health marker, not a targeting ray or ground warning.
 let width=Math.max(.62,e.r*.78),hp=clamp(e.hp/e.max,0,1);
 draw('box',e.x,e.y+e.r+1.40,e.z,width,.057,.053,COLORS.enemyDark,0,0,0,0,1);
 draw('box',e.x-width*(1-hp),e.y+e.r+1.42,e.z,width*hp,.068,.057,role,.20,0,0,0,1);
}
// WEAPON EVOLUTION: compact 3D first-person silhouettes with real animated parts.
// These energy weapons deliberately use charge, vents and folding fins, not ejected casings.
const GUN={dark:[.055,.084,.13],body:[.13,.18,.25],mid:[.22,.31,.40],edge:[.46,.58,.66],bone:[.56,.66,.70],white:[.85,.93,.94],amber:[.95,.55,.20],lilac:[.62,.38,.9]};
function drawWeapon(eye,yaw,pitch,t){
 const wi=p.weapon,w=weapons[wi],fw=[Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch)],rt=[Math.cos(yaw),0,Math.sin(yaw)];
 const up=[-Math.sin(yaw)*Math.sin(pitch),Math.cos(pitch),Math.cos(yaw)*Math.sin(pitch)];
 const speed=Math.min(1,Math.hypot(p.dx,p.dz)/22),bob=Math.sin(t*11)*speed*.012;
 const kick=p.weaponKick,flash=p.weaponFlash,energy=p.driveActive?COLORS.gold:w.color;
 const rprogress=p.reload>0?clamp(1-p.reload/w.reload,0,1):0;
 const recharge=p.reload>0?Math.sin(Math.PI*rprogress):0;
 const surge=p.driveActive?1:0;
 const at=1.43-kick*.25,side=.43+kick*.06,below=-.43-kick*.10+Math.sin(t*8)*.008+bob-recharge*.05;
 const baseX=eye[0]+fw[0]*at+rt[0]*side+up[0]*below;
 const baseY=eye[1]+fw[1]*at+rt[1]*side+up[1]*below;
 const baseZ=eye[2]+fw[2]*at+rt[2]*side+up[2]*below;
 let pieces=0;
 function part(shape,x,y,z,sx,sy,sz,col=GUN.body,glow=0,roll=0){
  // local +z is along the barrel; pitch stays level to keep sight alignment on iPhone.
  draw(shape,baseX+rt[0]*x+fw[0]*z+up[0]*y,baseY+fw[1]*z+up[1]*y,baseZ+rt[2]*x+fw[2]*z+up[2]*y,sx,sy,sz,col,glow,yaw,roll);pieces++;
 }
 function paired(x,y,z,sx,sy,sz,col=GUN.mid,glow=0){for(const side of [-1,1])part('box',side*x,y,z,sx,sy,sz,col,glow)}
 // All weapons have small rear grips/silhouettes so the main body does not cover center view.
 if(wi===0){ // VOLT CARBINE: narrow stepped receiver + external energy spine.
  part('box',0,0,-.07,.235,.16,.43,GUN.body);
  part('box',0,.105,.02,.19,.075,.38,GUN.mid);
  part('box',0,.20,.06,.11,.042,.28,GUN.dark);
  paired(.245,.035,.07,.065,.13,.33,GUN.edge);
  paired(.32,-.038,.08,.075,.06,.25,GUN.mid);
  paired(.13,-.18,-.18,.075,.19,.14,GUN.dark);
  part('box',0,-.25,-.17,.12,.18,.12,GUN.body);
  part('box',0,-.38,-.22,.10,.085,.09,GUN.edge);
  part('box',0,.02,-.53,.205,.12,.13,GUN.mid);
  paired(.21,.008,-.55,.06,.09,.24,GUN.edge);
  part('box',0,.08,-.66,.125,.055,.24,GUN.dark);
  part('box',0,.005,.49,.12,.12,.32,GUN.dark);
  paired(.132,.038,.52,.032,.10,.30,GUN.edge);
  part('box',0,.16,.28,.09,.046,.29,energy,.62+surge*.8);
  for(let i=0;i<3;i++)part('box',.202,.11,-.10+i*.15,.027,.027,.040,energy,.50+surge*.6);
  // Reload cycle physically ejects and reseats the luminous cell, rather than a casing.
  part('box',-.07,-.24-recharge*.17,-.16,.080,.14,.11,GUN.dark);
  part('box',-.082,-.25-recharge*.17,-.16,.025,.090,.071,energy,.6);
  // In DRIVE the longitudinal emitters open outwards, charging faster on consecutive hits.
  paired(.18+surge*.11,.13,.34,.043,.048,.27,energy,.53+surge*.75);
  part('cyl',0,0,.85,.082,.092,.082,energy,1.1+surge*.65);
 }else if(wi===1){ // BREACH: squat industrial emitter with visible heat-release shutters.
  part('box',0,.01,-.07,.315,.20,.37,GUN.body);
  part('box',0,.17,.02,.34,.082,.33,GUN.mid);
  paired(.31,-.018,.01,.067,.15,.34,GUN.edge);
  part('box',0,-.23,-.24,.13,.20,.14,GUN.dark);
  part('box',0,-.34,-.27,.11,.092,.11,GUN.mid);
  part('box',0,.035,-.49,.23,.15,.17,GUN.dark);
  paired(.205,-.08,-.50,.046,.12,.25,GUN.mid);
  paired(.17,.01,.40,.115,.13,.37,GUN.dark);
  paired(.17,.11,.42,.081,.078,.30,GUN.bone);
  paired(.17,.005,.75,.10,.10,.09,GUN.edge);
  paired(.17,.005,.83,.075,.075,.04,energy,1.1+surge*.6);
  part('box',0,.22,.06,.13,.052,.23,GUN.dark);
  part('box',0,.265,.26,.085,.023,.09,GUN.edge);
  for(let i=0;i<3;i++)part('box',-.34,.075,-.21+i*.16,.024,.065,.047,energy,.7);
  // Sliding thermal shutters open while venting, and remain partially open in DRIVE.
  paired(.335+recharge*.16+surge*.07,.17,.15,.06,.11,.29,GUN.edge);
  paired(.39+recharge*.14+surge*.08,.19,.15,.017,.07,.24,energy,.70);
  part('box',0,-.06,.37,.10,.08,.32,GUN.mid);
 }else{ // PRISM LANCER: slim split rails and animated precision crystal.
  part('box',0,-.02,-.09,.18,.15,.38,GUN.body);
  part('box',0,.16,.005,.17,.058,.34,GUN.mid);
  part('box',0,-.20,-.21,.11,.18,.10,GUN.dark);
  part('box',0,-.29,-.22,.11,.08,.08,GUN.edge);
  paired(.19,.045,.05,.055,.12,.32,GUN.edge);
  part('box',0,.25,.09,.095,.08,.14,GUN.dark);
  part('box',0,.31,.19,.055,.030,.10,energy,.38);
  part('box',0,.00,-.49,.17,.11,.17,GUN.mid);
  paired(.17,-.035,-.56,.065,.072,.23,GUN.body);
  // Two precision tines separated by a visible beam, like a tuning fork.
  const open=surge*.10+recharge*.13;
  paired(.19+open,.012,.58,.064,.076,.43,GUN.edge);
  paired(.18+open,.015,.83,.077,.077,.11,GUN.white);
  part('box',0,.02,.57,.034,.044,.45,energy,.9+surge*.60);
  part('sphere',0,.04,.095,.155,.155,.16,energy,p.prismFocus*.85+.5+surge*.7);
  paired(.29+open,.12,.13,.045,.09,.26,GUN.mid);
  paired(.32+open,.19,.19,.025,.045,.20,energy,.40+surge*.6);
  part('cyl',0,.035,1.01,.070,.08,.07,energy,1.3+surge*.75);
 }
 // Restrained muzzle flash: 2-3 luminous meshes, immediately gone after firing.
 if(flash>0){const peak=clamp(flash/([.08,.16,.21][wi]),0,1);
  const length=[.87,.89,1.03][wi];
  part('sphere',0,.01,length,.09*peak,.08*peak,.09*peak,energy,1.6);
  if(wi===1)paired(.18,.01,length,.055*peak,.055*peak,.14*peak,energy,1.1);
  else part('box',0,.01,length+.14,.03*peak,.035*peak,.18*peak,energy,1.25);
 }
 return pieces;
}
let prev=performance.now();function loop(ts){let dt=Math.min((ts-prev)/1000,.05);prev=ts;update(dt);drawWorld(ts/1000);requestAnimationFrame(loop)}requestAnimationFrame(loop);
// A small QA surface for automated tests; never grants gameplay advantages.
window.__OVERDRIVE_VISUAL_STATE__=()=>p?{mode,weapon:p.weapon,drive:p.driveActive,kick:p.weaponKick,flash:p.weaponFlash,reload:p.reload,charge:p.chargeState===1?p.chargeTime/1.05:0,shot:p.shot,heading:p.yaw,pitch:p.pitch,airborne:p.y>2.5,moveSpeed:Math.hypot(p.dx,p.dz),t:now}:null;
window.__OVERDRIVE_QA__={getMovementDebug:()=>({...moveDebug,playerX:p?.x,playerZ:p?.z,yaw:p?.yaw,inputX:input.dx,inputZ:input.dz,keys:[...input.keys],moveAxis:moveAxis()}),setYaw:(a)=>{if(p)p.yaw=a},setPitch:(a)=>{if(p)p.pitch=a},getState:()=>({mode,wave,score,enemies:enemy.length,health:p?.health,shield:p?.shield,flowCharge:p?.flowCharge,driveActive:p?.driveActive,driveTime:p?.driveTime,height:p?.y,vy:p?.vy,jetHeld:input.jetHeld,padCd:p?.padCd,weapon:p?.weapon,ammo:p?.ammo?.[p.weapon],reloading:p?.reload,chargeState:p?.chargeState,chargeTime:p?.chargeTime,reloads:p?.reloads?.slice(),arcBoost:p?.arcBoostTime,weaponKick:p?.weaponKick,weaponFlash:p?.weaponFlash,voltChain:p?.voltChain,prismFocus:p?.prismFocus,weaponHeat:p?.weaponHeat,canvasWidth:dom.world.width,canvasHeight:dom.world.height,drawcalls,projectiles:bullets.length,bulletRadii:bullets.map(b=>b.r),aimShots:p?.aimShots,aimHits:p?.aimHits,aimTargetId:p?.aimLockId,enemyRoles:enemy.filter(e=>!e.dead).map(e=>e.type)}),start:startRun,upgrade:applyUpgrade,setInput:(x,z)=>{input.dx=x;input.dz=z},setJet:(held)=>{input.jetHeld=held},setPosition:(x,z,eyeY)=>{p.x=x;p.z=z;p.y=eyeY;p.vy=0},giveFlow:(v)=>{p.flowCharge=clamp(v,0,100)},activateDrive,aimProbe:()=>{const t=aimCandidate();return {targetId:t?.enemy.id??null,angleDeg:t?Math.round(t.angle*180/Math.PI*100)/100:null,coneDeg:p?aimCone()*180/Math.PI:0,lookScale:aimLookScale(),power:p?assistedDirection([p.x,p.y-.06,p.z],facing(),weapons[p.weapon]).power:0,enemyHp:enemy[0]?.hp??null}},setAimScenario:(x,z,y=1.1,type='sentry')=>{enemy=[];spawnEnemy(type,x,z);enemy[0].y=y;enemy[0].hp=10000;enemy[0].max=10000;enemy[0].cd=1e6;p.aimLockId=null},shootOnce:()=>{p.fireCd=0;shoot();return enemy[0]?.hp},setWeapon:(n)=>swapWeapon(n),triggerReload:reload,renderWeaponTest:()=>{if(!p)return 0;return drawWeapon([p.x,p.y,p.z],p.yaw,p.pitch,now)},addAimEnemy:(x,z,y=1.1,type='sentry')=>{spawnEnemy(type,x,z);const e=enemy[enemy.length-1];e.y=y;e.hp=10000;e.max=10000;e.cd=1e6;return e.id},getEnemies:()=>enemy.map(e=>({id:e.id,type:e.type,hp:e.hp,x:e.x,z:e.z,stagger:e.stagger})),platforms:()=>platforms.map(v=>({...v})),arenaGeometry:()=>({obstacles:obstacles.length,platforms:platforms.length,jumpPads:jumpPads.length,solids:solids.length}),jump:tryJump,simFrame:(dt)=>update(dt),damage:(n)=>p&&hurt(n),skipSector:()=>{if(mode==='playing'){enemy=[];update(.01)}}};
})();
