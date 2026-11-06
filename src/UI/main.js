import { COLORS, createState } from "../model/model.js";
import { clamp, drawWeightedCards, recordBehavior, nearest } from "../compute/compute.js";
import { buildArena, blocked, updateWorld, fireAtTarget, drawWorld } from "../world/world.js";

const canvas=document.querySelector("#arena"),ctx=canvas.getContext("2d");
const hud={hp:document.querySelector("#hp"),xp:document.querySelector("#xp"),level:document.querySelector("#level"),time:document.querySelector("#time"),kills:document.querySelector("#kills"),score:document.querySelector("#score"),message:document.querySelector("#message")};
const overlay=document.querySelector("#overlay"),overlayTitle=document.querySelector("#overlay-title"),overlayCopy=document.querySelector("#overlay-copy"),overlayActions=document.querySelector("#overlay-actions");
const joystick=document.querySelector("#joystick"),stick=document.querySelector("#stick");
let state=createState(),width=0,height=0,dpr=1,joystickPointer=null,stickCenter={x:0,y:0};
state._drawCards=()=>drawWeightedCards(state);

function resize(){
  const rect=canvas.getBoundingClientRect();dpr=Math.min(window.devicePixelRatio||1,2);
  width=Math.max(320,rect.width);height=Math.max(360,rect.height);
  canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
  if(!state._built){buildArena(state,width,height);state._built=true;}
}
window.addEventListener("resize",resize);resize();
state.paused=true;
function showOverlay(title,copy,actions){
  overlayTitle.textContent=title;overlayCopy.textContent=copy;overlayActions.replaceChildren();
  for(const item of actions){const button=document.createElement("button");button.className="action";button.textContent=item.label;button.addEventListener("click",item.run);overlayActions.append(button);}
  overlay.hidden=false;
}
function hideOverlay(){overlay.hidden=true;}
function startGame(){state.paused=false;state.started=true;hideOverlay();state.message="自動射擊已啟動。靠近青色方塊，按 E 改變它的方向。";}
function restart(){
  const keepSize={w:width,h:height};state=createState();state._drawCards=()=>drawWeightedCards(state);state.paused=false;state.started=true;state.hitCooldown=0;buildArena(state,keepSize.w,keepSize.h);state._built=true;hideOverlay();
}
function levelUp(){
  const cards=state.cards;
  showOverlay("流形迴響 · 能力共振","你的近期行為改變了候選卡片權重。選擇一項強化。",cards.map(card=>({label:card.kind+"｜"+card.name+" — "+card.desc,run:()=>{card.apply(state.player);state.selectedCard=card.id;state.paused=false;state.cards=[];hideOverlay();state.message="已取得「"+card.name+"」。世界記住了你的選擇。";}})));
}
function endGame(){
  const won=state.player.hp>0;
  showOverlay(won?"存活完成":"訊號中斷","存活時間 "+formatTime(state.elapsed)+" · 擊敗 "+state.kills+" 個敵人 · 得分 "+state.score,[{label:"再進行一次",run:restart}]);
}
function formatTime(seconds){const n=Math.floor(seconds);return String(Math.floor(n/60)).padStart(2,"0")+":"+String(n%60).padStart(2,"0");}
function updateHud(){
  hud.hp.textContent=Math.ceil(state.player.hp)+" / "+state.player.maxHp;
  hud.xp.textContent=state.xp+" / "+state.xpNext;hud.level.textContent=state.level;
  hud.time.textContent=formatTime(state.elapsed);hud.kills.textContent=state.kills;hud.score.textContent=state.score;
  hud.message.textContent=state.message;
  document.querySelector("#hp-fill").style.width=(state.player.hp/state.player.maxHp*100)+"%";
  document.querySelector("#xp-fill").style.width=(state.xp/state.xpNext*100)+"%";
}
function inputVector(){
  const keys=state.input.keys;let x=state.input.x,y=state.input.y;
  if(keys.has("a")||keys.has("arrowleft"))x-=1;if(keys.has("d")||keys.has("arrowright"))x+=1;
  if(keys.has("w")||keys.has("arrowup"))y-=1;if(keys.has("s")||keys.has("arrowdown"))y+=1;
  const length=Math.hypot(x,y);return length>1?{x:x/length,y:y/length}:{x,y};
}
function rotateBlock(){
  const block=nearest(state.player,state.blocks.filter(b=>b.movable));
  if(block&&Math.hypot(block.x-state.player.x,block.y-state.player.y)<150){block.angle+=Math.PI/4;state.behavior.block+=1;state.message="空間方塊已旋轉，子彈路徑也隨之改變。";}
  else state.message="靠近青色可操控方塊才能改變它。";
}
window.addEventListener("keydown",e=>{
  const key=e.key.toLowerCase();if(["arrowup","arrowdown","arrowleft","arrowright"," "].includes(key))e.preventDefault();
  state.input.keys.add(key);
  if(key==="e"&&!e.repeat&&!state.paused)rotateBlock();
  if(key===" "&&state.ended)restart();
});
window.addEventListener("keyup",e=>state.input.keys.delete(e.key.toLowerCase()));
window.addEventListener("blur",()=>{state.input.keys.clear();state.input.x=0;state.input.y=0;});
function joystickMove(e){
  const rect=joystick.getBoundingClientRect(),cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
  const dx=e.clientX-cx,dy=e.clientY-cy,max=rect.width*.34,len=Math.hypot(dx,dy)||1;
  const scale=Math.min(1,max/len);state.input.x=dx/max*scale;state.input.y=dy/max*scale;
  stick.style.transform="translate("+dx*scale+"px,"+dy*scale+"px)";
}
joystick.addEventListener("pointerdown",e=>{joystickPointer=e.pointerId;joystick.setPointerCapture(e.pointerId);joystickMove(e);});
joystick.addEventListener("pointermove",e=>{if(e.pointerId===joystickPointer)joystickMove(e);});
function releaseStick(){joystickPointer=null;state.input.x=0;state.input.y=0;stick.style.transform="translate(0,0)";}
joystick.addEventListener("pointerup",releaseStick);joystick.addEventListener("pointercancel",releaseStick);
document.querySelector("#rotate").addEventListener("click",rotateBlock);
canvas.addEventListener("pointerdown",e=>{
  if(e.pointerType==="touch")return;
  const rect=canvas.getBoundingClientRect(),x=e.clientX-rect.left,y=e.clientY-rect.top;
  const block=state.blocks.find(b=>b.movable&&Math.hypot(b.x-x,b.y-y)<70);
  if(block){block.angle+=Math.PI/4;state.behavior.block+=1;state.message="空間方塊已旋轉。";}
});
function step(now){
  const dt=Math.min(.033,(now-(state.lastTime||now))/1000);state.lastTime=now;
  if(state.started&&!state.paused&&!state.ended){
    state.elapsed+=dt;state.hitFlash=Math.max(0,state.hitFlash-dt);
    const v=inputVector(),p=state.player;state.input.x=v.x;state.input.y=v.y;
    const speed=p.speed*(p.boost>0?1.45:1);p.boost=Math.max(0,p.boost-dt);
    const nx=clamp(p.x+v.x*speed*dt,p.r,width-p.r),ny=clamp(p.y+v.y*speed*dt,p.r,height-p.r);
    if(!blocked(nx,p.y,p.r,state.blocks))p.x=nx;if(!blocked(p.x,ny,p.r,state.blocks))p.y=ny;
    recordBehavior(state,dt);
    p.fireTimer-=dt*(Math.hypot(v.x,v.y)>.1?1/p.moveFireRate:1);
    if(p.fireTimer<=0){fireAtTarget(state);p.fireTimer=.48;}
    updateWorld(state,dt,width,height);
    if(state.paused&&state.cards.length)levelUp();
    if(state.ended)endGame();
  }
  drawWorld(ctx,state,width,height);updateHud();requestAnimationFrame(step);
}
showOverlay("流形迴響","一個會回應你行為的生存戰場。WASD／方向鍵或左下搖桿移動；子彈自動攻擊。靠近青色方塊，按 E 或觸控按鈕旋轉它。",[ {label:"進入戰場",run:startGame} ]);
requestAnimationFrame(step);
