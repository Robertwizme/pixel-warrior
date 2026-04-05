#!/usr/bin/env node
// v060_update.js — v0.6.0
// 1. More coins (calcCoinsEarned + GACHA_POOL amounts)
// 2. Flying sword & dragon can drop with small probability (2%), not just pity
// 3. Weapon fragment system: fragments in gacha pool, forge overlay, enhancement bonus

const fs = require('fs'), path = require('path');
const HTML = path.join(__dirname, '..', 'index.html');
let h = fs.readFileSync(HTML, 'utf8'), ok = true;

function rep(a, b, label) {
  if (!h.includes(a)) { console.error('FAIL [' + label + ']\n  anchor: ' + a.slice(0,80)); ok = false; return; }
  h = h.replace(a, b);
  console.log('✓', label);
}

// ── 1. More coins per game ──
rep(
`function calcCoinsEarned(waveNum, kills) {
  return Math.floor(10 + waveNum * 8 + Math.floor((kills||0)/10));
}`,
`function calcCoinsEarned(waveNum, kills) {
  return Math.floor(60 + waveNum * 30 + Math.floor((kills||0)/4));
}`,
'calcCoinsEarned: more coins'
);

// ── 2. Gacha pool: more coins, add weapon fragments ──
rep(
`const GACHA_POOL = [
  { w:35, icon:'🪙', name:'金币 ×50',   apply:()=>{ addCoins(50); return {rarity:'normal'}; } },
  { w:30, icon:'🪙', name:'金币 ×120',  apply:()=>{ addCoins(120); return {rarity:'normal'}; } },
  { w:12, icon:'❤',  name:'最大HP +20', apply:()=>{ if(gs?.player){ gs.player.maxHp+=20; healPlayer(20); } return {rarity:'rare'}; } },
  { w:10, icon:'💪', name:'伤害 +15%',  apply:()=>{ if(gs?.player){ gs.player.dmgMult=+((gs.player.dmgMult||1)*1.15).toFixed(4); } return {rarity:'rare'}; } },
  { w:8,  icon:'⏱',  name:'CD -10%',    apply:()=>{ if(gs?.player){ gs.player.cdMult=Math.max(0.2,+((gs.player.cdMult||1)*0.90).toFixed(4)); } return {rarity:'rare'}; } },
  { w:5,  icon:'🍀',  name:'幸运 +30',  apply:()=>{ if(gs?.player){ gs.player.luck=(gs.player.luck||0)+30; updateDerivedStats(gs.player); } return {rarity:'epic'}; } },
];`,
`const GACHA_POOL = [
  { w:28, icon:'🪙', name:'金币 ×120',  apply:()=>{ addCoins(120);  return {rarity:'normal'}; } },
  { w:22, icon:'🪙', name:'金币 ×300',  apply:()=>{ addCoins(300);  return {rarity:'normal'}; } },
  { w:11, icon:'❤',  name:'最大HP +20', apply:()=>{ if(gs?.player){ gs.player.maxHp+=20; healPlayer(20); } return {rarity:'rare'}; } },
  { w:10, icon:'💪', name:'伤害 +15%',  apply:()=>{ if(gs?.player){ gs.player.dmgMult=+((gs.player.dmgMult||1)*1.15).toFixed(4); } return {rarity:'rare'}; } },
  { w:7,  icon:'⏱',  name:'CD -10%',    apply:()=>{ if(gs?.player){ gs.player.cdMult=Math.max(0.2,+((gs.player.cdMult||1)*0.90).toFixed(4)); } return {rarity:'rare'}; } },
  { w:5,  icon:'🍀',  name:'幸运 +30',  apply:()=>{ if(gs?.player){ gs.player.luck=(gs.player.luck||0)+30; updateDerivedStats(gs.player); } return {rarity:'epic'}; } },
  { w:12, icon:'🔩', name:'武器碎片 ×3', apply:()=>{ addWeaponFrags(3); return {rarity:'rare'}; } },
  { w:5,  icon:'⚙',  name:'武器碎片 ×10',apply:()=>{ addWeaponFrags(10); return {rarity:'epic'}; } },
];`,
'GACHA_POOL: more coins + weapon fragments'
);

// ── 3. Flying sword: 2% chance per pull + pity ──
rep(
`  const isSwordPull = (!hasSword && pity>=100);`,
`  const isSwordPull = !hasSword && (pity>=100 || Math.random()<0.02);`,
'gachaDraw: 2% flying sword chance'
);

// ── 4. Dragon pet: 2% chance per pull + pity ──
rep(
`  const isDragon = (!has && pity>=100);`,
`  const isDragon = !has && (pity>=100 || Math.random()<0.02);`,
'petGachaDraw: 2% dragon chance'
);

// ── 5. Weapon fragment + enhancement helper functions ──
rep(
`function getGachaPity(){ try{ return Math.max(0,parseInt(localStorage.getItem('pw_gacha_pity')||'0',10)); }catch{ return 0; } }`,
`// ── Weapon Fragment & Enhancement system ──
function getWeaponFrags(){ try{ return Math.max(0,parseInt(localStorage.getItem('pw_wfrags')||'0')||0); }catch{ return 0; } }
function addWeaponFrags(n){ try{ localStorage.setItem('pw_wfrags',String(getWeaponFrags()+n)); renderForgeFragCount(); }catch{} }
function spendWeaponFrags(n){ try{ const c=getWeaponFrags(); if(c<n) return false; localStorage.setItem('pw_wfrags',String(c-n)); renderForgeFragCount(); return true; }catch{ return false; } }
const _WENH_IDS=['shotgun','gatling','sword','arrow_rain','heal_drone','missile_drone','sniper','flying_sword'];
const _WENH_COSTS=[10,25,50,80,120];
const _WENH_MAX=5;
function getWeaponEnhLevel(id){ try{ return Math.max(0,Math.min(_WENH_MAX,parseInt(localStorage.getItem('pw_wenh_'+id)||'0')||0)); }catch{ return 0; } }
function setWeaponEnhLevel(id,lv){ try{ localStorage.setItem('pw_wenh_'+id,String(lv)); }catch{} }
function getTotalWeaponEnhBonus(){ return _WENH_IDS.reduce((s,id)=>s+getWeaponEnhLevel(id),0)*0.08; }
function renderForgeFragCount(){ const el=document.getElementById('forge-frags'); if(el) el.textContent=getWeaponFrags(); }

function getGachaPity(){ try{ return Math.max(0,parseInt(localStorage.getItem('pw_gacha_pity')||'0',10)); }catch{ return 0; } }`,
'Add weapon fragment helpers'
);

// ── 6. Apply weapon enhancement bonus in initGame ──
rep(
`function initGame(classIdx) {
  const cls = CLASSES[classIdx];
  lastClassIdx = classIdx;
  cam = { x:-GW/2, y:-GH/2 };
  tutorialTimer = 5.0;`,
`function initGame(classIdx) {
  const cls = CLASSES[classIdx];
  lastClassIdx = classIdx;
  cam = { x:-GW/2, y:-GH/2 };
  tutorialTimer = 5.0;
  // Weapon enhancement bonus applied at game start
  const _enhBonus = getTotalWeaponEnhBonus();
  if(_enhBonus > 0) setTimeout(()=>{ if(gs?.player) gs.player.weapEnhMult = 1+_enhBonus; },100);`,
'initGame: apply weapon enhancement bonus'
);

// ── 7. hitEnemy: apply weapEnhMult ──
rep(
`  if ((p.chosenLuckDmgMult||1) > 1) mult *= p.chosenLuckDmgMult;`,
`  if ((p.chosenLuckDmgMult||1) > 1) mult *= p.chosenLuckDmgMult;
  if ((p.weapEnhMult||1) > 1) mult *= p.weapEnhMult;`,
'hitEnemy: apply weapEnhMult'
);

// ── 8. Add ⚒ forge button to topbar ──
rep(
`    <button class="btn icon-btn" id="btn-pet" style="border-color:#4f8;color:#4f8" title="宠物">🐾</button>
  </div>`,
`    <button class="btn icon-btn" id="btn-pet" style="border-color:#4f8;color:#4f8" title="宠物">🐾</button>
    <button class="btn icon-btn" id="btn-forge" style="border-color:#fd4;color:#fd4" title="武器强化">⚒</button>
  </div>`,
'Add forge button to topbar'
);

// ── 9. Add forge overlay HTML (after o-pet closing div) ──
rep(
`<!-- GACHA -->`,
`<!-- FORGE -->
<div class="overlay" id="o-forge">
  <div class="panel" style="max-width:440px;width:92%;text-align:center;padding:16px 20px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <div style="font-size:15px;color:#fd4;font-weight:700;letter-spacing:1px">⚒ 武器强化</div>
      <button class="btn" id="btn-forge-back" style="padding:4px 10px;font-size:11px">← 返回</button>
    </div>
    <div style="font-size:11px;color:#888;margin-bottom:12px">
      🔩 武器碎片: <span id="forge-frags" style="color:#fd4;font-weight:700">0</span>
      <span style="color:#555;margin-left:8px">（抽奖池可获得）</span>
    </div>
    <div style="font-size:9px;color:#555;margin-bottom:10px;text-align:left;background:#0d1322;border-radius:6px;padding:6px 10px">
      每级强化提升 <span style="color:#fd4">+8%</span> 全局武器伤害（最高5级 = +40%）
    </div>
    <div id="forge-weapon-list" style="max-height:55vh;overflow-y:auto"></div>
  </div>
</div>

<!-- GACHA -->`,
'Add forge overlay HTML'
);

// ── 10. renderForge + forgeUpgrade functions ──
rep(
`function getGachaPity(){`,
`function renderForge(){
  renderForgeFragCount();
  const frags=getWeaponFrags();
  const WLIST=[
    {id:'shotgun',    icon:'🔫',name:'散弹枪'},
    {id:'gatling',    icon:'⚡',name:'加特林'},
    {id:'sword',      icon:'⚔', name:'剑阵'},
    {id:'arrow_rain', icon:'🏹',name:'箭雨'},
    {id:'heal_drone', icon:'💊',name:'治疗无人机'},
    {id:'missile_drone',icon:'🚀',name:'导弹无人机'},
    {id:'sniper',     icon:'🔭',name:'狙击枪'},
    {id:'flying_sword',icon:'🗡',name:'飞剑'},
  ];
  const list=document.getElementById('forge-weapon-list');
  if(!list) return;
  list.innerHTML=WLIST.map(w=>{
    const lv=getWeaponEnhLevel(w.id);
    const stars='★'.repeat(lv)+'<span style="color:#333">'+'★'.repeat(_WENH_MAX-lv)+'</span>';
    const bonus=Math.round(lv*8)+'%';
    const canUp=lv<_WENH_MAX;
    const cost=canUp?_WENH_COSTS[lv]:0;
    const ok2=frags>=cost;
    return '<div style="display:flex;align-items:center;gap:8px;padding:8px 4px;border-bottom:1px solid #1e2030">'+
      '<span style="font-size:20px">'+w.icon+'</span>'+
      '<div style="flex:1;text-align:left">'+
        '<div style="font-size:11px;color:#eee">'+w.name+' <span style="color:#fd4;font-size:13px">'+stars+'</span></div>'+
        '<div style="font-size:9px;color:#4f8">伤害 +'+bonus+'</div>'+
      '</div>'+
      (canUp
        ?'<button onclick="forgeUpgrade(\''+w.id+'\')" style="padding:5px 10px;font-size:10px;background:#1a1a2e;border:1.5px solid '+(ok2?'#fd4':'#333')+';border-radius:4px;color:'+(ok2?'#fd4':'#555')+';cursor:'+(ok2?'pointer':'default')+';font-family:\'Courier New\',monospace">🔩'+cost+'</button>'
        :'<span style="font-size:10px;color:#4f8;padding:5px 8px;border:1px solid #4f8;border-radius:4px">MAX</span>'
      )+'</div>';
  }).join('');
}

function forgeUpgrade(weapId){
  const lv=getWeaponEnhLevel(weapId);
  if(lv>=_WENH_MAX) return;
  const cost=_WENH_COSTS[lv];
  if(!spendWeaponFrags(cost)){ return; }
  setWeaponEnhLevel(weapId,lv+1);
  renderForge();
}

function getGachaPity(){`,
'Add renderForge + forgeUpgrade functions'
);

// ── 11. Update gacha odds display to include fragments ──
rep(
`      <div style="color:#fd4;margin-top:6px;font-weight:bold">🗡 飞剑 — <span style="color:#fd4">100抽保底</span></div>`,
`      <div style="color:#888;margin-top:6px">🔩 武器碎片 ×3 — <span style="color:#4af">12%</span></div>
      <div style="color:#c8f">⚙ 武器碎片 ×10 — <span style="color:#c8f">5%</span></div>
      <div style="color:#fd4;margin-top:4px;font-weight:bold">🗡 飞剑 — <span style="color:#fd4">2%概率 / 100抽保底</span></div>`,
'Update odds display with fragments and 2% sword'
);

rep(
`      <div style="color:#fd4">🐉 传说宠物(飞龙) — <span style="color:#fd4">100抽保底</span></div>`,
`      <div style="color:#fd4">🐉 传说宠物(飞龙) — <span style="color:#fd4">2%概率 / 100抽保底</span></div>`,
'Update odds: dragon 2%'
);

// ── 12. Wire up forge button event listener ──
rep(
`document.getElementById('btn-pet').addEventListener('click',()=>{ renderPetOverlay(); showOverlay('o-pet'); });`,
`document.getElementById('btn-pet').addEventListener('click',()=>{ renderPetOverlay(); showOverlay('o-pet'); });
document.getElementById('btn-forge').addEventListener('click',()=>{ renderForge(); showOverlay('o-forge'); });
document.getElementById('btn-forge-back').addEventListener('click',()=>showOverlay('o-menu'));`,
'Wire forge button events'
);

// ── 13. Version bump ──
rep('v0.5.9', 'v0.6.0', 'version bump');

if (!ok) { console.error('\n❌ failed — NOT writing'); process.exit(1); }
fs.writeFileSync(HTML, h, 'utf8');
console.log('\n✅ Done — v0.6.0, size:', fs.statSync(HTML).size);
