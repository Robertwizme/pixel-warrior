#!/usr/bin/env node
// v044_update.js — comprehensive update

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const HTML = path.join(ROOT, 'index.html');
let html = fs.readFileSync(HTML, 'utf8');

function rep(from, to, label) {
  if (!html.includes(from)) { console.error('FAIL [' + label + ']'); process.exit(1); }
  html = html.replace(from, to);
  console.log('✓', label);
}

// ═══════════════════════════════════════════════════════
// 1. Mobile landscape orientation
// ═══════════════════════════════════════════════════════
rep(
`<meta name="viewport" content="width=device-width, initial-scale=1.0">`,
`<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">`,
'Mobile viewport meta'
);

// Add landscape CSS after existing body rule
rep(
`body{background:#0d0d1a;color:#eee;font-family:'Courier New',monospace;overflow:hidden;user-select:none}`,
`body{background:#0d0d1a;color:#eee;font-family:'Courier New',monospace;overflow:hidden;user-select:none;touch-action:none}
@media screen and (max-width:900px) and (orientation:portrait){
  body::before{content:'请旋转手机为横屏模式';position:fixed;inset:0;background:#0d0d1a;color:#fd4;
    font-size:18px;font-family:"Courier New",monospace;display:flex;align-items:center;justify-content:center;
    z-index:99999;text-align:center;padding:20px;letter-spacing:2px}
  body > *{display:none!important}
  body::before{display:flex!important}
}`,
'Landscape orientation CSS'
);

// ═══════════════════════════════════════════════════════
// 2. Enemy collision — strengthen soft separation
// ═══════════════════════════════════════════════════════
rep(
`    // Soft separation
    for (let j=i+1; j<alive.length; j++) {
      const o = alive[j];
      const ox=e.x-o.x, oy=e.y-o.y;
      const d2=ox*ox+oy*oy;
      const minD=(e.radius+o.radius)*0.85;
      if (d2 < minD*minD && d2>0.0001) {
        const d=Math.sqrt(d2), push=(minD-d)/d*0.4;
        e.x+=ox*push; e.y+=oy*push;
        o.x-=ox*push; o.y-=oy*push;
      }
    }`,
`    // Hard collision separation — enemies cannot overlap
    for (let j=i+1; j<alive.length; j++) {
      const o = alive[j];
      const ox=e.x-o.x, oy=e.y-o.y;
      const d2=ox*ox+oy*oy;
      const minD = e.radius + o.radius;
      if (d2 < minD*minD && d2>0.0001) {
        const d=Math.sqrt(d2);
        const push=(minD-d)/d*0.5;
        e.x+=ox*push; e.y+=oy*push;
        o.x-=ox*push; o.y-=oy*push;
      }
    }`,
'Enemy hard collision separation'
);

// ═══════════════════════════════════════════════════════
// 3. Wave enemy count +50%
// ═══════════════════════════════════════════════════════
rep(
`    [{type:'slime',count:15}],
    [{type:'slime',count:15},{type:'goblin',count:8}],
    [{type:'slime',count:12},{type:'goblin',count:12}],
    [{type:'goblin',count:15},{type:'skeleton',count:8}],
    [{type:'goblin',count:12},{type:'skeleton',count:12},{type:'bat',count:8}],
    [{type:'skeleton',count:15},{type:'bat',count:12},{type:'orc',count:4}],
    [{type:'orc',count:10},{type:'skeleton',count:12},{type:'bat',count:10}],
    [{type:'orc',count:12},{type:'wolf',count:10},{type:'bat',count:12}],
    [{type:'orc',count:15},{type:'wolf',count:15},{type:'skeleton',count:10}],
    [{type: Math.random()<0.5 ? 'boss_10_cat' : 'boss_10_dog', count:1}], // wave 10 BOSS
    [{type:'wolf',count:15},{type:'orc',count:12}],
    [{type:'wolf',count:18},{type:'troll',count:5},{type:'orc',count:10}],
    [{type:'troll',count:8},{type:'wolf',count:15},{type:'demon',count:8}],
    [{type:'demon',count:12},{type:'troll',count:8},{type:'wolf',count:12}],
    [{type:'demon',count:15},{type:'troll',count:10},{type:'orc',count:12}],
    [{type:'demon',count:18},{type:'troll',count:12},{type:'wolf',count:15}],
    [{type:'demon',count:20},{type:'troll',count:14},{type:'wolf',count:18}],
    [{type:'demon',count:22},{type:'troll',count:16},{type:'wolf',count:20}],
    [{type:'demon',count:25},{type:'troll',count:18},{type:'wolf',count:22}],
    [{type:'boss_20',count:1}], // wave 20 BOSS
    [{type:'demon',count:25},{type:'troll',count:20},{type:'wolf',count:20}],
    [{type:'demon',count:28},{type:'troll',count:22},{type:'wolf',count:22}],
    [{type:'demon',count:30},{type:'troll',count:24},{type:'wolf',count:25}],
    [{type:'demon',count:32},{type:'troll',count:26},{type:'wolf',count:28}],
    [{type:'demon',count:35},{type:'troll',count:28},{type:'wolf',count:30}],
    [{type:'demon',count:38},{type:'troll',count:30},{type:'wolf',count:32}],
    [{type:'demon',count:40},{type:'troll',count:32},{type:'wolf',count:35}],
    [{type:'demon',count:44},{type:'troll',count:34},{type:'wolf',count:38}],
    [{type:'demon',count:48},{type:'troll',count:36},{type:'wolf',count:40}],
    [{type:'boss_30',count:1}], // wave 30 BOSS (FINAL)`,
`    [{type:'slime',count:22}],
    [{type:'slime',count:22},{type:'goblin',count:12}],
    [{type:'slime',count:18},{type:'goblin',count:18}],
    [{type:'goblin',count:22},{type:'skeleton',count:12}],
    [{type:'goblin',count:18},{type:'skeleton',count:18},{type:'bat',count:12}],
    [{type:'skeleton',count:22},{type:'bat',count:18},{type:'orc',count:6}],
    [{type:'orc',count:15},{type:'skeleton',count:18},{type:'bat',count:15}],
    [{type:'orc',count:18},{type:'wolf',count:15},{type:'bat',count:18}],
    [{type:'orc',count:22},{type:'wolf',count:22},{type:'skeleton',count:15}],
    [{type: Math.random()<0.5 ? 'boss_10_cat' : 'boss_10_dog', count:1}], // wave 10 BOSS
    [{type:'wolf',count:22},{type:'orc',count:18}],
    [{type:'wolf',count:26},{type:'troll',count:8},{type:'orc',count:15}],
    [{type:'troll',count:12},{type:'wolf',count:22},{type:'demon',count:12}],
    [{type:'demon',count:18},{type:'troll',count:12},{type:'wolf',count:18}],
    [{type:'demon',count:22},{type:'troll',count:15},{type:'orc',count:18}],
    [{type:'demon',count:26},{type:'troll',count:18},{type:'wolf',count:22}],
    [{type:'demon',count:30},{type:'troll',count:20},{type:'wolf',count:26}],
    [{type:'demon',count:33},{type:'troll',count:24},{type:'wolf',count:30}],
    [{type:'demon',count:37},{type:'troll',count:27},{type:'wolf',count:33}],
    [{type:'boss_20',count:1}], // wave 20 BOSS
    [{type:'demon',count:37},{type:'troll',count:30},{type:'wolf',count:30}],
    [{type:'demon',count:42},{type:'troll',count:33},{type:'wolf',count:33}],
    [{type:'demon',count:45},{type:'troll',count:36},{type:'wolf',count:37}],
    [{type:'demon',count:48},{type:'troll',count:39},{type:'wolf',count:42}],
    [{type:'demon',count:52},{type:'troll',count:42},{type:'wolf',count:45}],
    [{type:'demon',count:57},{type:'troll',count:45},{type:'wolf',count:48}],
    [{type:'demon',count:60},{type:'troll',count:48},{type:'wolf',count:52}],
    [{type:'demon',count:66},{type:'troll',count:51},{type:'wolf',count:57}],
    [{type:'demon',count:72},{type:'troll',count:54},{type:'wolf',count:60}],
    [{type:'boss_30',count:1}], // wave 30 BOSS (FINAL)`,
'Wave enemy counts +50%'
);

// ═══════════════════════════════════════════════════════
// 4. Bullet shape: all type:'bullet' render as elongated oval
// ═══════════════════════════════════════════════════════
rep(
`    } else {
      ctx.beginPath(); ctx.arc(sx,sy,proj.radius||4,0,Math.PI*2); ctx.fill();
    }
  });`,
`    } else {
      // Generic bullet: elongated oval in direction of travel
      const _ba = Math.atan2(proj.vy||0, proj.vx||1);
      const _br = proj.radius||4;
      ctx.save(); ctx.translate(sx,sy); ctx.rotate(_ba);
      ctx.beginPath(); ctx.ellipse(0,0,_br*2.2,_br*0.7,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.45)';
      ctx.beginPath(); ctx.ellipse(-_br*0.4,-_br*0.2,_br*0.8,_br*0.3,0,0,Math.PI*2); ctx.fill();
      ctx.restore();
    }
  });`,
'Generic bullet → elongated oval'
);

// Also fix type:'bullet' specific render (shotgun/gatling/sniper bullets all fall through to default)
// They use the else branch above, which now renders elongated. Good.
// But fireball, ice, bomb keep their round shapes — correct.

// ═══════════════════════════════════════════════════════
// 5. New mailbox mail: 10 gacha tickets
// ═══════════════════════════════════════════════════════
rep(
`const MAILBOX = [
  {
    id: 'launch_500coins',
    from: '官方',
    date: '2026-04-02',
    expires: '2026-05-02',
    title: '🎉 感谢支持！开服礼包',
    content: '感谢你游玩像素勇士！作为开服回馈，官方送出500金币，快去商城解锁你喜欢的职业或武器吧！\\n※ 限时邮件，2026-05-02前领取',
    reward: { icon:'💰', name:'500 金币', type:'coins', value:500 }
  },
];`,
`const MAILBOX = [
  {
    id: 'launch_500coins',
    from: '官方',
    date: '2026-04-02',
    expires: '2026-05-02',
    title: '🎉 感谢支持！开服礼包',
    content: '感谢你游玩像素勇士！作为开服回馈，官方送出500金币，快去商城解锁你喜欢的职业或武器吧！\\n※ 限时邮件，2026-05-02前领取',
    reward: { icon:'💰', name:'500 金币', type:'coins', value:500 }
  },
  {
    id: 'gacha_tickets_10',
    from: '官方',
    date: '2026-04-04',
    expires: '2026-06-01',
    title: '🗡 飞剑奖池开放纪念！10连抽券',
    content: '飞剑奖池正式上线！官方赠送10张抽奖券，每张可进行一次抽奖。\\n100抽保底获得传说武器「飞剑」，快去试试你的手气吧！\\n※ 限时邮件，2026-06-01前领取',
    reward: { icon:'🎟', name:'抽奖券 ×10', type:'gacha_tickets', value:10 }
  },
];`,
'Add gacha tickets mail'
);

// ═══════════════════════════════════════════════════════
// 6. Handle gacha_tickets reward type in renderMailbox
// ═══════════════════════════════════════════════════════
// Find the reward claim handler
rep(
`        if (mail.reward.type === 'coins') {
          addCoins(mail.reward.value || 0);
        } else {
          const pending = JSON.parse(localStorage.getItem('pw_pending_rewards')||'[]');
          pending.push({ icon:mail.reward.icon, name:mail.reward.name,
                          type:mail.reward.type, value:mail.reward.value });
          localStorage.setItem('pw_pending_rewards', JSON.stringify(pending));
        }`,
`        if (mail.reward.type === 'coins') {
          addCoins(mail.reward.value || 0);
        } else if (mail.reward.type === 'gacha_tickets') {
          const cur = parseInt(localStorage.getItem('pw_gacha_tickets')||'0',10)||0;
          localStorage.setItem('pw_gacha_tickets', String(cur + (mail.reward.value||0)));
        } else {
          const pending = JSON.parse(localStorage.getItem('pw_pending_rewards')||'[]');
          pending.push({ icon:mail.reward.icon, name:mail.reward.name,
                          type:mail.reward.type, value:mail.reward.value });
          localStorage.setItem('pw_pending_rewards', JSON.stringify(pending));
        }`,
'Handle gacha_tickets reward type'
);

// ═══════════════════════════════════════════════════════
// 7. Gacha ticket helpers + use tickets in doGacha
// ═══════════════════════════════════════════════════════
rep(
`function getGachaPity(){`,
`function getGachaTickets(){ try{ return Math.max(0,parseInt(localStorage.getItem('pw_gacha_tickets')||'0',10)); }catch{ return 0; } }
function spendGachaTicket(){ try{ const t=getGachaTickets(); if(t<=0)return false; localStorage.setItem('pw_gacha_tickets',String(t-1)); return true; }catch{ return false; } }

function getGachaPity(){`,
'Add gacha ticket helpers'
);

// Update updateGachaPityUI to show ticket count
rep(
`  document.getElementById('gacha-coins').textContent=getCoins();
}`,
`  document.getElementById('gacha-coins').textContent=getCoins();
  const tkEl=document.getElementById('gacha-tickets-txt');
  if(tkEl) tkEl.textContent='🎟 抽奖券: '+getGachaTickets()+'张';
}`,
'Show ticket count in pity UI'
);

// Update doGacha: allow ticket payment
rep(
`function doGacha(times){
  if(!spendCoins(times*100)){
    showGachaModal([{icon:'❌',name:'金币不足！需要 '+(times*100)+' 金币',rarity:'normal'}]);
    return;
  }
  const results=[];
  for(let i=0;i<times;i++) results.push(gachaDraw());
  updateGachaPityUI();
  showGachaModal(results);
}`,
`function doGacha(times, useTickets){
  if(useTickets){
    const tix=getGachaTickets();
    if(tix<times){ showGachaModal([{icon:'❌',name:'抽奖券不足！需要'+times+'张，当前'+tix+'张',rarity:'normal'}]); return; }
    for(let i=0;i<times;i++) spendGachaTicket();
  } else {
    if(!spendCoins(times*100)){ showGachaModal([{icon:'❌',name:'金币不足！需要 '+(times*100)+' 金币',rarity:'normal'}]); return; }
  }
  const results=[];
  for(let i=0;i<times;i++) results.push(gachaDraw());
  updateGachaPityUI();
  showGachaModal(results);
}`,
'doGacha: support ticket payment'
);

// ═══════════════════════════════════════════════════════
// 8. Gacha HTML: Add pet pool, odds display, ticket button
// ═══════════════════════════════════════════════════════
rep(
`    <div style="font-size:20px;color:#f8a;margin-bottom:4px;letter-spacing:2px">🎰 抽奖</div>
    <div style="font-size:11px;color:#555;margin-bottom:16px">当前金币: <b id="gacha-coins" style="color:#fd4">0</b></div>
    <div style="background:rgba(255,200,100,0.05);border:1px solid #3a2a1a;border-radius:10px;padding:16px 14px;margin-bottom:10px">
      <div style="font-size:36px;margin-bottom:6px">🗡</div>
      <div style="font-size:14px;color:#f8a;margin-bottom:4px;font-weight:bold">飞剑奖池</div>
      <div style="font-size:10px;color:#888;margin-bottom:8px">单抽必出金币/补给/属性强化 · 100抽保底获得飞剑</div>
      <div id="gacha-pity-bar" style="background:#1a1a2a;border-radius:4px;height:6px;margin-bottom:4px;overflow:hidden">
        <div id="gacha-pity-fill" style="height:100%;background:linear-gradient(90deg,#f8a,#fd4);border-radius:4px;width:0%;transition:width .4s"></div>
      </div>
      <div id="gacha-pity-txt" style="font-size:9px;color:#666">保底进度: 0/100</div>
    </div>
    <div id="gacha-result-area" style="display:none"></div>
    <div style="display:flex;gap:10px;margin-bottom:14px">
      <button class="btn" id="btn-gacha-x1" style="flex:1;padding:10px;font-size:12px;border-color:#f8a;color:#f8a">
        抽 ×1<br><span style="font-size:9px;color:#888">100 金币</span>
      </button>
      <button class="btn" id="btn-gacha-x10" style="flex:1;padding:10px;font-size:12px;border-color:#fd4;color:#fd4">
        抽 ×10<br><span style="font-size:9px;color:#888">1000 金币</span>
      </button>
    </div>
    <button class="btn" id="btn-gacha-back" style="width:100%;padding:9px">← 返回</button>`,
`    <div style="font-size:20px;color:#f8a;margin-bottom:4px;letter-spacing:2px">🎰 抽奖</div>
    <div style="display:flex;gap:12px;justify-content:center;font-size:11px;color:#666;margin-bottom:12px">
      <span>💰 金币: <b id="gacha-coins" style="color:#fd4">0</b></span>
      <span id="gacha-tickets-txt">🎟 抽奖券: 0张</span>
    </div>
    <!-- Pool tabs -->
    <div style="display:flex;gap:6px;margin-bottom:10px;justify-content:center">
      <button id="gacha-tab-sword" onclick="switchGachaTab('sword')" style="padding:5px 14px;font-size:11px;background:#1a0f00;border:1.5px solid #f8a;border-radius:5px;color:#f8a;cursor:pointer;font-family:'Courier New',monospace">🗡 飞剑池</button>
      <button id="gacha-tab-pet" onclick="switchGachaTab('pet')" style="padding:5px 14px;font-size:11px;background:#0d1a0d;border:1.5px solid #4f8;border-radius:5px;color:#4f8;cursor:pointer;font-family:'Courier New',monospace">🐉 宠物池</button>
      <button id="gacha-tab-odds" onclick="switchGachaTab('odds')" style="padding:5px 14px;font-size:11px;background:#0a0a1a;border:1.5px solid #88f;border-radius:5px;color:#88f;cursor:pointer;font-family:'Courier New',monospace">📊 概率</button>
    </div>
    <!-- Flying Sword pool -->
    <div id="gacha-panel-sword" style="background:rgba(255,200,100,0.05);border:1px solid #3a2a1a;border-radius:10px;padding:14px;margin-bottom:10px">
      <div style="font-size:30px;margin-bottom:5px">🗡</div>
      <div style="font-size:13px;color:#f8a;margin-bottom:4px;font-weight:bold">飞剑奖池</div>
      <div style="font-size:9px;color:#888;margin-bottom:8px">单抽必出金币/补给/属性强化 · 100抽保底飞剑</div>
      <div id="gacha-pity-bar" style="background:#1a1a2a;border-radius:4px;height:5px;margin-bottom:3px;overflow:hidden">
        <div id="gacha-pity-fill" style="height:100%;background:linear-gradient(90deg,#f8a,#fd4);border-radius:4px;width:0%;transition:width .4s"></div>
      </div>
      <div id="gacha-pity-txt" style="font-size:9px;color:#666">保底进度: 0/100</div>
    </div>
    <!-- Pet pool -->
    <div id="gacha-panel-pet" style="display:none;background:rgba(0,200,100,0.05);border:1px solid #1a3a1a;border-radius:10px;padding:14px;margin-bottom:10px">
      <div style="font-size:30px;margin-bottom:5px">🐉</div>
      <div style="font-size:13px;color:#4f8;margin-bottom:4px;font-weight:bold">宠物奖池</div>
      <div style="font-size:9px;color:#888;margin-bottom:8px">普通/精英/传说宠物 · 100抽保底传说宠物</div>
      <div id="gacha-pet-pity-bar" style="background:#1a1a2a;border-radius:4px;height:5px;margin-bottom:3px;overflow:hidden">
        <div id="gacha-pet-pity-fill" style="height:100%;background:linear-gradient(90deg,#4f8,#fd4);border-radius:4px;width:0%;transition:width .4s"></div>
      </div>
      <div id="gacha-pet-pity-txt" style="font-size:9px;color:#666">保底进度: 0/100</div>
    </div>
    <!-- Odds panel -->
    <div id="gacha-panel-odds" style="display:none;background:rgba(10,10,30,0.8);border:1px solid #223;border-radius:10px;padding:12px;margin-bottom:10px;text-align:left;font-size:10px;max-height:180px;overflow-y:auto">
      <div style="color:#88f;font-weight:bold;margin-bottom:8px;text-align:center">📊 飞剑池概率</div>
      <div style="color:#888">🪙 金币 ×50 — <span style="color:#eee">35%</span></div>
      <div style="color:#888">🪙 金币 ×120 — <span style="color:#eee">30%</span></div>
      <div style="color:#4af">❤ 最大HP +20 — <span style="color:#4af">12%</span></div>
      <div style="color:#4af">💪 伤害 +15% — <span style="color:#4af">10%</span></div>
      <div style="color:#4af">⏱ CD -10% — <span style="color:#4af">8%</span></div>
      <div style="color:#c8f">🍀 幸运 +30 — <span style="color:#c8f">5%</span></div>
      <div style="color:#fd4;margin-top:6px;font-weight:bold">🗡 飞剑 — <span style="color:#fd4">100抽保底</span></div>
      <div style="color:#88f;font-weight:bold;margin-top:10px;text-align:center">📊 宠物池概率</div>
      <div style="color:#888">🐾 普通宠物 — <span style="color:#eee">60%</span></div>
      <div style="color:#4af">✨ 精英宠物 — <span style="color:#4af">35%</span></div>
      <div style="color:#fd4">🐉 传说宠物(飞龙) — <span style="color:#fd4">100抽保底</span></div>
    </div>
    <div id="gacha-result-area" style="display:none"></div>
    <!-- Draw buttons -->
    <div id="gacha-draw-btns" style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap;justify-content:center">
      <button class="btn" id="btn-gacha-x1" style="flex:1;min-width:80px;padding:8px;font-size:11px;border-color:#f8a;color:#f8a">
        金币抽×1<br><span style="font-size:9px;color:#888">100金币</span>
      </button>
      <button class="btn" id="btn-gacha-x10" style="flex:1;min-width:80px;padding:8px;font-size:11px;border-color:#fd4;color:#fd4">
        金币抽×10<br><span style="font-size:9px;color:#888">1000金币</span>
      </button>
      <button class="btn" id="btn-gacha-ticket1" style="flex:1;min-width:80px;padding:8px;font-size:11px;border-color:#4ef;color:#4ef">
        券抽×1<br><span style="font-size:9px;color:#888">1张券</span>
      </button>
      <button class="btn" id="btn-gacha-ticket10" style="flex:1;min-width:80px;padding:8px;font-size:11px;border-color:#4fd;color:#4fd">
        券抽×10<br><span style="font-size:9px;color:#888">10张券</span>
      </button>
    </div>
    <button class="btn" id="btn-gacha-back" style="width:100%;padding:9px">← 返回</button>`,
'Gacha HTML: pools, odds, ticket buttons'
);

// ═══════════════════════════════════════════════════════
// 9. Gacha JS: tab switching, pet pool, ticket buttons
// ═══════════════════════════════════════════════════════
rep(
`document.getElementById('btn-gacha-x1').addEventListener('click',()=>doGacha(1));
document.getElementById('btn-gacha-x10').addEventListener('click',()=>doGacha(10));`,
`// Gacha tab system
let _gachaTab = 'sword';
function switchGachaTab(tab){
  _gachaTab = tab;
  document.getElementById('gacha-panel-sword').style.display = tab==='sword'?'':'none';
  document.getElementById('gacha-panel-pet').style.display   = tab==='pet'?'':'none';
  document.getElementById('gacha-panel-odds').style.display  = tab==='odds'?'':'none';
  document.getElementById('gacha-draw-btns').style.display   = tab==='odds'?'none':'flex';
}

// Pet pity helpers
function getPetPity(){ try{ return Math.max(0,parseInt(localStorage.getItem('pw_pet_pity')||'0',10)); }catch{ return 0; } }
function setPetPity(n){ try{ localStorage.setItem('pw_pet_pity',String(n)); }catch{} }
function hasDragonPet(){ try{ return localStorage.getItem('pw_has_dragon')==='1'; }catch{ return false; } }
function setDragonPet(){ try{ localStorage.setItem('pw_has_dragon','1'); }catch{} }

function updateGachaPetPityUI(){
  const p=getPetPity(); const has=hasDragonPet();
  const fill=document.getElementById('gacha-pet-pity-fill');
  const txt=document.getElementById('gacha-pet-pity-txt');
  if(fill) fill.style.width=(Math.min(100,p))+'%';
  if(txt) txt.textContent = has ? '保底进度: 已拥有飞龙 ✓' : '保底进度: '+p+'/100';
}

const PET_GACHA_POOL = [
  { w:60, icon:'🐱', name:'猫咪', rarity:'normal',  apply:()=>{ _addPet('cat'); } },
  { w:25, icon:'🐺', name:'狼犬', rarity:'elite',   apply:()=>{ _addPet('wolf'); } },
  { w:10, icon:'🦊', name:'火狐', rarity:'elite',   apply:()=>{ _addPet('fox'); } },
];

function petGachaDraw(){
  let pity=getPetPity();
  const has=hasDragonPet();
  pity++;
  const isDragon = (!has && pity>=100);
  setPetPity(isDragon ? 0 : pity);
  if(isDragon){
    setDragonPet(); _addPet('dragon');
    updateGachaPetPityUI();
    return { icon:'🐉', name:'飞龙', rarity:'legendary' };
  }
  let total=PET_GACHA_POOL.reduce((s,x)=>s+x.w,0);
  let r=Math.random()*total;
  for(const item of PET_GACHA_POOL){
    r-=item.w; if(r<=0){ item.apply(); updateGachaPetPityUI(); return { icon:item.icon, name:item.name, rarity:item.rarity }; }
  }
  PET_GACHA_POOL[0].apply(); updateGachaPetPityUI(); return { icon:PET_GACHA_POOL[0].icon, name:PET_GACHA_POOL[0].name, rarity:'normal' };
}

function doGachaPet(times, useTickets){
  if(useTickets){
    const tix=getGachaTickets();
    if(tix<times){ showGachaModal([{icon:'❌',name:'抽奖券不足',rarity:'normal'}]); return; }
    for(let i=0;i<times;i++) spendGachaTicket();
  } else {
    if(!spendCoins(times*100)){ showGachaModal([{icon:'❌',name:'金币不足',rarity:'normal'}]); return; }
  }
  const results=[];
  for(let i=0;i<times;i++) results.push(petGachaDraw());
  updateGachaPityUI();
  showGachaModal(results);
}

document.getElementById('btn-gacha-x1').addEventListener('click',()=>{ if(_gachaTab==='pet') doGachaPet(1); else doGacha(1); });
document.getElementById('btn-gacha-x10').addEventListener('click',()=>{ if(_gachaTab==='pet') doGachaPet(10); else doGacha(10); });
document.getElementById('btn-gacha-ticket1').addEventListener('click',()=>{ if(_gachaTab==='pet') doGachaPet(1,true); else doGacha(1,true); });
document.getElementById('btn-gacha-ticket10').addEventListener('click',()=>{ if(_gachaTab==='pet') doGachaPet(10,true); else doGacha(10,true); });`,
'Gacha JS: tab system, pet pool, ticket buttons'
);

// Update gacha open handler to also update pet pity
rep(
`document.getElementById('btn-gacha').addEventListener('click',()=>{
  document.getElementById('gacha-coins').textContent=getCoins();
  updateGachaPityUI();
  showOverlay('o-gacha');
});`,
`document.getElementById('btn-gacha').addEventListener('click',()=>{
  updateGachaPityUI(); updateGachaPetPityUI();
  showOverlay('o-gacha');
});`,
'Gacha open: also update pet pity UI'
);

// ═══════════════════════════════════════════════════════
// 10. Pet system — storage, PET_DEFS, management
// ═══════════════════════════════════════════════════════
// Insert pet system JS before the gacha system JS
rep(
`// ── Gacha system ──
function getGachaTickets(){`,
`// ═══════════════════════════════════════════════════════
// §30  Pet System
// ═══════════════════════════════════════════════════════
const PET_DEFS = {
  cat: {
    name:'猫咪', icon:'🐱', rarity:'normal', hp:50, dmg:20, spd:60, atkSpd:80,
    traits:['好奇心旺盛：偶尔冲向最近的敌人'],
    skill:'抓挠：每5秒对最近敌人造成30点伤害',
    desc:'活泼的小猫，会帮你抓挠敌人。',
    color:'#fa8'
  },
  wolf: {
    name:'狼犬', icon:'🐺', rarity:'elite', hp:100, dmg:45, spd:80, atkSpd:90,
    traits:['群狼之力：附近有其他宠物时伤害+20%'],
    skill:'嚎叫：每10秒使玩家获得5秒速度+20%',
    desc:'忠诚的战狼，擅长追击快速敌人。',
    color:'#aaa'
  },
  fox: {
    name:'火狐', icon:'🦊', rarity:'elite', hp:80, dmg:55, spd:90, atkSpd:85,
    traits:['元素亲和：攻击附带随机元素'],
    skill:'狐火：每8秒在敌人群中爆炸，造成范围伤害',
    desc:'神秘的火狐，精通元素魔法。',
    color:'#f84'
  },
  dragon: {
    name:'飞龙', icon:'🐉', rarity:'legendary', hp:100, dmg:100, spd:70, atkSpd:100,
    traits:['元素龙：攻击有5%概率附带随机元素状态'],
    skill:'飞龙在天：朝前方吐出冰路冻结敌人，或火焰灼烧并留下持续3秒的火路',
    desc:'传说中的飞龙，元素之力融于一身。',
    color:'#4f8',
    legendary: true
  }
};

function getPetList(){ try{ return JSON.parse(localStorage.getItem('pw_pets')||'[]'); }catch{ return []; } }
function savePetList(arr){ try{ localStorage.setItem('pw_pets',JSON.stringify(arr)); }catch{} }
function getActivePet(){ try{ return localStorage.getItem('pw_active_pet')||''; }catch{ return ''; } }
function setActivePet(id){ try{ localStorage.setItem('pw_active_pet',id||''); }catch{} }

function _addPet(id){
  if(!PET_DEFS[id]) return;
  const list=getPetList();
  if(id==='dragon'||id==='cat'||id==='wolf'||id==='fox'){
    if(!list.includes(id)) list.push(id);
    savePetList(list);
    renderPetOverlay && renderPetOverlay();
  }
}

// ═══════════════════════════════════════════════════════
// Pet in-game: follow player, attack, ability
// ═══════════════════════════════════════════════════════
function updatePet(dt){
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
  }

  // Pet skill
  pet.skillTimer -= dt;
  if(pet.skillTimer<=0){
    pet.skillTimer = 8.0;
    if(petId==='dragon'){
      // Dragon: alternate ice/fire breath
      pet.dragonPhase = (pet.dragonPhase||0)+1;
      const isIce = pet.dragonPhase % 2 === 0;
      const ang = p.lastMoveAngle || -Math.PI/2;
      // Spawn projectile strip
      for(let i=0;i<5;i++){
        const dist=40+i*35;
        const ex=pet.x+Math.cos(ang)*dist, ey=pet.y+Math.sin(ang)*dist;
        gs.pendingExplosions.push({ timer:i*0.08, x:ex, y:ey, radius:28, dmg:40, w:null,
          petBreath:true, isIce });
      }
      if(settings.particles) spawnParticles(pet.x,pet.y, isIce?['#8cf','#acf','#fff']:['#f84','#f44','#fd4'], 20, 90, 0.8, 4);
    } else if(petId==='fox'){
      const tgt=nearestEnemy(pet.x,pet.y);
      if(tgt){ missileDroneExplosion(tgt.x,tgt.y,50,80,null); if(settings.particles) spawnParticles(tgt.x,tgt.y,['#f84','#fd4'],16,80,0.6,4); }
    } else if(petId==='wolf'){
      p.spd += 20; setTimeout(()=>{ if(p) p.spd=Math.max(p.spd-20,30); },5000);
    } else if(petId==='cat'){
      pet.skillTimer=5;
      const tgt=nearestEnemy(pet.x,pet.y);
      if(tgt) hitEnemy(tgt,30*(p.dmgMult||1));
    }
  }
}

function renderPet(ctx, cam){
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
}

// Handle dragon breath explosions (isIce/fire)
const _origUpdatePendingExplosions_pet = updatePendingExplosions;

// ── Gacha system ──
function getGachaTickets(){`,
'Pet system JS'
);

// ═══════════════════════════════════════════════════════
// 11. Hook pet into game loop
// ═══════════════════════════════════════════════════════
rep(
`      updateFlyingSwords(dt);`,
`      updateFlyingSwords(dt);
      updatePet(dt);`,
'Hook updatePet into game loop'
);

// Hook pet render after player render
rep(
`  // Flying Swords
  {`,
`  // Pet
  if(typeof renderPet==='function') renderPet(ctx, cam);

  // Flying Swords
  {`,
'Hook renderPet into render loop'
);

// Dragon breath: apply ice/fire in pending explosions
rep(
`function updatePendingExplosions(dt) {
  if (!gs.pendingExplosions) return;
  gs.pendingExplosions = gs.pendingExplosions.filter(pe => {
    pe.timer -= dt;
    if (pe.timer <= 0) { missileDroneExplosion(pe.x, pe.y, pe.radius, pe.dmg, pe.w); return false; }
    return true;
  });
}`,
`function updatePendingExplosions(dt) {
  if (!gs.pendingExplosions) return;
  gs.pendingExplosions = gs.pendingExplosions.filter(pe => {
    pe.timer -= dt;
    if (pe.timer <= 0) {
      if (pe.petBreath) {
        // Dragon breath
        gs.enemies.forEach(e => {
          if(e.dead) return;
          const dx=e.x-pe.x, dy=e.y-pe.y;
          if(dx*dx+dy*dy < pe.radius*pe.radius) {
            hitEnemy(e, pe.dmg);
            if(pe.isIce) e.frostStacks=Math.min(10,(e.frostStacks||0)+3);
            else { e.flameStacks=Math.min(10,(e.flameStacks||0)+3); }
          }
        });
        if(settings.particles) spawnParticles(pe.x,pe.y, pe.isIce?['#8cf','#acf']:['#f84','#fd4'], 10, 60, 0.5, 3);
      } else {
        missileDroneExplosion(pe.x, pe.y, pe.radius, pe.dmg, pe.w);
      }
      return false;
    }
    return true;
  });
}`,
'updatePendingExplosions: dragon breath handling'
);

// Hook pet render for pet_bullet type
rep(
`    } else {
      // Generic bullet: elongated oval in direction of travel
      const _ba = Math.atan2(proj.vy||0, proj.vx||1);
      const _br = proj.radius||4;
      ctx.save(); ctx.translate(sx,sy); ctx.rotate(_ba);
      ctx.beginPath(); ctx.ellipse(0,0,_br*2.2,_br*0.7,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.45)';
      ctx.beginPath(); ctx.ellipse(-_br*0.4,-_br*0.2,_br*0.8,_br*0.3,0,0,Math.PI*2); ctx.fill();
      ctx.restore();
    }`,
`    } else if (proj.type==='pet_bullet') {
      ctx.globalAlpha=0.7;
      ctx.beginPath(); ctx.arc(sx,sy,proj.radius||3,0,Math.PI*2); ctx.fill();
      ctx.globalAlpha=1;
    } else {
      // Generic bullet: elongated oval in direction of travel
      const _ba = Math.atan2(proj.vy||0, proj.vx||1);
      const _br = proj.radius||4;
      ctx.save(); ctx.translate(sx,sy); ctx.rotate(_ba);
      ctx.beginPath(); ctx.ellipse(0,0,_br*2.2,_br*0.7,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.45)';
      ctx.beginPath(); ctx.ellipse(-_br*0.4,-_br*0.2,_br*0.8,_br*0.3,0,0,Math.PI*2); ctx.fill();
      ctx.restore();
    }`,
'Pet bullet render'
);

// ═══════════════════════════════════════════════════════
// 12. Pet overlay HTML (add before o-gacha)
// ═══════════════════════════════════════════════════════
rep(
`<!-- GACHA -->
<div class="overlay" id="o-gacha">`,
`<!-- PET -->
<div class="overlay" id="o-pet" style="background:#0d0d1a;padding:0;align-items:stretch;justify-content:stretch;flex-direction:row">
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
</div>

<!-- GACHA -->
<div class="overlay" id="o-gacha">`,
'Pet overlay HTML'
);

// ═══════════════════════════════════════════════════════
// 13. Pet button in main menu + Pet overlay JS
// ═══════════════════════════════════════════════════════
rep(
`    <button class="btn" id="btn-friends" style="border-color:#4ef;color:#4ef;padding:7px 16px;font-size:12px;position:relative">👥 好友<span id="friend-badge" style="display:none;position:absolute;top:-6px;right:-6px;background:#f84;color:#fff;font-size:9px;border-radius:50%;width:16px;height:16px;line-height:16px;text-align:center">!</span></button>`,
`    <button class="btn" id="btn-friends" style="border-color:#4ef;color:#4ef;padding:7px 16px;font-size:12px;position:relative">👥 好友<span id="friend-badge" style="display:none;position:absolute;top:-6px;right:-6px;background:#f84;color:#fff;font-size:9px;border-radius:50%;width:16px;height:16px;line-height:16px;text-align:center">!</span></button>
    <button class="btn" id="btn-pet" style="border-color:#4f8;color:#4f8;padding:7px 16px;font-size:12px">🐾 宠物</button>`,
'Add pet button to main menu'
);

// ═══════════════════════════════════════════════════════
// 14. Pet overlay JS handlers
// ═══════════════════════════════════════════════════════
rep(
`document.getElementById('btn-gacha-back').addEventListener('click',()=>showOverlay('o-menu'));`,
`document.getElementById('btn-gacha-back').addEventListener('click',()=>showOverlay('o-menu'));
document.getElementById('btn-pet-back').addEventListener('click',()=>showOverlay('o-menu'));
document.getElementById('btn-pet').addEventListener('click',()=>{ renderPetOverlay(); showOverlay('o-pet'); });
document.getElementById('btn-pet-deploy').addEventListener('click',()=>{
  const sel=document.querySelector('#pet-list-panel .pet-slot.pet-sel');
  if(!sel) return;
  const pid=sel.dataset.pet;
  setActivePet(pid);
  document.querySelectorAll('#pet-list-panel .pet-slot').forEach(s=>s.classList.remove('pet-active'));
  sel.classList.add('pet-active');
  const nameEl=document.getElementById('pet-center-name');
  if(nameEl&&pid) nameEl.style.color='#4f8';
  alert('🐾 '+PET_DEFS[pid]?.name+' 已设为出战宠物！下局游戏生效。');
});

let _selectedPet='';
function renderPetOverlay(){
  const list=getPetList();
  const active=getActivePet();
  const panel=document.getElementById('pet-list-panel');
  if(!panel) return;
  const rarityColor={normal:'#888',elite:'#4af',legendary:'#fd4'};
  panel.innerHTML='';
  if(!list.length){
    panel.innerHTML='<div style="font-size:9px;color:#444;text-align:center;padding:20px 0">暂无宠物<br>去抽奖获得！</div>';
  }
  list.forEach(pid=>{
    const def=PET_DEFS[pid]; if(!def) return;
    const slot=document.createElement('div');
    slot.className='pet-slot'+(pid===_selectedPet?' pet-sel':'')+(pid===active?' pet-active':'');
    slot.dataset.pet=pid;
    slot.style.cssText='padding:6px 4px;border-radius:6px;border:1.5px solid '+(pid===_selectedPet?'#4f8':rarityColor[def.rarity]||'#333')+';margin-bottom:6px;cursor:pointer;text-align:center;background:'+(pid===active?'rgba(0,100,50,0.3)':'rgba(0,0,0,0.3)');
    slot.innerHTML='<div style="font-size:26px">'+def.icon+'</div><div style="font-size:9px;color:'+(rarityColor[def.rarity]||'#888')+'">'+def.name+'</div>'+(pid===active?'<div style="font-size:8px;color:#4f8">出战中</div>':'');
    slot.addEventListener('click',()=>{
      _selectedPet=pid;
      document.getElementById('pet-center-icon').textContent=def.icon;
      document.getElementById('pet-center-name').textContent=def.name;
      document.getElementById('pet-center-rarity').textContent=['普通','精英','传说'][['normal','elite','legendary'].indexOf(def.rarity)]||'';
      const rarityC={normal:'#888',elite:'#4af',legendary:'#fd4'};
      document.getElementById('pet-center-rarity').style.color=rarityC[def.rarity]||'#888';
      document.getElementById('pet-info-panel').innerHTML=
        '<b style="color:#eee">📊 数值</b><br>HP: '+def.hp+'<br>伤害: '+def.dmg+'<br>速度: '+def.spd+'<br>攻速: '+def.atkSpd+
        '<br><br><b style="color:#eee">✨ 特性</b><br>'+def.traits.join('<br>')+
        '<br><br><b style="color:#eee">💫 技能</b><br>'+def.skill+
        '<br><br><b style="color:#888">'+def.desc+'</b>';
      renderPetOverlay();
    });
    panel.appendChild(slot);
  });
}`,
'Pet overlay JS handlers'
);

// ═══════════════════════════════════════════════════════
// 15. Pet in chat room (draggable)
// ═══════════════════════════════════════════════════════
rep(
`document.getElementById('btn-chat-back').addEventListener('click',()=>{`,
`// Pet in chat room
(function(){
  const activePetId = getActivePet ? getActivePet() : '';
  if(!activePetId || !PET_DEFS[activePetId]) return;
  const def = PET_DEFS[activePetId];
  const chatOverlay = document.getElementById('o-chat');
  if(!chatOverlay) return;
  const petEl = document.createElement('div');
  petEl.id = 'chat-pet';
  petEl.style.cssText = 'position:absolute;bottom:80px;left:80px;font-size:48px;cursor:grab;z-index:20;user-select:none;filter:drop-shadow(0 0 8px '+def.color+');line-height:1;transition:filter .2s';
  petEl.textContent = def.icon;
  petEl.title = def.name;
  chatOverlay.appendChild(petEl);
  // Draggable
  let dragging=false, dx=0, dy=0;
  petEl.addEventListener('mousedown', e=>{ dragging=true; dx=e.clientX-petEl.offsetLeft; dy=e.clientY-petEl.offsetTop; petEl.style.cursor='grabbing'; e.preventDefault(); });
  petEl.addEventListener('touchstart', e=>{ dragging=true; const t=e.touches[0]; dx=t.clientX-petEl.offsetLeft; dy=t.clientY-petEl.offsetTop; e.preventDefault(); },{passive:false});
  document.addEventListener('mousemove', e=>{ if(!dragging)return; petEl.style.left=Math.max(0,e.clientX-dx)+'px'; petEl.style.top=Math.max(0,e.clientY-dy)+'px'; });
  document.addEventListener('touchmove', e=>{ if(!dragging)return; const t=e.touches[0]; petEl.style.left=Math.max(0,t.clientX-dx)+'px'; petEl.style.top=Math.max(0,t.clientY-dy)+'px'; e.preventDefault(); },{passive:false});
  document.addEventListener('mouseup', ()=>{ dragging=false; petEl.style.cursor='grab'; });
  document.addEventListener('touchend', ()=>{ dragging=false; });
})();

document.getElementById('btn-chat-back').addEventListener('click',()=>{`,
'Pet in chat room (draggable)'
);

// ═══════════════════════════════════════════════════════
// 16. Initialize active pet in game state at start
// ═══════════════════════════════════════════════════════
// Set activePet on player init
rep(
`    skillCd: 0, skillKeyHeld: false,
  };`,
`    skillCd: 0, skillKeyHeld: false,
    activePet: (typeof getActivePet==='function' ? getActivePet() : ''),
  };`,
'Add activePet to player init'
);

rep(
`    swordOrbs: [],`,
`    swordOrbs: [],
    petState: null,`,
'Initialize petState in gs'
);

// ═══════════════════════════════════════════════════════
// 17. Update changelog + version
// ═══════════════════════════════════════════════════════
rep(
`const GAME_VERSION = 'v0.4.3';
document.getElementById('load-version').textContent = GAME_VERSION;
const CHANGELOG = [
  { version:'v0.4.3', date:'2026-04-04', items:[`,
`const GAME_VERSION = 'v0.5.0';
document.getElementById('load-version').textContent = GAME_VERSION;
const CHANGELOG = [
  { version:'v0.5.0', date:'2026-04-04', items:[
    '新增宠物系统：可在主菜单「宠物」页面查看/出战宠物',
    '新增宠物奖池：抽奖可获得猫咪/狼犬/火狐，100抽保底传说宠物「飞龙」',
    '飞龙特性：攻击5%概率附带元素，技能「飞龙在天」吐冰/火路',
    '进入聊天室时出战宠物会出现并可拖动',
    '新增抽奖券系统：邮箱领取10张抽奖券（飞剑奖池开放纪念）',
    '抽奖界面新增奖池概率展示（点📊概率查看）',
    '手机强制横屏提示',
    '敌人碰撞修复：不再互相重叠',
    '每波敌人数量增加约50%',
    '所有枪械子弹改为椭圆形（方向指示更清晰）',
    '飞剑奖池/宠物奖池均支持抽奖券',
  ]},
  { version:'v0.4.3', date:'2026-04-04', items:[`,
'Bump to v0.5.0 + changelog'
);

// ═══════════════════════════════════════════════════════
// Write back
// ═══════════════════════════════════════════════════════
fs.writeFileSync(HTML, html, 'utf8');
console.log('✓ index.html written');
console.log('Final size:', fs.statSync(HTML).size, 'bytes');
