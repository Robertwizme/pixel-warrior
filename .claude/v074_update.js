#!/usr/bin/env node
// v074_update.js — v0.7.4
// 1. 万剑归宗 (fsUltra): attack speed x2, swords auto-return at max range
// 2. New weapon: 召唤术·玄武 (Black Tortoise, full 8-level upgrade tree)
//    - Every 10s: summon tortoise; every 3s: 3 spread water balls; every 60s: player shield
//    - Lv2/3/5/6: 玄龟防守 / 玄龟圣水 / 玄龟金身
//    - Lv4: 玄武召唤 / 玄武守护 / 毒蛇之咬
//    - Lv7: 神兽威压 / 神兽真身 / 玄武不灭功
//    - Lv8: 真·玄武

const fs = require('fs'), path = require('path');
const HTML = path.join(__dirname, '..', 'index.html');
let h = fs.readFileSync(HTML, 'utf8'), ok = true;

function rep(a, b, label) {
  if (!h.includes(a)) { console.error('FAIL [' + label + ']\n  anchor: ' + a.slice(0,100)); ok = false; return; }
  h = h.replace(a, b);
  console.log('✓', label);
}

// ── 1. fsUltra: double attack speed ──
rep(
`  const ATK_SPD  = 380;
  const globalTgt = nearestEnemy(p.x, p.y);`,
`  const ATK_SPD  = w.fsUltra ? 760 : 380;
  const globalTgt = nearestEnemy(p.x, p.y);`,
'fsUltra: double ATK_SPD'
);

// ── 2. fsUltra: auto-return when sword flies beyond max range ──
rep(
`      sword.x += sword.vx*dt; sword.y += sword.vy*dt;

      if (sword.hitCd<=0) {`,
`      sword.x += sword.vx*dt; sword.y += sword.vy*dt;
      // Ultra: auto-return when sword flies beyond max range
      if (w.fsUltra) {
        const _dfp = Math.sqrt((sword.x-p.x)**2+(sword.y-p.y)**2);
        if (_dfp > 350) { sword.state='orbit'; sword.vx=0; sword.vy=0; }
      }

      if (sword.hitCd<=0) {`,
'fsUltra: max-range auto-return'
);

// ── 3. Update ultra description ──
rep(
`      desc:'+2把飞剑·穿透敌人·攻速翻倍·锁定同一目标呈扇形齐射' },`,
`      desc:'+2把飞剑·穿透·攻速翻倍·扇形锁定·飞出自动返回' },`,
'fsUltra: update description'
);

// ── 4. Load IMG_BLACK_TORTOISE ──
rep(
`IMG_REAPER.src = IMG_SRC_REAPER;`,
`IMG_REAPER.src = IMG_SRC_REAPER;
const IMG_BLACK_TORTOISE = new Image();
IMG_BLACK_TORTOISE.src = 'Black Tortoise.png';`,
'IMG_BLACK_TORTOISE: load'
);

// ── 5. WEAPON_DEFS: add black_tortoise ──
rep(
`      return \`当前: \${form} | Lv\${lv}\`;
    }
  },
};`,
`      return \`当前: \${form} | Lv\${lv}\`;
    }
  },
  black_tortoise: {
    name:'召唤术·玄武', icon:'🐢', maxLv:8, type:'summon',
    startDesc: '每10秒召唤玄武·每3秒发射3颗水球·每60秒为玩家护盾',
    levels: [
      {ballDmg:18},{ballDmg:23},{ballDmg:29},{ballDmg:36},
      {ballDmg:44},{ballDmg:54},{ballDmg:66},{ballDmg:80},
    ],
    describe: lv => {
      const _btw = gs?.weapons?.find(x=>x.id==='black_tortoise');
      const _bl = [18,23,29,36,44,54,66,80][lv-1]||18;
      const dmg = Math.round(_bl * (_btw?.btBallDmgMult||1));
      const scd = Math.max(20, (_btw?.btShieldInterval||60));
      return \`水球x3 伤害\${dmg} | 护盾CD\${scd}s\`;
    }
  },
};`,
'WEAPON_DEFS: black_tortoise'
);

// ── 6. Shield absorption in player damage code ──
rep(
`        // Damage reduction
        const actualDmg = e.dmg * (1 - p.dmgReduction) * (1 - Math.min(0.8,(e.paralysisStacks||0)*0.08));
        p.hp -= actualDmg;`,
`        // Shield (Black Tortoise)
        if ((p.btShield||0) > 0) {
          p.btShield--;
          e.attackTimer = 0.75; p.invincible = 0.3; updateHUD();
          if (settings.particles) spawnParticles(p.x,p.y,['#4af','#8cf','#fff'],6,70,0.4,2);
          addFloatingText('🛡 护盾！',p.x,p.y-22,'#4af',0.9);
          continue;
        }
        // Damage reduction
        const actualDmg = e.dmg * (1 - p.dmgReduction) * (1 - Math.min(0.8,(e.paralysisStacks||0)*0.08));
        p.hp -= actualDmg;`,
'shield: block damage'
);

// ── 7. Undying mechanic: prevent death once per 150s ──
rep(
`        if (p.hp<=0) { p.hp=0; gs.phase='dead'; showDeadScreen(); }`,
`        if (p.hp<=0) {
          const _btUw = getWeapon('black_tortoise');
          if (_btUw?.btUndying && (_btUw.btUndyingCd||0)<=0) {
            p.hp=1; _btUw.btUndyingCd=150; p.invincible=3.0*(p.invincMult||1);
            p.dmgMult=+((p.dmgMult||1)*2).toFixed(4);
            setTimeout(()=>{ if(gs?.player) gs.player.dmgMult=+(gs.player.dmgMult/2).toFixed(4); },3000);
            healPlayer(Math.floor(p.maxHp*0.25));
            addFloatingText('💎 不灭！',p.x,p.y-40,'#fd4',2.0);
            if(settings.particles) spawnParticles(p.x,p.y,['#fd4','#fff','#f84'],18,140,1.2,6);
          } else { p.hp=0; gs.phase='dead'; showDeadScreen(); }
        }`,
'undying: death prevention'
);

// ── 8. Add getBlackTortoiseUpgradeCards + updateBlackTortoise + renderBlackTortoise ──
rep(
`  if (hasElem) opts.push({ type:'fsword_upgrade', fsOp:'specialized', weapId:'flying_sword', icon:'🎯', name:'专攻弱点',
    desc:'飞剑每次命中额外施加1层元素效果（需先选4级元素）' });
  return opts;
}`,
`  if (hasElem) opts.push({ type:'fsword_upgrade', fsOp:'specialized', weapId:'flying_sword', icon:'🎯', name:'专攻弱点',
    desc:'飞剑每次命中额外施加1层元素效果（需先选4级元素）' });
  return opts;
}
function getBlackTortoiseUpgradeCards(w) {
  const _to = {
    defend:     { type:'btort_upgrade', btOp:'defend',     weapId:'black_tortoise', icon:'🛡', name:'玄龟防守',   desc:'护盾CD -10秒（可叠加）' },
    holywater:  { type:'btort_upgrade', btOp:'holywater',  weapId:'black_tortoise', icon:'💧', name:'玄龟圣水',   desc:'水球伤害 +30%' },
    goldenbody: { type:'btort_upgrade', btOp:'goldenbody', weapId:'black_tortoise', icon:'✨', name:'玄龟金身',   desc:'体型+15% · 水球伤害+15%' },
    summon2:    { type:'btort_upgrade', btOp:'summon2',    weapId:'black_tortoise', icon:'🐢', name:'玄武召唤',   desc:'召唤2只小玄武（25%伤害·无护盾）' },
    guardian:   { type:'btort_upgrade', btOp:'guardian',   weapId:'black_tortoise', icon:'⚔', name:'玄武守护',   desc:'护盾变3层 · CD+5s · 减伤10%' },
    snakebite:  { type:'btort_upgrade', btOp:'snakebite',  weapId:'black_tortoise', icon:'🐍', name:'毒蛇之咬',   desc:'水球附3层毒 · 命中留毒液池' },
    aura:       { type:'btort_upgrade', btOp:'aura',       weapId:'black_tortoise', icon:'🌀', name:'神兽威压',   desc:'玄武周围80px内敌人持续减速' },
    trueform:   { type:'btort_upgrade', btOp:'trueform',   weapId:'black_tortoise', icon:'🔱', name:'神兽真身',   desc:'体型+50% · 每8秒朝敌冲锋3倍伤害' },
    undying:    { type:'btort_upgrade', btOp:'undying',    weapId:'black_tortoise', icon:'💎', name:'玄武不灭功', desc:'致命一击→3秒无敌+伤害×2+回血25%（CD150s）' },
    ultra:      { type:'btort_upgrade', btOp:'ultra',      weapId:'black_tortoise', icon:'🌟', name:'真·玄武',    desc:'每10秒神兽从天而降·范围AoE+击退' },
  };
  const next = w.level+1;
  if (next===4) return [_to.summon2, _to.guardian, _to.snakebite];
  if (next===7) return [_to.aura, _to.trueform, _to.undying];
  if (next===8) return [_to.ultra];
  return [_to.defend, _to.holywater, _to.goldenbody];
}
function updateBlackTortoise(dt) {
  const w = getWeapon('black_tortoise');
  if (!w) return;
  const p = gs.player;
  const lvDef = WEAPON_DEFS.black_tortoise.levels[w.level-1]||{};
  const ballDmg = Math.round((lvDef.ballDmg||18)*(w.btBallDmgMult||1)*(p.dmgMult||1));
  const sizeMult = w.btSizeMult||1;
  if (w.btSummonTimer===undefined) w.btSummonTimer=0;
  if (w.btShieldTimer===undefined) w.btShieldTimer=w.btShieldInterval||60;
  if (!w.btBalls) w.btBalls=[];
  // Summon timer
  w.btSummonTimer-=dt;
  if (w.btSummonTimer<=0) {
    w.btSummonTimer=10;
    if (!w.btMiniMode) {
      if (!w.btEntity||!w.btEntity.active) {
        const ang=Math.random()*Math.PI*2;
        w.btEntity={x:p.x+Math.cos(ang)*45,y:p.y+Math.sin(ang)*45,shootTimer:1.0,facingRight:true,active:true,chargeTimer:8,charging:false,chargeVx:0,chargeVy:0,chargeDur:0};
        addFloatingText('🐢 玄武降临！',p.x,p.y-40,'#4af',1.2);
      }
    } else {
      if (!w.btMinis) w.btMinis=[];
      if (w.btMinis.length<2) {
        while(w.btMinis.length<2){const idx=w.btMinis.length,ang=(idx/2)*Math.PI*2+0.3;w.btMinis.push({x:p.x+Math.cos(ang)*50,y:p.y+Math.sin(ang)*50,shootTimer:1+idx*0.6,facingRight:idx===0,active:true});}
        addFloatingText('🐢🐢 双玄武！',p.x,p.y-40,'#4af',1.2);
      }
    }
  }
  // Shield timer (disabled in mini mode unless guardian)
  if (!w.btMiniMode||w.btGuardian) {
    w.btShieldTimer-=dt;
    if (w.btShieldTimer<=0) {
      w.btShieldTimer=w.btShieldInterval||60;
      const maxS=w.btGuardian?3:1;
      if ((p.btShield||0)<maxS) {
        p.btShield=maxS; updateHUD();
        if(settings.particles) spawnParticles(p.x,p.y,['#4af','#8cf','#fff'],8,80,0.5,3);
        addFloatingText('🛡 护盾！',p.x,p.y-30,'#8cf',1.2);
      }
    }
  }
  // Undying CD tick
  if (w.btUndying) w.btUndyingCd=Math.max(0,(w.btUndyingCd||0)-dt);
  // Guardian: 10% dmg reduction (applied once on pickup, not per frame)
  if (w.btGuardian&&!w.btGuardianApplied) { w.btGuardianApplied=true; p.baseDmgRed=Math.min(0.8,(p.baseDmgRed||0)+0.10); updateDerivedStats(p); }
  // Aura: slow nearby enemies
  if (w.btAura&&w.btEntity&&w.btEntity.active) {
    const ar2=(80*sizeMult)**2;
    gs.enemies.forEach(e=>{if(e.dead)return;const dx=e.x-w.btEntity.x,dy=e.y-w.btEntity.y;if(dx*dx+dy*dy<ar2)e.slowTimer=Math.max(e.slowTimer||0,0.5);});
  }
  // Follow player helper
  const followT=(ent)=>{const tdist=50*sizeMult,dx=p.x-ent.x,dy=p.y-ent.y,d=Math.sqrt(dx*dx+dy*dy)||1;if(d>tdist+30){const spd=Math.min(d*2,80)*dt;ent.x+=(dx/d)*spd;ent.y+=(dy/d)*spd;}if(dx>2)ent.facingRight=true;else if(dx<-2)ent.facingRight=false;};
  // Shoot water balls helper
  const shootB=(ent,mini)=>{ent.shootTimer-=dt;if(ent.shootTimer>0)return;ent.shootTimer=3.0;const tgt=nearestEnemy(ent.x,ent.y);if(!tgt)return;const base=Math.atan2(tgt.y-ent.y,tgt.x-ent.x),dm=mini?0.25:1;for(let i=0;i<3;i++){const ang=base+(i-1)*0.25;w.btBalls.push({x:ent.x,y:ent.y,vx:Math.cos(ang)*160,vy:Math.sin(ang)*160,dmg:Math.round(ballDmg*dm),hitCd:0,life:3.5,poison:!!w.btPoison});}};
  // True form: charge attack every 8s
  if (w.btTrueForm&&w.btEntity&&w.btEntity.active) {
    w.btEntity.chargeTimer-=dt;
    if (w.btEntity.chargeTimer<=0) {
      w.btEntity.chargeTimer=8;
      const tgt=nearestEnemy(w.btEntity.x,w.btEntity.y);
      if(tgt){w.btEntity.charging=true;w.btEntity.chargeDur=0.4;const ca=Math.atan2(tgt.y-w.btEntity.y,tgt.x-w.btEntity.x);w.btEntity.chargeVx=Math.cos(ca)*300;w.btEntity.chargeVy=Math.sin(ca)*300;}
    }
    if (w.btEntity.charging) {
      w.btEntity.chargeDur-=dt; w.btEntity.x+=w.btEntity.chargeVx*dt; w.btEntity.y+=w.btEntity.chargeVy*dt;
      gs.enemies.forEach(e=>{if(e.dead)return;const dx=e.x-w.btEntity.x,dy=e.y-w.btEntity.y;if(dx*dx+dy*dy<(22*sizeMult)**2){hitEnemy(e,Math.round(ballDmg*3));e.stunStacks=Math.min(10,(e.stunStacks||0)+1);}});
      if(w.btEntity.chargeDur<=0)w.btEntity.charging=false;
    }
  }
  // Ultra: falling giant tortoise every 10s
  if (w.btUltra) {
    w.btUltraTimer=(w.btUltraTimer||0)-dt;
    if (w.btUltraTimer<=0) {
      w.btUltraTimer=10;
      const tgt=nearestEnemy(p.x,p.y);
      const fx=tgt?tgt.x:p.x+(Math.random()-0.5)*120,fy=tgt?tgt.y:p.y+(Math.random()-0.5)*120;
      if(!w.btUltraAnims)w.btUltraAnims=[];
      w.btUltraAnims.push({x:fx,y:fy,timer:0.6,totalTime:0.6,hitDone:false});
      addFloatingText('⚠ 神兽降临！',fx,fy-50,'#fd4',1.5);
    }
    if (w.btUltraAnims) {
      w.btUltraAnims=w.btUltraAnims.filter(ua=>{
        ua.timer-=dt;
        if(!ua.hitDone&&ua.timer<0.2){ua.hitDone=true;const r2=80*80;gs.enemies.forEach(e=>{if(e.dead)return;const dx=e.x-ua.x,dy=e.y-ua.y;if(dx*dx+dy*dy<r2){hitEnemy(e,Math.round(ballDmg*5));const kd=Math.sqrt(dx*dx+dy*dy)||1;e.x+=(dx/kd)*40;e.y+=(dy/kd)*40;e.stunStacks=Math.min(10,(e.stunStacks||0)+2);}});if(settings.particles)spawnParticles(ua.x,ua.y,['#4af','#8cf','#aaf','#fff'],20,140,1.0,6);}
        return ua.timer>0;
      });
    }
  }
  // Update main / mini tortoises
  if (!w.btMiniMode) {
    if (w.btEntity&&w.btEntity.active){if(!w.btEntity.charging)followT(w.btEntity);shootB(w.btEntity,false);}
  } else {
    if (!w.btMinis)w.btMinis=[];
    w.btMinis.forEach(m=>{if(m.active){followT(m);shootB(m,true);}});
  }
  // Update water balls
  w.btBalls=w.btBalls.filter(ball=>{
    ball.life-=dt; if(ball.life<=0)return false;
    ball.x+=ball.vx*dt; ball.y+=ball.vy*dt;
    ball.hitCd=Math.max(0,(ball.hitCd||0)-dt);
    if(ball.hitCd<=0){const hit=gs.enemies.find(e=>!e.dead&&(e.x-ball.x)**2+(e.y-ball.y)**2<(7+e.radius)**2);if(hit){hitEnemy(hit,ball.dmg);if(ball.poison){hit.poisonStacks=Math.min(10,(hit.poisonStacks||0)+3);if(!w.btPuddles)w.btPuddles=[];w.btPuddles.push({x:ball.x,y:ball.y,timer:3.5,tickTimer:0.4});}return false;}}
    return true;
  });
  // Update poison puddles
  if (w.btPuddles) {
    w.btPuddles=w.btPuddles.filter(pd=>{pd.timer-=dt;if(pd.timer<=0)return false;pd.tickTimer-=dt;if(pd.tickTimer<=0){pd.tickTimer=0.4;gs.enemies.forEach(e=>{if(e.dead)return;const dx=e.x-pd.x,dy=e.y-pd.y;if(dx*dx+dy*dy<28*28){e.poisonStacks=Math.min(10,(e.poisonStacks||0)+1);hitEnemy(e,Math.round(ballDmg*0.15));}});}return true;});
  }
}
function renderBlackTortoise(ctx, cam) {
  const w = typeof getWeapon==='function' ? getWeapon('black_tortoise') : null;
  if (!w) return;
  const sizeMult = w.btSizeMult||1;
  const p = gs.player;
  // Water balls
  if (w.btBalls) {
    w.btBalls.forEach(ball=>{
      const bx=Math.floor(ball.x-cam.x),by=Math.floor(ball.y-cam.y);
      ctx.globalAlpha=0.85; ctx.fillStyle=ball.poison?'#8f4':'#4af';
      ctx.beginPath();ctx.arc(bx,by,5,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=0.5; ctx.fillStyle='#dff';
      ctx.beginPath();ctx.arc(bx-1,by-1,2,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=1;
    });
  }
  // Poison puddles
  if (w.btPuddles) {
    w.btPuddles.forEach(pd=>{
      const px=Math.floor(pd.x-cam.x),py=Math.floor(pd.y-cam.y);
      ctx.globalAlpha=Math.min(0.35,pd.timer*0.1); ctx.fillStyle='#6f3';
      ctx.beginPath();ctx.arc(px,py,28,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=1;
    });
  }
  // Ultra impact animations
  if (w.btUltraAnims) {
    w.btUltraAnims.forEach(ua=>{
      const ux=Math.floor(ua.x-cam.x),uy=Math.floor(ua.y-cam.y);
      const prog=1-ua.timer/ua.totalTime;
      ctx.globalAlpha=0.5*(1-prog); ctx.fillStyle='#4af';
      ctx.beginPath();ctx.arc(ux,uy,80*prog,0,Math.PI*2);ctx.fill();
      const _bti=typeof IMG_BLACK_TORTOISE!=='undefined'&&IMG_BLACK_TORTOISE.complete&&IMG_BLACK_TORTOISE.naturalWidth>0;
      if(_bti){ctx.globalAlpha=0.9*(1-prog*0.5);ctx.save();ctx.translate(ux,uy-60*(1-prog));const gs2=64*(0.5+prog*0.5);ctx.drawImage(IMG_BLACK_TORTOISE,-gs2/2,-gs2/2,gs2,gs2);ctx.restore();}
      ctx.globalAlpha=1;
    });
  }
  // Draw single tortoise helper
  const drawT=(ent,sc)=>{
    const tx=Math.floor(ent.x-cam.x),ty=Math.floor(ent.y-cam.y);
    const dw=Math.round(32*sc),dh=Math.round(32*sc);
    const _bti=typeof IMG_BLACK_TORTOISE!=='undefined'&&IMG_BLACK_TORTOISE.complete&&IMG_BLACK_TORTOISE.naturalWidth>0;
    ctx.save(); ctx.translate(tx,ty);
    if(!ent.facingRight)ctx.scale(-1,1);
    if(_bti){ctx.drawImage(IMG_BLACK_TORTOISE,-dw/2,-dh/2,dw,dh);}
    else{ctx.fillStyle='#2a5a3a';ctx.beginPath();ctx.arc(0,0,dw/2,0,Math.PI*2);ctx.fill();ctx.fillStyle='#3d8a55';ctx.beginPath();ctx.arc(0,0,dw/3,0,Math.PI*2);ctx.fill();ctx.fillStyle='#5fc47a';ctx.fillRect(-3,-3,6,6);}
    ctx.restore();
  };
  if (!w.btMiniMode&&w.btEntity&&w.btEntity.active) drawT(w.btEntity,sizeMult);
  if (w.btMiniMode&&w.btMinis) w.btMinis.forEach(m=>{if(m.active)drawT(m,0.6*sizeMult);});
  // Shield ring on player
  if ((p.btShield||0)>0) {
    const px2=Math.floor(p.x-cam.x),py2=Math.floor(p.y-cam.y);
    ctx.globalAlpha=0.5+0.3*Math.sin(performance.now()/200);
    ctx.strokeStyle='#4af'; ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(px2,py2,14+(p.btShield-1)*3,0,Math.PI*2);ctx.stroke();
    ctx.globalAlpha=1; ctx.lineWidth=1;
  }
}`,
'add getBlackTortoiseUpgradeCards + updateBlackTortoise + renderBlackTortoise'
);

// ── 9. applyUpgradeEffect: add btort_upgrade handler ──
rep(
`    else if (opt.fsOp==='specialized'){ _fw.fsSpecialized=true; }
  } else if (opt.type === 'missileup') {`,
`    else if (opt.fsOp==='specialized'){ _fw.fsSpecialized=true; }
  } else if (opt.type === 'btort_upgrade') {
    const _bt = getWeapon('black_tortoise');
    if (!_bt) return;
    _bt.level = Math.min(WEAPON_DEFS.black_tortoise.maxLv, _bt.level+1);
    if      (opt.btOp==='defend')      { _bt.btDefendCount=(_bt.btDefendCount||0)+1; _bt.btShieldInterval=Math.max(20,60-(_bt.btDefendCount||0)*10); }
    else if (opt.btOp==='holywater')   { _bt.btBallDmgMult=+((_bt.btBallDmgMult||1)*1.30).toFixed(4); }
    else if (opt.btOp==='goldenbody')  { _bt.btSizeMult=+((_bt.btSizeMult||1)*1.15).toFixed(4); _bt.btBallDmgMult=+((_bt.btBallDmgMult||1)*1.15).toFixed(4); }
    else if (opt.btOp==='summon2')     { _bt.btMiniMode=true; if(!_bt.btMinis)_bt.btMinis=[]; }
    else if (opt.btOp==='guardian')    { _bt.btGuardian=true; _bt.btShieldInterval=(_bt.btShieldInterval||60)+5; }
    else if (opt.btOp==='snakebite')   { _bt.btPoison=true; }
    else if (opt.btOp==='aura')        { _bt.btAura=true; }
    else if (opt.btOp==='trueform')    { _bt.btTrueForm=true; _bt.btSizeMult=+((_bt.btSizeMult||1)*1.50).toFixed(4); }
    else if (opt.btOp==='undying')     { _bt.btUndying=true; _bt.btUndyingCd=0; }
    else if (opt.btOp==='ultra')       { _bt.btUltra=true; }
  } else if (opt.type === 'missileup') {`,
'applyUpgradeEffect: btort_upgrade handler'
);

// ── 10. getUpgradeOptions: integrate black_tortoise (fixed tiers + pool + exclusion) ──
rep(
`  const flyingW = getWeapon('flying_sword');
  if (flyingW && [4,7,8].includes(flyingW.level+1) && flyingW.level < WEAPON_DEFS.flying_sword.maxLv)
    return getFlyingSwordUpgradeCards(flyingW).slice(0, cardCount);

  // ── Build weapon pools (priority: owned upgrades → new weapons) ──
  const upgradePool = []; // upgrades for weapons player already owns
  const newWeapPool = []; // new weapons player doesn't have yet

  // Branching weapon random-tier cards → upgradePool (owned)
  if (shotgunW && shotgunW.level < WEAPON_DEFS.shotgun.maxLv)
    getShotgunUpgradeCards(shotgunW).forEach(c => upgradePool.push(c));
  if (gatlingW && gatlingW.level < WEAPON_DEFS.gatling.maxLv)
    getGatlingUpgradeCards(gatlingW).forEach(c => upgradePool.push(c));
  if (droneW && droneW.level < WEAPON_DEFS.heal_drone.maxLv)
    getHealDroneUpgradeCards(droneW).forEach(c => upgradePool.push(c));
  if (missileW && ![4,7,8].includes(missileW.level+1) && missileW.level < WEAPON_DEFS.missile_drone.maxLv - 1)
    getMissileDroneUpgradeCards(missileW).forEach(c => upgradePool.push(c));
  if (sniperW && ![4,7,8].includes(sniperW.level+1) && sniperW.level < WEAPON_DEFS.sniper.maxLv - 1)
    getSniperUpgradeCards(sniperW).forEach(c => upgradePool.push(c));
  if (flyingW && ![4,7,8].includes(flyingW.level+1) && flyingW.level < WEAPON_DEFS.flying_sword.maxLv)
    getFlyingSwordUpgradeCards(flyingW).forEach(c => upgradePool.push(c));

  // Other upgradable weapons → upgradePool
  gs.weapons
    .filter(w => !['shotgun','gatling','heal_drone','missile_drone','kirby_copy','sniper','flying_sword'].includes(w.id) && w.level < WEAPON_DEFS[w.id].maxLv)`,
`  const flyingW = getWeapon('flying_sword');
  if (flyingW && [4,7,8].includes(flyingW.level+1) && flyingW.level < WEAPON_DEFS.flying_sword.maxLv)
    return getFlyingSwordUpgradeCards(flyingW).slice(0, cardCount);

  const btortW = getWeapon('black_tortoise');
  if (btortW && [4,7,8].includes(btortW.level+1) && btortW.level < WEAPON_DEFS.black_tortoise.maxLv)
    return getBlackTortoiseUpgradeCards(btortW).slice(0, cardCount);

  // ── Build weapon pools (priority: owned upgrades → new weapons) ──
  const upgradePool = []; // upgrades for weapons player already owns
  const newWeapPool = []; // new weapons player doesn't have yet

  // Branching weapon random-tier cards → upgradePool (owned)
  if (shotgunW && shotgunW.level < WEAPON_DEFS.shotgun.maxLv)
    getShotgunUpgradeCards(shotgunW).forEach(c => upgradePool.push(c));
  if (gatlingW && gatlingW.level < WEAPON_DEFS.gatling.maxLv)
    getGatlingUpgradeCards(gatlingW).forEach(c => upgradePool.push(c));
  if (droneW && droneW.level < WEAPON_DEFS.heal_drone.maxLv)
    getHealDroneUpgradeCards(droneW).forEach(c => upgradePool.push(c));
  if (missileW && ![4,7,8].includes(missileW.level+1) && missileW.level < WEAPON_DEFS.missile_drone.maxLv - 1)
    getMissileDroneUpgradeCards(missileW).forEach(c => upgradePool.push(c));
  if (sniperW && ![4,7,8].includes(sniperW.level+1) && sniperW.level < WEAPON_DEFS.sniper.maxLv - 1)
    getSniperUpgradeCards(sniperW).forEach(c => upgradePool.push(c));
  if (flyingW && ![4,7,8].includes(flyingW.level+1) && flyingW.level < WEAPON_DEFS.flying_sword.maxLv)
    getFlyingSwordUpgradeCards(flyingW).forEach(c => upgradePool.push(c));
  if (btortW && ![4,7,8].includes(btortW.level+1) && btortW.level < WEAPON_DEFS.black_tortoise.maxLv)
    getBlackTortoiseUpgradeCards(btortW).forEach(c => upgradePool.push(c));

  // Other upgradable weapons → upgradePool
  gs.weapons
    .filter(w => !['shotgun','gatling','heal_drone','missile_drone','kirby_copy','sniper','flying_sword','black_tortoise'].includes(w.id) && w.level < WEAPON_DEFS[w.id].maxLv)`,
'getUpgradeOptions: integrate black_tortoise'
);

// ── 11. Game loop: call updateBlackTortoise ──
rep(
`      updateFlyingSwords(dt);
      updateSantaGifts(dt);`,
`      updateFlyingSwords(dt);
      updateBlackTortoise(dt);
      updateSantaGifts(dt);`,
'game loop: updateBlackTortoise'
);

// ── 12. Render loop: call renderBlackTortoise ──
rep(
`  // Drones — orbit the player visually
  if (gs.weapons) {
    let droneIdx = 0;`,
`  // Black Tortoise
  renderBlackTortoise(ctx, cam);
  // Drones — orbit the player visually
  if (gs.weapons) {
    let droneIdx = 0;`,
'render loop: renderBlackTortoise'
);

// ── 13. Version bump ──
rep(`const GAME_VERSION = 'v0.7.3';`, `const GAME_VERSION = 'v0.7.4';`, 'version bump');

if (!ok) { console.error('\n❌ failed — NOT writing'); process.exit(1); }
fs.writeFileSync(HTML, h, 'utf8');
console.log('\n✅ Done — v0.7.4, size:', fs.statSync(HTML).size);
