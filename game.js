const STORAGE_KEY = "imperio-medieval-save-v1";

const defaultState = {
  playerName: "Senhor do Reino",
  castleLevel: 1,
  resources: { madeira: 900, comida: 900, pedra: 500, ferro: 300, ouro: 150 },
  buildings: {
    castle: {level:1, cost:{madeira:250, pedra:120}},
    sawmill: {level:1, cost:{madeira:180}},
    farm: {level:1, cost:{madeira:160}},
    quarry: {level:1, cost:{madeira:220, pedra:80}},
    barracks: {level:1, cost:{madeira:260, pedra:100}},
    warehouse: {level:1, cost:{madeira:200, pedra:80}}
  },
  troops: { swordsman: 20, archer: 10, knight: 0 },
  log: ["Seu reino foi fundado. Comece construindo sua fortaleza."]
};

let state = loadState();

const buildingData = {
  castle:["🏰","Castelo","Aumenta o nível do reino.", "castle"],
  sawmill:["🪵","Serraria","Produz madeira.", "sawmill"],
  farm:["🌾","Fazenda","Produz comida.", "farm"],
  quarry:["⛏️","Pedreira","Produz pedra.", "quarry"],
  barracks:["⚔️","Quartel","Permite treinar tropas.", "barracks"],
  warehouse:["📦","Armazém","Aumenta sua capacidade.", "warehouse"]
};

const troopData = {
  swordsman:["🗡️","Espadachim", "Equilibrado e barato.", 12, {comida:18, ferro:5}],
  archer:["🏹","Arqueiro", "Ataca à distância.", 10, {comida:16, madeira:4}],
  knight:["🐎","Cavaleiro", "Unidade pesada.", 25, {comida:30, ferro:12, ouro:4}]
};

function clone(obj){return JSON.parse(JSON.stringify(obj));}
function loadState(){
  try { return {...clone(defaultState), ...JSON.parse(localStorage.getItem(STORAGE_KEY))}; }
  catch { return clone(defaultState); }
}
function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  toast("Progresso salvo!");
}
function fmt(n){return Math.floor(n).toLocaleString("pt-BR");}
function toast(msg){
  const el=document.getElementById("toast"); el.textContent=msg; el.classList.add("show");
  clearTimeout(window.toastTimer); window.toastTimer=setTimeout(()=>el.classList.remove("show"),1800);
}
function addLog(msg){
  state.log.unshift(msg); state.log=state.log.slice(0,8); renderActivity();
}
function canPay(cost){
  return Object.entries(cost).every(([k,v]) => (state.resources[k]||0)>=v);
}
function pay(cost){Object.entries(cost).forEach(([k,v])=>state.resources[k]-=v);}
function costFor(b){
  const base=state.buildings[b].cost;
  const lv=state.buildings[b].level;
  return Object.fromEntries(Object.entries(base).map(([k,v])=>[k,Math.floor(v*Math.pow(1.55,lv-1))]));
}

function renderResources(){
  const icons={madeira:"🪵",comida:"🌾",pedra:"🪨",ferro:"⛓️",ouro:"🪙"};
  document.getElementById("resources").innerHTML=Object.entries(state.resources)
    .map(([k,v])=>`<div class="resource">${icons[k]}<b>${fmt(v)}</b></div>`).join("");
}
function renderBuildings(){
  const el=document.getElementById("buildings");
  el.innerHTML=Object.entries(buildingData).map(([key,d])=>{
    const b=state.buildings[key], cost=costFor(key);
    const text=Object.entries(cost).map(([k,v])=>`${k}: ${fmt(v)}`).join(" • ");
    const affordable=canPay(cost);
    return `<article class="building">
      <div class="icon">${d[0]}</div><h3>${d[1]} <small>Lv.${b.level}</small></h3>
      <p>${d[2]}<br><span>${text}</span></p>
      <button data-build="${key}" ${affordable?"":"disabled"}>${key==="castle"?"Evoluir":"Construir / evoluir"}</button>
    </article>`;
  }).join("");
}
function renderActivity(){
  document.getElementById("activityLog").innerHTML=state.log.map(x=>`<div>${x}</div>`).join("");
}
function totalPower(){
  return state.troops.swordsman*1 + state.troops.archer*1 + state.troops.knight*3 + state.castleLevel*10;
}
function renderArmy(){
  const el=document.getElementById("armyList");
  el.innerHTML=Object.entries(troopData).map(([key,d])=>{
    const amount=state.troops[key], cost=d[4], can=canPay(cost);
    const text=Object.entries(cost).map(([k,v])=>`${k}: ${v}`).join(" • ");
    return `<article class="army-card">
      <div class="army-icon">${d[0]}</div>
      <div><h3>${d[1]} × ${fmt(amount)}</h3><p>${d[2]} Poder: ${d[3]} • ${text}</p></div>
      <button data-troop="${key}" ${can?"":"disabled"}>Treinar</button>
    </article>`;
  }).join("");
  document.getElementById("playerPower").textContent=`Poder: ${fmt(totalPower())}`;
}
function renderProfile(){
  document.getElementById("profileName").textContent=state.playerName;
  document.getElementById("profileLevel").textContent=state.castleLevel;
  document.getElementById("profilePower").textContent=fmt(totalPower());
  document.getElementById("profileTroops").textContent=fmt(Object.values(state.troops).reduce((a,b)=>a+b,0));
  document.getElementById("castleLevel").textContent=state.castleLevel;
  document.getElementById("playerName").textContent=state.playerName;
}
function renderAll(){renderResources();renderBuildings();renderActivity();renderArmy();renderProfile();}

document.addEventListener("click", e=>{
  const nav=e.target.closest(".nav-item");
  if(nav){
    document.querySelectorAll(".nav-item").forEach(x=>x.classList.remove("active"));
    nav.classList.add("active");
    document.querySelectorAll(".screen").forEach(x=>x.classList.remove("active"));
    document.getElementById(nav.dataset.screen).classList.add("active");
    renderAll();
  }

  const build=e.target.closest("[data-build]");
  if(build) upgradeBuilding(build.dataset.build);

  const troop=e.target.closest("[data-troop]");
  if(troop) trainTroop(troop.dataset.troop);

  const place=e.target.closest("[data-place]");
  if(place) toast(`📍 ${place.dataset.place}`);

  if(e.target.closest("#saveBtn")) saveState();

  if(e.target.closest("#resetBtn")){
    if(confirm("Apagar o progresso deste jogo e começar novamente?")){
      state=clone(defaultState); saveState(); renderAll(); toast("Novo reino criado!");
    }
  }

  if(e.target.closest("#attackBtn")) battle();
});

function upgradeBuilding(key){
  const cost=costFor(key);
  if(!canPay(cost)){toast("Recursos insuficientes.");return;}
  pay(cost);
  state.buildings[key].level++;
  if(key==="castle") state.castleLevel=state.buildings[key].level;
  const name=buildingData[key][1];
  addLog(`🏗️ ${name} evoluiu para nível ${state.buildings[key].level}.`);
  saveSilently(); renderAll(); toast(`${name} evoluído!`);
}
function trainTroop(key){
  const d=troopData[key], cost=d[4];
  if(!canPay(cost)){toast("Recursos insuficientes.");return;}
  pay(cost); state.troops[key]++; addLog(`⚔️ Um ${d[1]} foi treinado.`);
  saveSilently(); renderAll(); toast("Tropa treinada!");
}
function battle(){
  const power=totalPower();
  const result=document.getElementById("battleResult");
  if(power<35){result.textContent="Você precisa de pelo menos 35 de poder para atacar.";return;}
  const chance=Math.min(.95,.45+power/200);
  const win=Math.random()<chance;
  if(win){
    const reward=80+Math.floor(Math.random()*71);
    state.resources.ouro+=reward; state.resources.comida+=50;
    result.textContent=`🏆 Vitória! Você saqueou ${reward} de ouro e 50 de comida.`;
    addLog(`🏆 Vitória contra a Guarnição Rebelde. +${reward} ouro.`);
  }else{
    result.textContent="🛡️ A guarnição resistiu. Treine mais tropas e tente novamente.";
    addLog("⚔️ Seu ataque foi repelido.");
  }
  saveSilently(); renderAll();
}
function saveSilently(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}

setInterval(()=>{
  const production = {
    madeira: state.buildings.sawmill.level*4,
    comida: state.buildings.farm.level*5,
    pedra: state.buildings.quarry.level*3
  };
  Object.entries(production).forEach(([k,v])=>state.resources[k]+=v);
  renderAll(); saveSilently();
},30000);

renderAll();
