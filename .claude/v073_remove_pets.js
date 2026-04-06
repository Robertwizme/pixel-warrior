'use strict';
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(FILE, 'utf8');

let ok = true;
function rep(from, to, label) {
  if (!html.includes(from)) {
    console.error(`FAIL [${label}] — string not found`);
    ok = false;
    return;
  }
  html = html.replace(from, to);
  console.log(`OK   [${label}]`);
}

// ── 1. btn-pet topbar button ──
rep(
  `\n    <button class="btn icon-btn" id="btn-pet" style="border-color:#4f8;color:#4f8" title="宠物">🐾</button>`,
  ``,
  'topbar btn-pet'
);

// ── 2. Entire <div class="overlay" id="o-pet">...</div> ──
rep(
  `\n<!-- PET -->\n<div class="overlay" id="o-pet" style="background:#0d0d1a;padding:0;align-items:stretch;justify-content:stretch;flex-direction:row">
  <div style="width:120px;background:rgba(0,0,0,0.6);border-right:1px solid #1e2030;display:flex;flex-direction:column;padding:10px 6px;gap:6px;overflow-y:auto;flex-shrink:0">
    <div style="font-size:10px;color:#4f8;font-weight:bold;text-align:center;letter-spacing:1px;margin-bottom:4px">🐾 我的宠物</div>
    <div id="pet-list-panel"></div>
  </div>
  <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#0a0f16;position:relative">
    <div id="pet-center-icon" style="font-size:96px;line-height:1;margin-bottom:10px;filter:drop-shadow(0 0 20px rgba(100,255,100,0.4))">🐾</div>
    <div id="pet-center-name" style="font-size:16px;color:#4f8;font-weight:bold;letter-spacing:2px">——</div>
    <div id="pet-center-rarity" style="font-size:10px;color:#888;margin-top:4px"></div>
    <button class="btn primary" id="btn-pet-deploy" style="margin-top:16px;padding:8px 24px;font-size:12px">出战</button>
    <button class="btn" id="btn-pet-back" style="position:absolute;top:12px;right:12px;padding:5px 12px;font-size:11px">← 返回</button>
  </div>
  <div style="width:160px;background:rgba(0,0,0,0.6);border-left:1px solid #1e2030;padding:12px 10px;overflow-y:auto;flex-shrink:0">
    <div style="font-size:10px;color:#88f;font-weight:bold;margin-bottom:10px;letter-spacing:1px">📋 宠物信息</div>
    <div id="pet-info-panel" style="font-size:10px;color:#888;line-height:1.8"></div>
  </div>
</div>`,
  ``,
  'o-pet overlay'
);

// ── 3a. Gacha pet tab button ──
rep(
  `\n      <button id="gacha-tab-pet" onclick="switchGachaTab('pet')" style="padding:5px 14px;font-size:11px;background:#0d1a0d;border:1.5px solid #4f8;border-radius:5px;color:#4f8;cursor:pointer;font-family:'Courier New',monospace">🐉 宠物池</button>`,
  ``,
  'gacha-tab-pet button'
);

// ── 3b. gacha-panel-pet div ──
rep(
  `\n    <!-- Pet pool -->\n    <div id="gacha-panel-pet" style="display:none;background:rgba(0,200,100,0.05);border:1px solid #1a3a1a;border-radius:10px;padding:14px;margin-bottom:10px">
      <div style="font-size:30px;margin-bottom:5px">🐉</div>
      <div style="font-size:13px;color:#4f8;margin-bottom:4px;font-weight:bold">宠物奖池</div>
      <div style="font-size:9px;color:#888;margin-bottom:8px">普通/精英/传说宠物 · 100抽保底传说宠物</div>
      <div id="gacha-pet-pity-bar" style="background:#1a1a2a;border-radius:4px;height:5px;margin-bottom:3px;overflow:hidden">
        <div id="gacha-pet-pity-fill" style="height:100%;background:linear-gradient(90deg,#4f8,#fd4);border-radius:4px;width:0%;transition:width .4s"></div>
      </div>
      <div id="gacha-pet-pity-txt" style="font-size:9px;color:#666">保底进度: 0/100</div>
    </div>`,
  ``,
  'gacha-panel-pet div'
);

// ── 4. IMG_FOX image object (the short line) ──
rep(
  `\nconst IMG_FOX = new Image();\nIMG_FOX.src = IMG_SRC_FOX;\n`,
  `\n`,
  'IMG_FOX image object'
);

// ── 4b. IMG_SRC_FOX base64 constant (long line) ──
{
  const marker = 'const IMG_SRC_FOX = ';
  const idx = html.indexOf(marker);
  if (idx === -1) {
    console.error('FAIL [IMG_SRC_FOX const] — not found');
    ok = false;
  } else {
    const end = html.indexOf('\n', idx);
    if (end === -1) {
      console.error('FAIL [IMG_SRC_FOX const] — no newline after');
      ok = false;
    } else {
      html = html.slice(0, idx) + html.slice(end + 1);
      console.log('OK   [IMG_SRC_FOX const]');
    }
  }
}

// ── 5. PET_DEFS constant block ──
rep(
  `\n// ═══════════════════════════════════════════════════════\n// §30  Pet System\n// ═══════════════════════════════════════════════════════\nconst PET_DEFS = {\n  cat: {\n    name:'猫咪', icon:'🐱', rarity:'normal', hp:50, dmg:20, spd:60, atkSpd:80,\n    traits:['好奇心旺盛：偶尔冲向最近的敌人'],\n    skill:'抓挠：每5秒对最近敌人造成30点伤害',\n    desc:'活泼的小猫，会帮你抓挠敌人。',\n    color:'#fa8'\n  },\n  wolf: {\n    name:'狼犬', icon:'🐺', rarity:'elite', hp:100, dmg:45, spd:80, atkSpd:90,\n    traits:['群狼之力：附近有其他宠物时伤害+20%'],\n    skill:'嚎叫：每10秒使玩家获得5秒速度+20%',\n    desc:'忠诚的战狼，擅长追击快速敌人。',\n    color:'#aaa'\n  },\n  fox: {\n    name:'火狐', icon:'🦊', rarity:'elite', hp:80, dmg:55, spd:90, atkSpd:85,\n    traits:['元素亲和：攻击附带随机元素'],\n    skill:'狐火：每8秒在敌人群中爆炸，造成范围伤害',\n    desc:'神秘的火狐，精通元素魔法。',\n    color:'#f84'\n  },\n  dragon: {\n    name:'飞龙', icon:'🐉', rarity:'legendary', hp:100, dmg:100, spd:70, atkSpd:100,\n    traits:['元素龙：攻击有5%概率附带随机元素状态'],\n    skill:'飞龙在天：朝前方吐出冰路冻结敌人，或火焰灼烧并留下持续3秒的火路',\n    desc:'传说中的飞龙，元素之力融于一身。',\n    color:'#4f8',\n    legendary: true\n  }\n};\n\nfunction getPetList(){ try{ return JSON.parse(localStorage.getItem('pw_pets')||'[]'); }catch{ return []; } }\nfunction savePetList(arr){ try{ localStorage.setItem('pw_pets',JSON.stringify(arr)); }catch{} }\nfunction getActivePet(){ try{ return localStorage.getItem('pw_active_pet')||''; }catch{ return ''; } }\nfunction setActivePet(id){ try{ localStorage.setItem('pw_active_pet',id||''); }catch{} }\n\nfunction _addPet(id){\n  if(!PET_DEFS[id]) return;\n  const list=getPetList();\n  if(id==='dragon'||id==='cat'||id==='wolf'||id==='fox'){\n    if(!list.includes(id)) list.push(id);\n    savePetList(list);\n    renderPetOverlay && renderPetOverlay();\n  }\n}\n`,
  `\n`,
  'PET_DEFS + getPetList/savePetList/getActivePet/setActivePet/_addPet'
);

// ── 6+7+8. updatePet function ──
rep(
  `\n// ═══════════════════════════════════════════════════════\n// Pet in-game: follow player, attack, ability\n// ═══════════════════════════════════════════════════════\nfunction updatePet(dt){\n  const petId = (typeof gs!=='undefined' && gs.player) ? (gs.player.activePet||'') : '';\n  if(!petId || !PET_DEFS[petId]) return;\n  const def = PET_DEFS[petId];\n  const p = gs.player;\n  if(!gs.petState) gs.petState = { x:p.x, y:p.y, atkTimer:0, skillTimer:0, skillActive:false, skillTimer2:0, dragonPhase:0 };\n  const pet = gs.petState;\n\n  // Move pet toward nearest enemy; idle-orbit player when no enemies\n  const petSpd = (def.spd || 80);\n  const tgt = nearestEnemy(pet.x, pet.y);\n  if (tgt) {\n    // Chase enemy\n    const edx = tgt.x - pet.x, edy = tgt.y - pet.y;\n    const ed = Math.sqrt(edx*edx + edy*edy) || 1;\n    const stopDist = (tgt.radius || 8) + 10;\n    if (ed > stopDist) {\n      pet.x += (edx/ed) * Math.min(ed - stopDist, petSpd * dt);\n      pet.y += (edy/ed) * Math.min(ed - stopDist, petSpd * dt);\n    }\n    if (edx !== 0) pet.facing = edx > 0 ? 1 : -1;\n  } else {\n    // No enemies — drift back near player with gentle orbit\n    const orbitR = 32;\n    const angle = Date.now() * 0.001;\n    const tx = p.x + Math.cos(angle) * orbitR;\n    const ty = p.y + Math.sin(angle) * orbitR;\n    const ddx = tx - pet.x, ddy = ty - pet.y;\n    const dd = Math.sqrt(ddx*ddx + ddy*ddy) || 1;\n    if (dd > 4) { pet.x += (ddx/dd)*Math.min(dd, petSpd*dt); pet.y += (ddy/dd)*Math.min(dd, petSpd*dt); }\n  }\n\n  // Auto attack — only when close enough to touch the enemy\n  pet.atkTimer -= dt;\n  if(pet.atkTimer<=0){\n    pet.atkTimer = 100/def.atkSpd;\n    const atkTgt = nearestEnemy(pet.x, pet.y);\n    if(atkTgt){\n      const adx = atkTgt.x - pet.x, ady = atkTgt.y - pet.y;\n      const aDist = Math.sqrt(adx*adx + ady*ady);\n      const atkRange = (atkTgt.radius || 8) + 14;\n      if(aDist <= atkRange){\n        let dmg = def.dmg * (p.dmgMult||1);\n        // Dragon trait: 5% element proc\n        if(petId==='dragon' && Math.random()<0.05){\n          const elems=['flameStacks','frostStacks','poisonStacks'];\n          atkTgt[elems[Math.floor(Math.random()*elems.length)]] = Math.min(10,(atkTgt[elems[Math.floor(Math.random()*elems.length)]]||0)+1);\n        }\n        hitEnemy(atkTgt, dmg);\n        // Shoot projectile visually\n        const ang=Math.atan2(atkTgt.y-pet.y, atkTgt.x-pet.x);\n        gs.projectiles.push({ x:pet.x,y:pet.y, vx:Math.cos(ang)*220,vy:Math.sin(ang)*220,\n          dmg:0, radius:3, color:def.color, life:0.5, type:'pet_bullet', pierce:false });\n      }\n    }\n  }\n\n  // Pet skill\n  pet.skillTimer -= dt;\n  if(pet.skillTimer<=0){\n    pet.skillTimer = 8.0;\n    if(petId==='dragon'){\n      // Dragon: alternate ice/fire breath\n      pet.dragonPhase = (pet.dragonPhase||0)+1;\n      const isIce = pet.dragonPhase % 2 === 0;\n      const ang = p.lastMoveAngle || -Math.PI/2;\n      // Spawn projectile strip\n      for(let i=0;i<5;i++){\n        const dist=40+i*35;\n        const ex=pet.x+Math.cos(ang)*dist, ey=pet.y+Math.sin(ang)*dist;\n        gs.pendingExplosions.push({ timer:i*0.08, x:ex, y:ey, radius:28, dmg:40, w:null,\n          petBreath:true, isIce });\n      }\n      if(settings.particles) spawnParticles(pet.x,pet.y, isIce?['#8cf','#acf','#fff']:['#f84','#f44','#fd4'], 20, 90, 0.8, 4);\n    } else if(petId==='fox'){\n      const tgt=nearestEnemy(pet.x,pet.y);\n      if(tgt){ missileDroneExplosion(tgt.x,tgt.y,50,80,null); if(settings.particles) spawnParticles(tgt.x,tgt.y,['#f84','#fd4'],16,80,0.6,4); }\n    } else if(petId==='wolf'){\n      p.spd += 20; setTimeout(()=>{ if(p) p.spd=Math.max(p.spd-20,30); },5000);\n    } else if(petId==='cat'){\n      pet.skillTimer=5;\n      const tgt=nearestEnemy(pet.x,pet.y);\n      if(tgt) hitEnemy(tgt,30*(p.dmgMult||1));\n    }\n  }\n}\n\nfunction renderPet(ctx, cam){\n  const petId = (typeof gs!=='undefined' && gs.player) ? (gs.player.activePet||'') : '';\n  if(!petId || !gs?.petState) return;\n  const def=PET_DEFS[petId];\n  if(!def) return;\n  const pet = gs.petState;\n  const sx=Math.floor(pet.x-cam.x), sy=Math.floor(pet.y-cam.y);\n  // Glow\n  ctx.globalAlpha=0.3; ctx.fillStyle=def.color;\n  ctx.beginPath(); ctx.arc(sx,sy,14,0,Math.PI*2); ctx.fill();\n  ctx.globalAlpha=1;\n  // Fox uses PNG sprite with flip support\n  if(petId==='fox' && IMG_FOX.complete && IMG_FOX.naturalWidth){\n    const ph=32, pw=Math.round(IMG_FOX.naturalWidth/IMG_FOX.naturalHeight*ph);\n    const facing = pet.facing || 1;\n    ctx.save();\n    ctx.translate(sx, sy);\n    if(facing < 0) ctx.scale(-1, 1);\n    ctx.imageSmoothingEnabled = true;\n    ctx.drawImage(IMG_FOX, -pw/2, -ph/2, pw, ph);\n    ctx.restore();\n    return;\n  }\n  // Emoji fallback for other pets\n  ctx.font='18px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';\n  ctx.fillText(def.icon, sx, sy);\n  ctx.textAlign='left'; ctx.textBaseline='alphabetic';\n}\n\n// Handle dragon breath explosions (isIce/fire)\nconst _origUpdatePendingExplosions_pet = updatePendingExplosions;\n`,
  `\n`,
  'updatePet + renderPet functions'
);

// ── 9. Pet pity helpers + PET_GACHA_POOL + petGachaDraw + doGachaPet ──
rep(
  `// Pet pity helpers\nfunction getPetPity(){ try{ return Math.max(0,parseInt(localStorage.getItem('pw_pet_pity')||'0',10)); }catch{ return 0; } }\nfunction setPetPity(n){ try{ localStorage.setItem('pw_pet_pity',String(n)); }catch{} }\nfunction hasDragonPet(){ try{ return localStorage.getItem('pw_has_dragon')==='1'; }catch{ return false; } }\nfunction setDragonPet(){ try{ localStorage.setItem('pw_has_dragon','1'); }catch{} }\n\nfunction updateGachaPetPityUI(){\n  const p=getPetPity(); const has=hasDragonPet();\n  const fill=document.getElementById('gacha-pet-pity-fill');\n  const txt=document.getElementById('gacha-pet-pity-txt');\n  if(fill) fill.style.width=(Math.min(100,p))+'%';\n  if(txt) txt.textContent = has ? '保底进度: 已拥有飞龙 ✓' : '保底进度: '+p+'/100';\n}\n\nconst PET_GACHA_POOL = [\n  { w:60, icon:'🐱', name:'猫咪', rarity:'normal',  apply:()=>{ _addPet('cat'); } },\n  { w:25, icon:'🐺', name:'狼犬', rarity:'elite',   apply:()=>{ _addPet('wolf'); } },\n  { w:10, icon:'🦊', name:'火狐', rarity:'elite',   apply:()=>{ _addPet('fox'); } },\n];\n\nfunction petGachaDraw(){\n  let pity=getPetPity();\n  const has=hasDragonPet();\n  pity++;\n  const isDragon = !has && (pity>=100 || Math.random()<0.02);\n  setPetPity(isDragon ? 0 : pity);\n  if(isDragon){\n    setDragonPet(); _addPet('dragon');\n    updateGachaPetPityUI();\n    return { icon:'🐉', name:'飞龙', rarity:'legendary' };\n  }\n  let total=PET_GACHA_POOL.reduce((s,x)=>s+x.w,0);\n  let r=Math.random()*total;\n  for(const item of PET_GACHA_POOL){\n    r-=item.w; if(r<=0){ item.apply(); updateGachaPetPityUI(); return { icon:item.icon, name:item.name, rarity:item.rarity }; }\n  }\n  PET_GACHA_POOL[0].apply(); updateGachaPetPityUI(); return { icon:PET_GACHA_POOL[0].icon, name:PET_GACHA_POOL[0].name, rarity:'normal' };\n}\n\nfunction doGachaPet(times, useTickets){\n  if(useTickets){\n    const tix=getGachaTickets();\n    if(tix<times){ showGachaModal([{icon:'❌',name:'抽奖券不足',rarity:'normal'}]); return; }\n    for(let i=0;i<times;i++) spendGachaTicket();\n  } else {\n    if(!spendCoins(times*100)){ showGachaModal([{icon:'❌',name:'金币不足',rarity:'normal'}]); return; }\n  }\n  const results=[];\n  for(let i=0;i<times;i++) results.push(petGachaDraw());\n  updateGachaPityUI();\n  showGachaModal(results);\n}`,
  ``,
  'pet pity helpers + PET_GACHA_POOL + petGachaDraw + doGachaPet'
);

// ── 10. switchGachaTab function + _gachaTab variable ──
rep(
  `// Gacha tab system\nlet _gachaTab = 'sword';\nfunction switchGachaTab(tab){\n  _gachaTab = tab;\n  document.getElementById('gacha-panel-sword').style.display = tab==='sword'?'':'none';\n  document.getElementById('gacha-panel-pet').style.display   = tab==='pet'?'':'none';\n  document.getElementById('gacha-panel-odds').style.display  = tab==='odds'?'':'none';\n  document.getElementById('gacha-draw-btns').style.display   = tab==='odds'?'none':'flex';\n}\n`,
  `// Gacha tab system (simplified — pet pool removed)\nfunction switchGachaTab(tab){\n  document.getElementById('gacha-panel-sword').style.display = tab==='sword'?'':'none';\n  document.getElementById('gacha-panel-odds').style.display  = tab==='odds'?'':'none';\n  document.getElementById('gacha-draw-btns').style.display   = tab==='odds'?'none':'flex';\n}\n`,
  'switchGachaTab + _gachaTab'
);

// ── 11. Gacha draw buttons — remove pet branch ──
rep(
  `document.getElementById('btn-gacha-x1').addEventListener('click',()=>{ if(_gachaTab==='pet') doGachaPet(1); else doGacha(1); });\ndocument.getElementById('btn-gacha-x10').addEventListener('click',()=>{ if(_gachaTab==='pet') doGachaPet(10); else doGacha(10); });\ndocument.getElementById('btn-gacha-ticket1').addEventListener('click',()=>{ if(_gachaTab==='pet') doGachaPet(1,true); else doGacha(1,true); });\ndocument.getElementById('btn-gacha-ticket10').addEventListener('click',()=>{ if(_gachaTab==='pet') doGachaPet(10,true); else doGacha(10,true); });`,
  `document.getElementById('btn-gacha-x1').addEventListener('click',()=>{ doGacha(1); });\ndocument.getElementById('btn-gacha-x10').addEventListener('click',()=>{ doGacha(10); });\ndocument.getElementById('btn-gacha-ticket1').addEventListener('click',()=>{ doGacha(1,true); });\ndocument.getElementById('btn-gacha-ticket10').addEventListener('click',()=>{ doGacha(10,true); });`,
  'gacha draw buttons — remove pet branch'
);

// ── 12. btn-pet-back + btn-pet event listeners ──
rep(
  `document.getElementById('btn-pet-back').addEventListener('click',()=>showOverlay('o-menu'));\ndocument.getElementById('btn-pet').addEventListener('click',()=>{ renderPetOverlay(); showOverlay('o-pet'); });`,
  ``,
  'btn-pet-back + btn-pet listeners'
);

// ── 13. btn-pet-deploy + _selectedPet + renderPetOverlay ──
rep(
  `document.getElementById('btn-pet-deploy').addEventListener('click',()=>{\n  const sel=document.querySelector('#pet-list-panel .pet-slot.pet-sel');\n  if(!sel) return;\n  const pid=sel.dataset.pet;\n  setActivePet(pid);\n  document.querySelectorAll('#pet-list-panel .pet-slot').forEach(s=>s.classList.remove('pet-active'));\n  sel.classList.add('pet-active');\n  const nameEl=document.getElementById('pet-center-name');\n  if(nameEl&&pid) nameEl.style.color='#4f8';\n  alert('🐾 '+PET_DEFS[pid]?.name+' 已设为出战宠物！下局游戏生效。');\n});\n\nlet _selectedPet='';\nfunction renderPetOverlay(){\n  const list=getPetList();\n  const active=getActivePet();\n  const panel=document.getElementById('pet-list-panel');\n  if(!panel) return;\n  const rarityColor={normal:'#888',elite:'#4af',legendary:'#fd4'};\n  panel.innerHTML='';\n  if(!list.length){\n    panel.innerHTML='<div style="font-size:9px;color:#444;text-align:center;padding:20px 0">暂无宠物<br>去抽奖获得！</div>';\n  }\n  list.forEach(pid=>{\n    const def=PET_DEFS[pid]; if(!def) return;\n    const slot=document.createElement('div');\n    slot.className='pet-slot'+(pid===_selectedPet?' pet-sel':'')+(pid===active?' pet-active':'');\n    slot.dataset.pet=pid;\n    slot.style.cssText='padding:6px 4px;border-radius:6px;border:1.5px solid '+(pid===_selectedPet?'#4f8':rarityColor[def.rarity]||'#333')+';margin-bottom:6px;cursor:pointer;text-align:center;background:'+(pid===active?'rgba(0,100,50,0.3)':'rgba(0,0,0,0.3)');\n    slot.innerHTML='<div style="font-size:26px">'+def.icon+'</div><div style="font-size:9px;color:'+(rarityColor[def.rarity]||'#888')+'">'+def.name+'</div>'+(pid===active?'<div style="font-size:8px;color:#4f8">出战中</div>':'');\n    slot.addEventListener('click',()=>{\n      _selectedPet=pid;\n      document.getElementById('pet-center-icon').textContent=def.icon;\n      document.getElementById('pet-center-name').textContent=def.name;\n      document.getElementById('pet-center-rarity').textContent=['普通','精英','传说'][['normal','elite','legendary'].indexOf(def.rarity)]||'';\n      const rarityC={normal:'#888',elite:'#4af',legendary:'#fd4'};\n      document.getElementById('pet-center-rarity').style.color=rarityC[def.rarity]||'#888';\n      document.getElementById('pet-info-panel').innerHTML=\n        '<b style="color:#eee">📊 数值</b><br>HP: '+def.hp+'<br>伤害: '+def.dmg+'<br>速度: '+def.spd+'<br>攻速: '+def.atkSpd+\n        '<br><br><b style="color:#eee">✨ 特性</b><br>'+def.traits.join('<br>')+\n        '<br><br><b style="color:#eee">💫 技能</b><br>'+def.skill+\n        '<br><br><b style="color:#888">'+def.desc+'</b>';\n      renderPetOverlay();\n    });\n    panel.appendChild(slot);\n  });\n}`,
  ``,
  'btn-pet-deploy + _selectedPet + renderPetOverlay'
);

// ── 14. activePet in initGame player object ──
rep(
  `\n    activePet: (typeof getActivePet==='function' ? getActivePet() : ''),`,
  ``,
  'activePet in initGame player'
);

// ── 15. petState in gs object ──
rep(
  `\n    petState: null,`,
  ``,
  'petState in gs object'
);

// ── 16. updatePet(dt) call in game loop ──
rep(
  `\n      updatePet(dt);`,
  ``,
  'updatePet(dt) call'
);

// ── 17. renderPet call in render function ──
rep(
  `\n  // Pet\n  if(typeof renderPet==='function') renderPet(ctx, cam);\n`,
  `\n`,
  'renderPet call in render'
);

// ── 18. chat-pet IIFE block ──
rep(
  `\n// Pet in chat room\n(function(){\n  const activePetId = getActivePet ? getActivePet() : '';\n  if(!activePetId || !PET_DEFS[activePetId]) return;\n  const def = PET_DEFS[activePetId];\n  const chatOverlay = document.getElementById('o-chat');\n  if(!chatOverlay) return;\n  const petEl = document.createElement('div');\n  petEl.id = 'chat-pet';\n  petEl.style.cssText = 'position:absolute;bottom:80px;left:80px;font-size:48px;cursor:grab;z-index:20;user-select:none;filter:drop-shadow(0 0 8px '+def.color+');line-height:1;transition:filter .2s';\n  petEl.textContent = def.icon;\n  petEl.title = def.name;\n  chatOverlay.appendChild(petEl);\n  // Draggable\n  let dragging=false, dx=0, dy=0;\n  petEl.addEventListener('mousedown', e=>{ dragging=true; dx=e.clientX-petEl.offsetLeft; dy=e.clientY-petEl.offsetTop; petEl.style.cursor='grabbing'; e.preventDefault(); });\n  petEl.addEventListener('touchstart', e=>{ dragging=true; const t=e.touches[0]; dx=t.clientX-petEl.offsetLeft; dy=t.clientY-petEl.offsetTop; e.preventDefault(); },{passive:false});\n  document.addEventListener('mousemove', e=>{ if(!dragging)return; petEl.style.left=Math.max(0,e.clientX-dx)+'px'; petEl.style.top=Math.max(0,e.clientY-dy)+'px'; });\n  chatOverlay.addEventListener('touchmove', e=>{ if(!dragging)return; const t=e.touches[0]; petEl.style.left=Math.max(0,t.clientX-dx)+'px'; petEl.style.top=Math.max(0,t.clientY-dy)+'px'; e.preventDefault(); },{passive:false});\n  document.addEventListener('mouseup', ()=>{ dragging=false; petEl.style.cursor='grab'; });\n  document.addEventListener('touchend', ()=>{ dragging=false; });\n})();\n`,
  `\n`,
  'chat-pet IIFE'
);

// ── 19. pet_bullet check in rendering ──
rep(
  `\n    } else if (proj.type==='pet_bullet') {\n      ctx.globalAlpha=0.7;\n      ctx.beginPath(); ctx.arc(sx,sy,proj.radius||3,0,Math.PI*2); ctx.fill();\n      ctx.globalAlpha=1;\n    } else {`,
  `\n    } else {`,
  'pet_bullet rendering branch'
);

// ── 20. petBreath check in updatePendingExplosions ──
rep(
  `      if (pe.petBreath) {\n        // Dragon breath\n        gs.enemies.forEach(e => {\n          if(e.dead) return;\n          const dx=e.x-pe.x, dy=e.y-pe.y;\n          if(dx*dx+dy*dy < pe.radius*pe.radius) {\n            hitEnemy(e, pe.dmg);\n            if(pe.isIce) e.frostStacks=Math.min(10,(e.frostStacks||0)+3);\n            else { e.flameStacks=Math.min(10,(e.flameStacks||0)+3); }\n          }\n        });\n        if(settings.particles) spawnParticles(pe.x,pe.y, pe.isIce?['#8cf','#acf']:['#f84','#fd4'], 10, 60, 0.5, 3);\n      } else {\n        missileDroneExplosion(pe.x, pe.y, pe.radius, pe.dmg, pe.w);\n      }`,
  `      missileDroneExplosion(pe.x, pe.y, pe.radius, pe.dmg, pe.w);`,
  'petBreath check in updatePendingExplosions'
);

// ── 21. updateGachaPetPityUI call in btn-gacha listener ──
rep(
  `document.getElementById('btn-gacha').addEventListener('click',()=>{\n  updateGachaPityUI(); updateGachaPetPityUI();\n  showOverlay('o-gacha');\n});`,
  `document.getElementById('btn-gacha').addEventListener('click',()=>{\n  updateGachaPityUI();\n  showOverlay('o-gacha');\n});`,
  'updateGachaPetPityUI call in btn-gacha'
);

// ── 22. Pet odds section from gacha odds panel ──
rep(
  `\n      <div style="color:#88f;font-weight:bold;margin-top:10px;text-align:center">📊 宠物池概率</div>\n      <div style="color:#888">🐾 普通宠物 — <span style="color:#eee">60%</span></div>\n      <div style="color:#4af">✨ 精英宠物 — <span style="color:#4af">35%</span></div>\n      <div style="color:#fd4">🐉 传说宠物(飞龙) — <span style="color:#fd4">2%概率 / 100抽保底</span></div>`,
  ``,
  'pet odds in gacha odds panel'
);

// ── 23. Bump version to v0.7.3 ──
rep(
  `const GAME_VERSION = 'v0.7.2';`,
  `const GAME_VERSION = 'v0.7.3';`,
  'version bump to v0.7.3'
);

// ── Final check ──
if (!ok) {
  console.error('\n❌ Aborting — NOT writing file (one or more FAILs above).');
  process.exit(1);
}

fs.writeFileSync(FILE, html, 'utf8');
console.log('\n✅ Done — file written successfully.');
