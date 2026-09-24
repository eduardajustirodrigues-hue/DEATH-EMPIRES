import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/controls/OrbitControls.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x7d9aa1);
scene.fog = new THREE.FogExp2(0x879a98, 0.008);

const camera = new THREE.PerspectiveCamera(55, innerWidth/innerHeight, .1, 500);
camera.position.set(28,22,30);

const renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.05;
document.getElementById("game").prepend(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0,2,0);
controls.enableDamping=true;
controls.dampingFactor=.07;
controls.minDistance=10;
controls.maxDistance=55;
controls.maxPolarAngle=Math.PI*.46;
controls.minPolarAngle=.42;

const ambient = new THREE.HemisphereLight(0xc8d9dc,0x1c261b,2.0);
scene.add(ambient);
const sun = new THREE.DirectionalLight(0xffe4b0,3.2);
sun.position.set(-25,40,20);
sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-50;sun.shadow.camera.right=50;sun.shadow.camera.top=50;sun.shadow.camera.bottom=-50;
scene.add(sun);

const world = new THREE.Group(); scene.add(world);
const interactive=[];

function mat(color, rough=0.8, metal=0){return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal});}
const grass=mat(0x496b3f), grass2=mat(0x5d7b47), stone=mat(0x77736a), darkStone=mat(0x46443f), wood=mat(0x573b24), roof=mat(0x3c2620), metal=mat(0x3e4748,.35,.7), banner=mat(0x8f1e25,.8,0);

const ground = new THREE.Mesh(new THREE.PlaneGeometry(180,180,50,50),grass);
ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; world.add(ground);

function makeTerrainPatch(x,z,sx,sz,color){
  const m=new THREE.Mesh(new THREE.PlaneGeometry(sx,sz),mat(color));
  m.rotation.x=-Math.PI/2;m.position.set(x,.015,z);m.receiveShadow=true;world.add(m);
}
makeTerrainPatch(0,0,62,48,0x4f7044);
makeTerrainPatch(-45,-25,38,26,0x5b774b);
makeTerrainPatch(38,30,42,32,0x3f6240);

function cube(name,x,y,z,sx,sy,sz,material, clickable=false){
  const o=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),material);
  o.name=name;o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;world.add(o);
  if(clickable) interactive.push(o);
  return o;
}
function cylinder(name,x,y,z,r,h,material,segments=12,clickable=false){
  const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,segments),material);
  o.name=name;o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;world.add(o);
  if(clickable)interactive.push(o);return o;
}

function tree(x,z,scale=1){
  const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(scale);
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.25,.35,2.2,8),wood);trunk.position.y=1.1;trunk.castShadow=true;g.add(trunk);
  for(let i=0;i<3;i++){const crown=new THREE.Mesh(new THREE.ConeGeometry(1.45-i*.18,2.7,9),mat(0x27482c));crown.position.y=2.3+i*1.15;crown.castShadow=true;g.add(crown);}
  world.add(g);
}
for(let i=0;i<65;i++){const a=Math.random()*Math.PI*2,r=27+Math.random()*42;tree(Math.cos(a)*r,Math.sin(a)*r,.65+Math.random()*.55);}

function tower(x,z){
  const base=cylinder("Torre",x,3,z,2.0,6,stone,10,true);
  const cap=new THREE.Mesh(new THREE.CylinderGeometry(2.25,2.25,1.1,10),roof);cap.position.y=6.35;cap.position.x=x;cap.position.z=z;cap.castShadow=true;world.add(cap);
  const cone=new THREE.Mesh(new THREE.ConeGeometry(2.2,3,10),roof);cone.position.set(x,8.2,z);cone.castShadow=true;world.add(cone);
  return base;
}
function wall(x,z,sx,sz){
  return cube("Muralha",x,2.1,z,sx,4.2,sz,darkStone,true);
}

const castle=new THREE.Group(); castle.name="Fortaleza de Aurora"; castle.userData={type:"castle"};
world.add(castle);
function addCastle(){
  const base=cube("Castelo",0,3,0,16,6,13,stone,true);base.userData.type="castle";
  // inner keep
  cube("Torreão",0,6.5,-.5,7,7,6,stone,true);
  const keepRoof=new THREE.Mesh(new THREE.ConeGeometry(5.3,4,4),roof);keepRoof.position.set(0,12,-.5);keepRoof.rotation.y=Math.PI/4;keepRoof.castShadow=true;world.add(keepRoof);
  [[-9,-7],[-9,7],[9,-7],[9,7]].forEach(p=>tower(p[0],p[1]));
  wall(0,-7.2,18,.9);wall(0,7.2,18,.9);wall(-9,0,.9,14);wall(9,0,.9,14);
  // gate
  const gate=cube("Portão",0,2.1,7.8,5.5,4.2,1.3,wood,true);gate.userData.type="gate";
  // banners
  for(const x of [-3,3]){
    const pole=cylinder("Bandeira",x,7.5,-.8,.08,6,metal,8); 
    const flag=new THREE.Mesh(new THREE.PlaneGeometry(2.2,1.3),banner);flag.position.set(x+1.0,9,-.8);flag.rotation.y=Math.PI/2;world.add(flag);
  }
}
addCastle();

function house(name,x,z,s=1){
  cube(name,x,1.6,z,4*s,3.2,4*s,wood,true);
  const r=new THREE.Mesh(new THREE.ConeGeometry(3.1*s,2.5*s,4),roof);r.position.set(x,4.3*s,z);r.rotation.y=Math.PI/4;r.castShadow=true;world.add(r);
}
house("Quartel",-16,-5,1.2);house("Fazenda",15,-6,1.15);house("Serraria",-15,12,1.1);house("Academia",14,12,1.15);

function road(x,z,w,d,rot=0){
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),mat(0x765d3c));m.rotation.x=-Math.PI/2;m.rotation.z=rot;m.position.set(x,.025,z);world.add(m);
}
road(0,18,5,45);road(0,-18,5,45);road(-18,0,5,45,Math.PI/2);road(18,0,5,45,Math.PI/2);

function soldier(x,z,team=0){
  const g=new THREE.Group();g.position.set(x,.2,z);
  const body=new THREE.Mesh(new THREE.CylinderGeometry(.23,.3,1.1,7),team?mat(0x4d2020):mat(0x374b5a));body.position.y=1;body.castShadow=true;g.add(body);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.25,8,8),mat(0xb68e6a));head.position.y=1.72;head.castShadow=true;g.add(head);
  const shield=new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,.12,10),mat(0x765a32));shield.rotation.z=Math.PI/2;shield.position.set(.36,1,.0);shield.castShadow=true;g.add(shield);
  world.add(g);return g;
}
const soldiers=[];
for(let i=0;i<8;i++) soldiers.push(soldier(-3+i*.8,10+(i%2)*1.2, i%3===0?1:0));

function smoke(x,y,z){
  const g=new THREE.Group();g.position.set(x,y,z);
  for(let i=0;i<6;i++){const s=new THREE.Mesh(new THREE.SphereGeometry(.5+Math.random()*.35,8,8),new THREE.MeshStandardMaterial({color:0x555a58,transparent:true,opacity:.16,depthWrite:false}));s.position.set((Math.random()-.5)*.7,i*.65,(Math.random()-.5)*.7);g.add(s);}
  world.add(g);return g;
}
const smokes=[smoke(-3,6,-.8),smoke(3,6,-.8),smoke(-15,4,12)];

const raycaster=new THREE.Raycaster(), pointer=new THREE.Vector2();
function selectAt(x,y){
  const r=renderer.domElement.getBoundingClientRect();
  pointer.x=((x-r.left)/r.width)*2-1;pointer.y=-((y-r.top)/r.height)*2+1;
  raycaster.setFromCamera(pointer,camera);
  const hits=raycaster.intersectObjects(interactive,true);
  if(!hits.length)return;
  let o=hits[0].object; while(o.parent && !interactive.includes(o))o=o.parent;
  const name=o.name||"Construção";
  document.getElementById("selectionTitle").textContent=name;
  document.getElementById("selectionText").textContent="Construção selecionada · toque novamente para abrir";
  showToast(`🏰 ${name}`);
}
let lastTap=0;
renderer.domElement.addEventListener("pointerdown",e=>{
  const now=Date.now();
  if(now-lastTap<350){selectAt(e.clientX,e.clientY)} lastTap=now;
});
renderer.domElement.addEventListener("dblclick",e=>selectAt(e.clientX,e.clientY));

function showToast(t){const el=document.getElementById("toast");el.textContent=t;el.classList.add("show");clearTimeout(showToast.t);showToast.t=setTimeout(()=>el.classList.remove("show"),1700);}
function modal(title,html){document.getElementById("modalContent").innerHTML=`<h2>${title}</h2>${html}`;document.getElementById("modal").classList.remove("hidden");}
document.getElementById("closeModal").onclick=()=>document.getElementById("modal").classList.add("hidden");
document.querySelectorAll("[data-action]").forEach(b=>b.onclick=()=>{
 const a=b.dataset.action;
 const data={
  mail:["Correio","<p>Seu correio está vazio. Novas mensagens aparecerão aqui.</p>"],
  quests:["Missões","<ul><li>Construa seu primeiro quartel.</li><li>Treine 10 soldados.</li><li>Explore o território.</li></ul>"],
  alliance:["Aliança","<p>O sistema de alianças será conectado ao multiplayer na próxima fase.</p>"],
  settings:["Menu","<p>Qualidade gráfica: Alta<br>Som: Ligado<br>Vibração: Ligada</p><button class='action'>Continuar no reino</button>"]
 }[a];modal(data[0],data[1]);
});
document.getElementById("cityBtn").onclick=()=>{controls.target.set(0,2,0);camera.position.set(25,20,28);showToast("🏰 Visão da cidade");};
document.getElementById("armyBtn").onclick=()=>modal("Exército","<p>Guarnição atual: <b>18 soldados</b></p><button class='action'>Treinar tropas</button><button class='action'>Ver formação</button>");
document.getElementById("mapBtn").onclick=()=>{controls.target.set(0,0,0);camera.position.set(42,38,42);showToast("🌎 Visão do mundo");};

const clock=new THREE.Clock();
function animate(){
 requestAnimationFrame(animate);
 const t=clock.getElapsedTime();
 controls.update();
 soldiers.forEach((s,i)=>{const a=t*.22+(i/8)*Math.PI*2;s.position.x=Math.cos(a)*5;s.position.z=8+Math.sin(a)*2.5;s.rotation.y=-a;});
 smokes.forEach((g,i)=>{g.position.y=Math.sin(t*.5+i)*.15;g.scale.setScalar(1+Math.sin(t*.6+i)*.05);});
 renderer.render(scene,camera);
}
addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
setTimeout(()=>{document.getElementById("loading").style.opacity=0;setTimeout(()=>document.getElementById("loading").remove(),750)},900);
animate();
