const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

// ── 1. Fix clear button: separate try/catch so nicks DELETE always runs ──
h = h.replace(
`document.getElementById('btn-chat-clear').addEventListener('click',async()=>{
  if(getChatNick()!=='作者')return;
  if(!confirm('确定清空所有聊天内容？'))return;
  const url=getChatUrl();if(!url)return;
  try{
    await fetch(url+'/chat.json',{method:'DELETE'});
    await fetch(url+'/nicks.json',{method:'DELETE'});
    document.getElementById('chat-messages').innerHTML=
      '<div style="text-align:center;color:#444;padding:20px;font-size:11px">聊天已清空</div>';
    SFX.play('click');
  }catch(e){alert('清空失败');}
});`,
`document.getElementById('btn-chat-clear').addEventListener('click',async()=>{
  if(getChatNick()!=='作者')return;
  if(!confirm('确定清空聊天内容和昵称注册记录？'))return;
  const url=getChatUrl();if(!url)return;
  let ok1=false,ok2=false;
  try{const r=await fetch(url+'/chat.json',{method:'DELETE'});ok1=r.ok;}catch{}
  try{const r=await fetch(url+'/nicks.json',{method:'DELETE'});ok2=r.ok;}catch{}
  try{await fetch(url+'/profiles.json',{method:'DELETE'});}catch{}
  try{await fetch(url+'/friends.json',{method:'DELETE'});}catch{}
  try{await fetch(url+'/dm.json',{method:'DELETE'});}catch{}
  document.getElementById('chat-messages').innerHTML=
    '<div style="text-align:center;color:#444;padding:20px;font-size:11px">'
    +(ok1?'✅ 聊天已清空':'❌ 聊天清空失败')+'&nbsp;'+(ok2?'✅ 昵称已清空':'❌ 昵称清空失败')+'</div>';
  if(ok1||ok2)SFX.play('click');
});`
);

// ── 2. Version bump ──
h = h.replace(
`const GAME_VERSION = 'v0.3.4';`,
`const GAME_VERSION = 'v0.4.0';`
);

// ── 3. Changelog ──
h = h.replace(
`const CHANGELOG = [
  { version:'v0.3.4', date:'2026-04-03', items:[
    '聊天室昵称唯一性验证：重名提示请换一个',
    '聊天室屏蔽不雅词语',
    '聊天不再自动滚到底部（滑轮回看历史消息时不打断）',
    '聊天彩色消息：#R红 #Y黄 #B蓝 #G绿 #P粉 #小九牛逼彩色',
  ]},`,
`const CHANGELOG = [
  { version:'v0.4.0', date:'2026-04-04', items:[
    '新增图鉴：怪物/角色/武器/补给全图鉴',
    '新增抽奖系统（奖池准备中）',
    '聊天室点击头像可查看玩家档案及战绩',
    '新增好友系统：加好友、接受/拒绝好友请求',
    '新增私聊：好友之间可发送私信',
    '修复管理员清空昵称注册记录失败的问题',
  ]},
  { version:'v0.3.4', date:'2026-04-03', items:[
    '聊天室昵称唯一性验证：重名提示请换一个',
    '聊天室屏蔽不雅词语',
    '聊天不再自动滚到底部（滑轮回看历史消息时不打断）',
    '聊天彩色消息：#R红 #Y黄 #B蓝 #G绿 #P粉 #小九牛逼彩色',
  ]},`
);

// ── 4. CSS ──
h = h.replace(
`@media(min-width:521px) and (max-width:900px){
  .panel{max-width:92vw !important}
  #menu-topbar .btn{padding:6px 11px !important;font-size:11px !important}
}`,
`@media(min-width:521px) and (max-width:900px){
  .panel{max-width:92vw !important}
  #menu-topbar .btn{padding:6px 11px !important;font-size:11px !important}
}
/* ── Codex ── */
.codex-tab{flex:1;padding:9px 4px;background:none;border:none;border-bottom:2px solid transparent;color:#555;font-size:11px;cursor:pointer;font-family:inherit;transition:color .15s}
.codex-tab.active{color:#a4f;border-bottom-color:#a4f}
.codex-subtab{flex:1;padding:6px 4px;background:none;border:none;border-bottom:2px solid transparent;color:#444;font-size:10px;cursor:pointer;font-family:inherit;white-space:nowrap}
.codex-subtab.active{color:#4fd;border-bottom-color:#4fd}
.codex-card{display:flex;gap:10px;padding:10px 12px;border-bottom:1px solid #1a1a2e;align-items:flex-start}
.codex-card:last-child{border-bottom:none}
.codex-icon{font-size:26px;width:36px;text-align:center;flex-shrink:0;padding-top:2px}
.codex-name{font-size:13px;font-weight:700;color:#eee;margin-bottom:3px}
.codex-stats{font-size:10px;color:#6a8a6a;margin-bottom:3px;font-family:monospace}
.codex-desc{font-size:11px;color:#666;line-height:1.4}
/* ── Friend/DM ── */
.friend-item{display:flex;align-items:center;gap:10px;padding:9px 14px;border-bottom:1px solid #1a1a2e;cursor:pointer}
.friend-item:hover{background:rgba(255,255,255,0.03)}
.friend-avatar-sm{width:34px;height:34px;border-radius:50%;background:#1a1a2e;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;border:2px solid #334}`
);

// ── 5. Topbar: add 图鉴 抽奖 好友 ──
h = h.replace(
`    <button class="btn" id="btn-activity" style="border-color:#4fd;color:#4fd;padding:7px 16px;font-size:12px">🎪 活动</button>`,
`    <button class="btn" id="btn-activity" style="border-color:#4fd;color:#4fd;padding:7px 16px;font-size:12px">🎪 活动</button>
    <button class="btn" id="btn-codex" style="border-color:#a4f;color:#a4f;padding:7px 16px;font-size:12px">📖 图鉴</button>
    <button class="btn" id="btn-gacha" style="border-color:#f8a;color:#f8a;padding:7px 16px;font-size:12px">🎰 抽奖</button>
    <button class="btn" id="btn-friends" style="border-color:#4ef;color:#4ef;padding:7px 16px;font-size:12px;position:relative">👥 好友<span id="friend-badge" style="display:none;position:absolute;top:-6px;right:-6px;background:#f84;color:#fff;font-size:9px;border-radius:50%;width:16px;height:16px;line-height:16px;text-align:center">!</span></button>`
);

// ── 6. New overlays (before <!-- SHOP -->) ──
h = h.replace(
`</div>

<!-- SHOP -->`,
`</div>

<!-- CODEX -->
<div class="overlay" id="o-codex">
  <div class="panel" style="max-width:480px;width:94%;max-height:86vh;display:flex;flex-direction:column;padding:0;overflow:hidden">
    <div style="display:flex;align-items:center;justify-content:space-between;padding:13px 16px;border-bottom:1px solid #222;flex-shrink:0">
      <div style="color:#a4f;font-size:16px;font-weight:700">📖 图鉴</div>
      <button class="btn" id="btn-codex-back" style="padding:4px 10px;font-size:11px">← 返回</button>
    </div>
    <div style="display:flex;border-bottom:1px solid #222;flex-shrink:0" id="codex-tabs">
      <button class="codex-tab active" data-tab="monster">👾 怪物</button>
      <button class="codex-tab" data-tab="char">⚔ 角色</button>
      <button class="codex-tab" data-tab="weapon">🔫 武器</button>
      <button class="codex-tab" data-tab="supply">🎁 补给</button>
    </div>
    <div id="codex-subtabs" style="display:flex;border-bottom:1px solid #1a1a2e;flex-shrink:0;background:rgba(0,0,0,0.3);min-height:30px"></div>
    <div id="codex-content" style="flex:1;overflow-y:auto"></div>
  </div>
</div>

<!-- GACHA -->
<div class="overlay" id="o-gacha">
  <div class="panel" style="max-width:400px;text-align:center;padding:24px">
    <div style="font-size:20px;color:#f8a;margin-bottom:4px;letter-spacing:2px">🎰 抽奖</div>
    <div style="font-size:11px;color:#555;margin-bottom:16px">当前金币: <b id="gacha-coins" style="color:#fd4">0</b></div>
    <div style="background:rgba(255,255,255,0.03);border:1px solid #2a2a4a;border-radius:10px;padding:22px 16px;margin-bottom:16px">
      <div style="font-size:44px;margin-bottom:8px">🎁</div>
      <div style="font-size:14px;color:#eee;margin-bottom:6px">标准奖池</div>
      <div style="font-size:11px;color:#555">奖池准备中，敬请期待！</div>
    </div>
    <div style="display:flex;gap:10px;margin-bottom:14px">
      <div style="flex:1;padding:12px;font-size:12px;border:1px solid #2a2a4a;border-radius:6px;color:#444;cursor:not-allowed">
        抽 ×1<br><span style="font-size:9px;color:#333">100 金币</span>
      </div>
      <div style="flex:1;padding:12px;font-size:12px;border:1px solid #2a2a4a;border-radius:6px;color:#444;cursor:not-allowed">
        抽 ×10<br><span style="font-size:9px;color:#333">1000 金币</span>
      </div>
    </div>
    <button class="btn" id="btn-gacha-back" style="width:100%;padding:9px">← 返回</button>
  </div>
</div>

<!-- USER PROFILE VIEW -->
<div class="overlay" id="o-user-profile">
  <div class="panel" style="max-width:320px;text-align:center">
    <div style="font-size:14px;color:#4fd;margin-bottom:14px;letter-spacing:2px">👤 玩家档案</div>
    <div id="uprofile-avatar" style="width:64px;height:64px;border-radius:50%;background:#1a1a2e;border:3px solid #334;display:flex;align-items:center;justify-content:center;font-size:38px;margin:0 auto 10px;transition:border-color .2s,box-shadow .2s"></div>
    <div id="uprofile-nick" style="font-size:16px;font-weight:700;color:#eee;margin-bottom:10px"></div>
    <div id="uprofile-stats" style="font-size:11px;color:#666;line-height:2;margin-bottom:14px;background:rgba(0,0,0,0.3);border-radius:6px;padding:10px;text-align:left"></div>
    <div id="uprofile-actions" style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap"></div>
    <button class="btn" id="btn-uprofile-back" style="width:100%;padding:8px;font-size:12px">← 返回</button>
  </div>
</div>

<!-- FRIENDS -->
<div class="overlay" id="o-friends">
  <div class="panel" style="max-width:420px;width:94%;max-height:82vh;display:flex;flex-direction:column;padding:0;overflow:hidden">
    <div style="display:flex;align-items:center;justify-content:space-between;padding:13px 16px;border-bottom:1px solid #222;flex-shrink:0">
      <div style="color:#4ef;font-size:16px;font-weight:700">👥 好友</div>
      <button class="btn" id="btn-friends-back" style="padding:4px 10px;font-size:11px">← 返回</button>
    </div>
    <div style="display:flex;border-bottom:1px solid #222;flex-shrink:0">
      <button class="codex-tab active" id="ftab-list">好友列表</button>
      <button class="codex-tab" id="ftab-req">待处理 <span id="freq-badge" style="color:#f84;font-weight:700"></span></button>
    </div>
    <div id="friends-content" style="flex:1;overflow-y:auto"></div>
  </div>
</div>

<!-- DM (Private chat) -->
<div class="overlay" id="o-dm" style="background:#0d0d1a;align-items:stretch;justify-content:stretch;flex-direction:column">
  <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:rgba(0,0,0,0.5);border-bottom:1px solid #1e2030;flex-shrink:0">
    <div style="color:#4ef;font-size:14px;font-weight:700">🔒 私聊: <span id="dm-friend-name">-</span></div>
    <button class="btn" id="btn-dm-back" style="padding:5px 12px;font-size:12px">← 返回</button>
  </div>
  <div id="dm-messages" style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:6px;padding:12px 14px"></div>
  <div style="display:flex;align-items:center;gap:8px;padding:10px 14px;border-top:1px solid #1e2030;background:rgba(0,0,0,0.4);flex-shrink:0">
    <input id="dm-input" type="text" maxlength="200" placeholder="输入私信（最多200字）..." style="flex:1;background:#111;border:1px solid #4ef;border-radius:4px;color:#eee;padding:8px 10px;font-size:13px;font-family:inherit">
    <button class="btn primary" id="btn-dm-send" style="padding:7px 14px;font-size:13px">发</button>
  </div>
</div>

<!-- SHOP -->`
);

// ── 7. renderChatMsgs: make other user avatar clickable ──
h = h.replace(
`      const firstCh=(m.nick||'?').charAt(0);
      return '<div class="chat-msg">'+
        '<div class="chat-avatar" style="font-size:14px;font-weight:700;color:#4fd">'+firstCh+'</div>'+`,
`      const firstCh=(m.nick||'?').charAt(0);
      const _sn=(m.nick||'').replace(/\\\\/g,'\\\\\\\\').replace(/'/g,"\\\\'");
      return '<div class="chat-msg">'+
        '<div class="chat-avatar" style="font-size:14px;font-weight:700;color:#4fd;cursor:pointer" onclick="viewUserProfile(\''+_sn+'\')">'+firstCh+'</div>'+`
);

// ── 8. showOverlay wrapper: publish profile + friends badge on open ──
h = h.replace(
`    _chatOpen=(id==='o-chat');
    if(_chatOpen){
      const _nick=getChatNick();
      document.getElementById('chat-nick-show').textContent=_nick;
      document.getElementById('btn-chat-clear').style.display=_nick==='作者'?'':'none';
      startChatPoll();
    }
    orig(id);`,
`    _chatOpen=(id==='o-chat');
    if(_chatOpen){
      const _nick=getChatNick();
      document.getElementById('chat-nick-show').textContent=_nick;
      document.getElementById('btn-chat-clear').style.display=_nick==='作者'?'':'none';
      startChatPoll();
      publishProfile();
    }
    if(id==='o-friends'){renderFriendsList();checkFriendBadge();}
    orig(id);`
);

// ── 9. New JS systems (before "// Initial chat preview poll") ──
h = h.replace(
`// Initial chat preview poll`,
`// §24 Profile publishing
async function publishProfile(){
  const url=getChatUrl();if(!url)return;
  const nick=getChatNick();
  const best=loadBest()||{};
  try{
    await fetch(url+'/profiles/'+encodeURIComponent(nick)+'.json',{
      method:'PUT',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({nick,gender:getPlayerGender(),frame:getPlayerFrame(),
        bestWave:best.wave||0,bestKills:best.kills||0,bestScore:best.score||0,
        bestClass:best.className||'—',lastSeen:Date.now()})
    });
  }catch{}
}

// §25 User profile view
let _viewedNick='',_uprofileBack='o-chat';
function _encNick(n){return encodeURIComponent(n);}

async function viewUserProfile(nick,fromOverlay){
  if(!nick||nick===getChatNick())return;
  _viewedNick=nick;
  _uprofileBack=fromOverlay||'o-chat';
  const pa=document.getElementById('uprofile-avatar');
  const pn=document.getElementById('uprofile-nick');
  const ps=document.getElementById('uprofile-stats');
  const acts=document.getElementById('uprofile-actions');
  if(pa){pa.textContent='👤';pa.style.borderColor='#334';pa.style.boxShadow='none';}
  if(pn)pn.textContent=nick;
  if(ps)ps.innerHTML='<span style="color:#444">加载中...</span>';
  if(acts)acts.innerHTML='';
  showOverlay('o-user-profile');
  const url=getChatUrl();
  let profile=null;
  if(url){try{const r=await fetch(url+'/profiles/'+_encNick(nick)+'.json');if(r.ok)profile=await r.json();}catch{}}
  if(profile){
    const g=profile.gender||'male';const f=profile.frame||'';
    if(pa){
      pa.textContent=getGenderEmoji(g);
      const fs=getFrameStyle(f);
      pa.style.borderColor=fs.match(/border-color:([^;]+)/)?.[1]||'#334';
      pa.style.boxShadow=fs.match(/box-shadow:([^;]+)/)?.[1]||'none';
    }
    if(ps){
      ps.innerHTML=
        '🏆 最高波数: <b style="color:#4fd">'+(profile.bestWave||0)+'</b> / 30<br>'+
        '💀 击杀数: <b style="color:#fd4">'+(profile.bestKills||0)+'</b><br>'+
        '⭐ 最高得分: <b style="color:#4f4">'+(profile.bestScore||0)+'</b><br>'+
        '⚔ 职业: <b style="color:#f8a">'+(profile.bestClass||'—')+'</b>';
    }
  } else {
    if(pa)pa.textContent='👤';
    if(ps)ps.innerHTML='<span style="color:#444">暂无战绩，或该玩家从未进入聊天室</span>';
  }
  await _updateUProfileActions(nick);
}

async function _updateUProfileActions(nick){
  const acts=document.getElementById('uprofile-actions');if(!acts)return;
  const status=await getFriendStatus(nick);
  const sn=nick.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
  if(status==='accepted'){
    acts.innerHTML=
      '<button class="btn" onclick="openDM(\''+sn+'\')" style="flex:1;padding:8px;font-size:12px;border-color:#4ef;color:#4ef">💬 私聊</button>'+
      '<div style="flex:1;font-size:11px;color:#4fd;text-align:center;display:flex;align-items:center;justify-content:center">✅ 已是好友</div>';
  } else if(status==='pending_sent'){
    acts.innerHTML='<div style="width:100%;font-size:11px;color:#888;text-align:center;padding:8px">⏳ 好友请求已发送</div>';
  } else if(status==='pending_recv'){
    acts.innerHTML=
      '<button class="btn primary" onclick="_acceptFriend(\''+sn+'\')" style="flex:1;padding:8px;font-size:12px">✅ 接受好友</button>'+
      '<button class="btn" onclick="_declineFriend(\''+sn+'\')" style="flex:1;padding:8px;font-size:12px;border-color:#f44;color:#f44">❌ 拒绝</button>';
  } else {
    acts.innerHTML=
      '<button class="btn primary" onclick="sendFriendReq(\''+sn+'\')" style="width:100%;padding:8px;font-size:12px">➕ 加好友</button>';
  }
}

async function getFriendStatus(otherNick){
  const url=getChatUrl();if(!url)return'none';
  try{
    const r=await fetch(url+'/friends/'+_encNick(getChatNick())+'/'+_encNick(otherNick)+'.json');
    if(!r.ok)return'none';const d=await r.json();if(!d)return'none';
    return d.status||'none';
  }catch{return'none';}
}

async function sendFriendReq(otherNick){
  const url=getChatUrl();if(!url)return;
  const me=getChatNick();
  try{
    await Promise.all([
      fetch(url+'/friends/'+_encNick(me)+'/'+_encNick(otherNick)+'.json',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({nick:otherNick,status:'pending_sent',ts:Date.now()})}),
      fetch(url+'/friends/'+_encNick(otherNick)+'/'+_encNick(me)+'.json',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({nick:me,status:'pending_recv',ts:Date.now()})})
    ]);
    SFX.play('click');
    await _updateUProfileActions(otherNick);
  }catch{alert('发送失败，请检查网络');}
}

async function _acceptFriend(otherNick){
  const url=getChatUrl();if(!url)return;const me=getChatNick();
  try{
    await Promise.all([
      fetch(url+'/friends/'+_encNick(me)+'/'+_encNick(otherNick)+'.json',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({nick:otherNick,status:'accepted',ts:Date.now()})}),
      fetch(url+'/friends/'+_encNick(otherNick)+'/'+_encNick(me)+'.json',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({nick:me,status:'accepted',ts:Date.now()})})
    ]);
    SFX.play('levelup');
    if(_viewedNick===otherNick)await _updateUProfileActions(otherNick);
    checkFriendBadge();
    const fc=document.getElementById('friends-content');if(fc)renderFriendsContent();
  }catch{alert('操作失败');}
}

async function _declineFriend(otherNick){
  const url=getChatUrl();if(!url)return;const me=getChatNick();
  try{
    await Promise.all([
      fetch(url+'/friends/'+_encNick(me)+'/'+_encNick(otherNick)+'.json',{method:'DELETE'}),
      fetch(url+'/friends/'+_encNick(otherNick)+'/'+_encNick(me)+'.json',{method:'DELETE'})
    ]);
    SFX.play('click');
    if(_viewedNick===otherNick)await _updateUProfileActions(otherNick);
    checkFriendBadge();
    const fc=document.getElementById('friends-content');if(fc)renderFriendsContent();
  }catch{}
}

// §26 Friend list
let _friendTab='list';
function switchFriendTab(tab){
  _friendTab=tab;
  document.getElementById('ftab-list').classList.toggle('active',tab==='list');
  document.getElementById('ftab-req').classList.toggle('active',tab==='req');
  renderFriendsContent();
}
function renderFriendsContent(){renderFriendsList();}

async function renderFriendsList(){
  const el=document.getElementById('friends-content');if(!el)return;
  el.innerHTML='<div style="text-align:center;padding:30px;color:#444;font-size:11px">加载中...</div>';
  const url=getChatUrl();
  if(!url){el.innerHTML='<div style="text-align:center;padding:30px;color:#444;font-size:11px">未配置数据库</div>';return;}
  let friends={};
  try{const r=await fetch(url+'/friends/'+_encNick(getChatNick())+'.json');if(r.ok)friends=await r.json()||{};}catch{}
  const list=Object.values(friends).filter(f=>f&&f.status==='accepted');
  const reqs=Object.values(friends).filter(f=>f&&f.status==='pending_recv');
  const fbadge=document.getElementById('friend-badge');
  if(fbadge)fbadge.style.display=reqs.length?'':'none';
  const freqBadge=document.getElementById('freq-badge');
  if(freqBadge)freqBadge.textContent=reqs.length?'('+reqs.length+')':'';
  if(_friendTab==='list'){
    if(!list.length){el.innerHTML='<div style="text-align:center;padding:50px 20px;color:#444;font-size:12px">还没有好友<br><span style="font-size:10px;color:#333">去聊天室点击别人的头像来加好友！</span></div>';return;}
    el.innerHTML=list.map(f=>{
      const sn=f.nick.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
      return '<div class="friend-item" onclick="openDM(\''+sn+'\')">'+
        '<div class="friend-avatar-sm" style="font-size:16px;font-weight:700;color:#4ef">'+f.nick.charAt(0)+'</div>'+
        '<div style="flex:1"><div style="font-size:12px;color:#eee">'+f.nick.replace(/</g,'&lt;')+'</div><div style="font-size:10px;color:#555">点击私聊</div></div>'+
        '<span style="font-size:18px;color:#4ef">💬</span>'+
      '</div>';
    }).join('');
  } else {
    if(!reqs.length){el.innerHTML='<div style="text-align:center;padding:50px 20px;color:#444;font-size:12px">暂无待处理的好友请求</div>';return;}
    el.innerHTML=reqs.map(f=>{
      const sn=f.nick.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
      return '<div class="friend-item">'+
        '<div class="friend-avatar-sm" style="font-size:14px;font-weight:700;color:#4fd">'+f.nick.charAt(0)+'</div>'+
        '<div style="flex:1"><div style="font-size:12px;color:#eee">'+f.nick.replace(/</g,'&lt;')+'</div><div style="font-size:10px;color:#888">想加你为好友</div></div>'+
        '<button class="btn primary" onclick="_acceptFriend(\''+sn+'\')" style="padding:5px 10px;font-size:11px;margin-right:6px">接受</button>'+
        '<button class="btn" onclick="_declineFriend(\''+sn+'\')" style="padding:5px 8px;font-size:11px;border-color:#f44;color:#f44">拒绝</button>'+
      '</div>';
    }).join('');
  }
}

async function checkFriendBadge(){
  const url=getChatUrl();if(!url)return;
  try{
    const r=await fetch(url+'/friends/'+_encNick(getChatNick())+'.json');
    if(!r.ok)return;const data=await r.json()||{};
    const reqs=Object.values(data).filter(f=>f&&f.status==='pending_recv').length;
    const fbadge=document.getElementById('friend-badge');
    if(fbadge)fbadge.style.display=reqs?'':'none';
    const freqBadge=document.getElementById('freq-badge');
    if(freqBadge)freqBadge.textContent=reqs?'('+reqs+')':'';
  }catch{}
}
setInterval(checkFriendBadge,30000);
setTimeout(checkFriendBadge,5000);

// §27 Private chat (DM)
let _dmFriend='',_dmPollTimer=null,_dmOpen=false;
function _dmRoomKey(a,b){
  const sorted=[a,b].sort();
  try{return btoa(unescape(encodeURIComponent(sorted.join('\x01')))).replace(/[+/=]/g,c=>c==='+'?'-':c==='/'?'_':'');}
  catch{return btoa(sorted.join('|')).replace(/[+/=]/g,c=>c==='+'?'-':c==='/'?'_':'');}
}

function openDM(friendNick,fromOverlay){
  _dmFriend=friendNick;
  const el=document.getElementById('dm-friend-name');if(el)el.textContent=friendNick;
  _dmOpen=true;
  if(_dmPollTimer){clearTimeout(_dmPollTimer);_dmPollTimer=null;}
  const msgs=document.getElementById('dm-messages');
  if(msgs)msgs.innerHTML='<div style="text-align:center;color:#444;padding:40px;font-size:11px">🔒 私聊内容只有你们俩可以看到</div>';
  _fetchDmMsgs();
  showOverlay('o-dm');
}

async function _fetchDmMsgs(){
  if(!_dmOpen||!_dmFriend)return;
  const url=getChatUrl();if(!url)return;
  const key=_dmRoomKey(getChatNick(),_dmFriend);
  try{
    const r=await fetch(url+'/dm/'+key+'.json');
    if(r.ok){
      const data=await r.json();
      const msgs=data?Object.values(data).filter(m=>m&&m.t).sort((a,b)=>a.t-b.t):[];
      renderDmMsgs(msgs);
    }
  }catch{}
  if(_dmOpen)_dmPollTimer=setTimeout(_fetchDmMsgs,4000);
}

function renderDmMsgs(msgs){
  const el=document.getElementById('dm-messages');if(!el)return;
  const myNick=getChatNick();
  const wasAtBottom=(el.scrollHeight-el.scrollTop-el.clientHeight)<80;
  if(!msgs.length){
    el.innerHTML='<div style="text-align:center;color:#444;padding:40px;font-size:11px">🔒 私聊内容只有你们俩可以看到<br>发一条消息开始对话吧！</div>';
  } else {
    const myEmoji=getGenderEmoji();
    const myFS=getFrameStyle(getPlayerFrame());
    const bc=myFS.match(/border-color:([^;]+)/)?.[1]||'#334';
    const bsh=myFS.match(/box-shadow:([^;]+)/)?.[1]||'none';
    el.innerHTML=msgs.map(m=>{
      const d=new Date(m.t||0);
      const ts=d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0');
      const own=m.n===myNick;
      if(own){
        return '<div class="chat-msg own-msg">'+
          '<span class="chat-time-own">'+ts+'</span>'+
          '<div class="chat-bubble" style="background:rgba(78,200,255,0.1)">'+
          '<span class="chat-nick">'+myNick.replace(/</g,'&lt;')+'</span>'+
          (m.x||'').replace(/</g,'&lt;')+
          '</div>'+
          '<div class="chat-avatar" style="border-color:'+bc+';box-shadow:'+bsh+'">'+myEmoji+'</div>'+
        '</div>';
      } else {
        return '<div class="chat-msg">'+
          '<div class="chat-avatar" style="font-size:14px;font-weight:700;color:#4ef">'+_dmFriend.charAt(0)+'</div>'+
          '<div class="chat-bubble">'+
          '<span class="chat-nick">'+_dmFriend.replace(/</g,'&lt;')+'</span>'+
          (m.x||'').replace(/</g,'&lt;')+
          '<span class="chat-time"> '+ts+'</span>'+
          '</div>'+
        '</div>';
      }
    }).join('');
  }
  if(wasAtBottom)el.scrollTop=el.scrollHeight;
}

async function sendDmMsg(){
  const url=getChatUrl();if(!url||!_dmFriend)return;
  const inp=document.getElementById('dm-input');
  const text=(inp?.value||'').trim();
  if(!text)return;
  if(_hasBadWord(text)){inp.style.borderColor='#f44';setTimeout(()=>{inp.style.borderColor='#4ef';},1500);return;}
  const key=_dmRoomKey(getChatNick(),_dmFriend);
  try{
    await fetch(url+'/dm/'+key+'.json',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({n:getChatNick(),x:text.slice(0,200),t:Date.now()})});
    inp.value='';SFX.play('send');
    await _fetchDmMsgs();
  }catch{}
}

// §28 Codex (图鉴)
const _CODEX_ENEMY_META={
  slime:{icon:'🟢',name:'史莱姆',desc:'成群结队的绿色软体怪，血薄速慢，适合练手阶段'},
  goblin:{icon:'👺',name:'哥布林',desc:'狡猾的小妖精，速度较快，常与史莱姆混编出现'},
  skeleton:{icon:'💀',name:'骷髅兵',desc:'不死亡灵，血量中等，攻击力适中'},
  bat:{icon:'🦇',name:'吸血蝙蝠',desc:'移速极快，难以追踪，成群来袭威胁极大'},
  orc:{icon:'👹',name:'兽人勇士',desc:'强壮的战士，高血量高伤害，但行动迟缓'},
  wolf:{icon:'🐺',name:'野狼',desc:'速度极快的猛兽，以群体围攻方式猎杀目标'},
  troll:{icon:'🗿',name:'石魔',desc:'岩石巨型生物，血量庞大但移动极为迟缓'},
  demon:{icon:'😈',name:'恶魔',desc:'来自地狱的存在，各属性均衡，综合威胁极高'},
  boss_10:{icon:'🐉',name:'暗影龙王',desc:'第10波BOSS之一，速度较慢但生命极高，火焰攻击'},
  boss_10_cat:{icon:'🐱',name:'暴食猫王',desc:'第10波BOSS之一，攻击频率高，行动敏捷'},
  boss_10_dog:{icon:'🐶',name:'狂野犬王',desc:'第10波BOSS之一，移速最快，伤害最高，极难躲避'},
  boss_20:{icon:'🌋',name:'熔岩霸主',desc:'第20波BOSS，体型巨大，近乎无法正面阻挡'},
  boss_30:{icon:'🌌',name:'虚空领主',desc:'最终BOSS，最强大的存在，征服它意味着征服一切'},
};
const _CODEX_CLASS_META={
  doctor:{icon:'💊',desc:'每秒自动回血5点，拾取范围大，上手友好，新手首选'},
  berserker:{icon:'⚔',desc:'全能型战士，血量回血均衡，适合各种打法'},
  blacksmith:{icon:'🔨',desc:'物理武器伤害+50%，散弹枪/加特林/狙击枪的绝佳搭档'},
  mage:{icon:'🔮',desc:'魔法武器伤害+50%，配合箭雨/魔法系武器效果翻倍'},
  scholar:{icon:'🎓',desc:'经验获取+50%，升级更快，能更早解锁更多装备选项'},
  reaper:{icon:'💀',desc:'全武器冷却缩短25%，攻速最高，连续输出无敌'},
  kirby:{icon:'⭐',desc:'模仿者，可复制敌人能力，获得火焰/剑/雷电/冰霜等特殊形态'},
  santa:{icon:'🎅',desc:'幸运+5，获得优质道具的概率更高'},
  chosen:{icon:'👑',desc:'天选者，幸运+50，稀有道具和补给的出现频率大幅提升'},
};
const _CODEX_WEAPON_META={
  shotgun:{desc:'扇形同时射出多颗子弹，近战强势，范围广，新手友好'},
  gatling:{desc:'高速连续弹幕，远距离持续压制，后期DPS极高'},
  sword:{desc:'生成环绕轨道剑阵，自动打击周围所有敌人，无需瞄准'},
  arrow_rain:{desc:'从空中落下的箭雨，大范围覆盖，适合清理密集群怪'},
  heal_drone:{desc:'治疗无人机，定期生成治疗光圈，大幅提升生存能力'},
  missile_drone:{desc:'导弹无人机，自动锁定并造成爆炸伤害，范围AOE'},
  sniper:{desc:'超高伤害狙击枪，单目标极高爆发，适合集中打精英怪'},
  kirby_copy:{desc:'模仿者专属，可切换火焰/剑士/雷电/冰霜四种形态，灵活多变'},
};
let _codexTab='monster',_codexSubtab='normal';

function openCodex(){
  _codexTab='monster';_codexSubtab='normal';
  _renderCodexTabs();renderCodexContent();showOverlay('o-codex');
}

function _setCodexSubtab(sub){
  _codexSubtab=sub;
  document.querySelectorAll('#codex-subtabs .codex-subtab').forEach(x=>x.classList.toggle('active',x.dataset.sub===sub));
  renderCodexContent();
}

function _renderCodexTabs(){
  document.querySelectorAll('#codex-tabs .codex-tab').forEach(t=>t.classList.toggle('active',t.dataset.tab===_codexTab));
  const sub=document.getElementById('codex-subtabs');if(!sub)return;
  if(_codexTab==='monster'){
    sub.innerHTML=
      '<button class="codex-subtab'+(_codexSubtab==='normal'?' active':'')+'" data-sub="normal" onclick="_setCodexSubtab(\'normal\')">普通怪</button>'+
      '<button class="codex-subtab'+(_codexSubtab==='elite'?' active':'')+'" data-sub="elite" onclick="_setCodexSubtab(\'elite\')">精英怪</button>'+
      '<button class="codex-subtab'+(_codexSubtab==='boss'?' active':'')+'" data-sub="boss" onclick="_setCodexSubtab(\'boss\')">Boss</button>';
  } else if(_codexTab==='supply'){
    _codexSubtab='normal';
    sub.innerHTML=
      '<button class="codex-subtab active" data-sub="normal" onclick="_setCodexSubtab(\'normal\')">普通补给</button>'+
      '<button class="codex-subtab" data-sub="talent" onclick="_setCodexSubtab(\'talent\')">专武补给</button>'+
      '<button class="codex-subtab" data-sub="char" onclick="_setCodexSubtab(\'char\')">角色专属</button>'+
      '<button class="codex-subtab" data-sub="weapon" onclick="_setCodexSubtab(\'weapon\')">武器专属</button>';
  } else {
    sub.innerHTML='';
  }
}

function renderCodexContent(){
  const el=document.getElementById('codex-content');if(!el)return;
  if(_codexTab==='monster'){
    if(_codexSubtab==='normal'){
      el.innerHTML=['slime','goblin','skeleton','bat','orc','wolf','troll','demon'].map(k=>{
        const e=ENEMY_TYPES[k],m=_CODEX_ENEMY_META[k];
        return '<div class="codex-card"><div class="codex-icon">'+m.icon+'</div><div>'+
          '<div class="codex-name">'+m.name+'</div>'+
          '<div class="codex-stats">❤ '+e.hp+' &nbsp; ⚡ '+e.spd+' &nbsp; ⚔ '+e.dmg+' &nbsp; ✨ '+e.xp+'xp</div>'+
          '<div class="codex-desc">'+m.desc+'</div></div></div>';
      }).join('');
    } else if(_codexSubtab==='elite'){
      el.innerHTML='<div style="text-align:center;padding:60px 20px;color:#555;font-size:13px">🔒 精英怪图鉴<br><span style="font-size:10px;color:#333;margin-top:8px;display:block">精英怪系统即将上线，敬请期待</span></div>';
    } else {
      el.innerHTML=['boss_10','boss_10_cat','boss_10_dog','boss_20','boss_30'].map(k=>{
        const e=ENEMY_TYPES[k],m=_CODEX_ENEMY_META[k];
        const wave=k.startsWith('boss_10')?'⚔ 第10波':k==='boss_20'?'⚔ 第20波':'👑 最终Boss';
        return '<div class="codex-card"><div class="codex-icon" style="font-size:30px">'+m.icon+'</div><div>'+
          '<div class="codex-name" style="color:#f84">'+m.name+' <span style="font-size:9px;color:#f44;font-weight:400">'+wave+'</span></div>'+
          '<div class="codex-stats">❤ '+e.hp+' &nbsp; ⚡ '+e.spd+' &nbsp; ⚔ '+e.dmg+' &nbsp; ✨ '+e.xp+'xp</div>'+
          '<div class="codex-desc">'+m.desc+'</div></div></div>';
      }).join('');
    }
  } else if(_codexTab==='char'){
    el.innerHTML=CLASSES.map(c=>{
      const m=_CODEX_CLASS_META[c.id]||{icon:'⚔',desc:''};
      const sp=[];
      if(c.id==='blacksmith')sp.push('物理伤害 +50%');
      if(c.id==='mage')sp.push('魔法伤害 +50%');
      if(c.id==='scholar')sp.push('经验 +50%');
      if(c.id==='reaper')sp.push('冷却 ×0.75');
      if(c.id==='santa')sp.push('幸运 +5');
      if(c.id==='chosen')sp.push('幸运 +50');
      if(c.id==='kirby')sp.push('专属: 模仿武器');
      return '<div class="codex-card"><div class="codex-icon">'+m.icon+'</div><div>'+
        '<div class="codex-name">'+c.name+(sp.length?'<span style="font-size:9px;color:#a4f;font-weight:400;margin-left:6px">'+sp[0]+'</span>':'')+'</div>'+
        '<div class="codex-stats">❤ HP '+c.hp+' &nbsp; ⚡ 速度 '+c.spd+'</div>'+
        '<div class="codex-desc">'+m.desc+'</div></div></div>';
    }).join('');
  } else if(_codexTab==='weapon'){
    el.innerHTML=['shotgun','gatling','sword','arrow_rain','heal_drone','missile_drone','sniper','kirby_copy'].map(k=>{
      const w=WEAPON_DEFS[k];if(!w)return'';
      const m=_CODEX_WEAPON_META[k]||{desc:''};
      const maxLv=w.levels?w.levels.length:(w.maxLv||8);
      const special=k==='kirby_copy'?'<span style="font-size:9px;color:#a4f;margin-left:4px">模仿者专属</span>':'';
      return '<div class="codex-card"><div class="codex-icon">'+w.icon+'</div><div>'+
        '<div class="codex-name">'+w.name+special+'</div>'+
        '<div class="codex-stats">最高 Lv.'+maxLv+(w.startDesc?' &nbsp;·&nbsp; '+w.startDesc:'')+'</div>'+
        '<div class="codex-desc">'+m.desc+'</div></div></div>';
    }).join('');
  } else if(_codexTab==='supply'){
    if(_codexSubtab==='normal'){
      el.innerHTML=STAT_UPGRADES.map(s=>'<div class="codex-card"><div class="codex-icon">'+s.icon+'</div><div>'+
        '<div class="codex-name">'+s.name+'</div>'+
        '<div class="codex-desc">'+s.desc+'</div></div></div>').join('');
    } else if(_codexSubtab==='talent'){
      el.innerHTML=SUPPLY_TALENTS.map(s=>'<div class="codex-card"><div class="codex-icon">'+s.icon+'</div><div>'+
        '<div class="codex-name" style="color:#fd4">'+s.name+'</div>'+
        '<div class="codex-desc">'+s.desc+'</div></div></div>').join('');
    } else {
      el.innerHTML='<div style="text-align:center;padding:60px 20px;color:#555;font-size:13px">🔒 即将上线<br><span style="font-size:10px;color:#333;margin-top:8px;display:block">该分类补给正在策划中</span></div>';
    }
  }
}

document.querySelectorAll('#codex-tabs .codex-tab').forEach(tab=>{
  tab.addEventListener('click',()=>{_codexTab=tab.dataset.tab;_codexSubtab='normal';_renderCodexTabs();renderCodexContent();SFX.play('click');});
});
document.getElementById('btn-codex-back').addEventListener('click',()=>showOverlay('o-menu'));
document.getElementById('btn-gacha-back').addEventListener('click',()=>showOverlay('o-menu'));
document.getElementById('btn-uprofile-back').addEventListener('click',()=>showOverlay(_uprofileBack));
document.getElementById('btn-friends-back').addEventListener('click',()=>showOverlay('o-menu'));
document.getElementById('btn-dm-back').addEventListener('click',()=>{
  _dmOpen=false;if(_dmPollTimer){clearTimeout(_dmPollTimer);_dmPollTimer=null;}
  showOverlay('o-friends');
});
document.getElementById('btn-codex').addEventListener('click',()=>openCodex());
document.getElementById('btn-gacha').addEventListener('click',()=>{
  document.getElementById('gacha-coins').textContent=getCoins();showOverlay('o-gacha');
});
document.getElementById('btn-friends').addEventListener('click',()=>{
  _friendTab='list';showOverlay('o-friends');
});
document.getElementById('ftab-list').addEventListener('click',()=>switchFriendTab('list'));
document.getElementById('ftab-req').addEventListener('click',()=>switchFriendTab('req'));
document.getElementById('btn-dm-send').addEventListener('click',()=>sendDmMsg());
document.getElementById('dm-input').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey)sendDmMsg();});

// Initial chat preview poll`
);

fs.writeFileSync('index.html', h, 'utf8');
console.log('Done. Size:', h.length);
