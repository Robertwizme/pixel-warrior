#!/usr/bin/env node
// v071_update.js — v0.7.1
// New stage mode: complete 30 waves → stage clear screen → continue to next stage
// Each new stage multiplies enemy HP/damage (×1.5 per stage) and count (×1.12 per stage)
// Player keeps all weapons and upgrades between stages

const fs = require('fs'), path = require('path');
const HTML = path.join(__dirname, '..', 'index.html');
let h = fs.readFileSync(HTML, 'utf8'), ok = true;

function rep(a, b, label) {
  if (!h.includes(a)) { console.error('FAIL [' + label + ']\n  anchor: ' + a.slice(0,100)); ok = false; return; }
  h = h.replace(a, b);
  console.log('✓', label);
}

// ── 1. gs init: add stage:1 ──
rep(
`    weaponRefreshes: 5,
    _damageTaken: 0,
    _rainbowChests: 0,
  };`,
`    weaponRefreshes: 5,
    stage: 1,
    _damageTaken: 0,
    _rainbowChests: 0,
  };`,
'gs init: stage:1'
);

// ── 2. startWave: apply stage difficulty multiplier ──
rep(
`  const sf = isBoss ? 1 : Math.pow(1.15, num-1);
  const countMult = isBoss ? 1 : (1 + (num-1)*0.06);`,
`  const _stage = gs.stage || 1;
  const stageMult = Math.pow(1.5, _stage-1);
  const sf = isBoss ? 1 : Math.pow(1.15, num-1) * stageMult;
  const countMult = isBoss ? 1 : (1 + (num-1)*0.06) * Math.pow(1.12, _stage-1);`,
'startWave: stage multiplier'
);

// ── 3. checkWaveComplete: wave 30 → showStageClearScreen ──
rep(
`    if (gs.wave.num===30) {
      showVictoryScreen();`,
`    if (gs.wave.num===30) {
      showStageClearScreen();`,
'checkWaveComplete: wave 30 → stage clear'
);

// Also update wave-clear flash text to show stage
rep(
`  flash.textContent = isBoss ? \`⭐ BOSS 击败！\` : \`🏆 第\${gs.wave.num}波清除！\`;`,
`  const _stN = gs.stage||1;
  flash.textContent = isBoss ? \`⭐ BOSS 击败！\` : (gs.wave.num===30 ? \`🏆 第\${_stN}关通关！\` : \`🏆 第\${gs.wave.num}波清除！\`);`,
'wave-clear flash: stage info on wave 30'
);

// ── 4. updateHUD: show stage in wave display ──
rep(
`  document.getElementById('hud-wave').textContent    = \`Wave \${gs.wave.num}/30\`;`,
`  document.getElementById('hud-wave').textContent    = \`S\${gs.stage||1} · \${gs.wave.num}/30波\`;`,
'updateHUD: show stage'
);

// ── 5. o-victory HTML: add id to title + next-stage section + btn-next-stage ──
rep(
`<div class="overlay" id="o-victory">
  <div class="panel" style="max-width:380px;border-color:#fd4">
    <div style="font-size:48px;margin-bottom:8px">🏆</div>
    <div class="victory-title">胜利！通关！</div>
    <div id="victory-stats"></div>
    <div id="victory-coins" style="margin:10px 0;font-size:13px;color:#fd4"></div>
    <div style="margin-top:8px">
      <button class="btn primary" id="btn-victory-retry">🔄 再来一次</button>
      <button class="btn" id="btn-victory-menu">🏠 返回主菜单</button>
    </div>
  </div>
</div>`,
`<div class="overlay" id="o-victory">
  <div class="panel" style="max-width:380px;border-color:#fd4">
    <div style="font-size:48px;margin-bottom:8px">🏆</div>
    <div class="victory-title" id="victory-title">胜利！通关！</div>
    <div id="victory-stats"></div>
    <div id="victory-coins" style="margin:10px 0;font-size:13px;color:#fd4"></div>
    <div id="victory-next-stage" style="display:none;background:#1a0d00;border:1px solid #f84;border-radius:4px;padding:10px;margin-bottom:10px;font-size:11px;color:#f84;text-align:left"></div>
    <div style="margin-top:8px;display:flex;flex-direction:column;gap:7px">
      <button class="btn primary" id="btn-next-stage" style="display:none;padding:11px;font-size:13px;letter-spacing:1px">⚔ 继续挑战 →</button>
      <button class="btn primary" id="btn-victory-retry">🔄 再来一次</button>
      <button class="btn" id="btn-victory-menu">🏠 返回主菜单</button>
    </div>
  </div>
</div>`,
'o-victory HTML: stage clear layout'
);

// ── 6. Replace showVictoryScreen with showStageClearScreen ──
rep(
`function showVictoryScreen() {
  saveBest(); checkAchievements();
  document.getElementById('hud').style.display='none';
  document.getElementById('hud-bot').style.display='none';
  document.getElementById('hud-ingame-btns').style.display='none';
  document.getElementById('victory-stats').innerHTML=\`
    <div class="stat-row">🌊 通关全部 <b style="color:#fd4">30波</b></div>
    <div class="stat-row">💀 击杀: <b style="color:#4ef">\${gs.kills}</b></div>
    <div class="stat-row">⭐ 得分: <b style="color:#4f4">\${gs.score}</b></div>\`;
  const earned = calcCoinsEarned(30, gs.kills);
  addCoins(earned);
  const _xpG=Math.floor(20+30*4+Math.floor(gs.kills/3));
  const _lvB=getPlayerLevel();addPlayerXP(_xpG);const _lvA=getPlayerLevel();
  document.getElementById('victory-coins').innerHTML =
    \`💰 金币: <b>+\${earned}</b>（合计: <b>\${getCoins()}</b>）&nbsp; ✨ 经验: <b style="color:#a4f">+\${_xpG}</b>\`+(_lvA>_lvB?\` <b style="color:#fd4">⬆️ Lv.\${_lvA}</b>\`:'');
  document.getElementById('o-victory').classList.add('active');
}`,
`function showStageClearScreen() {
  const _st = gs.stage || 1;
  saveBest(); checkAchievements();
  try { const _bs=parseInt(localStorage.getItem('pw_best_stage')||'0'); if(_st>_bs) localStorage.setItem('pw_best_stage',_st); } catch(e){}
  document.getElementById('hud').style.display='none';
  document.getElementById('hud-bot').style.display='none';
  document.getElementById('hud-ingame-btns').style.display='none';
  document.getElementById('victory-title').textContent = \`第\${_st}关通关！\`;
  document.getElementById('victory-stats').innerHTML=\`
    <div class="stat-row">🌊 第<b style="color:#fd4">\${_st}</b>关 全部30波通关</div>
    <div class="stat-row">💀 击杀: <b style="color:#4ef">\${gs.kills}</b></div>
    <div class="stat-row">⭐ 得分: <b style="color:#4f4">\${gs.score}</b></div>\`;
  const earned = calcCoinsEarned(30, gs.kills);
  addCoins(earned);
  const _xpG=Math.floor(20+30*4+Math.floor(gs.kills/3));
  const _lvB=getPlayerLevel();addPlayerXP(_xpG);const _lvA=getPlayerLevel();
  document.getElementById('victory-coins').innerHTML =
    \`💰 金币: <b>+\${earned}</b>（合计: <b>\${getCoins()}</b>）&nbsp; ✨ 经验: <b style="color:#a4f">+\${_xpG}</b>\`+(_lvA>_lvB?\` <b style="color:#fd4">⬆️ Lv.\${_lvA}</b>\`:'');
  // Next stage info
  const _ns = _st+1;
  const _hpX = Math.pow(1.5,_ns-1).toFixed(1);
  const _cntX = Math.pow(1.12,_ns-1).toFixed(2);
  document.getElementById('victory-next-stage').style.display='block';
  document.getElementById('victory-next-stage').innerHTML=
    \`<b>第\${_ns}关 · 挑战升级</b><br>敌人HP/伤害 ×\${_hpX} &nbsp;|&nbsp; 数量 ×\${_cntX}<br><span style="color:#fd4;font-size:10px">保留当前全部武器和升级</span>\`;
  const _nb=document.getElementById('btn-next-stage');
  _nb.style.display='block'; _nb.textContent=\`⚔ 继续 → 第\${_ns}关\`;
  document.getElementById('o-victory').classList.add('active');
}
function showVictoryScreen() { showStageClearScreen(); }`,
'showStageClearScreen (replaces showVictoryScreen)'
);

// ── 7. Add startNextStage + wire btn-next-stage (after victory-menu listener) ──
rep(
`document.getElementById('btn-victory-menu').addEventListener('click', ()=>{ showOverlay('o-menu'); renderBestRun(); renderMenuCoins(); });`,
`document.getElementById('btn-victory-menu').addEventListener('click', ()=>{ showOverlay('o-menu'); renderBestRun(); renderMenuCoins(); });
document.getElementById('btn-next-stage').addEventListener('click', ()=>{
  document.getElementById('o-victory').classList.remove('active');
  gs.stage = (gs.stage||1) + 1;
  gs.kills = 0; gs.score = 0;
  waveCompleteTriggered = false;
  showGameScreen();
  startWave(1);
});`,
'btn-next-stage: start next stage'
);

// ── 8. Version bump ──
rep(`const GAME_VERSION = 'v0.7.0';`, `const GAME_VERSION = 'v0.7.1';`, 'version bump');

if (!ok) { console.error('\n❌ failed — NOT writing'); process.exit(1); }
fs.writeFileSync(HTML, h, 'utf8');
console.log('\n✅ Done — v0.7.1, size:', fs.statSync(HTML).size);
