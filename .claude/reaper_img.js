#!/usr/bin/env node
// reaper_img.js - Embed Simo Häyhä.png as IMG_REAPER and hook into 白色死神 class

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const HTML = path.join(ROOT, 'index.html');
const PNG  = path.join(ROOT, 'Simo Häyhä.png');

let html = fs.readFileSync(HTML, 'utf8');
const pngBuf = fs.readFileSync(PNG);
const b64 = pngBuf.toString('base64');
const IMG_SRC_REAPER = 'data:image/png;base64,' + b64;

console.log('PNG size:', pngBuf.length, 'bytes, base64 length:', b64.length);

// ── 1. Insert IMG_SRC_REAPER constant + Image object after IMG_MAGE.src line ──
const AFTER_MAGE = "IMG_MAGE.src   = IMG_SRC_MAGE;";
if (!html.includes(AFTER_MAGE)) { console.error('FAIL: anchor not found:', AFTER_MAGE); process.exit(1); }
const REAPER_BLOCK = `
const IMG_SRC_REAPER = '${IMG_SRC_REAPER}';
const IMG_REAPER = new Image();
IMG_REAPER.onload = () => {
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
};
IMG_REAPER.src = IMG_SRC_REAPER;`;
html = html.replace(AFTER_MAGE, AFTER_MAGE + REAPER_BLOCK);
console.log('✓ Inserted IMG_REAPER block');

// ── 2. Add player_reaper to imgMap in drawMenuSprite ──
const OLD_IMGMAP = "const imgMap = { player_doctor: IMG_DOCTOR, player_mage: IMG_MAGE };";
const NEW_IMGMAP = "const imgMap = { player_doctor: IMG_DOCTOR, player_mage: IMG_MAGE, player_reaper: IMG_REAPER };";
if (!html.includes(OLD_IMGMAP)) { console.error('FAIL: imgMap not found'); process.exit(1); }
html = html.replace(OLD_IMGMAP, NEW_IMGMAP);
console.log('✓ Added player_reaper to imgMap');

// ── 3. Update MENU_CLASSES reaper entry ──
const OLD_MENU = "{ label:'白色死神', icon:'💀' }";
const NEW_MENU = "{ label:'西蒙·海耶', sprite:'player_reaper' }";
if (!html.includes(OLD_MENU)) { console.error('FAIL: MENU_CLASSES reaper not found'); process.exit(1); }
html = html.replace(OLD_MENU, NEW_MENU);
console.log('✓ Updated MENU_CLASSES reaper entry');

// ── 4. Update CLASSES reaper name ──
const OLD_CLASS_NAME = "name:'白色死神'";
const NEW_CLASS_NAME = "name:'西蒙·海耶'";
if (!html.includes(OLD_CLASS_NAME)) { console.error('FAIL: CLASSES reaper name not found'); process.exit(1); }
html = html.replace(OLD_CLASS_NAME, NEW_CLASS_NAME);
console.log('✓ Updated CLASSES reaper name');

// ── 5. Update cls-5 grid cell ──
const OLD_CLS5 = 'data-icon="💀" data-name="白色死神"';
const NEW_CLS5 = 'data-icon="🎯" data-name="西蒙·海耶"';
if (!html.includes(OLD_CLS5)) { console.error('FAIL: cls-5 data attrs not found'); process.exit(1); }
html = html.replace(OLD_CLS5, NEW_CLS5);
// Also replace the displayed emoji inside the div (the cell text content "💀")
// The cell looks like: ...">💀</div>  - but only for cls-5
const OLD_CLS5_CONTENT = 'id="cls-5"\n  data-icon="🎯" data-name="西蒙·海耶"';
// We already replaced data-icon, now replace the inner content emoji
// Find the specific pattern around cls-5 to replace the inner 💀
const OLD_INNER = 'id="cls-5"\n  data-icon="🎯" data-name="西蒙·海耶"\n  data-stat=';
if (html.includes(OLD_INNER)) {
  // The cell ends with ">💀</div>" - find and replace just that part near cls-5
  // Use a more targeted replace by finding the block
  const idx = html.indexOf('id="cls-5"');
  if (idx !== -1) {
    const chunk = html.substring(idx, idx + 400);
    const newChunk = chunk.replace('>💀</div>', '>🎯</div>');
    html = html.substring(0, idx) + newChunk + html.substring(idx + 400);
    console.log('✓ Updated cls-5 inner emoji to 🎯');
  }
} else {
  // try simpler: just find >💀</div> near the cls-5 area
  const idx = html.indexOf('id="cls-5"');
  if (idx !== -1) {
    const chunk = html.substring(idx, idx + 400);
    const newChunk = chunk.replace('>💀</div>', '>🎯</div>');
    html = html.substring(0, idx) + newChunk + html.substring(idx + 400);
    console.log('✓ Updated cls-5 inner emoji to 🎯');
  }
}
console.log('✓ Updated cls-5 grid cell');

// ── 6. Update codex reaper meta ──
const OLD_CODEX = "reaper:{icon:'💀',desc:'全武器冷却缩短25%，攻速最高，连续输出无敌'}";
const NEW_CODEX = "reaper:{icon:'🎯',desc:'狙击手传奇，全武器冷却缩短25%，攻速最高，连续输出无敌'}";
if (!html.includes(OLD_CODEX)) {
  console.warn('WARN: codex reaper meta not found (skipping)');
} else {
  html = html.replace(OLD_CODEX, NEW_CODEX);
  console.log('✓ Updated codex reaper meta');
}

// ── 7. Bump version to v0.4.2 ──
html = html.replace(/v0\.4\.1/g, 'v0.4.2');
console.log('✓ Bumped version to v0.4.2');

// ── 8. Write back ──
fs.writeFileSync(HTML, html, 'utf8');
console.log('✓ index.html updated successfully');
console.log('Final file size:', fs.statSync(HTML).size, 'bytes');
