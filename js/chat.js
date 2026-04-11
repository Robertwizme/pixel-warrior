'use strict';

// §22 Chat system (Firebase Realtime Database REST)
let _chatPollTimer=null,_chatOpen=false,_chatInputVisible=false,_chatNick='';
function getPlayerId(){
  try{
    let id=localStorage.getItem('pw_player_id');
    if(!id){
      const ch='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      id=Array.from({length:6},()=>ch[Math.floor(Math.random()*ch.length)]).join('');
      localStorage.setItem('pw_player_id',id);
    }
    return id;
  }catch{return'GUEST1';}
}
function getChatNick(){
  if(_chatNick)return _chatNick;
  try{
    let n=localStorage.getItem('pw_chat_nick');
    if(!n){
      const a=['勇猛','冷酷','神秘','传奇','狂野','精锐'];
      const c=['战士','法师','游侠','刺客','博士','医生'];
      n=a[Math.floor(Math.random()*a.length)]+c[Math.floor(Math.random()*c.length)]+(100+Math.floor(Math.random()*900));
      localStorage.setItem('pw_chat_nick',n);
    }
    _chatNick=n;
  }catch{_chatNick='匿名玩家';}
  return _chatNick;
}
const _DEFAULT_CHAT_URL='https://xiaojiu-3777c-default-rtdb.asia-southeast1.firebasedatabase.app';
function getChatUrl(){
  try{const u=(localStorage.getItem('pw_chat_url')||'').trim().replace(/\/+$/,'');return u||_DEFAULT_CHAT_URL;}catch{return _DEFAULT_CHAT_URL;}
}
async function fetchChatMsgs(){
  const url=getChatUrl();if(!url)return null;
  try{
    const r=await fetch(url+'/chat.json?limitToLast=30&orderBy=%22%24key%22');
    if(!r.ok)return null;
    const d=await r.json();if(!d)return[];
    return Object.entries(d).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>({key:k,...v}));
  }catch{return null;}
}
const _BAD_WORDS=['操','妈的','傻逼','草泥马','cnm','nmsl','cnmd','nmd','tmd','sb','sm','wcnm','fuck','shit','bitch','asshole','bastard','damn','cunt','dick','傻x','diao','jb','nmbd'];
function _hasBadWord(t){const l=t.toLowerCase().replace(/\s/g,'');return _BAD_WORDS.some(w=>l.includes(w));}
function parseColorMsg(raw){
  const safe=raw.replace(/</g,'&lt;');
  const m1=raw.match(/^#([RYBGP]) ?([\s\S]*)$/);
  if(m1){
    const col={R:'#f44',Y:'#fd4',B:'#5af',G:'#4fd',P:'#f8a'}[m1[1]];
    if(col)return'<span style="color:'+col+'">'+m1[2].replace(/</g,'&lt;')+'</span>';
  }
  if(raw.startsWith('#小九牛逼')){
    const cs=['#f44','#f84','#fd4','#4fd','#5af','#a4f','#f8a'];
    const txt=raw.slice(raw.startsWith('#小九牛逼 ')?6:5);
    return[...txt.replace(/</g,'&lt;')].map((c,i)=>'<span style="color:'+cs[i%cs.length]+'">'+c+'</span>').join('');
  }
  return safe;
}
async function sendChatMsg(text){
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
  }
  try{
    const r=await fetch(url+'/chat.json',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({nick:getChatNick(),text:text.trim().slice(0,100),time:Date.now()})
    });
    SFX.play('send');return r.ok;
  }catch{return false;}
}
function getPlayerGender(){try{return localStorage.getItem('pw_gender')||'male';}catch{return'male';}}
function getPlayerFrame(){try{return localStorage.getItem('pw_avatar_frame')||'';}catch{return'';}}
function getGenderEmoji(g){g=g||getPlayerGender();return g==='female'?'👧':'👦';}
function getFrameStyle(f){
  if(f==='gold')return'border-color:#fd4;box-shadow:0 0 8px #fd4';
  if(f==='blue')return'border-color:#48f;box-shadow:0 0 8px #48f';
  if(f==='red')return'border-color:#f44;box-shadow:0 0 8px #f44';
  if(f==='green')return'border-color:#4fd;box-shadow:0 0 8px #4fd';
  if(f==='purple')return'border-color:#a4f;box-shadow:0 0 8px #a4f';
  return'border-color:#334;box-shadow:none';
}
function renderChatMsgs(msgs){
  const el=document.getElementById('chat-messages');if(!el)return;
  const wasAtBottom=(el.scrollHeight-el.scrollTop-el.clientHeight)<80;
  const myNick=getChatNick();
  if(!msgs||!msgs.length){
    el.innerHTML='<div style="text-align:center;color:#444;padding:20px;font-size:11px">暂无消息，快来打个招呼！</div>';
    return;
  }
  const myEmoji=getGenderEmoji();
  const myFS=getFrameStyle(getPlayerFrame());
  const bc=myFS.match(/border-color:([^;]+)/)?.[1]||'#334';
  const bsh=myFS.match(/box-shadow:([^;]+)/)?.[1]||'none';
  el.innerHTML=msgs.map(m=>{
    const d=new Date(m.time||0);
    const ts=d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0');
    const own=m.nick===myNick;
    const colored=parseColorMsg(m.text||'');
    if(own){
      return '<div class="chat-msg own-msg">'+
        '<span class="chat-time-own">'+ts+'</span>'+
        '<div class="chat-bubble">'+
        '<span class="chat-nick">'+myNick.replace(/</g,'&lt;')+'</span>'+
        colored+
        '</div>'+
        '<div class="chat-avatar" style="border-color:'+bc+';box-shadow:'+bsh+'">'+myEmoji+'</div>'+
        '</div>';
    } else {
      const firstCh=(m.nick||'?').charAt(0);
      const _snAttr=(m.nick||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;');
      return '<div class="chat-msg">'+
        '<div class="chat-avatar" style="font-size:14px;font-weight:700;color:#4fd;cursor:pointer" data-nick="'+_snAttr+'" onclick="viewUserProfile(this.dataset.nick)">'+firstCh+'</div>'+
        '<div class="chat-bubble">'+
        '<span class="chat-nick">'+(m.nick||'匿名').replace(/</g,'&lt;')+'</span>'+
        colored+
        '<span class="chat-time"> '+ts+'</span>'+
        '</div></div>';
    }
  }).join('');
  if(wasAtBottom) el.scrollTop=el.scrollHeight;
}
function renderChatPreview(msgs){
  const el=document.getElementById('menu-chat-latest');if(!el)return;
  if(!getChatUrl()){el.textContent='聊天室加载中...';return;}
  if(!msgs){el.textContent='聊天室连接失败...';return;}
  if(!msgs.length){el.textContent='暂无消息，快来第一个打招呼！';return;}
  const last=msgs[msgs.length-1];
  const nick=(last.nick||'?').replace(/</g,'&lt;');
  el.innerHTML=nick+': '+parseColorMsg(last.text||'');
}
async function pollChat(){
  const msgs=await fetchChatMsgs();
  renderChatPreview(msgs);
  if(_chatOpen)renderChatMsgs(msgs);
  _chatPollTimer=setTimeout(pollChat,6000);
}
function startChatPoll(){clearTimeout(_chatPollTimer);pollChat();}


document.getElementById('btn-chat-back').addEventListener('click',()=>{
  _chatOpen=false;clearTimeout(_chatPollTimer);showOverlay('o-menu');
});
document.getElementById('btn-chat-clear').addEventListener('click',async()=>{
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
});
document.getElementById('btn-chat-compose').addEventListener('click',()=>{
  _chatInputVisible=!_chatInputVisible;
  const area=document.getElementById('chat-input-area');
  const hint=document.getElementById('chat-compose-hint');
  if(area)area.style.display=_chatInputVisible?'flex':'none';
  if(hint)hint.style.display=_chatInputVisible?'none':'';
  document.getElementById('btn-chat-compose').textContent=_chatInputVisible?'✖':'✏️';
  if(_chatInputVisible)setTimeout(()=>document.getElementById('chat-input')?.focus(),100);
});
document.getElementById('btn-chat-send').addEventListener('click',async()=>{
  const inp=document.getElementById('chat-input');
  if(!inp||!inp.value.trim())return;
  const text=inp.value.trim();inp.value='';
  const ok=await sendChatMsg(text);
  if(ok)setTimeout(pollChat,600);
});
document.getElementById('chat-input').addEventListener('keydown',e=>{
  if(e.key==='Enter')document.getElementById('btn-chat-send').click();
});
const nickEl=document.getElementById('chat-nick-show');
if(nickEl){
  nickEl.textContent=getChatNick();
  const _initPidEl=document.getElementById('chat-pid-show');
  if(_initPidEl){_initPidEl.textContent='#'+getPlayerId();_initPidEl.onclick=()=>{try{navigator.clipboard.writeText(getPlayerId());}catch{}addFloatingText('ID已复制!',0,0,'#4fd',1.2);};}
  nickEl.addEventListener('click',()=>openProfile(true));
}
// chat-url-input removed (URL is now hardcoded)


// §23 玩家信息系统
let _profileFromChat=false;
let _profGender='male';
let _profFrame='';

function _autoNickPattern(n){
  return /^(勇猛|冷酷|神秘|传奇|狂野|精锐)(战士|法师|游侠|刺客|博士|医生)\d{3}$/.test(n);
}
function updateMenuAvatar(){
  const ic=document.getElementById('menu-avatar-icon');
  const nm=document.getElementById('menu-player-name');
  if(ic){
    ic.textContent=getGenderEmoji();
    const fs=getFrameStyle(getPlayerFrame());
    const bc=fs.match(/border-color:([^;]+)/)?.[1]||'#334';
    const bsh=fs.match(/box-shadow:([^;]+)/)?.[1]||'none';
    ic.style.borderColor=bc; ic.style.boxShadow=bsh;
  }
  if(nm){
    const n=getChatNick();
    nm.textContent=_autoNickPattern(n)?'':n;
  }
  updateMenuLevel();
}
function openProfile(fromChat){
  _profileFromChat=!!fromChat;
  _profGender=getPlayerGender();
  _profFrame=getPlayerFrame();
  const n=getChatNick();
  const ni=document.getElementById('profile-name-input');
  if(ni) ni.value=_autoNickPattern(n)?'':n;
  // gender buttons
  document.getElementById('btn-gender-male').style.borderColor=_profGender==='male'?'#4fd':'';
  document.getElementById('btn-gender-female').style.borderColor=_profGender==='female'?'#4fd':'';
  // frame options
  document.querySelectorAll('.frame-opt').forEach(o=>{
    o.style.outline=o.dataset.frame===_profFrame?'2px solid #eee':'none';
  });
  // avatar preview
  _refreshProfileAvatar();
  showOverlay('o-profile');
  // In-game stats section
  const _pIg = document.getElementById('profile-ingame');
  if (_pIg) {
    if (gs?.weapons?.length > 0 && gs.player) {
      const p2 = gs.player;
      _pIg.style.display='block';
      _pIg.innerHTML = '<div style="margin-top:14px;border-top:1px solid #334;padding-top:10px;font-size:10px;text-align:left">'
        +'<div style="color:#fd4;font-size:11px;font-weight:700;margin-bottom:6px">⚔ 当前局武器</div>'
        + gs.weapons.map(w=>{const d=WEAPON_DEFS[w.id];return`<div style="color:#aad;margin-bottom:3px">${d?.icon||'🔸'} ${d?.name||w.id} <span style="color:#fd4">Lv.${w.level}</span></div>`;}).join('')
        +'<div style="color:#fd4;font-size:11px;font-weight:700;margin:8px 0 6px">📊 当前属性</div>'
        +`<div style="color:#888">❤ 最大HP <span style="color:#4fd;float:right">${p2.maxHp}</span></div>`
        +`<div style="color:#888">💪 伤害倍率 <span style="color:#4fd;float:right">${(p2.dmgMult*100).toFixed(0)}%</span></div>`
        +`<div style="color:#888">⚡ CD倍率 <span style="color:#4fd;float:right">${(p2.cdMult*100).toFixed(0)}%</span></div>`
        +`<div style="color:#888">🍀 幸运 <span style="color:#4fd;float:right">${p2.luck}</span></div>`
        +(p2.baseDodge>0?`<div style="color:#888">💨 闪避 <span style="color:#4fd;float:right">${(p2.baseDodge*100).toFixed(0)}%</span></div>`:'')
        +(p2.baseDmgRed>0?`<div style="color:#888">🛡 减伤 <span style="color:#4fd;float:right">${(p2.baseDmgRed*100).toFixed(0)}%</span></div>`:'')
        +'</div>';
    } else { _pIg.style.display='none'; }
  }
}
function _refreshProfileAvatar(){
  const pa=document.getElementById('profile-avatar');
  if(!pa)return;
  pa.textContent=getGenderEmoji(_profGender);
  const fs=getFrameStyle(_profFrame);
  const bc=fs.match(/border-color:([^;]+)/)?.[1]||'#334';
  const bsh=fs.match(/box-shadow:([^;]+)/)?.[1]||'none';
  pa.style.borderColor=bc; pa.style.boxShadow=bsh;
}
document.getElementById('btn-gender-male').addEventListener('click',()=>{
  _profGender='male';
  document.getElementById('btn-gender-male').style.borderColor='#4fd';
  document.getElementById('btn-gender-female').style.borderColor='';
  _refreshProfileAvatar(); SFX.play('click');
});
document.getElementById('btn-gender-female').addEventListener('click',()=>{
  _profGender='female';
  document.getElementById('btn-gender-female').style.borderColor='#4fd';
  document.getElementById('btn-gender-male').style.borderColor='';
  _refreshProfileAvatar(); SFX.play('click');
});
document.querySelectorAll('.frame-opt').forEach(opt=>{
  opt.addEventListener('click',()=>{
    _profFrame=opt.dataset.frame;
    document.querySelectorAll('.frame-opt').forEach(o=>o.style.outline='none');
    opt.style.outline='2px solid #eee';
    _refreshProfileAvatar(); SFX.play('click');
  });
});
async function _isNickTaken(nick){
  const url=getChatUrl();if(!url)return false;
  const myOld=localStorage.getItem('pw_nick_reg')||'';
  if(nick===myOld)return false; // same as currently registered
  try{
    const r=await fetch(url+'/nicks/'+encodeURIComponent(nick)+'.json');
    if(!r.ok)return false;
    const d=await r.json();
    return d!==null;
  }catch{return false;}
}
async function _registerNick(nick){
  const url=getChatUrl();if(!url)return;
  const myOld=localStorage.getItem('pw_nick_reg')||'';
  if(myOld&&myOld!==nick){
    try{await fetch(url+'/nicks/'+encodeURIComponent(myOld)+'.json',{method:'DELETE'});}catch{}
  }
  try{
    await fetch(url+'/nicks/'+encodeURIComponent(nick)+'.json',{
      method:'PUT',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ts:Date.now()})
    });
    localStorage.setItem('pw_nick_reg',nick);
    try{const _rPid=getPlayerId();await fetch(url+'/ids/'+_rPid+'.json',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({nick,ts:Date.now()})});}catch{}
  }catch{}
}
document.getElementById('btn-profile-save').addEventListener('click',async()=>{
  const ni=document.getElementById('profile-name-input');
  const saveBtn=document.getElementById('btn-profile-save');
  const name=(ni.value||'').trim().slice(0,10);
  if(!name){
    ni.style.borderColor='#f44';
    ni.placeholder='请输入昵称！';
    return;
  }
  // Check duplicate
  saveBtn.textContent='检查中...';saveBtn.disabled=true;
  const taken=await _isNickTaken(name);
  saveBtn.textContent='保存';saveBtn.disabled=false;
  if(taken){
    ni.style.borderColor='#f44';
    ni.value='';
    ni.placeholder='有相同名字，请换一个！';
    SFX.play('playerhit');
    return;
  }
  ni.style.borderColor='#48f';
  _chatNick=name;
  try{localStorage.setItem('pw_chat_nick',name);localStorage.setItem('pw_nick_set','1');}catch(e){}
  try{localStorage.setItem('pw_gender',_profGender);}catch(e){}
  try{localStorage.setItem('pw_avatar_frame',_profFrame);}catch(e){}
  _registerNick(name);
  updateMenuAvatar();
  SFX.play('levelup');
  if(_profileFromChat) showOverlay('o-chat');
  else showOverlay('o-menu');
});
document.getElementById('btn-profile-back').addEventListener('click',()=>{
  if(_profileFromChat) showOverlay('o-chat');
  else showOverlay('o-menu');
});
// Init
updateMenuAvatar();

// Wrap showOverlay to track chat open state
(function(){
  const orig=window.showOverlay;
  window.showOverlay=function(id){
    if(id==='o-chat'){
      try{ if(!localStorage.getItem('pw_nick_set')){ openProfile(true); return; } }catch(e){}
    }
    _chatOpen=(id==='o-chat');
    if(_chatOpen){
      const _nick=getChatNick();
      document.getElementById('chat-nick-show').textContent=_nick;
      const _oPidEl=document.getElementById('chat-pid-show');
      if(_oPidEl)_oPidEl.textContent='#'+getPlayerId();
      document.getElementById('btn-chat-clear').style.display=_nick==='作者'?'':'none';
      startChatPoll();
      publishProfile();
    }
    if(id==='o-friends'){renderFriendsList();checkFriendBadge();}
    orig(id);
  };
})();

// SFX toggle listener
document.getElementById('tog-sfx').addEventListener('click',()=>{
  settings.sfx=!settings.sfx;
  document.getElementById('tog-sfx').classList.toggle('on',settings.sfx);
});
// Theme toggle
(function(){
  function applyTheme(t){
    const light=t==='light';
    document.body.classList.toggle('theme-light',light);
    const btn=document.getElementById('theme-toggle');
    if(btn)btn.textContent=light?'🌙 黑色':'☀️ 白色';
  }
  try{const t=localStorage.getItem('pw_theme');if(t)applyTheme(t);}catch(e){}
  document.getElementById('theme-toggle').addEventListener('click',()=>{
    const next=document.body.classList.contains('theme-light')?'dark':'light';
    try{localStorage.setItem('pw_theme',next);}catch(e){}
    applyTheme(next);SFX.play('click');
  });
})();

// §24 Profile publishing
async function publishProfile(){
  const url=getChatUrl();if(!url)return;
  const nick=getChatNick();
  const best=loadBest()||{};
  try{
    await fetch(url+'/profiles/'+encodeURIComponent(nick)+'.json',{
      method:'PUT',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({nick,gender:getPlayerGender(),frame:getPlayerFrame(),
        bestWave:best.wave||0,bestKills:best.kills||0,bestScore:best.score||0,
        bestClass:best.className||'—',level:getPlayerLevel(),lastSeen:Date.now()})
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
        '⚡ 等级: <b style="color:#fd4">Lv.'+(profile.level||1)+'</b><br>'+
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
  if(status==='accepted'){
    acts.innerHTML=
      '<button class="btn" onclick="openDM(_viewedNick)" style="flex:1;padding:8px;font-size:12px;border-color:#4ef;color:#4ef">💬 私聊</button>'+
      '<div style="flex:1;font-size:11px;color:#4fd;text-align:center;display:flex;align-items:center;justify-content:center">✅ 已是好友</div>';
  } else if(status==='pending_sent'){
    acts.innerHTML='<div style="width:100%;font-size:11px;color:#888;text-align:center;padding:8px">⏳ 好友请求已发送</div>';
  } else if(status==='pending_recv'){
    acts.innerHTML=
      '<button class="btn primary" onclick="_acceptFriend(_viewedNick)" style="flex:1;padding:8px;font-size:12px">✅ 接受好友</button>'+
      '<button class="btn" onclick="_declineFriend(_viewedNick)" style="flex:1;padding:8px;font-size:12px;border-color:#f44;color:#f44">❌ 拒绝</button>';
  } else {
    acts.innerHTML=
      '<button class="btn primary" onclick="sendFriendReq(_viewedNick)" style="width:100%;padding:8px;font-size:12px">➕ 加好友</button>';
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
      const nAttr=f.nick.replace(/&/g,'&amp;').replace(/"/g,'&quot;');
      return '<div class="friend-item" data-nick="'+nAttr+'" onclick="openDM(this.dataset.nick)">'+
        '<div class="friend-avatar-sm" style="font-size:16px;font-weight:700;color:#4ef">'+f.nick.charAt(0)+'</div>'+
        '<div style="flex:1"><div style="font-size:12px;color:#eee">'+f.nick.replace(/</g,'&lt;')+'</div><div style="font-size:10px;color:#555">点击私聊</div></div>'+
        '<span style="font-size:18px;color:#4ef">💬</span>'+
      '</div>';
    }).join('');
  } else {
    if(!reqs.length){el.innerHTML='<div style="text-align:center;padding:50px 20px;color:#444;font-size:12px">暂无待处理的好友请求</div>';return;}
    el.innerHTML=reqs.map(f=>{
      const nAttr=f.nick.replace(/&/g,'&amp;').replace(/"/g,'&quot;');
      return '<div class="friend-item" data-nick="'+nAttr+'">'+
        '<div class="friend-avatar-sm" style="font-size:14px;font-weight:700;color:#4fd">'+f.nick.charAt(0)+'</div>'+
        '<div style="flex:1"><div style="font-size:12px;color:#eee">'+f.nick.replace(/</g,'&lt;')+'</div><div style="font-size:10px;color:#888">想加你为好友</div></div>'+
        '<button class="btn primary" onclick="_acceptFriend(this.closest(\'[data-nick]\').dataset.nick)" style="padding:5px 10px;font-size:11px;margin-right:6px">接受</button>'+
        '<button class="btn" onclick="_declineFriend(this.closest(\'[data-nick]\').dataset.nick)" style="padding:5px 8px;font-size:11px;border-color:#f44;color:#f44">拒绝</button>'+
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
let _dmFriend='',_dmPollTimer=null,_dmOpen=false,_dmBack='o-friends';
function _dmRoomKey(a,b){
  const sorted=[a,b].sort();
  try{return btoa(unescape(encodeURIComponent(sorted.join('')))).replace(/[+/=]/g,c=>c==='+'?'-':c==='/'?'_':'');}
  catch{return btoa(sorted.join('|')).replace(/[+/=]/g,c=>c==='+'?'-':c==='/'?'_':'');}
}

function openDM(friendNick,fromOverlay){
  _dmFriend=friendNick;
  _dmBack=fromOverlay||'o-friends';
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
const _CODEX_ENEMY_META = {
  slime:      { icon:'🟢', name:'史莱姆',    waveFirst:1,  waveDesc:'第1波起出现，全程都有',             special:'无特殊行为，直线冲向玩家，数量最多',                        desc:'成群结队的绿色软体怪，血薄速慢，适合练手阶段' },
  goblin:     { icon:'👺', name:'哥布林',    waveFirst:2,  waveDesc:'第2波起出现',                       special:'移速较快，常与史莱姆混编出现',                               desc:'狡猾的小妖精，速度较快，常与史莱姆混编出现' },
  skeleton:   { icon:'💀', name:'骷髅兵',    waveFirst:4,  waveDesc:'第4波起出现',                       special:'无特殊行为，均衡型普通怪',                                    desc:'不死亡灵，血量中等，攻击力适中，是中期的标准威胁' },
  bat:        { icon:'🦇', name:'吸血蝙蝠',  waveFirst:5,  waveDesc:'第5波起出现',                       special:'移动速度极高，难以用慢速武器击中，成群时威胁极大',              desc:'移速极快，难以追踪，成群来袭时威胁极大' },
  orc:        { icon:'👹', name:'兽人勇士',  waveFirst:6,  waveDesc:'第6波起出现',                       special:'高HP高伤害，需优先消灭，避免贴身',                              desc:'强壮的战士，高血量高伤害，但行动迟缓' },
  wolf:       { icon:'🐺', name:'野狼',      waveFirst:8,  waveDesc:'第8波起出现，中后期大量出现',       special:'极速冲锋，成群围攻，大范围AoE武器克制效果好',                  desc:'速度极快的猛兽，以群体围攻方式猎杀目标' },
  troll:      { icon:'🗿', name:'石魔',      waveFirst:12, waveDesc:'第12波起出现',                      special:'血量极高但移速最慢，适合用射程武器持续消耗',                    desc:'岩石巨型生物，血量庞大但移动极为迟缓' },
  demon:      { icon:'😈', name:'恶魔',      waveFirst:13, waveDesc:'第13波起出现，后期成为主力',        special:'均衡属性，后期数量极多，需要强力AoE才能有效应对',               desc:'来自地狱的存在，各属性均衡，综合威胁极高' },
  archer:     { icon:'🏹', name:'弓箭手',    waveFirst:6,  waveDesc:'第6波起混入编队（2～7只）',         special:'保持约180px距离持续射箭，玄武护盾可抵挡其弓箭，近战武器难以追上', desc:'远程攻击型怪物，保持安全距离向玩家射箭' },
  boss_10:    { icon:'🐉', name:'暗影龙王',  waveFirst:10, waveDesc:'第10波随机50%概率出现',             special:'生命值极高，移速较慢，优先叠DPS，剑阵/散弹对其效果佳',          desc:'第10波Boss之一，速度较慢但生命极高' },
  boss_10_cat:{ icon:'🐱', name:'暴食猫王',  waveFirst:10, waveDesc:'第10波随机50%概率出现',             special:'速度快、伤害高，需保持移动并配合治疗无人机续命',                desc:'第10波Boss之一，攻击频率高，行动敏捷' },
  boss_10_dog:{ icon:'🐶', name:'狂野犬王',  waveFirst:10, waveDesc:'第10波随机50%概率出现',             special:'三个10波Boss中最危险，高速+高伤，建议配合闪避天赋',             desc:'第10波Boss之一，移速最快，伤害最高，极难躲避' },
  boss_20:    { icon:'🌋', name:'熔岩霸主',  waveFirst:20, waveDesc:'第20波固定出现',                    special:'HP 14000、伤害75，需满级武器+多重天赋方可正面硬撼',             desc:'第20波大Boss，体型巨大，需要全套强化才能应对' },
  boss_30:    { icon:'🌌', name:'虚空领主',  waveFirst:30, waveDesc:'第30波最终Boss',                    special:'HP 38000、伤害130，击败后通关游戏，推荐飞剑+天才搭配',          desc:'最终Boss，最强大的存在，击败它意味着征服全部30波' },
};

const _CODEX_CLASS_META = {
  doctor:    { icon:'💊', regen:5,  xpBonus:0,
    passive:'每次从任何来源回复100HP时，永久+5%全局伤害（可无限叠加）',
    skillName:'妙手回春', skillEffect:'立刻回复100HP', skillCd:30 },
  berserker: { icon:'⚔',  regen:2,  xpBonus:0,
    passive:'每次升级，最大HP永久+5',
    skillName:'狂暴', skillEffect:'20秒内所有伤害×2', skillCd:50 },
  blacksmith:{ icon:'⚒',  regen:1,  xpBonus:0,
    passive:'所有物理系武器（散弹/加特林/狙击）伤害永久+50%',
    skillName:'临阵磨枪', skillEffect:'10秒内所有武器冷却-40%', skillCd:50 },
  mage:      { icon:'🔮', regen:1,  xpBonus:0,
    passive:'所有魔法系武器（箭雨/剑阵）伤害永久+50%',
    skillName:'法力无天', skillEffect:'10秒内所有AoE范围+30%', skillCd:45 },
  scholar:   { icon:'🎓', regen:1,  xpBonus:50,
    passive:'无法通过升级卡获得移速加成，但经验获取速度比任何职业都快',
    skillName:'经验老道', skillEffect:'瞬间吸取全场所有飘落的经验球', skillCd:50 },
  reaper:    { icon:'🎯', regen:1,  xpBonus:0,
    passive:'枪械武器伤害+50%，且所有武器冷却时间永久×0.75（即-25%）',
    skillName:'狙神', skillEffect:'瞄准7.49秒后，秒杀当前HP最高的目标', skillCd:542 },
  kirby:     { icon:'🌀', regen:1,  xpBonus:0,
    passive:'拥有四种形态：🔥火焰（火球）/ ⚔剑士（轨道剑）/ ⚡雷电（闪电）/ ❄冰冻（冰球）',
    skillName:'模仿', skillEffect:'吞下最近的怪物，随机切换一种形态', skillCd:120 },
  santa:     { icon:'🎅', regen:1,  xpBonus:0,
    passive:'初始幸运+5；场上有0.5%概率随机生成超大礼盒（含大量道具）',
    skillName:'圣诞礼物', skillEffect:'在附近随机生成多个礼盒掉落道具', skillCd:60 },
  chosen:    { icon:'⭐', regen:1,  xpBonus:0,
    passive:'每1点幸运值 = 全局伤害+1%（初始幸运+20即开局+20%伤害，无上限）',
    skillName:'☄ 流星', skillEffect:'幸运越高流星越大，秒杀场上所有非Boss敌人', skillCd:50 },
};

const _CODEX_WEAPON_META = {
  shotgun:     { baseDmg:'10 → 38', baseCD:'1.4s → 1.1s', range:'近距扇形',
    desc:'扇形同时射出5颗子弹，近战强势，范围广，新手友好。Lv8解锁双枪模式同时射出两组。',
    recommend:'铁匠（+50%物理）· 力量强化 · 急速出手 · 时间裂隙' },
  gatling:     { baseDmg:'16 → 56', baseCD:'0.9s → 0.78s/发', range:'中远直线',
    desc:'高速8连发弹幕，连发后短暂停顿，远距持续压制，后期DPS极高。Lv8解锁双枪齐射。',
    recommend:'铁匠（+50%物理）· 急速出手 · 混沌之力 · 时间裂隙' },
  sword:       { baseDmg:'10 → 42 /把', baseCD:'持续旋转', range:'环绕 40-52px',
    desc:'生成2-5把轨道剑绕玩家旋转，自动打击周围所有敌人，无需瞄准，贴脸战斗最优。',
    recommend:'法师（+50%魔法）· 扩展攻击 · 元素共鸣 · 多重射击' },
  arrow_rain:  { baseDmg:'20 → 66', baseCD:'2.4s → 1.3s', range:'大范围落点',
    desc:'从空中密集落下箭雨，范围覆盖广，适合清理密集群怪，冷却时间较长。',
    recommend:'法师（+50%魔法）· 扩展攻击 · 混沌之力 · 元素共鸣' },
  heal_drone:  { baseDmg:'治疗 4→16 HP/s', baseCD:'光圈CD: 10→5s', range:'光圈38-50px',
    desc:'治疗无人机，定期在脚下生成治疗光圈，站在光圈内持续回血，超强续战能力。',
    recommend:'强化体魄 · 即时治愈 · 疾风步法（保持在光圈内移动）' },
  missile_drone:{ baseDmg:'50+（爆炸AOE）', baseCD:'5s / 轮', range:'爆炸半径20px',
    desc:'每5秒发射6枚导弹自动锁定最近敌人，落点爆炸AOE，可选原地/开路/狂轰三种模式。',
    recommend:'扩展攻击 · 混沌之力 · 多重射击 · 元素共鸣' },
  sniper:      { baseDmg:'120（基础）', baseCD:'3.5s → 2.5s', range:'全屏穿透',
    desc:'超高单体伤害，每发穿透1次，可升级为连射/重狙/成长型/合金弹等多条流派。',
    recommend:'西蒙·海耶（+50%枪械）· 急速出手 · 混沌之力 · 幸运星' },
  flying_sword:{ baseDmg:'50 /把（×4把）', baseCD:'2.0s → 1.0s(Lv8)', range:'全屏锁定',
    desc:'抽奖限定，每2秒发射4把飞剑锁定最近敌，40%暴击×3倍，可叠加元素，8级万剑归宗。',
    recommend:'混沌之力 · 急速出手 · 天选者（幸运提升暴击收益）' },
  kirby_copy:  { baseDmg:'随形态变化', baseCD:'形态专属', range:'形态专属',
    desc:'模仿者职业专属，四种形态各有特色：火球喷射/轨道剑/闪电链/冰球，切换时机决定输出效率。',
    recommend:'（仅模仿者可用）扩展攻击 · 元素共鸣 · 混沌之力' },
  black_tortoise:{ baseDmg:'18 → 80（水球）', baseCD:'水球3s / 护盾60s', range:'自主移动',
    desc:'召唤玄武自主战斗，每3s射3颗水球，每60s为玩家提供护盾，8级含多条升级路线。',
    recommend:'强化体魄 · 硬化皮肤（减伤）· 混沌之力 · 扩展攻击' },
};

const _CODEX_SUPPLY_META = {
  maxhp:        { howToGet:'每波通关后升级选择界面随机出现（所有普通波）' },
  speed:        { howToGet:'每波通关后升级选择界面随机出现（所有普通波）' },
  dmg:          { howToGet:'每波通关后升级选择界面随机出现（所有普通波）' },
  area:         { howToGet:'每波通关后升级选择界面随机出现（所有普通波）' },
  cd:           { howToGet:'每波通关后升级选择界面随机出现（所有普通波）' },
  heal:         { howToGet:'每波通关后升级选择界面随机出现（所有普通波）' },
  pickup:       { howToGet:'每波通关后升级选择界面随机出现（所有普通波）' },
  luck:         { howToGet:'每波通关后升级选择界面随机出现（所有普通波）' },
  dodge:        { howToGet:'每波通关后升级选择界面随机出现（所有普通波）' },
  dmgred:       { howToGet:'每波通关后升级选择界面随机出现（所有普通波）' },
  blood_pact:   { howToGet:'Boss波（第10/20/30波）通关后专武天赋界面随机出现三选一' },
  time_rift:    { howToGet:'Boss波（第10/20/30波）通关后专武天赋界面随机出现三选一' },
  chaos_force:  { howToGet:'Boss波（第10/20/30波）通关后专武天赋界面随机出现三选一' },
  iron_fortress:{ howToGet:'Boss波（第10/20/30波）通关后专武天赋界面随机出现三选一' },
  death_wish:   { howToGet:'Boss波（第10/20/30波）通关后专武天赋界面随机出现三选一' },
  ghost_walk:   { howToGet:'Boss波（第10/20/30波）通关后专武天赋界面随机出现三选一' },
  forge_master: { howToGet:'Boss波（第10/20/30波）通关后专武天赋界面随机出现三选一' },
  alchemy:      { howToGet:'Boss波（第10/20/30波）通关后专武天赋界面随机出现三选一' },
  elemental:    { howToGet:'Boss波（第10/20/30波）通关后专武天赋界面随机出现三选一' },
  berserker:    { howToGet:'Boss波（第10/20/30波）通关后专武天赋界面随机出现三选一' },
  vampire:      { howToGet:'Boss波（第10/20/30波）通关后专武天赋界面随机出现三选一' },
  multishot:    { howToGet:'Boss波（第10/20/30波）通关后专武天赋界面随机出现三选一' },
  chain_surge:  { howToGet:'Boss波（第10/20/30波）通关后专武天赋界面随机出现三选一' },
  lucky_star:   { howToGet:'Boss波（第10/20/30波）通关后专武天赋界面随机出现三选一' },
  second_wind:  { howToGet:'Boss波（第10/20/30波）通关后专武天赋界面随机出现三选一' },
};

let _codexTab='monster', _codexSubtab='normal', _codexSel=0;

function openCodex(){
  _codexTab='monster'; _codexSubtab='normal'; _codexSel=0;
  _renderCodexTabs(); renderCodexContent(); showOverlay('o-codex');
}

function _setCodexSubtab(sub){
  _codexSubtab=sub; _codexSel=0;
  document.querySelectorAll('#codex-subtabs .codex-subtab').forEach(x=>x.classList.toggle('active',x.dataset.sub===sub));
  renderCodexContent();
}

function _renderCodexTabs(){
  document.querySelectorAll('#codex-tabs .codex-tab').forEach(t=>t.classList.toggle('active',t.dataset.tab===_codexTab));
  const sub=document.getElementById('codex-subtabs'); if(!sub) return;
  if(_codexTab==='monster'){
    sub.innerHTML=
      '<button class="codex-subtab'+(_codexSubtab==='normal'?' active':'')+'" data-sub="normal">普通怪</button>'+
      '<button class="codex-subtab'+(_codexSubtab==='elite'?' active':'')+'" data-sub="elite">精英怪</button>'+
      '<button class="codex-subtab'+(_codexSubtab==='boss'?' active':'')+'" data-sub="boss">Boss</button>';
  } else if(_codexTab==='supply'){
    sub.innerHTML=
      '<button class="codex-subtab'+(_codexSubtab==='normal'?' active':'')+'" data-sub="normal">普通补给</button>'+
      '<button class="codex-subtab'+(_codexSubtab==='talent'?' active':'')+'" data-sub="talent">专武天赋</button>';
  } else {
    sub.innerHTML='';
  }
  sub.querySelectorAll('.codex-subtab').forEach(b=>{
    b.addEventListener('click',()=>{ _setCodexSubtab(b.dataset.sub); SFX.play('click'); });
  });
}

// ── Detail panel helpers ──
function _cdxDetail(html){ return '<div class="cdx-detail-inner">'+html+'</div>'; }
function _cdxStat(label,val){ return '<div class="cdx-stat-row"><span class="cdx-stat-label">'+label+'</span><b class="cdx-stat-val">'+val+'</b></div>'; }
function _cdxSection(title){ return '<div class="cdx-section-title">'+title+'</div>'; }
function _cdxDesc(text){ return '<div class="cdx-desc-block">'+text+'</div>'; }

function _codexMonsterDetail(k){
  const e=ENEMY_TYPES[k]; const m=_CODEX_ENEMY_META[k];
  if(!e||!m) return _cdxDetail('<div style="color:#555;padding:40px 0;text-align:center">暂无数据</div>');
  const nameColor=e.isBoss?'#f84':'#eee';
  const waveTag=e.isBoss?'<span style="font-size:9px;color:#f44;font-weight:400;margin-left:6px">BOSS</span>':'';
  return _cdxDetail(
    '<div class="cdx-big-icon">'+m.icon+'</div>'+
    '<div class="cdx-item-name" style="color:'+nameColor+'">'+m.name+waveTag+'</div>'+
    '<div class="cdx-item-sub">'+m.waveDesc+'</div>'+
    _cdxStat('❤ HP', e.hp)+
    _cdxStat('⚡ 速度', e.spd)+
    _cdxStat('⚔ 攻击', e.dmg)+
    _cdxStat('✨ 经验', e.xp+' xp')+
    _cdxSection('描述')+_cdxDesc(m.desc)+
    _cdxSection('特殊行为')+_cdxDesc(m.special)
  );
}

function _codexClassDetail(c){
  const m=_CODEX_CLASS_META[c.id]||{icon:'⚔',regen:1,xpBonus:0,passive:'—',skillName:'—',skillEffect:'—',skillCd:0};
  return _cdxDetail(
    '<div class="cdx-big-icon">'+m.icon+'</div>'+
    '<div class="cdx-item-name" style="color:#fd4">'+c.name+'</div>'+
    _cdxStat('❤ HP', c.hp)+
    _cdxStat('⚡ 速度', c.spd)+
    _cdxStat('💖 回血', m.regen+' /s')+
    _cdxStat('✨ 经验加成', (m.xpBonus?'+'+m.xpBonus+'%':'无'))+
    _cdxSection('被动技能')+_cdxDesc(m.passive)+
    _cdxSection('主动技能')+
    '<div class="cdx-skill-box">'+
      '<div class="cdx-skill-name">'+m.skillName+'</div>'+
      '<div class="cdx-skill-effect">'+m.skillEffect+'</div>'+
      '<div class="cdx-skill-cd">⏱ 冷却 '+m.skillCd+' 秒</div>'+
    '</div>'
  );
}

function _codexWeaponDetail(k){
  const w=WEAPON_DEFS[k]; if(!w) return '';
  const m=_CODEX_WEAPON_META[k]||{baseDmg:'—',baseCD:'—',range:'—',desc:'',recommend:''};
  const maxLv=w.levels?w.levels.length:(w.maxLv||8);
  let badge='';
  if(k==='kirby_copy')   badge='<span class="cdx-badge cdx-badge-purple">模仿者专属</span>';
  else if(k==='flying_sword')   badge='<span class="cdx-badge cdx-badge-gold">抽奖限定</span>';
  else if(k==='black_tortoise') badge='<span class="cdx-badge cdx-badge-blue">召唤奖池</span>';
  return _cdxDetail(
    '<div class="cdx-big-icon">'+w.icon+'</div>'+
    '<div class="cdx-item-name" style="color:#4ef">'+w.name+'</div>'+
    (badge?'<div style="margin-bottom:10px">'+badge+'</div>':'')+
    _cdxStat('⚔ 基础伤害', m.baseDmg)+
    _cdxStat('⏱ 攻击速度', m.baseCD)+
    _cdxStat('📏 攻击范围', m.range)+
    _cdxStat('⬆ 最高等级', 'Lv.'+maxLv)+
    _cdxSection('效果说明')+_cdxDesc(m.desc)+
    _cdxSection('推荐搭配天赋')+_cdxDesc(m.recommend)
  );
}

function _codexSupplyDetail(s, isTalent){
  const m=_CODEX_SUPPLY_META[s.id]||{howToGet:'随机出现'};
  const nameColor=isTalent?'#f84':'#fd4';
  const badge=isTalent?'<span class="cdx-badge cdx-badge-red">专武天赋</span>':'<span class="cdx-badge cdx-badge-gold">属性补给</span>';
  return _cdxDetail(
    '<div class="cdx-big-icon">'+s.icon+'</div>'+
    '<div class="cdx-item-name" style="color:'+nameColor+'">'+s.name+'</div>'+
    '<div style="margin-bottom:10px">'+badge+'</div>'+
    _cdxSection('效果')+_cdxDesc(s.desc)+
    _cdxSection('获得方式')+_cdxDesc(m.howToGet)
  );
}

function _codexBuildLayout(items, iconFn, nameFn, detailFn){
  if(!items||!items.length) return '<div class="codex-body"><div class="codex-grid-panel"></div><div class="codex-detail-panel"></div></div>';
  const grid=items.map((it,i)=>
    '<div class="cdx-grid-item'+(i===_codexSel?' sel':'')+'" data-idx="'+i+'">' +
    '<div class="cgi-icon">'+iconFn(it)+'</div>' +
    '<div class="cgi-name">'+nameFn(it)+'</div>' +
    '</div>'
  ).join('');
  const detail=detailFn(items[_codexSel])||'';
  return '<div class="codex-body">' +
    '<div class="codex-grid-panel"><div class="cdx-grid">'+grid+'</div></div>' +
    '<div class="codex-detail-panel" id="cdx-detail">'+detail+'</div>' +
    '</div>';
}

function renderCodexContent(){
  const el=document.getElementById('codex-content'); if(!el) return;
  let items=[], iconFn, nameFn, detailFn;

  if(_codexTab==='monster'){
    if(_codexSubtab==='elite'){
      el.innerHTML='<div class="codex-body"><div class="codex-grid-panel" style="align-items:center;justify-content:center;display:flex;flex-direction:column;color:#444;padding:40px 16px;text-align:center"><div style="font-size:36px">🔒</div><div style="margin-top:8px;font-size:11px">精英怪即将上线</div></div><div class="codex-detail-panel"></div></div>';
      return;
    }
    const keys=_codexSubtab==='boss'
      ?['boss_10','boss_10_cat','boss_10_dog','boss_20','boss_30']
      :['slime','goblin','skeleton','bat','orc','wolf','troll','demon','archer'];
    items=keys.map(k=>({k}));
    iconFn=it=>(_CODEX_ENEMY_META[it.k]||{icon:'?'}).icon;
    nameFn=it=>(_CODEX_ENEMY_META[it.k]||{name:'?'}).name;
    detailFn=it=>_codexMonsterDetail(it.k);
  } else if(_codexTab==='char'){
    items=CLASSES;
    iconFn=c=>(_CODEX_CLASS_META[c.id]||{icon:'⚔'}).icon;
    nameFn=c=>c.name;
    detailFn=c=>_codexClassDetail(c);
  } else if(_codexTab==='weapon'){
    const keys=['shotgun','gatling','sword','arrow_rain','heal_drone','missile_drone','sniper','kirby_copy','flying_sword','black_tortoise'];
    items=keys.map(k=>({k}));
    iconFn=it=>(WEAPON_DEFS[it.k]||{icon:'?'}).icon;
    nameFn=it=>(WEAPON_DEFS[it.k]||{name:'?'}).name;
    detailFn=it=>_codexWeaponDetail(it.k);
  } else if(_codexTab==='supply'){
    items=(_codexSubtab==='talent')?SUPPLY_TALENTS:STAT_UPGRADES;
    iconFn=s=>s.icon;
    nameFn=s=>s.name;
    detailFn=s=>_codexSupplyDetail(s, _codexSubtab==='talent');
  }

  el.innerHTML=_codexBuildLayout(items, iconFn, nameFn, detailFn);

  // Attach click events
  el.querySelectorAll('.cdx-grid-item').forEach(btn=>{
    btn.addEventListener('click',()=>{
      _codexSel=parseInt(btn.dataset.idx);
      el.querySelectorAll('.cdx-grid-item').forEach(b=>b.classList.toggle('sel',b===btn));
      const dp=document.getElementById('cdx-detail');
      if(dp){ dp.innerHTML=detailFn(items[_codexSel]); }
      SFX.play('click');
    });
  });
}

document.querySelectorAll('#codex-tabs .codex-tab').forEach(tab=>{
  tab.addEventListener('click',()=>{
    _codexTab=tab.dataset.tab; _codexSubtab='normal'; _codexSel=0;
    _renderCodexTabs(); renderCodexContent(); SFX.play('click');
  });
});

document.getElementById('btn-codex-back').addEventListener('click',()=>showOverlay('o-menu'));
document.getElementById('btn-gacha-back').addEventListener('click',()=>showOverlay('o-menu'));

document.getElementById('btn-forge').addEventListener('click',()=>{ renderForge(); showOverlay('o-forge'); });
document.getElementById('btn-forge-back').addEventListener('click',()=>showOverlay('o-menu'));

document.getElementById('btn-uprofile-back').addEventListener('click',()=>showOverlay(_uprofileBack));
document.getElementById('btn-friends-back').addEventListener('click',()=>showOverlay('o-menu'));
document.getElementById('btn-dm-back').addEventListener('click',()=>{
  _dmOpen=false;if(_dmPollTimer){clearTimeout(_dmPollTimer);_dmPollTimer=null;}
  showOverlay(_dmBack);
  if(_dmBack==='o-chat')switchChatSection('dms');
});
document.getElementById('btn-codex').addEventListener('click',()=>openCodex());
document.getElementById('btn-gacha').addEventListener('click',()=>{
  updateGachaPityUI();
  renderGachaPoolList();
  switchGachaTab('sword');
  showOverlay('o-gacha');
});



// ── Gacha system ──
function getGachaTickets(){ try{ return Math.max(0,parseInt(localStorage.getItem('pw_gacha_tickets')||'0',10)); }catch{ return 0; } }
function spendGachaTicket(){ try{ const t=getGachaTickets(); if(t<=0)return false; localStorage.setItem('pw_gacha_tickets',String(t-1)); return true; }catch{ return false; } }

// ── Weapon Fragment & Enhancement system ──
function getWeaponFrags(){ try{ return Math.max(0,parseInt(localStorage.getItem('pw_wfrags')||'0')||0); }catch{ return 0; } }
function addWeaponFrags(n){ try{ localStorage.setItem('pw_wfrags',String(getWeaponFrags()+n)); renderForgeFragCount(); }catch{} }
function spendWeaponFrags(n){ try{ const c=getWeaponFrags(); if(c<n) return false; localStorage.setItem('pw_wfrags',String(c-n)); renderForgeFragCount(); return true; }catch{ return false; } }
const _WENH_IDS=['shotgun','gatling','sword','arrow_rain','heal_drone','missile_drone','sniper','flying_sword'];
const _WENH_COSTS=[10,25,50,80,120];
const _WENH_MAX=5;
function getWeaponEnhLevel(id){ try{ return Math.max(0,Math.min(_WENH_MAX,parseInt(localStorage.getItem('pw_wenh_'+id)||'0')||0)); }catch{ return 0; } }
function setWeaponEnhLevel(id,lv){ try{ localStorage.setItem('pw_wenh_'+id,String(lv)); }catch{} }
function getTotalWeaponEnhBonus(){ return _WENH_IDS.reduce((s,id)=>s+getWeaponEnhLevel(id),0)*0.08; }
function renderForgeFragCount(){ const el=document.getElementById('forge-frags'); if(el) el.textContent=getWeaponFrags(); }

function renderForge(){
  renderForgeFragCount();
  const frags=getWeaponFrags();
  const WLIST=[
    {id:'shotgun',    icon:'🔫',name:'散弹枪'},
    {id:'gatling',    icon:'⚡',name:'加特林'},
    {id:'sword',      icon:'⚔', name:'剑阵'},
    {id:'arrow_rain', icon:'🏹',name:'箭雨'},
    {id:'heal_drone', icon:'💊',name:'治疗无人机'},
    {id:'missile_drone',icon:'🚀',name:'导弹无人机'},
    {id:'sniper',     icon:'🔭',name:'狙击枪'},
    {id:'flying_sword',icon:'🗡',name:'飞剑'},
  ];
  const list=document.getElementById('forge-weapon-list');
  if(!list) return;
  list.innerHTML=WLIST.map(w=>{
    const lv=getWeaponEnhLevel(w.id);
    const stars='★'.repeat(lv)+'<span style="color:#333">'+'★'.repeat(_WENH_MAX-lv)+'</span>';
    const bonus=Math.round(lv*8)+'%';
    const canUp=lv<_WENH_MAX;
    const cost=canUp?_WENH_COSTS[lv]:0;
    const ok2=frags>=cost;
    return '<div style="display:flex;align-items:center;gap:8px;padding:8px 4px;border-bottom:1px solid #1e2030">'+
      '<span style="font-size:20px">'+w.icon+'</span>'+
      '<div style="flex:1;text-align:left">'+
        '<div style="font-size:11px;color:#eee">'+w.name+' <span style="color:#fd4;font-size:13px">'+stars+'</span></div>'+
        '<div style="font-size:9px;color:#4f8">伤害 +'+bonus+'</div>'+
      '</div>'+
      (canUp
        ?'<button onclick="forgeUpgrade(\''+w.id+'\')" style="padding:5px 10px;font-size:10px;background:#1a1a2e;border:1.5px solid '+(ok2?'#fd4':'#333')+';border-radius:4px;color:'+(ok2?'#fd4':'#555')+';cursor:'+(ok2?'pointer':'default')+';font-family:monospace">🔩'+cost+'</button>'
        :'<span style="font-size:10px;color:#4f8;padding:5px 8px;border:1px solid #4f8;border-radius:4px">MAX</span>'
      )+'</div>';
  }).join('');
}

function forgeUpgrade(weapId){
  const lv=getWeaponEnhLevel(weapId);
  if(lv>=_WENH_MAX) return;
  const cost=_WENH_COSTS[lv];
  if(!spendWeaponFrags(cost)){ return; }
  setWeaponEnhLevel(weapId,lv+1);
  renderForge();
}

function getGachaPity(){ try{ return Math.max(0,parseInt(localStorage.getItem('pw_gacha_pity')||'0',10)); }catch{ return 0; } }
function setGachaPity(n){ try{ localStorage.setItem('pw_gacha_pity',String(n)); }catch{} }
function hasGachaFlyingSword(){ try{ return localStorage.getItem('pw_gacha_fs')==='1'; }catch{ return false; } }
function setGachaFlyingSword(){ try{ localStorage.setItem('pw_gacha_fs','1'); }catch{} }

function updateGachaPityUI(){
  const p=getGachaPity();
  const hasSword=hasGachaFlyingSword();
  const pct=Math.min(100,p)*100/100;
  const fill=document.getElementById('gacha-pity-fill');
  const txt=document.getElementById('gacha-pity-txt');
  if(fill) fill.style.width=pct+'%';
  if(txt) txt.textContent = hasSword ? '保底进度: 已解锁飞剑 ✓' : '保底进度: '+p+'/100';
  document.getElementById('gacha-coins').textContent=getCoins();
  const tkEl=document.getElementById('gacha-tickets-txt');
  if(tkEl) tkEl.textContent='🎟 抽奖券: '+getGachaTickets()+'张';
  // Refresh sidebar and tortoise panel if visible
  renderGachaPoolList();
  if(document.getElementById('gacha-panel-tortoise')?.style.display !== 'none') updateGachaTortoisePanel();
}

const GACHA_POOL = [
  { w:12, icon:'🪙', name:'金币 ×120',  apply:()=>{ addCoins(120);  return {rarity:'normal'}; } },
  { w:8,  icon:'🪙', name:'金币 ×300',  apply:()=>{ addCoins(300);  return {rarity:'normal'}; } },
  { w:18, icon:'❤',  name:'最大HP +20', apply:()=>{ if(gs?.player){ gs.player.maxHp+=20; healPlayer(20); } return {rarity:'rare'}; } },
  { w:17, icon:'💪', name:'伤害 +15%',  apply:()=>{ if(gs?.player){ gs.player.dmgMult=+((gs.player.dmgMult||1)*1.15).toFixed(4); } return {rarity:'rare'}; } },
  { w:13, icon:'⏱',  name:'CD -10%',    apply:()=>{ if(gs?.player){ gs.player.cdMult=Math.max(0.2,+((gs.player.cdMult||1)*0.90).toFixed(4)); } return {rarity:'rare'}; } },
  { w:12, icon:'🍀',  name:'幸运 +30',  apply:()=>{ if(gs?.player){ gs.player.luck=(gs.player.luck||0)+30; updateDerivedStats(gs.player); } return {rarity:'epic'}; } },
  { w:15, icon:'🔩', name:'武器碎片 ×3', apply:()=>{ addWeaponFrags(3); return {rarity:'rare'}; } },
  { w:5,  icon:'⚙',  name:'武器碎片 ×10',apply:()=>{ addWeaponFrags(10); return {rarity:'epic'}; } },
];

function gachaDraw(){
  let pity=getGachaPity();
  const hasSword=hasGachaFlyingSword();
  pity++;
  const isSwordPull = !hasSword && (pity>=100 || Math.random()<0.02);
  setGachaPity(isSwordPull ? 0 : pity);

  if(isSwordPull){
    setGachaFlyingSword();
    if(gs?.phase==='playing'||gs?.phase==='paused'){
      addWeapon('flying_sword');
    }
    return { icon:'🗡', name:'飞剑', rarity:'legendary', msg:'飞剑已解锁！下局游戏可在抽奖前选择携带。' };
  }

  // Weighted random
  let total=GACHA_POOL.reduce((s,x)=>s+x.w,0);
  let r=Math.random()*total;
  for(const item of GACHA_POOL){
    r-=item.w;
    if(r<=0){ const res=item.apply(); return { icon:item.icon, name:item.name, rarity:res.rarity||'normal' }; }
  }
  const fb=GACHA_POOL[0]; fb.apply(); return { icon:fb.icon, name:fb.name, rarity:'normal' };
}

function doGacha(times, useTickets){
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
}

function showGachaModal(results){
  // Remove existing modal
  const old=document.getElementById('gacha-modal');
  if(old) old.remove();

  const rarityCol={normal:'#888',rare:'#4af',epic:'#c8f',legendary:'#fd4'};
  const rarityBg ={normal:'rgba(0,0,0,.5)',rare:'rgba(0,20,60,.7)',epic:'rgba(30,0,60,.7)',legendary:'rgba(60,40,0,.8)'};
  const rarityLabel={normal:'',rare:'★ 稀有',epic:'★★ 史诗',legendary:'★★★ 传说'};

  const overlay=document.createElement('div');
  overlay.id='gacha-modal';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.82);z-index:9999;display:flex;align-items:center;justify-content:center;animation:fadeIn .2s ease';

  const box=document.createElement('div');
  box.style.cssText='background:#0d0d1a;border:2px solid #f8a;border-radius:12px;padding:24px 20px;max-width:480px;width:90%;text-align:center';

  const title=document.createElement('div');
  title.style.cssText='font-size:16px;color:#f8a;font-weight:900;letter-spacing:2px;margin-bottom:16px;font-family:"Courier New",monospace';
  title.textContent = results.length===1 ? '🎰 单抽结果' : '🎰 十连结果';
  box.appendChild(title);

  const grid=document.createElement('div');
  grid.style.cssText='display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-bottom:18px';
  results.forEach(r=>{
    const item=document.createElement('div');
    const col=rarityCol[r.rarity]||'#888';
    const bg=rarityBg[r.rarity]||'rgba(0,0,0,.5)';
    item.style.cssText='width:80px;padding:10px 6px;border:2px solid '+col+';border-radius:8px;background:'+bg+
      ';animation:cardIn .3s ease both;text-align:center';
    item.innerHTML='<div style="font-size:28px;margin-bottom:5px">'+r.icon+'</div>'+
      '<div style="font-size:10px;color:'+col+';font-weight:700;line-height:1.3">'+r.name+'</div>'+
      (rarityLabel[r.rarity]?'<div style="font-size:8px;color:'+col+';opacity:.8;margin-top:3px">'+rarityLabel[r.rarity]+'</div>':'');
    grid.appendChild(item);
  });
  box.appendChild(grid);

  const closeBtn=document.createElement('button');
  closeBtn.className='btn primary';
  closeBtn.style.cssText='width:100%;padding:9px;font-size:12px';
  closeBtn.textContent='确认';
  closeBtn.addEventListener('click',()=>overlay.remove());
  box.appendChild(closeBtn);

  overlay.appendChild(box);
  overlay.addEventListener('click',e=>{ if(e.target===overlay) overlay.remove(); });
  document.body.appendChild(overlay);
}

// ── Black Tortoise pool helpers ──
function hasGachaBlackTortoise(){ try{ return localStorage.getItem('pw_gacha_bt')==='1'; }catch{ return false; } }
function setGachaBlackTortoise(){ try{ localStorage.setItem('pw_gacha_bt','1'); }catch{} }
function getTortoisePity(){ try{ return Math.max(0,parseInt(localStorage.getItem('pw_gacha_bt_pity')||'0',10)); }catch{ return 0; } }
function setTortoisePity(n){ try{ localStorage.setItem('pw_gacha_bt_pity',String(n)); }catch{} }
function isTortoisePoolUnlocked(){ try{ const b=loadBest(); return b&&(b.wave||0)>=8; }catch{ return false; } }

function updateGachaTortoisePanel(){
  const content = document.getElementById('tortoise-pool-content');
  const drawBtns = document.getElementById('tortoise-draw-btns');
  if (!content) return;
  const unlocked = isTortoisePoolUnlocked();
  const hasBT = hasGachaBlackTortoise();
  const pity = getTortoisePity();

  if (!unlocked) {
    content.innerHTML =
      '<div style="font-size:28px;margin-bottom:6px;filter:grayscale(1);opacity:.5">🔒🐢</div>'+
      '<div style="font-size:12px;color:#555;font-weight:bold;margin-bottom:4px">召唤术·玄武奖池</div>'+
      '<div style="font-size:10px;color:#444;border:1px solid #333;border-radius:6px;padding:6px 10px;display:inline-block">通关第8波后解锁</div>';
    if (drawBtns) drawBtns.style.display = 'none';
  } else {
    const pct = Math.min(100, pity);
    content.innerHTML =
      '<div style="font-size:30px;margin-bottom:5px">🐢</div>'+
      '<div style="font-size:13px;color:#4fd;margin-bottom:4px;font-weight:bold">玄武奖池</div>'+
      '<div style="font-size:9px;color:#888;margin-bottom:8px">单抽必出金币/补给 · 50抽保底玄武</div>'+
      (hasBT
        ? '<div style="font-size:10px;color:#4fd;margin-bottom:6px">✓ 召唤术·玄武 已解锁</div>'
        : '')+
      '<div style="background:#1a1a2a;border-radius:4px;height:5px;margin-bottom:3px;overflow:hidden">'+
        '<div style="height:100%;background:linear-gradient(90deg,#4fd,#4ef);border-radius:4px;width:'+pct+'%;transition:width .4s"></div>'+
      '</div>'+
      '<div style="font-size:9px;color:#666">'+(hasBT?'保底进度: 已解锁玄武 ✓':'保底进度: '+pity+'/50')+'</div>';
    if (drawBtns) drawBtns.style.display = 'flex';
  }
}

function tortoiseDraw(){
  let pity = getTortoisePity();
  const hasBT = hasGachaBlackTortoise();
  pity++;
  const isBTPull = !hasBT && (pity >= 50 || Math.random() < 0.03);
  setTortoisePity(isBTPull ? 0 : pity);

  if (isBTPull) {
    setGachaBlackTortoise();
    return { icon:'🐢', name:'召唤术·玄武', rarity:'legendary', msg:'玄武已解锁！下局第5波通关后可选择。' };
  }
  // Consolation: same pool as sword gacha
  let total = GACHA_POOL.reduce((s,x)=>s+x.w,0);
  let r = Math.random()*total;
  for (const item of GACHA_POOL) {
    r -= item.w;
    if (r <= 0) { const res=item.apply(); return { icon:item.icon, name:item.name, rarity:res.rarity||'normal' }; }
  }
  const fb=GACHA_POOL[0]; fb.apply(); return { icon:fb.icon, name:fb.name, rarity:'normal' };
}

function doTortoiseGacha(times, useTickets){
  if (!isTortoisePoolUnlocked()){
    showGachaModal([{icon:'🔒',name:'通关第8波后解锁',rarity:'normal'}]);
    return;
  }
  if (useTickets) {
    const tix = getGachaTickets();
    if (tix < times){ showGachaModal([{icon:'❌',name:'抽奖券不足！需要'+times+'张，当前'+tix+'张',rarity:'normal'}]); return; }
    for (let i=0;i<times;i++) spendGachaTicket();
  } else {
    if (!spendCoins(times*100)){ showGachaModal([{icon:'❌',name:'金币不足！需要'+(times*100)+' 金币',rarity:'normal'}]); return; }
  }
  const results = [];
  for (let i=0;i<times;i++) results.push(tortoiseDraw());
  updateGachaPityUI();
  showGachaModal(results);
}

// ── Gacha two-column pool system ──
const _GACHA_POOLS = [
  { id:'sword',     icon:'🗡', name:'飞剑池',   unlocked:()=>true },
  { id:'tortoise',  icon:'🐢', name:'玄武池',   unlocked:()=>isTortoisePoolUnlocked() },
  { id:'odds',      icon:'📊', name:'概率',     unlocked:()=>true },
];

function renderGachaPoolList(){
  const list = document.getElementById('gacha-pool-list');
  if (!list) return;
  // Split into unlocked/locked then render unlocked first, locked at bottom
  const unlocked = _GACHA_POOLS.filter(p => p.unlocked());
  const locked   = _GACHA_POOLS.filter(p => !p.unlocked());
  const current  = list.dataset.active || 'sword';
  list.innerHTML = '';
  const makeItem = (p, isLocked) => {
    const el = document.createElement('div');
    el.className = 'gacha-pool-item' + (p.id === current ? ' active' : '') + (isLocked ? ' gpi-locked' : '');
    el.dataset.pool = p.id;
    el.innerHTML = '<span class="gpi-icon">'+p.icon+'</span><span>'+p.name+'</span>';
    if (!isLocked) el.addEventListener('click', ()=>switchGachaTab(p.id));
    list.appendChild(el);
  };
  unlocked.forEach(p => makeItem(p, false));
  locked.forEach(p => makeItem(p, true));
}

function switchGachaTab(tab){
  ['sword','tortoise','odds'].forEach(id => {
    const el = document.getElementById('gacha-panel-'+id);
    if (el) el.style.display = id === tab ? '' : 'none';
  });
  // Update active state in sidebar
  const list = document.getElementById('gacha-pool-list');
  if (list) {
    list.dataset.active = tab;
    list.querySelectorAll('.gacha-pool-item').forEach(el => {
      el.classList.toggle('active', el.dataset.pool === tab);
    });
  }
  if (tab === 'tortoise') updateGachaTortoisePanel();
}



document.getElementById('btn-gacha-x1').addEventListener('click',()=>{ doGacha(1); });
document.getElementById('btn-gacha-x10').addEventListener('click',()=>{ doGacha(10); });
document.getElementById('btn-gacha-ticket1').addEventListener('click',()=>{ doGacha(1,true); });
document.getElementById('btn-gacha-ticket10').addEventListener('click',()=>{ doGacha(10,true); });
document.getElementById('btn-tortoise-x1').addEventListener('click',()=>{ doTortoiseGacha(1); });
document.getElementById('btn-tortoise-x10').addEventListener('click',()=>{ doTortoiseGacha(10); });
document.getElementById('btn-tortoise-ticket1').addEventListener('click',()=>{ doTortoiseGacha(1,true); });
document.getElementById('btn-friends').addEventListener('click',()=>{
  _friendTab='list';showOverlay('o-friends');
});
document.getElementById('ftab-list').addEventListener('click',()=>switchFriendTab('list'));
document.getElementById('ftab-req').addEventListener('click',()=>switchFriendTab('req'));
document.getElementById('btn-dm-send').addEventListener('click',()=>sendDmMsg());
document.getElementById('dm-input').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey)sendDmMsg();});

// §29 Player level system
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
    return '<div class="friend-item" data-nick="'+nAttr+'" data-from="o-chat" onclick="openDM(this.dataset.nick,this.dataset.from)">'+
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
        '<button data-em="'+e+'" class="emoji-btn" style="font-size:22px;background:none;border:none;cursor:pointer;padding:3px;border-radius:4px;line-height:1">'+e+'</button>'
      ).join('');
      ep.querySelectorAll('.emoji-btn').forEach(b=>b.addEventListener('click',()=>insertChatEmoji(b.dataset.em)));
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

// Initial chat preview poll
setTimeout(startChatPoll,1500);

