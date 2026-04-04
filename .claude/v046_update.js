#!/usr/bin/env node
// v046_update.js — v0.5.2
// 1. Top bar buttons → icon-only with tooltip
// 2. Embed fox.png as IMG_FOX, draw in-game with left/right flip

const fs   = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const HTML = path.join(ROOT, 'index.html');

let html = fs.readFileSync(HTML, 'utf8');
let ok = true;

function rep(from, to, label) {
  if (!html.includes(from)) { console.error('FAIL [' + label + ']: anchor not found'); ok = false; return; }
  html = html.replace(from, to);
  console.log('✓', label);
}

// ── 1. Embed fox.png as base64 ──
const foxBuf = fs.readFileSync(path.join(ROOT, 'fox.png'));
const foxB64 = foxBuf.toString('base64');
const FOX_SRC = 'data:image/png;base64,' + foxB64;
console.log('fox.png:', foxBuf.length, 'bytes, b64 len:', foxB64.length);

rep(
`IMG_REAPER.src = IMG_SRC_REAPER;`,
`IMG_REAPER.src = IMG_SRC_REAPER;

const IMG_SRC_FOX = '${FOX_SRC}';
const IMG_FOX = new Image();
IMG_FOX.src = IMG_SRC_FOX;`,
'Embed IMG_FOX (fox.png)'
);

// ── 2. Top bar buttons → icon-only ──
rep(
`  <!-- Top button bar -->
  <div id="menu-topbar" style="display:flex;justify-content:center;flex-wrap:wrap;gap:8px;padding:14px 20px;background:rgba(0,0,0,0.4);border-bottom:1px solid #1e2030">
    <button class="btn" id="btn-settings" style="padding:7px 16px;font-size:12px">⚙ 设置</button>
    <button class="btn" id="btn-achieve" style="padding:7px 16px;font-size:12px">🏆 成就</button>
    <button class="btn" id="btn-shop" style="border-color:#fd4;color:#fd4;padding:7px 16px;font-size:12px">🏪 商城</button>
    <button class="btn" id="btn-announce" style="border-color:#f84;color:#f84;padding:7px 16px;font-size:12px">📢 公告</button>
    <button class="btn" id="btn-mailbox" style="border-color:#4ef;color:#4ef;padding:7px 16px;font-size:12px;position:relative">
      📬 邮箱<span id="mail-badge" style="display:none;position:absolute;top:-6px;right:-6px;
        background:#f44;color:#fff;font-size:9px;border-radius:50%;width:16px;height:16px;
        line-height:16px;text-align:center">0</span>
    </button>
    <button class="btn" id="btn-activity" style="border-color:#4fd;color:#4fd;padding:7px 16px;font-size:12px">🎪 活动</button>
    <button class="btn" id="btn-codex" style="border-color:#a4f;color:#a4f;padding:7px 16px;font-size:12px">📖 图鉴</button>
    <button class="btn" id="btn-gacha" style="border-color:#f8a;color:#f8a;padding:7px 16px;font-size:12px">🎰 抽奖</button>
    <button class="btn" id="btn-friends" style="border-color:#4ef;color:#4ef;padding:7px 16px;font-size:12px;position:relative">👥 好友<span id="friend-badge" style="display:none;position:absolute;top:-6px;right:-6px;background:#f84;color:#fff;font-size:9px;border-radius:50%;width:16px;height:16px;line-height:16px;text-align:center">!</span></button>
    <button class="btn" id="btn-pet" style="border-color:#4f8;color:#4f8;padding:7px 16px;font-size:12px">🐾 宠物</button>
  </div>`,
`  <!-- Top button bar -->
  <div id="menu-topbar" style="display:flex;justify-content:center;flex-wrap:wrap;gap:6px;padding:10px 16px;background:rgba(0,0,0,0.4);border-bottom:1px solid #1e2030">
    <button class="btn icon-btn" id="btn-settings" title="设置">⚙️</button>
    <button class="btn icon-btn" id="btn-achieve" title="成就">🏆</button>
    <button class="btn icon-btn" id="btn-shop" style="border-color:#fd4;color:#fd4" title="商城">🏪</button>
    <button class="btn icon-btn" id="btn-announce" style="border-color:#f84;color:#f84" title="公告">📢</button>
    <button class="btn icon-btn" id="btn-mailbox" style="border-color:#4ef;color:#4ef;position:relative" title="邮箱">
      📬<span id="mail-badge" style="display:none;position:absolute;top:-5px;right:-5px;
        background:#f84;color:#fff;font-size:9px;border-radius:50%;width:15px;height:15px;
        line-height:15px;text-align:center">0</span>
    </button>
    <button class="btn icon-btn" id="btn-activity" style="border-color:#4fd;color:#4fd" title="活动">🎪</button>
    <button class="btn icon-btn" id="btn-codex" style="border-color:#a4f;color:#a4f" title="图鉴">📖</button>
    <button class="btn icon-btn" id="btn-gacha" style="border-color:#f8a;color:#f8a" title="抽奖">🎰</button>
    <button class="btn icon-btn" id="btn-friends" style="border-color:#4ef;color:#4ef;position:relative" title="好友">👥<span id="friend-badge" style="display:none;position:absolute;top:-5px;right:-5px;background:#f84;color:#fff;font-size:9px;border-radius:50%;width:15px;height:15px;line-height:15px;text-align:center">!</span></button>
    <button class="btn icon-btn" id="btn-pet" style="border-color:#4f8;color:#4f8" title="宠物">🐾</button>
  </div>`,
'Top bar buttons → icon-only'
);

// ── 3. Add .icon-btn CSS ──
rep(
`.btn:hover{background:#48f3;border-color:#8af;box-shadow:0 0 12px #48f8}`,
`.btn:hover{background:#48f3;border-color:#8af;box-shadow:0 0 12px #48f8}
.icon-btn{padding:7px 10px;font-size:18px;min-width:40px;line-height:1;letter-spacing:0}`,
'Add .icon-btn CSS'
);

// ── 4. Track pet facing direction in updatePet ──
// When pet moves toward enemy (or player), record horizontal direction
rep(
`  if (tgt) {
    // Chase enemy
    const edx = tgt.x - pet.x, edy = tgt.y - pet.y;
    const ed = Math.sqrt(edx*edx + edy*edy) || 1;
    const stopDist = (tgt.radius || 8) + 10;
    if (ed > stopDist) {
      pet.x += (edx/ed) * Math.min(ed - stopDist, petSpd * dt);
      pet.y += (edy/ed) * Math.min(ed - stopDist, petSpd * dt);
    }
  } else {`,
`  if (tgt) {
    // Chase enemy
    const edx = tgt.x - pet.x, edy = tgt.y - pet.y;
    const ed = Math.sqrt(edx*edx + edy*edy) || 1;
    const stopDist = (tgt.radius || 8) + 10;
    if (ed > stopDist) {
      pet.x += (edx/ed) * Math.min(ed - stopDist, petSpd * dt);
      pet.y += (edy/ed) * Math.min(ed - stopDist, petSpd * dt);
    }
    if (edx !== 0) pet.facing = edx > 0 ? 1 : -1;
  } else {`,
'Track pet facing direction when chasing'
);

// ── 5. Rewrite renderPet to use IMG_FOX with flip ──
rep(
`function renderPet(ctx, cam){
  const petId = (typeof gs!=='undefined' && gs.player) ? (gs.player.activePet||'') : '';
  if(!petId || !gs?.petState) return;
  const def=PET_DEFS[petId];
  if(!def) return;
  const sx=Math.floor(gs.petState.x-cam.x), sy=Math.floor(gs.petState.y-cam.y);
  // Glow
  ctx.globalAlpha=0.3; ctx.fillStyle=def.color;
  ctx.beginPath(); ctx.arc(sx,sy,14,0,Math.PI*2); ctx.fill();
  ctx.globalAlpha=1;
  // Pet icon
  ctx.font='18px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(def.icon, sx, sy);
  ctx.textAlign='left'; ctx.textBaseline='alphabetic';
}`,
`function renderPet(ctx, cam){
  const petId = (typeof gs!=='undefined' && gs.player) ? (gs.player.activePet||'') : '';
  if(!petId || !gs?.petState) return;
  const def=PET_DEFS[petId];
  if(!def) return;
  const pet = gs.petState;
  const sx=Math.floor(pet.x-cam.x), sy=Math.floor(pet.y-cam.y);
  // Glow
  ctx.globalAlpha=0.3; ctx.fillStyle=def.color;
  ctx.beginPath(); ctx.arc(sx,sy,14,0,Math.PI*2); ctx.fill();
  ctx.globalAlpha=1;
  // Fox uses PNG sprite with flip support
  if(petId==='fox' && IMG_FOX.complete && IMG_FOX.naturalWidth){
    const ph=32, pw=Math.round(IMG_FOX.naturalWidth/IMG_FOX.naturalHeight*ph);
    const facing = pet.facing || 1;
    ctx.save();
    ctx.translate(sx, sy);
    if(facing < 0) ctx.scale(-1, 1);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(IMG_FOX, -pw/2, -ph/2, pw, ph);
    ctx.restore();
    return;
  }
  // Emoji fallback for other pets
  ctx.font='18px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(def.icon, sx, sy);
  ctx.textAlign='left'; ctx.textBaseline='alphabetic';
}`,
'renderPet — draw IMG_FOX with left/right flip'
);

// ── 6. Bump version ──
rep('v0.5.1', 'v0.5.2', 'Bump version to v0.5.2');

// ── Write back ──
if (!ok) { console.error('\n❌ Some steps failed — NOT writing file'); process.exit(1); }
fs.writeFileSync(HTML, html, 'utf8');
console.log('\n✅ index.html updated to v0.5.2');
console.log('Final file size:', fs.statSync(HTML).size, 'bytes');
