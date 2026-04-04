#!/usr/bin/env node
// v045_update.js — v0.5.1 bug fixes:
// 1. Pet moves independently toward enemies, attacks on contact
// 2. Fix touchmove blocking game joystick (scope to chatOverlay)
// 3. Draw IMG_REAPER in-game for reaper class player
// 4. Bump version to v0.5.1

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

// ── 1. Rewrite updatePet: independent movement toward enemies, attack on contact ──
rep(
`function updatePet(dt){
  const petId = (typeof gs!=='undefined' && gs.player) ? (gs.player.activePet||'') : '';
  if(!petId || !PET_DEFS[petId]) return;
  const def = PET_DEFS[petId];
  const p = gs.player;
  if(!gs.petState) gs.petState = { x:p.x, y:p.y, atkTimer:0, skillTimer:0, skillActive:false, skillTimer2:0, dragonPhase:0 };
  const pet = gs.petState;

  // Follow player at offset
  const tx=p.x+30, ty=p.y-20;
  const ddx=tx-pet.x, ddy=ty-pet.y;
  const d=Math.sqrt(ddx*ddx+ddy*ddy)||1;
  const followSpd = 120;
  if(d>8){ pet.x += (ddx/d)*Math.min(d,followSpd*dt); pet.y += (ddy/d)*Math.min(d,followSpd*dt); }

  // Auto attack
  pet.atkTimer -= dt;
  if(pet.atkTimer<=0){
    pet.atkTimer = 100/def.atkSpd;
    const tgt=nearestEnemy(pet.x,pet.y);
    if(tgt){
      let dmg = def.dmg * (p.dmgMult||1);
      // Dragon trait: 5% element proc
      if(petId==='dragon' && Math.random()<0.05){
        const elems=['flameStacks','frostStacks','poisonStacks'];
        tgt[elems[Math.floor(Math.random()*elems.length)]] = Math.min(10,(tgt[elems[Math.floor(Math.random()*elems.length)]]||0)+1);
      }
      hitEnemy(tgt, dmg);
      // Shoot projectile visually
      const ang=Math.atan2(tgt.y-pet.y, tgt.x-pet.x);
      gs.projectiles.push({ x:pet.x,y:pet.y, vx:Math.cos(ang)*220,vy:Math.sin(ang)*220,
        dmg:0, radius:3, color:def.color, life:0.5, type:'pet_bullet', pierce:false });
    }
  }`,
`function updatePet(dt){
  const petId = (typeof gs!=='undefined' && gs.player) ? (gs.player.activePet||'') : '';
  if(!petId || !PET_DEFS[petId]) return;
  const def = PET_DEFS[petId];
  const p = gs.player;
  if(!gs.petState) gs.petState = { x:p.x, y:p.y, atkTimer:0, skillTimer:0, skillActive:false, skillTimer2:0, dragonPhase:0 };
  const pet = gs.petState;

  // Move pet toward nearest enemy; idle-orbit player when no enemies
  const petSpd = (def.spd || 80);
  const tgt = nearestEnemy(pet.x, pet.y);
  if (tgt) {
    // Chase enemy
    const edx = tgt.x - pet.x, edy = tgt.y - pet.y;
    const ed = Math.sqrt(edx*edx + edy*edy) || 1;
    const stopDist = (tgt.radius || 8) + 10;
    if (ed > stopDist) {
      pet.x += (edx/ed) * Math.min(ed - stopDist, petSpd * dt);
      pet.y += (edy/ed) * Math.min(ed - stopDist, petSpd * dt);
    }
  } else {
    // No enemies — drift back near player with gentle orbit
    const orbitR = 32;
    const angle = Date.now() * 0.001;
    const tx = p.x + Math.cos(angle) * orbitR;
    const ty = p.y + Math.sin(angle) * orbitR;
    const ddx = tx - pet.x, ddy = ty - pet.y;
    const dd = Math.sqrt(ddx*ddx + ddy*ddy) || 1;
    if (dd > 4) { pet.x += (ddx/dd)*Math.min(dd, petSpd*dt); pet.y += (ddy/dd)*Math.min(dd, petSpd*dt); }
  }

  // Auto attack — only when close enough to touch the enemy
  pet.atkTimer -= dt;
  if(pet.atkTimer<=0){
    pet.atkTimer = 100/def.atkSpd;
    const atkTgt = nearestEnemy(pet.x, pet.y);
    if(atkTgt){
      const adx = atkTgt.x - pet.x, ady = atkTgt.y - pet.y;
      const aDist = Math.sqrt(adx*adx + ady*ady);
      const atkRange = (atkTgt.radius || 8) + 14;
      if(aDist <= atkRange){
        let dmg = def.dmg * (p.dmgMult||1);
        // Dragon trait: 5% element proc
        if(petId==='dragon' && Math.random()<0.05){
          const elems=['flameStacks','frostStacks','poisonStacks'];
          atkTgt[elems[Math.floor(Math.random()*elems.length)]] = Math.min(10,(atkTgt[elems[Math.floor(Math.random()*elems.length)]]||0)+1);
        }
        hitEnemy(atkTgt, dmg);
        // Shoot projectile visually
        const ang=Math.atan2(atkTgt.y-pet.y, atkTgt.x-pet.x);
        gs.projectiles.push({ x:pet.x,y:pet.y, vx:Math.cos(ang)*220,vy:Math.sin(ang)*220,
          dmg:0, radius:3, color:def.color, life:0.5, type:'pet_bullet', pierce:false });
      }
    }
  }`,
'Rewrite updatePet — independent movement + proximity attack'
);

// ── 2. Fix touchmove listener: scope to chatOverlay instead of document ──
rep(
`  document.addEventListener('touchmove', e=>{ if(!dragging)return; const t=e.touches[0]; petEl.style.left=Math.max(0,t.clientX-dx)+'px'; petEl.style.top=Math.max(0,t.clientY-dy)+'px'; e.preventDefault(); },{passive:false});`,
`  chatOverlay.addEventListener('touchmove', e=>{ if(!dragging)return; const t=e.touches[0]; petEl.style.left=Math.max(0,t.clientX-dx)+'px'; petEl.style.top=Math.max(0,t.clientY-dy)+'px'; e.preventDefault(); },{passive:false});`,
'Fix pet drag touchmove — scope to chatOverlay'
);

// ── 3. Draw IMG_REAPER in-game for reaper class ──
rep(
`  // Use original PNG images for doctor / mage
  const _imgSpr = (_clsId2==='doctor' && IMG_DOCTOR.complete && IMG_DOCTOR.naturalWidth) ? IMG_DOCTOR
                : (_clsId2==='mage'   && IMG_MAGE.complete   && IMG_MAGE.naturalWidth  ) ? IMG_MAGE
                : null;`,
`  // Use original PNG images for doctor / mage / reaper
  const _imgSpr = (_clsId2==='doctor' && IMG_DOCTOR.complete && IMG_DOCTOR.naturalWidth) ? IMG_DOCTOR
                : (_clsId2==='mage'   && IMG_MAGE.complete   && IMG_MAGE.naturalWidth  ) ? IMG_MAGE
                : (_clsId2==='reaper' && IMG_REAPER.complete  && IMG_REAPER.naturalWidth ) ? IMG_REAPER
                : null;`,
'Draw IMG_REAPER in-game for reaper class'
);

// ── 4. Bump version to v0.5.1 ──
rep('v0.5.0', 'v0.5.1', 'Bump version to v0.5.1');

// ── Write back ──
if (!ok) { console.error('\n❌ Some steps failed — NOT writing file'); process.exit(1); }
fs.writeFileSync(HTML, html, 'utf8');
console.log('\n✅ index.html updated to v0.5.1');
console.log('Final file size:', fs.statSync(HTML).size, 'bytes');
