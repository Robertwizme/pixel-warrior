#!/usr/bin/env node
// v075_update.js — v0.7.5
// 1. Gatling damage ~+50% across all levels
// 2. Black Tortoise: embed image as base64 (fixes PNG not showing)
// 3. Black Tortoise: autonomous movement — chase enemies, orbit player
// 4. Summon pool system: wave 8 shows 召唤奖池, summons excluded from regular pools
// 5. Codex: add flying_sword + black_tortoise with special badges
// 6. Changelog: add v0.7.4 + v0.7.5 entries

const fs = require('fs'), path = require('path');
const HTML = path.join(__dirname, '..', 'index.html');
let h = fs.readFileSync(HTML, 'utf8'), ok = true;

function rep(a, b, label) {
  if (!h.includes(a)) { console.error('FAIL [' + label + ']\n  anchor: ' + a.slice(0,100)); ok = false; return; }
  h = h.replace(a, b);
  console.log('✓', label);
}

// ── 0. Embed Black Tortoise.png as base64 ──
const btPng = path.join(__dirname, '..', 'Black Tortoise.png');
const btB64 = fs.readFileSync(btPng).toString('base64');
rep(
`const IMG_BLACK_TORTOISE = new Image();
IMG_BLACK_TORTOISE.src = 'Black Tortoise.png';`,
`const IMG_SRC_BLACK_TORTOISE = 'data:image/png;base64,${btB64}';
const IMG_BLACK_TORTOISE = new Image();
IMG_BLACK_TORTOISE.src = IMG_SRC_BLACK_TORTOISE;`,
'IMG_BLACK_TORTOISE: embed base64'
);

// ── 1. Gatling damage increase (~+50%) ──
rep(
`    levels: [
      {dmg:10, cd:900},
      {dmg:13, cd:880},
      {dmg:16, cd:860},
      {dmg:20, cd:840},
      {dmg:25, cd:820},
      {dmg:31, cd:800},
      {dmg:38, cd:780},
      {dmg:38, cd:780}, // Lv8: dual fire
    ],`,
`    levels: [
      {dmg:16, cd:900},
      {dmg:20, cd:880},
      {dmg:25, cd:860},
      {dmg:31, cd:840},
      {dmg:38, cd:820},
      {dmg:47, cd:800},
      {dmg:56, cd:780},
      {dmg:56, cd:780}, // Lv8: dual fire
    ],`,
'gatling: damage increase'
);

// ── 2. Black Tortoise: autonomous movement ──
rep(
`  const followT=(ent)=>{const tdist=50*sizeMult,dx=p.x-ent.x,dy=p.y-ent.y,d=Math.sqrt(dx*dx+dy*dy)||1;if(d>tdist+30){const spd=Math.min(d*2,80)*dt;ent.x+=(dx/d)*spd;ent.y+=(dy/d)*spd;}if(dx>2)ent.facingRight=true;else if(dx<-2)ent.facingRight=false;};`,
`  const followT=(ent)=>{
    const tgt=nearestEnemy(ent.x,ent.y);
    const ENGAGE=180*sizeMult,STOP=55*sizeMult;
    if(tgt){const dx=tgt.x-ent.x,dy=tgt.y-ent.y,d=Math.sqrt(dx*dx+dy*dy)||1;if(d<ENGAGE&&d>STOP){const spd=65*dt;ent.x+=(dx/d)*spd;ent.y+=(dy/d)*spd;if(dx>1)ent.facingRight=true;else if(dx<-1)ent.facingRight=false;return;}else if(d<=STOP){if(dx>1)ent.facingRight=true;else if(dx<-1)ent.facingRight=false;return;}}
    if(ent._oAng===undefined)ent._oAng=Math.random()*Math.PI*2;
    ent._oAng+=dt*0.7;
    const orbitR=65*sizeMult,ox=p.x+Math.cos(ent._oAng)*orbitR-ent.x,oy=p.y+Math.sin(ent._oAng)*orbitR-ent.y,od=Math.sqrt(ox*ox+oy*oy)||1;
    if(od>12){const spd=Math.min(od*3,85)*dt;ent.x+=(ox/od)*spd;ent.y+=(oy/od)*spd;}
    if(ox>1)ent.facingRight=true;else if(ox<-1)ent.facingRight=false;
  };`,
'btortoise: autonomous movement'
);

// ── 3. showUpgradeScreen: support custom title ──
rep(
`  document.getElementById('upg-title').textContent =
    gs.wave.num===0 ? '⚔ 选择起始武器' : \`🏆 第\${gs.wave.num}波清除！\`;`,
`  document.getElementById('upg-title').textContent =
    (extra && extra._title) ? extra._title :
    gs.wave.num===0 ? '⚔ 选择起始武器' : \`🏆 第\${gs.wave.num}波清除！\`;`,
'showUpgradeScreen: custom title support'
);

// ── 4. showStartWeaponScreen: exclude summon-type weapons ──
rep(
`  const excluded = new Set(['heal_drone', 'kirby_copy', 'flying_sword']);`,
`  const excluded = new Set(
    ['heal_drone','kirby_copy','flying_sword']
      .concat(Object.keys(WEAPON_DEFS).filter(id=>WEAPON_DEFS[id].type==='summon'))
  );`,
'showStartWeaponScreen: exclude summons'
);

// ── 5. getUpgradeOptions: exclude summons from fallback (no weapons yet) ──
rep(
`    return shuffled(Object.keys(WEAPON_DEFS).filter(id => id !== 'kirby_copy' && id !== 'flying_sword')).slice(0,3).map(id => ({`,
`    return shuffled(Object.keys(WEAPON_DEFS).filter(id => id !== 'kirby_copy' && id !== 'flying_sword' && WEAPON_DEFS[id].type !== 'summon')).slice(0,3).map(id => ({`,
'getUpgradeOptions: exclude summons from empty-hand fallback'
);

// ── 6. getUpgradeOptions: exclude summons from new weapon pool ──
rep(
`    shuffled(Object.keys(WEAPON_DEFS).filter(id => !owned.has(id) && id !== 'kirby_copy' && id !== 'flying_sword')).forEach(wid => {`,
`    shuffled(Object.keys(WEAPON_DEFS).filter(id => !owned.has(id) && id !== 'kirby_copy' && id !== 'flying_sword' && WEAPON_DEFS[id].type !== 'summon')).forEach(wid => {`,
'getUpgradeOptions: exclude summons from new-weapon pool'
);

// ── 7. Add showSummonPickScreen before showStartWeaponScreen ──
rep(
`function showStartWeaponScreen() {`,
`function showSummonPickScreen() {
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
function showStartWeaponScreen() {`,
'add showSummonPickScreen'
);

// ── 8. checkWaveComplete: show summon pick at wave 8 ──
rep(
`    } else if (gs.wave.num % 5 === 0) {
      showSuperSupplyScreen();
    } else {
      showUpgradeScreen(getUpgradeOptions());
    }
  }, 1000);
}`,
`    } else if (gs.wave.num % 5 === 0) {
      showSuperSupplyScreen();
    } else if (gs.wave.num === 8 && !gs.summonOffered) {
      const _ownedIds = new Set(gs.weapons.map(w => w.id));
      const _hasSummons = Object.keys(WEAPON_DEFS).some(id => WEAPON_DEFS[id].type==='summon' && !_ownedIds.has(id));
      if (_hasSummons) showSummonPickScreen(); else showUpgradeScreen(getUpgradeOptions());
    } else {
      showUpgradeScreen(getUpgradeOptions());
    }
  }, 1000);
}`,
'checkWaveComplete: summon pick at wave 8'
);

// ── 9. btn-next-stage: reset summonOffered for new stage ──
rep(
`  gs.stage = (gs.stage||1) + 1;
  gs.kills = 0; gs.score = 0;
  waveCompleteTriggered = false;`,
`  gs.stage = (gs.stage||1) + 1;
  gs.kills = 0; gs.score = 0;
  gs.summonOffered = false;
  waveCompleteTriggered = false;`,
'btn-next-stage: reset summonOffered'
);

// ── 10. Codex: add flying_sword + black_tortoise to weapon list ──
rep(
`    el.innerHTML=['shotgun','gatling','sword','arrow_rain','heal_drone','missile_drone','sniper','kirby_copy'].map(k=>{`,
`    el.innerHTML=['shotgun','gatling','sword','arrow_rain','heal_drone','missile_drone','sniper','kirby_copy','flying_sword','black_tortoise'].map(k=>{`,
'codex weapon list: add flying_sword + black_tortoise'
);

// ── 11. Codex: add special badges for flying_sword and black_tortoise ──
rep(
`      const special=k==='kirby_copy'?'<span style="font-size:9px;color:#a4f;margin-left:4px">模仿者专属</span>':'';`,
`      const special=k==='kirby_copy'?'<span style="font-size:9px;color:#a4f;margin-left:4px">模仿者专属</span>':k==='flying_sword'?'<span style="font-size:9px;color:#fd4;margin-left:4px">抽奖限定</span>':k==='black_tortoise'?'<span style="font-size:9px;color:#4af;margin-left:4px">召唤奖池</span>':'';`,
'codex weapon: special badges'
);

// ── 12. _CODEX_WEAPON_META: add flying_sword + black_tortoise entries ──
rep(
`  kirby_copy:{desc:'模仿者专属，可切换火焰/剑士/雷电/冰霜四种形态，灵活多变'},
};`,
`  kirby_copy:{desc:'模仿者专属，可切换火焰/剑士/雷电/冰霜四种形态，灵活多变'},
  flying_sword:{desc:'抽奖池限定获得，4把飞剑起步·暴击×3倍·可叠加元素·8级万剑归宗：穿透+攻速翻倍+扇形锁定+自动返回'},
  black_tortoise:{desc:'召唤奖池（第8波）获得，召唤玄武自主战斗·水球x3每3s·每60s赋予护盾·8级路线：防守/圣水/金身/召唤/守护/蛇咬/威压/真身/不灭功/真·玄武'},
};`,
'_CODEX_WEAPON_META: add flying_sword + black_tortoise'
);

// ── 13. Changelog: add v0.7.5 + v0.7.4 at top ──
rep(
`const CHANGELOG = [
  { version:'v0.5.0', date:'2026-04-04', items:[`,
`const CHANGELOG = [
  { version:'v0.7.5', date:'2026-04-06', items:[
    '加特林伤害大幅提升：Lv1 10→16，全系列约+50%',
    '玄武图像修复：图片已正式嵌入，不再依赖外部文件',
    '玄武自主移动：会主动追击180px内的敌人，无敌时绕玩家轨道游弋',
    '召唤奖池系统：第8波通关后弹出召唤武器专属选择界面',
    '召唤系武器不再出现在起始选择或普通升级池',
    '图鉴新增飞剑与召唤术·玄武词条',
  ]},
  { version:'v0.7.4', date:'2026-04-06', items:[
    '万剑归宗(Lv8)：攻速翻倍(380→760)，飞出350px自动返回玩家身旁',
    '新武器 召唤术·玄武🐢：每10s召唤，每3s射水球x3，每60s护盾',
    '玄武8级升级树：防守/圣水/金身/召唤/守护/蛇咬/威压/真身/不灭/真·玄武',
    '护盾系统：可抵挡一次伤害，玄武守护升至3层',
    '玄武不灭功：致命一击触发3s无敌+伤害×2+回血25%（CD150s）',
  ]},
  { version:'v0.5.0', date:'2026-04-04', items:[`,
'CHANGELOG: add v0.7.4 + v0.7.5'
);

// ── 14. Version bump ──
rep(`const GAME_VERSION = 'v0.7.4';`, `const GAME_VERSION = 'v0.7.5';`, 'version bump');

if (!ok) { console.error('\n❌ failed — NOT writing'); process.exit(1); }
fs.writeFileSync(HTML, h, 'utf8');
console.log('\n✅ Done — v0.7.5, size:', fs.statSync(HTML).size);
