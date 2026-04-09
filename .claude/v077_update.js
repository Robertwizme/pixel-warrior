#!/usr/bin/env node
// v077_update.js — v0.7.7
// 1. Floating damage numbers on every hit
// 2. Summon pool unlocks at wave 5 (was 8)
// 3. Speed +10 for all enemies + all player classes
// 4. XP scaling more aggressive (120 + level*60)
// 5. Gems fly toward player within attraction range + sound + "+xp" text
// 6. New ranged enemy: 弓箭手 (archer) — stays at range, shoots bolts
// 7. Enemy projectiles (fromEnemy) now blocked by Black Tortoise shield
// 8. Weapon upgrade probability: ≥2 weapon cards, ≤1 stat per selection
// 9. Weapon category tags in upgrade cards
// 10. Unique player ID (永久ID, displayed in chat header, stored in Firebase)

const fs = require('fs'), path = require('path');
const HTML = path.join(__dirname, '..', 'index.html');
let h = fs.readFileSync(HTML, 'utf8'), ok = true;

function rep(a, b, label) {
  if (!h.includes(a)) { console.error('FAIL [' + label + ']\n  anchor: ' + a.slice(0,80)); ok = false; return; }
  h = h.replace(a, b);
  console.log('✓', label);
}

// ── 1. Floating damage numbers in hitEnemy ──
rep(
`  enemy.hp -= dmg;
  if (gs.talents.has('vampire') && dmg>0) healPlayer(dmg*0.06);
  if (settings.particles) spawnParticles(enemy.x, enemy.y, '#f84', 4, 80, 0.3, 2);`,
`  enemy.hp -= dmg;
  if (settings.particles && dmg > 0) {
    const _dc=dmg>=300?'#f44':dmg>=100?'#fd4':'#eee';
    addFloatingText(String(Math.round(dmg)),enemy.x+(Math.random()-0.5)*16,enemy.y-8,_dc,0.65);
  }
  if (gs.talents.has('vampire') && dmg>0) healPlayer(dmg*0.06);
  if (settings.particles) spawnParticles(enemy.x, enemy.y, '#f84', 4, 80, 0.3, 2);`,
'hitEnemy: floating damage numbers'
);

// ── 2. Summon pool: wave 8 → wave 5 ──
rep(
`gs.wave.num === 8 && !gs.summonOffered`,
`gs.wave.num === 5 && !gs.summonOffered`,
'summon pool: wave 8 → wave 5'
);

// ── 3a. CLASSES: speed +10 for all ──
rep(
`const CLASSES = [
  { id:'doctor', name:'医生',   hp:120, spd:70,  dmgMult:1.0, areaMult:1.0, cdMult:1.0,
    bonus: p => { p.hpRegen = 5; p.pickupR = 10; p.xpMult = 1; p.healAccum = 0; } },
  { id:'berserker', name:'狂战士', hp:100, spd:70,  dmgMult:1.0, areaMult:1.0, cdMult:1.0,
    bonus: p => { p.hpRegen = 2; p.pickupR = 10; p.xpMult = 1; } },
  { id:'blacksmith', name:'铁匠',  hp:100, spd:70,  dmgMult:1.0, areaMult:1.0, cdMult:1.0,
    bonus: p => { p.hpRegen = 1; p.pickupR = 10; p.xpMult = 1; p.physDmgMult = 1.5; } },
  { id:'mage', name:'法师', hp:100, spd:70, dmgMult:1.0, areaMult:1.0, cdMult:1.0,
    bonus: p => { p.hpRegen = 1; p.pickupR = 10; p.xpMult = 1; p.magicDmgMult = 1.5; } },
  { id:'scholar', name:'博士', hp:100, spd:62, dmgMult:1.0, areaMult:1.0, cdMult:1.0,
    bonus: p => { p.hpRegen = 1; p.pickupR = 10; p.xpMult = 1.5; } },
  { id:'reaper', name:'西蒙·海耶', hp:100, spd:70, dmgMult:1.0, areaMult:1.0, cdMult:0.75,
    bonus: p => { p.hpRegen = 1; p.pickupR = 10; p.xpMult = 1; p.reaperGunMult = 1.5; } },
  { id:'kirby', name:'模仿者', hp:100, spd:70, dmgMult:1.0, areaMult:1.0, cdMult:1.0,
    bonus: p => { p.hpRegen = 1; p.pickupR = 10; p.xpMult = 1; } },
  { id:'santa', name:'圣诞老人', hp:100, spd:70, dmgMult:1.0, areaMult:1.0, cdMult:1.0,
    bonus: p => { p.hpRegen = 1; p.pickupR = 10; p.xpMult = 1; p.luck = 5; } },
  { id:'chosen', name:'天选者', hp:100, spd:70, dmgMult:1.0, areaMult:1.0, cdMult:1.0,
    bonus: p => { p.hpRegen = 1; p.pickupR = 10; p.xpMult = 1; p.luck = (p.luck||0) + 20; } },
];`,
`const CLASSES = [
  { id:'doctor', name:'医生',   hp:120, spd:80,  dmgMult:1.0, areaMult:1.0, cdMult:1.0,
    bonus: p => { p.hpRegen = 5; p.pickupR = 10; p.xpMult = 1; p.healAccum = 0; } },
  { id:'berserker', name:'狂战士', hp:100, spd:80,  dmgMult:1.0, areaMult:1.0, cdMult:1.0,
    bonus: p => { p.hpRegen = 2; p.pickupR = 10; p.xpMult = 1; } },
  { id:'blacksmith', name:'铁匠',  hp:100, spd:80,  dmgMult:1.0, areaMult:1.0, cdMult:1.0,
    bonus: p => { p.hpRegen = 1; p.pickupR = 10; p.xpMult = 1; p.physDmgMult = 1.5; } },
  { id:'mage', name:'法师', hp:100, spd:80, dmgMult:1.0, areaMult:1.0, cdMult:1.0,
    bonus: p => { p.hpRegen = 1; p.pickupR = 10; p.xpMult = 1; p.magicDmgMult = 1.5; } },
  { id:'scholar', name:'博士', hp:100, spd:72, dmgMult:1.0, areaMult:1.0, cdMult:1.0,
    bonus: p => { p.hpRegen = 1; p.pickupR = 10; p.xpMult = 1.5; } },
  { id:'reaper', name:'西蒙·海耶', hp:100, spd:80, dmgMult:1.0, areaMult:1.0, cdMult:0.75,
    bonus: p => { p.hpRegen = 1; p.pickupR = 10; p.xpMult = 1; p.reaperGunMult = 1.5; } },
  { id:'kirby', name:'模仿者', hp:100, spd:80, dmgMult:1.0, areaMult:1.0, cdMult:1.0,
    bonus: p => { p.hpRegen = 1; p.pickupR = 10; p.xpMult = 1; } },
  { id:'santa', name:'圣诞老人', hp:100, spd:80, dmgMult:1.0, areaMult:1.0, cdMult:1.0,
    bonus: p => { p.hpRegen = 1; p.pickupR = 10; p.xpMult = 1; p.luck = 5; } },
  { id:'chosen', name:'天选者', hp:100, spd:80, dmgMult:1.0, areaMult:1.0, cdMult:1.0,
    bonus: p => { p.hpRegen = 1; p.pickupR = 10; p.xpMult = 1; p.luck = (p.luck||0) + 20; } },
];`,
'CLASSES: speed +10'
);

// ── 3b. ENEMY_TYPES: speed +10 + add archer ──
rep(
`const ENEMY_TYPES = {
  slime:    { hp:38,  spd:40,  dmg:7,   xp:8,   radius:6,  sprite:'slime',    color:'#4f4', scale:2 },
  goblin:   { hp:65,  spd:62,  dmg:13,  xp:12,  radius:7,  sprite:'goblin',   color:'#fa4', scale:2 },
  skeleton: { hp:100, spd:44,  dmg:19,  xp:18,  radius:8,  sprite:'skeleton', color:'#ddd', scale:2 },
  bat:      { hp:42,  spd:88,  dmg:11,  xp:14,  radius:5,  sprite:'bat',      color:'#a4f', scale:2 },
  orc:      { hp:195, spd:33,  dmg:28,  xp:30,  radius:10, sprite:'orc',      color:'#f84', scale:2 },
  wolf:     { hp:80,  spd:105, dmg:17,  xp:20,  radius:6,  sprite:'wolf',     color:'#bbb', scale:2 },
  troll:    { hp:360, spd:26,  dmg:48,  xp:50,  radius:13, sprite:'troll',    color:'#8b5', scale:2 },
  demon:    { hp:160, spd:70,  dmg:34,  xp:40,  radius:8,  sprite:'demon',    color:'#f4f', scale:2 },
  boss_10:  { hp:4500,  spd:30, dmg:40, xp:300,  radius:22, sprite:'dragon',  color:'#f44', scale:4, isBoss:true, bossName:'暗影龙王' },
  boss_10_cat: { hp:5000, spd:42, dmg:28, xp:320, radius:22, sprite:'cat_boss', color:'#f84', scale:4, isBoss:true, bossName:'暴食猫王', bossType:'cat' },
  boss_10_dog: { hp:5800, spd:48, dmg:58, xp:320, radius:24, sprite:'dog_boss', color:'#8b5e3c', scale:4, isBoss:true, bossName:'狂野犬王', bossType:'dog' },
  boss_20:  { hp:14000, spd:34, dmg:75, xp:700,  radius:26, sprite:'orc',     color:'#f84', scale:5, isBoss:true, bossName:'熔岩霸主' },
  boss_30:  { hp:38000, spd:38, dmg:130,xp:1500, radius:30, sprite:'dragon',  color:'#a4f', scale:6, isBoss:true, bossName:'虚空领主' },
};`,
`const ENEMY_TYPES = {
  slime:    { hp:38,  spd:50,  dmg:7,   xp:8,   radius:6,  sprite:'slime',    color:'#4f4', scale:2 },
  goblin:   { hp:65,  spd:72,  dmg:13,  xp:12,  radius:7,  sprite:'goblin',   color:'#fa4', scale:2 },
  skeleton: { hp:100, spd:54,  dmg:19,  xp:18,  radius:8,  sprite:'skeleton', color:'#ddd', scale:2 },
  bat:      { hp:42,  spd:98,  dmg:11,  xp:14,  radius:5,  sprite:'bat',      color:'#a4f', scale:2 },
  orc:      { hp:195, spd:43,  dmg:28,  xp:30,  radius:10, sprite:'orc',      color:'#f84', scale:2 },
  wolf:     { hp:80,  spd:115, dmg:17,  xp:20,  radius:6,  sprite:'wolf',     color:'#bbb', scale:2 },
  troll:    { hp:360, spd:36,  dmg:48,  xp:50,  radius:13, sprite:'troll',    color:'#8b5', scale:2 },
  demon:    { hp:160, spd:80,  dmg:34,  xp:40,  radius:8,  sprite:'demon',    color:'#f4f', scale:2 },
  archer:   { hp:70,  spd:52,  dmg:24,  xp:28,  radius:7,  sprite:'archer',   color:'#fc8', scale:2, ranged:true },
  boss_10:  { hp:4500,  spd:40, dmg:40, xp:300,  radius:22, sprite:'dragon',  color:'#f44', scale:4, isBoss:true, bossName:'暗影龙王' },
  boss_10_cat: { hp:5000, spd:52, dmg:28, xp:320, radius:22, sprite:'cat_boss', color:'#f84', scale:4, isBoss:true, bossName:'暴食猫王', bossType:'cat' },
  boss_10_dog: { hp:5800, spd:58, dmg:58, xp:320, radius:24, sprite:'dog_boss', color:'#8b5e3c', scale:4, isBoss:true, bossName:'狂野犬王', bossType:'dog' },
  boss_20:  { hp:14000, spd:44, dmg:75, xp:700,  radius:26, sprite:'orc',     color:'#f84', scale:5, isBoss:true, bossName:'熔岩霸主' },
  boss_30:  { hp:38000, spd:48, dmg:130,xp:1500, radius:30, sprite:'dragon',  color:'#a4f', scale:6, isBoss:true, bossName:'虚空领主' },
};`,
'ENEMY_TYPES: speed +10 + add archer'
);

// ── 4. getWavePlan: inject archers into non-boss waves ≥6 ──
rep(
`  return plans[Math.min(n, 30)] || plans[30];
}`,
`  const _plan = plans[Math.min(n, 30)] || plans[30];
  if (n >= 6 && n !== 10 && n !== 20 && n !== 30 && _plan && !(_plan[0]?.type?.startsWith('boss'))) {
    _plan.push({ type:'archer', count: Math.max(2, Math.floor(n / 4)) });
  }
  return _plan;
}`,
'getWavePlan: inject archers wave 6+'
);

// ── 5. Enemy movement: add ranged enemy branch ──
rep(
`    } else {
      e.x += mdx*e.spd*spdMult*dt;
      e.y += mdy*e.spd*spdMult*dt;
    }

    // ── Boss: cat ranged attack ──`,
`    } else if (e.ranged) {
      // Ranged enemy: maintain distance from player
      const _rPref=175, _rFlee=90;
      const _rMult = dist < _rFlee ? -1.3 : dist > _rPref+60 ? 0.4 : 0;
      e.x += mdx*e.spd*spdMult*_rMult*dt;
      e.y += mdy*e.spd*spdMult*_rMult*dt;
    } else {
      e.x += mdx*e.spd*spdMult*dt;
      e.y += mdy*e.spd*spdMult*dt;
    }

    // ── Boss: cat ranged attack ──`,
'enemy movement: ranged branch'
);

// ── 6. Archer bolt shooting (after cat boss block) ──
rep(
`    }

    // Hard collision separation — enemies cannot overlap`,
`    }
    // ── Ranged enemy: shoot bolt at player ──
    if (e.ranged && !e.dead) {
      e.boltTimer = (e.boltTimer||3.0) - dt;
      if (e.boltTimer <= 0 && dist < 360) {
        e.boltTimer = 2.5;
        gs.projectiles.push({ x:e.x, y:e.y, vx:mdx*210, vy:mdy*210, dmg:e.dmg, radius:5, color:'#fc8', life:1.8, fromEnemy:true, type:'archer_bolt' });
        if (settings.particles) spawnParticles(e.x, e.y, ['#fc8','#f84'], 4, 40, 0.2, 2);
      }
    }

    // Hard collision separation — enemies cannot overlap`,
'archer: shoot bolt via gs.projectiles'
);

// ── 7. fromEnemy projectiles: add shield block ──
rep(
`        if (p2.dodgeChance>0 && Math.random()<p2.dodgeChance) {
          spawnParticles(p2.x, p2.y, ['#8af'], 3, 55, 0.3, 2);
        } else {
          const actualDmg = proj.dmg * (1 - p2.dmgReduction);`,
`        if (p2.dodgeChance>0 && Math.random()<p2.dodgeChance) {
          spawnParticles(p2.x, p2.y, ['#8af'], 3, 55, 0.3, 2);
        } else if ((p2.btShield||0)>0) {
          p2.btShield--;
          p2.invincible=0.3*(p2.invincMult||1); updateHUD();
          if(settings.particles) spawnParticles(p2.x,p2.y,['#4af','#8cf','#fff'],5,65,0.35,2);
          addFloatingText('🛡 护盾！',p2.x,p2.y-22,'#4af',0.9);
        } else {
          const actualDmg = proj.dmg * (1 - p2.dmgReduction);`,
'fromEnemy projectiles: shield support'
);

// ── 8. XP scaling: more aggressive formula ──
rep(
`    p.xpToNext = Math.floor(100 + p.level * 40);`,
`    p.xpToNext = Math.floor(120 + p.level * 60);`,
'XP: more aggressive scaling'
);

// ── 9. Passive gem attraction (added after magnet block) ──
rep(
`  }

  // Auto gem pickup — also awards XP for leveling`,
`  }

  // Passive gem attraction — gems fly toward player within range
  { const _attraR = p.pickupR * 4 + 60, _attraR2 = (_attraR)*(_attraR);
    gs.gems.forEach(g => {
      const _gx=p.x-g.x, _gy=p.y-g.y, _gd2=_gx*_gx+_gy*_gy;
      if (_gd2 < _attraR2 && _gd2 > 0.01) {
        const _gd=Math.sqrt(_gd2);
        const _gspd = 200 + (_attraR - _gd) * 2.5;
        g.x += (_gx/_gd)*_gspd*dt; g.y += (_gy/_gd)*_gspd*dt;
      }
    });
  }

  // Auto gem pickup — also awards XP for leveling`,
'gems: passive attraction range + fly animation'
);

// ── 10. Gem pickup: sound + "+xp" floating text ──
rep(
`  gs.gems = gs.gems.filter(gem => {
    const dx2=gem.x-p.x, dy2=gem.y-p.y;
    if (dx2*dx2+dy2*dy2 < pr2) { awardXp(gem.xp); return false; }
    return true;
  });`,
`  gs.gems = gs.gems.filter(gem => {
    const dx2=gem.x-p.x, dy2=gem.y-p.y;
    if (dx2*dx2+dy2*dy2 < pr2) {
      awardXp(gem.xp);
      SFX.play('click');
      if (settings.particles) addFloatingText('+'+gem.xp+'xp', gem.x, gem.y-10, '#4fa', 0.75);
      return false;
    }
    return true;
  });`,
'gem pickup: sound + xp text'
);

// ── 11. Upgrade probability: ≥2 weapon cards, ≤1 stat ──
rep(
`  // ── Fill cards: owned upgrades first → new weapons → stats ──
  const wUpgShuf = shuffled(upgradePool);
  const wNewShuf = shuffled(newWeapPool);
  const result = [];
  let ui = 0, ni = 0, si = 0;
  for (let i = 0; i < cardCount; i++) {
    if (ui < wUpgShuf.length)      result.push(wUpgShuf[ui++]);
    else if (ni < wNewShuf.length) result.push(wNewShuf[ni++]);
    else if (si < statPool.length) result.push(statPool[si++]);
  }
  return result;`,
`  // ── Fill cards: ≥2 weapon, ≤1 stat (weapon upgrades prioritized) ──
  const wUpgShuf = shuffled(upgradePool);
  const wNewShuf = shuffled(newWeapPool);
  const result = [];
  let ui=0, ni=0, si=0;
  // Fill up to (cardCount-1) weapon slots first
  while (result.length < cardCount-1) {
    if (ui < wUpgShuf.length) result.push(wUpgShuf[ui++]);
    else if (ni < wNewShuf.length) result.push(wNewShuf[ni++]);
    else break;
  }
  // One stat slot (or weapon if no stats)
  if (si < statPool.length) result.push(statPool[si++]);
  else if (ui < wUpgShuf.length) result.push(wUpgShuf[ui++]);
  else if (ni < wNewShuf.length) result.push(wNewShuf[ni++]);
  // Fill remaining (lucky cardCount=4 players)
  while (result.length < cardCount) {
    if (ui < wUpgShuf.length) result.push(wUpgShuf[ui++]);
    else if (ni < wNewShuf.length) result.push(wNewShuf[ni++]);
    else if (si < statPool.length) result.push(statPool[si++]);
    else break;
  }
  return result;`,
'upgrade probability: ≥2 weapon cards'
);

// ── 12. Upgrade card: add weapon category tag ──
rep(
`  card.innerHTML=\`<span class="u-icon">\${opt.icon}</span><div class="u-name">\${opt.name}</div><div class="u-desc">\${opt.desc}</div>\`;`,
`  const _wCats={shotgun:'🔫 枪械',gatling:'🔫 枪械',sniper:'🔫 枪械',black_tortoise:'🐢 召唤',sword:'⚔ 剑类',flying_sword:'⚔ 剑类',heal_drone:'🚁 无人机',missile_drone:'🚁 无人机',arrow_rain:'🏹 箭类'};
  const _wCat=_wCats[opt.weapId||''];
  const _catTag=_wCat?\`<div style="font-size:9px;color:#a88;letter-spacing:0.5px;margin:1px 0 2px">\${_wCat}</div>\`:'';
  card.innerHTML=\`<span class="u-icon">\${opt.icon}</span><div class="u-name">\${opt.name}</div>\${_catTag}<div class="u-desc">\${opt.desc}</div>\`;`,
'upgrade card: weapon category tag'
);

// ── 13. Player unique ID: getPlayerId() function ──
rep(
`function getChatNick(){`,
`function getPlayerId(){
  try{
    let id=localStorage.getItem('pw_player_id');
    if(!id){
      const ch='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      id=Array.from({length:6},()=>ch[Math.floor(Math.random()*ch.length)]).join('');
      localStorage.setItem('pw_player_id',id);
    }
    return id;
  }catch{return'GUEST1';}
}
function getChatNick(){`,
'getPlayerId: unique permanent ID'
);

// ── 14. Chat header HTML: add ID display span ──
rep(
`        <span id="chat-nick-show" style="font-size:13px;color:#4fd;cursor:pointer;font-weight:700" title="点击修改昵称">...</span>`,
`        <span id="chat-nick-show" style="font-size:13px;color:#4fd;cursor:pointer;font-weight:700" title="点击修改昵称">...</span>
        <span id="chat-pid-show" style="font-size:9px;color:#556;background:rgba(255,255,255,0.07);border-radius:3px;padding:1px 6px;font-family:monospace;letter-spacing:1px;cursor:pointer" title="你的唯一ID（点击复制）"></span>`,
'chat header: add ID display span'
);

// ── 15. Initial nick display: also show player ID ──
rep(
`const nickEl=document.getElementById('chat-nick-show');
if(nickEl){
  nickEl.textContent=getChatNick();
  nickEl.addEventListener('click',()=>openProfile(true));`,
`const nickEl=document.getElementById('chat-nick-show');
if(nickEl){
  nickEl.textContent=getChatNick();
  const _initPidEl=document.getElementById('chat-pid-show');
  if(_initPidEl){_initPidEl.textContent='#'+getPlayerId();_initPidEl.onclick=()=>{try{navigator.clipboard.writeText(getPlayerId());}catch{}addFloatingText('ID已复制!',0,0,'#4fd',1.2);};}
  nickEl.addEventListener('click',()=>openProfile(true));`,
'chat init: show player ID'
);

// ── 16. Chat open: refresh ID display ──
rep(
`      document.getElementById('chat-nick-show').textContent=_nick;`,
`      document.getElementById('chat-nick-show').textContent=_nick;
      const _oPidEl=document.getElementById('chat-pid-show');
      if(_oPidEl)_oPidEl.textContent='#'+getPlayerId();`,
'chat open: refresh ID display'
);

// ── 17. _registerNick: store ID→nick in Firebase ──
rep(
`    localStorage.setItem('pw_nick_reg',nick);
  }catch{}
}`,
`    localStorage.setItem('pw_nick_reg',nick);
    try{const _rPid=getPlayerId();await fetch(url+'/ids/'+_rPid+'.json',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({nick,ts:Date.now()})});}catch{}
  }catch{}
}`,
'_registerNick: store ID→nick mapping'
);

// ── 18. Version bump ──
rep(`const GAME_VERSION = 'v0.7.6';`, `const GAME_VERSION = 'v0.7.7';`, 'version bump');

if (!ok) { console.error('\n❌ failed — NOT writing'); process.exit(1); }
fs.writeFileSync(HTML, h, 'utf8');
console.log('\n✅ Done — v0.7.7, size:', fs.statSync(HTML).size);
