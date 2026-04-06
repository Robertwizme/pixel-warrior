#!/usr/bin/env node
// v070_update.js — v0.7.0
// 1. Wave: 6% more enemies per wave, HP scale 1.12→1.15
// 2. Monster surge: at 50% kills, enemies encircle from all directions
// 3. Max weapon slots 6→8 (more upgrade options in level-up)
// 4. Upgrade UI: click card to select (highlighted), one confirm button
// 5. Weapon level shown as "Lv.X → Lv.X+1" in upgrade cards
// 6. Profile: show in-game weapons + stats section

const fs = require('fs'), path = require('path');
const HTML = path.join(__dirname, '..', 'index.html');
let h = fs.readFileSync(HTML, 'utf8'), ok = true;

function rep(a, b, label) {
  if (!h.includes(a)) { console.error('FAIL [' + label + ']\n  anchor: ' + a.slice(0,100)); ok = false; return; }
  h = h.replace(a, b);
  console.log('✓', label);
}

// ── 1. CSS: add .upg-sel (selected card highlight) ──
rep(
`.upg-card:hover{border-color:#48f;box-shadow:0 0 22px #48fc;transform:translateY(-6px) scale(1.04)}`,
`.upg-card:hover{border-color:#48f;box-shadow:0 0 22px #48fc;transform:translateY(-6px) scale(1.04)}
.upg-card.upg-sel{border-color:#fd4 !important;box-shadow:0 0 24px #fd46 !important;transform:translateY(-6px) scale(1.04)}`,
'CSS: .upg-sel style'
);

// ── 2. o-upgrade HTML: add confirm button ──
rep(
`<div class="overlay" id="o-upgrade">
  <div style="text-align:center">
    <div class="upg-title" id="upg-title">🏆 第1波清除！</div>
    <div class="upg-cards" id="upg-cards"></div>
  </div>
</div>`,
`<div class="overlay" id="o-upgrade">
  <div style="text-align:center">
    <div class="upg-title" id="upg-title">🏆 第1波清除！</div>
    <div class="upg-cards" id="upg-cards"></div>
    <button class="btn primary" id="upg-confirm-btn" style="margin-top:18px;padding:10px 40px;font-size:14px;letter-spacing:2px">✓ 选择</button>
  </div>
</div>`,
'o-upgrade HTML: confirm button'
);

// ── 3. showUpgradeScreen: click-to-select + confirm button ──
rep(
`function showUpgradeScreen(options, extra) {
  document.getElementById('upg-title').textContent =
    gs.wave.num===0 ? '⚔ 选择起始武器' : \`🏆 第\${gs.wave.num}波清除！\`;
  const container = document.getElementById('upg-cards');
  container.innerHTML='';
  options.forEach((opt,idx) => {
    const card = document.createElement('div');
    card.className='upg-card';
    card.style.animationDelay=(idx*0.08)+'s';
    card.innerHTML=\`<span class="u-icon">\${opt.icon}</span><div class="u-name">\${opt.name}</div><div class="u-desc">\${opt.desc}</div>\`;
    card.addEventListener('click',()=>applyUpgrade(opt));
    container.appendChild(card);
  });`,
`let _upgSel = null;
function showUpgradeScreen(options, extra) {
  document.getElementById('upg-title').textContent =
    gs.wave.num===0 ? '⚔ 选择起始武器' : \`🏆 第\${gs.wave.num}波清除！\`;
  const container = document.getElementById('upg-cards');
  container.innerHTML='';
  const midIdx = Math.min(1, options.length-1);
  _upgSel = options[midIdx] ?? options[0];
  options.forEach((opt,idx) => {
    const card = document.createElement('div');
    card.className='upg-card'+(idx===midIdx?' upg-sel':'');
    card.style.animationDelay=(idx*0.08)+'s';
    card.innerHTML=\`<span class="u-icon">\${opt.icon}</span><div class="u-name">\${opt.name}</div><div class="u-desc">\${opt.desc}</div>\`;
    card.addEventListener('click',()=>{
      _upgSel=opt;
      container.querySelectorAll('.upg-card').forEach((c,i)=>c.classList.toggle('upg-sel',i===idx));
    });
    container.appendChild(card);
  });
  document.getElementById('upg-confirm-btn').onclick=()=>{ if(_upgSel) applyUpgrade(_upgSel); };`,
'showUpgradeScreen: click-to-select + confirm button'
);

// ── 4. Weapon upgrade card label: show "Lv.X → Lv.X+1" ──
rep(
`        name:\`升级 \${def.name} → Lv.\${w.level+1}\`, desc:describeWeapon(w.id,w.level+1)`,
`        name:\`\${def.name} Lv.\${w.level}→Lv.\${w.level+1}\`, desc:describeWeapon(w.id,w.level+1)`,
'Weapon upgrade label: Lv.X→Lv.X+1'
);

// ── 5. Max weapon slots 6→8 ──
rep(
`  if (gs.weapons.length < 6) {`,
`  if (gs.weapons.length < 8) {`,
'Max weapons 6→8'
);

// ── 6. startWave: count scaling + HP boost + surge fields ──
rep(
`function startWave(num) {
  gs.wave.num = num;
  const isBoss = BOSS_WAVES.has(num);
  const plan = getWavePlan(num);
  const sf = isBoss ? 1 : Math.pow(1.12, num-1);
  const queue = [];
  plan.forEach(entry => {
    for (let i=0; i<entry.count; i++) queue.push({ type:entry.type, scale:sf, waveNum:num });
  });
  // Shuffle
  for (let i=queue.length-1; i>0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [queue[i],queue[j]] = [queue[j],queue[i]];
  }
  gs.wave.total    = queue.length;
  gs.wave.spawnQueue = queue;
  gs.wave.spawnTimer = 0;
  gs.wave.spawning   = true;
  gs.wave.timer      = 0;
  gs.enemies      = [];
  gs.projectiles  = [];
  gs.healCircles  = [];
  updateHUD();
}`,
`function triggerMonsterSurge() {
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
  const sf = isBoss ? 1 : Math.pow(1.15, num-1);
  const countMult = isBoss ? 1 : (1 + (num-1)*0.06);
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
  updateHUD();
}`,
'triggerMonsterSurge + startWave scaling'
);

// ── 7. killEnemy: track killsThisWave + trigger surge ──
rep(
`  gs.kills++;
  gs.score += Math.floor(enemy.xp * (1 + gs.player.luck*0.002));`,
`  gs.kills++;
  gs.wave.killsThisWave = (gs.wave.killsThisWave||0)+1;
  if (!gs.wave.surgeTriggered && !BOSS_WAVES.has(gs.wave.num) && gs.wave.killsThisWave >= Math.floor(gs.wave.total*0.5) && gs.wave.total>3) triggerMonsterSurge();
  gs.score += Math.floor(enemy.xp * (1 + gs.player.luck*0.002));`,
'killEnemy: surge trigger'
);

// ── 8. Profile HTML: add in-game stats div ──
rep(
`    <button class="btn" id="btn-profile-back" style="width:100%;padding:8px">← 返回</button>
  </div>
</div>

<!-- CHAT -->`,
`    <button class="btn" id="btn-profile-back" style="width:100%;padding:8px">← 返回</button>
    <div id="profile-ingame" style="display:none"></div>
  </div>
</div>

<!-- CHAT -->`,
'Profile: add ingame stats div'
);

// ── 9. openProfile: populate in-game stats ──
rep(
`  _refreshProfileAvatar();
  showOverlay('o-profile');
}`,
`  _refreshProfileAvatar();
  showOverlay('o-profile');
  // In-game stats section
  const _pIg = document.getElementById('profile-ingame');
  if (_pIg) {
    if (gs?.weapons?.length > 0 && gs.player) {
      const p2 = gs.player;
      _pIg.style.display='block';
      _pIg.innerHTML = '<div style="margin-top:14px;border-top:1px solid #334;padding-top:10px;font-size:10px;text-align:left">'
        +'<div style="color:#fd4;font-size:11px;font-weight:700;margin-bottom:6px">⚔ 当前局武器</div>'
        + gs.weapons.map(w=>{const d=WEAPON_DEFS[w.id];return\`<div style="color:#aad;margin-bottom:3px">\${d?.icon||'🔸'} \${d?.name||w.id} <span style="color:#fd4">Lv.\${w.level}</span></div>\`;}).join('')
        +'<div style="color:#fd4;font-size:11px;font-weight:700;margin:8px 0 6px">📊 当前属性</div>'
        +\`<div style="color:#888">❤ 最大HP <span style="color:#4fd;float:right">\${p2.maxHp}</span></div>\`
        +\`<div style="color:#888">💪 伤害倍率 <span style="color:#4fd;float:right">\${(p2.dmgMult*100).toFixed(0)}%</span></div>\`
        +\`<div style="color:#888">⚡ CD倍率 <span style="color:#4fd;float:right">\${(p2.cdMult*100).toFixed(0)}%</span></div>\`
        +\`<div style="color:#888">🍀 幸运 <span style="color:#4fd;float:right">\${p2.luck}</span></div>\`
        +(p2.baseDodge>0?\`<div style="color:#888">💨 闪避 <span style="color:#4fd;float:right">\${(p2.baseDodge*100).toFixed(0)}%</span></div>\`:'')
        +(p2.baseDmgRed>0?\`<div style="color:#888">🛡 减伤 <span style="color:#4fd;float:right">\${(p2.baseDmgRed*100).toFixed(0)}%</span></div>\`:'')
        +'</div>';
    } else { _pIg.style.display='none'; }
  }
}`,
'openProfile: in-game stats'
);

// ── 10. Version bump ──
rep(`const GAME_VERSION = 'v0.6.1';`, `const GAME_VERSION = 'v0.7.0';`, 'version bump');

if (!ok) { console.error('\n❌ failed — NOT writing'); process.exit(1); }
fs.writeFileSync(HTML, h, 'utf8');
console.log('\n✅ Done — v0.7.0, size:', fs.statSync(HTML).size);
