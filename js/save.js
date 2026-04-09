'use strict';

// ═══════════════════════════════════════════════════════
// §20  Coins + Shop + Character Unlock
// ═══════════════════════════════════════════════════════

// ── Coin helpers ──
function getCoins() {
  try { return parseInt(localStorage.getItem('pw_coins')||'0',10)||0; } catch { return 0; }
}
function saveCoins(n) {
  try { localStorage.setItem('pw_coins', String(Math.max(0,Math.floor(n)))); } catch {}
}
function addCoins(n) {
  saveCoins(getCoins() + n);
  renderMenuCoins();
}
function spendCoins(n) {
  const c = getCoins();
  if (c < n) return false;
  saveCoins(c - n);
  renderMenuCoins();
  return true;
}
function renderMenuCoins() {
  const c = getCoins();
  const el = document.getElementById('menu-coins');
  if (el) el.textContent = c;
  const sel = document.getElementById('shop-coins');
  if (sel) sel.textContent = c;
}

// Coins earned per game: 10 base + 8 per wave + 1 per 10 kills (bonus)
function calcCoinsEarned(waveNum, kills) {
  return Math.floor(60 + waveNum * 30 + Math.floor((kills||0)/4));
}

// ── Unlock helpers ──
// Default unlocked: doctor only (chosen now requires unlock)
const DEFAULT_UNLOCKED = ['doctor'];

function getUnlocked() {
  try {
    const raw = JSON.parse(localStorage.getItem('pw_unlocked')||'null');
    if (Array.isArray(raw)) return new Set(raw);
  } catch {}
  return new Set(DEFAULT_UNLOCKED);
}
function saveUnlocked(set) {
  try { localStorage.setItem('pw_unlocked', JSON.stringify([...set])); } catch {}
}
function unlockClass(id) {
  const s = getUnlocked();
  s.add(id);
  saveUnlocked(s);
}
function isUnlocked(id) {
  return getUnlocked().has(id);
}

// ── Unlock condition definitions per class ──
// condition: { price: coins_cost, condDesc: string, condCheck: fn→bool }
const CLASS_UNLOCK = {
  doctor:    { price: 0,   condDesc: '默认解锁',                            condCheck: ()=>true },
  berserker: { price: 300, condDesc: '或: 在一局中撑过第10波',               condCheck: ()=>{ const b=loadBest(); return b&&b.wave>=10; } },
  blacksmith:{ price: 400, condDesc: '购买即可解锁',                         condCheck: ()=>false },
  mage:      { price: 400, condDesc: '购买即可解锁',                         condCheck: ()=>false },
  scholar:   { price: 500, condDesc: '或: 在一局中撑过第20波',               condCheck: ()=>{ const b=loadBest(); return b&&b.wave>=20; } },
  reaper:    { price: 600, condDesc: '或: 在一局中撑过第25波',               condCheck: ()=>{ const b=loadBest(); return b&&b.wave>=25; } },
  kirby:     { price: 500, condDesc: '或: 一局中击杀500个敌人',              condCheck: ()=>{ const b=loadBest(); return b&&b.kills>=500; } },
  santa:     { price: 0,   condDesc: '仅圣诞节（12月25日）开放',             condCheck: ()=>{ const d=new Date(); return d.getMonth()===11&&d.getDate()===25; } },
  chosen:    { price: 800, condDesc: '或: 通关全部30波',                     condCheck: ()=>{ const b=loadBest(); return b&&b.wave>=30; } },
};

// Auto-unlock via conditions (called when opening shop or starting game)
function autoCheckUnlocks() {
  const unlocked = getUnlocked();
  let changed = false;
  CLASSES.forEach(cls => {
    if (unlocked.has(cls.id)) return;
    const def = CLASS_UNLOCK[cls.id];
    if (def && def.condCheck && def.condCheck()) {
      unlocked.add(cls.id);
      changed = true;
    }
  });
  if (changed) saveUnlocked(unlocked);
}

// ── Class grid: refresh lock states ──
function refreshClsGrid() {
  autoCheckUnlocks();
  document.querySelectorAll('.cls-dot').forEach(dot => {
    const idx = parseInt(dot.id.replace('cls-',''),10);
    const cls = CLASSES[idx];
    if (!cls) return;
    const locked = !isUnlocked(cls.id);
    dot.classList.toggle('locked', locked);
  });
}

// ── Shop render ──
const CLS_ICONS = ['💊','⚔','⚒','🔮','🎓','💀','🌀','🎅','⭐'];
function renderShop() {
  autoCheckUnlocks();
  const coins = getCoins();
  document.getElementById('shop-coins').textContent = coins;
  const list = document.getElementById('shop-list');
  list.innerHTML = CLASSES.map((cls,i) => {
    const def = CLASS_UNLOCK[cls.id] || { price:999, condDesc:'', condCheck:()=>false };
    const already = isUnlocked(cls.id);
    const icon = CLS_ICONS[i] || '❓';
    const isSanta = cls.id === 'santa';
    let btnHtml;
    if (already) {
      btnHtml = `<button class="shop-btn owned" disabled>✓ 已解锁</button>`;
    } else if (isSanta) {
      btnHtml = `<button class="shop-btn" disabled>🎄 限定</button>`;
    } else if (def.price === 0) {
      btnHtml = `<button class="shop-btn owned" disabled>✓ 已解锁</button>`;
    } else {
      const canAfford = coins >= def.price;
      btnHtml = `<button class="shop-btn" ${canAfford?'':'disabled'} onclick="shopBuy('${cls.id}',${def.price})">
        💰 ${def.price} 购买</button>`;
    }
    return `<div class="shop-item ${already?'unlocked':'locked-item'}">
      <div class="shop-icon">${icon}</div>
      <div class="shop-info">
        <div class="shop-name">${cls.name}</div>
        <div class="shop-cond">${def.condDesc}</div>
      </div>
      ${btnHtml}
    </div>`;
  }).join('');
}

function shopBuy(classId, price) {
  if (isUnlocked(classId)) return;
  if (!spendCoins(price)) {
    alert('金币不足！');
    return;
  }
  unlockClass(classId);
  renderShop();
  refreshClsGrid();
}

// ═══════════════════════════════════════════════════════
// §21  Achievements
// ═══════════════════════════════════════════════════════
// reward: { type:'coins', value:N }
const ACHIEVEMENTS = [
  { id:'first_kill', name:'初次击杀',   desc:'击败第一个敌人',                icon:'⚔',  reward:{type:'coins',value:20},  check:()=>gs&&gs.kills>=1 },
  { id:'wave3',      name:'初露锋芒',   desc:'到达第3波',                     icon:'🌱', reward:{type:'coins',value:30},  check:()=>gs&&gs.wave.num>=3 },
  { id:'wave5',      name:'生存大师',   desc:'到达第5波',                     icon:'🌊', reward:{type:'coins',value:50},  check:()=>gs&&gs.wave.num>=5 },
  { id:'wave10',     name:'Boss猎手',   desc:'击败第一个Boss（第10波）',      icon:'🔥', reward:{type:'coins',value:100}, check:()=>gs&&gs.wave.num>=10 },
  { id:'wave15',     name:'无惧先锋',   desc:'到达第15波',                    icon:'⚡', reward:{type:'coins',value:150}, check:()=>gs&&gs.wave.num>=15 },
  { id:'wave20',     name:'传奇勇士',   desc:'击败第二个Boss（第20波）',      icon:'💎', reward:{type:'coins',value:200}, check:()=>gs&&gs.wave.num>=20 },
  { id:'wave25',     name:'末日骑士',   desc:'到达第25波',                    icon:'🌑', reward:{type:'coins',value:300}, check:()=>gs&&gs.wave.num>=25 },
  { id:'wave30',     name:'传奇终结者', desc:'通关全30波',                    icon:'👑', reward:{type:'coins',value:500}, check:()=>gs&&gs.wave.num>=30 },
  { id:'kill50',     name:'小有斩获',   desc:'本局击杀50个敌人',              icon:'🗡', reward:{type:'coins',value:25},  check:()=>gs&&gs.kills>=50 },
  { id:'kill100',    name:'大屠杀',     desc:'本局击杀100个敌人',             icon:'💀', reward:{type:'coins',value:50},  check:()=>gs&&gs.kills>=100 },
  { id:'kill300',    name:'战场霸主',   desc:'本局击杀300个敌人',             icon:'⚰', reward:{type:'coins',value:100}, check:()=>gs&&gs.kills>=300 },
  { id:'kill500',    name:'死神降临',   desc:'本局击杀500个敌人',             icon:'☠',  reward:{type:'coins',value:200}, check:()=>gs&&gs.kills>=500 },
  { id:'lucky100',   name:'幸运儿',     desc:'幸运值达到100',                 icon:'🍀', reward:{type:'coins',value:80},  check:()=>gs&&gs.player.luck>=100 },
  { id:'lucky300',   name:'命运之子',   desc:'幸运值达到300',                 icon:'🌈', reward:{type:'coins',value:200}, check:()=>gs&&gs.player.luck>=300 },
  { id:'dodgemax',   name:'无影幻形',   desc:'闪避率达到50%',                 icon:'👻', reward:{type:'coins',value:100}, check:()=>gs&&gs.player.dodgeChance>=0.5 },
  { id:'armmax',     name:'钢铁意志',   desc:'减伤率达到50%',                 icon:'🛡', reward:{type:'coins',value:100}, check:()=>gs&&gs.player.dmgReduction>=0.5 },
  { id:'talents3',   name:'天赋满载',   desc:'获得3个补给天赋',               icon:'✨', reward:{type:'coins',value:80},  check:()=>gs&&gs.talents&&gs.talents.size>=3 },
  { id:'talents6',   name:'天赋大师',   desc:'获得6个补给天赋',               icon:'🌟', reward:{type:'coins',value:200}, check:()=>gs&&gs.talents&&gs.talents.size>=6 },
  { id:'allweapons', name:'武器大师',   desc:'同时装备5种武器',               icon:'🗡', reward:{type:'coins',value:150}, check:()=>gs&&gs.weapons.length>=5 },
  { id:'level20',    name:'经验老兵',   desc:'达到20级',                      icon:'🎓', reward:{type:'coins',value:120}, check:()=>gs&&gs.player.level>=20 },
  { id:'rainbow',    name:'彩虹收藏家', desc:'本局获得1个彩虹宝箱',           icon:'🌈', reward:{type:'coins',value:60},  check:()=>gs&&(gs._rainbowChests||0)>=1 },
  { id:'nodmg5',     name:'无伤过关',   desc:'前5波不受伤',                   icon:'🛡', reward:{type:'coins',value:80},  check:()=>gs&&gs.wave.num>=5&&(gs._damageTaken||0)===0 },
];

function loadAchievements() {
  try { return JSON.parse(localStorage.getItem('pixelwarrior_ach')||'{}'); } catch { return {}; }
}
function saveAchievements(data) {
  try { localStorage.setItem('pixelwarrior_ach', JSON.stringify(data)); } catch {}
}
function loadAchievementRewards() {
  try { return new Set(JSON.parse(localStorage.getItem('pw_ach_rewards')||'[]')); } catch { return new Set(); }
}
function saveAchievementRewards(set) {
  try { localStorage.setItem('pw_ach_rewards', JSON.stringify([...set])); } catch {}
}
function checkAchievements() {
  const data=loadAchievements(); let changed=false;
  ACHIEVEMENTS.forEach(a=>{ if (!data[a.id]&&a.check()) { data[a.id]=true; changed=true; } });
  if (changed) saveAchievements(data);
}
function renderAchievements() {
  const data = loadAchievements();
  const claimed = loadAchievementRewards();
  document.getElementById('ach-list').innerHTML = ACHIEVEMENTS.map(a => {
    const done = !!data[a.id];
    const rewarded = claimed.has(a.id);
    const rewardStr = a.reward ? `💰 ${a.reward.value} 金币` : '';
    const claimBtn = done && !rewarded && a.reward
      ? `<button class="ach-claim-btn" data-id="${a.id}" style="margin-left:auto;padding:2px 10px;
          background:#1a1400;border:1px solid #fd4;border-radius:3px;color:#fd4;
          font-size:10px;cursor:pointer;font-family:'Courier New',monospace">领取</button>`
      : done && rewarded ? '<span style="margin-left:auto;color:#4f4;font-size:16px">✓</span>'
      : '';
    return `<div class="ach-item ${done?'done':''}">
      <span class="ach-icon">${a.icon}</span>
      <div style="flex:1">
        <div style="font-weight:700;color:${done?'#fd4':'#666'}">${a.name}</div>
        <div class="ach-text">${a.desc}</div>
        ${rewardStr ? `<div style="font-size:9px;color:#a81;margin-top:1px">🏅 奖励: ${rewardStr}</div>` : ''}
      </div>
      ${claimBtn}
    </div>`;
  }).join('');
  // Wire claim buttons
  document.querySelectorAll('.ach-claim-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const ach = ACHIEVEMENTS.find(a => a.id === id);
      if (!ach?.reward) return;
      const c = loadAchievementRewards(); c.add(id); saveAchievementRewards(c);
      if (ach.reward.type === 'coins') addCoins(ach.reward.value);
      renderAchievements();
      renderMenuCoins();
    });
  });
}

// ═══════════════════════════════════════════════════════
// §22  Save / Load best
// ═══════════════════════════════════════════════════════
const BEST_KEY='pixelwarrior_best_v2';

function saveBest() {
  if (!gs) return;
  const best=loadBest();
  if (!best||gs.score>(best.score||0)) {
    try {
      localStorage.setItem(BEST_KEY, JSON.stringify({
        wave:gs.wave.num, kills:gs.kills, score:gs.score,
        className: CLASSES[gs.player.classIdx]?.name||'?',
      }));
    } catch {}
  }
}
function loadBest() {
  try { return JSON.parse(localStorage.getItem(BEST_KEY)); } catch { return null; }
}
function renderBestRun() {
  const best=loadBest();
  const el=document.getElementById('best-run');
  if (best) {
    el.innerHTML=`📊 最高记录 &nbsp;|&nbsp; 职业:<b style="color:#fd4">${best.className}</b> &nbsp;波数:<b>${best.wave}/30</b> &nbsp;击杀:<b>${best.kills}</b> &nbsp;得分:<b style="color:#4f4">${best.score}</b>`;
  } else {
    el.textContent='暂无记录 — 快去创造传奇吧！';
  }
}

