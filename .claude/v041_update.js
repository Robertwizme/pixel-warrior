const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

// ── 1. Version ──
h = h.replace(`const GAME_VERSION = 'v0.4.0';`, `const GAME_VERSION = 'v0.4.1';`);

// ── 2. Changelog ──
h = h.replace(
`  { version:'v0.4.0', date:'2026-04-04', items:[`,
`  { version:'v0.4.1', date:'2026-04-04', items:[
    '聊天室左侧导航栏：可切换聊天室与私聊列表',
    '新增表情包面板（点击 😊 展开）',
    '聊天室禁言系统：累计发脏字1/2次警告，第3次禁言1分钟，之后依次升级，每天重置',
    '新增玩家等级系统（1-100级），打游戏获得经验，每升一级显示升级提示',
  ]},
  { version:'v0.4.0', date:'2026-04-04', items:[`
);

// ── 3. CSS ──
h = h.replace(
`.friend-avatar-sm{width:34px;height:34px;border-radius:50%;background:#1a1a2e;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;border:2px solid #334}`,
`.friend-avatar-sm{width:34px;height:34px;border-radius:50%;background:#1a1a2e;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;border:2px solid #334}
/* ── Chat sidebar ── */
.chat-tab-btn{border:none;cursor:pointer;transition:background .15s,color .15s}
.chat-tab-active{background:rgba(78,255,200,0.15) !important;color:#4fd !important}
/* ── Level badge ── */
#menu-level-badge{font-size:9px;color:#fd4;font-weight:700;letter-spacing:0.5px;line-height:1}
.xp-bar{width:46px;height:3px;background:#222;border-radius:2px;overflow:hidden}
.xp-bar-fill{height:100%;background:linear-gradient(90deg,#4fd,#a4f);transition:width .4s}`
);

// ── 4. Menu avatar: add level badge + XP bar ──
h = h.replace(
`    <div id="menu-avatar-icon" style="width:40px;height:40px;border-radius:50%;background:#1a1a2e;border:2px solid #334;display:flex;align-items:center;justify-content:center;font-size:23px">👦</div>
    <div id="menu-player-name" style="font-size:9px;color:#555;max-width:52px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center"></div>`,
`    <div id="menu-avatar-icon" style="width:40px;height:40px;border-radius:50%;background:#1a1a2e;border:2px solid #334;display:flex;align-items:center;justify-content:center;font-size:23px">👦</div>
    <div id="menu-level-badge">Lv.1</div>
    <div class="xp-bar"><div id="menu-xp-bar-fill" class="xp-bar-fill" style="width:0%"></div></div>
    <div id="menu-player-name" style="font-size:9px;color:#555;max-width:52px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center"></div>`
);

// ── 5. Chat overlay: full restructure with sidebar + emoji picker ──
h = h.replace(
`<div class="overlay" id="o-chat" style="background:#0d0d1a;align-items:stretch;justify-content:stretch;flex-direction:column">
  <!-- Chat header -->
  <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:rgba(0,0,0,0.5);border-bottom:1px solid #1e2030;flex-shrink:0">
    <div style="display:flex;align-items:center;gap:8px">
      <span id="chat-nick-show" style="font-size:13px;color:#4fd;cursor:pointer;font-weight:700" title="点击修改昵称">...</span>
    </div>
    <div style="display:flex;align-items:center;gap:8px">
      <button id="btn-chat-clear" style="display:none;background:#300;border:1px solid #f44;color:#f44;border-radius:4px;padding:4px 10px;font-size:11px;cursor:pointer" title="清空聊天室">🗑️ 清空</button>
      <div style="color:#4fd;font-size:15px;font-weight:700">💬 聊天室</div>
    </div>
    <button class="btn" id="btn-chat-back" style="padding:5px 12px;font-size:12px">← 返回</button>
  </div>
  <!-- Messages -->
  <div id="chat-messages" style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:6px;padding:12px 14px"></div>
  <!-- Input bar -->
  <div style="display:flex;align-items:center;gap:8px;padding:10px 14px;border-top:1px solid #1e2030;background:rgba(0,0,0,0.4);flex-shrink:0">
    <button id="btn-chat-compose" class="btn" style="padding:7px 11px;font-size:14px;min-width:38px" title="写消息">✏️</button>
    <div id="chat-input-area" style="flex:1;display:none;gap:6px">
      <input id="chat-input" type="text" maxlength="100" placeholder="输入消息（最多100字）..."
        style="flex:1;width:calc(100% - 58px);background:#111;border:1px solid #48f;border-radius:4px;
        color:#eee;padding:8px 10px;font-size:13px;font-family:inherit">
      <button class="btn primary" id="btn-chat-send" style="padding:7px 14px;font-size:13px">发</button>
    </div>
    <div id="chat-compose-hint" style="font-size:11px;color:#555;flex:1">点击 ✏️ 写消息</div>
  </div>
</div>`,
`<div class="overlay" id="o-chat" style="background:#0d0d1a;align-items:stretch;justify-content:stretch;flex-direction:row">
  <!-- LEFT SIDEBAR -->
  <div style="width:52px;background:rgba(0,0,0,0.55);border-right:1px solid #1e2030;display:flex;flex-direction:column;align-items:center;padding:10px 0;gap:6px;flex-shrink:0">
    <button id="chat-tab-room" class="chat-tab-btn chat-tab-active" onclick="switchChatSection('room')" title="聊天室" style="width:40px;height:40px;border-radius:8px;font-size:20px;line-height:1">💬</button>
    <button id="chat-tab-dm" class="chat-tab-btn" onclick="switchChatSection('dms')" title="私聊" style="width:40px;height:40px;border-radius:8px;font-size:20px;line-height:1;color:#555;background:none;position:relative">💌<span id="unread-dm-badge" style="display:none;position:absolute;top:3px;right:3px;width:8px;height:8px;background:#f84;border-radius:50%"></span></button>
  </div>
  <!-- MAIN PANEL -->
  <div style="flex:1;display:flex;flex-direction:column;min-width:0">
    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:rgba(0,0,0,0.5);border-bottom:1px solid #1e2030;flex-shrink:0">
      <div style="display:flex;align-items:center;gap:8px">
        <span id="chat-nick-show" style="font-size:13px;color:#4fd;cursor:pointer;font-weight:700" title="点击修改昵称">...</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        <button id="btn-chat-clear" style="display:none;background:#300;border:1px solid #f44;color:#f44;border-radius:4px;padding:4px 10px;font-size:11px;cursor:pointer" title="清空聊天室">🗑️ 清空</button>
        <div id="chat-panel-title" style="color:#4fd;font-size:14px;font-weight:700">💬 聊天室</div>
      </div>
      <button class="btn" id="btn-chat-back" style="padding:5px 12px;font-size:12px">← 返回</button>
    </div>
    <!-- Chat room messages -->
    <div id="chat-messages" style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:6px;padding:12px 14px"></div>
    <!-- DM list panel -->
    <div id="chat-dm-list-panel" style="flex:1;overflow-y:auto;display:none;flex-direction:column"></div>
    <!-- Emoji picker (collapsed by default) -->
    <div id="emoji-picker" style="display:none;flex-wrap:wrap;gap:2px;padding:6px 10px;background:rgba(0,0,0,0.85);border-top:1px solid #1e2030;flex-shrink:0"></div>
    <!-- Input bar -->
    <div id="chat-input-bar" style="display:flex;align-items:center;gap:6px;padding:10px 14px;border-top:1px solid #1e2030;background:rgba(0,0,0,0.4);flex-shrink:0">
      <button id="btn-chat-compose" class="btn" style="padding:7px 10px;font-size:14px;min-width:36px" title="写消息">✏️</button>
      <button id="btn-chat-emoji" class="btn" style="padding:7px 10px;font-size:14px" title="表情包">😊</button>
      <div id="chat-input-area" style="flex:1;display:none;gap:6px">
        <input id="chat-input" type="text" maxlength="100" placeholder="输入消息（最多100字）..."
          style="flex:1;width:calc(100% - 58px);background:#111;border:1px solid #48f;border-radius:4px;
          color:#eee;padding:8px 10px;font-size:13px;font-family:inherit">
        <button class="btn primary" id="btn-chat-send" style="padding:7px 14px;font-size:13px">发</button>
      </div>
      <div id="chat-compose-hint" style="font-size:11px;color:#555;flex:1">点击 ✏️ 写消息</div>
    </div>
  </div>
</div>`
);

// ── 6. sendChatMsg: add mute check + violation tracking ──
h = h.replace(
`async function sendChatMsg(text){
  const url=getChatUrl();if(!url||!text.trim())return false;
  if(_hasBadWord(text)){
    const inp=document.getElementById('chat-input');
    if(inp){inp.style.borderColor='#f44';setTimeout(()=>{inp.style.borderColor='#48f';},1500);}
    const hint=document.getElementById('chat-compose-hint');
    const orig=hint?.textContent;
    if(hint){hint.textContent='⚠️ 消息含不雅词语';hint.style.color='#f44';setTimeout(()=>{hint.textContent=orig||'';hint.style.color='';},2000);}
    return false;
  }`,
`async function sendChatMsg(text){
  const url=getChatUrl();if(!url||!text.trim())return false;
  if(_isMuted()){
    const hint=document.getElementById('chat-compose-hint');
    if(hint){hint.textContent='🔇 禁言中，剩余 '+_getMuteRemaining();hint.style.color='#f44';setTimeout(()=>{hint.textContent='';hint.style.color='';},3000);}
    return false;
  }
  if(_hasBadWord(text)){
    const inp=document.getElementById('chat-input');
    if(inp){inp.style.borderColor='#f44';setTimeout(()=>{inp.style.borderColor='#48f';},1500);}
    const hint=document.getElementById('chat-compose-hint');
    const muteMsg=_recordViolation();
    if(muteMsg){
      if(hint){hint.textContent='🔇 '+muteMsg;hint.style.color='#f44';setTimeout(()=>{hint.textContent='';hint.style.color='';},4000);}
    } else {
      const cnt=parseInt(localStorage.getItem('pw_vio_count')||'0',10);
      const warn='⚠️ 含不雅词（警告 '+cnt+'/2），第3次将被禁言';
      if(hint){hint.textContent=warn;hint.style.color='#f84';setTimeout(()=>{hint.textContent='';hint.style.color='';},2500);}
    }
    return false;
  }`
);

// ── 7. showDeadScreen: add XP ──
h = h.replace(
`  const earned = calcCoinsEarned(gs.wave.num, gs.kills);
  addCoins(earned);
  document.getElementById('dead-coins').innerHTML =
    \`💰 获得金币: <b>+\${earned}</b> &nbsp;（合计: <b>\${getCoins()}</b>）\`;`,
`  const earned = calcCoinsEarned(gs.wave.num, gs.kills);
  addCoins(earned);
  const _xpG=Math.floor(20+gs.wave.num*4+Math.floor(gs.kills/3));
  const _lvB=getPlayerLevel();addPlayerXP(_xpG);const _lvA=getPlayerLevel();
  document.getElementById('dead-coins').innerHTML =
    \`💰 金币: <b>+\${earned}</b>（合计: <b>\${getCoins()}</b>）&nbsp; ✨ 经验: <b style="color:#a4f">+\${_xpG}</b>\`+(_lvA>_lvB?\` <b style="color:#fd4">⬆️ Lv.\${_lvA}</b>\`:'');`
);

// ── 8. showVictoryScreen: add XP ──
h = h.replace(
`  const earned = calcCoinsEarned(30, gs.kills);
  addCoins(earned);
  document.getElementById('victory-coins').innerHTML =
    \`💰 获得金币: <b>+\${earned}</b> &nbsp;（合计: <b>\${getCoins()}</b>）\`;`,
`  const earned = calcCoinsEarned(30, gs.kills);
  addCoins(earned);
  const _xpG=Math.floor(20+30*4+Math.floor(gs.kills/3));
  const _lvB=getPlayerLevel();addPlayerXP(_xpG);const _lvA=getPlayerLevel();
  document.getElementById('victory-coins').innerHTML =
    \`💰 金币: <b>+\${earned}</b>（合计: <b>\${getCoins()}</b>）&nbsp; ✨ 经验: <b style="color:#a4f">+\${_xpG}</b>\`+(_lvA>_lvB?\` <b style="color:#fd4">⬆️ Lv.\${_lvA}</b>\`:'');`
);

// ── 9. updateMenuAvatar: call updateMenuLevel ──
h = h.replace(
`  if(nm){
    const n=getChatNick();
    nm.textContent=_autoNickPattern(n)?'':n;
  }
}
function openProfile(fromChat){`,
`  if(nm){
    const n=getChatNick();
    nm.textContent=_autoNickPattern(n)?'':n;
  }
  updateMenuLevel();
}
function openProfile(fromChat){`
);

// ── 10. Boot: call updateMenuLevel ──
h = h.replace(
`renderBestRun();
renderMenuCoins();
requestAnimationFrame(function bootstrap(ts) {`,
`renderBestRun();
renderMenuCoins();
updateMenuLevel();
requestAnimationFrame(function bootstrap(ts) {`
);

// ── 11. publishProfile: include level ──
h = h.replace(
`      body:JSON.stringify({nick,gender:getPlayerGender(),frame:getPlayerFrame(),
        bestWave:best.wave||0,bestKills:best.kills||0,bestScore:best.score||0,
        bestClass:best.className||'—',lastSeen:Date.now()})`,
`      body:JSON.stringify({nick,gender:getPlayerGender(),frame:getPlayerFrame(),
        bestWave:best.wave||0,bestKills:best.kills||0,bestScore:best.score||0,
        bestClass:best.className||'—',level:getPlayerLevel(),lastSeen:Date.now()})`
);

// ── 12. uprofile-stats: show level ──
h = h.replace(
`        '🏆 最高波数: <b style="color:#4fd">'+(profile.bestWave||0)+'</b> / 30<br>'+
        '💀 击杀数: <b style="color:#fd4">'+(profile.bestKills||0)+'</b><br>'+
        '⭐ 最高得分: <b style="color:#4f4">'+(profile.bestScore||0)+'</b><br>'+
        '⚔ 职业: <b style="color:#f8a">'+(profile.bestClass||'—')+'</b>';`,
`        '⚡ 等级: <b style="color:#fd4">Lv.'+(profile.level||1)+'</b><br>'+
        '🏆 最高波数: <b style="color:#4fd">'+(profile.bestWave||0)+'</b> / 30<br>'+
        '💀 击杀数: <b style="color:#fd4">'+(profile.bestKills||0)+'</b><br>'+
        '⭐ 最高得分: <b style="color:#4f4">'+(profile.bestScore||0)+'</b><br>'+
        '⚔ 职业: <b style="color:#f8a">'+(profile.bestClass||'—')+'</b>';`
);

// ── 13. New JS (before "// Initial chat preview poll") ──
h = h.replace(
`// Initial chat preview poll`,
`// §29 Player level system
function getPlayerLevel(){try{return Math.max(1,Math.min(100,parseInt(localStorage.getItem('pw_plv')||'1',10)));}catch{return 1;}}
function getPlayerXP(){try{return Math.max(0,parseInt(localStorage.getItem('pw_pxp')||'0',10));}catch{return 0;}}
function xpNeeded(lv){return lv*50;} // XP required to go from lv to lv+1

function addPlayerXP(amount){
  if(!amount||amount<=0)return{lv:getPlayerLevel(),xp:getPlayerXP(),leveled:false};
  let lv=getPlayerLevel(),xp=getPlayerXP()+amount,leveled=false;
  while(lv<100&&xp>=xpNeeded(lv)){xp-=xpNeeded(lv);lv++;leveled=true;}
  if(lv>=100)xp=0;
  try{localStorage.setItem('pw_plv',String(lv));localStorage.setItem('pw_pxp',String(xp));}catch{}
  updateMenuLevel();
  if(leveled)showLevelUpToast(lv);
  return{lv,xp,leveled};
}

function updateMenuLevel(){
  const lv=getPlayerLevel(),xp=getPlayerXP(),needed=xpNeeded(lv);
  const badge=document.getElementById('menu-level-badge');
  if(badge)badge.textContent='Lv.'+lv;
  const fill=document.getElementById('menu-xp-bar-fill');
  if(fill)fill.style.width=(lv>=100?100:Math.min(100,xp/needed*100)).toFixed(1)+'%';
}

function showLevelUpToast(lv){
  const t=document.createElement('div');
  t.style.cssText='position:fixed;top:22%;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.92);border:2px solid #fd4;color:#fd4;padding:14px 24px;border-radius:10px;font-size:15px;font-weight:700;z-index:9999;text-align:center;pointer-events:none';
  t.innerHTML='⬆️ 升级！<br><span style="font-size:26px;color:#fff">Lv.'+lv+'</span>';
  document.body.appendChild(t);
  setTimeout(()=>{t.style.cssText+=';opacity:0;transition:opacity .6s';},1600);
  setTimeout(()=>t.remove(),2300);
}

// §30 Mute / violation system
function _isMuted(){try{return Date.now()<(parseInt(localStorage.getItem('pw_mute_until')||'0',10));}catch{return false;}}
function _getMuteRemaining(){
  try{
    const ms=(parseInt(localStorage.getItem('pw_mute_until')||'0',10))-Date.now();
    if(ms<=0)return'';
    if(ms<60000)return Math.ceil(ms/1000)+'秒';
    if(ms<3600000)return Math.ceil(ms/60000)+'分钟';
    return Math.ceil(ms/3600000)+'小时';
  }catch{return'';}
}
function _recordViolation(){
  try{
    const today=new Date().toDateString();
    let cnt=0;
    if(localStorage.getItem('pw_vio_day')===today){
      cnt=parseInt(localStorage.getItem('pw_vio_count')||'0',10);
    }
    cnt++;
    localStorage.setItem('pw_vio_count',String(cnt));
    localStorage.setItem('pw_vio_day',today);
    let dur=0;
    if(cnt===3)dur=60000;           // 1 min
    else if(cnt===4)dur=3600000;    // 1 hour
    else if(cnt===5)dur=6*3600000;  // 6 hours
    else if(cnt>=6)dur=24*3600000;  // 24 hours
    if(dur>0){
      localStorage.setItem('pw_mute_until',String(Date.now()+dur));
      return '已被禁言 '+_getMuteRemaining()+'（脏字累计第'+cnt+'次）';
    }
    return null;
  }catch{return null;}
}

// §31 Chat sidebar switching
let _chatSection='room';
function switchChatSection(section){
  _chatSection=section;
  const isRoom=section==='room';
  document.getElementById('chat-tab-room').classList.toggle('chat-tab-active',isRoom);
  document.getElementById('chat-tab-dm').classList.toggle('chat-tab-active',!isRoom);
  document.getElementById('chat-messages').style.display=isRoom?'flex':'none';
  document.getElementById('chat-dm-list-panel').style.display=isRoom?'none':'flex';
  const ib=document.getElementById('chat-input-bar');if(ib)ib.style.display=isRoom?'flex':'none';
  const ep=document.getElementById('emoji-picker');if(ep)ep.style.display='none';
  const pt=document.getElementById('chat-panel-title');if(pt)pt.textContent=isRoom?'💬 聊天室':'💌 私聊';
  if(!isRoom)renderInlineDmList();
}

async function renderInlineDmList(){
  const el=document.getElementById('chat-dm-list-panel');if(!el)return;
  el.innerHTML='<div style="text-align:center;padding:20px;color:#444;font-size:11px">加载中...</div>';
  const url=getChatUrl();
  if(!url){el.innerHTML='<div style="text-align:center;padding:20px;color:#444;font-size:11px">未配置数据库</div>';return;}
  let friends={};
  try{const r=await fetch(url+'/friends/'+_encNick(getChatNick())+'.json');if(r.ok)friends=await r.json()||{};}catch{}
  const list=Object.values(friends).filter(f=>f&&f.status==='accepted');
  if(!list.length){
    el.innerHTML='<div style="text-align:center;padding:50px 20px;color:#444;font-size:12px">还没有好友<br><span style="font-size:10px;color:#333">返回聊天室点别人头像来加好友！</span></div>';
    return;
  }
  el.innerHTML=list.map(f=>{
    const nAttr=f.nick.replace(/&/g,'&amp;').replace(/"/g,'&quot;');
    return '<div class="friend-item" data-nick="'+nAttr+'" onclick="openDM(this.dataset.nick)">'+
      '<div class="friend-avatar-sm" style="font-size:16px;font-weight:700;color:#4ef">'+f.nick.charAt(0)+'</div>'+
      '<div style="flex:1"><div style="font-size:12px;color:#eee">'+f.nick.replace(/</g,'&lt;')+'</div>'+
      '<div style="font-size:10px;color:#555">点击私聊</div></div>'+
      '<span style="font-size:18px;color:#4ef">💬</span></div>';
  }).join('');
}

// §32 Emoji picker
const _CHAT_EMOJIS=['😊','😂','🥲','😍','😎','😭','🤔','😤','😴','🤩',
  '👍','👎','❤','🔥','💯','🎉','💪','🙏','👀','😈',
  '⚔','🛡','💊','🎮','🏆','💰','⭐','🎯','💀','🌟',
  '😱','🤯','🥳','😇','🤡','👻','🐉','🌈','⚡','🍀'];

function toggleEmojiPicker(){
  const ep=document.getElementById('emoji-picker');if(!ep)return;
  if(ep.style.display==='none'||!ep.style.display){
    if(!ep.children.length){
      ep.innerHTML=_CHAT_EMOJIS.map(e=>
        '<button onclick="insertChatEmoji(\''+e+'\')" style="font-size:22px;background:none;border:none;cursor:pointer;padding:3px;border-radius:4px;line-height:1">'+e+'</button>'
      ).join('');
    }
    ep.style.display='flex';
  } else {
    ep.style.display='none';
  }
}

function insertChatEmoji(e){
  const inp=document.getElementById('chat-input');if(!inp)return;
  // Open input area if hidden
  if(!_chatInputVisible){
    _chatInputVisible=true;
    const area=document.getElementById('chat-input-area');
    const hint=document.getElementById('chat-compose-hint');
    if(area)area.style.display='flex';
    if(hint)hint.style.display='none';
    const btn=document.getElementById('btn-chat-compose');
    if(btn)btn.textContent='✖';
  }
  const pos=inp.selectionStart!=null?inp.selectionStart:inp.value.length;
  inp.value=inp.value.slice(0,pos)+e+inp.value.slice(inp.selectionEnd!=null?inp.selectionEnd:pos);
  inp.focus();
  const newPos=pos+e.length;
  inp.setSelectionRange(newPos,newPos);
}

// Emoji button listener
document.getElementById('btn-chat-emoji').addEventListener('click',()=>{
  if(_chatSection==='room')toggleEmojiPicker();
});

// Initial chat preview poll`
);

fs.writeFileSync('index.html', h, 'utf8');
console.log('Done. Size:', h.length);
