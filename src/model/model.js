export const COLORS = {
  player: "#5D81C7", space: "#37339D", energy: "#9CC9D9",
  danger: "#BE4449", structure: "#B3B3B3", light: "#F3F3F3", ink: "#333333"
};

export const CARD_POOL = [
  { id:"long", name:"長程彈道", kind:"遠程", desc:"子彈射程 +35%", apply:p=>p.range*=1.35 },
  { id:"fast", name:"高速彈頭", kind:"遠程", desc:"子彈速度 +25%", apply:p=>p.bulletSpeed*=1.25 },
  { id:"pierce", name:"穿透彈頭", kind:"遠程", desc:"子彈可多穿透 1 個敵人", apply:p=>p.pierce+=1 },
  { id:"spread", name:"散射彈頭", kind:"近距離", desc:"每次額外發射兩枚側向子彈", apply:p=>p.spread=true },
  { id:"orbit", name:"環繞彈頭", kind:"近距離", desc:"獲得一枚環繞自身的守護子彈", apply:p=>p.orbit+=1 },
  { id:"close", name:"近距離增幅", kind:"近距離", desc:"近距離命中傷害 +2", apply:p=>p.closeDamage+=2 },
  { id:"kinetic", name:"動能增幅", kind:"機動", desc:"移動時射速提升 25%", apply:p=>p.moveFireRate*=.75 },
  { id:"curve", name:"軌跡彈道", kind:"機動", desc:"子彈帶有弧形偏轉", apply:p=>p.curve=true },
  { id:"evade", name:"閃避回饋", kind:"機動", desc:"每次受傷後短暫提高移速", apply:p=>p.evade=true },
  { id:"reflect", name:"反射彈頭", kind:"空間", desc:"子彈碰到方塊後可反彈", apply:p=>p.reflect=true },
  { id:"prism", name:"空間折射", kind:"空間", desc:"反彈子彈傷害 +2", apply:p=>p.prism=true },
  { id:"rift", name:"穿越彈頭", kind:"空間", desc:"子彈命中後有機率穿越至另一側", apply:p=>p.rift=true }
];

export function createState() {
  return {
    running:true, paused:false, ended:false, elapsed:0, score:0, kills:0, level:1, xp:0, xpNext:5, hitCooldown:0,
    player:{x:0,y:0,r:12,hp:100,maxHp:100,speed:220,fireTimer:0,bulletSpeed:470,range:440,pierce:0,spread:false,orbit:0,closeDamage:0,moveFireRate:1,curve:false,evade:false,reflect:false,prism:false,rift:false,boost:0},
    enemies:[], bullets:[], enemyBullets:[], orbs:[], particles:[],
    blocks:[], spawnTimer:0, bossSpawned:false, boss:null, cards:[], selectedCard:null,
    behavior:{move:0,still:0,close:0,far:0,block:0,damage:0,window:[]},
    input:{x:0,y:0,keys:new Set(),pointer:false,pointerX:0,pointerY:0},
    lastTime:0, hitFlash:0, message:"移動、閃避，讓空間替你作戰。"
  };
}
