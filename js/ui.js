'use strict';

// ═══════════════════════════════════════════════════════
// §16  Upgrade screen (normal waves)
// ═══════════════════════════════════════════════════════
let _upgSel = null;
function showUpgradeScreen(options, extra) {
  document.getElementById('upg-title').textContent =
    (extra && extra._title) ? extra._title :
    gs.wave.num===0 ? '⚔ 选择起始武器' : `🏆 第${gs.wave.num}波清除！`;
  const container = document.getElementById('upg-cards');
  container.innerHTML='';
  const midIdx = Math.min(1, options.length-1);
  _upgSel = options[midIdx] ?? options[0];
  options.forEach((opt,idx) => {
    const card = document.createElement('div');
    card.className='upg-card'+(idx===midIdx?' upg-sel':'');
    card.style.animationDelay=(idx*0.08)+'s';
    const _wCats={shotgun:'🔫 枪械',gatling:'🔫 枪械',sniper:'🔫 枪械',black_tortoise:'🐢 召唤',sword:'⚔ 剑类',flying_sword:'⚔ 剑类',heal_drone:'🚁 无人机',missile_drone:'🚁 无人机',arrow_rain:'🏹 箭类'};
  const _wCat=_wCats[opt.weapId||''];
  const _catTag=_wCat?`<div style="font-size:9px;color:#a88;letter-spacing:0.5px;margin:1px 0 2px">${_wCat}</div>`:'';
  card.innerHTML=`<span class="u-icon">${opt.icon}</span><div class="u-name">${opt.name}</div>${_catTag}<div class="u-desc">${opt.desc}</div>`;
    card.addEventListener('click',()=>{
      _upgSel=opt;
      container.querySelectorAll('.upg-card').forEach((c,i)=>c.classList.toggle('upg-sel',i===idx));
    });
    container.appendChild(card);
  });
  document.getElementById('upg-confirm-btn').onclick=()=>{ if(_upgSel) applyUpgrade(_upgSel); };
  // Refresh button (only for start weapon selection)
  const existingRefresh = document.getElementById('upg-refresh');
  if (existingRefresh) existingRefresh.remove();
  if (extra?.showRefresh) {
    const left = extra.refreshLeft ?? 0;
    const btn = document.createElement('button');
    btn.id = 'upg-refresh';
    btn.style.cssText = 'margin-top:14px;padding:7px 22px;background:#1a1400;border:1px solid '+(left>0?'#fd4':'#444')+';border-radius:4px;color:'+(left>0?'#fd4':'#555')+';font-family:\'Courier New\',monospace;font-size:11px;cursor:'+(left>0?'pointer':'default')+';letter-spacing:1px';
    btn.textContent = left > 0 ? `🔄 刷新武器 (剩余 ${left} 次)` : '刷新次数已用完';
    if (left > 0) btn.addEventListener('click', extra.onRefresh);
    container.parentElement.appendChild(btn);
  }
  document.getElementById('o-upgrade').classList.add('active');
}

function showSummonPickScreen() {
  gs.summonOffered = true;
  const owned = new Set(gs.weapons.map(w => w.id));
  const avail = shuffled(Object.keys(WEAPON_DEFS).filter(id => WEAPON_DEFS[id].type==='summon' && !owned.has(id)));
  if (avail.length === 0) { showUpgradeScreen(getUpgradeOptions()); return; }
  const options = avail.slice(0, 3).map(id => {
    const def = WEAPON_DEFS[id];
    return { type:'wepadd', weapId:id, icon:def.icon, name:def.name, desc:def.startDesc||describeWeapon(id,1) };
  });
  showUpgradeScreen(options, { _title:'🔮 召唤奖池 · 选择召唤武器' });
}
function showStartWeaponScreen() {
  const makeOpt = id => {
    const def = WEAPON_DEFS[id];
    return { type:'wepadd', weapId:id, icon:def.icon, name:`获得 ${def.name}`,
             desc: def.startDesc || describeWeapon(id,1) };
  };
  const excluded = new Set(
    ['heal_drone','kirby_copy','flying_sword']
      .concat(Object.keys(WEAPON_DEFS).filter(id=>WEAPON_DEFS[id].type==='summon'))
  );
  const available = shuffled(Object.keys(WEAPON_DEFS).filter(id => !excluded.has(id)));
  const options = available.slice(0, 4).map(makeOpt);

  // Show with refresh button
  const refreshLeft = gs.weaponRefreshes ?? 5;
  showUpgradeScreen(options, { showRefresh: true, refreshLeft, onRefresh: () => {
    if ((gs.weaponRefreshes ?? 5) <= 0) return;
    gs.weaponRefreshes = (gs.weaponRefreshes ?? 5) - 1;
    showStartWeaponScreen();
  }});
}

function applyUpgrade(opt) {
  document.getElementById('o-upgrade').classList.remove('active');
  applyUpgradeEffect(opt);
  gs.phase='playing';
  waveCompleteTriggered=false;
  const nextWave = gs.wave.num===0 ? 1 : gs.wave.num+1;
  startWave(nextWave);
  updateHUD();
}

// ═══════════════════════════════════════════════════════
// §17  Upgrade options generator
// ═══════════════════════════════════════════════════════
function describeWeapon(weapId, lv) {
  if (!WEAPON_DEFS[weapId]) return '';
  const def = WEAPON_DEFS[weapId];
  if (def.describe) return def.describe(lv);
  const s = def.levels[Math.min(lv-1, def.levels.length-1)];
  const parts = [];
  if (s.dmg)    parts.push(`伤害${s.dmg}`);
  if (s.cd)     parts.push(`CD${s.cd}ms`);
  if (s.radius) parts.push(`范围${s.radius}`);
  if (s.orbs)   parts.push(`${s.orbs}轨道`);
  if (s.count)  parts.push(`×${s.count}弹`);
  if (s.pierce) parts.push('穿透');
  if (s.chains) parts.push(`链${s.chains}目标`);
  if (s.slow)   parts.push(`减速${s.slow}s`);
  return parts.join(' | ') || '—';
}

// Returns upgrade cards for shotgun/gatling/heal_drone based on current weapon level/path
function getShotgunUpgradeCards(w) {
  const next = w.level + 1;
  if (next === 4) {
    return [
      { type:'gun_upgrade', gunOp:'bullet', bulletEffect:'bounce', weapId:'shotgun',
        icon:'↩', name:'弹射散弹', desc:'击中后弹向下一个敌人' },
      { type:'gun_upgrade', gunOp:'bullet', bulletEffect:'pierce', weapId:'shotgun',
        icon:'➡', name:'穿透散弹', desc:'散弹穿透所有敌人' },
      { type:'gun_upgrade', gunOp:'bullet', bulletEffect:'split', weapId:'shotgun',
        icon:'✦', name:'分裂散弹', desc:'击中后分裂出2颗侧向子弹' },
    ];
  }
  if (next === 7) {
    return [
      { type:'gun_upgrade', gunOp:'element', element:'flame', weapId:'shotgun',
        icon:'🔥', name:'炽焰散弹', desc:'叠加火焰层·每层1%HP/s持续伤害' },
      { type:'gun_upgrade', gunOp:'element', element:'frost', weapId:'shotgun',
        icon:'❄', name:'冰霜散弹', desc:'叠加冰霜层·满层冰冻2秒' },
      { type:'gun_upgrade', gunOp:'element', element:'poison', weapId:'shotgun',
        icon:'☠', name:'淬毒散弹', desc:'叠加毒素层·每层0.5%HP/s' },
    ];
  }
  if (next === 8) {
    return [{ type:'gun_upgrade', gunOp:'mod', mod:'extra_gun', weapId:'shotgun',
      icon:'🔫', name:'双枪齐发', desc:'整套散弹额外再打一次，总伤害×2' }];
  }
  // Levels 2,3,5,6: random mod
  const modPool = [
    {mod:'dmg_20',      icon:'💪', name:'散弹: 伤害+20%', desc:'子弹伤害×1.2'},
    {mod:'aspd',        icon:'⚡', name:'散弹: 射速提升', desc:'射击冷却-18%'},
    {mod:'extra_shell', icon:'➕', name:'散弹: 多一颗弹', desc:'每次多射一颗弹'},
  ];
  const available = modPool.filter(m=>!(w.variantMods||[]).includes(m.mod));
  if (!available.length) {
    return [{ type:'wepup', weapId:'shotgun', icon:'💥',
      name:`升级 散弹枪 → Lv.${next}`, desc:describeWeapon('shotgun',next) }];
  }
  const chosen = available[Math.floor(Math.random()*available.length)];
  return [{ type:'gun_upgrade', gunOp:'mod', mod:chosen.mod,
    weapId:'shotgun', icon:chosen.icon, name:chosen.name, desc:chosen.desc }];
}

function getGatlingUpgradeCards(w) {
  const next = w.level + 1;
  if (next === 4) {
    return [
      { type:'gun_upgrade', gunOp:'mod', mod:'dual_bullet', weapId:'gatling',
        icon:'🔴', name:'加特林: 并列双发', desc:'每发子弹变为并列2发同步射出' },
      { type:'gun_upgrade', gunOp:'bullet', bulletEffect:'pierce', weapId:'gatling',
        icon:'➡', name:'加特林: 穿透弹', desc:'子弹穿透所有敌人' },
      { type:'gun_upgrade', gunOp:'mod', mod:'aspd', weapId:'gatling',
        icon:'⚡', name:'加特林: 射速提升', desc:'射击冷却-18%' },
    ];
  }
  if (next === 7) {
    return [
      { type:'gun_upgrade', gunOp:'element', element:'flame', weapId:'gatling',
        icon:'🔥', name:'炽焰子弹', desc:'叠加火焰层·每层1%HP/s持续伤害' },
      { type:'gun_upgrade', gunOp:'element', element:'frost', weapId:'gatling',
        icon:'❄', name:'冰霜子弹', desc:'叠加冰霜层·满层冰冻2秒' },
      { type:'gun_upgrade', gunOp:'element', element:'poison', weapId:'gatling',
        icon:'☠', name:'淬毒子弹', desc:'叠加毒素层·每层0.5%HP/s' },
    ];
  }
  if (next === 8) {
    return [{ type:'gun_upgrade', gunOp:'mod', mod:'extra_gun', weapId:'gatling',
      icon:'🔫', name:'双枪齐发', desc:'连发弹幕额外再打一次，总伤害×2' }];
  }
  // Levels 2,3,5,6: random mod (dual_bullet only at level 4)
  const modPool = [
    {mod:'dmg_20', icon:'💪', name:'加特林: 伤害+20%', desc:'子弹伤害×1.2'},
    {mod:'aspd',   icon:'⚡', name:'加特林: 射速提升', desc:'射击冷却-18%'},
  ];
  const available = modPool.filter(m=>!(w.variantMods||[]).includes(m.mod));
  if (!available.length) {
    return [{ type:'wepup', weapId:'gatling', icon:'🔴',
      name:`升级 加特林 → Lv.${next}`, desc:describeWeapon('gatling',next) }];
  }
  const chosen = available[Math.floor(Math.random()*available.length)];
  return [{ type:'gun_upgrade', gunOp:'mod', mod:chosen.mod,
    weapId:'gatling', icon:chosen.icon, name:chosen.name, desc:chosen.desc }];
}

function getTurretLv4Cards(w) {
  return [
    { type:'turret_special', weapId:'turret', specialType:'heal',
      icon:'💚', name:'治疗炮台',
      desc:'召唤×3炮台+1治疗炮台 · 追踪子弹命中回复玩家5%HP' },
    { type:'turret_special', weapId:'turret', specialType:'kamikaze',
      icon:'🤖', name:'自爆炮台',
      desc:'召唤×3炮台+3自爆机器人 · 靠近敌人自爆·范围大伤' },
    { type:'turret_special', weapId:'turret', specialType:'minigun',
      icon:'🔫', name:'机枪炮台',
      desc:'召唤×3炮台+1机枪炮台 · 极快射速·9伤害/弹' },
  ];
}

function getTurretLv7Cards(w) {
  const _cnt = 1 + (w.extraTurrets||0);
  return [
    { type:'turret_lv7', weapId:'turret', lv7Op:'more',
      icon:'⚙', name:'更多炮台',
      desc:`再+3炮台·+3额外特殊炮台 · 总计×${_cnt+3}台` },
    { type:'turret_lv7', weapId:'turret', lv7Op:'defence',
      icon:'🛡', name:'防御炮台',
      desc:'非Boss怪物优先攻击炮台 · 每台炮台获得一次免死护盾' },
    { type:'turret_lv7', weapId:'turret', lv7Op:'element',
      icon:'✨', name:'元素炮台',
      desc:'炮台子弹随机施加火焰/冰霜/毒素·快速叠层强力debuff' },
  ];
}

function getHealDroneUpgradeCards(w) {
  const next = w.level + 1;
  if (next === 4) {
    return [
      { type:'drone_upgrade', droneOp:'element', element:'poison', weapId:'heal_drone',
        icon:'☠', name:'毒奶光圈', desc:'光圈内的敌人持续叠加毒素' },
      { type:'drone_upgrade', droneOp:'element', element:'flame', weapId:'heal_drone',
        icon:'🔥', name:'灼烧治疗', desc:'光圈内的敌人持续叠加火焰' },
      { type:'drone_upgrade', droneOp:'element', element:'frost', weapId:'heal_drone',
        icon:'❄', name:'冰霜治疗', desc:'光圈内的敌人持续叠加冰霜' },
    ];
  }
  if (next === 7) {
    return [
      { type:'drone_upgrade', droneOp:'hospital', hosp:'range', weapId:'heal_drone',
        icon:'🏥', name:'医院', desc:'光圈范围增加100%' },
      { type:'drone_upgrade', droneOp:'hospital', hosp:'follow', weapId:'heal_drone',
        icon:'🚑', name:'战地医院', desc:'光圈跟随玩家移动' },
      { type:'drone_upgrade', droneOp:'hospital', hosp:'heal', weapId:'heal_drone',
        icon:'💉', name:'未来医院', desc:'治疗量增加50%' },
    ];
  }
  if (next === 8) {
    return [
      { type:'drone_upgrade', droneOp:'superheal', weapId:'heal_drone',
        icon:'⚕', name:'超级治疗', desc:'治疗量+50%·范围+20%' },
    ];
  }
  // Levels 2,3,5,6: random from heal/range/cd
  const modPool = [
    {op:'heal',  icon:'💊', name:'治疗强化', desc:'光圈治疗量+30%'},
    {op:'range', icon:'🔵', name:'范围扩大', desc:'光圈半径+30%'},
    {op:'cd',    icon:'⏱', name:'冷却缩短', desc:'光圈出现冷却-25%'},
  ];
  const chosen = modPool[Math.floor(Math.random()*modPool.length)];
  return [{ type:'drone_upgrade', droneOp:'stat', statOp:chosen.op,
    weapId:'heal_drone', icon:chosen.icon, name:chosen.name, desc:chosen.desc }];
}

function getSniperUpgradeCards(w) {
  const nextLv = w.level + 1;
  if ([2,3,5,6].includes(nextLv)) {
    return [
      { type:'sniperup', weapId:'sniper', icon:'💀', name:'夺命子弹', desc:'狙击伤害+35%', sniperOp:'dmgbonus' },
      { type:'sniperup', weapId:'sniper', icon:'🎯', name:'暴击弹头', desc:'全局暴击率+10%，暴击伤害+10%', sniperOp:'critbullet' },
      { type:'sniperup', weapId:'sniper', icon:'🔭', name:'连狙', desc:'额外发射1颗子弹', sniperOp:'extrabullet' },
    ];
  }
  if (nextLv === 4) {
    return [
      { type:'sniperup', weapId:'sniper', icon:'💪', name:'重狙', desc:'伤害×3，但移动速度-8', sniperOp:'heavy' },
      { type:'sniperup', weapId:'sniper', icon:'📈', name:'成长神狙', desc:'每击杀20个怪物伤害+1%', sniperOp:'growing' },
      { type:'sniperup', weapId:'sniper', icon:'🐉', name:'大龙狙击', desc:'每发射3颗子弹第3颗变为金龙·高伤穿透', sniperOp:'dragon' },
    ];
  }
  if (nextLv === 7) {
    return [
      { type:'sniperup', weapId:'sniper', icon:'💨', name:'战术狙击', desc:'每20秒投烟雾弹·烟中敌人随机游走5秒', sniperOp:'tactical' },
      { type:'sniperup', weapId:'sniper', icon:'💠', name:'合金弹头', desc:'无限穿透·伤害+50%', sniperOp:'alloy' },
      { type:'sniperup', weapId:'sniper', icon:'💥', name:'分裂弹头', desc:'命中后分裂0-3小子弹(幸运越高越多)·小弹50%伤害', sniperOp:'split' },
    ];
  }
  return [];
}

// (pistol variant screen removed – shotgun and gatling are now separate weapons)

// ═══════════════════════════════════════════════════════
// §15c  飞剑 (Flying Sword) system
// ═══════════════════════════════════════════════════════
function fireFlyingSword(w, stats, p) {
  // Attack is triggered from updateFlyingSwords each CD tick
  if (!w.fsSwords) return;
  const tgt = nearestEnemy(p.x, p.y);
  w.fsSwords.forEach((s, i) => {
    s.state = 'attack';
    s.target = tgt;
    if (w.fsUltra) { s.fanIdx = i; s.fanTotal = w.fsSwords.length; }
  });
}

function updateFlyingSwords(dt) {
  const w = getWeapon('flying_sword');
  if (!w) return;
  const p = gs.player;
  const totalBlades = 4 + (w.fsBladeCount||0);
  if (!w.fsSwords) {
    w.fsSwords = [];
    for (let i=0; i<totalBlades; i++) {
      const a = (i/totalBlades)*Math.PI*2;
      w.fsSwords.push({ x:p.x+Math.cos(a)*40, y:p.y+Math.sin(a)*40, vx:0, vy:0, state:'orbit', hitCd:0 });
    }
  }
  while (w.fsSwords.length < totalBlades)
    w.fsSwords.push({ x:p.x, y:p.y, vx:0, vy:0, state:'orbit', hitCd:0 });
  while (w.fsSwords.length > totalBlades) w.fsSwords.pop();

  if (!w.fsOrbitAng) w.fsOrbitAng = 0;
  w.fsOrbitAng += dt * (w.fsUltra ? 4.0 : 2.8);

  const baseDmg  = 50;
  const critRate = Math.min(0.95, 0.40 + (w.fsCritBonus||0));
  const dmgMult  = w.fsBladeDmgMult || 1;
  const ORBIT_R  = 40;
  const ATK_SPD  = w.fsUltra ? 760 : 380;
  const globalTgt = nearestEnemy(p.x, p.y);

  w.fsSwords.forEach((sword, idx) => {
    sword.hitCd = Math.max(0, (sword.hitCd||0) - dt);

    if (sword.state === 'orbit') {
      const targetAng = w.fsOrbitAng + (idx/totalBlades)*Math.PI*2;
      const tx = p.x + Math.cos(targetAng)*ORBIT_R;
      const ty = p.y + Math.sin(targetAng)*ORBIT_R;
      const ddx = tx-sword.x, ddy = ty-sword.y;
      const d = Math.sqrt(ddx*ddx+ddy*ddy)||1;
      sword.vx = (ddx/d)*Math.min(d,280)*6;
      sword.vy = (ddy/d)*Math.min(d,280)*6;
      sword.x += sword.vx*dt; sword.y += sword.vy*dt;

    } else { // attack
      if (!sword.target || sword.target.dead) sword.target = globalTgt;
      const at = sword.target;
      if (!at || at.dead) { sword.state='orbit'; return; }

      let tx=at.x, ty=at.y;
      if (w.fsUltra && sword.fanTotal>1) {
        const fa = Math.atan2(at.y-p.y, at.x-p.x);
        const fo = ((sword.fanIdx/sword.fanTotal)-0.5)*0.8;
        tx = at.x + Math.cos(fa+Math.PI/2)*fo*24;
        ty = at.y + Math.sin(fa+Math.PI/2)*fo*24;
      }
      const ddx=tx-sword.x, ddy=ty-sword.y;
      const d=Math.sqrt(ddx*ddx+ddy*ddy)||1;
      sword.vx += (ddx/d)*1000*dt; sword.vy += (ddy/d)*1000*dt;
      const spd=Math.sqrt(sword.vx*sword.vx+sword.vy*sword.vy);
      if (spd>ATK_SPD) { sword.vx=sword.vx/spd*ATK_SPD; sword.vy=sword.vy/spd*ATK_SPD; }
      sword.x += sword.vx*dt; sword.y += sword.vy*dt;
      // Ultra: auto-return when sword flies beyond max range
      if (w.fsUltra) {
        const _dfp = Math.sqrt((sword.x-p.x)**2+(sword.y-p.y)**2);
        if (_dfp > 350) { sword.state='orbit'; sword.vx=0; sword.vy=0; }
      }

      if (sword.hitCd<=0) {
        const pierce = w.fsUltra;
        const hitList = gs.enemies.filter(e => !e.dead &&
          (e.x-sword.x)**2+(e.y-sword.y)**2 < (9+e.radius)**2).slice(0, pierce ? 999 : 1);
        hitList.forEach(e => {
          const isCrit = Math.random()<critRate;
          let dmg = Math.round(baseDmg*dmgMult*(p.dmgMult||1));
          if (isCrit) { dmg=Math.round(dmg*3); if(settings.particles) addFloatingText('暴击!',e.x,e.y-12,'#fd4',0.5); }
          hitEnemy(e, dmg, false, isCrit, 'phys');
          if (w.fsElement==='flame')  e.flameStacks  = Math.min(10,(e.flameStacks||0)+2);
          if (w.fsElement==='frost')  e.frostStacks  = Math.min(10,(e.frostStacks||0)+2);
          if (w.fsElement==='poison') e.poisonStacks = Math.min(10,(e.poisonStacks||0)+2);
          if (w.fsSpecialized && w.fsElement) {
            if (w.fsElement==='flame')  e.flameStacks  = Math.min(10,(e.flameStacks||0)+1);
            if (w.fsElement==='frost')  e.frostStacks  = Math.min(10,(e.frostStacks||0)+1);
            if (w.fsElement==='poison') e.poisonStacks = Math.min(10,(e.poisonStacks||0)+1);
          }
          if (w.fsDrain) healPlayer(1);
          if (w.fsInfuse) gs.pendingExplosions.push({ timer:0.45, x:e.x, y:e.y, radius:3, dmg:Math.round(dmg*1.0), w:null });
          if (w.fsAbsorb && e.dead) {
            w.fsAbsorbKills=(w.fsAbsorbKills||0)+1;
            if (w.fsAbsorbKills%10===0){ p.maxHp++; updateHUD(); }
          }
          sword.hitCd = pierce ? 0.10 : 0.25;
        });
        if (hitList.length>0 && !pierce) { sword.state='orbit'; sword.vx*=0.15; sword.vy*=0.15; }
      }
    }
  });
}

function getFlyingSwordUpgradeCards(w) {
  const next = w.level+1;
  if (next===4) return [
    { type:'fsword_upgrade', fsOp:'element', elem:'flame',  weapId:'flying_sword', icon:'🔥', name:'烈焰飞剑', desc:'+1把飞剑·命中施加2层灼烧' },
    { type:'fsword_upgrade', fsOp:'element', elem:'frost',  weapId:'flying_sword', icon:'❄', name:'冰冻飞剑', desc:'+1把飞剑·命中施加2层冰冻' },
    { type:'fsword_upgrade', fsOp:'element', elem:'poison', weapId:'flying_sword', icon:'☠', name:'淬毒飞剑', desc:'+1把飞剑·命中施加2层毒素' },
  ];
  if (next===7) return [
    { type:'fsword_upgrade', fsOp:'absorb', weapId:'flying_sword', icon:'💚', name:'汲取飞剑', desc:'+1把飞剑·每击败10个敌人+1最大HP' },
    { type:'fsword_upgrade', fsOp:'infuse', weapId:'flying_sword', icon:'💠', name:'魔力灌注', desc:'+1把飞剑·命中0.45秒后额外造成100%伤害' },
    { type:'fsword_upgrade', fsOp:'drain',  weapId:'flying_sword', icon:'❤', name:'魔力吸取', desc:'+1把飞剑·每次命中回复1点生命' },
  ];
  if (next===8) return [
    { type:'fsword_upgrade', fsOp:'ultra', weapId:'flying_sword', icon:'🌟', name:'万剑归宗',
      desc:'+2把飞剑·穿透·攻速翻倍·扇形锁定·飞出自动返回' },
  ];
  // Lv 2,3,5,6
  const hasElem = !!w.fsElement;
  const opts = [
    { type:'fsword_upgrade', fsOp:'lethal',   weapId:'flying_sword', icon:'💀', name:'致命伤',   desc:'飞剑暴击率+20%' },
    { type:'fsword_upgrade', fsOp:'balanced', weapId:'flying_sword', icon:'⚖',  name:'均衡成长', desc:'飞剑伤害+10%·暴击率+10%' },
    { type:'fsword_upgrade', fsOp:'sharp',    weapId:'flying_sword', icon:'🗡',  name:'锋利',    desc:'飞剑伤害+30%' },
  ];
  if (hasElem) opts.push({ type:'fsword_upgrade', fsOp:'specialized', weapId:'flying_sword', icon:'🎯', name:'专攻弱点',
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
  const followT=(ent)=>{
    const tgt=nearestEnemy(ent.x,ent.y);
    const ENGAGE=180*sizeMult,STOP=55*sizeMult;
    if(tgt){const dx=tgt.x-ent.x,dy=tgt.y-ent.y,d=Math.sqrt(dx*dx+dy*dy)||1;if(d<ENGAGE&&d>STOP){const spd=65*dt;ent.x+=(dx/d)*spd;ent.y+=(dy/d)*spd;if(dx>1)ent.facingRight=true;else if(dx<-1)ent.facingRight=false;return;}else if(d<=STOP){if(dx>1)ent.facingRight=true;else if(dx<-1)ent.facingRight=false;return;}}
    if(ent._oAng===undefined)ent._oAng=Math.random()*Math.PI*2;
    ent._oAng+=dt*0.7;
    const orbitR=65*sizeMult,ox=p.x+Math.cos(ent._oAng)*orbitR-ent.x,oy=p.y+Math.sin(ent._oAng)*orbitR-ent.y,od=Math.sqrt(ox*ox+oy*oy)||1;
    if(od>12){const spd=Math.min(od*3,85)*dt;ent.x+=(ox/od)*spd;ent.y+=(oy/od)*spd;}
    if(ox>1)ent.facingRight=true;else if(ox<-1)ent.facingRight=false;
  };
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
      gs.enemies.forEach(e=>{if(e.dead)return;const dx=e.x-w.btEntity.x,dy=e.y-w.btEntity.y;if(dx*dx+dy*dy<(22*sizeMult)**2){hitEnemy(e,Math.round(ballDmg*3),false,false,'magic');e.stunStacks=Math.min(10,(e.stunStacks||0)+1);}});
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
        if(!ua.hitDone&&ua.timer<0.2){ua.hitDone=true;const r2=80*80;gs.enemies.forEach(e=>{if(e.dead)return;const dx=e.x-ua.x,dy=e.y-ua.y;if(dx*dx+dy*dy<r2){hitEnemy(e,Math.round(ballDmg*5),false,false,'magic');const kd=Math.sqrt(dx*dx+dy*dy)||1;e.x+=(dx/kd)*40;e.y+=(dy/kd)*40;e.stunStacks=Math.min(10,(e.stunStacks||0)+2);}});if(settings.particles)spawnParticles(ua.x,ua.y,['#4af','#8cf','#aaf','#fff'],20,140,1.0,6);}
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
    if(ball.hitCd<=0){const hit=gs.enemies.find(e=>!e.dead&&(e.x-ball.x)**2+(e.y-ball.y)**2<(7+e.radius)**2);if(hit){hitEnemy(hit,ball.dmg,false,false,'magic');if(ball.poison){hit.poisonStacks=Math.min(10,(hit.poisonStacks||0)+3);if(!w.btPuddles)w.btPuddles=[];w.btPuddles.push({x:ball.x,y:ball.y,timer:3.5,tickTimer:0.4});}return false;}}
    return true;
  });
  // Update poison puddles
  if (w.btPuddles) {
    w.btPuddles=w.btPuddles.filter(pd=>{pd.timer-=dt;if(pd.timer<=0)return false;pd.tickTimer-=dt;if(pd.tickTimer<=0){pd.tickTimer=0.4;gs.enemies.forEach(e=>{if(e.dead)return;const dx=e.x-pd.x,dy=e.y-pd.y;if(dx*dx+dy*dy<28*28){e.poisonStacks=Math.min(10,(e.poisonStacks||0)+1);hitEnemy(e,Math.round(ballDmg*0.15),false,false,'magic');}});}return true;});
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
    const _bti=typeof IMG_BLACK_TORTOISE!=='undefined'&&IMG_BLACK_TORTOISE.complete&&IMG_BLACK_TORTOISE.naturalWidth>0;
    // Maintain aspect ratio: use 32*sc as display height, scale width from natural ratio
    const dh=Math.round(32*sc);
    const dw=_bti?Math.round(dh*IMG_BLACK_TORTOISE.naturalWidth/IMG_BLACK_TORTOISE.naturalHeight):dh;
    ctx.save(); ctx.translate(tx,ty);
    // Image faces left by default — flip horizontally when moving right
    ctx.scale(-1,1);
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
}

function getUpgradeOptions() {
  const p = gs.player;
  const lv = p.level;
  const cardCount = (p.luck >= 80) ? 4 : 3;

  if (gs.weapons.length === 0) {
    return shuffled(Object.keys(WEAPON_DEFS).filter(id => id !== 'kirby_copy' && id !== 'flying_sword' && WEAPON_DEFS[id].type !== 'summon')).slice(0,3).map(id => ({
      type:'wepadd', weapId:id, icon:WEAPON_DEFS[id].icon,
      name:`获得 ${WEAPON_DEFS[id].name}`, desc:describeWeapon(id,1)
    }));
  }

  // ── Fixed-choice tiers return exclusively ──
  const FIXED_GUN = [4, 7, 8];
  const shotgunW = getWeapon('shotgun');
  if (shotgunW && FIXED_GUN.includes(shotgunW.level + 1) && shotgunW.level < WEAPON_DEFS.shotgun.maxLv)
    return getShotgunUpgradeCards(shotgunW).slice(0, cardCount);

  const gatlingW = getWeapon('gatling');
  if (gatlingW && FIXED_GUN.includes(gatlingW.level + 1) && gatlingW.level < WEAPON_DEFS.gatling.maxLv)
    return getGatlingUpgradeCards(gatlingW).slice(0, cardCount);

  const droneW = getWeapon('heal_drone');
  if (droneW && FIXED_GUN.includes(droneW.level + 1) && droneW.level < WEAPON_DEFS.heal_drone.maxLv)
    return getHealDroneUpgradeCards(droneW).slice(0, cardCount);

  const missileW = getWeapon('missile_drone');
  // Missile fixed tiers: 4, 7 (8 is super supply only)
  if (missileW && [4,7].includes(missileW.level + 1) && missileW.level < WEAPON_DEFS.missile_drone.maxLv - 1)
    return getMissileDroneUpgradeCards(missileW).slice(0, cardCount);

  const sniperW = getWeapon('sniper');
  if (sniperW && [4,7].includes(sniperW.level + 1) && sniperW.level < WEAPON_DEFS.sniper.maxLv - 1)
    return getSniperUpgradeCards(sniperW).slice(0, cardCount);

  const flyingW = getWeapon('flying_sword');
  if (flyingW && [4,7,8].includes(flyingW.level+1) && flyingW.level < WEAPON_DEFS.flying_sword.maxLv)
    return getFlyingSwordUpgradeCards(flyingW).slice(0, cardCount);

  const btortW = getWeapon('black_tortoise');
  if (btortW && [4,7,8].includes(btortW.level+1) && btortW.level < WEAPON_DEFS.black_tortoise.maxLv)
    return getBlackTortoiseUpgradeCards(btortW).slice(0, cardCount);

  const turretW = getWeapon('turret');
  if (turretW && turretW.level === 3 && turretW.level < WEAPON_DEFS.turret.maxLv)
    return getTurretLv4Cards(turretW);
  if (turretW && turretW.level === 6 && turretW.level < WEAPON_DEFS.turret.maxLv)
    return getTurretLv7Cards(turretW);
  if (turretW && turretW.level === 7 && turretW.level < WEAPON_DEFS.turret.maxLv)
    return [{ type:'turret_lv8', weapId:'turret',
      icon:'💣', name:'地雷炮台',
      desc:'炮台死亡时原地埋下地雷·大范围爆炸 · 再+5炮台上限' }];

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
    .filter(w => !['shotgun','gatling','heal_drone','missile_drone','kirby_copy','sniper','flying_sword','black_tortoise'].includes(w.id) && w.level < WEAPON_DEFS[w.id].maxLv)
    .forEach(w => {
      const def = WEAPON_DEFS[w.id];
      upgradePool.push({ type:'wepup', weapId:w.id, icon:def.icon,
        name:`${def.name} Lv.${w.level}→Lv.${w.level+1}`, desc:describeWeapon(w.id,w.level+1) });
    });

  // New weapons → newWeapPool (only shown when upgrade pool exhausted)
  if (gs.weapons.length < 8) {
    const owned = new Set(gs.weapons.map(w => w.id));
    shuffled(Object.keys(WEAPON_DEFS).filter(id => !owned.has(id) && id !== 'kirby_copy' && id !== 'flying_sword' && WEAPON_DEFS[id].type !== 'summon')).forEach(wid => {
      const def = WEAPON_DEFS[wid];
      newWeapPool.push({ type:'wepadd', weapId:wid, icon:def.icon,
        name:`获得 ${def.name}`, desc:describeWeapon(wid,1) });
    });
  }

  // ── Fill cards: 全部武器升級，不含屬性強化 ──
  const wUpgShuf = shuffled(upgradePool);
  const wNewShuf = shuffled(newWeapPool);
  const result = [];
  let ui=0, ni=0;
  while (result.length < cardCount) {
    if (ui < wUpgShuf.length) result.push(wUpgShuf[ui++]);
    else if (ni < wNewShuf.length) result.push(wNewShuf[ni++]);
    else break;
  }
  return result;
}

// ═══════════════════════════════════════════════════════
// §17c  波次商店
// ═══════════════════════════════════════════════════════

// 商店稀有度插值（7 品質，4 幸運值檔位）
// 欄位順序: [luck, common, rare, relatively_rare, epic, legendary, mythical, ultimate]
const _SHOP_RARITY_PTS = [
  [0,   50, 25, 12, 13,  0,   0,   0  ],
  [10,  40, 25, 15, 15,  5,   0,   0  ],
  [50,  30, 20, 15, 20, 10,   3,   0  ],
  [100, 20, 15, 15, 20, 15,   5,   1  ],
];
const _SHOP_RARITY_KEYS = ['common','rare','relatively_rare','epic','legendary','mythical','ultimate'];

function _shopRarityWeights(luck) {
  const l = Math.max(0, luck);
  const pts = _SHOP_RARITY_PTS;
  let lo = pts[0], hi = pts[pts.length-1];
  for (let i=0; i<pts.length-1; i++) {
    if (l >= pts[i][0] && l <= pts[i+1][0]) { lo = pts[i]; hi = pts[i+1]; break; }
  }
  if (l >= hi[0]) lo = hi;
  const t = lo[0]===hi[0] ? 0 : (l - lo[0]) / (hi[0] - lo[0]);
  const w = lo.slice(1).map((v, i) => v + (hi[i+1] - v) * t);
  const total = w.reduce((s,v)=>s+v, 0) || 1;
  return w.map(v => v / total);
}

function _pickShopRarity(luck) {
  const w = _shopRarityWeights(luck);
  let r = Math.random();
  for (let i=0; i<w.length; i++) { r -= w[i]; if (r <= 0) return _SHOP_RARITY_KEYS[i]; }
  return 'common';
}

const _SHOP_RARITY_COLORS  = { common:'#ccc', rare:'#4f8', relatively_rare:'#4af', epic:'#b3f', legendary:'#fd4', mythical:'#f44', ultimate:'#f8f' };
const _SHOP_RARITY_LABELS  = { common:'普通', rare:'稀有', relatively_rare:'較稀有', epic:'史詩', legendary:'傳說', mythical:'神話', ultimate:'至臻' };

let _shopState = null; // { items, refreshCost, purchased:Set, ownedCounts:Map }

// ── 描述文字中的數值著色 (+綠 / -紅 / ×綠 / ÷紅) ──
function _shopColorDesc(desc) {
  return String(desc)
    .replace(/(\+[\d.]+%?)/g,  '<span style="color:#4f8">$1</span>')
    .replace(/(×[\d.]+)/g,     '<span style="color:#4f8">$1</span>')
    .replace(/(-[\d.]+%?)/g,   '<span style="color:#f55">$1</span>')
    .replace(/(÷[\d.]+)/g,     '<span style="color:#f55">$1</span>');
}

function _buildShopItems(count) {
  const pool = (typeof SHOP_ITEMS !== 'undefined') ? SHOP_ITEMS : [];
  if (!pool.length) return [];
  const luck   = gs?.player?.luck || 0;
  const owned  = _shopState?.ownedCounts || new Map();
  // 過濾已達上限的道具，並排除沒有 id 的條目
  let avail = pool.filter(it => it.id && (owned.get(it.id)||0) < (it.maxCount ?? 99));
  if (!avail.length) avail = pool.filter(it => it.id); // 若全部達限則回退
  const result  = [];
  const usedIds = new Set(); // 同一次刷新內不重複
  for (let i = 0; i < count; i++) {
    const remaining = avail.filter(it => !usedIds.has(it.id));
    if (!remaining.length) break; // 道具池耗盡
    const rarity = _pickShopRarity(luck);
    const same   = remaining.filter(it => it.rarity === rarity);
    const pick   = same.length ? same : remaining;
    const chosen = pick[Math.floor(Math.random() * pick.length)];
    result.push(chosen);
    usedIds.add(chosen.id);
  }
  return result;
}

function showShopScreen() {
  _shopState = { items: [], refreshCost: 10, purchased: new Set(), ownedCounts: new Map() };
  _shopState.items = _buildShopItems(4);
  _renderShopOverlay();
}

// ── 左欄：玩家數據 ──
function _shopPlayerStats(p) {
  const hp     = Math.ceil(p.hp);
  const maxHp  = p.maxHp;
  const hpPct  = Math.min(100, (hp / maxHp) * 100);
  const hpCol  = hpPct > 50 ? '#4f8' : hpPct > 25 ? '#fd4' : '#f44';
  const dmg    = ((p.dmgMult||1)*100).toFixed(0);
  const arm    = (Math.min(0.6, p.baseDmgRed||0)*100).toFixed(0);
  const dodge  = (Math.min(0.6, p.baseDodge||0)*100).toFixed(0);
  const regen  = (p.hpRegen||0).toFixed(1);
  const row = (icon, label, val, col='#ccc') =>
    `<div class="shp-sr"><span>${icon} <span style="color:#666">${label}</span></span><b style="color:${col}">${val}</b></div>`;
  return `
    <div class="shp-sec-hd">角色数据</div>
    ${row('❤','HP', `${hp}/${maxHp}`, hpCol)}
    <div style="background:#200;border-radius:2px;height:4px;margin:-3px 0 5px;overflow:hidden">
      <div style="width:${hpPct}%;height:100%;background:${hpCol};transition:width .3s"></div>
    </div>
    ${row('🐚','贝壳',  p.shells||0, '#4df')}
    ${row('⚡','移速',  p.spd,       '#aef')}
    ${row('⚔','攻击',  dmg+'%',     '#fd4')}
    ${row('🛡','减伤',  arm+'%',     '#aaa')}
    ${row('🌀','闪避',  dodge+'%',   '#8af')}
    ${row('🍀','幸运',  p.luck||0,   '#4f8')}
    ${row('💖','回复',  regen+'/s',  '#6f6')}
  `;
}

// ── 右欄：已獲得道具 ──
function _shopOwnedList() {
  if (!_shopState) return '';
  const owned = _shopState.ownedCounts;
  const pool  = (typeof SHOP_ITEMS !== 'undefined') ? SHOP_ITEMS : [];
  let rows = '';
  owned.forEach((cnt, id) => {
    const def = pool.find(x => x.id === id);
    if (!def) return;
    const col = _SHOP_RARITY_COLORS[def.rarity] || '#ddd';
    rows += `
      <div class="shp-owned-row">
        <span style="font-size:18px;flex-shrink:0;display:flex;align-items:center">${_shopItemIcon(def, 18)}</span>
        <div style="flex:1;min-width:0">
          <div style="color:${col};font-size:10px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${def.name}</div>
          <div style="color:#555;font-size:9px">已购 × ${cnt}</div>
        </div>
      </div>`;
  });
  return `
    <div class="shp-sec-hd">已获道具</div>
    ${rows || '<div style="color:#333;font-size:10px;text-align:center;padding:14px 0">尚未购买</div>'}
  `;
}

// ── 道具圖示（支援 emoji icon 和 Image 物件 img 兩種來源）──
function _shopItemIcon(item, size = 38) {
  if (item.img && item.img.src) {
    return `<img src="${item.img.src}" style="width:${size}px;height:${size}px;object-fit:contain;display:block;margin:0 auto" `
         + `onerror="this.outerHTML='<span style=\\'font-size:${size}px\\'>${item.icon||'?'}</span>'" >`;
  }
  return `<span style="font-size:${size}px;line-height:1">${item.icon || '?'}</span>`;
}

// ── 道具卡片 ──
function _buildShopCard(item, idx, p) {
  const col    = _SHOP_RARITY_COLORS[item.rarity] || '#ddd';
  const lbl    = _SHOP_RARITY_LABELS[item.rarity] || '';
  const bought = _shopState.purchased.has(idx);
  const maxC   = item.maxCount ?? 99;
  const ownedC = _shopState.ownedCounts.get(item.id) || 0;
  const atMax  = ownedC >= maxC;
  const afford = (p.shells||0) >= item.price;
  const locked = bought || atMax;

  const bdrCol = locked ? '#1e1e1e' : (!afford ? '#2a1400' : col);
  const op     = locked ? 0.3 : (!afford ? 0.6 : 1);

  const card = document.createElement('div');
  card.className = 'shp-card';
  card.style.cssText = `border-color:${bdrCol};opacity:${op};cursor:${locked||!afford?'default':'pointer'}`;

  // 數量徽章（右上角）
  const badge = maxC < 99
    ? `<div class="shp-badge" style="color:${ownedC>0?col:'#444'};border-color:${ownedC>0?col:'#222'}">${ownedC}/${maxC}</div>`
    : (ownedC > 0 ? `<div class="shp-badge" style="color:#4df;border-color:#1a3a4a">×${ownedC}</div>` : '');

  card.innerHTML =
    badge +
    `<div class="shp-card-icon">${_shopItemIcon(item, 38)}</div>` +
    `<div class="shp-card-name" style="color:${col}">${item.name}</div>` +
    `<div class="shp-card-desc">${_shopColorDesc(item.desc)}</div>` +
    `<div class="shp-card-price" style="color:${afford&&!locked?'#4df':'#3a3a3a'}">🐚 ${item.price}</div>`;

  if (!locked) {
    if (afford) {
      card.addEventListener('mouseenter', () => { card.style.transform='translateY(-5px) scale(1.03)'; });
      card.addEventListener('mouseleave', () => { card.style.transform=''; });
    }
    card.addEventListener('click', () => {
      if (_shopState.purchased.has(idx)) return;
      if ((p.shells||0) < item.price) {
        const disp = document.getElementById('shop-shell-disp');
        if (disp) { disp.style.color='#f44'; setTimeout(()=>{disp.style.color='#4df';},350); }
        return;
      }
      p.shells -= item.price;
      _shopState.purchased.add(idx);
      _shopState.ownedCounts.set(item.id, ((_shopState.ownedCounts.get(item.id))||0) + 1);
      if (typeof item.apply === 'function') item.apply(p);
      if (typeof addFloatingText === 'function')
        addFloatingText(`🐚-${item.price}`, p.x, p.y-22, '#f84', 1.2);
      _renderShopOverlay();
    });
  }
  return card;
}

function _renderShopOverlay() {
  document.getElementById('shop-overlay')?.remove();
  if (!gs || !_shopState) return;
  const p = gs.player;

  // ── 根容器 ──
  const ov = document.createElement('div');
  ov.id = 'shop-overlay';

  // ── 頂部標題欄 ──
  const topBar = document.createElement('div');
  topBar.className = 'shp-topbar';
  topBar.innerHTML =
    `<div class="shp-title">🏪 波次商店</div>` +
    `<div class="shp-shell-disp" id="shop-shell-disp">🐚 ${p.shells||0}</div>`;
  ov.appendChild(topBar);

  // ── 三欄主體 ──
  const body = document.createElement('div');
  body.className = 'shp-body';
  ov.appendChild(body);

  // 左欄 — 玩家數據
  const leftCol = document.createElement('div');
  leftCol.className = 'shp-col-left';
  leftCol.innerHTML = _shopPlayerStats(p);
  body.appendChild(leftCol);

  // 中欄 — 道具卡片
  const midCol = document.createElement('div');
  midCol.className = 'shp-col-mid';
  const cardsRow = document.createElement('div');
  cardsRow.className = 'shp-cards-row';
  _shopState.items.forEach((item, idx) => cardsRow.appendChild(_buildShopCard(item, idx, p)));
  midCol.appendChild(cardsRow);
  body.appendChild(midCol);

  // 右欄 — 已獲道具
  const rightCol = document.createElement('div');
  rightCol.className = 'shp-col-right';
  rightCol.innerHTML = _shopOwnedList();
  body.appendChild(rightCol);

  // ── 底部按鈕列 ──
  const botBar = document.createElement('div');
  botBar.className = 'shp-botbar';
  ov.appendChild(botBar);

  // 刷新
  const canRefresh = (p.shells||0) >= _shopState.refreshCost;
  const refreshBtn = document.createElement('button');
  refreshBtn.className = 'shp-btn' + (canRefresh ? ' shp-btn-green' : ' shp-btn-dim');
  refreshBtn.innerHTML = `🔄 刷新 &nbsp;🐚${_shopState.refreshCost}`;
  refreshBtn.addEventListener('click', () => {
    if ((p.shells||0) < _shopState.refreshCost) return;
    p.shells -= _shopState.refreshCost;
    _shopState.refreshCost = Math.ceil(_shopState.refreshCost * 1.5);
    _shopState.items     = _buildShopItems(4);
    _shopState.purchased = new Set();
    _renderShopOverlay();
  });
  botBar.appendChild(refreshBtn);

  // 繼續
  const contBtn = document.createElement('button');
  contBtn.className = 'shp-btn shp-btn-blue';
  contBtn.textContent = '继续 →';
  contBtn.addEventListener('click', () => {
    document.getElementById('shop-overlay')?.remove();
    _shopState = null;
    const nextWave = gs.wave.num + 1;
    gs.phase = 'playing';
    showGameScreen();
    startWave(nextWave);
  });
  botBar.appendChild(contBtn);

  document.body.appendChild(ov);
  if (typeof updateHUD === 'function') updateHUD();
}

function shuffled(arr) {
  const a=[...arr];
  for (let i=a.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}

// ═══════════════════════════════════════════════════════
// §17b Drop supply screen (mid-wave pickup)
// ═══════════════════════════════════════════════════════
function showDropSupplyScreen(dropType) {
  const def = DROP_DEFS[dropType];
  const rarityLabel = {
    supply_green:'💚 绿色补给', supply_blue:'💙 蓝色补给',
    supply_purple:'💜 紫色补给', supply_rainbow:'🌈 彩色补给'
  }[dropType] || '补给';

  document.getElementById('upg-title').textContent = rarityLabel;
  const container = document.getElementById('upg-cards');
  container.innerHTML = '';

  const options = getDropSupplyOptions(dropType);
  options.forEach((opt, idx) => {
    const card = document.createElement('div');
    card.className = 'upg-card';
    card.style.animationDelay = (idx * 0.08) + 's';
    // Tint border by rarity
    const borderCol = {supply_green:'#4f4',supply_blue:'#48f',
                       supply_purple:'#a4f',supply_rainbow:'#fd4'}[dropType];
    if (borderCol) card.style.borderColor = borderCol;
    card.innerHTML = `<span class="u-icon">${opt.icon}</span><div class="u-name">${opt.name}</div><div class="u-desc">${opt.desc}</div>`;
    card.addEventListener('click', () => applyDropSupplyUpgrade(opt));
    container.appendChild(card);
  });
  document.getElementById('o-upgrade').classList.add('active');
}

// Gold fallback card when supply pool exhausted
function _supplyGoldCard(dropType) {
  const amt = {supply_green:30, supply_blue:60, supply_purple:100, supply_rainbow:200}[dropType] || 30;
  return {type:'gold', id:'_gold', icon:'💰', name:`+${amt} 金币`, desc:'所有补给已获取，补偿金币奖励', amount:amt};
}

function getDropSupplyOptions(dropType) {
  const cards = DROP_DEFS[dropType]?.cards || 1;
  const _picked = gs.pickedSupplyIds || new Set();

  if (dropType === 'supply_rainbow') {
    // Rainbow: talents only, deduplicated by gs.talents
    const available = SUPPLY_TALENTS.filter(t => !gs.talents.has(t.id));
    const opts = shuffled(available).slice(0, cards)
      .map(t => ({ type:'talent', id:t.id, icon:t.icon, name:t.name, desc:t.desc, _talent:t }));
    while (opts.length < cards) opts.push(_supplyGoldCard(dropType));
    return opts;
  }

  // Green/Blue/Purple:
  // Stat pool: STAT_UPGRADES filtered by pickedSupplyIds (per-game chest dedup)
  const statOpts = shuffled(STAT_UPGRADES.filter(s => !_picked.has(s.id)))
    .map(s => ({type:'stat', id:s.id, icon:s.icon, name:s.name, desc:s.desc}));
  // Weapon pool: from getUpgradeOptions(), keep only weapon-type entries
  const weapOpts = getUpgradeOptions().filter(o => o.type !== 'stat');

  // Fill: prefer 1 stat first, then weapons, then more stats, then gold fallback
  const result = [];
  const stats = [...statOpts], weaps = [...weapOpts];
  if (stats.length > 0) result.push(stats.shift());
  while (result.length < cards && weaps.length > 0) result.push(weaps.shift());
  while (result.length < cards && stats.length > 0) result.push(stats.shift());
  while (result.length < cards) result.push(_supplyGoldCard(dropType));

  return shuffled(result);
}

function applyDropSupplyUpgrade(opt) {
  document.getElementById('o-upgrade').classList.remove('active');
  if (opt.type === 'talent') {
    gs.talents.add(opt.id);
    opt._talent.apply(gs.player);
    updateDerivedStats(gs.player);
  } else if (opt.type === 'gold') {
    addCoins(opt.amount);
    addFloatingText('💰 +' + opt.amount, gs.player.x, gs.player.y - 24, '#fd4', 1.8);
  } else {
    // Track stat picks to prevent re-offering
    if (opt.type === 'stat' && gs.pickedSupplyIds) gs.pickedSupplyIds.add(opt.id);
    applyUpgradeEffect(opt);
  }
  gs.phase = 'playing';
  waveCompleteTriggered = false;
  checkWaveComplete();
  updateHUD();
}

// Shared upgrade effect (used by both wave-end and drop supply)
function applyUpgradeEffect(opt) {
  const p = gs.player;
  if (opt.type === 'stat') {
    if      (opt.id==='maxhp')    { p.maxHp+=30; healPlayer(30); }
    else if (opt.id==='speed')    p.spd+=20;
    else if (opt.id==='physdmg')  p.meleeDmgMult  = Math.min(2.0, +(((p.meleeDmgMult||1)*1.30).toFixed(4)));
    else if (opt.id==='magicdmg') p.elemDmgMult   = Math.min(2.0, +(((p.elemDmgMult||1)*1.30).toFixed(4)));
    else if (opt.id==='gundmg')   p.rangedDmgMult = Math.min(2.0, +(((p.rangedDmgMult||1)*1.30).toFixed(4)));
    else if (opt.id==='area')     p.areaMult  = +(p.areaMult*1.15).toFixed(4);
    else if (opt.id==='cd')       p.cdMult    = Math.max(0.2,+(p.cdMult*0.88).toFixed(4));
    else if (opt.id==='heal')     healPlayer(p.maxHp*0.6);
    else if (opt.id==='pickup')   p.pickupR  += 40;
    else if (opt.id==='luck')     p.luck     += 25;
    else if (opt.id==='dodge')    p.baseDodge   = Math.min(0.6,p.baseDodge  +0.06);
    else if (opt.id==='dmgred')       p.baseDmgRed  = Math.min(0.6,p.baseDmgRed+0.05);
    else if (opt.id==='magnet_boost') p.pickupR = Math.round(p.pickupR * 1.5);
    else if (opt.id==='wave_shield')  { p.hasWaveShield = true; p.waveShieldUp = true; }
    else if (opt.id==='ghost_shadow') p.hasGhostShadow = true;
    else if (opt.id==='land_mine') {
      p.hasMines = true;
      if (gs.mines) { gs.mines = [];
        for (let _i=0;_i<3;_i++){const _a=Math.random()*Math.PI*2,_d=160+Math.random()*280; gs.mines.push({x:p.x+Math.cos(_a)*_d,y:p.y+Math.sin(_a)*_d});}
      }
    }
    else if (opt.id==='ice_armor') p.hasIceArmor = true;
    else if (opt.id==='overload')  { p.hasOverload = true; p.overloadKills = 0; }
    else if (opt.id.startsWith('weplv_')) {
      const _wid = opt.id.slice(6); // e.g. 'weplv_shotgun' → 'shotgun'
      const _w = gs.weapons.find(w => w.id === _wid);
      if (_w && WEAPON_DEFS[_wid]) _w.level = Math.min(WEAPON_DEFS[_wid].maxLv, _w.level + 1);
    }
    // Track picked stat (dedup)
    if (p.pickedStatIds && opt.id !== 'heal') p.pickedStatIds.add(opt.id);
    updateDerivedStats(p);
  } else if (opt.type === 'wepup') {
    const w = getWeapon(opt.weapId);
    if (w) w.level = Math.min(WEAPON_DEFS[w.id].maxLv, w.level+1);
  } else if (opt.type === 'wepadd') {
    addWeapon(opt.weapId);
  } else if (opt.type === 'gun_upgrade') {
      const w = getWeapon(opt.weapId);
      if (!w) return;
      w.level = Math.min(WEAPON_DEFS[opt.weapId].maxLv, w.level + 1);
      if (opt.gunOp === 'bullet') w.bulletEffect = opt.bulletEffect;
      if (opt.gunOp === 'element') w.element = opt.element;
      if (opt.gunOp === 'mod') {
        if (!w.variantMods) w.variantMods = [];
        if (opt.mod === 'extra_gun') {
          w.extraGun = true;
        } else {
          w.variantMods.push(opt.mod); // dual_bullet, dmg_20, aspd, extra_shell
        }
      }
    } else if (opt.type === 'fsword_upgrade') {
    const _fw = getWeapon('flying_sword');
    if (!_fw) return;
    _fw.level = Math.min(WEAPON_DEFS.flying_sword.maxLv, _fw.level+1);
    const _pushSword = () => { if(_fw.fsSwords) _fw.fsSwords.push({x:gs.player.x,y:gs.player.y,vx:0,vy:0,state:'orbit',hitCd:0}); };
    if      (opt.fsOp==='element')    { _fw.fsElement=opt.elem; _fw.fsBladeCount=(_fw.fsBladeCount||0)+1; _pushSword(); }
    else if (opt.fsOp==='absorb')     { _fw.fsAbsorb=true;  _fw.fsBladeCount=(_fw.fsBladeCount||0)+1; _pushSword(); }
    else if (opt.fsOp==='infuse')     { _fw.fsInfuse=true;  _fw.fsBladeCount=(_fw.fsBladeCount||0)+1; _pushSword(); }
    else if (opt.fsOp==='drain')      { _fw.fsDrain=true;   _fw.fsBladeCount=(_fw.fsBladeCount||0)+1; _pushSword(); }
    else if (opt.fsOp==='ultra')      { _fw.fsUltra=true;   _fw.fsBladeCount=(_fw.fsBladeCount||0)+2; _pushSword(); _pushSword(); }
    else if (opt.fsOp==='lethal')     { _fw.fsCritBonus=(_fw.fsCritBonus||0)+0.20; }
    else if (opt.fsOp==='balanced')   { _fw.fsBladeDmgMult=+((_fw.fsBladeDmgMult||1)*1.10).toFixed(4); _fw.fsCritBonus=(_fw.fsCritBonus||0)+0.10; }
    else if (opt.fsOp==='sharp')      { _fw.fsBladeDmgMult=+((_fw.fsBladeDmgMult||1)*1.30).toFixed(4); }
    else if (opt.fsOp==='specialized'){ _fw.fsSpecialized=true; }
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
  } else if (opt.type === 'missileup') {
      const w = getWeapon(opt.weapId);
      if (!w) return;
      w.level = Math.min(WEAPON_DEFS[opt.weapId].maxLv, w.level + 1);
      if (opt.missileOp === 'stat') {
        if (opt.statOp==='radius') w.missileRadMult = +((w.missileRadMult||1)*1.15).toFixed(4);
        if (opt.statOp==='dmg')    w.missileDmgMult = +((w.missileDmgMult||1)*1.35).toFixed(4);
        if (opt.statOp==='cd')     w.missileCdMult  = +((w.missileCdMult||1)*0.80).toFixed(4);
      }
      if (opt.missileOp==='mode') w.missileMode = opt.mode;
      if (opt.missileOp==='warhead') {
        w.warhead = opt.warhead;
        w.missileDmgMult = +((w.missileDmgMult||1)*2.0).toFixed(4);
      }
      if (opt.missileOp==='deathmissile') {
        w.deathMissile = true;
        w.missileDmgMult = +((w.missileDmgMult||1)*2.0).toFixed(4);
        w.missileRadMult = +((w.missileRadMult||1)*2.5).toFixed(4);
      }
    } else if (opt.type === 'drone_upgrade') {
      const w = getWeapon(opt.weapId);
      if (!w) return;
      w.level = Math.min(WEAPON_DEFS[opt.weapId].maxLv, w.level + 1);
      if (opt.droneOp === 'element') w.element = opt.element;
      if (opt.droneOp === 'stat') {
        if (opt.statOp === 'heal')  w.healMult     = (w.healMult||1) * 1.3;
        if (opt.statOp === 'range') w.rangeMult    = (w.rangeMult||1) * 1.3;
        if (opt.statOp === 'cd')    w.cdMultLocal  = (w.cdMultLocal||1) * 0.75;
      }
      if (opt.droneOp === 'hospital') {
        if (opt.hosp === 'range') w.rangeMult  = (w.rangeMult||1) * 2.0;
        if (opt.hosp === 'follow') w.follows   = true;
        if (opt.hosp === 'heal')  w.healMult   = (w.healMult||1) * 1.5;
      }
      if (opt.droneOp === 'superheal') {
        w.healMult  = (w.healMult||1) * 1.5;
        w.rangeMult = (w.rangeMult||1) * 1.2;
      }
    } else if (opt.type === 'sniperup') {
      const w = getWeapon('sniper') || (() => { addWeapon('sniper'); return getWeapon('sniper'); })();
      const p = gs.player;
      w.level = Math.min(WEAPON_DEFS.sniper.maxLv, w.level + 1);
      if (opt.sniperOp === 'dmgbonus')   w.sniperDmgBonus = (w.sniperDmgBonus||0) + 0.35;
      if (opt.sniperOp === 'critbullet') { p.critRate = Math.min(1, (p.critRate||0)+0.10); p.critDmgMult = (p.critDmgMult||1.5)+0.10; w.sniperCritRate=(w.sniperCritRate||0)+0.10; w.sniperCritDmg=(w.sniperCritDmg||0)+0.10; }
      if (opt.sniperOp === 'extrabullet') w.sniperExtraBullets = (w.sniperExtraBullets||0) + 1;
      if (opt.sniperOp === 'heavy')      { w.heavySniper = true; p.spd = Math.max(10, p.spd - 8); }
      if (opt.sniperOp === 'growing')    { w.growingSniper = true; w.growingKillCount=0; w.growingBonus=0; }
      if (opt.sniperOp === 'dragon')     { w.dragonSniper = true; w.dragonShotCount = 0; }
      if (opt.sniperOp === 'tactical')   { w.tacticalSniper = true; w.smokeTimer = 20; }
      if (opt.sniperOp === 'alloy')      { w.alloyBullet = true; }
      if (opt.sniperOp === 'split')      { w.splitBullet = true; }
      if (opt.sniperOp === 'lvl8bounce') { w.lvl8Bounce = true; }
      if (opt.sniperOp === 'reaperKill') { w.reaperKill = true; }
    } else if (opt.type === 'turret_special') {
      const w = getWeapon('turret');
      if (!w) return;
      w.level = Math.min(WEAPON_DEFS.turret.maxLv, w.level + 1);
      w._lastLevel = w.level;           // prevent double-processing in updateTurrets
      w.specialType = opt.specialType;  // 'heal' | 'kamikaze' | 'minigun'
      w.specialCount = 1;               // reset to base (Lv7 can raise it later)
      w.extraTurrets = Math.max(w.extraTurrets||0, 2); // guarantee ×3 regular turrets
      w._nextUpgrade = _rollTurretUpgrade(w); // pre-roll Lv5/Lv6 upgrade
      w._specialNeedsSpawn = true; // game.js handles spawn on next tick or wave start
    } else if (opt.type === 'turret_lv7') {
      const w = getWeapon('turret');
      if (!w) return;
      w.level = Math.min(WEAPON_DEFS.turret.maxLv, w.level + 1);
      w._lastLevel = w.level;
      if (opt.lv7Op === 'more') {
        w.extraTurrets  = (w.extraTurrets||0) + 3;   // +3 regular turrets
        w.specialCount  = (w.specialCount||1) + 3;   // +3 special units
      } else if (opt.lv7Op === 'defence') {
        w.defenceTurretMode = true;
      } else if (opt.lv7Op === 'element') {
        w.elementTurretMode = true;
      }
      w._nextUpgrade = _rollTurretUpgrade(w);
      w._specialNeedsSpawn = true;
    } else if (opt.type === 'turret_lv8') {
      const w = getWeapon('turret');
      if (!w) return;
      w.level = Math.min(WEAPON_DEFS.turret.maxLv, w.level + 1);
      w._lastLevel = w.level;
      w.mineTurretMode = true;
      w.extraTurrets   = (w.extraTurrets||0) + 5;    // +5 regular turrets
      w._nextUpgrade = _rollTurretUpgrade(w);
      w._specialNeedsSpawn = true;
    }
}

// ═══════════════════════════════════════════════════════
// §17c  Level-up screen
// ═══════════════════════════════════════════════════════
function getLuckGain(luck) {
  // Higher luck → more likely to roll high (10–20)
  const bias = Math.min(1.0, luck / 120);
  let v = 10 + Math.floor(Math.random()*11);
  if (Math.random() < bias) v = Math.max(v, 10 + Math.floor(Math.random()*11));
  return v;
}

function getLevelUpOptions() {
  // Level-up: 技能選擇（最多 maxSkillSlots 個技能同時裝備）
  const p   = gs.player;
  const maxS = p.maxSkillSlots ?? 3;
  const equipped = gs.equippedSkills || [];

  // 技能格已滿 → 顯示提示佔位（不可選）
  if (equipped.length >= maxS) {
    return [{
      type: 'skill_full',
      icon: '🔒',
      name: '技能格已满',
      desc: `已装备 ${equipped.length}/${maxS} 个技能，无法继续选择`,
    }];
  }

  // 從 SUPPLY_TALENTS 中過濾掉已裝備的技能，隨機取 3 個
  const available = (typeof SUPPLY_TALENTS !== 'undefined')
    ? SUPPLY_TALENTS.filter(t => !gs.talents.has(t.id))
    : [];

  if (!available.length) {
    return [{
      type: 'skill_full',
      icon: '✅',
      name: '所有技能已习得',
      desc: '已掌握全部可用技能',
    }];
  }

  return shuffled(available).slice(0, 3).map(t => ({
    type:  'skill',
    id:    t.id,
    icon:  t.icon,
    name:  t.name,
    desc:  t.desc,
    _talent: t,
  }));
}

function showLevelUpScreen() {
  const p   = gs.player;
  const maxS = p.maxSkillSlots ?? 3;
  const equipped = gs.equippedSkills || [];
  document.getElementById('lvlup-title').textContent =
    `⬆ 升至 Lv.${p.level}  ✨ 技能 ${equipped.length}/${maxS}`;
  const container = document.getElementById('lvlup-cards');
  container.innerHTML = '';
  getLevelUpOptions().forEach((opt, idx) => {
    const isFull = opt.type === 'skill_full';
    const slot = document.createElement('div');
    slot.className = 'lvlup-slot';
    slot.style.animationDelay = (idx * 0.08) + 's';
    const card = document.createElement('div');
    card.className = 'lvlup-card';
    card.innerHTML = `<span class="u-icon">${opt.icon}</span><div class="u-name">${opt.name}</div><div class="u-desc">${opt.desc}</div>`;
    slot.appendChild(card);
    if (!isFull) {
      const btn = document.createElement('button');
      btn.className = 'lvlup-btn';
      btn.textContent = '✔ 装备';
      btn.addEventListener('click', () => applyLevelUpUpgrade(opt));
      slot.appendChild(btn);
    } else {
      // 技能格已滿：顯示「確定」直接關閉
      const btn = document.createElement('button');
      btn.className = 'lvlup-btn';
      btn.textContent = '确定';
      btn.addEventListener('click', () => applyLevelUpUpgrade(opt));
      slot.appendChild(btn);
    }
    container.appendChild(slot);
  });
  document.getElementById('o-levelup').classList.add('active');
}

function applyLevelUpUpgrade(opt) {
  document.getElementById('o-levelup').classList.remove('active');
  const p = gs.player;
  if (opt.type === 'skill') {
    // ── 裝備技能 ──
    const maxS = p.maxSkillSlots ?? 3;
    if (!gs.equippedSkills) gs.equippedSkills = [];
    if (gs.equippedSkills.length < maxS && !gs.talents.has(opt.id)) {
      gs.equippedSkills.push(opt.id);
      gs.talents.add(opt.id);         // 保持向後相容，供 hitEnemy/killEnemy 查詢
      if (typeof opt._talent?.apply === 'function') opt._talent.apply(p);
      updateDerivedStats(p);
      if (typeof addFloatingText === 'function')
        addFloatingText(`✨ ${opt.name}`, p.x, p.y - 44, '#a4f', 1.5);
    }
  } else if (opt.type === 'skill_full') {
    // 格滿或無技能可選 → 直接繼續，不做任何動作
  } else if (opt.type === 'lvstat') {
    if      (opt.id === 'maxhp')   { p.maxHp += 10; healPlayer(10); }
    else if (opt.id === 'hpregen') { p.hpRegen = (p.hpRegen||0) + 1; }
    else if (opt.id === 'luck')    { p.luck += (opt._val||15); }
    else if (opt.id === 'speed')   { p.spd += (opt._val||5); }
    else if (opt.id === 'pickup')  { p.pickupR += 10; }
    else if (opt.id === 'xpmult')  { p.xpMult = +((p.xpMult||1) + 0.05).toFixed(2); }
    else if (opt.id === 'dodge5')  { p.baseDodge  = Math.min(0.6, p.baseDodge  + 0.05); }
    else if (opt.id === 'dmgred5') { p.baseDmgRed = Math.min(0.6, p.baseDmgRed + 0.05); }
    else if (opt.id === 'dodge_dmgred') {
      p.baseDodge  = Math.min(0.6, p.baseDodge  + 0.05);
      p.baseDmgRed = Math.min(0.6, p.baseDmgRed + 0.05);
    }
    if (p.pickedStatIds && !['maxhp','heal'].includes(opt.id)) p.pickedStatIds.add(opt.id);
    updateDerivedStats(p);
  } else {
    applyUpgradeEffect(opt);
  }
  // Chain if more level-ups queued
  if (p.levelUpQueue > 0) {
    p.levelUpQueue--;
    showLevelUpScreen();
  } else {
    gs.phase = 'playing';
    // Reset so wave-complete check re-fires if wave ended while level-up was open
    waveCompleteTriggered = false;
    checkWaveComplete();
  }
  updateHUD();
}

// ═══════════════════════════════════════════════════════
// §18  Supply screen (boss wave)
// ═══════════════════════════════════════════════════════
// ── Super supply (every 5th wave) ──
let ssupCurrentOptions = [];
let ssupRefreshUsed    = [];

function getSuperSupplyPool() {
  const pool = [];
  const missileW = getWeapon('missile_drone');
  if (missileW && missileW.level === 7) {
    pool.push({ type:'missileup', missileOp:'deathmissile', weapId:'missile_drone',
      icon:'☠', name:'死神飞弹', desc:'导弹伤害×2·爆炸半径×2.5·均匀分布在玩家周围' });
  }
  const sniperW = getWeapon('sniper');
  if (sniperW && sniperW.level === 7) {
    pool.push({ type:'sniperup', weapId:'sniper', icon:'🔭', name:'连狙Lv8', desc:'发射间隔-1秒·子弹碰墙反弹一次', sniperOp:'lvl8bounce' });
    if (CLASSES[gs.player.classIdx]?.id === 'reaper') {
      pool.push({ type:'sniperup', weapId:'sniper', icon:'💀', name:'死神之狙·专武', desc:'子弹攻击有0.5%概率秒杀非Boss敌人', sniperOp:'reaperKill' });
    }
  }
  SUPPLY_TALENTS.filter(t => !gs.talents.has(t.id)).forEach(t =>
    pool.push({ type:'talent', id:t.id, icon:t.icon, name:t.name, desc:t.desc, _talent:t }));
  return shuffled(pool);
}

function showSuperSupplyScreen() {
  document.getElementById('ssup-sub').textContent = `第 ${gs.wave.num} 波结束 — 选择一项强力奖励`;
  ssupRefreshUsed = [false, false, false];
  ssupCurrentOptions = getSuperSupplyPool().slice(0, 3);
  renderSuperSupplyCards();
  document.getElementById('o-ssupply').classList.add('active');
}

function renderSuperSupplyCards() {
  const container = document.getElementById('ssup-cards');
  container.innerHTML = '';
  ssupCurrentOptions.forEach((opt, idx) => {
    const slot = document.createElement('div');
    slot.className = 'ssup-slot';
    const card = document.createElement('div');
    card.className = 'sup-card ssup-card';
    card.style.animationDelay = (idx*0.1)+'s';
    card.innerHTML = `<span class="u-icon">${opt.icon}</span><div class="u-name">${opt.name}</div><div class="u-desc">${opt.desc}</div>`;
    card.addEventListener('click', () => applySuperSupply(opt));
    const btn = document.createElement('button');
    btn.className = 'ssup-refresh' + (ssupRefreshUsed[idx] ? ' used' : '');
    btn.textContent = ssupRefreshUsed[idx] ? '已刷新' : '🔄 刷新';
    btn.disabled = ssupRefreshUsed[idx];
    btn.addEventListener('click', () => {
      if (ssupRefreshUsed[idx]) return;
      ssupRefreshUsed[idx] = true;
      const fresh = getSuperSupplyPool().filter(p =>
        !ssupCurrentOptions.find((u,i) => i!==idx && u.name===p.name));
      ssupCurrentOptions[idx] = fresh[Math.floor(Math.random()*fresh.length)] || ssupCurrentOptions[idx];
      renderSuperSupplyCards();
    });
    slot.appendChild(card);
    slot.appendChild(btn);
    container.appendChild(slot);
  });
}

function applySuperSupply(opt) {
  document.getElementById('o-ssupply').classList.remove('active');
  if (opt.type === 'talent') {
    gs.talents.add(opt.id);
    opt._talent.apply(gs.player);
    updateDerivedStats(gs.player);
  } else {
    applyUpgradeEffect(opt);
  }
  gs.phase = 'playing';
  waveCompleteTriggered = false;
  startWave(gs.wave.num + 1);
  updateHUD();
}

// ═══════════════════════════════════════════════════════
// §19  HUD
// ═══════════════════════════════════════════════════════
function updateHUD() {
  if (!gs) return;
  const p=gs.player;

  document.getElementById('hud-hp-txt').textContent  = `❤ ${Math.ceil(p.hp)}/${p.maxHp}`;
  document.getElementById('hud-hp-bar').style.width  = Math.max(0,p.hp/p.maxHp*100)+'%';
  // XP bar
  document.getElementById('hud-level').textContent   = p.level;
  document.getElementById('hud-xp-txt').textContent  = `${p.xp}/${p.xpToNext} XP`;
  document.getElementById('hud-xp-fill').style.width = Math.min(100, p.xp/p.xpToNext*100).toFixed(1)+'%';
  document.getElementById('hud-wave').textContent    = `S${gs.stage||1} · ${gs.wave.num}/30波`;
  document.getElementById('hud-enemies').textContent = `敌人: ${gs.enemies.filter(e=>!e.dead).length}`;
  document.getElementById('hud-kills').textContent   = `💀 ${gs.kills}  🐚 ${gs.player.shells||0}`;
  document.getElementById('hud-score').textContent   = `得分: ${gs.score}`;

  // Stats
  const dropPct  = (dropChance(p.luck)*100).toFixed(0);
  const effDodge = (p.dodgeChance*100).toFixed(0);
  const effArm   = (p.dmgReduction*100).toFixed(0);
  document.getElementById('hud-stat-lck').textContent = `🍀 LCK:${p.luck}(掉${dropPct}%)`;
  document.getElementById('hud-stat-eva').textContent = `💨 闪避: ${effDodge}%`;
  document.getElementById('hud-stat-arm').textContent = `🛡 减伤: ${effArm}%`;
  const regenEl = document.getElementById('hud-stat-regen');
  if (p.hpRegen > 0) {
    const xpTag = p.xpMult > 1 ? ` | ⭐×${p.xpMult.toFixed(2)}` : '';
    regenEl.textContent = `💖 ${p.hpRegen}/s${xpTag}`;
    regenEl.style.display = '';
  } else if (p.xpMult > 1) {
    regenEl.textContent = `⭐ 经验×${p.xpMult.toFixed(2)}`;
    regenEl.style.display = '';
  } else {
    regenEl.style.display = 'none';
  }

  // Weapons bar
  const wbar = document.getElementById('hud-weapons-bar');
  if (gs.weapons.length===0) {
    wbar.textContent = '⚔ 武器: —';
  } else {
    wbar.innerHTML = gs.weapons.map(w=>{
      const def=WEAPON_DEFS[w.id];
      return def ? `<span title="${def.name}">${def.icon}Lv${w.level}</span>` : '';
    }).join(' ');
  }

  // Skill cooldown bar
  const skillEl = document.getElementById('hud-skill');
  if (skillEl) {
    const clsId = CLASSES[p.classIdx]?.id;
    // Kirby form: determine name + color
    let _kirbyFormName = '无形态', _kirbyFormColor = '#888';
    if (clsId === 'kirby') {
      const _kw = getWeapon('kirby_copy');
      const _formNames  = {fire:'🔥火焰', sword:'⚔剑士', thunder:'⚡雷电', ice:'❄冰冻'};
      const _formColors = {fire:'#f84', sword:'#fd4', thunder:'#88f', ice:'#8ef'};
      if (_kw?.kirbyForm) {
        _kirbyFormName  = _formNames[_kw.kirbyForm]  || '未知';
        _kirbyFormColor = _formColors[_kw.kirbyForm] || '#888';
      }
    }
    const skillName = clsId==='doctor' ? '💊 妙手回春' : clsId==='berserker' ? '⚡ 狂暴' : clsId==='blacksmith' ? '⚒ 临阵磨枪' : clsId==='mage' ? '✨ 法力无天' : clsId==='scholar' ? '📚 经验老道' : clsId==='reaper' ? '🎯 狙神' : clsId==='kirby' ? `🌀 模仿·${_kirbyFormName}` : clsId==='santa' ? '🎁 圣诞礼物' : '☄ 流星';
    if (clsId === 'kirby') {
      skillEl.style.color = _kirbyFormColor;
      skillEl.style.borderColor = _kirbyFormColor;
    } else {
      skillEl.style.color = '';
      skillEl.style.borderColor = '';
    }
    if (clsId==='berserker' && p.berserkActive) {
      skillEl.textContent = `⚡ 狂暴 ${Math.ceil(p.berserkTimer)}s`;
      skillEl.className = 'berserk-on';
    } else if (clsId==='blacksmith' && p.sharpenActive) {
      skillEl.textContent = `⚒ 临阵磨枪 ${Math.ceil(p.sharpenTimer)}s`;
      skillEl.className = 'berserk-on';
    } else if (clsId==='mage' && p.manaActive) {
      skillEl.textContent = `✨ 法力无天 ${Math.ceil(p.manaTimer)}s`;
      skillEl.className = 'berserk-on';
    } else if (clsId==='reaper' && p.reaperChanneling) {
      skillEl.textContent = `🎯 瞄准中 ${(REAPER_CHANNEL_TIME - p.reaperChannel).toFixed(1)}s`;
      skillEl.className = 'berserk-on';
    } else if (clsId==='santa' && ((p.santaAtkTimer||0)>0||(p.santaCdTimer||0)>0||(p.santaHealTimer||0)>0)) {
      const parts = [];
      if (p.santaAtkTimer>0) parts.push(`🔴攻+25% ${Math.ceil(p.santaAtkTimer)}s`);
      if (p.santaCdTimer>0)  parts.push(`🔵CD-25% ${Math.ceil(p.santaCdTimer)}s`);
      if (p.santaHealTimer>0) parts.push(`🟢回血 ${Math.ceil(p.santaHealTimer)}s`);
      skillEl.textContent = parts.join(' ');
      skillEl.className = 'berserk-on';
    } else if (p.skillCd > 0) {
      skillEl.textContent = `${skillName} ${Math.ceil(p.skillCd)}s`;
      skillEl.className = 'cd-active';
    } else {
      skillEl.textContent = `${skillName} READY`;
      skillEl.className = '';
    }
  }

  // Talents bar
  const tbar = document.getElementById('hud-talents-bar');
  if (gs.talents.size===0) {
    tbar.textContent='';
  } else {
    tbar.innerHTML = [...gs.talents].map(id=>{
      const t=SUPPLY_TALENTS.find(t=>t.id===id);
      return t ? `<span title="${t.name}">${t.icon}</span>` : '';
    }).join('');
  }
}

// ═══════════════════════════════════════════════════════
// §20  Menu / overlay helpers
// ═══════════════════════════════════════════════════════
function showOverlay(id) {
  document.querySelectorAll('.overlay').forEach(el=>el.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.getElementById('hud').style.display='none';
  document.getElementById('hud-bot').style.display='none';
  _setMobileVisible(false);
  const _fl=document.getElementById('float-layer'); if(_fl) _fl.style.display='none';
}

function showGameScreen() {
  document.querySelectorAll('.overlay').forEach(el=>el.classList.remove('active'));
  document.getElementById('hud').style.display='block';
  document.getElementById('hud-bot').style.display='block';
  document.getElementById('hud-ingame-btns').style.display='flex';
  if (_isTouchDevice) _setMobileVisible(true);
  const _fl=document.getElementById('float-layer'); if(_fl) _fl.style.display='block';
}

function showDeadScreen() {
  saveBest(); checkAchievements();
  document.getElementById('hud').style.display='none';
  document.getElementById('hud-bot').style.display='none';
  document.getElementById('hud-ingame-btns').style.display='none';
  const p=gs.player;
  const effDodge=(Math.min(0.6,p.baseDodge+p.luck*0.001)*100).toFixed(0);
  const effArm  =(Math.min(0.6,p.baseDmgRed+p.luck*0.0005)*100).toFixed(0);
  document.getElementById('dead-stats').innerHTML=`
    <div class="stat-row">🌊 波数: <b style="color:#fd4">第 ${gs.wave.num} 波</b></div>
    <div class="stat-row">💀 击杀: <b style="color:#4ef">${gs.kills}</b></div>
    <div class="stat-row">⭐ 得分: <b style="color:#4f4">${gs.score}</b></div>
    <div class="stat-row">🍀 幸运: <b>${p.luck}</b> &nbsp;💨 闪避: <b>${effDodge}%</b> &nbsp;🛡 减伤: <b>${effArm}%</b></div>`;
  const earned = Math.floor(calcCoinsEarned(gs.wave.num, gs.kills) * (gs.player?.coinBonusMult||1));
  addCoins(earned);
  const _xpG=Math.floor(20+gs.wave.num*4+Math.floor(gs.kills/3));
  const _lvB=getPlayerLevel();addPlayerXP(_xpG);const _lvA=getPlayerLevel();
  document.getElementById('dead-coins').innerHTML =
    `💰 金币: <b>+${earned}</b>（合计: <b>${getCoins()}</b>）&nbsp; ✨ 经验: <b style="color:#a4f">+${_xpG}</b>`+(_lvA>_lvB?` <b style="color:#fd4">⬆️ Lv.${_lvA}</b>`:'');
  document.getElementById('o-dead').classList.add('active');
}

function showStageClearScreen() {
  const _st = gs.stage || 1;
  saveBest(); checkAchievements();
  try { const _bs=parseInt(localStorage.getItem('pw_best_stage')||'0'); if(_st>_bs) localStorage.setItem('pw_best_stage',_st); } catch(e){}
  document.getElementById('hud').style.display='none';
  document.getElementById('hud-bot').style.display='none';
  document.getElementById('hud-ingame-btns').style.display='none';
  document.getElementById('victory-title').textContent = `第${_st}关通关！`;
  document.getElementById('victory-stats').innerHTML=`
    <div class="stat-row">🌊 第<b style="color:#fd4">${_st}</b>关 全部30波通关</div>
    <div class="stat-row">💀 击杀: <b style="color:#4ef">${gs.kills}</b></div>
    <div class="stat-row">⭐ 得分: <b style="color:#4f4">${gs.score}</b></div>`;
  const earned = Math.floor(calcCoinsEarned(30, gs.kills) * (gs.player?.coinBonusMult||1));
  addCoins(earned);
  const _xpG=Math.floor(20+30*4+Math.floor(gs.kills/3));
  const _lvB=getPlayerLevel();addPlayerXP(_xpG);const _lvA=getPlayerLevel();
  document.getElementById('victory-coins').innerHTML =
    `💰 金币: <b>+${earned}</b>（合计: <b>${getCoins()}</b>）&nbsp; ✨ 经验: <b style="color:#a4f">+${_xpG}</b>`+(_lvA>_lvB?` <b style="color:#fd4">⬆️ Lv.${_lvA}</b>`:'');
  // Next stage info
  const _ns = _st+1;
  const _hpX = Math.pow(1.5,_ns-1).toFixed(1);
  const _cntX = Math.pow(1.12,_ns-1).toFixed(2);
  document.getElementById('victory-next-stage').style.display='block';
  document.getElementById('victory-next-stage').innerHTML=
    `<b>第${_ns}关 · 挑战升级</b><br>敌人HP/伤害 ×${_hpX} &nbsp;|&nbsp; 数量 ×${_cntX}<br><span style="color:#fd4;font-size:10px">保留当前全部武器和升级</span>`;
  const _nb=document.getElementById('btn-next-stage');
  _nb.style.display='block'; _nb.textContent=`⚔ 继续 → 第${_ns}关`;
  document.getElementById('o-victory').classList.add('active');
}
function showVictoryScreen() { showStageClearScreen(); }

// Button wiring
document.getElementById('btn-start').addEventListener('click', () => {
  selectedClassIdx = 0;
  document.querySelectorAll('.cls-dot').forEach((c,i)=>c.classList.toggle('sel',i===0));
  updateClsPreview(0);
  document.getElementById('btn-confirm').disabled = false;
  document.getElementById('btn-confirm').style.opacity = '1';
  refreshClsGrid();
  showOverlay('o-class');
});
document.getElementById('btn-settings').addEventListener('click', ()=>showOverlay('o-settings'));
document.getElementById('btn-achieve').addEventListener('click', ()=>{ renderAchievements(); showOverlay('o-achieve'); });
// ── 邮箱系统 ──
function getClaimedMails() {
  try { return new Set(JSON.parse(localStorage.getItem('pw_claimed_mails')||'[]')); }
  catch(e) { return new Set(); }
}
function saveClaimedMails(set) {
  localStorage.setItem('pw_claimed_mails', JSON.stringify([...set]));
}

function getActiveMails() {
  const now = new Date();
  return MAILBOX.filter(m => !m.expires || new Date(m.expires) >= now);
}

function updateMailBadge() {
  const claimed = getClaimedMails();
  const unclaimed = getActiveMails().filter(m => !claimed.has(m.id) && m.reward).length;
  const badge = document.getElementById('mail-badge');
  if (unclaimed > 0) { badge.textContent = unclaimed; badge.style.display = 'block'; }
  else { badge.style.display = 'none'; }
}

function renderMailbox() {
  const claimed = getClaimedMails();
  const list = document.getElementById('mailbox-list');
  const active = getActiveMails();
  if (active.length === 0) {
    list.innerHTML = '<div class="mail-empty">📭 暂无邮件</div>';
    return;
  }
  list.innerHTML = active.map(mail => {
    const isClaimed = claimed.has(mail.id);
    const expiryHtml = mail.expires ? `<div style="font-size:9px;color:#666;margin-top:2px">⏰ 到期: ${mail.expires}</div>` : '';
    const rewardHtml = mail.reward ? `
      <div class="mail-reward">
        <div class="mail-reward-info">${mail.reward.icon} ${mail.reward.name}</div>
        <button class="mail-claim${isClaimed?' done':''}" data-id="${mail.id}"
          ${isClaimed?'disabled':''}>
          ${isClaimed ? '已领取' : '领取'}
        </button>
      </div>` : '';
    return `
      <div class="mail-item ${isClaimed?'claimed':'unclaimed'}" id="mailitem-${mail.id}">
        <div class="mail-from">📨 ${mail.from || '官方'} · ${mail.date || ''}</div>
        <div class="mail-title">${mail.title}</div>
        <div class="mail-content">${mail.content || ''}</div>
        ${expiryHtml}
        ${rewardHtml}
      </div>`;
  }).join('');

  list.querySelectorAll('.mail-claim:not(.done)').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const mail = MAILBOX.find(m => m.id === id);
      if (!mail?.reward) return;
      try {
        if (mail.reward.type === 'coins') {
          addCoins(mail.reward.value || 0);
        } else if (mail.reward.type === 'gacha_tickets') {
          const cur = parseInt(localStorage.getItem('pw_gacha_tickets')||'0',10)||0;
          localStorage.setItem('pw_gacha_tickets', String(cur + (mail.reward.value||0)));
        } else {
          const pending = JSON.parse(localStorage.getItem('pw_pending_rewards')||'[]');
          pending.push({ icon:mail.reward.icon, name:mail.reward.name,
                          type:mail.reward.type, value:mail.reward.value });
          localStorage.setItem('pw_pending_rewards', JSON.stringify(pending));
        }
      } catch(e){}
      const c = getClaimedMails(); c.add(id); saveClaimedMails(c);
      btn.textContent = '已领取'; btn.classList.add('done'); btn.disabled = true;
      const item = document.getElementById(`mailitem-${id}`);
      if (item) { item.classList.remove('unclaimed'); item.classList.add('claimed'); }
      updateMailBadge();
      renderMenuCoins();
    });
  });
}

// 版本号 & 公告渲染（读自 CHANGELOG 常量）
function renderAnnounce() {
  document.getElementById('menu-version').textContent = GAME_VERSION;
  document.getElementById('announce-version').textContent =
    `${GAME_VERSION} · ${CHANGELOG[0]?.date || ''}`;
  const log = document.getElementById('announce-log');
  log.innerHTML = CHANGELOG.map((entry, i) => `
    <div style="margin-bottom:14px">
      <div style="font-size:12px;color:#fd4;margin-bottom:5px;letter-spacing:1px">
        ${i===0?'🆕':'📌'} ${entry.version}
        <span style="font-size:9px;color:#555;margin-left:6px">${entry.date}</span>
      </div>
      <div style="font-size:11px;color:#ccc;line-height:2;
        border-left:2px solid #f844;padding-left:10px">
        ${entry.items.map(s=>`· ${s}`).join('<br>')}
      </div>
    </div>`).join('');
}
renderAnnounce();

document.getElementById('btn-announce').addEventListener('click', ()=>showOverlay('o-announce'));
document.getElementById('btn-announce-back').addEventListener('click', ()=>showOverlay('o-menu'));
document.getElementById('btn-mailbox').addEventListener('click', ()=>{ renderMailbox(); showOverlay('o-mailbox'); });
document.getElementById('btn-mailbox-back').addEventListener('click', ()=>showOverlay('o-menu'));
document.getElementById('btn-shop').addEventListener('click', ()=>{ renderShop(); showOverlay('o-shop'); });
document.getElementById('btn-shop-back').addEventListener('click', ()=>{ renderMenuCoins(); showOverlay('o-menu'); });
document.getElementById('btn-activity').addEventListener('click', ()=>showOverlay('o-activity'));
document.getElementById('btn-activity-back').addEventListener('click', ()=>showOverlay('o-menu'));
updateMailBadge();

// Animated character cycling on main menu (sprite-aware)
(function() {
  const MENU_CLASSES = [
    { label:'医生',     sprite:'player_doctor' },
    { label:'狂战士',   sprite:'player_berserker' },
    { label:'法师',     sprite:'player_mage' },
    { label:'模仿者',   icon:'🌀' },
    { label:'西蒙·海耶', sprite:'player_reaper' },
    { label:'铁匠',     icon:'⚒' },
    { label:'博士',     icon:'🎓' },
    { label:'圣诞老人', sprite:'player_santa' },
    { label:'天选者',   icon:'⭐' },
  ];
  let ci = 0;

  function drawMenuSprite(sprName) {
    const cv = document.getElementById('menu-sprite-canvas');
    if (!cv) return;
    const c2 = cv.getContext('2d');

    // Use original PNG images for doctor / mage
    const imgMap = { player_doctor: IMG_DOCTOR, player_mage: IMG_MAGE, player_reaper: IMG_REAPER, player_berserker: IMG_BERSERKER, player_santa: IMG_SANTA };
    const imgSpr = imgMap[sprName];
    if (imgSpr && imgSpr.complete && imgSpr.naturalWidth) {
      const tgtH = 160;
      const tgtW = Math.round(imgSpr.naturalWidth / imgSpr.naturalHeight * tgtH);
      cv.width = tgtW; cv.height = tgtH;
      cv.style.width = tgtW + 'px'; cv.style.height = tgtH + 'px';
      c2.clearRect(0, 0, tgtW, tgtH);
      c2.imageSmoothingEnabled = false;
      c2.drawImage(imgSpr, 0, 0, tgtW, tgtH);
      return;
    }

    // Fallback: pixel array sprite
    const rows = SPRITES[sprName];
    if (!rows) return;
    const sc = 10;
    cv.width  = rows[0].length * sc;
    cv.height = rows.length * sc;
    cv.style.width  = (rows[0].length * sc) + 'px';
    cv.style.height = (rows.length * sc) + 'px';
    c2.clearRect(0, 0, cv.width, cv.height);
    rows.forEach((row, ry) => {
      [...row].forEach((ch, cx) => {
        const col = P[ch];
        if (!col) return;
        c2.fillStyle = col;
        c2.fillRect(cx * sc, ry * sc, sc, sc);
      });
    });
  }

  function showMenuClass(idx) {
    const cls = MENU_CLASSES[idx];
    const iconEl  = document.getElementById('menu-char-icon');
    const canvEl  = document.getElementById('menu-sprite-canvas');
    const labelEl = document.getElementById('menu-char-label');
    if (labelEl) labelEl.textContent = '— ' + cls.label + ' —';
    if (cls.sprite) {
      if (iconEl)  iconEl.style.display  = 'none';
      if (canvEl)  canvEl.style.display  = 'block';
      const imgMap2 = { player_doctor: IMG_DOCTOR, player_mage: IMG_MAGE, player_reaper: IMG_REAPER, player_berserker: IMG_BERSERKER, player_santa: IMG_SANTA };
      const img2 = imgMap2[cls.sprite];
      if (img2 && img2.complete && img2.naturalWidth) {
        drawMenuSprite(cls.sprite);
      } else if (img2) {
        img2.onload = () => {
          // Only draw if this class is still the active one
          if (MENU_CLASSES[ci] && MENU_CLASSES[ci].sprite === cls.sprite) drawMenuSprite(cls.sprite);
        };
      }
    } else {
      if (canvEl) canvEl.style.display = 'none';
      if (iconEl) { iconEl.style.display = ''; iconEl.textContent = cls.icon; }
    }
  }

  // Fade transition helper
  function fadeToClass(idx) {
    const iconEl  = document.getElementById('menu-char-icon');
    const canvEl  = document.getElementById('menu-sprite-canvas');
    const labelEl = document.getElementById('menu-char-label');
    [iconEl, canvEl, labelEl].forEach(el => { if (el) el.style.opacity = '0'; });
    setTimeout(() => {
      showMenuClass(idx);
      [iconEl, canvEl, labelEl].forEach(el => { if (el) el.style.opacity = '1'; });
    }, 220);
  }

  // Set transitions
  ['menu-char-icon','menu-sprite-canvas','menu-char-label'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.transition = 'opacity .22s';
  });

  // Show doctor first
  showMenuClass(0);

  setInterval(() => {
    ci = (ci + 1) % MENU_CLASSES.length;
    fadeToClass(ci);
  }, 2600);
})();
document.getElementById('btn-class-back').addEventListener('click', ()=>showOverlay('o-menu'));
// 使用 onclick（而非 addEventListener）使得遊戲内設置覆蓋能正確生效
document.getElementById('btn-settings-back').onclick = ()=>showOverlay('o-menu');
document.getElementById('btn-achieve-back').addEventListener('click', ()=>showOverlay('o-menu'));
document.getElementById('btn-dead-menu').addEventListener('click', ()=>{ showOverlay('o-menu'); renderBestRun(); renderMenuCoins(); });
document.getElementById('btn-victory-menu').addEventListener('click', ()=>{ showOverlay('o-menu'); renderBestRun(); renderMenuCoins(); });
document.getElementById('btn-next-stage').addEventListener('click', ()=>{
  document.getElementById('o-victory').classList.remove('active');
  gs.stage = (gs.stage||1) + 1;
  gs.kills = 0; gs.score = 0;
  gs.summonOffered = false;
  waveCompleteTriggered = false;
  showGameScreen();
  startWave(1);
});
function _retryGame() {
  // 保留已裝備武器（id + quality），重置所有動畫狀態
  const _savedEquip = gs?.equipWeapons?.map(w => ({ id: w.id, quality: w.quality })) || [];
  showGameScreen();
  initGame(lastClassIdx);
  // initGame 建立新的 gs.equipWeapons = []，將武器還原（跳過購買流程，直接入格）
  if (_savedEquip.length && gs?.equipWeapons) {
    _savedEquip.forEach(({ id, quality }) => {
      gs.equipWeapons.push({ id, quality, timer: 0 });
    });
  }
}
document.getElementById('btn-retry').addEventListener('click', _retryGame);
document.getElementById('btn-victory-retry').addEventListener('click', _retryGame);

// In-game menu buttons
document.getElementById('btn-ingame-menu').addEventListener('click', ()=>{
  if (!gs || gs.phase==='dead') return;
  gs._prePausePhase = gs.phase;
  gs.phase = 'paused';
  document.getElementById('o-ingame-menu').classList.add('active');
});
document.getElementById('btn-resume').addEventListener('click', ()=>{
  document.getElementById('o-ingame-menu').classList.remove('active');
  gs.phase = gs._prePausePhase || 'playing';
});
document.getElementById('btn-ingame-settings').addEventListener('click', ()=>{
  document.getElementById('o-ingame-menu').classList.remove('active');
  // 覆蓋返回鍵邏輯：回到暫停選單，而非主選單
  document.getElementById('btn-settings-back').onclick = ()=>{
    document.getElementById('o-settings').classList.remove('active');
    document.getElementById('o-ingame-menu').classList.add('active');
    // gs.phase 保持 'paused'，等玩家在暫停選單點「繼續」才恢復
  };
  showOverlay('o-settings');
});
document.getElementById('btn-quit-run').addEventListener('click', ()=>{
  document.getElementById('o-ingame-menu').classList.remove('active');
  document.getElementById('hud-ingame-btns').style.display='none';
  gs.phase = 'dead';
  showDeadScreen();
});
document.getElementById('btn-ingame-char').addEventListener('click', ()=>{
  if (!gs) return;
  gs._prePausePhase = gs.phase;
  gs.phase = 'paused';
  renderCharDetail();
  document.getElementById('o-char-detail').classList.add('active');
});
document.getElementById('btn-char-from-menu').addEventListener('click', ()=>{
  if (!gs) return;
  document.getElementById('o-ingame-menu').classList.remove('active');
  renderCharDetail();
  document.getElementById('o-char-detail').classList.add('active');
});
document.getElementById('btn-char-detail-back').addEventListener('click', ()=>{
  document.getElementById('o-char-detail').classList.remove('active');
  gs.phase = gs._prePausePhase || 'playing';
});

function renderCharDetail() {
  if (!gs) return;
  const p = gs.player;
  const cls = CLASSES[p.classIdx];
  const effDodge = (Math.min(0.6, p.baseDodge) * 100).toFixed(1);
  const effArm   = (Math.min(0.6, p.baseDmgRed) * 100).toFixed(1);
  document.getElementById('char-detail-content').innerHTML = `
    <div style="font-size:14px;color:#fd4;font-weight:700;margin-bottom:8px">${cls?.name||'?'} &nbsp; Lv.${p.level}</div>
    <div>❤ HP: <b style="color:#f44">${Math.ceil(p.hp)} / ${p.maxHp}</b></div>
    <div>⚔ 伤害倍率: <b style="color:#fd4">${(p.dmgMult*100).toFixed(0)}%</b></div>
    <div>💨 移速: <b>${p.spd}</b></div>
    <div>🍀 幸运: <b style="color:#4f4">${p.luck}</b></div>
    <div>💖 回复: <b style="color:#6f6">${p.hpRegen}/s</b></div>
    <div>🌀 闪避: <b style="color:#8af">${effDodge}%</b></div>
    <div>🛡 减伤: <b style="color:#aaa">${effArm}%</b></div>
    <div>⚡ 暴击率: <b style="color:#fd4">${((p.critRate||0)*100).toFixed(0)}%</b> &nbsp; 暴击伤害: <b>${((p.critDmgMult||1.5)*100).toFixed(0)}%</b></div>
    <div>🧲 拾取范围: <b>${p.pickupR}</b></div>
    <div style="margin-top:8px;color:#555">— 天赋 (${gs.talents.size}) —</div>
    ${[...gs.talents].map(id=>{const t=SUPPLY_TALENTS.find(x=>x.id===id);return t?`<div>${t.icon} ${t.name}</div>`:''}).join('')||'<div style="color:#444">暂无</div>'}
  `;
}
document.getElementById('btn-confirm').addEventListener('click', ()=>{
  if (selectedClassIdx<0) return;
  const cls = CLASSES[selectedClassIdx];
  if (!cls) return;
  if (cls.id === 'santa') {
    const d = new Date();
    if (d.getMonth() !== 11 || d.getDate() !== 25) return;
  }
  if (!isUnlocked(cls.id)) {
    alert(`「${cls.name}」尚未解锁！\n请前往商城购买或完成解锁条件。`);
    return;
  }
  showWeapSelScreen(); // 進入選武器步驟
});

// ═══════════════════════════════════════════════════════
// §  起始技能選擇畫面
// ═══════════════════════════════════════════════════════
// 技能池由 WEAPON_DEFS.isSkill === true 動態決定
// 木棍在 EQUIP_WEAPON_DEFS（isSkill:false），雙重保護確保不出現在技能選擇介面
const _SKILL_CAT_COL = { gun:'#4df', phys:'#fd4', magic:'#b4f' };
const _SKILL_CAT_LBL = { gun:'枪械', phys:'物理', magic:'魔法' };

let _weapSelItems = []; // [{ id, def }]
let _weapSelIdx   = 0;

function _skillCol(def) { return _SKILL_CAT_COL[def?.wepCat] || '#aaa'; }
function _skillLbl(def) { return _SKILL_CAT_LBL[def?.wepCat] || (def?.wepCat || ''); }

function showWeapSelScreen() {
  const defs      = (typeof WEAPON_DEFS       !== 'undefined') ? WEAPON_DEFS       : {};
  const equipDefs = (typeof EQUIP_WEAPON_DEFS !== 'undefined') ? EQUIP_WEAPON_DEFS : {};
  // 雙重過濾：① isSkill === true  ② ID 不在裝備武器表（木棍等）
  _weapSelItems = Object.entries(defs)
    .filter(([id, def]) => def.isSkill === true && !equipDefs[id])
    .map(([id, def]) => ({ id, def }));
  _weapSelIdx = 0;
  _renderWeapGrid();
  _updateWeapPreview(0);
  showOverlay('o-weapsel');
}

function _renderWeapGrid() {
  const grid = document.getElementById('wep-grid');
  if (!grid) return;
  grid.innerHTML = _weapSelItems.map((w, i) => {
    const col = _skillCol(w.def);
    const sel = i === _weapSelIdx;
    return `<div class="wep-dot${sel ? ' sel' : ''}" data-idx="${i}"
      style="border-color:${col};${sel ? `box-shadow:0 0 16px ${col}55` : ''}">
      <span style="font-size:26px;line-height:1">${w.def.icon || '?'}</span>
      <div class="wep-dot-name">${w.def.name}</div>
      <div class="wep-dot-qlabel" style="color:${col}">${_skillLbl(w.def)}</div>
    </div>`;
  }).join('');

  grid.querySelectorAll('.wep-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      _weapSelIdx = parseInt(dot.dataset.idx);
      _renderWeapGrid();
      _updateWeapPreview(_weapSelIdx);
      if (typeof SFX !== 'undefined') SFX.play('click');
    });
  });
}

function _updateWeapPreview(idx) {
  const w = _weapSelItems[idx]; if (!w) return;
  const col = _skillCol(w.def);
  const lv1 = w.def.levels?.[0] || {};

  // 大圖示
  const imgEl = document.getElementById('wep-prev-img');
  if (imgEl) imgEl.innerHTML =
    `<span style="font-size:52px;line-height:1;filter:drop-shadow(0 0 10px ${col})">${w.def.icon || '?'}</span>`;

  // 名稱
  const nameEl = document.getElementById('wep-prev-name');
  if (nameEl) { nameEl.textContent = w.def.name; nameEl.style.color = col; }

  // 類型徽章
  const qualEl = document.getElementById('wep-prev-quality');
  if (qualEl) qualEl.innerHTML =
    `<span style="color:${col};border:1px solid ${col}55;background:${col}18;` +
    `border-radius:3px;padding:1px 12px;font-size:10px;font-weight:700">${_skillLbl(w.def)}</span>`;

  // 屬性 + 簡介
  const statEl = document.getElementById('wep-prev-stat');
  if (statEl) {
    const dmg = lv1.dmg  != null ? `⚔ <b style="color:${col}">${lv1.dmg}</b>&emsp;` : '';
    const cd  = lv1.cd   != null ? `⏱ <b style="color:${col}">${lv1.cd}s</b>` : '';
    const desc = w.def.startDesc || '';
    statEl.innerHTML =
      (dmg || cd ? `<div>${dmg}${cd}</div>` : '') +
      (desc ? `<div style="color:#888;margin-top:4px;font-size:9px;line-height:1.6">${desc}</div>` : '');
  }
}

document.getElementById('btn-wep-confirm').addEventListener('click', () => {
  const w = _weapSelItems[_weapSelIdx]; if (!w) return;
  showGameScreen();
  initGame(selectedClassIdx);
  // 免費贈送起始技能
  if (typeof addWeapon === 'function') addWeapon(w.id);
});

document.getElementById('btn-wep-back').addEventListener('click', () => {
  showOverlay('o-class');
});

// Christmas check: show Santa dot only on December 25
(function() {
  const d = new Date();
  if (d.getMonth() === 11 && d.getDate() === 25) {
    const santaDot = document.getElementById('cls-7');
    if (santaDot) santaDot.style.display = '';
  }
})();

// Preview updater
function updateClsPreview(idx) {
  const dots = document.querySelectorAll('.cls-dot');
  const dot = dots[idx];
  if (!dot) return;
  const anim = document.getElementById('cls-preview');
  anim.style.animation = 'none'; anim.offsetHeight; anim.style.animation = '';
  document.getElementById('cls-prev-icon').textContent = dot.dataset.icon || '';
  document.getElementById('cls-prev-name').textContent = dot.dataset.name || '';
  document.getElementById('cls-prev-stat').innerHTML  = dot.dataset.stat || '';
}

// Pre-select class 0
selectedClassIdx = 0;
document.querySelectorAll('.cls-dot').forEach((dot, i) => {
  dot.addEventListener('click', () => {
    if (dot.classList.contains('locked')) return; // can't select locked
    selectedClassIdx = i;
    document.querySelectorAll('.cls-dot').forEach((d,di) => d.classList.toggle('sel', di===i));
    updateClsPreview(i);
  });
});

// Global SFX for btn clicks
document.querySelectorAll('.btn').forEach(b=>b.addEventListener('click',()=>SFX.play('click'),{passive:true}));

// ═══════════════════════════════════════════════════════
// §TUT  新手教程
// ═══════════════════════════════════════════════════════

const _TUTORIAL_STEPS = [
  {
    icon: '⚔',
    title: '欢迎来到像素勇士！',
    html: '这是一款<b style="color:#fd4">像素风 RPG 肉鸽游戏</b>。<br>选择职业，在不断涌来的怪物浪潮中战斗，<br>击杀敌人获得升级和武器，挑战最终Boss！<br><br><span style="color:#666;font-size:10px">每局游戏都是全新的冒险体验 — 永远不会无聊！</span>',
    target: null,
  },
  {
    icon: '🕹',
    title: '操控角色移动',
    html: '键盘：按 <b style="color:#4ef">WASD</b> 或 <b style="color:#4ef">方向键</b> 控制移动方向。<br>手机：拖拽屏幕<b style="color:#4ef">左侧虚拟摇杆</b>即可。<br><br><div style="text-align:center;line-height:1.4;font-size:16px;letter-spacing:6px;margin:8px 0;color:#aaa">　⬆<br>⬅ 🧑 ➡<br>　⬇</div><span style="color:#666;font-size:10px">武器会<b style="color:#fd4">自动攻击</b>周围最近的敌人！</span>',
    target: null,
  },
  {
    icon: '✨',
    title: '使用技能',
    html: '每个职业都有独特的主动技能！<br>键盘：按 <b style="color:#fd4">空格键</b> 释放技能。<br>手机：点击屏幕<b style="color:#fd4">右下角技能按钮</b>。<br><br><div style="border:1px solid #fd4;border-radius:12px;padding:5px 14px;display:inline-block;color:#fd4;font-size:11px;margin:6px 0">✨ 技能 [就绪]</div><br><span style="color:#666;font-size:10px">技能有冷却时间，冷却结束后重新发光。</span>',
    target: null,
  },
  {
    icon: '🌊',
    title: '波次与升级系统',
    html: '击败<b style="color:#4ef">一波所有怪物</b>后，出现升级选择界面。<br>从3张卡片中选择一张：<br><br>• 🗡 <b>新武器</b> 或 武器升级<br>• 🌟 <b>角色天赋</b><br>• 🎁 <b>补给</b>（特殊强化）<br><br><b style="color:#f84">每10波</b>遭遇强力 <b style="color:#f84">Boss</b>，小心应对！',
    target: null,
  },
  {
    icon: '🗡',
    title: '武器系统',
    html: '最多携带 <b style="color:#fd4">6把武器</b>，每把可独立升级强化。<br><br>武器类型多样：<br>🔫 枪械 ／ ⚔ 剑类 ／ 🚁 无人机<br>🏹 箭类 ／ 🐢 召唤 ／ 🛡 炮台<br><br>不同武器针对不同怪物有<b style="color:#4ef">克制关系</b>，<br>多武器组合搭配是通关的关键！',
    target: null,
  },
  {
    icon: '🌟',
    title: '补给与天赋',
    html: '每隔几波出现<b style="color:#fd4">补给选择</b>，可获得强力天赋。<br>天赋<b>永久强化</b>角色直到本局结束：<br><br>• 提升攻击力 / 移速 / 暴击率<br>• 获得特殊被动技能<br>• 强化特定武器行为<br><br><span style="color:#aaa">天赋搭配决定角色实力的上限！</span>',
    target: null,
  },
  {
    icon: '🎰',
    title: '抽奖系统',
    html: '用游戏中获得的<b style="color:#fd4">金币</b>在抽奖系统中抽取奖励！<br>可以获得宝石、强化材料等丰厚奖励。<br><br>点击顶部高亮的 <b style="color:#f8a">🎰 抽奖</b> 按钮即可进入。',
    target: 'btn-gacha',
  },
  {
    icon: '⚒',
    title: '强化工坊',
    html: '在强化工坊中全面强化武器：<br><br>• <b style="color:#fd4">升级</b>：消耗金币提升武器等级<br>• <b style="color:#4ef">升星</b>：突破武器品质上限<br>• <b style="color:#4f8">宝石</b>：镶嵌宝石获得额外加成<br><br>点击顶部高亮的 <b style="color:#fd4">⚒ 工坊</b> 按钮进入。',
    target: 'btn-forge',
  },
  {
    icon: '💎',
    title: '宝石怪与宝石系统',
    html: '游戏中随机出现<b style="color:#4f8">宝石怪</b>，击败可获得宝石！<br><br>宝石共 <b>7种品质</b>（从低到高）：<br><span style="color:#ccc">普通</span> → <span style="color:#4f8">稀有</span> → <span style="color:#4af">较稀有</span> → <span style="color:#a4f">史诗</span><br>→ <span style="color:#fd4">传说</span> → <span style="color:#f84">神话</span> → <span style="background:linear-gradient(90deg,#f44,#fd4,#4f8,#4af,#f4f);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">至臻</span><br><br>宝石可在工坊镶嵌到武器上，提供强力加成！',
    target: null,
  },
  {
    icon: '🎉',
    title: '准备好了！',
    html: '你已了解游戏的基本玩法！<br><br>选择一个职业，踏上你的<b style="color:#fd4">像素冒险</b>旅程！<br><br><span style="color:#555;font-size:10px">随时可通过顶部「📖 教程」按钮重看本教程。</span>',
    target: null,
    isLast: true,
  },
];

let _tutStep = 0;

function _tutCreateDOM() {
  if (document.getElementById('tut-backdrop')) return;
  const frag = document.createDocumentFragment();

  const backdrop = document.createElement('div');
  backdrop.id = 'tut-backdrop';
  frag.appendChild(backdrop);

  const hl = document.createElement('div');
  hl.id = 'tut-highlight';
  frag.appendChild(hl);

  const arrow = document.createElement('div');
  arrow.id = 'tut-arrow';
  frag.appendChild(arrow);

  const box = document.createElement('div');
  box.id = 'tut-box';
  frag.appendChild(box);

  document.body.appendChild(frag);
}

function openTutorial() {
  _tutCreateDOM();
  _tutStep = 0;
  document.getElementById('tut-backdrop').classList.add('active');
  _renderTutStep();
}

function _tutClose() {
  const backdrop = document.getElementById('tut-backdrop');
  const box      = document.getElementById('tut-box');
  const hl       = document.getElementById('tut-highlight');
  const arrow    = document.getElementById('tut-arrow');
  if (backdrop) backdrop.classList.remove('active');
  if (box)   { box.style.display='none'; box.classList.remove('tut-in'); }
  if (hl)      hl.style.display = 'none';
  if (arrow)   arrow.style.display = 'none';
  markTutorialDone();
}

function _tutNext() {
  if (_tutStep >= _TUTORIAL_STEPS.length - 1) { _tutClose(); return; }
  _tutStep++;
  _renderTutStep();
}

function _renderTutStep() {
  const step  = _TUTORIAL_STEPS[_tutStep];
  const total = _TUTORIAL_STEPS.length;
  const box   = document.getElementById('tut-box');
  const hl    = document.getElementById('tut-highlight');
  const arrow = document.getElementById('tut-arrow');

  // ── dots ──
  const dots = _TUTORIAL_STEPS.map((_, i) => {
    const cls = i === _tutStep ? 'cur' : (i < _tutStep ? 'done' : '');
    return `<div class="tut-dot${cls?' '+cls:''}"></div>`;
  }).join('');

  // ── next button ──
  const isLast = !!step.isLast;
  const nextLabel = isLast ? '🎉&nbsp; 开始冒险！' : '下一步 ▶';
  const nextCls   = isLast ? 'tut-btn-next last' : 'tut-btn-next';

  box.innerHTML =
    `<span class="tut-icon">${step.icon}</span>` +
    `<div class="tut-title">${step.title}</div>` +
    `<div class="tut-text">${step.html}</div>` +
    `<div class="tut-dots">${dots}</div>` +
    `<div class="tut-btns">` +
      `<button class="tut-btn-skip" onclick="_tutClose()">跳过</button>` +
      `<span class="tut-step-label">${_tutStep + 1}&thinsp;/&thinsp;${total}</span>` +
      `<button class="${nextCls}" onclick="_tutNext()">${nextLabel}</button>` +
    `</div>`;

  // ── highlight & arrow ──
  hl.style.display    = 'none';
  arrow.style.display = 'none';
  arrow.className     = '';
  arrow.id            = 'tut-arrow';

  const targetEl = step.target ? document.getElementById(step.target) : null;

  if (targetEl) {
    const r   = targetEl.getBoundingClientRect();
    const pad = 5;
    hl.style.cssText = `display:block;left:${r.left-pad}px;top:${r.top-pad}px;`+
                       `width:${r.width+pad*2}px;height:${r.height+pad*2}px`;

    // ── position dialog near the element ──
    const bW      = Math.min(300, window.innerWidth * 0.88);
    const elCX    = r.left + r.width  / 2;
    const elCY    = r.top  + r.height / 2;
    const inTop   = elCY < window.innerHeight / 2;
    const gap     = 14;
    const arrowSz = 22;

    let boxTop, boxLeft;
    if (inTop) {
      // dialog below element
      boxTop = r.bottom + arrowSz + gap;
      arrow.textContent = '▲';
      arrow.classList.add('dir-up');
      arrow.style.cssText = `display:block;left:${elCX-11}px;top:${r.bottom+4}px`;
    } else {
      // dialog above element (estimate height ~260px)
      const estH = 260;
      boxTop = Math.max(8, r.top - estH - arrowSz - gap);
      arrow.textContent = '▼';
      arrow.classList.add('dir-down');
      arrow.style.cssText = `display:block;left:${elCX-11}px;top:${r.top - arrowSz - 4}px`;
    }
    boxLeft = Math.max(8, Math.min(elCX - bW/2, window.innerWidth - bW - 8));
    box.style.cssText = `display:block;left:${boxLeft}px;top:${boxTop}px;width:${bW}px`;
  } else {
    // center dialog
    box.style.cssText = `display:block;left:50%;top:50%;transform:translate(-50%,-50%)`;
  }

  // ── re-trigger entrance animation ──
  box.classList.remove('tut-in');
  void box.offsetWidth; // reflow
  box.classList.add('tut-in');
}

// ── Add tutorial button to menu topbar ──
(function(){
  const topbar = document.getElementById('menu-topbar');
  if (!topbar) return;
  const btn = document.createElement('button');
  btn.className = 'btn icon-btn';
  btn.title = '教程';
  btn.innerHTML = '📖';
  btn.id = 'btn-tutorial';
  btn.style.cssText = 'border-color:#4ef;color:#4ef';
  btn.addEventListener('click', () => { SFX.play('click'); openTutorial(); });
  // Insert right after btn-settings
  const ref = document.getElementById('btn-settings');
  ref ? ref.after(btn) : topbar.appendChild(btn);
})();

// ── Auto-show on very first visit ──
(function(){
  if (typeof isTutorialDone === 'function' && !isTutorialDone()) {
    setTimeout(openTutorial, 700);
  }
})();

document.getElementById('tog-particles').addEventListener('click', ()=>{
  settings.particles=!settings.particles;
  document.getElementById('tog-particles').classList.toggle('on',settings.particles);
});
// Music toggle
try { const m=localStorage.getItem('pw_music'); if(m==='0'){_musicEnabled=false;document.getElementById('tog-music').classList.remove('on');} }catch(e){}
document.getElementById('tog-music').addEventListener('click', ()=>{
  _musicEnabled = !_musicEnabled;
  document.getElementById('tog-music').classList.toggle('on', _musicEnabled);
  toggleMusic(_musicEnabled);
});
document.getElementById('spd-slider').addEventListener('input', function(){
  settings.gameSpeed=this.value/100;
  document.getElementById('spd-val').textContent='×'+settings.gameSpeed.toFixed(1);
});

