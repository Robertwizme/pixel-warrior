#!/usr/bin/env node
// v043_update.js

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const HTML = path.join(ROOT, 'index.html');
let html = fs.readFileSync(HTML, 'utf8');

function rep(from, to, label) {
  if (!html.includes(from)) { console.error('FAIL [' + label + ']: anchor not found'); process.exit(1); }
  html = html.replace(from, to);
  console.log('✓', label);
}

// ═══════════════════════════════════════════════════════
// 1. Fix canvas overwrite: remove onload drawing callbacks
//    (they fire after showMenuClass(0) and overwrite with wrong image)
// ═══════════════════════════════════════════════════════
rep(
`IMG_DOCTOR.onload = () => {
  const cv = document.getElementById('menu-sprite-canvas');
  if (cv && cv.style.display !== 'none') {
    const c2 = cv.getContext('2d');
    const tgtH = 160, tgtW = Math.round(IMG_DOCTOR.naturalWidth / IMG_DOCTOR.naturalHeight * tgtH);
    cv.width = tgtW; cv.height = tgtH;
    cv.style.width = tgtW + 'px'; cv.style.height = tgtH + 'px';
    c2.clearRect(0, 0, tgtW, tgtH);
    c2.imageSmoothingEnabled = false;
    c2.drawImage(IMG_DOCTOR, 0, 0, tgtW, tgtH);
  }
};`,
`// IMG_DOCTOR onload removed — drawMenuSprite handles rendering`,
'Remove IMG_DOCTOR onload'
);

rep(
`IMG_MAGE.onload = () => {
  const cv = document.getElementById('menu-sprite-canvas');
  if (cv && cv.style.display !== 'none') {
    const c2 = cv.getContext('2d');
    const tgtH = 160, tgtW = Math.round(IMG_MAGE.naturalWidth / IMG_MAGE.naturalHeight * tgtH);
    cv.width = tgtW; cv.height = tgtH;
    cv.style.width = tgtW + 'px'; cv.style.height = tgtH + 'px';
    c2.clearRect(0, 0, tgtW, tgtH);
    c2.imageSmoothingEnabled = false;
    c2.drawImage(IMG_MAGE, 0, 0, tgtW, tgtH);
  }
};`,
`// IMG_MAGE onload removed — drawMenuSprite handles rendering`,
'Remove IMG_MAGE onload'
);

rep(
`IMG_REAPER.onload = () => {
  const cv = document.getElementById('menu-sprite-canvas');
  if (cv && cv.style.display !== 'none') {
    const c2 = cv.getContext('2d');
    const tgtH = 160, tgtW = Math.round(IMG_REAPER.naturalWidth / IMG_REAPER.naturalHeight * tgtH);
    cv.width = tgtW; cv.height = tgtH;
    cv.style.width = tgtW + 'px'; cv.style.height = tgtH + 'px';
    c2.clearRect(0, 0, tgtW, tgtH);
    c2.imageSmoothingEnabled = true;
    c2.drawImage(IMG_REAPER, 0, 0, tgtW, tgtH);
  }
};`,
`// IMG_REAPER onload removed — drawMenuSprite handles rendering`,
'Remove IMG_REAPER onload'
);

// ═══════════════════════════════════════════════════════
// 2. showMenuClass: wait for image load if needed
// ═══════════════════════════════════════════════════════
rep(
`  function showMenuClass(idx) {
    const cls = MENU_CLASSES[idx];
    const iconEl  = document.getElementById('menu-char-icon');
    const canvEl  = document.getElementById('menu-sprite-canvas');
    const labelEl = document.getElementById('menu-char-label');
    if (cls.sprite) {
      if (iconEl)  iconEl.style.display  = 'none';
      if (canvEl) { canvEl.style.display = 'block'; drawMenuSprite(cls.sprite); }
    } else {
      if (canvEl) canvEl.style.display = 'none';
      if (iconEl) { iconEl.style.display = ''; iconEl.textContent = cls.icon; }
    }
    if (labelEl) labelEl.textContent = '— ' + cls.label + ' —';
  }`,
`  function showMenuClass(idx) {
    const cls = MENU_CLASSES[idx];
    const iconEl  = document.getElementById('menu-char-icon');
    const canvEl  = document.getElementById('menu-sprite-canvas');
    const labelEl = document.getElementById('menu-char-label');
    if (labelEl) labelEl.textContent = '— ' + cls.label + ' —';
    if (cls.sprite) {
      if (iconEl)  iconEl.style.display  = 'none';
      if (canvEl)  canvEl.style.display  = 'block';
      const imgMap2 = { player_doctor: IMG_DOCTOR, player_mage: IMG_MAGE, player_reaper: IMG_REAPER };
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
  }`,
'showMenuClass: set label first, handle image not-yet-loaded'
);

// ═══════════════════════════════════════════════════════
// 3. Fix sword orb visual: draw sword shapes not round balls
// ═══════════════════════════════════════════════════════
rep(
`      gs.swordOrbs.push({ x:ox, y:oy, color: stats.color||'#fd4', isBook: def.type==='orbit_book' });`,
`      gs.swordOrbs.push({ x:ox, y:oy, color: stats.color||'#fd4', isBook: def.type==='orbit_book', angle: a });`,
'Add angle to sword orb'
);

rep(
`    ctx.fillStyle=orb.color||'#fd4';
    ctx.save(); ctx.translate(sx,sy); ctx.rotate(Math.PI/4);
    if (orb.isBook) {
      // Book shape: rectangle + spine line
      ctx.fillRect(-6,-5,12,10);
      ctx.fillStyle='#000a'; ctx.fillRect(-6,-5,2,10);
    } else {
      ctx.fillRect(-5,-5,10,10);
      ctx.fillStyle='#ffe'; ctx.fillRect(-2,-2,4,4);
    }
    ctx.restore();`,
`    ctx.save(); ctx.translate(sx,sy); ctx.rotate((orb.angle||0) + Math.PI/2);
    if (orb.isBook) {
      ctx.fillStyle = orb.color||'#fd4';
      ctx.fillRect(-6,-5,12,10);
      ctx.fillStyle = '#000a'; ctx.fillRect(-6,-5,2,10);
    } else {
      // Sword shape
      ctx.fillStyle = orb.color||'#fd4';
      ctx.fillRect(-2,-9,4,16);
      ctx.fillStyle = '#ffe';
      ctx.fillRect(-1,-11,2,3);
      ctx.fillStyle = orb.color||'#fd4';
      ctx.fillRect(-6,-1,12,2);
      ctx.fillRect(-2,7,4,3);
    }
    ctx.restore();`,
'Sword orb visual → sword shape'
);

// ═══════════════════════════════════════════════════════
// 4. Missile drone: aim at nearest enemy instead of player
// ═══════════════════════════════════════════════════════
rep(
`  // ── 6 falling missiles around player ──
  for (let i=0; i<count; i++) {
    const ang = (i/count)*Math.PI*2 + Math.random()*0.4;
    const dist = 40 + Math.random()*70;
    const tx = p.x + Math.cos(ang)*dist;
    const ty = p.y + Math.sin(ang)*dist;
    const delay = 0.08 + i * 0.12;
    gs.pendingExplosions.push({ timer:delay, x:tx, y:ty, radius:baseR, dmg:baseDmg, w, falling:true, col });
  }`,
`  // ── 6 falling missiles → aimed at nearest enemy ──
  const _msTgt = nearestEnemy(p.x, p.y);
  const _msCx = _msTgt ? _msTgt.x : p.x;
  const _msCy = _msTgt ? _msTgt.y : p.y;
  for (let i=0; i<count; i++) {
    const ang = (i/count)*Math.PI*2 + Math.random()*0.5;
    const dist = 15 + Math.random()*30;
    const tx = _msCx + Math.cos(ang)*dist;
    const ty = _msCy + Math.sin(ang)*dist;
    const delay = 0.18 + i * 0.13;
    gs.pendingExplosions.push({ timer:delay, x:tx, y:ty, radius:baseR, dmg:baseDmg, w, falling:true, col });
  }`,
'Missile drone → aim at nearest enemy'
);

// ═══════════════════════════════════════════════════════
// 5. Initial pickup distance = 10 for all classes
// ═══════════════════════════════════════════════════════
rep(`p.hpRegen = 5; p.pickupR = 4; p.xpMult = 1; p.healAccum = 0; }`,
    `p.hpRegen = 5; p.pickupR = 10; p.xpMult = 1; p.healAccum = 0; }`, 'Doctor pickupR→10');
rep(`p.hpRegen = 2; p.pickupR = 6; p.xpMult = 1; }`,
    `p.hpRegen = 2; p.pickupR = 10; p.xpMult = 1; }`, 'Berserker pickupR→10');
rep(`p.hpRegen = 1; p.pickupR = 4; p.xpMult = 1; p.physDmgMult = 1.5; }`,
    `p.hpRegen = 1; p.pickupR = 10; p.xpMult = 1; p.physDmgMult = 1.5; }`, 'Blacksmith pickupR→10');
rep(`p.hpRegen = 1; p.pickupR = 4; p.xpMult = 1; p.magicDmgMult = 1.5; }`,
    `p.hpRegen = 1; p.pickupR = 10; p.xpMult = 1; p.magicDmgMult = 1.5; }`, 'Mage pickupR→10');
rep(`p.hpRegen = 1; p.pickupR = 4; p.xpMult = 1.5; }`,
    `p.hpRegen = 1; p.pickupR = 10; p.xpMult = 1.5; }`, 'Scholar pickupR→10');
rep(`p.hpRegen = 1; p.pickupR = 4; p.xpMult = 1; p.reaperGunMult = 1.5; }`,
    `p.hpRegen = 1; p.pickupR = 10; p.xpMult = 1; p.reaperGunMult = 1.5; }`, 'Reaper pickupR→10');
rep(`{ id:'kirby', name:'模仿者', hp:100, spd:70, dmgMult:1.0, areaMult:1.0, cdMult:1.0,
    bonus: p => { p.hpRegen = 1; p.pickupR = 4; p.xpMult = 1; } },`,
    `{ id:'kirby', name:'模仿者', hp:100, spd:70, dmgMult:1.0, areaMult:1.0, cdMult:1.0,
    bonus: p => { p.hpRegen = 1; p.pickupR = 10; p.xpMult = 1; } },`, 'Kirby pickupR→10');
rep(`p.hpRegen = 1; p.pickupR = 4; p.xpMult = 1; p.luck = 5; }`,
    `p.hpRegen = 1; p.pickupR = 10; p.xpMult = 1; p.luck = 5; }`, 'Santa pickupR→10');
rep(`{ id:'chosen', name:'天选者', hp:100, spd:70, dmgMult:1.0, areaMult:1.0, cdMult:1.0,
    bonus: p => { p.luck += 50; } },`,
    `{ id:'chosen', name:'天选者', hp:100, spd:70, dmgMult:1.0, areaMult:1.0, cdMult:1.0,
    bonus: p => { p.hpRegen = 1; p.pickupR = 10; p.xpMult = 1; p.luck = (p.luck||0) + 20; } },`,
    'Chosen class bonus + pickupR→10');

// ═══════════════════════════════════════════════════════
// 6. 天选者 skill: 天选之星 → 流星 (CD50s, meteor scales with luck, oneshot non-boss)
// ═══════════════════════════════════════════════════════
rep(
`function castChosenStar(p) {
  p.skillCd = 120;
  const tgt = nearestEnemy(p.x, p.y);
  const ang = tgt ? Math.atan2(tgt.y - p.y, tgt.x - p.x) : -Math.PI / 2;
  gs.projectiles.push({
    x: p.x, y: p.y,
    vx: Math.cos(ang) * 320, vy: Math.sin(ang) * 320,
    dmg: 999999, radius: Math.max(4, Math.floor(4 + p.luck * 0.18)), color: '#fd4',
    life: 4.0, type: 'star_skill',
    pierce: true, oneshot: true,
  });
  if (settings.particles)
    spawnParticles(p.x, p.y, ['#fd4', '#fff', '#ff0'], 24, 110, 0.9, 4);
}`,
`function castChosenStar(p) {
  p.skillCd = 50;
  const tgt = nearestEnemy(p.x, p.y);
  const ang = tgt ? Math.atan2(tgt.y - p.y, tgt.x - p.x) : -Math.PI / 2;
  const meteorR = Math.max(10, Math.floor(8 + p.luck * 0.35));
  const bossDmg  = Math.round(300 * (1 + (p.luck||0) * 0.01));
  gs.projectiles.push({
    x: p.x, y: p.y,
    vx: Math.cos(ang) * 360, vy: Math.sin(ang) * 360,
    dmg: bossDmg, radius: meteorR, color: '#f84',
    life: 5.0, type: 'star_skill',
    pierce: true, oneshot: true,
  });
  if (settings.particles)
    spawnParticles(p.x, p.y, ['#f84','#f44','#fd4','#ff0'], 36, 145, 1.1, 6);
  addFloatingText('☄ 流星!', p.x, p.y - 22, '#f84', 1.3);
}`,
'castChosenStar → 流星'
);

// HUD: rename skill display
rep(`clsId==='santa' ? '🎁 圣诞礼物' : '⭐ 天选之星'`,
    `clsId==='santa' ? '🎁 圣诞礼物' : '☄ 流星'`,
    'Skill name: 天选之星→流星');

// updateDerivedStats: chosen luck-damage
rep(
`function updateDerivedStats(p) {
  // 幸运值不影响闪避/减伤，只影响掉落率和稀有度
  p.dodgeChance  = Math.min(0.6, p.baseDodge);
  p.dmgReduction = Math.min(0.6, p.baseDmgRed);
}`,
`function updateDerivedStats(p) {
  p.dodgeChance  = Math.min(0.6, p.baseDodge);
  p.dmgReduction = Math.min(0.6, p.baseDmgRed);
  // 天选者: 每点幸运+1%伤害
  p.chosenLuckDmgMult = (CLASSES[p.classIdx]?.id === 'chosen') ? 1.0 + (p.luck||0)*0.01 : 1.0;
}`,
'updateDerivedStats: chosen luck-damage'
);

rep(
`  if ((p.santaAtkTimer||0) > 0) mult *= 1.25;`,
`  if ((p.santaAtkTimer||0) > 0) mult *= 1.25;
  if ((p.chosenLuckDmgMult||1) > 1) mult *= p.chosenLuckDmgMult;`,
'hitEnemy: apply chosen luck-damage mult'
);

// ═══════════════════════════════════════════════════════
// 7. Add 天选者 to MENU_CLASSES
// ═══════════════════════════════════════════════════════
rep(
`    { label:'圣诞老人', icon:'🎅' },
  ];`,
`    { label:'圣诞老人', icon:'🎅' },
    { label:'天选者',   icon:'⭐' },
  ];`,
'Add 天选者 to MENU_CLASSES'
);

// cls-8 stat text
rep(
`        data-stat="HP: 100 &nbsp; 速度: 70<br>——<br>初始幸运+50<br>天选之星技能<br>幸运决定星星大小">⭐</div>`,
`        data-stat="HP: 100 &nbsp; 速度: 70<br>回血: 1/s &nbsp; 幸运: +20<br>——<br>被动: 每点幸运+1%伤害<br>☄ 流星: 幸运越高越大·秒杀非Boss<br>冷却50秒">⭐</div>`,
'cls-8 天选者 stat text'
);

// ═══════════════════════════════════════════════════════
// 8. 飞剑 weapon system (obtainable ONLY via gacha)
// ═══════════════════════════════════════════════════════

// 8a. Insert 飞剑 WEAPON_DEF before kirby_copy
rep(
`  kirby_copy: {
    name:'模仿', icon:'⭐', maxLv:8, type:'kirby',`,
`  flying_sword: {
    name:'飞剑', icon:'🗡', maxLv:8, type:'normal', fire: fireFlyingSword,
    startDesc: '每2秒锁定最近敌人发射4把飞剑·50伤害·40%暴击×3倍',
    levels: [
      {cd:2000},{cd:2000},{cd:2000},{cd:2000},
      {cd:2000},{cd:2000},{cd:2000},{cd:1000}
    ],
    describe: lv => {
      const _fsw = (typeof gs!=='undefined') ? gs?.weapons?.find(x=>x.id==='flying_sword') : null;
      const _bl = 4 + (_fsw?.fsBladeCount||0);
      const _fd = Math.round(50 * (_fsw?.fsBladeDmgMult||1));
      const _fc = Math.round((0.40+(_fsw?.fsCritBonus||0))*100);
      return _bl+'把飞剑 | 伤害'+_fd+' | 暴击'+_fc+'%';
    }
  },
  kirby_copy: {
    name:'模仿', icon:'⭐', maxLv:8, type:'kirby',`,
'Add 飞剑 to WEAPON_DEFS'
);

// 8b. Insert 飞剑 functions + upgrade cards before the existing comment
rep(
`// (pistol variant screen removed – shotgun and gatling are now separate weapons)`,
`// (pistol variant screen removed – shotgun and gatling are now separate weapons)

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
  const ATK_SPD  = 380;
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

      if (sword.hitCd<=0) {
        const pierce = w.fsUltra;
        const hitList = gs.enemies.filter(e => !e.dead &&
          (e.x-sword.x)**2+(e.y-sword.y)**2 < (9+e.radius)**2).slice(0, pierce ? 999 : 1);
        hitList.forEach(e => {
          const isCrit = Math.random()<critRate;
          let dmg = Math.round(baseDmg*dmgMult*(p.dmgMult||1));
          if (isCrit) { dmg=Math.round(dmg*3); if(settings.particles) addFloatingText('暴击!',e.x,e.y-12,'#fd4',0.5); }
          hitEnemy(e, dmg);
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
      desc:'+2把飞剑·穿透敌人·攻速翻倍·锁定同一目标呈扇形齐射' },
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
}`,
'Add 飞剑 functions + upgrade cards'
);

// 8c. Hook updateFlyingSwords into game loop
rep(
`      updateSniperEffects(dt);`,
`      updateSniperEffects(dt);
      updateFlyingSwords(dt);`,
'Hook updateFlyingSwords into game loop'
);

// 8d. Hook 飞剑 fixed tiers into getUpgradeOptions (upgrade cards after getting it from gacha)
rep(
`  const sniperW = getWeapon('sniper');
  if (sniperW && [4,7].includes(sniperW.level + 1) && sniperW.level < WEAPON_DEFS.sniper.maxLv - 1)
    return getSniperUpgradeCards(sniperW).slice(0, cardCount);`,
`  const sniperW = getWeapon('sniper');
  if (sniperW && [4,7].includes(sniperW.level + 1) && sniperW.level < WEAPON_DEFS.sniper.maxLv - 1)
    return getSniperUpgradeCards(sniperW).slice(0, cardCount);

  const flyingW = getWeapon('flying_sword');
  if (flyingW && [4,7,8].includes(flyingW.level+1) && flyingW.level < WEAPON_DEFS.flying_sword.maxLv)
    return getFlyingSwordUpgradeCards(flyingW).slice(0, cardCount);`,
'飞剑 fixed tier forced upgrades'
);

rep(
`  // Sniper: random tiers (exclude fixed 4/7, exclude Lv8 which is super supply only)
  if (sniperW && ![4,7,8].includes(sniperW.level+1) && sniperW.level < WEAPON_DEFS.sniper.maxLv - 1)
    getSniperUpgradeCards(sniperW).forEach(c => weapPool.push(c));`,
`  // Sniper: random tiers (exclude fixed 4/7, exclude Lv8 which is super supply only)
  if (sniperW && ![4,7,8].includes(sniperW.level+1) && sniperW.level < WEAPON_DEFS.sniper.maxLv - 1)
    getSniperUpgradeCards(sniperW).forEach(c => weapPool.push(c));
  // 飞剑: random tiers (no new weapon — only upgrades after gacha unlock)
  if (flyingW && ![4,7,8].includes(flyingW.level+1) && flyingW.level < WEAPON_DEFS.flying_sword.maxLv)
    getFlyingSwordUpgradeCards(flyingW).forEach(c => weapPool.push(c));`,
'飞剑 random tier upgrades in pool'
);

// Exclude flying_sword from generic weapon upgrade and new-weapon loops
rep(
`    .filter(w => !['shotgun','gatling','heal_drone','missile_drone','kirby_copy','sniper'].includes(w.id) && w.level < WEAPON_DEFS[w.id].maxLv)`,
`    .filter(w => !['shotgun','gatling','heal_drone','missile_drone','kirby_copy','sniper','flying_sword'].includes(w.id) && w.level < WEAPON_DEFS[w.id].maxLv)`,
'Exclude 飞剑 from generic upgrade loop'
);

// Also exclude from start weapon pool and new weapon pool
rep(
`  const excluded = new Set(['heal_drone', 'kirby_copy']);`,
`  const excluded = new Set(['heal_drone', 'kirby_copy', 'flying_sword']);`,
'Exclude 飞剑 from start weapon pool'
);

rep(
`    shuffled(Object.keys(WEAPON_DEFS).filter(id => !owned.has(id) && id !== 'kirby_copy')).forEach(wid => {`,
`    shuffled(Object.keys(WEAPON_DEFS).filter(id => !owned.has(id) && id !== 'kirby_copy' && id !== 'flying_sword')).forEach(wid => {`,
'Exclude 飞剑 from new weapon drops'
);

// Also exclude from the very first weapon selection (no weapons owned)
rep(
`    return shuffled(Object.keys(WEAPON_DEFS).filter(id => id !== 'kirby_copy')).slice(0,3).map(id => ({`,
`    return shuffled(Object.keys(WEAPON_DEFS).filter(id => id !== 'kirby_copy' && id !== 'flying_sword')).slice(0,3).map(id => ({`,
'Exclude 飞剑 from first weapon selection'
);

// 8e. applyUpgradeEffect: add fsword_upgrade case
rep(
`  } else if (opt.type === 'missileup') {`,
`  } else if (opt.type === 'fsword_upgrade') {
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
  } else if (opt.type === 'missileup') {`,
'Add fsword_upgrade handler in applyUpgradeEffect'
);

// 8f. Render flying swords (add before drones render)
rep(
`  // Drones — orbit the player visually`,
`  // Flying Swords
  {
    const _fsW2 = typeof getWeapon==='function' ? getWeapon('flying_sword') : null;
    if (_fsW2 && _fsW2.fsSwords) {
      const _fsc = _fsW2.fsElement==='flame' ? '#f84' : _fsW2.fsElement==='frost' ? '#8cf' : _fsW2.fsElement==='poison' ? '#8f4' : '#cdf';
      _fsW2.fsSwords.forEach(sword => {
        const sx2=Math.floor(sword.x-cam.x), sy2=Math.floor(sword.y-cam.y);
        const ang2=Math.atan2(sword.vy||1, sword.vx||0.01);
        ctx.globalAlpha = sword.state==='attack' ? 0.65 : 0.35;
        ctx.fillStyle = _fsc;
        ctx.beginPath(); ctx.arc(sx2,sy2, sword.state==='attack'?8:6, 0,Math.PI*2); ctx.fill();
        ctx.globalAlpha=1;
        ctx.save(); ctx.translate(sx2,sy2); ctx.rotate(ang2+Math.PI/2);
        ctx.fillStyle=_fsc; ctx.fillRect(-2,-9,4,16);
        ctx.fillStyle='#ffe'; ctx.fillRect(-1,-11,2,3);
        ctx.fillStyle=_fsc; ctx.fillRect(-6,-1,12,2); ctx.fillRect(-2,7,4,3);
        ctx.restore();
      });
    }
  }

  // Drones — orbit the player visually`,
'Render flying swords'
);

// ═══════════════════════════════════════════════════════
// 9. getLevelUpOptions: add weapon upgrade card (but not 飞剑)
// ═══════════════════════════════════════════════════════
rep(
`  return shuffled(pool).slice(0, 3);
}

function showLevelUpScreen() {`,
`  // ~45% chance to also offer one weapon upgrade
  if (gs?.weapons && Math.random()<0.45) {
    const _owned = new Set(gs.weapons.map(w=>w.id));
    const _upgW = gs.weapons.filter(w => WEAPON_DEFS[w.id] && w.level<WEAPON_DEFS[w.id].maxLv
      && !['shotgun','gatling','heal_drone','missile_drone','sniper','flying_sword','kirby_copy'].includes(w.id));
    if (_upgW.length>0) {
      const _rw = _upgW[Math.floor(Math.random()*_upgW.length)];
      pool.push({ type:'wepup', weapId:_rw.id, icon:WEAPON_DEFS[_rw.id].icon,
        name:'升级 '+WEAPON_DEFS[_rw.id].name+' → Lv.'+(_rw.level+1), desc:describeWeapon(_rw.id,_rw.level+1) });
    } else if (gs.weapons.length<6) {
      const _avail = shuffled(Object.keys(WEAPON_DEFS).filter(id=>!_owned.has(id)&&!['kirby_copy','flying_sword'].includes(id)));
      if (_avail.length>0) pool.push({ type:'wepadd', weapId:_avail[0], icon:WEAPON_DEFS[_avail[0]].icon,
        name:'获得 '+WEAPON_DEFS[_avail[0]].name, desc:describeWeapon(_avail[0],1) });
    }
  }
  return shuffled(pool).slice(0, 3);
}

function showLevelUpScreen() {`,
'getLevelUpOptions: add weapon upgrade card (excl. 飞剑)'
);

// ═══════════════════════════════════════════════════════
// 10. GACHA SYSTEM: Replace placeholder with real pool
//     100-pull pity for 飞剑; otherwise coins/XP/stat items
// ═══════════════════════════════════════════════════════
rep(
`    <div style="background:rgba(255,255,255,0.03);border:1px solid #2a2a4a;border-radius:10px;padding:22px 16px;margin-bottom:16px">
      <div style="font-size:44px;margin-bottom:8px">🎁</div>
      <div style="font-size:14px;color:#eee;margin-bottom:6px">标准奖池</div>
      <div style="font-size:11px;color:#555">奖池准备中，敬请期待！</div>
    </div>
    <div style="display:flex;gap:10px;margin-bottom:14px">
      <div style="flex:1;padding:12px;font-size:12px;border:1px solid #2a2a4a;border-radius:6px;color:#444;cursor:not-allowed">
        抽 ×1<br><span style="font-size:9px;color:#333">100 金币</span>
      </div>
      <div style="flex:1;padding:12px;font-size:12px;border:1px solid #2a2a4a;border-radius:6px;color:#444;cursor:not-allowed">
        抽 ×10<br><span style="font-size:9px;color:#333">1000 金币</span>
      </div>
    </div>`,
`    <div style="background:rgba(255,200,100,0.05);border:1px solid #3a2a1a;border-radius:10px;padding:16px 14px;margin-bottom:10px">
      <div style="font-size:36px;margin-bottom:6px">🗡</div>
      <div style="font-size:14px;color:#f8a;margin-bottom:4px;font-weight:bold">飞剑奖池</div>
      <div style="font-size:10px;color:#888;margin-bottom:8px">单抽必出金币/补给/属性强化 · 100抽保底获得飞剑</div>
      <div id="gacha-pity-bar" style="background:#1a1a2a;border-radius:4px;height:6px;margin-bottom:4px;overflow:hidden">
        <div id="gacha-pity-fill" style="height:100%;background:linear-gradient(90deg,#f8a,#fd4);border-radius:4px;width:0%;transition:width .4s"></div>
      </div>
      <div id="gacha-pity-txt" style="font-size:9px;color:#666">保底进度: 0/100</div>
    </div>
    <div id="gacha-result-area" style="min-height:52px;margin-bottom:10px;display:flex;flex-wrap:wrap;gap:6px;justify-content:center;align-items:center"></div>
    <div style="display:flex;gap:10px;margin-bottom:14px">
      <button class="btn" id="btn-gacha-x1" style="flex:1;padding:10px;font-size:12px;border-color:#f8a;color:#f8a">
        抽 ×1<br><span style="font-size:9px;color:#888">100 金币</span>
      </button>
      <button class="btn" id="btn-gacha-x10" style="flex:1;padding:10px;font-size:12px;border-color:#fd4;color:#fd4">
        抽 ×10<br><span style="font-size:9px;color:#888">1000 金币</span>
      </button>
    </div>`,
'Gacha HTML: real pool UI'
);

// ═══════════════════════════════════════════════════════
// 11. Gacha JS: add after btn-gacha click handler
// ═══════════════════════════════════════════════════════
rep(
`document.getElementById('btn-gacha').addEventListener('click',()=>{
  document.getElementById('gacha-coins').textContent=getCoins();showOverlay('o-gacha');
});`,
`document.getElementById('btn-gacha').addEventListener('click',()=>{
  document.getElementById('gacha-coins').textContent=getCoins();
  updateGachaPityUI();
  showOverlay('o-gacha');
});

// ── Gacha system ──
function getGachaPity(){ try{ return Math.max(0,parseInt(localStorage.getItem('pw_gacha_pity')||'0',10)); }catch{ return 0; } }
function setGachaPity(n){ try{ localStorage.setItem('pw_gacha_pity',String(n)); }catch{} }
function hasGachaFlyingSword(){ try{ return localStorage.getItem('pw_gacha_fs')==='1'; }catch{ return false; } }
function setGachaFlyingSword(){ try{ localStorage.setItem('pw_gacha_fs','1'); }catch{} }

function updateGachaPityUI(){
  const p=getGachaPity();
  const hasSword=hasGachaFlyingSword();
  const pct=Math.min(100,p)*100/100;
  const fill=document.getElementById('gacha-pity-fill');
  const txt=document.getElementById('gacha-pity-txt');
  if(fill) fill.style.width=pct+'%';
  if(txt) txt.textContent = hasSword ? '保底进度: 已解锁飞剑 ✓' : '保底进度: '+p+'/100';
  document.getElementById('gacha-coins').textContent=getCoins();
}

const GACHA_POOL = [
  { w:35, icon:'🪙', name:'金币 ×50',   apply:()=>{ addCoins(50); return {rarity:'normal'}; } },
  { w:30, icon:'🪙', name:'金币 ×120',  apply:()=>{ addCoins(120); return {rarity:'normal'}; } },
  { w:12, icon:'❤',  name:'最大HP +20', apply:()=>{ if(gs?.player){ gs.player.maxHp+=20; healPlayer(20); } return {rarity:'rare'}; } },
  { w:10, icon:'💪', name:'伤害 +15%',  apply:()=>{ if(gs?.player){ gs.player.dmgMult=+((gs.player.dmgMult||1)*1.15).toFixed(4); } return {rarity:'rare'}; } },
  { w:8,  icon:'⏱',  name:'CD -10%',    apply:()=>{ if(gs?.player){ gs.player.cdMult=Math.max(0.2,+((gs.player.cdMult||1)*0.90).toFixed(4)); } return {rarity:'rare'}; } },
  { w:5,  icon:'🍀',  name:'幸运 +30',  apply:()=>{ if(gs?.player){ gs.player.luck=(gs.player.luck||0)+30; updateDerivedStats(gs.player); } return {rarity:'epic'}; } },
];

function gachaDraw(){
  let pity=getGachaPity();
  const hasSword=hasGachaFlyingSword();
  pity++;
  const isSwordPull = (!hasSword && pity>=100);
  setGachaPity(isSwordPull ? 0 : pity);

  if(isSwordPull){
    setGachaFlyingSword();
    if(gs?.phase==='playing'||gs?.phase==='paused'){
      addWeapon('flying_sword');
    }
    return { icon:'🗡', name:'飞剑', rarity:'legendary', msg:'飞剑已解锁！下局游戏可在抽奖前选择携带。' };
  }

  // Weighted random
  let total=GACHA_POOL.reduce((s,x)=>s+x.w,0);
  let r=Math.random()*total;
  for(const item of GACHA_POOL){
    r-=item.w;
    if(r<=0){ const res=item.apply(); return { icon:item.icon, name:item.name, rarity:res.rarity||'normal' }; }
  }
  const fb=GACHA_POOL[0]; fb.apply(); return { icon:fb.icon, name:fb.name, rarity:'normal' };
}

function doGacha(times){
  if(!spendCoins(times*100)){
    alert('金币不足！需要 '+(times*100)+' 金币');
    return;
  }
  const results=[];
  for(let i=0;i<times;i++) results.push(gachaDraw());
  const area=document.getElementById('gacha-result-area');
  if(area){
    const rarityCol={normal:'#888',rare:'#4af',epic:'#c8f',legendary:'#fd4'};
    area.innerHTML=results.map(r=>
      '<div style="background:rgba(255,255,255,0.05);border:1px solid '+(rarityCol[r.rarity]||'#555')+
      ';border-radius:6px;padding:6px 10px;text-align:center;font-size:11px;color:'+(rarityCol[r.rarity]||'#888')+'">'+
      '<div style="font-size:20px">'+r.icon+'</div><div>'+r.name+'</div></div>'
    ).join('');
    const leg=results.find(r=>r.rarity==='legendary');
    if(leg&&leg.msg) setTimeout(()=>alert(leg.msg),200);
  }
  updateGachaPityUI();
}

document.getElementById('btn-gacha-x1').addEventListener('click',()=>doGacha(1));
document.getElementById('btn-gacha-x10').addEventListener('click',()=>doGacha(10));`,
'Add gacha system JS'
);

// ═══════════════════════════════════════════════════════
// 12. Codex: update 天选者 + add 飞剑
// ═══════════════════════════════════════════════════════
rep(
`chosen:{icon:'👑',desc:'天选者，幸运+50，稀有道具和补给的出现频率大幅提升'},`,
`chosen:{icon:'⭐',desc:'天选者，初始幸运+20，每点幸运+1%伤害；技能「流星」秒杀非Boss，随幸运变大，CD50秒'},`,
'Codex: update 天选者'
);

rep(
`sword:{desc:'生成环绕轨道剑阵，自动打击周围所有敌人，无需瞄准'},`,
`sword:{desc:'生成环绕轨道剑阵，自动打击周围所有敌人，无需瞄准'},
      flying_sword:{desc:'[抽奖限定] 飞剑每2秒锁定最近敌人·4把起步·暴击×3·可叠加元素·8级万剑归宗'},`,
'Codex: add 飞剑'
);

// ═══════════════════════════════════════════════════════
// 13. Bump version + changelog
// ═══════════════════════════════════════════════════════
rep(
`const GAME_VERSION = 'v0.4.2';
document.getElementById('load-version').textContent = GAME_VERSION;
const CHANGELOG = [
  { version:'v0.4.2', date:'2026-04-04', items:[
    '聊天室左侧导航栏：可切换聊天室与私聊列表',
    '新增表情包面板（点击 😊 展开）',
    '聊天室禁言系统：累计发脏字1/2次警告，第3次禁言1分钟，之后依次升级，每天重置',
    '新增玩家等级系统（1-100级），打游戏获得经验，每升一级显示升级提示',
  ]},`,
`const GAME_VERSION = 'v0.4.3';
document.getElementById('load-version').textContent = GAME_VERSION;
const CHANGELOG = [
  { version:'v0.4.3', date:'2026-04-04', items:[
    '修复：初始角色展示画面错误显示西蒙·海耶图片',
    '修复：剑阵轨道球外观改为正确的剑形',
    '修复：导弹无人机现在落向最近的敌人而非玩家脚下',
    '新增：所有角色初始拾取距离统一为10',
    '天选者技能「天选之星」更名为「☄ 流星」：随幸运值变大秒杀非Boss，CD50秒',
    '天选者被动：每点幸运+1%伤害（初始幸运调整为+20）',
    '新增武器「飞剑」🗡：抽奖池限定，100抽保底获得',
    '飞剑：每2秒发射4把飞剑锁定最近敌人，50伤害，40%暴击×3倍',
    '飞剑升级树：2/3/5/6级选强化，4级选元素，7级选特殊效果，8级万剑归宗',
    '抽奖池正式开放：金币/属性强化/飞剑，100抽保底飞剑',
    '升级界面偶尔出现武器升级选项',
  ]},
  { version:'v0.4.2', date:'2026-04-04', items:[
    '西蒙·海耶（白色死神）角色图片更新为真实历史照片',
    '聊天室左侧导航栏：可切换聊天室与私聊列表',
    '新增表情包面板（点击 😊 展开）',
    '聊天室禁言系统：累计发脏字依次升级，每天重置',
    '新增玩家等级系统（1-100级），打游戏获得经验',
  ]},`,
'Bump to v0.4.3 + new changelog'
);

// ═══════════════════════════════════════════════════════
// Write back
// ═══════════════════════════════════════════════════════
fs.writeFileSync(HTML, html, 'utf8');
console.log('✓ index.html written');
console.log('Final size:', fs.statSync(HTML).size, 'bytes');
