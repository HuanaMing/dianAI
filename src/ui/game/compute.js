import { CARD_POOL } from "./model.js";

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
export function nearest(from, items) {
  let best=null, bestD=Infinity;
  for (const item of items) { const d=distance(from,item); if(d<bestD){best=item;bestD=d;} }
  return best;
}

export function recordBehavior(state, dt) {
  const p=state.player, input=state.input;
  const moving=Math.hypot(input.x,input.y)>.12;
  const nearby=state.enemies.length ? Math.min(...state.enemies.map(e=>distance(p,e))) : 220;
  const sample={move:moving?1:0,close:nearby<105?1:0,far:nearby>220?1:0,block:0};
  state.behavior.move += sample.move*dt;
  state.behavior.still += (moving?0:dt);
  state.behavior.close += sample.close*dt;
  state.behavior.far += sample.far*dt;
  state.behavior.window.push(sample);
  if(state.behavior.window.length>240) state.behavior.window.shift();
}

export function drawWeightedCards(state, count=3) {
  const b=state.behavior, total=Math.max(.1,b.move+b.still+b.close+b.far+b.block);
  const ratios={mobility:b.move/total,close:b.close/total,ranged:b.far/total,space:b.block/total};
  const weights={
    遠程:1+ratios.ranged*2.4,
    近距離:1+ratios.close*2.4,
    機動:1+ratios.mobility*2.4,
    空間:1+ratios.space*2.4
  };
  const pool=[...CARD_POOL], picked=[];
  while(pool.length && picked.length<count) {
    const sum=pool.reduce((n,c)=>n+weights[c.kind],0);
    let roll=Math.random()*sum, index=0;
    for(;index<pool.length-1;index++){roll-=weights[pool[index].kind];if(roll<=0)break;}
    picked.push(pool.splice(index,1)[0]);
  }
  return picked;
}
