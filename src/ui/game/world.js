import { COLORS } from "./model.js";
import { clamp, distance, nearest } from "./compute.js";

export function buildArena(state,w,h) {
  state.player.x=w/2; state.player.y=h/2;
  state.blocks=[
    {x:w*.27,y:h*.34,w:74,h:22,angle:-.35,movable:false},
    {x:w*.70,y:h*.62,w:82,h:24,angle:.55,movable:false},
    {x:w*.52,y:h*.27,w:76,h:20,angle:.2,movable:true},
    {x:w*.32,y:h*.72,w:42,h:42,angle:0,movable:false}
  ];
}

function circleRect(c,r) {
  const dx=c.x-r.x,dy=c.y-r.y, a=r.angle||0;
  const x=dx*Math.cos(a)+dy*Math.sin(a), y=-dx*Math.sin(a)+dy*Math.cos(a);
  const qx=clamp(x,-r.w/2,r.w/2), qy=clamp(y,-r.h/2,r.h/2);
  return (x-qx)**2+(y-qy)**2<c.r*c.r;
}
export function blocked(x,y,r,blocks) {
  return blocks.some(b=>circleRect({x,y,r},b));
}
export function spawnEnemy(state,w,h) {
  const side=Math.floor(Math.random()*4), pad=26;
  const x=side===0?Math.random()*w:side===1?w-pad:Math.random()*w;
  const y=side===2?Math.random()*h:side===3?h-pad:side===0?pad:Math.random()*h;
  const roll=Math.random(), type=roll<.58?"chaser":roll<.83?"runner":"tank";
  const spec={
    chaser:{r:11,hp:3,speed:74,color:COLORS.danger,damage:12,score:10},
    runner:{r:8,hp:1,speed:142,color:COLORS.energy,damage:8,score:15},
    tank:{r:16,hp:9,speed:42,color:COLORS.structure,damage:18,score:25}
  }[type];
  state.enemies.push({x,y,type,...spec,maxHp:spec.hp,flash:0});
}
export function updateWorld(state,dt,w,h) {
  const p=state.player;
  state.spawnTimer-=dt;
  const interval=Math.max(.34,1.45-state.elapsed*.0015);
  if(state.spawnTimer<=0 && state.enemies.length<38){spawnEnemy(state,w,h);state.spawnTimer=interval;}
  if(state.elapsed>=120 && !state.bossSpawned) {
    state.bossSpawned=true;
    state.boss={x:w/2,y:42,r:27,hp:90,maxHp:90,speed:48,fire:1.4,phase:0};
    state.message="裂隙核心守衛已甦醒！";
  }
  for(const e of state.enemies) {
    const dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy)||1;
    const nx=e.x+dx/d*e.speed*dt,ny=e.y+dy/d*e.speed*dt;
    if(!blocked(nx,ny,e.r,state.blocks)){e.x=nx;e.y=ny;}
    e.flash=Math.max(0,e.flash-dt);
    if(d<e.r+p.r+2 && state.hitCooldown<=0) {
      p.hp-=e.damage;state.hitCooldown=.7;state.hitFlash=.16;state.behavior.damage+=1;
      if(p.evade)p.boost=1.1;
    }
  }
  state.hitCooldown=Math.max(0,(state.hitCooldown||0)-dt);
  if(state.boss) {
    const b=state.boss,dx=p.x-b.x,dy=p.y-b.y,d=Math.hypot(dx,dy)||1;
    b.x+=dx/d*b.speed*dt;b.y+=dy/d*b.speed*dt;
    b.fire-=dt;
    if(b.fire<=0) {
      const a=Math.atan2(dy,dx);
      for(let i=-1;i<=1;i++)state.enemyBullets.push({x:b.x,y:b.y,vx:Math.cos(a+i*.22)*190,vy:Math.sin(a+i*.22)*190,r:5,life:4});
      b.fire=1.65;
    }
    if(d<b.r+p.r+4 && state.hitCooldown<=0){p.hp-=22;state.hitCooldown=.85;state.hitFlash=.2;state.behavior.damage+=1;}
  }
  for(const bullet of state.bullets) {
    bullet.x+=bullet.vx*dt;bullet.y+=bullet.vy*dt;bullet.life-=dt;
    if(bullet.curve){bullet.vx+=-bullet.vy*.12*dt;bullet.vy+=bullet.vx*.12*dt;}
    if(state.blocks.some(block=>circleRect(bullet,block))) {
      if(p.reflect&&!bullet.bounced){bullet.vx*=-1;bullet.vy*=-1;bullet.bounced=true;if(p.prism)bullet.damage+=2;}
      else bullet.life=0;
    }
    for(const e of state.enemies) if(e.hp>0&&distance(bullet,e)<e.r+bullet.r) {
      e.hp-=bullet.damage;e.flash=.08;bullet.pierce--;
      if(bullet.pierce<0)bullet.life=0;
      if(p.rift&&Math.random()<.12){bullet.x=w-bullet.x;bullet.y=h-bullet.y;}
      if(e.hp<=0){state.kills++;state.score+=e.score;state.orbs.push({x:e.x,y:e.y,r:5,value:1});}
      break;
    }
    if(state.boss&&distance(bullet,state.boss)<state.boss.r+bullet.r) {
      state.boss.hp-=bullet.damage;bullet.life=0;
      if(state.boss.hp<=0){state.score+=500;state.boss=null;state.message="裂隙核心已瓦解！";}
    }
  }
  state.bullets=state.bullets.filter(b=>b.life>0&&b.x>-20&&b.x<w+20&&b.y>-20&&b.y<h+20);
  state.enemies=state.enemies.filter(e=>e.hp>0);
  for(const b of state.enemyBullets){b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(distance(b,p)<b.r+p.r){p.hp-=9;b.life=0;state.hitFlash=.12;}}
  state.enemyBullets=state.enemyBullets.filter(b=>b.life>0);
  for(const o of state.orbs) {
    const d=distance(o,p);
    if(d<100){o.x+=(p.x-o.x)/Math.max(d,1)*210*dt;o.y+=(p.y-o.y)/Math.max(d,1)*210*dt;}
    if(d<p.r+o.r+3){state.xp+=o.value;o.life=0;}
  }
  state.orbs=state.orbs.filter(o=>o.life!==0);
  while(state.xp>=state.xpNext){state.xp-=state.xpNext;state.level++;state.xpNext=Math.ceil(state.xpNext*1.32);state.paused=true;state.cards=state._drawCards();}
  p.hp=clamp(p.hp,0,p.maxHp);
  if(p.hp<=0){state.ended=true;state.paused=true;}
  if(state.elapsed>=600){state.ended=true;state.paused=true;state.message="你在流形中存活了十分鐘！";}
}

export function fireAtTarget(state) {
  const p=state.player,target=nearest(p,state.enemies.concat(state.boss?[state.boss]:[]));
  if(!target)return;
  const a=Math.atan2(target.y-p.y,target.x-p.x),speed=p.bulletSpeed;
  const fire=(angle)=>state.bullets.push({x:p.x,y:p.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,r:4,life:p.range/speed,damage:2+p.closeDamage,pierce:p.pierce,curve:p.curve,bounced:false});
  fire(a);if(p.spread){fire(a-.24);fire(a+.24);}
}

export function drawWorld(ctx,state,w,h) {
  ctx.fillStyle=COLORS.space;ctx.fillRect(0,0,w,h);
  ctx.save();ctx.globalAlpha=.18;ctx.strokeStyle=COLORS.energy;ctx.lineWidth=1;
  for(let x=0;x<w;x+=42){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
  for(let y=0;y<h;y+=42){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
  ctx.restore();
  for(const b of state.blocks){ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.angle);ctx.fillStyle=b.movable?COLORS.energy:COLORS.structure;ctx.strokeStyle=COLORS.light;ctx.lineWidth=b.movable?2:1;ctx.globalAlpha=.88;ctx.fillRect(-b.w/2,-b.h/2,b.w,b.h);ctx.strokeRect(-b.w/2,-b.h/2,b.w,b.h);ctx.restore();}
  for(const o of state.orbs){ctx.fillStyle=COLORS.energy;ctx.beginPath();ctx.arc(o.x,o.y,o.r,0,Math.PI*2);ctx.fill();}
  for(const b of state.bullets){ctx.fillStyle=COLORS.light;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();}
  for(const b of state.enemyBullets){ctx.fillStyle=COLORS.danger;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();}
  for(const e of state.enemies){ctx.fillStyle=e.flash?COLORS.light:e.color;ctx.beginPath();ctx.arc(e.x,e.y,e.r,0,Math.PI*2);ctx.fill();ctx.strokeStyle=COLORS.ink;ctx.lineWidth=2;ctx.stroke();}
  if(state.boss){const b=state.boss;ctx.fillStyle=COLORS.danger;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();ctx.strokeStyle=COLORS.energy;ctx.lineWidth=4;ctx.stroke();ctx.fillStyle=COLORS.light;ctx.fillRect(b.x-34,b.y-b.r-13,68,5);ctx.fillStyle=COLORS.danger;ctx.fillRect(b.x-34,b.y-b.r-13,68*b.hp/b.maxHp,5);}
  const p=state.player;
  if(p.orbit){for(let i=0;i<p.orbit;i++){const a=state.elapsed*2+i*Math.PI*2/p.orbit;ctx.fillStyle=COLORS.energy;ctx.beginPath();ctx.arc(p.x+Math.cos(a)*29,p.y+Math.sin(a)*29,5,0,Math.PI*2);ctx.fill();}}
  ctx.fillStyle=COLORS.player;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();ctx.strokeStyle=COLORS.light;ctx.lineWidth=2;ctx.stroke();
  if(state.hitFlash>0){ctx.fillStyle="rgba(190,68,73,.16)";ctx.fillRect(0,0,w,h);}
}
