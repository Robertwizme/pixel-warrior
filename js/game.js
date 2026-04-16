'use strict';

// ═══════════════════════════════════════════════════════
// §5  Game state + initGame
// ═══════════════════════════════════════════════════════
let settings = { particles:true, gameSpeed:1.0, sfx:true, lang:'zh' };
let gs   = null;
let cam  = { x:0, y:0 };
let selectedClassIdx = -1;
let lastClassIdx = 0;
let tutorialTimer = 5.0;

// ── Enemy sprite image overrides (preloaded) ──
const ENEMY_IMG_MAP = (function(){
  const _src = { slime:'photo/Slime.png', goblin:'photo/goblin.png', skeleton:'photo/Skeleton.png', bat:'photo/bat.png', orc:'photo/orc.png' };
  const _map = {};
  for (const k in _src) { const i=new Image(); i.src=_src[k]; _map[k]=i; }
  return _map;
})();

function initGame(classIdx) {
  const cls = CLASSES[classIdx];
  lastClassIdx = classIdx;
  cam = { x:-GW/2, y:-GH/2 };
  tutorialTimer = 5.0;
  // Weapon enhancement bonus applied at game start
  const _enhBonus = getTotalWeaponEnhBonus();
  if(_enhBonus > 0) setTimeout(()=>{ if(gs?.player) gs.player.weapEnhMult = 1+_enhBonus; },100);

  const p = {
    x:0, y:0,
    hp: cls.hp, maxHp: cls.hp,
    spd: cls.spd,
    dmgMult:  cls.dmgMult,
    areaMult: cls.areaMult,
    cdMult:   cls.cdMult,
    pickupR:  45,
    healAccum: 0,
    berserkTimer: 0, berserkActive: false,
    sharpenTimer: 0, sharpenActive: false,
    manaTimer: 0, manaActive: false,
    reaperChanneling: false, reaperChannel: 0,
    physDmgMult: 1.0,
    magicDmgMult: 1.0,
    gunDmgMult: 1.0,
    reaperGunMult: 1.0,
    pickedStatIds: new Set(),
    kirbyForm: null,
    santaAtkTimer: 0,
    santaCdTimer: 0,
    santaHealTimer: 0,
    critRate: 0,
    critDmgMult: 1.5,
    lastMoveAngle: null,
    invincible: 0,
    invincMult: 1,
    classIdx: classIdx,
    // Stats
    luck:        0,   // 只影响掉落率和稀有度，无上限
    baseDodge:   0,   // 闪避：来自升级/天赋，上限60%
    baseDmgRed:  0,   // 减伤：来自升级/天赋，上限60%
    // Talent flags
    multishotBonus: 0,
    chainBonus:     0,
    berserkerKills: 0,
    dodgeChance:    0,
    dmgReduction:   0,
    // Magnet timer
    magnetTimer: 0,
    berserkerMutBonus: 0,
    // Supply upgrades
    hasWaveShield: false, waveShieldUp: false,
    hasGhostShadow: false, ghostTimer: 0,
    hasMines: false,
    hasIceArmor: false,
    hasOverload: false, overloadKills: 0, overloadTimer: 0, overloadActive: false,
    // Level / XP
    level: 1,
    xp: 0,
    xpToNext: 100,
    hpRegen: 0,
    levelUpQueue: 0,
    xpMult: 1.0,
    skillCd: 0, skillKeyHeld: false,
  };

  // Apply class bonus
  cls.bonus(p);
  // Apply pending mail rewards
  try {
    const pending = JSON.parse(localStorage.getItem('pw_pending_rewards')||'[]');
    pending.forEach(r => {
      if (r.type === 'luck')  p.luck  = (p.luck||0)  + (r.value||0);
      if (r.type === 'maxhp') { p.maxHp += (r.value||0); p.hp += (r.value||0); }
    });
    if (pending.length) {
      localStorage.removeItem('pw_pending_rewards');
      addFloatingText?.('📬 邮件奖励已生效!', 0, -30, '#4ef', 2.0);
    }
  } catch(e){}
  // Recompute derived stats
  updateDerivedStats(p);

  gs = {
    phase: 'playing',
    player: p,
    weapons: [],
    enemies: [],
    projectiles: [],
    gems: [],
    drops: [],       // ground drop items
    particles: [],
    lightningBolts: [],
    swordOrbs: [],
    floatingTexts: [],
    healCircles: [],
    pendingExplosions: [],
    smokeClouds: [],
    santaGifts: [],
    fallingGifts: [],
    spawnWarnings: [],
    waveAnnounce: { text:'', timer:0 },
    chestPopup: null,
    pickedSupplyIds: new Set(),
    ghosts: [],
    mines: [],
    turrets: [],
    healTurrets: [],
    kamikazeBots: [],
    minigunTurrets: [],
    kills: 0,
    score: 0,
    talents: new Set(),
    wave: { num:0, total:0, spawnQueue:[], spawnTimer:0, spawning:false, timer:0 },
    weaponRefreshes: 5,
    stage: 1,
    _damageTaken: 0,
    _rainbowChests: 0,
  };

  waveCompleteTriggered = false;
  // Auto-add flying sword if unlocked via gacha
  if (hasGachaFlyingSword()) addWeapon('flying_sword');
  // Ensure turret HUD element exists
  _ensureTurretHud();
  // Show correct skill in HUD immediately
  updateHUD();

  // If weapons are defined → show weapon selection before wave 1
  // If no weapons defined → start wave 1 directly
  if (Object.keys(WEAPON_DEFS).length > 0) {
    gs.phase = 'upgrading';
    showStartWeaponScreen();
  } else {
    startWave(1);
  }
}

function updateDerivedStats(p) {
  p.dodgeChance  = Math.min(0.6, p.baseDodge);
  p.dmgReduction = Math.min(0.6, p.baseDmgRed);
  // 天选者: 每点幸运+1%伤害
  p.chosenLuckDmgMult = (CLASSES[p.classIdx]?.id === 'chosen') ? 1.0 + (p.luck||0)*0.01 : 1.0;
}

// ═══════════════════════════════════════════════════════
// §6  Weapon helpers
// ═══════════════════════════════════════════════════════
function castChosenStar(p) {
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
}


function getAreaMult(p) {
  return p.areaMult * ((CLASSES[p.classIdx]?.id === 'mage' && p.manaActive) ? 1.3 : 1);
}

const REAPER_CHANNEL_TIME = 7.49;

function castReaperSnipe(p) {
  if (gs.enemies.filter(e=>!e.dead).length === 0) return;
  p.skillCd = 542;
  p.reaperChanneling = true;
  p.reaperChannel = 0;
  if (settings.particles)
    spawnParticles(p.x, p.y, ['#fff','#ddd','#aaa'], 12, 70, 0.7, 3);
  addFloatingText('🎯 瞄准中…', p.x, p.y - 15, '#fff', 1.2);
}

const KIRBY_FORMS = ['fire','sword','thunder','ice'];

function castKirbyCopy(p) {
  // Find nearest non-boss enemy to swallow
  let best = null, bestD = Infinity;
  for (const e of gs.enemies) {
    if (e.dead || e.isBoss) continue;
    const d = (e.x-p.x)**2 + (e.y-p.y)**2;
    if (d < bestD) { bestD=d; best=e; }
  }
  if (!best) return; // no valid target

  p.skillCd = 120;

  // Swallow
  if (settings.particles)
    spawnParticles(best.x, best.y, ['#fd4','#f84','#fff'], 18, 100, 0.8, 4);
  killEnemy(best);

  // Pick random form (avoid repeating current)
  const kirbyW = getWeapon('kirby_copy') || (() => { addWeapon('kirby_copy'); return getWeapon('kirby_copy'); })();
  const available = KIRBY_FORMS.filter(f => f !== (kirbyW?.kirbyForm));
  const newForm = available[Math.floor(Math.random()*available.length)];
  if (kirbyW) kirbyW.kirbyForm = newForm;
  p.kirbyForm = newForm;

  const formColors = {fire:['#f64','#f84','#fd4'], sword:['#fd4','#fff','#ff8'], thunder:['#88f','#4af','#fff'], ice:['#aff','#4ef','#fff']};
  const formNames  = {fire:'🔥 火焰能力!', sword:'⚔ 剑士能力!', thunder:'⚡ 雷电能力!', ice:'❄ 冰冻能力!'};
  if (settings.particles) spawnParticles(p.x, p.y, formColors[newForm]||['#fff'], 30, 130, 1.0, 5);
  addFloatingText(formNames[newForm]||'复制!', p.x, p.y-15, '#fd4', 1.5);
}

function castSantaGift(p) {
  p.skillCd = 60;
  const types = ['red','blue','green'];
  const count = 5 + Math.floor(Math.random()*4); // 5–8 gifts
  for (let i = 0; i < count; i++) {
    const type = Math.random() < 0.04 ? 'rainbow' : types[Math.floor(Math.random()*3)];
    const ang = Math.random()*Math.PI*2, dist = 40 + Math.random()*180;
    const gx = Math.max(-WORLD_W/2+15, Math.min(WORLD_W/2-15, p.x + Math.cos(ang)*dist));
    const gy = Math.max(-WORLD_H/2+15, Math.min(WORLD_H/2-15, p.y + Math.sin(ang)*dist));
    gs.santaGifts.push({ x:gx, y:gy, type, timer:20, bobTimer:Math.random()*Math.PI*2 });
  }
  if (settings.particles)
    spawnParticles(p.x, p.y, ['#f44','#4f6','#4af','#fd4','#fff'], 20, 110, 0.9, 4);
  addFloatingText('🎁 礼物!', p.x, p.y-18, '#fd4', 1.5);
}

function updateSantaGifts(dt) {
  const p = gs.player;
  const clsId = CLASSES[p.classIdx]?.id;
  // Tick buff timers
  if (p.santaAtkTimer > 0) p.santaAtkTimer = Math.max(0, p.santaAtkTimer - dt);
  if (p.santaCdTimer  > 0) p.santaCdTimer  = Math.max(0, p.santaCdTimer  - dt);
  if (p.santaHealTimer > 0) {
    healPlayer(p.maxHp * (0.25/10) * dt); // 25% HP over 10s
    p.santaHealTimer = Math.max(0, p.santaHealTimer - dt);
  }
  if (clsId !== 'santa') return;
  const pr2 = p.pickupR * p.pickupR;
  gs.santaGifts = gs.santaGifts.filter(gift => {
    gift.timer -= dt;
    if (gift.timer <= 0) return false;
    const dx = gift.x-p.x, dy = gift.y-p.y;
    if (dx*dx+dy*dy < pr2) {
      if (gift.type === 'red') {
        p.santaAtkTimer = 10;
        addFloatingText('🎁+25%攻', p.x, p.y-16, '#f55', 1.2);
        if (settings.particles) spawnParticles(p.x, p.y, ['#f44','#f84'], 10, 75, 0.5, 3);
      } else if (gift.type === 'blue') {
        p.santaCdTimer = 10;
        addFloatingText('🎁CD-25%', p.x, p.y-16, '#4af', 1.2);
        if (settings.particles) spawnParticles(p.x, p.y, ['#4af','#48f'], 10, 75, 0.5, 3);
      } else if (gift.type === 'green') {
        p.santaHealTimer = 10;
        addFloatingText('🎁持续回血', p.x, p.y-16, '#4f6', 1.2);
        if (settings.particles) spawnParticles(p.x, p.y, ['#4f6','#2fa'], 10, 75, 0.5, 3);
      } else if (gift.type === 'rainbow') {
        autoApplyChest('supply_rainbow');
        addFloatingText('🌈彩虹大礼!', p.x, p.y-18, '#fd4', 1.8);
      }
      return false;
    }
    return true;
  });
}

function updateFallingGifts(dt) {
  gs.fallingGifts = gs.fallingGifts.filter(fg => {
    fg.fallTimer += dt;
    if (fg.fallTimer >= fg.totalTime) {
      const r2 = fg.radius * fg.radius;
      gs.enemies.forEach(e => {
        if (e.dead || e.isBoss) return;
        const dx=e.x-fg.x, dy=e.y-fg.y;
        if (dx*dx+dy*dy < r2) killEnemy(e);
      });
      if (settings.particles)
        spawnParticles(fg.x, fg.y, ['#f44','#4f6','#4af','#fd4','#fff'], 22, 130, 0.9, 5);
      addFloatingText('🎁 砸!', fg.x, fg.y-12, '#fd4', 1.1);
      return false;
    }
    return true;
  });
}

function updateKirbyWeapon(dt) {
  const w = getWeapon('kirby_copy');
  if (!w || !w.kirbyForm) return;
  const p = gs.player;
  const def = WEAPON_DEFS.kirby_copy;
  const stats = def.levels[Math.min(p.level-1, def.levels.length-1)];

  // ── 火焰形态: fire backward every 0.65s ──
  if (w.kirbyForm === 'fire') {
    w.timer = (w.timer||0) - dt;
    if (w.timer <= 0) {
      w.timer = 0.65 * p.cdMult * ((p.santaCdTimer||0) > 0 ? 0.75 : 1);
      const ang = (p.lastMoveAngle != null ? p.lastMoveAngle : -Math.PI/2) + Math.PI;
      for (let i=0; i<3; i++) {
        const a = ang + (Math.random()-0.5)*0.45;
        gs.projectiles.push({
          x:p.x, y:p.y, vx:Math.cos(a)*170, vy:Math.sin(a)*170,
          dmg:stats.fireDmg, radius:5, color:'#f64', life:0.55,
          type:'bullet', element:'flame', pierce:false,
        });
      }
    }
  }

  // ── 剑士形态: 2 orbiting swords ──
  if (w.kirbyForm === 'sword') {
    w.swordAngle = (w.swordAngle||0) + dt * stats.rotSpeed;
    const r = stats.orbRadius;
    for (let i=0; i<2; i++) {
      const a = w.swordAngle + (i/2)*Math.PI*2;
      const ox=p.x+Math.cos(a)*r, oy=p.y+Math.sin(a)*r;
      gs.swordOrbs.push({ x:ox, y:oy, color:'#fd4', isBook:false });
      for (let ei=0; ei<gs.enemies.length; ei++) {
        const e = gs.enemies[ei];
        if (e.dead) continue;
        const dx=ox-e.x, dy=oy-e.y;
        if (dx*dx+dy*dy < (8+e.radius)**2) {
          const key=`kirby_sw_${i}_${ei}`;
          if (!w.swordHitTimers) w.swordHitTimers={};
          if (!(w.swordHitTimers[key]>0)) {
            hitEnemy(e, stats.swordDmg, false, false, 'phys');
            w.swordHitTimers[key]=0.4;
          }
        }
      }
    }
    if (w.swordHitTimers) for (const k in w.swordHitTimers) w.swordHitTimers[k]-=dt;
  }
}

function updateSniperEffects(dt) {
  const sw = getWeapon('sniper');
  if (sw?.tacticalSniper) {
    sw.smokeTimer = (sw.smokeTimer||20) - dt;
    if (sw.smokeTimer <= 0) {
      sw.smokeTimer = 20;
      const p = gs.player;
      const ang = Math.random() * Math.PI * 2;
      const dist = 60 + Math.random() * 80;
      const gx = p.x + Math.cos(ang)*dist;
      const gy = p.y + Math.sin(ang)*dist;
      gs.smokeClouds = gs.smokeClouds || [];
      gs.smokeClouds.push({ x:gx, y:gy, radius:55, delayTimer:1.0, phase:'delay' });
    }
  }
  // Update smoke clouds
  gs.smokeClouds = (gs.smokeClouds||[]).filter(sc => {
    if (sc.phase === 'delay') {
      sc.delayTimer -= dt;
      if (sc.delayTimer <= 0) sc.phase = 'active';
      return true;
    }
    sc.timer = (sc.timer||5.0) - dt;
    return sc.timer > 0;
  });
}

function castScholarVacuum(p) {
  p.skillCd = 50;
  let total = 0;
  gs.gems = gs.gems.filter(g => { total += g.xp; awardXp(g.xp); return false; });
  if (settings.particles)
    spawnParticles(p.x, p.y, ['#4ef','#0dd','#8ff','#fff'], 28, 115, 1.0, 4);
  if (total > 0) addFloatingText(`+${total}XP`, p.x, p.y - 15, '#4ef', 1.5);
}

function castMageSurge(p) {
  p.skillCd = 45;
  p.manaTimer = 10;
  p.manaActive = true;
  if (settings.particles)
    spawnParticles(p.x, p.y, ['#a4f','#c4f','#f4f','#88f','#fff'], 30, 120, 1.0, 4);
  addFloatingText('✨ 法力无天!', p.x, p.y - 15, '#c4f', 1.5);
}

function castBlacksmithSharpen(p) {
  p.skillCd = 50;
  p.sharpenTimer = 10;
  p.sharpenActive = true;
  if (settings.particles)
    spawnParticles(p.x, p.y, ['#f84','#fd4','#fa4','#fff'], 28, 110, 0.9, 4);
  addFloatingText('⚒ 临阵磨枪!', p.x, p.y - 15, '#fd4', 1.5);
}

function castBerserkerRage(p) {
  p.skillCd = 50;
  p.berserkTimer = 20;
  p.berserkActive = true;
  if (settings.particles)
    spawnParticles(p.x, p.y, ['#f44','#f84','#fd4','#fff'], 35, 130, 1.2, 5);
  addFloatingText('⚡ 狂暴!', p.x, p.y - 15, '#f44', 1.5);
}

function castDoctorHeal(p) {
  p.skillCd = 30;
  healPlayer(100);
  if (settings.particles)
    spawnParticles(p.x, p.y, ['#4f4', '#8f8', '#aff', '#fff'], 22, 90, 0.8, 3);
  addFloatingText('+100', p.x, p.y - 12, '#4f4', 1.2);
}

function addFloatingText(text, x, y, color, duration) {
  gs.floatingTexts.push({ text, x, y, color: color||'#fff', timer: duration||1.2, maxTimer: duration||1.2, vy: -28 });
}

function addWeapon(id) {
  if (!WEAPON_DEFS[id]) return;
  const w = { id, level:1, timer:0, angle:0, swordHitTimers:{}, shotTimer:0,
    variant:null, variantMods:[], bulletEffect:null, element:null, extraGun:false,
    burstCount:0, burstPhase:'rest',
    healMult:1, rangeMult:1, cdMultLocal:1, follows:false };
  if (id === 'turret') {
    w.rapidFireCount    = 0; // 速射 picks (each ×1.25 fire rate)
    w.extraTurrets      = 0; // 多重建造 picks (each +1 cap)
    w.ammoLevel         = 0; // 0=bullet 1=laser 2=bomb 3=rocket
    w.specialType       = null; // 'heal'|'kamikaze'|'minigun' (set at Lv4)
    w.specialCount      = 1; // how many special units to spawn per wave
    w.defenceTurretMode = false; // Lv7: enemies prefer turrets; turrets have 1 death shield
    w.elementTurretMode = false; // Lv7: bullets randomly apply flame/frost/poison
    w.mineTurretMode    = false; // Lv8: turrets leave a mine on death
    w._specialNeedsSpawn = false;
    w._lastLevel        = 1;
    w._nextUpgrade      = _rollTurretUpgrade(w);
    w._respawnQueue     = []; // mid-wave respawn timers (each = seconds remaining)
    _ensureTurretHud();
  }
  gs.weapons.push(w);
}
function getWeapon(id)     { return gs.weapons.find(w=>w.id===id); }
function weaponStats(w)    { return WEAPON_DEFS[w.id].levels[w.level-1]; }

function triggerMonsterSurge() {
  gs.wave.surgeTriggered = true;
  const wn = gs.wave.num, p = gs.player;
  const surgeN = Math.min(Math.floor(4 + wn * 1.5), 24);
  const plan = getWavePlan(wn);
  const aTypes = plan.map(e=>e.type).filter(t=>{ const d=ENEMY_TYPES[t]; return d&&!d.isBoss; });
  const sf = Math.pow(1.15, wn-1);
  for (let i=0; i<surgeN; i++) {
    const ang = (i/surgeN)*Math.PI*2;
    const dist = 240+Math.random()*80;
    const ex = Math.max(-WORLD_W/2,Math.min(WORLD_W/2, p.x+Math.cos(ang)*dist));
    const ey = Math.max(-WORLD_H/2,Math.min(WORLD_H/2, p.y+Math.sin(ang)*dist));
    const eType = aTypes[i%(aTypes.length||1)]||'slime';
    const def = ENEMY_TYPES[eType]; if(!def) continue;
    gs.enemies.push({
      type:eType,name:'',x:ex,y:ey,
      hp:Math.round(def.hp*sf*1.3),maxHp:Math.round(def.hp*sf*1.3),
      spd:def.spd*1.4,dmg:Math.round(def.dmg*sf),
      xp:Math.round(def.xp*Math.sqrt(sf)),
      radius:def.radius,sprite:def.sprite,color:'#f84',
      scale:def.scale,isBoss:false,bossType:null,dead:false,
      attackTimer:0,slowTimer:0,stunStacks:0,stunTimer:0,
      flameStacks:0,flameTick:0,frostStacks:0,frozenTimer:0,
      poisonStacks:0,poisonTick:0,paralysisStacks:0,paralysisTimer:3,
    });
  }
  gs.wave.total += surgeN;
  if(typeof addFloatingText==='function') addFloatingText('⚠ 怪物潮来袭！',p.x,p.y-50,'#f84',3.0);
  updateHUD();
}
function startWave(num) {
  gs.wave.num = num;
  const isBoss = BOSS_WAVES.has(num);
  const plan = getWavePlan(num);
  const _stage = gs.stage || 1;
  const stageMult = Math.pow(1.5, _stage-1);
  const sf = isBoss ? 1 : Math.pow(1.15, num-1) * stageMult;
  const countMult = isBoss ? 1 : (1 + (num-1)*0.06) * Math.pow(1.12, _stage-1);
  const queue = [];
  plan.forEach(entry => {
    const cnt = Math.round(entry.count * countMult);
    for (let i=0; i<cnt; i++) queue.push({ type:entry.type, scale:sf, waveNum:num });
  });
  // Shuffle
  for (let i=queue.length-1; i>0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [queue[i],queue[j]] = [queue[j],queue[i]];
  }
  // Enforce minimum enemy counts per wave tier
  if (!isBoss) {
    const _minCount = num <= 5 ? 10 : num <= 15 ? 20 : 30;
    while (queue.length < _minCount) {
      const _et = plan[Math.floor(Math.random()*plan.length)];
      if (_et && !(_et.type.startsWith('boss'))) queue.push({ type:_et.type, scale:sf, waveNum:num });
      else break;
    }
  }
  // Boss waves: add 4-8 escort minions
  if (isBoss) {
    const _escortMap = { 10:['orc','wolf'], 20:['demon','troll'], 30:['demon','troll'] };
    const _eTypes = _escortMap[num] || ['orc'];
    const _eCount = 4 + Math.floor(Math.random()*5);
    for (let i=0; i<_eCount; i++) {
      const _et = _eTypes[Math.floor(Math.random()*_eTypes.length)];
      queue.push({ type:_et, scale:Math.pow(1.15, num-1), waveNum:num });
    }
  }
  gs.wave.total    = queue.length;
  gs.wave.spawnQueue = queue;
  gs.wave.spawnTimer = 0;
  gs.wave.spawning   = true;
  gs.wave.timer      = 0;
  gs.wave.surgeTriggered = false;
  gs.wave.killsThisWave  = 0;
  gs.enemies      = [];
  gs.projectiles  = [];
  gs.healCircles  = [];
  gs.spawnWarnings = [];
  gs.ghosts = [];
  // Wave shield: refresh one block per wave
  if (gs.player.hasWaveShield) { gs.player.waveShieldUp = true; addFloatingText('🔰', gs.player.x, gs.player.y-20, '#7ef', 0.8); }
  // Land mines: spawn 3 at random positions around player
  if (gs.player.hasMines) {
    gs.mines = [];
    for (let _i=0; _i<3; _i++) {
      const _a=Math.random()*Math.PI*2, _d=160+Math.random()*280;
      gs.mines.push({x:gs.player.x+Math.cos(_a)*_d, y:gs.player.y+Math.sin(_a)*_d});
    }
  }
  // Turrets: apply any pending level-up first, then refresh positions each wave
  const _turretW = gs.weapons.find(w => w.id === 'turret');
  gs.healTurrets = []; gs.kamikazeBots = []; gs.minigunTurrets = [];
  if (_turretW) {
    if (_turretW._lastLevel !== undefined && _turretW.level !== _turretW._lastLevel) {
      _applyTurretLevelUp(_turretW);
      _turretW._lastLevel = _turretW.level;
    }
    _turretW._specialNeedsSpawn = false; // startWave handles the spawn below
    _turretW._respawnQueue = [];         // clear mid-wave respawn queue on new wave
    gs.turrets = _spawnTurrets(_turretW, gs.player);
    if (_turretW.specialType) _spawnSpecialTurrets(_turretW, gs.player);
  } else {
    gs.turrets = [];
  }
  // Wave announcement
  if (isBoss) {
    gs.waveAnnounce = { text:'☠ BOSS來了！', timer:1.5 };
  } else if (num % 5 === 0) {
    gs.waveAnnounce = { text:'⚠ 一大波敵人即將來袭！', timer:1.5 };
  } else if (num <= 4) {
    gs.waveAnnounce = { text:'敵人來襲！', timer:1.5 };
  } else {
    gs.waveAnnounce = { text:'敵人來襲！', timer:1.5 };
  }
  updateHUD();
}

// ═══════════════════════════════════════════════════════
// §7  Spawn / hit / heal / particles
// ═══════════════════════════════════════════════════════
function calcSpawnPos() {
  const margin = 50;
  let ex, ey;
  const edge = Math.floor(Math.random()*4);
  if      (edge===0){ ex=cam.x-margin+Math.random()*(GW+margin*2); ey=cam.y-margin; }
  else if (edge===1){ ex=cam.x-margin+Math.random()*(GW+margin*2); ey=cam.y+GH+margin; }
  else if (edge===2){ ex=cam.x-margin;      ey=cam.y-margin+Math.random()*(GH+margin*2); }
  else              { ex=cam.x+GW+margin;   ey=cam.y-margin+Math.random()*(GH+margin*2); }
  ex = Math.max(-WORLD_W/2, Math.min(WORLD_W/2, ex));
  ey = Math.max(-WORLD_H/2, Math.min(WORLD_H/2, ey));
  return { ex, ey };
}

function spawnEnemyAt(entry, ex, ey) {
  const def = ENEMY_TYPES[entry.type];
  if (!def) return;
  const sf = entry.scale;
  gs.enemies.push({
    type: entry.type,
    name: def.bossName || '',
    x:ex, y:ey,
    hp: Math.round(def.hp*sf), maxHp: Math.round(def.hp*sf),
    spd: def.spd,
    dmg: Math.round(def.dmg*sf),
    xp:  Math.round(def.xp * Math.sqrt(sf)),
    radius: def.radius,
    sprite: def.sprite,
    color:  def.color,
    scale:  def.isBoss ? def.scale : def.scale,
    isBoss: !!def.isBoss,
    bossType: def.bossType || null,
    dead:   false,
    attackTimer: 0,
    slowTimer:   0,
    stunStacks: 0, stunTimer: 0,
    flameStacks: 0, flameTick: 0,
    frostStacks: 0, frozenTimer: 0,
    poisonStacks: 0, poisonTick: 0,
    paralysisStacks: 0, paralysisTimer: 3,
  });
}

function spawnNextEnemy() {
  if (!gs.wave.spawnQueue.length) return;
  const entry = gs.wave.spawnQueue.shift();
  const { ex, ey } = calcSpawnPos();
  spawnEnemyAt(entry, ex, ey);
}

function hitEnemy(enemy, rawDmg, _noProc, _isCrit, wepCat) {
  if (enemy.dead) return;
  const p = gs.player;
  let mult = p.dmgMult;
  if (gs.talents.has('death_wish') && p.hp < p.maxHp*0.25) mult *= 3;
  if (gs.talents.has('berserker'))  mult *= (1 + p.berserkerKills*0.003);
  if (CLASSES[p.classIdx]?.id === 'berserker' && p.berserkActive) mult *= 2;
  if (wepCat === 'phys'  && (p.physDmgMult||1) !== 1) mult *= p.physDmgMult;
  if (wepCat === 'magic' && (p.magicDmgMult||1) !== 1) mult *= p.magicDmgMult;
  if (wepCat === 'gun'   && (p.gunDmgMult||1)   !== 1) mult *= p.gunDmgMult;
  if (wepCat === 'gun'   && (p.reaperGunMult||1) !== 1) mult *= p.reaperGunMult;
  if ((p.santaAtkTimer||0) > 0) mult *= 1.25;
  if ((p.chosenLuckDmgMult||1) > 1) mult *= p.chosenLuckDmgMult;
  if ((p.weapEnhMult||1) > 1) mult *= p.weapEnhMult;
  if (p.overloadActive) mult *= 2;
  // Kirby thunder/ice procs
  if (!_noProc && CLASSES[p.classIdx]?.id === 'kirby') {
    const kirbyW = getWeapon('kirby_copy');
    if (kirbyW) {
      const procChance = p.level * 0.01;
      if (kirbyW.kirbyForm === 'thunder' && Math.random() < procChance) {
        const ldmg = Math.round(p.level * 6);
        gs.enemies.forEach(ne => {
          if (ne.dead) return;
          const dx2=ne.x-enemy.x, dy2=ne.y-enemy.y;
          if (dx2*dx2+dy2*dy2 < 80*80) {
            hitEnemy(ne, ldmg, true);
            ne.paralysisStacks = Math.min(10,(ne.paralysisStacks||0)+1);
          }
        });
        enemy.paralysisStacks = Math.min(10,(enemy.paralysisStacks||0)+1);
        if (settings.particles) spawnParticles(enemy.x,enemy.y,['#88f','#4af','#fff'],8,80,0.4,3);
      }
      if (kirbyW.kirbyForm === 'ice' && Math.random() < procChance) {
        enemy.frostStacks = Math.min(10,(enemy.frostStacks||0)+1);
      }
    }
  }
  // Santa passive: 0.5% chance to drop giant falling gift on nearest enemy
  if (!_noProc && CLASSES[p.classIdx]?.id === 'santa' && Math.random() < 0.005) {
    const tgt = nearestEnemy(p.x, p.y);
    const fx = tgt ? tgt.x + (Math.random()-0.5)*30 : p.x + (Math.random()-0.5)*80;
    const fy = tgt ? tgt.y + (Math.random()-0.5)*30 : p.y + (Math.random()-0.5)*80;
    gs.fallingGifts.push({ x:fx, y:fy, fallTimer:0, totalTime:0.8, radius:40 });
  }
  const dmg = rawDmg * mult;
  enemy.hp -= dmg;
  if (dmg > 0) {
    const _isCritFinal = _isCrit || false;
    const _dc = _isCritFinal ? '#fd4' : (dmg >= 300 ? '#f88' : '#fff');
    const _txt = _isCritFinal ? '★' + String(Math.round(dmg)) : String(Math.round(dmg));
    const _ox = (Math.random()-0.5)*14;
    addFloatingText(_txt, enemy.x+_ox, enemy.y-10, _dc, _isCritFinal ? 0.85 : 0.65);
  }
  if (gs.talents.has('vampire') && dmg>0) healPlayer(dmg*0.06);
  if (settings.particles) spawnParticles(enemy.x, enemy.y, '#f84', 4, 80, 0.3, 2);
  if (enemy.hp<=0) killEnemy(enemy);
}

function killEnemy(enemy) {
  enemy.dead = true;
  gs.kills++;
  gs.wave.killsThisWave = (gs.wave.killsThisWave||0)+1;
  if (!gs.wave.surgeTriggered && !BOSS_WAVES.has(gs.wave.num) && gs.wave.killsThisWave >= Math.floor(gs.wave.total*0.5) && gs.wave.total>3) triggerMonsterSurge();
  gs.score += Math.floor(enemy.xp * (1 + gs.player.luck*0.002));
  // Growing sniper: track kill count
  const sw = getWeapon('sniper');
  if (sw?.growingSniper) {
    sw.growingKillCount = (sw.growingKillCount||0) + 1;
    if (sw.growingKillCount >= 20) { sw.growingKillCount -= 20; sw.growingBonus = (sw.growingBonus||0) + 1; }
  }
  gs.gems.push({ x:enemy.x, y:enemy.y, xp:enemy.xp });
  SFX.play(enemy.isBoss ? 'wave' : 'death');
  if (gs.talents.has('berserker')) gs.player.berserkerKills++;
  // Overload: count kills, trigger burst every 50
  const _op = gs.player;
  if (_op.hasOverload && !_op.overloadActive) {
    _op.overloadKills = (_op.overloadKills||0) + 1;
    if (_op.overloadKills >= 50) {
      _op.overloadKills = 0; _op.overloadActive = true; _op.overloadTimer = 3.0;
      addFloatingText('⚡ 过载！', _op.x, _op.y-32, '#ff0', 2.0);
      if (settings.particles) spawnParticles(_op.x, _op.y, ['#ff0','#f80','#fff'], 14, 110, 0.7, 4);
    }
  }
  if (settings.particles) {
    const cols = enemy.isBoss ? ['#f44','#fd4','#f84','#fff'] : [enemy.color,'#fd4'];
    spawnParticles(enemy.x, enemy.y, cols, enemy.isBoss?24:8, enemy.isBoss?140:80,
      enemy.isBoss?1.1:0.7, enemy.isBoss?4:2);
  }
  // Boss always drops a purple supply; others roll normally
  if (enemy.isBoss) {
    spawnDrop(enemy.x, enemy.y, 'supply_purple');
  } else {
    tryDrop(enemy.x, enemy.y);
  }
  checkAchievements();
  updateHUD();
}

// ── Drop system ────────────────────────────────────────
// 掉落率：基础10% + 幸运*0.08%（每100点幸运+8%）
function dropChance(luck) {
  return Math.min(0.60, 0.10 + luck * 0.0008);
}

// 补给稀有度权重（幸运提升紫色/彩色概率）
function supplyRarityWeights(luck) {
  const lb = luck * 0.002;         // luck bonus
  const green   = Math.max(0.08, 0.60 - lb * 2);
  const blue    = Math.max(0.08, 0.25 - lb * 0.5);
  const purple  = Math.min(0.50, 0.12 + lb);
  const rainbow = Math.min(0.30, 0.03 + lb * 0.5);
  const total = green + blue + purple + rainbow;
  return { green:green/total, blue:blue/total, purple:purple/total, rainbow:rainbow/total };
}

function pickRarity(luck) {
  const w = supplyRarityWeights(luck);
  const r = Math.random();
  if (r < w.rainbow) return 'supply_rainbow';
  if (r < w.rainbow + w.purple) return 'supply_purple';
  if (r < w.rainbow + w.purple + w.blue) return 'supply_blue';
  return 'supply_green';
}

// 掉落物定义
const DROP_DEFS = {
  health:         { label:'血包',   color:'#e33', border:'#f88', size:14, instant:true,  shape:'diamond' },
  bomb_item:      { label:'炸弹',   color:'#333', border:'#888', size:12, instant:true,  shape:'circle'  },
  xp_bottle:      { label:'经验瓶', color:'#0dd', border:'#8ff', size:10, instant:true,  shape:'star'    },
  magnet:         { label:'磁铁',   color:'#f60', border:'#fca', size:12, instant:true,  shape:'rect'    },
  supply_green:   { label:'绿宝箱', color:'#2a4', border:'#4f4', size:14, rarity:'green',   cards:1, shape:'chest' },
  supply_blue:    { label:'蓝宝箱', color:'#148', border:'#48f', size:16, rarity:'blue',    cards:2, shape:'chest' },
  supply_purple:  { label:'紫宝箱', color:'#52a', border:'#c4f', size:18, rarity:'purple',  cards:3, shape:'chest' },
  supply_rainbow: { label:'彩虹宝箱', color:'#a81', border:'#fd4', size:20, rarity:'rainbow', cards:3, shape:'chest' },
};

// 掉落类型权重（与稀有度无关）
const DROP_TYPE_POOL = [
  { type:'health',    w:28 },
  { type:'bomb_item', w:10 },
  { type:'xp_bottle', w:22 },
  { type:'magnet',    w:8  },
  { type:'supply',    w:32 },
];

function pickDropType() {
  const total = DROP_TYPE_POOL.reduce((s,e)=>s+e.w, 0);
  let r = Math.random() * total;
  for (const e of DROP_TYPE_POOL) { r-=e.w; if (r<=0) return e.type; }
  return 'health';
}

function tryDrop(x, y) {
  if (Math.random() > dropChance(gs.player.luck)) return;
  let type = pickDropType();
  if (type === 'supply') type = pickRarity(gs.player.luck);
  spawnDrop(x, y, type);
}

function spawnDrop(x, y, type) {
  // Scatter slightly
  gs.drops.push({
    type, x: x + (Math.random()-.5)*20, y: y + (Math.random()-.5)*20,
    bobTimer: Math.random()*Math.PI*2,  // for bob animation
  });
}

// ── Chest auto-apply stat bonuses ──
const CHEST_STAT_POOL = [
  { id:'maxhp',  icon:'❤', name:'+20 最大HP',      apply:p=>{p.maxHp+=20; healPlayer(20);} },
  { id:'dmg10',  icon:'⚔', name:'+10% 伤害',       apply:p=>{p.dmgMult=+(p.dmgMult*1.10).toFixed(4);} },
  { id:'spd7',   icon:'💨', name:'+7 移速',          apply:p=>{p.spd+=7;} },
  { id:'luck5',  icon:'🍀', name:'+5 幸运',         apply:p=>{p.luck+=5;} },
  { id:'dodge',  icon:'🌀', name:'+4% 闪避',        apply:p=>{p.baseDodge=Math.min(0.6,p.baseDodge+0.04);} },
  { id:'armor',  icon:'🛡', name:'+4% 减伤',        apply:p=>{p.baseDmgRed=Math.min(0.6,p.baseDmgRed+0.04);} },
  { id:'regen',  icon:'💖', name:'+2 HP回复/s',    apply:p=>{p.hpRegen+=2;} },
  { id:'pickup', icon:'🧲', name:'+25 拾取范围',    apply:p=>{p.pickupR+=25;} },
  { id:'crit',   icon:'⚡', name:'+5% 暴击率',     apply:p=>{p.critRate=Math.min(0.8,(p.critRate||0)+0.05);} },
  { id:'dmg15',  icon:'💥', name:'+15% 伤害',      apply:p=>{p.dmgMult=+(p.dmgMult*1.15).toFixed(4);} },
  { id:'hp30',   icon:'💗', name:'+30 最大HP',      apply:p=>{p.maxHp+=30; healPlayer(30);} },
];

function autoApplyChest(dropType) {
  const p = gs.player;
  SFX.play('chest');
  const def = DROP_DEFS[dropType];
  if (!def?.rarity) return;
  const rarity = def.rarity;
  const statCount = { green:1, blue:2, purple:2, rainbow:3 }[rarity] || 1;
  const chestColor = { green:'#4f4', blue:'#48f', purple:'#c4f', rainbow:'#fd4' }[rarity] || '#fd4';
  const chestLabel = { green:'💚绿宝箱', blue:'💙蓝宝箱', purple:'💜紫宝箱', rainbow:'🌈彩虹宝箱' }[rarity] || '宝箱';

  addFloatingText(chestLabel + ' 开启!', p.x, p.y - 30, chestColor, 1.5);
  if (rarity === 'rainbow') gs._rainbowChests = (gs._rainbowChests||0) + 1;

  const pool = shuffled([...CHEST_STAT_POOL]);
  const _popupItems = [];
  pool.slice(0, statCount).forEach((s, i) => {
    s.apply(p);
    addFloatingText(s.icon + ' ' + s.name, p.x + (i-1)*18, p.y - 20 - i*14, chestColor, 2.0);
    _popupItems.push({ icon: s.icon, name: s.name });
  });

  // Purple: 25% chance of random talent
  if (rarity === 'purple' && Math.random() < 0.25) {
    const _sz = gs.talents.size;
    tryGrantRandomTalent(p);
    if (gs.talents.size > _sz) _popupItems.push({ icon:'✨', name:'获得随机天赋' });
  }
  // Rainbow: 75% chance of random talent
  if (rarity === 'rainbow' && Math.random() < 0.75) {
    const _sz = gs.talents.size;
    tryGrantRandomTalent(p);
    if (gs.talents.size > _sz) _popupItems.push({ icon:'✨', name:'获得随机天赋' });
  }

  gs.chestPopup = { label: chestLabel, items: _popupItems, color: chestColor, timer: 2.0 };

  if (settings.particles) spawnParticles(p.x, p.y, chestColor, 12, 100, 0.7, 3);
  updateDerivedStats(p);
  updateHUD();
  checkAchievements();
}

function tryGrantRandomTalent(p) {
  const available = SUPPLY_TALENTS.filter(t => !gs.talents.has(t.id));
  if (!available.length) return;
  const talent = available[Math.floor(Math.random() * available.length)];
  gs.talents.add(talent.id);
  talent.apply(p);
  addFloatingText('✨ 天赋: ' + talent.name, p.x, p.y - 48, '#a4f', 2.5);
  updateDerivedStats(p);
}

function healPlayer(amount) {
  const p = gs.player;
  const before = p.hp;
  p.hp = Math.min(p.maxHp, p.hp + amount);
  const actual = p.hp - before;
  // Doctor passive: every 100 HP healed → dmgMult +5%
  if (actual > 0 && CLASSES[p.classIdx]?.id === 'doctor') {
    p.healAccum += actual;
    while (p.healAccum >= 100) {
      p.healAccum -= 100;
      p.dmgMult = +(p.dmgMult * 1.05).toFixed(4);
    }
  }
}

function awardXp(amount) {
  if (!gs) return;
  const p = gs.player;
  gs.score += amount;
  const gained = Math.floor(amount * (p.xpMult != null ? p.xpMult : 1));
  p.xp += gained;
  while (p.xp >= p.xpToNext) {
    p.xp -= p.xpToNext;
    p.level++;
    SFX.play('levelup');
    p.xpToNext = Math.floor(120 + p.level * 60);
    p.levelUpQueue++;
    if (CLASSES[p.classIdx]?.id === 'berserker') p.maxHp += 5;
  }
}

function spawnParticles(x, y, colorOrArr, count, speed, life, size) {
  for (let i=0; i<count; i++) {
    const angle = Math.random()*Math.PI*2;
    const spd   = speed*(0.5+Math.random()*0.8);
    const col   = Array.isArray(colorOrArr)
      ? colorOrArr[Math.floor(Math.random()*colorOrArr.length)]
      : colorOrArr;
    gs.particles.push({ x, y, vx:Math.cos(angle)*spd, vy:Math.sin(angle)*spd,
      color:col, life:life, maxLife:life, size });
  }
}

// ═══════════════════════════════════════════════════════
// §8  Update player
// ═══════════════════════════════════════════════════════
function updatePlayer(dt) {
  const p = gs.player;
  let dx=0, dy=0;
  if (keys['KeyW']||keys['ArrowUp'])    { dy-=1; tutorialTimer=0; }
  if (keys['KeyS']||keys['ArrowDown'])  { dy+=1; tutorialTimer=0; }
  if (keys['KeyA']||keys['ArrowLeft'])  { dx-=1; tutorialTimer=0; }
  if (keys['KeyD']||keys['ArrowRight']) { dx+=1; tutorialTimer=0; }
  if (dx&&dy) { dx*=0.7071; dy*=0.7071; }
  // Track last movement direction for Kirby fire form
  if (dx !== 0 || dy !== 0) gs.player.lastMoveAngle = Math.atan2(dy, dx);

  // ── 技能 (Space / J) ──
  const skillPressed = keys['Space'] || keys['KeyJ'];
  if (skillPressed && !p.skillKeyHeld) {
    if (p.skillCd <= 0) {
      const clsId = CLASSES[p.classIdx]?.id;
      if (clsId === 'doctor')      castDoctorHeal(p);
      else if (clsId === 'berserker')   castBerserkerRage(p);
      else if (clsId === 'blacksmith')  castBlacksmithSharpen(p);
      else if (clsId === 'mage')        castMageSurge(p);
      else if (clsId === 'scholar')     castScholarVacuum(p);
      else if (clsId === 'reaper' && !p.reaperChanneling) castReaperSnipe(p);
      else if (clsId === 'kirby')  castKirbyCopy(p);
      else if (clsId === 'santa') castSantaGift(p);
      else castChosenStar(p);
    }
  }
  p.skillKeyHeld = !!skillPressed;
  if (p.skillCd > 0) p.skillCd = Math.max(0, p.skillCd - dt);
  // Berserker: tick rage timer
  if (p.berserkActive) {
    p.berserkTimer = Math.max(0, p.berserkTimer - dt);
    if (p.berserkTimer <= 0) p.berserkActive = false;
  }
  // Ghost shadow: spawn ghost every 0.5s
  if (p.hasGhostShadow) {
    p.ghostTimer = Math.max(0, (p.ghostTimer||0) - dt);
    if (p.ghostTimer <= 0) {
      gs.ghosts.push({x:p.x, y:p.y, timer:1.8, hitSet:new Set()});
      p.ghostTimer = 0.5;
    }
  }
  // Overload: tick burst timer
  if (p.overloadActive) {
    p.overloadTimer = Math.max(0, p.overloadTimer - dt);
    if (p.overloadTimer <= 0) p.overloadActive = false;
  }
  if (p.sharpenActive) {
    p.sharpenTimer = Math.max(0, p.sharpenTimer - dt);
    if (p.sharpenTimer <= 0) p.sharpenActive = false;
  }
  if (p.manaActive) {
    p.manaTimer = Math.max(0, p.manaTimer - dt);
    if (p.manaTimer <= 0) p.manaActive = false;
  }
  // Reaper: channel → lock movement, fire at end
  if (p.reaperChanneling) {
    p.reaperChannel += dt;
    // Pulsing particles while aiming
    if (settings.particles && Math.random() < 0.4)
      spawnParticles(p.x, p.y, ['#fff','#ccc'], 2, 50, 0.4, 2);
    if (p.reaperChannel >= REAPER_CHANNEL_TIME) {
      p.reaperChanneling = false;
      const alive = gs.enemies.filter(e => !e.dead);
      if (alive.length > 0) {
        const tgt = alive.reduce((best, e) => e.hp > best.hp ? e : best, alive[0]);
        if (settings.particles)
          spawnParticles(tgt.x, tgt.y, ['#fff','#f0f','#88f','#000'], 50, 200, 1.8, 7);
        addFloatingText('💀 狙神!', tgt.x, tgt.y - 20, '#fff', 2.0);
        killEnemy(tgt);
      }
    }
    // Block movement while channeling
    p.x = Math.max(-WORLD_W/2, Math.min(WORLD_W/2, p.x));
    p.y = Math.max(-WORLD_H/2, Math.min(WORLD_H/2, p.y));
  } else {
    p.x += dx*p.spd*dt;
    p.y += dy*p.spd*dt;
  }
  // Clamp to world bounds
  p.x = Math.max(-WORLD_W/2, Math.min(WORLD_W/2, p.x));
  p.y = Math.max(-WORLD_H/2, Math.min(WORLD_H/2, p.y));

  cam.x += (p.x - GW/2 - cam.x) * Math.min(1, 8*dt);
  cam.y += (p.y - GH/2 - cam.y) * Math.min(1, 8*dt);

  if (p.invincible>0) p.invincible -= dt;

  // HP regen
  if (p.hpRegen > 0) healPlayer(p.hpRegen * dt);

  // Magnet timer — pulls all gems + drops
  if (p.magnetTimer > 0) {
    p.magnetTimer -= dt;
    gs.gems.forEach(g => {
      const dx2=p.x-g.x, dy2=p.y-g.y;
      const d=Math.sqrt(dx2*dx2+dy2*dy2)||1;
      g.x += (dx2/d)*280*dt; g.y += (dy2/d)*280*dt;
    });
    gs.drops.forEach(d => {
      const dx2=p.x-d.x, dy2=p.y-d.y;
      const dd=Math.sqrt(dx2*dx2+dy2*dy2)||1;
      d.x += (dx2/dd)*200*dt; d.y += (dy2/dd)*200*dt;
    });
  }

  // Gem fly-toward-player: all gems slowly home toward player, accelerate within attraction range
  { const _attraR = p.pickupR * 4 + 60, _attraR2 = (_attraR)*(_attraR);
    gs.gems.forEach(g => {
      const _gx=p.x-g.x, _gy=p.y-g.y, _gd2=_gx*_gx+_gy*_gy;
      if (_gd2 < 0.01) return;
      const _gd=Math.sqrt(_gd2);
      // Within attraction range: fast homing; outside: slow drift toward player
      const _gspd = _gd2 < _attraR2 ? (200 + (_attraR - _gd) * 2.5) : 55;
      g.x += (_gx/_gd)*_gspd*dt; g.y += (_gy/_gd)*_gspd*dt;
    });
  }

  // Auto gem pickup — also awards XP for leveling
  const pr2 = p.pickupR * p.pickupR;
  gs.gems = gs.gems.filter(gem => {
    const dx2=gem.x-p.x, dy2=gem.y-p.y;
    if (dx2*dx2+dy2*dy2 < pr2) {
      awardXp(gem.xp);
      SFX.play('click');
      if (settings.particles) addFloatingText('+'+gem.xp+'xp', gem.x, gem.y-10, '#4fa', 0.75);
      return false;
    }
    return true;
  });

  // Drop pickup (contact range = 14px)
  const PICKUP_R2 = 14*14;
  gs.drops = gs.drops.filter(drop => {
    const dx2=drop.x-p.x, dy2=drop.y-p.y;
    if (dx2*dx2+dy2*dy2 > PICKUP_R2) return true;
    const def = DROP_DEFS[drop.type];
    if (!def) return false;
    if (def.instant) {
      applyInstantDrop(drop.type);
    } else if (def.rarity) {
      // Chest: auto-apply stats (no card selection needed)
      autoApplyChest(drop.type);
    }
    return false;
  });


  // Recompute derived stats each frame
  updateDerivedStats(p);
}

function applyInstantDrop(type) {
  const p = gs.player;
  if (type === 'health') {
    healPlayer(p.maxHp * 0.30);
    spawnParticles(p.x, p.y, '#f44', 8, 70, 0.5, 3);
  } else if (type === 'bomb_item') {
    // Explodes all enemies within 90px of player
    const r2 = 90*90;
    gs.enemies.forEach(e => {
      if (e.dead) return;
      const dx=e.x-p.x, dy=e.y-p.y;
      if (dx*dx+dy*dy < r2) hitEnemy(e, 60 + gs.wave.num * 4);
    });
    spawnParticles(p.x, p.y, ['#f84','#fd4','#f44'], 20, 130, 0.7, 4);
  } else if (type === 'xp_bottle') {
    awardXp(30 + gs.wave.num * 10);
    spawnParticles(p.x, p.y, '#4ef', 10, 80, 0.6, 3);
  } else if (type === 'magnet') {
    p.magnetTimer = 4.0; // 4 seconds
    // Immediately collect all gems on screen
    gs.gems = gs.gems.filter(g => {
      awardXp(g.xp); return false;
    });
    spawnParticles(p.x, p.y, '#f84', 12, 90, 0.5, 3);
  }
  updateHUD();
}

// ═══════════════════════════════════════════════════════
// §9  Update enemies
// ═══════════════════════════════════════════════════════
function updateEnemies(dt) {
  const p = gs.player;
  const alive = gs.enemies.filter(e=>!e.dead);

  // Pre-compute defence turret taunt (Lv7) — cache before per-enemy loop
  const _defTurretActive = !!(gs.weapons?.find(w => w.id==='turret' && w.defenceTurretMode));
  const _tauntPool = _defTurretActive ? [
    ...(gs.turrets||[]), ...(gs.healTurrets||[]), ...(gs.minigunTurrets||[]),
  ] : null;

  for (let i=0; i<alive.length; i++) {
    const e = alive[i];

    // Slow debuff
    if (e.slowTimer>0) e.slowTimer -= dt;
    // Frost stacks → slow, at 10 freeze
    if (e.frostStacks>0 && e.frozenTimer<=0) {
      if (e.frostStacks>=10) { e.frozenTimer=2.0; e.frostStacks=0; }
    }
    if (e.frozenTimer>0) e.frozenTimer -= dt;
    const frostSlow = 1 - Math.min(0.9, (e.frostStacks||0)*0.1);
    const frozen    = (e.frozenTimer||0) > 0 ? 0 : 1;
    // Stun: non-boss only, tick down, stacks add duration
    if ((e.stunTimer||0) > 0) e.stunTimer -= dt;
    const stunned   = (!e.isBoss && (e.stunTimer||0) > 0) ? 0 : 1;
    // Paralysis: slow over time, stacks decay every 3s
    if ((e.paralysisStacks||0) > 0) {
      e.paralysisTimer -= dt;
      if (e.paralysisTimer <= 0) {
        e.paralysisStacks = Math.max(0, e.paralysisStacks-1);
        e.paralysisTimer = 3.0;
      }
    }
    const paralysisSpd = 1 - Math.min(0.8, (e.paralysisStacks||0)*0.08);
    const spdMult   = (e.slowTimer>0 ? 0.4 : 1) * frostSlow * frozen * stunned * paralysisSpd;
    // Flame DOT
    if (e.flameStacks>0) {
      e.flameTick = (e.flameTick||0) - dt;
      if (e.flameTick<=0) { e.flameTick=1.0; e.hp-=e.maxHp*e.flameStacks*0.01; if(e.hp<=0&&!e.dead)killEnemy(e); }
    }
    // Poison DOT
    if (e.poisonStacks>0) {
      e.poisonTick = (e.poisonTick||0) - dt;
      if (e.poisonTick<=0) { e.poisonTick=1.0; e.hp-=e.maxHp*e.poisonStacks*0.005; if(e.hp<=0&&!e.dead)killEnemy(e); }
    }
    if (e.dead) continue;

    // ── Boss: dog charge override ──
    if (e.bossType === 'dog') {
      e.chargeTimer = (e.chargeTimer ?? 5) - dt;
      if (!e.charging && e.chargeTimer <= 0.5 && e.chargeTimer > 0) {
        // Telegraph: flash particles
        if (settings.particles && Math.random()<0.3)
          spawnParticles(e.x, e.y, ['#f84','#fd4'], 4, 60, 0.3, 2);
      }
      if (!e.charging && e.chargeTimer <= 0) {
        e.charging = true;
        e.chargeDur = 0.85;
        // Lock charge direction at moment of launch
        const cdx=p.x-e.x, cdy=p.y-e.y, cd=Math.sqrt(cdx*cdx+cdy*cdy)||1;
        e.chargeVx = (cdx/cd)*380; e.chargeVy = (cdy/cd)*380;
      }
    }

    // Move toward player
    const dx=p.x-e.x, dy=p.y-e.y;
    const dist = Math.sqrt(dx*dx+dy*dy)||0.001;

    // Smoke cloud: enemies inside smoke move randomly
    const inSmoke = (gs.smokeClouds||[]).some(sc => sc.phase==='active' &&
      (e.x-sc.x)**2+(e.y-sc.y)**2 < sc.radius*sc.radius);
    // Defence turret mode: redirect non-boss enemies toward nearest turret
    let _mtX = p.x, _mtY = p.y;
    if (!inSmoke && !e.isBoss && _defTurretActive && _tauntPool?.length) {
      let _nT=null, _nD=Infinity;
      for (const _t of _tauntPool) { const _d=(_t.x-e.x)**2+(_t.y-e.y)**2; if(_d<_nD){_nD=_d;_nT=_t;} }
      if (_nT) { _mtX=_nT.x; _mtY=_nT.y; }
    }
    const moveAng = inSmoke ? (Math.random()*Math.PI*2) : Math.atan2(_mtY-e.y, _mtX-e.x);
    const mdx = Math.cos(moveAng), mdy = Math.sin(moveAng);

    if (e.bossType === 'dog' && e.charging) {
      e.x += e.chargeVx * dt;
      e.y += e.chargeVy * dt;
      e.chargeDur -= dt;
      if (settings.particles && Math.random()<0.5)
        spawnParticles(e.x, e.y, [e.color,'#f44'], 3, 50, 0.2, 2);
      if (e.chargeDur <= 0) {
        e.charging = false;
        e.chargeTimer = 5.0; // cooldown before next charge
      }
    } else if (e.bossType === 'cat') {
      // Keep ~90px distance: approach if far, retreat if too close
      const catDist = 90;
      const moveMult = inSmoke ? 1 : (dist > catDist + 10 ? 1 : dist < catDist - 10 ? -0.9 : 0);
      e.x += mdx*e.spd*spdMult*moveMult*dt;
      e.y += mdy*e.spd*spdMult*moveMult*dt;
    } else if (e.ranged) {
      // Ranged enemy: maintain distance from player
      const _rPref=175, _rFlee=90;
      const _rMult = dist < _rFlee ? -1.3 : dist > _rPref+60 ? 0.4 : 0;
      e.x += mdx*e.spd*spdMult*_rMult*dt;
      e.y += mdy*e.spd*spdMult*_rMult*dt;
    } else {
      e.x += mdx*e.spd*spdMult*dt;
      e.y += mdy*e.spd*spdMult*dt;
    }

    // ── Boss: cat ranged attack ──
    if (e.bossType === 'cat') {
      e.rangedTimer = (e.rangedTimer ?? 2.2) - dt;
      if (e.rangedTimer <= 0) {
        e.rangedTimer = 2.2;
        const ang = Math.atan2(p.y-e.y, p.x-e.x);
        const count = e.hp < e.maxHp*0.5 ? 5 : 3; // phase 2: 5 fish
        for (let fi=0; fi<count; fi++) {
          const spread = (fi - (count-1)/2) * 0.28;
          gs.projectiles.push({
            x:e.x, y:e.y,
            vx:Math.cos(ang+spread)*175, vy:Math.sin(ang+spread)*175,
            dmg: e.dmg * 0.7,
            radius:5, color:'#ca7', life:1.6,
            type:'fish', fromEnemy:true,
          });
        }
        if (settings.particles)
          spawnParticles(e.x, e.y, ['#ca7','#f84'], 6, 55, 0.3, 2);
      }
    }
    // ── Ranged enemy: shoot bolt at player ──
    if (e.ranged && !e.dead) {
      e.boltTimer = (e.boltTimer||3.0) - dt;
      if (e.boltTimer <= 0 && dist < 360) {
        e.boltTimer = 2.5;
        gs.projectiles.push({ x:e.x, y:e.y, vx:mdx*210, vy:mdy*210, dmg:e.dmg, radius:5, color:'#fc8', life:1.8, fromEnemy:true, type:'archer_bolt' });
        if (settings.particles) spawnParticles(e.x, e.y, ['#fc8','#f84'], 4, 40, 0.2, 2);
      }
    }

    // Hard collision separation — enemies cannot overlap
    for (let j=i+1; j<alive.length; j++) {
      const o = alive[j];
      const ox=e.x-o.x, oy=e.y-o.y;
      const d2=ox*ox+oy*oy;
      const minD = e.radius + o.radius;
      if (d2 < minD*minD && d2>0.0001) {
        const d=Math.sqrt(d2);
        const push=(minD-d)/d*0.5;
        e.x+=ox*push; e.y+=oy*push;
        o.x-=ox*push; o.y-=oy*push;
      }
    }

    // Attack player on contact
    if (dist < e.radius+10) {
      e.attackTimer -= dt;
      if (e.attackTimer<=0 && p.invincible<=0) {
        e.attackTimer = 0.75;

        // Dodge check
        if (p.dodgeChance>0 && Math.random()<p.dodgeChance) {
          spawnParticles(p.x, p.y, '#8af', 3, 55, 0.3, 2);
          continue;
        }

        // Shield (Black Tortoise)
        if ((p.btShield||0) > 0) {
          p.btShield--;
          e.attackTimer = 0.75; p.invincible = 0.3; updateHUD();
          if (settings.particles) spawnParticles(p.x,p.y,['#4af','#8cf','#fff'],6,70,0.4,2);
          addFloatingText('🛡 护盾！',p.x,p.y-22,'#4af',0.9);
          continue;
        }
        // Wave shield: absorbs one hit per wave
        if (p.waveShieldUp) {
          p.waveShieldUp = false;
          e.attackTimer = 0.75; p.invincible = 0.3; updateHUD();
          if (settings.particles) spawnParticles(p.x,p.y,['#7ef','#4af','#fff'],6,70,0.4,2);
          addFloatingText('🔰 格挡！',p.x,p.y-22,'#7ef',0.9);
          continue;
        }
        // Damage reduction
        const actualDmg = e.dmg * (1 - p.dmgReduction) * (1 - Math.min(0.8,(e.paralysisStacks||0)*0.08));
        p.hp -= actualDmg;
        addFloatingText('-'+String(Math.round(actualDmg)), p.x+(Math.random()-0.5)*12, p.y-14, '#f66', 0.7);
        SFX.play('playerhit');
        // Ice armor: 20% chance to freeze attacker
        if (p.hasIceArmor && !e.isBoss && Math.random() < 0.2) {
          e.frozenTimer = Math.max(e.frozenTimer||0, 1.5);
          if (settings.particles) spawnParticles(e.x,e.y,['#8ef','#4af','#fff'],5,55,0.3,2);
          addFloatingText('🧊',e.x,e.y-14,'#8ef',0.6);
        }
        gs._damageTaken = (gs._damageTaken||0) + actualDmg;
        p.invincible = 0.5 * (p.invincMult||1);
        spawnParticles(p.x, p.y, '#f44', 6, 90, 0.4, 2);
        if (p.hp<=0) {
          const _btUw = getWeapon('black_tortoise');
          if (_btUw?.btUndying && (_btUw.btUndyingCd||0)<=0) {
            p.hp=1; _btUw.btUndyingCd=150; p.invincible=3.0*(p.invincMult||1);
            p.dmgMult=+((p.dmgMult||1)*2).toFixed(4);
            setTimeout(()=>{ if(gs?.player) gs.player.dmgMult=+(gs.player.dmgMult/2).toFixed(4); },3000);
            healPlayer(Math.floor(p.maxHp*0.25));
            addFloatingText('💎 不灭！',p.x,p.y-40,'#fd4',2.0);
            if(settings.particles) spawnParticles(p.x,p.y,['#fd4','#fff','#f84'],18,140,1.2,6);
          } else { p.hp=0; gs.phase='dead'; showDeadScreen(); }
        }
        updateHUD();
      }
    }
  }
}

// ═══════════════════════════════════════════════════════
// §10  Weapons: fire functions
//       (Add new weapon fire functions here as needed)
// ═══════════════════════════════════════════════════════
function nearestEnemy(x, y) {
  let best=null, bestD=Infinity;
  for (const e of gs.enemies) {
    if (e.dead) continue;
    const dx=e.x-x, dy=e.y-y;
    const d=dx*dx+dy*dy;
    if (d<bestD) { bestD=d; best=e; }
  }
  return best;
}

// ── Weapon fire functions ──────────────────────────────────────────────────
function fireShotgun(w, stats, p) {
  const tgt = nearestEnemy(p.x, p.y);
  if (!tgt) return;
  const ang   = Math.atan2(tgt.y-p.y, tgt.x-p.x);
  const mods  = w.variantMods || [];
  const beff  = w.bulletEffect || null;
  const elem  = w.element || null;
  const col   = elem==='flame'?'#f84' : elem==='frost'?'#8cf' : elem==='poison'?'#6f4' : '#f84';
  const dmgMult = mods.includes('dmg_20') ? 1.2 : 1.0;
  const cnt   = (stats.count || 5) + (mods.includes('extra_shell') ? 1 : 0);
  const spread = mods.includes('aspd') ? 0.85 : 1.0; // aspd on shotgun → tighter spread fires faster (via cd)
  const shoot = (a, d) => gs.projectiles.push({
    x:p.x, y:p.y, vx:Math.cos(a)*260, vy:Math.sin(a)*260,
    dmg:d, radius:4, color:col, life:0.85, type:'bullet', wepCat:'gun',
    pierce:beff==='pierce', bounce:beff==='bounce', bounceCount:2,
    splitOnHit:beff==='split', element:elem,
  });
  const fireBurst = () => {
    for (let i=0; i<cnt; i++) {
      const sp = cnt>1 ? (i/(cnt-1)-0.5)*1.0 : 0;
      shoot(ang+sp, Math.floor(stats.dmg * 0.65 * dmgMult));
    }
  };
  fireBurst();
  if (w.extraGun) fireBurst();
}

function fireGatling(w, stats, p) {
  const tgt = nearestEnemy(p.x, p.y);
  if (!tgt) return;
  const ang     = Math.atan2(tgt.y-p.y, tgt.x-p.x);
  const mods    = w.variantMods || [];
  const elem    = w.element || null;
  const col     = elem==='flame'?'#f84' : elem==='frost'?'#8cf' : elem==='poison'?'#6f4' : '#fd4';
  const hasDual = mods.includes('dual_bullet');
  const dmg     = Math.floor(stats.dmg * (mods.includes('dmg_20') ? 1.2 : 1.0));
  const shoot = (x, y, a) => gs.projectiles.push({
    x, y, vx:Math.cos(a)*310, vy:Math.sin(a)*310,
    dmg, radius:3, color:col, life:1.3, type:'bullet', wepCat:'gun', element:elem,
  });
  const fireBurst = () => {
    if (hasDual) {
      const px = Math.cos(ang+Math.PI/2)*6, py = Math.sin(ang+Math.PI/2)*6;
      shoot(p.x+px, p.y+py, ang); shoot(p.x-px, p.y-py, ang);
    } else {
      shoot(p.x, p.y, ang);
    }
  };
  fireBurst();
  if (w.extraGun) fireBurst();
}

function fireHealDroneCircle(w, stats, p) {
  const r   = Math.round(stats.circleR  * (w.rangeMult||1));
  const hps = stats.healPs * (w.healMult||1);
  const dur = stats.circleDur;
  gs.healCircles.push({
    x: p.x, y: p.y, r, healPs: hps,
    timer: dur, maxTimer: dur,
    element: w.element || null,
    follows: w.follows || false,
    elemTick: 1.0,
  });
  if (settings.particles)
    spawnParticles(p.x, p.y, ['#4f8','#8ff','#aff'], 10, 55, 0.55, 3);
}

function firePistol(w, stats, p) {
  const tgt = nearestEnemy(p.x, p.y);
  if (!tgt) return;
  const ang   = Math.atan2(tgt.y-p.y, tgt.x-p.x);
  const mods  = w.variantMods || [];
  const hasDmg20  = mods.includes('dmg_20');
  const hasSplit  = mods.includes('split_bullet');
  const hasDual   = mods.includes('dual_bullet');
  const elem      = w.element || null;
  const beff      = w.bulletEffect || null;
  const col       = elem==='flame'?'#f84' : elem==='frost'?'#8cf' : elem==='poison'?'#6f4' : '#fd4';
  let dmg = stats.dmg;
  if (hasDmg20) dmg = Math.floor(dmg * 1.2);

  const shoot = (x, y, a, d) => gs.projectiles.push({
    x, y, vx:Math.cos(a)*290, vy:Math.sin(a)*290,
    dmg:d, radius:4, color:col, life:1.4, type:'bullet',
    pierce:    beff==='pierce',
    bounce:    beff==='bounce', bounceCount:2,
    splitOnHit:beff==='split',
    element: elem,
  });

  const burst = () => {
    if (!w.variant) {
      shoot(p.x, p.y, ang, dmg);
    } else if (w.variant === 'shotgun') {
      const cnt = hasSplit ? 7 : 5;
      for (let i=0; i<cnt; i++) {
        const sp = (i/(cnt-1)-0.5)*0.9;
        shoot(p.x, p.y, ang+sp, Math.floor(dmg*0.6));
      }
    } else if (w.variant === 'gatling') {
      if (hasDual) {
        // Parallel side-by-side: offset perpendicular to aim direction
        const perpX = Math.cos(ang + Math.PI/2) * 6;
        const perpY = Math.sin(ang + Math.PI/2) * 6;
        shoot(p.x + perpX, p.y + perpY, ang, dmg);
        shoot(p.x - perpX, p.y - perpY, ang, dmg);
      } else {
        shoot(p.x, p.y, ang, dmg);
      }
    }
  };

  burst();
  if (w.extraGun) burst(); // second gun fires the same pattern
}

function fireArrowRain(w, stats, p) {
  const tgt = nearestEnemy(p.x, p.y);
  if (!tgt) return;
  const area = (stats.radius||50) * getAreaMult(p);
  for (let i=0; i<(stats.count||4); i++) {
    const ox = tgt.x + (Math.random()-.5)*area*2;
    const oy = tgt.y + (Math.random()-.5)*area*2;
    gs.projectiles.push({ x:ox, y:oy-90,
      vx:0, vy:340,
      dmg:stats.dmg, radius:3, color:'#fa4', life:0.55, type:'arrow', wepCat:'phys', pierce:true, maxPierce:2 });
  }
}

function fireHealDrone(w, stats, p) {
  fireHealDroneCircle(w, stats, p);
}

function missileDroneExplosion(x, y, radius, dmg, weapRef) {
  const r2 = radius * radius;
  gs.enemies.forEach(e => {
    if (e.dead) return;
    const dx=e.x-x, dy=e.y-y;
    if (dx*dx+dy*dy < r2) {
      hitEnemy(e, dmg, false, false, 'gun');
      if (weapRef) {
        if (weapRef.warhead==='stun' && !e.isBoss) {
          e.stunStacks = Math.min(10,(e.stunStacks||0)+1);
          e.stunTimer  = Math.max(e.stunTimer||0, 0.5 + (e.stunStacks||0)*0.4);
        }
        if (weapRef.warhead==='flame') e.flameStacks = Math.min(10,(e.flameStacks||0)+1);
      }
    }
  });
  const cols = weapRef?.warhead==='flame' ? ['#f64','#f84','#fd4'] : ['#f84','#fd4','#f44','#ff8'];
  if (settings.particles) spawnParticles(x, y, cols, 18, 105, 0.65, 4);
  // 二次爆炸: queue a second identical explosion
  if (weapRef?.warhead==='double') {
    gs.pendingExplosions.push({ timer:0.35, x, y, radius, dmg, w:null });
  }
}

function fireMissileDrone(w, stats, p) {
  const baseDmg = Math.round(50 * (w.missileDmgMult||1));
  const baseR   = 20 * (w.missileRadMult||1);
  const count   = 6;
  const col     = w.deathMissile ? '#c0f' : (w.warhead==='flame' ? '#f64' : '#f84');

  // ── 死神飞弹: evenly around player ──
  if (w.deathMissile) {
    const ddmg = Math.round(baseDmg * 2.0);
    const dr   = baseR * 2.5;
    for (let i=0; i<count; i++) {
      const ang = (i/count)*Math.PI*2;
      const tx  = p.x + Math.cos(ang)*130;
      const ty  = p.y + Math.sin(ang)*130;
      gs.pendingExplosions.push({ timer:0.25+i*0.1, x:tx, y:ty, radius:dr, dmg:ddmg, w });
    }
    if (settings.particles) spawnParticles(p.x,p.y,['#c0f','#f0f','#a0f'],20,100,0.8,4);
    return;
  }

  // ── 6 falling missiles → aimed at nearest enemy ──
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
  }
  if (settings.particles) spawnParticles(p.x, p.y, col, 8, 80, 0.5, 3);

  // ── Lv4 extra burst ──
  if (w.missileMode==='ground') {
    for (let i=0; i<3; i++)
      gs.pendingExplosions.push({ timer:i*0.15, x:p.x+(Math.random()-.5)*30, y:p.y+(Math.random()-.5)*30,
        radius:baseR*1.1, dmg:Math.round(baseDmg*0.8), w });
  } else if (w.missileMode==='forward') {
    const tgt=nearestEnemy(p.x,p.y);
    const ang=tgt?Math.atan2(tgt.y-p.y,tgt.x-p.x):-Math.PI/2;
    for (let i=0; i<4; i++) {
      const a=ang+(Math.random()-.5)*0.4;
      gs.projectiles.push({ x:p.x,y:p.y, vx:Math.cos(a)*290,vy:Math.sin(a)*290,
        dmg:0, radius:4, color:col, life:0.7, type:'missile', wepCat:'gun', pierce:false,
        explodeR:baseR, explodeDmg:Math.round(baseDmg*0.7), missileW:w,
        onHit:(proj)=>{ missileDroneExplosion(proj.x,proj.y,proj.explodeR,proj.explodeDmg,proj.missileW); proj.dead=true; },
        onExpire:(proj)=>{ missileDroneExplosion(proj.x,proj.y,proj.explodeR,proj.explodeDmg,proj.missileW); },
      });
    }
  } else if (w.missileMode==='scatter') {
    const tgt=nearestEnemy(p.x,p.y);
    if (tgt) {
      for (let i=0; i<5; i++)
        gs.pendingExplosions.push({ timer:i*0.1, x:tgt.x+(Math.random()-.5)*80, y:tgt.y+(Math.random()-.5)*80,
          radius:baseR, dmg:Math.round(baseDmg*0.9), w });
    }
  }
}

function getMissileDroneUpgradeCards(w) {
  const next = w.level + 1;
  if (next===4) return [
    { type:'missileup', missileOp:'mode', mode:'ground',  weapId:'missile_drone', icon:'💥', name:'原地爆炸', desc:'发射时在玩家脚下额外引爆一串导弹' },
    { type:'missileup', missileOp:'mode', mode:'forward', weapId:'missile_drone', icon:'➡', name:'导弹开路', desc:'发射时朝前方额外发射一串导弹' },
    { type:'missileup', missileOp:'mode', mode:'scatter', weapId:'missile_drone', icon:'🌪', name:'狂轰乱炸', desc:'发射时在目标周围额外投下一串导弹' },
  ];
  if (next===7) return [
    { type:'missileup', missileOp:'warhead', warhead:'stun',   weapId:'missile_drone', icon:'⚡', name:'震荡弹头', desc:'伤害×2·爆炸对非boss施加眩晕(最多10层)' },
    { type:'missileup', missileOp:'warhead', warhead:'flame',  weapId:'missile_drone', icon:'🔥', name:'燃烧弹头', desc:'伤害×2·爆炸施加1层灼烧' },
    { type:'missileup', missileOp:'warhead', warhead:'double', weapId:'missile_drone', icon:'💣', name:'二次爆炸', desc:'伤害×2·爆炸后0.35秒再次爆炸造成100%伤害' },
  ];
  // Lv2/3/5/6: random stat
  const pool = [
    { op:'radius', icon:'⭕', name:'更多火药',  desc:'导弹爆炸半径+15%' },
    { op:'dmg',    icon:'💣', name:'高爆火药',  desc:'导弹伤害+35%' },
    { op:'cd',     icon:'⏱', name:'快速填充',  desc:'发射频率+20%' },
  ];
  const c = pool[Math.floor(Math.random()*pool.length)];
  return [{ type:'missileup', missileOp:'stat', statOp:c.op, weapId:'missile_drone', icon:c.icon, name:c.name, desc:c.desc }];
}

function updatePendingExplosions(dt) {
  if (!gs.pendingExplosions) return;
  gs.pendingExplosions = gs.pendingExplosions.filter(pe => {
    pe.timer -= dt;
    if (pe.timer <= 0) {
      missileDroneExplosion(pe.x, pe.y, pe.radius, pe.dmg, pe.w);
      return false;
    }
    return true;
  });
}

// Update ghost shadows
function updateGhosts(dt) {
  if (!gs.ghosts?.length) return;
  const p = gs.player;
  gs.ghosts = gs.ghosts.filter(g => {
    g.timer -= dt;
    if (g.timer <= 0) return false;
    const ghostDmg = Math.round(20 * (p.dmgMult||1));
    for (const e of gs.enemies) {
      if (e.dead || g.hitSet.has(e)) continue;
      const dx=e.x-g.x, dy=e.y-g.y;
      if (dx*dx+dy*dy < (e.radius+18)*(e.radius+18)) {
        g.hitSet.add(e);
        hitEnemy(e, ghostDmg, true, false, 'phys');
      }
    }
    return true;
  });
}

// Update land mines
function updateMines(dt) {
  if (!gs.mines?.length) return;
  const p = gs.player;
  gs.mines = gs.mines.filter(m => {
    for (const e of gs.enemies) {
      if (e.dead) continue;
      const dx=e.x-m.x, dy=e.y-m.y;
      if (dx*dx+dy*dy < 22*22) {
        // Explode: AoE 90px
        const mineDmg = Math.round(80*(p.dmgMult||1));
        gs.enemies.forEach(ne => {
          if (ne.dead) return;
          const ndx=ne.x-m.x, ndy=ne.y-m.y;
          if (ndx*ndx+ndy*ndy < 90*90) hitEnemy(ne, mineDmg, true, false, 'phys');
        });
        if (settings.particles) spawnParticles(m.x,m.y,['#f84','#fd4','#f44','#fff'],18,140,0.9,5);
        addFloatingText('💥',m.x,m.y-22,'#fd4',0.8);
        SFX.play('wave');
        return false;
      }
    }
    return true;
  });
}

// ── Turret helpers ────────────────────────────────────────
// Roll the next upgrade option for the turret (called on init and after each pick)
function _rollTurretUpgrade(w) {
  const pool = ['rapid_fire', 'multi_build'];
  if ((w.ammoLevel||0) < 3) pool.push('ammo_up');
  return pool[Math.floor(Math.random() * pool.length)];
}

// Apply the pre-rolled upgrade and re-roll for next time
function _applyTurretLevelUp(w) {
  const up = w._nextUpgrade;
  if (up === 'rapid_fire') {
    w.rapidFireCount = (w.rapidFireCount||0) + 1;
    addFloatingText('⏩ 速射!', gs.player.x, gs.player.y-32, '#fd4', 1.4);
  } else if (up === 'multi_build') {
    w.extraTurrets = (w.extraTurrets||0) + 1;
    addFloatingText('🔧 新炮台!', gs.player.x, gs.player.y-32, '#4af', 1.4);
  } else if (up === 'ammo_up') {
    w.ammoLevel = Math.min(3, (w.ammoLevel||0) + 1);
    const _names = ['⚡激光', '💣炸弹', '🚀火箭'];
    addFloatingText(`🔄 ${_names[w.ammoLevel-1]}!`, gs.player.x, gs.player.y-32, '#4fd', 1.4);
  }
  w._nextUpgrade = _rollTurretUpgrade(w);
}

// Spawn turrets around player for a new wave
function _spawnTurrets(tw, p) {
  const _base = WEAPON_DEFS.turret.levels[0];
  const _maxCount = 1 + (tw.extraTurrets||0);
  const _rapidMult = Math.pow(1.25, tw.rapidFireCount||0);
  const _cdBase = (_base.cd / _rapidMult) * (p.cdMult||1);
  const arr = [];
  for (let _ti = 0; _ti < _maxCount; _ti++) {
    const _ta = (_ti / Math.max(1, _maxCount)) * Math.PI * 2;
    const _td = 52 + Math.random() * 26;
    arr.push({
      x: p.x + Math.cos(_ta) * _td,
      y: p.y + Math.sin(_ta) * _td,
      aimAngle: _ta + Math.PI,
      fireTimer: _ti * (_cdBase / Math.max(1, _maxCount)),
      hp: Math.round(p.maxHp * 0.5),
      maxHp: Math.round(p.maxHp * 0.5),
      _hitCds: new Map(),
      shield: tw.defenceTurretMode ? true : false,
    });
  }
  return arr;
}

// Add new turret beside player when multi_build taken mid-wave
function _addOneTurret(tw, p) {
  const _ang = Math.random() * Math.PI * 2;
  const _td  = 52 + Math.random() * 26;
  const _dMode = gs.weapons?.find(w=>w.id==='turret')?.defenceTurretMode||false;
  gs.turrets.push({
    x: p.x + Math.cos(_ang) * _td,
    y: p.y + Math.sin(_ang) * _td,
    aimAngle: _ang + Math.PI,
    fireTimer: 0.3,
    hp: Math.round(p.maxHp * 0.5),
    maxHp: Math.round(p.maxHp * 0.5),
    _hitCds: new Map(),
    shield: _dMode,
  });
}

// Spawn the Lv4 special turret(s) around player
// tw.specialCount controls how many to spawn (default 1; Lv7 "更多炮台" raises it)
function _spawnSpecialTurrets(tw, p) {
  const _baseHp  = Math.round(p.maxHp * 0.5);
  const _cnt     = tw.specialCount || 1;
  const _shield  = tw.defenceTurretMode;
  if (tw.specialType === 'heal') {
    gs.healTurrets = [];
    for (let _i = 0; _i < _cnt; _i++) {
      const _a = (_i / _cnt) * Math.PI * 2 + Math.random() * 0.4;
      gs.healTurrets.push({
        x: p.x+Math.cos(_a)*68, y: p.y+Math.sin(_a)*68,
        aimAngle:0, fireTimer:0.8 + _i*0.3,
        hp:_baseHp, maxHp:_baseHp, _hitCds:new Map(),
        shield:_shield,
      });
    }
  } else if (tw.specialType === 'kamikaze') {
    // kamikaze base = 3; specialCount acts as additive bonus
    const _kCnt = 3 + (_cnt - 1) * 3; // specialCount 1→3, 4→12
    gs.kamikazeBots = [];
    for (let _i = 0; _i < _kCnt; _i++) {
      const _a = (_i / _kCnt) * Math.PI * 2;
      gs.kamikazeBots.push({
        x: p.x+Math.cos(_a)*68, y: p.y+Math.sin(_a)*68,
        hp:Math.round(p.maxHp*0.3), maxHp:Math.round(p.maxHp*0.3),
        _hitCds:new Map(),
      });
    }
  } else if (tw.specialType === 'minigun') {
    gs.minigunTurrets = [];
    for (let _i = 0; _i < _cnt; _i++) {
      const _a = (_i / _cnt) * Math.PI * 2 + Math.random() * 0.4;
      gs.minigunTurrets.push({
        x: p.x+Math.cos(_a)*68, y: p.y+Math.sin(_a)*68,
        aimAngle:0, fireTimer:0.1 + _i*0.2,
        hp:_baseHp, maxHp:_baseHp, _hitCds:new Map(),
        shield:_shield,
      });
    }
  }
}

// ── Special turret update functions ──────────────────────

// Heal turret: homing bullet → heals player 5% HP on hit
function updateHealTurrets(dt) {
  if (!gs.healTurrets?.length) return;
  const p = gs.player;
  const _tw = gs.weapons.find(w => w.id === 'turret');
  const _dmg = Math.round(25 * (p.dmgMult||1) * (p.physDmgMult||1));
  const _range = 220, _range2 = _range*_range;
  const _cd = 1.8 * (p.cdMult||1);

  gs.healTurrets = gs.healTurrets.filter(t => {
    // enemy hit cooldowns
    for (const [e,cd] of t._hitCds) { if(cd-dt<=0) t._hitCds.delete(e); else t._hitCds.set(e,cd-dt); }
    // enemy damages turret
    for (const e of gs.enemies) {
      if (e.dead) continue;
      const ex=e.x-t.x, ey=e.y-t.y;
      if (ex*ex+ey*ey < (e.radius+10)**2 && !t._hitCds.has(e)) {
        t.hp -= e.dmg; t._hitCds.set(e, 0.8);
        if (t.hp<=0) {
          if (t.shield) { t.hp=1; t.shield=false; addFloatingText('🛡 免死!',t.x,t.y-20,'#4af',1.0); }
          else { if(settings.particles) spawnParticles(t.x,t.y,['#4f8','#888'],5,80,0.4,3); return false; }
        }
      }
    }
    // aim + fire
    t.fireTimer -= dt;
    let best=null, bestD=_range2;
    for (const e of gs.enemies) { if(e.dead) continue; const dx=e.x-t.x,dy=e.y-t.y,d=dx*dx+dy*dy; if(d<bestD){bestD=d;best=e;} }
    if (best) t.aimAngle = Math.atan2(best.y-t.y, best.x-t.x);
    if (t.fireTimer<=0 && best) {
      t.fireTimer = _cd;
      const ang = t.aimAngle, spd=300;
      const _hp = p.maxHp;
      gs.projectiles.push({
        x:t.x, y:t.y, vx:Math.cos(ang)*spd, vy:Math.sin(ang)*spd,
        dmg:_dmg, radius:5, color:'#4f8',
        life:_range/spd+0.1, type:'bullet', wepCat:'phys',
        homing:true, maxSpd:320,
        onHit:(pr)=>{ healPlayer(_hp*0.05); },
      });
      if(settings.particles) spawnParticles(t.x,t.y,['#4f8','#8fa'],2,70,0.15,2);
    } else if (t.fireTimer<0) t.fireTimer=0;
    return true;
  });
}

// Kamikaze robots: chase nearest enemy, self-destruct on contact
function updateKamikazeBots(dt) {
  if (!gs.kamikazeBots?.length) return;
  const p = gs.player;
  const _tw = gs.weapons.find(w => w.id === 'turret');
  const _dmg = Math.round(70 * (p.dmgMult||1) * (p.physDmgMult||1));

  gs.kamikazeBots = gs.kamikazeBots.filter(b => {
    // enemy hit cooldowns
    for (const [e,cd] of b._hitCds) { if(cd-dt<=0) b._hitCds.delete(e); else b._hitCds.set(e,cd-dt); }
    // enemy damages bot
    for (const e of gs.enemies) {
      if (e.dead) continue;
      const ex=e.x-b.x, ey=e.y-b.y;
      if (ex*ex+ey*ey < (e.radius+8)**2 && !b._hitCds.has(e)) {
        b.hp -= e.dmg; b._hitCds.set(e, 0.8);
        if (b.hp<=0) {
          triggerExplosion(b.x, b.y, 80, _dmg);
          if(settings.particles) spawnParticles(b.x,b.y,['#f44','#f84','#fff'],10,110,0.6,4);
          addFloatingText('💥',b.x,b.y-16,'#f84',0.8);
          return false;
        }
      }
    }
    // Move toward nearest enemy
    let best=null, bestD=Infinity;
    for (const e of gs.enemies) { if(e.dead) continue; const dx=e.x-b.x,dy=e.y-b.y,d=dx*dx+dy*dy; if(d<bestD){bestD=d;best=e;} }
    if (best) {
      const dx=best.x-b.x, dy=best.y-b.y, dist=Math.sqrt(dx*dx+dy*dy)||1;
      // Self-destruct when close enough
      if (dist < 22) {
        triggerExplosion(b.x, b.y, 80, _dmg);
        if(settings.particles) spawnParticles(b.x,b.y,['#f44','#f84','#fd4','#fff'],14,130,0.7,4);
        addFloatingText('💥',b.x,b.y-16,'#f84',0.8);
        SFX.play('wave');
        return false; // bot consumed
      }
      b.x += (dx/dist)*62*dt;
      b.y += (dy/dist)*62*dt;
    }
    return true;
  });
}

// Minigun turret: very fast fire rate, low damage
function updateMinigunTurrets(dt) {
  if (!gs.minigunTurrets?.length) return;
  const p = gs.player;
  const _dmg = Math.round(9 * (p.dmgMult||1) * (p.physDmgMult||1));
  const _range=180, _range2=_range*_range;
  const _cd = 0.14 * (p.cdMult||1);

  gs.minigunTurrets = gs.minigunTurrets.filter(t => {
    for (const [e,cd] of t._hitCds) { if(cd-dt<=0) t._hitCds.delete(e); else t._hitCds.set(e,cd-dt); }
    for (const e of gs.enemies) {
      if (e.dead) continue;
      const ex=e.x-t.x, ey=e.y-t.y;
      if (ex*ex+ey*ey < (e.radius+10)**2 && !t._hitCds.has(e)) {
        t.hp -= e.dmg; t._hitCds.set(e, 0.8);
        if (t.hp<=0) {
          if (t.shield) { t.hp=1; t.shield=false; addFloatingText('🛡 免死!',t.x,t.y-20,'#4af',1.0); }
          else { if(settings.particles) spawnParticles(t.x,t.y,['#fd4','#888'],5,80,0.4,3); return false; }
        }
      }
    }
    t.fireTimer -= dt;
    let best=null, bestD=_range2;
    for (const e of gs.enemies) { if(e.dead) continue; const dx=e.x-t.x,dy=e.y-t.y,d=dx*dx+dy*dy; if(d<bestD){bestD=d;best=e;} }
    if (best) t.aimAngle = Math.atan2(best.y-t.y, best.x-t.x);
    if (t.fireTimer<=0 && best) {
      t.fireTimer = _cd;
      const ang=t.aimAngle, spd=420;
      gs.projectiles.push({
        x:t.x, y:t.y, vx:Math.cos(ang)*spd, vy:Math.sin(ang)*spd,
        dmg:_dmg, radius:3, color:'#fd4',
        life:_range/spd+0.05, type:'bullet', wepCat:'phys',
      });
    } else if (t.fireTimer<0) t.fireTimer=0;
    return true;
  });
}

// ── Turret HUD (top-right: ⚙ n/max) ──────────────────────
function _ensureTurretHud() {
  if (document.getElementById('hud-turret')) return;
  const el = document.createElement('div');
  el.id = 'hud-turret';
  el.style.cssText = [
    'position:fixed','top:36px','right:4px','z-index:12',
    'background:rgba(0,0,0,.75)','border:1px solid #4af',
    'border-radius:3px','padding:2px 8px',
    "font-family:'Courier New',monospace",'font-size:10px',
    'color:#4af','display:none','pointer-events:none',
    'letter-spacing:0.5px',
  ].join(';');
  document.body.appendChild(el);
}
function _updateTurretHud() {
  const el = document.getElementById('hud-turret');
  if (!el) return;
  const tw = gs?.weapons?.find(w => w.id === 'turret');
  if (!tw || gs?.phase !== 'playing') { el.style.display = 'none'; return; }
  const maxC = 1 + (tw.extraTurrets||0);
  const alive = (gs.turrets||[]).length;
  const _ammoTag = ['⬤','⚡','💣','🚀'][(tw.ammoLevel||0)];
  let txt = `⚙ ${_ammoTag} ${alive}/${maxC}`;
  // Special turret indicators
  const _spCnt = tw.specialCount || 1;
  if (tw.specialType === 'heal')     txt += ` 💚${(gs.healTurrets||[]).length}/${_spCnt}`;
  if (tw.specialType === 'kamikaze') { const _kMax=3+(_spCnt-1)*3; txt += ` 🤖${(gs.kamikazeBots||[]).length}/${_kMax}`; }
  if (tw.specialType === 'minigun')  txt += ` 🔫${(gs.minigunTurrets||[]).length}/${_spCnt}`;
  // Mode flags
  if (tw.defenceTurretMode) txt += ' 🛡';
  if (tw.elementTurretMode) txt += ' ✨';
  if (tw.mineTurretMode)    txt += ' 💣';
  el.style.display = '';
  el.textContent   = txt;
}

// Update turrets (fire, take damage, die)
function updateTurrets(dt) {
  const _tw = gs.weapons.find(w => w.id === 'turret');
  if (!_tw) { if (gs.turrets?.length) gs.turrets = []; _updateTurretHud(); return; }

  // Detect level-up that didn't go through startWave (mid-wave XP level-up)
  if (_tw._lastLevel !== undefined && _tw.level !== _tw._lastLevel) {
    const _wasMulti = _tw._nextUpgrade === 'multi_build';
    _applyTurretLevelUp(_tw);
    _tw._lastLevel = _tw.level;
    if (_wasMulti) _addOneTurret(_tw, gs.player);
  }
  // Spawn special turrets immediately when picked mid-wave
  if (_tw._specialNeedsSpawn && _tw.specialType) {
    _tw._specialNeedsSpawn = false;
    // Ensure regular turret count = 3
    while (gs.turrets.length < 1+(_tw.extraTurrets||0)) _addOneTurret(_tw, gs.player);
    _spawnSpecialTurrets(_tw, gs.player);
  }

  const p = gs.player;
  const _base = WEAPON_DEFS.turret.levels[0];
  const _maxCount = 1 + (_tw.extraTurrets||0);
  // Enforce cap (remove oldest)
  while (gs.turrets.length > _maxCount) gs.turrets.shift();

  const _rapidMult = Math.pow(1.25, _tw.rapidFireCount||0);
  const _cdBase    = (_base.cd / _rapidMult) * (p.cdMult||1);
  const _dmg       = Math.round(_base.dmg * (p.dmgMult||1) * (p.physDmgMult||1));
  const _range     = _base.range;
  const _range2    = _range * _range;
  const _ammoLv    = _tw.ammoLevel||0;
  // Ammo properties per level
  const _ammoColor = ['#fa8','#4ef','#f84','#f44'][_ammoLv];
  const _ammoSpd   = _ammoLv === 3 ? 270 : 350;
  const _ammoR     = _ammoLv === 3 ? 6 : 4;

  gs.turrets = gs.turrets.filter(t => {
    // ── Enemy hit cooldowns ──
    for (const [e, cd] of t._hitCds) {
      if (cd - dt <= 0) t._hitCds.delete(e);
      else t._hitCds.set(e, cd - dt);
    }
    // ── Enemy damages turret ──
    for (const e of gs.enemies) {
      if (e.dead) continue;
      const ex = e.x - t.x, ey = e.y - t.y;
      if (ex*ex + ey*ey < (e.radius + 10)**2) {
        if (!t._hitCds.has(e)) {
          t.hp -= e.dmg;
          t._hitCds.set(e, 0.8);
          if (settings.particles) spawnParticles(t.x, t.y, ['#f44','#888'], 2, 50, 0.2, 2);
          if (t.hp <= 0) {
            if (_tw.defenceTurretMode && t.shield) {
              // One-time death immunity
              t.hp = 1; t.shield = false;
              addFloatingText('🛡 免死!', t.x, t.y-22, '#4af', 1.1);
              if (settings.particles) spawnParticles(t.x, t.y, ['#4af','#88f','#fff'], 5, 70, 0.35, 3);
            } else {
              addFloatingText('💥', t.x, t.y-18, '#f84', 0.7);
              if (settings.particles) spawnParticles(t.x, t.y, ['#f44','#f84','#888'], 6, 90, 0.45, 3);
              // Mine turret mode: leave a mine on death
              if (_tw.mineTurretMode) {
                gs.mines.push({ x: t.x, y: t.y });
                addFloatingText('💣', t.x, t.y-10, '#fd4', 0.9);
              }
              // Mid-wave respawn: queue a replacement after 5 seconds
              if (!_tw._respawnQueue) _tw._respawnQueue = [];
              _tw._respawnQueue.push(5.0);
              addFloatingText('⚙ 5s后补充', t.x, t.y-32, '#4af', 1.4);
              return false; // remove turret
            }
          }
        }
      }
    }
    // ── Aim at nearest enemy in range ──
    t.fireTimer -= dt;
    let best = null, bestDist = _range2;
    for (const e of gs.enemies) {
      if (e.dead) continue;
      const dx = e.x - t.x, dy = e.y - t.y;
      const d = dx*dx + dy*dy;
      if (d < bestDist) { bestDist = d; best = e; }
    }
    if (best) t.aimAngle = Math.atan2(best.y - t.y, best.x - t.x);
    // ── Fire ──
    if (t.fireTimer <= 0 && best) {
      t.fireTimer = _cdBase;
      const ang = t.aimAngle;
      const proj = {
        x: t.x, y: t.y,
        vx: Math.cos(ang)*_ammoSpd, vy: Math.sin(ang)*_ammoSpd,
        dmg: _dmg, radius: _ammoR, color: _ammoColor,
        life: _range / _ammoSpd + 0.15,
        type: 'bullet', wepCat: 'phys',
        pierce: _ammoLv === 1, maxPierce: _ammoLv === 1 ? 9999 : undefined,
        // Element turret mode: randomly assign flame/frost/poison
        element: _tw.elementTurretMode ? (['flame','frost','poison'][Math.floor(Math.random()*3)]) : undefined,
      };
      if (_ammoLv === 2) { // 炸弹: small AoE
        const _d = _dmg;
        proj.onHit = (pr) => { if (!pr._exploded) { pr._exploded = true; triggerExplosion(pr.x, pr.y, 62, Math.round(_d*0.7)); } };
      } else if (_ammoLv === 3) { // 火箭: large AoE + explode on expire
        const _d = _dmg;
        proj.onHit = (pr) => { if (!pr._exploded) { pr._exploded = true; triggerExplosion(pr.x, pr.y, 100, Math.round(_d*0.8)); if(settings.particles) spawnParticles(pr.x,pr.y,['#f84','#fd4','#f44','#fff'],12,130,0.75,4); } };
        proj.onExpire = (pr) => { if (!pr._exploded) { pr._exploded = true; triggerExplosion(pr.x, pr.y, 100, Math.round(_d*0.5)); } };
      }
      gs.projectiles.push(proj);
      if (settings.particles) spawnParticles(t.x, t.y, [_ammoColor, '#fff'], 2, 80, 0.15, 2);
    } else if (t.fireTimer < 0) {
      t.fireTimer = 0;
    }
    return true;
  });

  // ── Mid-wave respawn queue ──
  if (_tw._respawnQueue?.length) {
    const _still = [];
    for (let _i = 0; _i < _tw._respawnQueue.length; _i++) {
      _tw._respawnQueue[_i] -= dt;
      if (_tw._respawnQueue[_i] <= 0) {
        // Only spawn if still under cap (cap may have changed via upgrades)
        if (gs.turrets.length < _maxCount) {
          _addOneTurret(_tw, p);
          addFloatingText('⚙ 炮台已补充!', p.x, p.y-36, '#4af', 1.4);
          if (settings.particles) spawnParticles(p.x, p.y, ['#4af','#8cf','#fff'], 5, 70, 0.4, 3);
        }
        // If already at cap (e.g. another respawn fired earlier), just discard
      } else {
        _still.push(_tw._respawnQueue[_i]);
      }
    }
    _tw._respawnQueue = _still;
  }

  _updateTurretHud();
}

// Update floating texts
function updateFloatingTexts(dt) {
  if (gs.floatingTexts) gs.floatingTexts = gs.floatingTexts.filter(ft => {
    ft.timer -= dt;
    ft.y += ft.vy * dt;
    ft.vy *= 0.88; // decelerate
    return ft.timer > 0;
  });
}

function updateHealCircles(dt) {
  if (!gs.healCircles) return;
  const p = gs.player;
  gs.healCircles = gs.healCircles.filter(c => {
    c.timer -= dt;
    if (c.timer <= 0) return false;
    // Follow player if field hospital
    if (c.follows) { c.x = p.x; c.y = p.y; }
    // Heal player if inside circle
    const dx=p.x-c.x, dy=p.y-c.y;
    if (dx*dx+dy*dy < c.r*c.r) {
      healPlayer(c.healPs * dt);
    }
    // Apply element to enemies inside circle
    if (c.element) {
      c.elemTick -= dt;
      if (c.elemTick <= 0) {
        c.elemTick = 1.0;
        for (const e of gs.enemies) {
          if (e.dead) continue;
          const ex=e.x-c.x, ey=e.y-c.y;
          if (ex*ex+ey*ey < c.r*c.r) {
            if (c.element==='flame')  e.flameStacks  = Math.min(10,(e.flameStacks||0)+1);
            if (c.element==='frost')  e.frostStacks  = Math.min(10,(e.frostStacks||0)+1);
            if (c.element==='poison') e.poisonStacks = Math.min(10,(e.poisonStacks||0)+1);
          }
        }
      }
    }
    return true;
  });
}

function fireSniper(w, stats, p) {
  const tgt = nearestEnemy(p.x, p.y);
  if (!tgt) return;
  const dx = tgt.x - p.x, dy = tgt.y - p.y;
  const d = Math.sqrt(dx*dx+dy*dy)||1;
  const ang = Math.atan2(dy, dx);
  const spd = 650;

  // Dragon shot every 3rd bullet
  if (w.dragonSniper) {
    w.dragonShotCount = (w.dragonShotCount||0) + 1;
    if (w.dragonShotCount >= 3) {
      w.dragonShotCount = 0;
      const dmg = stats.dmg * (1+(w.sniperDmgBonus||0)) * (w.heavySniper?3:1) * (1+(w.growingBonus||0)/100) * (w.alloyBullet?1.5:1) * 8;
      gs.projectiles.push({ x:p.x, y:p.y, vx:Math.cos(ang)*spd, vy:Math.sin(ang)*spd,
        dmg, radius:10, color:'#fd4', life:2.5, type:'bullet', wepCat:'gun', pierce:true, maxPierce:9999, isDragon:true });
      if (settings.particles) spawnParticles(p.x, p.y, ['#fd4','#fa0','#f80'], 12, 120, 0.6, 5);
      return;
    }
  }

  const baseDmg = stats.dmg * (1+(w.sniperDmgBonus||0)) * (w.heavySniper?3:1) * (1+(w.growingBonus||0)/100) * (w.alloyBullet?1.5:1);
  const bulletCount = 1 + (w.sniperExtraBullets||0);
  const maxPierces = w.alloyBullet ? 9999 : 2; // 穿透1次 = 最多打到第2隻

  for (let b = 0; b < bulletCount; b++) {
    const spreadAng = b === 0 ? ang : ang + (b%2===0?1:-1)*Math.ceil(b/2)*0.06;
    gs.projectiles.push({
      x:p.x, y:p.y,
      vx:Math.cos(spreadAng)*spd, vy:Math.sin(spreadAng)*spd,
      dmg:baseDmg, radius:3, color:'#aef', life:2.2, type:'bullet', wepCat:'gun',
      pierce:true, maxPierce:maxPierces,
      splitBullet: w.splitBullet||false,
      wallBounce: w.lvl8Bounce||false,
      isSniper: true,
      reaperKill: w.reaperKill||false,
    });
  }
  if (settings.particles) spawnParticles(p.x, p.y, ['#aef','#fff'], 4, 100, 0.3, 2);
}

function updateWeapons(dt) {
  for (const w of gs.weapons) {
    if (!WEAPON_DEFS[w.id]) continue;
    const def = WEAPON_DEFS[w.id];
    if (def.type === 'orbit' || def.type === 'orbit_book') continue;
    w.timer -= dt;
    if (w.timer>0) continue;
    const stats = weaponStats(w);

    // ── Gatling: burst-fire (8 shots rapid, then rest) ──
    if (w.id === 'gatling') {
      if (w.burstPhase === 'rest' || (w.burstCount||0) <= 0) {
        w.burstCount = 8;
        w.burstPhase = 'firing';
      }
      if (def.fire) def.fire(w, stats, gs.player);
      w.burstCount--;
      const aspdMult = (w.variantMods||[]).includes('aspd') ? 0.82 : 1;
      if (w.burstCount <= 0) {
        w.burstPhase = 'rest';
        w.timer = 1.5 * gs.player.cdMult;   // rest between bursts
      } else {
        w.timer = 0.08 * aspdMult * gs.player.cdMult; // 80ms per shot in burst
      }
      continue;
    }

    let cdBase = stats.cd / 1000;
    if (w.id === 'heal_drone') {
      cdBase = stats.circleCd * (w.cdMultLocal||1);
    }
    if (w.id === 'missile_drone') {
      cdBase = (stats.cd / 1000) * (w.missileCdMult||1);
    }
    // aspd mod reduces CD for shotgun/gatling
    if ((w.variantMods||[]).includes('aspd')) cdBase *= 0.82;
    const sharpenMult = (CLASSES[gs.player.classIdx]?.id === 'blacksmith' && gs.player.sharpenActive) ? 0.6 : 1;
    const santaCdMult = (gs.player.santaCdTimer||0) > 0 ? 0.75 : 1;
    w.timer = cdBase * gs.player.cdMult * sharpenMult * santaCdMult;
    if (def.fire) def.fire(w, stats, gs.player);
  }
}

function updateOrbits(dt) {
  for (const w of gs.weapons) {
    if (!WEAPON_DEFS[w.id]) continue;
    const def = WEAPON_DEFS[w.id];
    if (def.type !== 'orbit' && def.type !== 'orbit_book') continue;
    const stats = weaponStats(w);
    w.angle += dt * (stats.rotSpeed||2.6);
    const p = gs.player;
    const r = stats.radius * getAreaMult(p);
    gs.swordOrbs = gs.swordOrbs || [];
    for (let i=0; i<stats.orbs; i++) {
      const a = w.angle + (i/stats.orbs)*Math.PI*2;
      const ox=p.x+Math.cos(a)*r, oy=p.y+Math.sin(a)*r;
      gs.swordOrbs.push({ x:ox, y:oy, color: stats.color||'#fd4', isBook: def.type==='orbit_book', angle: a });
      // Contact damage
      for (let ei=0; ei<gs.enemies.length; ei++) {
        const e = gs.enemies[ei];
        if (e.dead) continue;
        const dx=ox-e.x, dy=oy-e.y;
        if (dx*dx+dy*dy < (8+e.radius)**2) {
          const key=`${w.id}_${i}_${ei}`;
          if (!w.swordHitTimers[key]||w.swordHitTimers[key]<=0) {
            hitEnemy(e, stats.dmg, false, false, 'phys');
            w.swordHitTimers[key] = 0.45;
            if (settings.particles)
              spawnParticles(ox, oy, stats.color||'#fd4', 2, 80, 0.25, 3);
          }
        }
      }
    }
    for (const k in w.swordHitTimers) w.swordHitTimers[k] -= dt;

    // orbit_book: each orb fires a projectile periodically
    if (def.type === 'orbit_book') {
      if (w.shotTimer === undefined) w.shotTimer = 0;
      w.shotTimer -= dt;
      if (w.shotTimer <= 0) {
        w.shotTimer = (stats.shotCd/1000) * p.cdMult;
        for (let i=0; i<stats.orbs; i++) {
          const a = w.angle + (i/stats.orbs)*Math.PI*2;
          const bx=p.x+Math.cos(a)*r, by=p.y+Math.sin(a)*r;
          const tgt = nearestEnemy(bx, by);
          if (tgt) {
            const dx=tgt.x-bx, dy=tgt.y-by;
            const dd=Math.sqrt(dx*dx+dy*dy)||1;
            gs.projectiles.push({ x:bx, y:by,
              vx:(dx/dd)*240, vy:(dy/dd)*240,
              dmg:stats.shotDmg, radius:4, color:stats.color||'#a4f',
              life:1.5, type:'bullet' });
          }
        }
      }
    }
  }
}

// ═══════════════════════════════════════════════════════
// §11  Projectiles
// ═══════════════════════════════════════════════════════
function triggerExplosion(x, y, radius, dmg) {
  const r2 = radius*radius;
  gs.enemies.forEach(e => {
    if (e.dead) return;
    const dx=e.x-x, dy=e.y-y;
    if (dx*dx+dy*dy<r2) hitEnemy(e, dmg);
  });
  if (settings.particles)
    spawnParticles(x, y, ['#f84','#fd4','#f44','#ff8'], 14, 90, 0.55, 3);
}

function updateProjectiles(dt) {
  const newProjs = [];
  gs.projectiles = gs.projectiles.filter(proj => {
    if (proj.dead) return false;
    proj.life -= dt;
    if (proj.life<=0) {
      if (proj.onExpire) proj.onExpire(proj);
      return false;
    }

    // Homing
    if (proj.homing) {
      const tgt = nearestEnemy(proj.x, proj.y);
      if (tgt) {
        const dx=tgt.x-proj.x, dy=tgt.y-proj.y;
        const d=Math.sqrt(dx*dx+dy*dy)||1;
        proj.vx += (dx/d)*340*dt; proj.vy += (dy/d)*340*dt;
        const spd = Math.sqrt(proj.vx*proj.vx+proj.vy*proj.vy);
        const cap = proj.maxSpd||210;
        if (spd>cap) { proj.vx=proj.vx/spd*cap; proj.vy=proj.vy/spd*cap; }
      }
    }

    proj.x += proj.vx*dt;
    proj.y += proj.vy*dt;

    // Wall bounce for sniper Lv8
    if (proj.wallBounce && !(proj.wallBounced)) {
      if (proj.x < -WORLD_W/2 || proj.x > WORLD_W/2) { proj.vx = -proj.vx; proj.wallBounced = true; }
      if (proj.y < -WORLD_H/2 || proj.y > WORLD_H/2) { proj.vy = -proj.vy; proj.wallBounced = true; }
    }

    // Enemy projectiles: check player collision
    if (proj.fromEnemy) {
      const p2 = gs.player;
      const dx2=proj.x-p2.x, dy2=proj.y-p2.y;
      if (dx2*dx2+dy2*dy2 < (proj.radius+10)**2 && p2.invincible<=0) {
        if (p2.dodgeChance>0 && Math.random()<p2.dodgeChance) {
          spawnParticles(p2.x, p2.y, ['#8af'], 3, 55, 0.3, 2);
        } else if ((p2.btShield||0)>0) {
          p2.btShield--;
          p2.invincible=0.3*(p2.invincMult||1); updateHUD();
          if(settings.particles) spawnParticles(p2.x,p2.y,['#4af','#8cf','#fff'],5,65,0.35,2);
          addFloatingText('🛡 护盾！',p2.x,p2.y-22,'#4af',0.9);
        } else {
          const actualDmg = proj.dmg * (1 - p2.dmgReduction);
          p2.hp -= actualDmg;
          p2.invincible = 0.4 * (p2.invincMult||1);
          if (settings.particles) spawnParticles(p2.x, p2.y, ['#f44','#ca7'], 5, 80, 0.35, 2);
          if (p2.hp<=0) { p2.hp=0; gs.phase='dead'; showDeadScreen(); }
          updateHUD();
        }
        return false;
      }
      return true;
    }

    for (let i=0; i<gs.enemies.length; i++) {
      const e = gs.enemies[i];
      if (e.dead) continue;
      const dx=proj.x-e.x, dy=proj.y-e.y;
      if (dx*dx+dy*dy < (proj.radius+e.radius)**2) {
        if (proj.oneshot) {
          if (e.isBoss) continue; // star passes through bosses harmlessly
          killEnemy(e);
        } else {
          let hitDmg = proj.dmg;
          const _p = gs.player;
          let _projCrit = false;
          if ((_p.critRate||0) > 0 && Math.random() < _p.critRate) {
            hitDmg *= (_p.critDmgMult||1.5);
            _projCrit = true;
          }
          hitEnemy(e, hitDmg, false, _projCrit, proj.wepCat);
          // Reaper instakill (sniper passive)
          if (proj.reaperKill && !e.isBoss && Math.random() < 0.005) {
            killEnemy(e);
          }
        }
        if (proj.slow) e.slowTimer = Math.max(e.slowTimer, proj.slow);
        // Element stacks
        if (proj.element==='flame')  e.flameStacks  = Math.min(10,(e.flameStacks||0)+1);
        if (proj.element==='frost')  e.frostStacks  = Math.min(10,(e.frostStacks||0)+1);
        if (proj.element==='poison') e.poisonStacks = Math.min(10,(e.poisonStacks||0)+1);
        if (proj.onHit) proj.onHit(proj, e);
        // Split bullet (luck-based 0-3 splits)
        if (proj.splitBullet && !proj.isSplitChild) {
          const luck = gs.player.luck || 0;
          const maxSplits = 3;
          const splitChance = Math.min(0.95, 0.1 + luck * 0.008);
          let splits = 0;
          for (let s = 0; s < maxSplits; s++) { if (Math.random() < splitChance) splits++; else break; }
          const spd = Math.sqrt(proj.vx*proj.vx + proj.vy*proj.vy);
          for (let s = 0; s < splits; s++) {
            const ang = Math.random() * Math.PI * 2;
            newProjs.push({ ...proj, dead:false, splitBullet:false, isSplitChild:true,
              dmg: proj.dmg * 0.5, vx: Math.cos(ang)*spd, vy: Math.sin(ang)*spd, life:0.8, radius:3 });
          }
        }
        // Bounce: redirect to next enemy
        if (proj.bounce && (proj.bounceCount||0)>0) {
          const next = gs.enemies.find(o=>!o.dead && o!==e);
          if (next) {
            const bdx=next.x-proj.x, bdy=next.y-proj.y, bd=Math.sqrt(bdx*bdx+bdy*bdy)||1;
            const spd=Math.sqrt(proj.vx*proj.vx+proj.vy*proj.vy);
            newProjs.push({...proj, dead:false, bounceCount:(proj.bounceCount)-1,
              vx:bdx/bd*spd, vy:bdy/bd*spd, life:1.2});
          }
          proj.dead=true; return false;
        }
        // Split: spawn 2 sideways bullets
        if (proj.splitOnHit) {
          const a=Math.atan2(proj.vy,proj.vx), spd=Math.sqrt(proj.vx*proj.vx+proj.vy*proj.vy);
          [a+Math.PI/2, a-Math.PI/2].forEach(ang =>
            newProjs.push({...proj, dead:false, splitOnHit:false,
              vx:Math.cos(ang)*spd, vy:Math.sin(ang)*spd, life:0.7}));
          proj.dead=true; return false;
        }
        if (!proj.pierce) { proj.dead=true; return false; }
        proj.pierced=(proj.pierced||0)+1;
        if (proj.maxPierce && proj.pierced>=proj.maxPierce) { proj.dead=true; return false; }
      }
    }
    return true;
  });
  if (newProjs.length) gs.projectiles.push(...newProjs);
}

// ═══════════════════════════════════════════════════════
// §12  Particles
// ═══════════════════════════════════════════════════════
function updateParticles(dt) {
  for (let i=gs.particles.length-1; i>=0; i--) {
    const pp=gs.particles[i];
    pp.x+=pp.vx*dt; pp.y+=pp.vy*dt;
    pp.vx*=0.87; pp.vy*=0.87;
    pp.life-=dt;
    if (pp.life<=0) gs.particles.splice(i,1);
  }
  for (let i=gs.lightningBolts.length-1; i>=0; i--) {
    gs.lightningBolts[i].life -= dt;
    if (gs.lightningBolts[i].life<=0) gs.lightningBolts.splice(i,1);
  }
}

// ═══════════════════════════════════════════════════════
// §13  Wave completion check
// ═══════════════════════════════════════════════════════
let waveCompleteTriggered = false;

function checkWaveComplete() {
  if (gs.phase!=='playing' || waveCompleteTriggered || gs.wave.spawning) return;
  if (gs.wave.spawnQueue.length>0) return;
  const alive = gs.enemies.filter(e=>!e.dead).length;
  if (alive>0) return;

  waveCompleteTriggered = true;
  const isBoss = BOSS_WAVES.has(gs.wave.num);

  const flash = document.getElementById('wave-clear');
  const _stN = gs.stage||1;
  flash.textContent = isBoss ? `⭐ BOSS 击败！` : (gs.wave.num===30 ? `🏆 第${_stN}关通关！` : `🏆 第${gs.wave.num}波清除！`);
  SFX.play('wave');
  flash.style.display='block';
  flash.style.animation='none';
  void flash.offsetWidth;
  flash.style.animation='waveClear .9s ease forwards';
  setTimeout(()=>{ flash.style.display='none'; }, 950);

  checkAchievements();

  setTimeout(()=>{
    if (!gs || gs.phase!=='playing') return;
    gs.phase = 'upgrading';
    if (gs.wave.num===30) {
      showStageClearScreen();
    } else if (gs.wave.num % 5 === 0) {
      showSuperSupplyScreen();
    } else if (gs.wave.num === 5 && !gs.summonOffered) {
      const _ownedIds = new Set(gs.weapons.map(w => w.id));
      const _hasSummons = Object.keys(WEAPON_DEFS).some(id => WEAPON_DEFS[id].type==='summon' && !_ownedIds.has(id));
      if (_hasSummons) showSummonPickScreen(); else showUpgradeScreen(getUpgradeOptions());
    } else {
      showUpgradeScreen(getUpgradeOptions());
    }
  }, 1000);
}

// ═══════════════════════════════════════════════════════
// §14  Render
// ═══════════════════════════════════════════════════════
function render() {
  ctx.clearRect(0,0,GW,GH);
  ctx.fillStyle='#0d0d1a';
  ctx.fillRect(0,0,GW,GH);

  // World boundary
  ctx.strokeStyle='#334455'; ctx.lineWidth=2;
  ctx.strokeRect(Math.floor(-WORLD_W/2-cam.x), Math.floor(-WORLD_H/2-cam.y), WORLD_W, WORLD_H);
  ctx.strokeStyle='#2a3a4a'; ctx.lineWidth=1;
  ctx.strokeRect(Math.floor(-WORLD_W/2-cam.x)-2, Math.floor(-WORLD_H/2-cam.y)-2, WORLD_W+4, WORLD_H+4);

  // Grid
  ctx.strokeStyle='#161625'; ctx.lineWidth=1;
  const gs2=32;
  const gox=((cam.x%gs2)+gs2)%gs2, goy=((cam.y%gs2)+gs2)%gs2;
  for (let gx=-gox; gx<=GW; gx+=gs2) {
    ctx.beginPath(); ctx.moveTo(gx+.5,0); ctx.lineTo(gx+.5,GH); ctx.stroke();
  }
  for (let gy=-goy; gy<=GH; gy+=gs2) {
    ctx.beginPath(); ctx.moveTo(0,gy+.5); ctx.lineTo(GW,gy+.5); ctx.stroke();
  }

  // Heal circles
  if (gs.healCircles) {
    const nowMs2 = performance.now()/1000;
    gs.healCircles.forEach(c => {
      const fade = Math.min(1, c.timer / 1.5);
      const pulse = 0.25 + 0.15*Math.sin(nowMs2*3);
      const sx=Math.floor(c.x-cam.x), sy=Math.floor(c.y-cam.y);
      // Outer glow ring
      ctx.globalAlpha = fade*(pulse+0.1);
      ctx.strokeStyle = c.element==='flame'?'#f84' : c.element==='frost'?'#8cf' : c.element==='poison'?'#6f4' : '#4f8';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(sx,sy,c.r,0,Math.PI*2); ctx.stroke();
      // Fill
      ctx.globalAlpha = fade*0.10;
      ctx.fillStyle   = c.element==='flame'?'#f84' : c.element==='frost'?'#8cf' : c.element==='poison'?'#6f4' : '#4f8';
      ctx.beginPath(); ctx.arc(sx,sy,c.r,0,Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;
    });
  }

  // Ghost shadows
  if (gs.ghosts?.length) {
    const _now = performance.now()/1000;
    gs.ghosts.forEach(g => {
      const gx=Math.floor(g.x-cam.x), gy=Math.floor(g.y-cam.y);
      const _fa = Math.min(0.55, g.timer * 0.4);
      ctx.globalAlpha = _fa;
      ctx.fillStyle = '#88f';
      ctx.strokeStyle = '#ccf';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(gx, gy, 9, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      // Inner cross
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.globalAlpha = _fa * 0.6;
      ctx.beginPath(); ctx.moveTo(gx-4,gy); ctx.lineTo(gx+4,gy); ctx.moveTo(gx,gy-4); ctx.lineTo(gx,gy+4); ctx.stroke();
      ctx.globalAlpha = 1;
    });
  }

  // Land mines
  if (gs.mines?.length) {
    gs.mines.forEach(m => {
      const mx=Math.floor(m.x-cam.x), my=Math.floor(m.y-cam.y);
      // Body
      ctx.fillStyle='#444'; ctx.strokeStyle='#f44'; ctx.lineWidth=1.5;
      ctx.fillRect(mx-6,my-5,12,10); ctx.strokeRect(mx-6,my-5,12,10);
      // Spike top
      ctx.fillStyle='#f44';
      ctx.beginPath(); ctx.moveTo(mx-3,my-5); ctx.lineTo(mx,my-9); ctx.lineTo(mx+3,my-5); ctx.closePath(); ctx.fill();
      // Blink dot
      const _blink = Math.sin(performance.now()/250) > 0;
      if (_blink) { ctx.fillStyle='#f00'; ctx.beginPath(); ctx.arc(mx,my,2,0,Math.PI*2); ctx.fill(); }
    });
  }


  // Turrets
  if (gs.turrets?.length) {
    const _tAmmoLv = gs.weapons.find(w=>w.id==='turret')?.ammoLevel||0;
    const _tBodyColors   = ['#1e2d3a','#0e1e2a','#2a1510','#200e0e'];
    const _tBorderColors = ['#4af','#4ef','#f84','#f44'];
    const _tBarrelColors = ['#66889a','#446688','#885533','#883333'];
    const _tIcons        = ['⚙','⚡','💣','🚀'];
    const _bodyC   = _tBodyColors[_tAmmoLv];
    const _borderC = _tBorderColors[_tAmmoLv];
    const _barrelC = _tBarrelColors[_tAmmoLv];
    const _icon    = _tIcons[_tAmmoLv];
    gs.turrets.forEach(t => {
      const tx = Math.floor(t.x - cam.x), ty = Math.floor(t.y - cam.y);
      ctx.save();
      ctx.translate(tx, ty);
      // Barrel
      ctx.save();
      ctx.rotate(t.aimAngle);
      ctx.fillStyle = _barrelC;
      ctx.fillRect(0, -2.5, 15, 5);
      ctx.fillStyle = _borderC;
      ctx.fillRect(10, -3, 5, 6);
      ctx.restore();
      // Base body
      ctx.fillStyle = _bodyC;
      ctx.strokeStyle = _borderC;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.restore();
      // Icon label
      ctx.save();
      ctx.font = '9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(_icon, tx, ty);
      ctx.restore();
      // Shield glow ring (defence turret mode)
      if (t.shield) {
        ctx.save();
        ctx.globalAlpha = 0.55 + 0.25*Math.sin(performance.now()/320);
        ctx.strokeStyle = '#4af'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(tx, ty, 11, 0, Math.PI*2); ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.restore();
      }
      // HP bar (below turret)
      if (t.hp !== undefined && t.maxHp > 0) {
        const _pct = Math.max(0, t.hp / t.maxHp);
        const _bw = 22, _bh = 3;
        ctx.fillStyle = '#311';
        ctx.fillRect(tx - _bw/2, ty + 11, _bw, _bh);
        ctx.fillStyle = _pct > 0.5 ? '#4d4' : _pct > 0.25 ? '#fd4' : '#f44';
        ctx.fillRect(tx - _bw/2, ty + 11, _bw * _pct, _bh);
      }
    });
  }

  // Heal turrets (green)
  (gs.healTurrets||[]).forEach(t => {
    const tx=Math.floor(t.x-cam.x), ty=Math.floor(t.y-cam.y);
    ctx.save(); ctx.translate(tx,ty);
    ctx.save(); ctx.rotate(t.aimAngle);
    ctx.fillStyle='#2a5a3a'; ctx.fillRect(0,-2.5,14,5);
    ctx.fillStyle='#4f8'; ctx.fillRect(9,-3,5,6);
    ctx.restore();
    ctx.fillStyle='#0e2a1e'; ctx.strokeStyle='#4f8'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.arc(0,0,9,0,Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.save(); ctx.font='10px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('💚',tx,ty); ctx.restore();
    if (t.shield) {
      ctx.save(); ctx.globalAlpha=0.55+0.25*Math.sin(performance.now()/320);
      ctx.strokeStyle='#4af'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(tx,ty,12,0,Math.PI*2); ctx.stroke();
      ctx.globalAlpha=1; ctx.restore();
    }
    if (t.maxHp>0) {
      const _p=Math.max(0,t.hp/t.maxHp), _bw=22;
      ctx.fillStyle='#122'; ctx.fillRect(tx-11,ty+13,_bw,3);
      ctx.fillStyle=_p>0.5?'#4f8':'#fd4'; ctx.fillRect(tx-11,ty+13,_bw*_p,3);
    }
  });

  // Kamikaze bots (red, moving)
  (gs.kamikazeBots||[]).forEach(b => {
    const bx=Math.floor(b.x-cam.x), by=Math.floor(b.y-cam.y);
    const _blink=Math.sin(performance.now()/180)>0;
    ctx.fillStyle=_blink?'#f44':'#c22'; ctx.strokeStyle='#f84'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.arc(bx,by,7,0,Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.font='8px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('🤖',bx,by); ctx.restore();
    if (b.maxHp>0) {
      const _p=Math.max(0,b.hp/b.maxHp), _bw=18;
      ctx.fillStyle='#311'; ctx.fillRect(bx-9,by+10,_bw,3);
      ctx.fillStyle=_p>0.5?'#f44':'#fd4'; ctx.fillRect(bx-9,by+10,_bw*_p,3);
    }
  });

  // Minigun turrets (gold/orange)
  (gs.minigunTurrets||[]).forEach(t => {
    const tx=Math.floor(t.x-cam.x), ty=Math.floor(t.y-cam.y);
    ctx.save(); ctx.translate(tx,ty);
    ctx.save(); ctx.rotate(t.aimAngle);
    ctx.fillStyle='#4a3a0a'; ctx.fillRect(0,-2,16,4);
    ctx.fillStyle='#fd4'; ctx.fillRect(11,-2.5,5,5);
    ctx.restore();
    ctx.fillStyle='#2a1e08'; ctx.strokeStyle='#fd4'; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.arc(0,0,9,0,Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.restore();
    ctx.save(); ctx.font='9px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('🔫',tx,ty); ctx.restore();
    if (t.shield) {
      ctx.save(); ctx.globalAlpha=0.55+0.25*Math.sin(performance.now()/320);
      ctx.strokeStyle='#4af'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.arc(tx,ty,12,0,Math.PI*2); ctx.stroke();
      ctx.globalAlpha=1; ctx.restore();
    }
    if (t.maxHp>0) {
      const _p=Math.max(0,t.hp/t.maxHp), _bw=22;
      ctx.fillStyle='#211'; ctx.fillRect(tx-11,ty+13,_bw,3);
      ctx.fillStyle=_p>0.5?'#fd4':'#f44'; ctx.fillRect(tx-11,ty+13,_bw*_p,3);
    }
  });

  // Smoke clouds
  (gs.smokeClouds||[]).forEach(sc => {
    if (sc.phase !== 'active') return;
    const fade = Math.min(1, sc.timer / 5.0);
    const sx = Math.floor(sc.x - cam.x), sy = Math.floor(sc.y - cam.y);
    ctx.globalAlpha = fade * 0.45;
    ctx.fillStyle = '#aaa';
    ctx.beginPath(); ctx.arc(sx, sy, sc.radius, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = fade * 0.25;
    ctx.fillStyle = '#ccc';
    ctx.beginPath(); ctx.arc(sx, sy, sc.radius*0.6, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1;
  });

  // Gems
  gs.gems.forEach(gem => {
    drawSprite('gem', Math.floor(gem.x-cam.x-3), Math.floor(gem.y-cam.y-3), 3);
  });

  // Ground drops
  const now = performance.now() / 1000;
  gs.drops.forEach(drop => {
    const def = DROP_DEFS[drop.type];
    if (!def) return;
    drop.bobTimer = (drop.bobTimer||0) + 0.016;
    const bobY = Math.sin(drop.bobTimer * 3) * 2.5;
    const sx = Math.floor(drop.x - cam.x);
    const sy = Math.floor(drop.y - cam.y + bobY);
    const s  = def.size;
    const shape = def.shape || 'rect';

    // Rainbow cycling border
    let borderCol = def.border;
    if (drop.type === 'supply_rainbow') {
      const hue = (now * 120) % 360;
      borderCol = `hsl(${hue},100%,70%)`;
    }

    ctx.save();
    ctx.translate(sx, sy);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(-s/2+2, s/2+1, s, 3);

    ctx.fillStyle = def.color;
    ctx.strokeStyle = borderCol;
    ctx.lineWidth = 2;

    if (shape === 'diamond') {
      // Heart/health: diamond shape
      ctx.beginPath();
      ctx.moveTo(0, -s/2); ctx.lineTo(s/2, 0);
      ctx.lineTo(0, s/2);  ctx.lineTo(-s/2, 0);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle='#fff'; ctx.font=`${s-4}px monospace`; ctx.textAlign='center';
      ctx.fillText('♥', 0, (s-4)*0.38);
    } else if (shape === 'circle') {
      // Bomb: circle
      ctx.beginPath(); ctx.arc(0, 0, s/2, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle='#fff'; ctx.font=`${s-5}px monospace`; ctx.textAlign='center';
      ctx.fillText('💣', 0, (s-5)*0.38);
    } else if (shape === 'star') {
      // XP bottle: 4-point star
      const r1=s/2, r2=s/4;
      ctx.beginPath();
      for (let si=0; si<8; si++) {
        const a = (si*Math.PI/4)-Math.PI/2;
        const r = si%2===0?r1:r2;
        si===0?ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r):ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle='#fff'; ctx.font=`${s-5}px monospace`; ctx.textAlign='center';
      ctx.fillText('★', 0, (s-5)*0.38);
    } else if (shape === 'rect') {
      // Magnet: rounded rect
      ctx.fillRect(-s/2,-s/2,s,s); ctx.strokeRect(-s/2,-s/2,s,s);
      ctx.fillStyle='#fff'; ctx.font=`${s-4}px monospace`; ctx.textAlign='center';
      ctx.fillText('⊕', 0, (s-4)*0.38);
    } else if (shape === 'chest') {
      // Chest body (lower 55%)
      const bh = s*0.55, lh = s*0.48;
      ctx.fillRect(-s/2, -bh/2+bh*0.05, s, bh); ctx.strokeRect(-s/2, -bh/2+bh*0.05, s, bh);
      // Lid (upper part, slightly lighter)
      ctx.fillStyle = borderCol;
      ctx.globalAlpha = 0.55;
      ctx.fillRect(-s/2, -bh/2+bh*0.05-lh*0.55, s, lh*0.55);
      ctx.globalAlpha = 1;
      ctx.strokeRect(-s/2, -bh/2+bh*0.05-lh*0.55, s, lh*0.55);
      // Metal band
      ctx.fillStyle = borderCol; ctx.globalAlpha = 0.8;
      ctx.fillRect(-s/2, -3, s, 4);
      ctx.globalAlpha = 1;
      // Rarity label
      ctx.fillStyle='#fff';
      const rLabel = {supply_green:'G',supply_blue:'B',supply_purple:'P',supply_rainbow:'R'}[drop.type]||'?';
      ctx.font=`bold ${Math.max(7,s/3)}px monospace`; ctx.textAlign='center';
      ctx.fillText(rLabel, 0, s*0.22);
    }

    ctx.restore();
    ctx.textAlign = 'left';
  });

  // Santa gifts
  const _nowSanta = performance.now()/1000;
  (gs.santaGifts||[]).forEach(gift => {
    gift.bobTimer = (gift.bobTimer||0) + 0.016;
    const bob = Math.sin(gift.bobTimer*3)*2.5;
    const sx = Math.floor(gift.x - cam.x), sy = Math.floor(gift.y - cam.y + bob);
    const gcol   = {red:'#c33',blue:'#268',green:'#252',rainbow:'#875'}[gift.type]||'#c33';
    const gborder = {red:'#f55',blue:'#4af',green:'#4f6',rainbow:'#fd4'}[gift.type]||'#f55';
    ctx.save();
    ctx.globalAlpha = gift.timer < 3 ? gift.timer/3 : 1;
    ctx.translate(sx, sy);
    if (gift.type === 'rainbow') {
      ctx.strokeStyle = `hsl(${(_nowSanta*120)%360},100%,65%)`;
    } else {
      ctx.strokeStyle = gborder;
    }
    ctx.fillStyle = gcol; ctx.lineWidth = 2;
    ctx.fillRect(-7,-7,14,14); ctx.strokeRect(-7,-7,14,14);
    ctx.strokeStyle = gborder; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-7,0); ctx.lineTo(7,0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0,-7); ctx.lineTo(0,7); ctx.stroke();
    ctx.fillStyle = gborder;
    ctx.beginPath(); ctx.arc(0,-7,2.5,0,Math.PI*2); ctx.fill();
    ctx.restore();
  });

  // Falling gifts (passive)
  (gs.fallingGifts||[]).forEach(fg => {
    const prog = Math.min(1, fg.fallTimer / fg.totalTime);
    const sx = Math.floor(fg.x - cam.x);
    const sy = Math.floor(fg.y - cam.y - (1-prog)*110);
    const sz = Math.round(10 + prog*16);
    ctx.save();
    ctx.globalAlpha = 0.5 + prog*0.5;
    ctx.translate(sx, sy);
    ctx.fillStyle='#c33'; ctx.strokeStyle='#f55'; ctx.lineWidth=3;
    ctx.fillRect(-sz/2,-sz/2,sz,sz); ctx.strokeRect(-sz/2,-sz/2,sz,sz);
    ctx.lineWidth=2; ctx.strokeStyle='#f88';
    ctx.beginPath(); ctx.moveTo(-sz/2,0); ctx.lineTo(sz/2,0); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0,-sz/2); ctx.lineTo(0,sz/2); ctx.stroke();
    ctx.fillStyle='#f88'; ctx.beginPath(); ctx.arc(0,-sz/2,3,0,Math.PI*2); ctx.fill();
    // Ground shadow
    ctx.globalAlpha = prog*0.3;
    ctx.fillStyle='#000';
    ctx.beginPath(); ctx.ellipse(0, sz/2+4, sz*0.55, 3, 0, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  });

  // Falling missile warning indicators
  if (gs.pendingExplosions) {
    const _nowPe = performance.now()/1000;
    gs.pendingExplosions.forEach(pe => {
      if (!pe.falling) return;
      const sx = Math.floor(pe.x - cam.x), sy = Math.floor(pe.y - cam.y);
      const maxDelay = 0.08 + 5 * 0.12; // max delay range
      const progress = Math.max(0, 1 - pe.timer / Math.max(0.01, maxDelay));
      const alpha = 0.25 + progress * 0.65;
      const r = Math.max(6, pe.radius * 0.75);
      const pulse = 0.85 + 0.15*Math.sin(_nowPe*10 + pe.x);
      // Warning circle fill
      ctx.globalAlpha = alpha * 0.25 * pulse;
      ctx.fillStyle = '#f44';
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI*2); ctx.fill();
      // Warning circle ring
      ctx.globalAlpha = alpha * pulse;
      ctx.strokeStyle = '#f44';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI*2); ctx.stroke();
      // Crosshair lines
      const ch = r * 0.55;
      ctx.beginPath(); ctx.moveTo(sx-ch, sy); ctx.lineTo(sx+ch, sy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(sx, sy-ch); ctx.lineTo(sx, sy+ch); ctx.stroke();
      ctx.globalAlpha = 1;
    });
  }

  // Magnet aura
  if (gs.player.magnetTimer > 0) {
    const px=Math.floor(gs.player.x-cam.x), py=Math.floor(gs.player.y-cam.y);
    ctx.strokeStyle=`rgba(250,140,0,${gs.player.magnetTimer*0.25})`;
    ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(px,py,gs.player.pickupR,0,Math.PI*2); ctx.stroke();
  }

  // Enemies
  gs.enemies.forEach(e => {
    if (e.dead) return;
    const sc=e.scale;
    const rows=SPRITES[e.sprite];
    const _eImg=ENEMY_IMG_MAP[e.sprite];
    const _useImg=_eImg&&_eImg.complete&&_eImg.naturalWidth>0;
    // Maintain natural aspect ratio: use radius*3 as display height, scale width proportionally
    const _iH=_useImg?(e.radius*3|0):0;
    const _iW=_useImg?Math.round(_iH*_eImg.naturalWidth/_eImg.naturalHeight):0;
    const sw=_useImg?_iW:(rows?rows[0].length*sc:16);
    const sh=_useImg?_iH:(rows?rows.length*sc:16);
    const sx=Math.floor(e.x-cam.x-sw/2), sy=Math.floor(e.y-cam.y-sh/2);
    // Slow tint
    if (e.slowTimer>0) { ctx.globalAlpha=0.7; }
    if (_useImg) ctx.drawImage(_eImg, sx, sy, sw, sh);
    else drawSprite(e.sprite, sx, sy, sc);
    ctx.globalAlpha=1;
    // HP bar
    const bw=e.isBoss?50:Math.max(14,sw); const bh=e.isBoss?5:3;
    const bx=Math.floor(e.x-cam.x-bw/2), by=Math.floor(e.y-cam.y-sh/2-bh-2);
    ctx.fillStyle=e.isBoss?'#200':'#200'; ctx.fillRect(bx,by,bw,bh);
    ctx.fillStyle=e.isBoss?'#f44':e.color; ctx.fillRect(bx,by,Math.round(bw*Math.max(0,e.hp/e.maxHp)),bh);
    // Status effect tint + icon
    const sx2=Math.floor(e.x-cam.x), sy2=Math.floor(e.y-cam.y);
    if ((e.flameStacks||0)>0) {
      ctx.fillStyle=`rgba(255,100,0,${Math.min(0.55,e.flameStacks*0.05)})`;
      ctx.beginPath(); ctx.arc(sx2,sy2,e.radius+2,0,Math.PI*2); ctx.fill();
    }
    if ((e.frostStacks||0)>0 || (e.frozenTimer||0)>0) {
      const alpha = e.frozenTimer>0 ? 0.6 : Math.min(0.5,e.frostStacks*0.05);
      ctx.fillStyle=`rgba(100,200,255,${alpha})`;
      ctx.beginPath(); ctx.arc(sx2,sy2,e.radius+2,0,Math.PI*2); ctx.fill();
    }
    if ((e.poisonStacks||0)>0) {
      ctx.fillStyle=`rgba(80,200,80,${Math.min(0.5,e.poisonStacks*0.05)})`;
      ctx.beginPath(); ctx.arc(sx2,sy2,e.radius+2,0,Math.PI*2); ctx.fill();
    }
    // Boss name
    if (e.isBoss && e.name) {
      ctx.fillStyle='#fd4'; ctx.font='7px monospace'; ctx.textAlign='center';
      ctx.fillText(e.name, Math.floor(e.x-cam.x), by-3);
      ctx.textAlign='left';
    }
  });

  // Projectiles
  gs.projectiles.forEach(proj => {
    const sx=Math.floor(proj.x-cam.x), sy=Math.floor(proj.y-cam.y);
    ctx.fillStyle=proj.color||'#fff';
    if (proj.isDragon) {
      ctx.save();
      ctx.translate(Math.floor(proj.x-cam.x), Math.floor(proj.y-cam.y));
      ctx.rotate(Math.atan2(proj.vy, proj.vx));
      ctx.fillStyle = '#fd4';
      ctx.shadowColor = '#fa0'; ctx.shadowBlur = 8;
      ctx.fillRect(-18, -5, 36, 10);
      ctx.shadowBlur = 0;
      ctx.restore();
      return;
    } else if (proj.type==='arrow') {
      const ang=Math.atan2(proj.vy,proj.vx);
      ctx.save(); ctx.translate(sx,sy); ctx.rotate(ang);
      ctx.fillStyle='#fd4'; ctx.fillRect(-8,-1,16,2);
      ctx.fillStyle='#f84'; ctx.fillRect(5,-2,3,4);
      ctx.restore();
    } else if (proj.type==='fireball') {
      ctx.fillStyle='#f84';
      ctx.beginPath(); ctx.arc(sx,sy,proj.radius,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#fd4';
      ctx.beginPath(); ctx.arc(sx-1,sy-1,proj.radius*0.5,0,Math.PI*2); ctx.fill();
    } else if (proj.type==='ice') {
      ctx.fillStyle='#8cf';
      ctx.beginPath(); ctx.arc(sx,sy,proj.radius,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#fff';
      ctx.beginPath(); ctx.arc(sx-1,sy-1,proj.radius*0.4,0,Math.PI*2); ctx.fill();
    } else if (proj.type==='bomb') {
      ctx.fillStyle='#333';
      ctx.beginPath(); ctx.arc(sx,sy,proj.radius,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#888';
      ctx.beginPath(); ctx.arc(sx-2,sy-2,2,0,Math.PI*2); ctx.fill();
    } else if (proj.type==='star_skill') {
      const rot = performance.now()/1000 * 2.8;
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(rot);
      const r1 = proj.radius, r2 = proj.radius * 0.42;
      // Outer glow
      ctx.globalAlpha = 0.35; ctx.fillStyle = '#fd4';
      ctx.beginPath(); ctx.arc(0, 0, r1+5, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;
      // 5-point star
      ctx.fillStyle = '#fd4';
      ctx.beginPath();
      for (let si=0; si<10; si++) {
        const a = (si * Math.PI / 5) - Math.PI/2;
        const r = si%2===0 ? r1 : r2;
        si===0 ? ctx.moveTo(Math.cos(a)*r, Math.sin(a)*r)
               : ctx.lineTo(Math.cos(a)*r, Math.sin(a)*r);
      }
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle='#fff'; ctx.lineWidth=1.5; ctx.stroke();
      ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(0,0,3,0,Math.PI*2); ctx.fill();
      ctx.restore();
    } else if (proj.type==='fish') {
      const ang2 = Math.atan2(proj.vy, proj.vx);
      ctx.save(); ctx.translate(sx,sy); ctx.rotate(ang2);
      // Body
      ctx.fillStyle='#ca7'; ctx.fillRect(-6,-2,10,4);
      // Tail fin
      ctx.fillStyle='#a85';
      ctx.beginPath(); ctx.moveTo(-6,0); ctx.lineTo(-10,-4); ctx.lineTo(-10,4); ctx.closePath(); ctx.fill();
      // Eye
      ctx.fillStyle='#111'; ctx.fillRect(2,-1,2,2);
      ctx.restore();
    } else {
      // Generic bullet: elongated oval in direction of travel
      const _ba = Math.atan2(proj.vy||0, proj.vx||1);
      const _br = proj.radius||4;
      ctx.save(); ctx.translate(sx,sy); ctx.rotate(_ba);
      ctx.beginPath(); ctx.ellipse(0,0,_br*2.2,_br*0.7,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.45)';
      ctx.beginPath(); ctx.ellipse(-_br*0.4,-_br*0.2,_br*0.8,_br*0.3,0,0,Math.PI*2); ctx.fill();
      ctx.restore();
    }
  });

  // Lightning bolts
  gs.lightningBolts.forEach(bolt => {
    const alpha=bolt.life/bolt.maxLife;
    const x1=bolt.x1-cam.x, y1=bolt.y1-cam.y;
    const x2=bolt.x2-cam.x, y2=bolt.y2-cam.y;
    ctx.strokeStyle=`rgba(160,200,255,${alpha*0.4})`; ctx.lineWidth=4;
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    ctx.strokeStyle=`rgba(200,230,255,${alpha})`; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(x1,y1);
    for (let i=1; i<=7; i++) {
      const t=i/7;
      ctx.lineTo(x1+(x2-x1)*t+(Math.random()-.5)*14, y1+(y2-y1)*t+(Math.random()-.5)*14);
    }
    ctx.stroke();
  });

  // Orbit orbs (sword + book)
  (gs.swordOrbs||[]).forEach(orb => {
    const sx=Math.floor(orb.x-cam.x), sy=Math.floor(orb.y-cam.y);
    ctx.fillStyle=(orb.color||'#fd4')+'44';
    ctx.beginPath(); ctx.arc(sx,sy,10,0,Math.PI*2); ctx.fill();
    ctx.save(); ctx.translate(sx,sy); ctx.rotate((orb.angle||0) + Math.PI/2);
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
    ctx.restore();
  });


  // Flying Swords
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

  // Black Tortoise
  renderBlackTortoise(ctx, cam);
  // Drones — orbit the player visually
  if (gs.weapons) {
    let droneIdx = 0;
    gs.weapons.forEach(w => {
      const def = WEAPON_DEFS[w.id];
      if (!def || def.type !== 'drone') return;
      const stats = weaponStats(w);
      const ang = (performance.now()/1000)*1.6 + droneIdx * Math.PI;
      const dr = 26 + droneIdx * 16;
      const dx2 = Math.cos(ang)*dr, dy2 = Math.sin(ang)*dr;
      const dpx = Math.floor(gs.player.x - cam.x + dx2);
      const dpy = Math.floor(gs.player.y - cam.y + dy2);
      const col = stats.color || '#4f4';
      // Rotor arms
      ctx.fillStyle = col+'66';
      ctx.fillRect(dpx-8, dpy-1, 16, 2);
      ctx.fillRect(dpx-1, dpy-8, 2, 16);
      // Body
      ctx.fillStyle = col;
      ctx.fillRect(dpx-4, dpy-4, 8, 8);
      ctx.fillStyle = '#fff';
      ctx.fillRect(dpx-2, dpy-2, 4, 4);
      droneIdx++;
    });
  }

  // Player
  const p = gs.player;
  const _clsId2 = CLASSES[p.classIdx]?.id;
  const _sprMap = {doctor:'player_doctor', mage:'player_mage', scholar:'player_ranger'};
  const spr = _sprMap[_clsId2] || 'player_warrior';

  // Use original PNG images for doctor / mage / reaper
  const _imgSpr = (_clsId2==='doctor'    && IMG_DOCTOR.complete    && IMG_DOCTOR.naturalWidth   ) ? IMG_DOCTOR
                : (_clsId2==='mage'      && IMG_MAGE.complete      && IMG_MAGE.naturalWidth     ) ? IMG_MAGE
                : (_clsId2==='reaper'    && IMG_REAPER.complete     && IMG_REAPER.naturalWidth   ) ? IMG_REAPER
                : (_clsId2==='berserker' && IMG_BERSERKER.complete  && IMG_BERSERKER.naturalWidth) ? IMG_BERSERKER
                : null;
  let pw, ph;
  if (_imgSpr) {
    ph = 28;
    pw = Math.round(_imgSpr.naturalWidth / _imgSpr.naturalHeight * ph);
  } else {
    const prows = SPRITES[spr];
    pw = prows ? prows[0].length*2 : 16;
    ph = prows ? prows.length*2    : 20;
  }

  if (p.invincible<=0||(Math.floor(p.invincible*12)%2===0)) {
    if (_imgSpr) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(_imgSpr, Math.floor(p.x-cam.x-pw/2), Math.floor(p.y-cam.y-ph/2), pw, ph);
    } else {
      drawSprite(spr, Math.floor(p.x-cam.x-pw/2), Math.floor(p.y-cam.y-ph/2), 2);
    }
  }

  // Kirby form label above player
  if (CLASSES[p.classIdx]?.id === 'kirby') {
    const _kfW = getWeapon('kirby_copy');
    if (_kfW?.kirbyForm) {
      const _fLabels = {fire:'🔥火焰', sword:'⚔剑士', thunder:'⚡雷电', ice:'❄冰冻'};
      const _fColors = {fire:'#f84', sword:'#fd4', thunder:'#aaf', ice:'#8ef'};
      const _lbl = _fLabels[_kfW.kirbyForm] || '';
      const _col = _fColors[_kfW.kirbyForm] || '#fff';
      const _px = Math.floor(p.x - cam.x);
      const _py = Math.floor(p.y - cam.y - ph/2 - 8);
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(_px - 18, _py - 7, 36, 9);
      ctx.fillStyle = _col;
      ctx.fillText(_lbl, _px, _py);
      ctx.textAlign = 'left';
    }
  }

  // Particles
  for (const pp of gs.particles) {
    ctx.globalAlpha=Math.max(0,pp.life/pp.maxLife);
    ctx.fillStyle=pp.color;
    ctx.fillRect(Math.floor(pp.x-cam.x-pp.size/2), Math.floor(pp.y-cam.y-pp.size/2), pp.size, pp.size);
  }
  ctx.globalAlpha=1;

  // Floating damage / text numbers
  ctx.textAlign='center';
  for (const ft of (gs.floatingTexts||[])) {
    const alpha = Math.min(1, ft.timer / ft.maxTimer * 2);
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, Math.floor(ft.x - cam.x), Math.floor(ft.y - cam.y));
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';

  // Spawn warning markers (red ✕)
  if (gs.spawnWarnings && gs.spawnWarnings.length>0) {
    for (const _sw of gs.spawnWarnings) {
      const _sx = Math.floor(_sw.x - cam.x);
      const _sy = Math.floor(_sw.y - cam.y);
      const _pulse = 0.55 + 0.45 * Math.sin((_sw.timer) * Math.PI * 6);
      ctx.globalAlpha = _pulse;
      ctx.strokeStyle = '#f00';
      ctx.lineWidth = 2;
      const _r = 7;
      ctx.beginPath();
      ctx.moveTo(_sx - _r, _sy - _r); ctx.lineTo(_sx + _r, _sy + _r);
      ctx.moveTo(_sx + _r, _sy - _r); ctx.lineTo(_sx - _r, _sy + _r);
      ctx.stroke();
      ctx.lineWidth = 1;
    }
    ctx.globalAlpha = 1;
  }

  // Wave announcement text
  if (gs.waveAnnounce && gs.waveAnnounce.timer > 0) {
    const _t = gs.waveAnnounce.timer;
    const _alpha = _t > 1.2 ? 1 : _t / 1.2;
    ctx.globalAlpha = Math.max(0, _alpha);
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    const _tw = ctx.measureText(gs.waveAnnounce.text).width;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(GW/2 - _tw/2 - 10, GH/2 - 22, _tw + 20, 28);
    ctx.fillStyle = gs.waveAnnounce.text.startsWith('☠') ? '#f55' :
                    gs.waveAnnounce.text.startsWith('⚠') ? '#fa0' : '#7ef';
    ctx.fillText(gs.waveAnnounce.text, GW/2, GH/2 - 2);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  }

  // Chest pickup popup
  if (gs.chestPopup && gs.chestPopup.timer > 0) {
    const _cp = gs.chestPopup;
    const TOTAL = 2.0, FADE = 0.3;
    const _alpha = Math.min(1, (TOTAL - _cp.timer) / FADE, _cp.timer / FADE);
    ctx.globalAlpha = Math.max(0, _alpha);
    const _lineH = 20, _padX = 18, _padY = 10;
    const _lines = [null, ..._cp.items]; // null = title row
    const _boxW = 200, _boxH = _padY*2 + 24 + _lines.length * _lineH;
    const _bx = GW/2 - _boxW/2, _by = GH/2 - _boxH/2 - 30;
    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.68)';
    const _r = 8;
    ctx.beginPath();
    ctx.moveTo(_bx+_r,_by); ctx.lineTo(_bx+_boxW-_r,_by);
    ctx.quadraticCurveTo(_bx+_boxW,_by,_bx+_boxW,_by+_r);
    ctx.lineTo(_bx+_boxW,_by+_boxH-_r);
    ctx.quadraticCurveTo(_bx+_boxW,_by+_boxH,_bx+_boxW-_r,_by+_boxH);
    ctx.lineTo(_bx+_r,_by+_boxH); ctx.quadraticCurveTo(_bx,_by+_boxH,_bx,_by+_boxH-_r);
    ctx.lineTo(_bx,_by+_r); ctx.quadraticCurveTo(_bx,_by,_bx+_r,_by);
    ctx.closePath(); ctx.fill();
    // Border
    ctx.strokeStyle = _cp.color; ctx.lineWidth = 1.5; ctx.stroke();
    // Title
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = _cp.color;
    ctx.fillText(_cp.label, GW/2, _by + _padY + 14);
    // Divider
    ctx.strokeStyle = _cp.color + '55'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(_bx+_padX, _by+_padY+22); ctx.lineTo(_bx+_boxW-_padX, _by+_padY+22); ctx.stroke();
    // Items
    ctx.font = '12px monospace'; ctx.fillStyle = '#ddd';
    _cp.items.forEach((item, i) => {
      ctx.fillText(item.icon + ' ' + item.name, GW/2, _by + _padY + 22 + (i+1)*_lineH);
    });
    ctx.textAlign = 'left'; ctx.globalAlpha = 1;
  }

  // Tutorial hint
  if (tutorialTimer>0) {
    tutorialTimer -= 1/60;
    const alpha = Math.min(1, tutorialTimer);
    ctx.globalAlpha=alpha*0.8;
    ctx.fillStyle='rgba(0,0,0,0.5)';
    ctx.fillRect(GW/2-90, GH-30, 180, 20);
    ctx.fillStyle='#eee'; ctx.font='9px monospace'; ctx.textAlign='center';
    ctx.fillText('WASD / 方向键 移动', GW/2, GH-17);
    ctx.textAlign='left'; ctx.globalAlpha=1;
  }

}

// ═══════════════════════════════════════════════════════
// §15  Main game loop
// ═══════════════════════════════════════════════════════
let lastTs = 0;

function gameLoop(ts) {
  const rawDt = Math.min((ts-lastTs)/1000, 0.1);
  lastTs = ts;
  const dt = rawDt * settings.gameSpeed;

  if (gs) {
    if (gs.phase==='playing') {
      // Spawn from queue — with 0.8s warning markers
      if (gs.wave.spawning && gs.wave.spawnQueue.length>0) {
        gs.wave.spawnTimer -= dt;
        if (gs.wave.spawnTimer<=0) {
          gs.wave.spawnTimer = BOSS_WAVES.has(gs.wave.num) ? 0.1 : 0.55;
          const _wEntry = gs.wave.spawnQueue.shift();
          const { ex:_wx, ey:_wy } = calcSpawnPos();
          gs.spawnWarnings.push({ x:_wx, y:_wy, timer:0.8, entry:_wEntry });
          if (gs.wave.spawnQueue.length===0) gs.wave.spawning=false;
        }
      }
      // Update spawn warnings
      if (gs.spawnWarnings && gs.spawnWarnings.length>0) {
        const _p = gs.player;
        const _toKeep = [];
        for (const _sw of gs.spawnWarnings) {
          _sw.timer -= dt;
          if (_sw.timer <= 0) {
            const _dx = _p.x - _sw.x, _dy = _p.y - _sw.y;
            if (_dx*_dx + _dy*_dy < 60*60) {
              // Player too close — retry with new position
              const { ex:_nx, ey:_ny } = calcSpawnPos();
              _toKeep.push({ x:_nx, y:_ny, timer:0.8, entry:_sw.entry });
            } else {
              spawnEnemyAt(_sw.entry, _sw.x, _sw.y);
            }
          } else {
            _toKeep.push(_sw);
          }
        }
        gs.spawnWarnings = _toKeep;
      }

      updatePlayer(dt);
      // Level-up queue: pause wave to show reward screen
      if (gs.player.levelUpQueue > 0) {
        gs.player.levelUpQueue--;
        gs.phase = 'levelup';
        showLevelUpScreen();
      }
      updateEnemies(dt);
      gs.swordOrbs = [];
      updateOrbits(dt);
      updateWeapons(dt);
      updateHealCircles(dt);
      updatePendingExplosions(dt);
      updateKirbyWeapon(dt);
      updateSniperEffects(dt);
      updateFlyingSwords(dt);
      updateBlackTortoise(dt);
      updateSantaGifts(dt);
      updateFallingGifts(dt);
      updateFloatingTexts(dt);
      updateGhosts(dt);
      updateMines(dt);
      updateTurrets(dt);
      updateHealTurrets(dt);
      updateKamikazeBots(dt);
      updateMinigunTurrets(dt);
      updateProjectiles(dt);
      updateParticles(dt);
      gs.wave.timer += dt;
      if (gs.waveAnnounce && gs.waveAnnounce.timer > 0)
        gs.waveAnnounce.timer = Math.max(0, gs.waveAnnounce.timer - dt);
      if (gs.chestPopup && gs.chestPopup.timer > 0)
        gs.chestPopup.timer = Math.max(0, gs.chestPopup.timer - dt);
      updateHUD();
      checkWaveComplete();
    } else if (gs.phase==='upgrading'||gs.phase==='supply'||gs.phase==='dead'||gs.phase==='levelup'||gs.phase==='paused') {
      updateParticles(dt);
    }
    render();
  }
  requestAnimationFrame(gameLoop);
}

