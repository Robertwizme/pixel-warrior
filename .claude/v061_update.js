#!/usr/bin/env node
// v061_update.js — v0.6.1
// 1. Fix HUD default skill text (天选之星 → neutral)
// 2. Flying sword auto-added at game start if unlocked from gacha
// 3. Gacha coin weights reduced (50%→20%), more useful rewards
// 4. Topbar: flex-wrap:nowrap + overflow-x:auto (single scrollable row, no second row)
// 5. .btn gets touch-action:manipulation (same as .icon-btn)

const fs = require('fs'), path = require('path');
const HTML = path.join(__dirname, '..', 'index.html');
let h = fs.readFileSync(HTML, 'utf8'), ok = true;

function rep(a, b, label) {
  if (!h.includes(a)) { console.error('FAIL [' + label + ']\n  anchor: ' + a.slice(0,80)); ok = false; return; }
  h = h.replace(a, b);
  console.log('✓', label);
}

// ── 1. .btn: add touch-action:manipulation ──
rep(
`.btn{display:inline-block;padding:9px 22px;margin:5px;background:#1a1a2e;border:2px solid #48f;border-radius:3px;
     color:#eee;font-family:'Courier New',monospace;font-size:13px;cursor:pointer;letter-spacing:1px;
     transition:background .15s,border-color .15s,box-shadow .15s}`,
`.btn{display:inline-block;padding:9px 22px;margin:5px;background:#1a1a2e;border:2px solid #48f;border-radius:3px;
     color:#eee;font-family:'Courier New',monospace;font-size:13px;cursor:pointer;letter-spacing:1px;
     touch-action:manipulation;transition:background .15s,border-color .15s,box-shadow .15s}`,
'.btn: touch-action:manipulation'
);

// ── 2. Topbar: single scrollable row (no wrapping) ──
rep(
`display:flex;justify-content:flex-start;flex-wrap:wrap;align-items:center;gap:6px;padding:6px 10px;background:rgba(0,0,0,0.4);border-bottom:1px solid #1e2030`,
`display:flex;justify-content:flex-start;flex-wrap:nowrap;overflow-x:auto;align-items:center;gap:6px;padding:6px 10px;background:rgba(0,0,0,0.4);border-bottom:1px solid #1e2030`,
'Topbar: nowrap + overflow-x:auto'
);

// ── 3. HUD default skill text ──
rep(
`<div id="hud-skill">⭐ 天选之星 READY</div>`,
`<div id="hud-skill">— 技能 READY —</div>`,
'HUD default skill text'
);

// ── 4. initGame: auto-add flying sword + call updateHUD early ──
rep(
`  waveCompleteTriggered = false;

  // If weapons are defined → show weapon selection before wave 1
  // If no weapons defined → start wave 1 directly
  if (Object.keys(WEAPON_DEFS).length > 0) {
    gs.phase = 'upgrading';
    showStartWeaponScreen();`,
`  waveCompleteTriggered = false;
  // Auto-add flying sword if unlocked via gacha
  if (hasGachaFlyingSword()) addWeapon('flying_sword');
  // Show correct skill in HUD immediately
  updateHUD();

  // If weapons are defined → show weapon selection before wave 1
  // If no weapons defined → start wave 1 directly
  if (Object.keys(WEAPON_DEFS).length > 0) {
    gs.phase = 'upgrading';
    showStartWeaponScreen();`,
'initGame: auto-add flying sword + early updateHUD'
);

// ── 5. Gacha pool: reduce coin weight (50%→20%), boost stats ──
rep(
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
`const GACHA_POOL = [
  { w:12, icon:'🪙', name:'金币 ×120',  apply:()=>{ addCoins(120);  return {rarity:'normal'}; } },
  { w:8,  icon:'🪙', name:'金币 ×300',  apply:()=>{ addCoins(300);  return {rarity:'normal'}; } },
  { w:18, icon:'❤',  name:'最大HP +20', apply:()=>{ if(gs?.player){ gs.player.maxHp+=20; healPlayer(20); } return {rarity:'rare'}; } },
  { w:17, icon:'💪', name:'伤害 +15%',  apply:()=>{ if(gs?.player){ gs.player.dmgMult=+((gs.player.dmgMult||1)*1.15).toFixed(4); } return {rarity:'rare'}; } },
  { w:13, icon:'⏱',  name:'CD -10%',    apply:()=>{ if(gs?.player){ gs.player.cdMult=Math.max(0.2,+((gs.player.cdMult||1)*0.90).toFixed(4)); } return {rarity:'rare'}; } },
  { w:12, icon:'🍀',  name:'幸运 +30',  apply:()=>{ if(gs?.player){ gs.player.luck=(gs.player.luck||0)+30; updateDerivedStats(gs.player); } return {rarity:'epic'}; } },
  { w:15, icon:'🔩', name:'武器碎片 ×3', apply:()=>{ addWeaponFrags(3); return {rarity:'rare'}; } },
  { w:5,  icon:'⚙',  name:'武器碎片 ×10',apply:()=>{ addWeaponFrags(10); return {rarity:'epic'}; } },
];`,
'GACHA_POOL: coins 50%→20%, stat rewards boosted'
);

// ── 6. Version bump ──
rep('v0.6.0', 'v0.6.1', 'version bump');

if (!ok) { console.error('\n❌ failed — NOT writing'); process.exit(1); }
fs.writeFileSync(HTML, h, 'utf8');
console.log('\n✅ Done — v0.6.1, size:', fs.statSync(HTML).size);
