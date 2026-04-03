const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

// ── 1. CSS: 聊天气泡布局 ──
h = h.replace(
`.chat-msg{font-size:11px;line-height:1.8;padding:4px 8px;border-radius:3px;
  background:rgba(255,255,255,0.03);border-left:2px solid #334;word-break:break-all}
.chat-msg .chat-nick{color:#4fd;font-weight:700;margin-right:5px}
.chat-msg .chat-time{color:#444;font-size:9px;margin-left:5px}
.chat-msg.own-msg{border-left-color:#48f;background:rgba(68,136,255,0.07)}`,
`.chat-msg{display:flex;align-items:flex-end;gap:7px;padding:3px 4px}
.chat-msg.own-msg{flex-direction:row}
.chat-msg:not(.own-msg){flex-direction:row-reverse}
.chat-bubble{background:rgba(255,255,255,0.06);border-radius:10px;padding:6px 10px;max-width:76%;word-break:break-all;font-size:11px;line-height:1.6}
.chat-msg.own-msg .chat-bubble{background:rgba(68,136,255,0.15);border-bottom-left-radius:2px}
.chat-msg:not(.own-msg) .chat-bubble{border-bottom-right-radius:2px}
.chat-nick{display:block;color:#4fd;font-weight:700;font-size:10px;margin-bottom:2px}
.chat-time{color:#555;font-size:9px;margin-left:4px}
.chat-avatar{width:32px;height:32px;border-radius:50%;background:#1a1a2e;display:flex;align-items:center;justify-content:center;font-size:19px;flex-shrink:0;border:2px solid #334}`
);

// ── 2. 主菜单左上角玩家头像按钮 ──
h = h.replace(
`<!-- Top button bar -->`,
`<!-- Player avatar top-left -->
  <div id="menu-player-btn" onclick="openProfile(false)" style="position:absolute;top:14px;left:16px;z-index:10;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px">
    <div id="menu-avatar-icon" style="width:40px;height:40px;border-radius:50%;background:#1a1a2e;border:2px solid #334;display:flex;align-items:center;justify-content:center;font-size:23px">👦</div>
    <div id="menu-player-name" style="font-size:9px;color:#555;max-width:52px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center"></div>
  </div>

  <!-- Top button bar -->`
);

// ── 3. 新增玩家信息 overlay (在 CHAT 之前) ──
h = h.replace(
`<!-- CHAT -->`,
`<!-- PROFILE -->
<div class="overlay" id="o-profile">
  <div class="panel" style="max-width:320px;text-align:center">
    <div style="font-size:18px;color:#4fd;margin-bottom:14px;letter-spacing:2px">👤 玩家信息</div>
    <div id="profile-avatar" style="width:72px;height:72px;border-radius:50%;background:#1a1a2e;border:3px solid #334;display:flex;align-items:center;justify-content:center;font-size:42px;margin:0 auto 14px;transition:border-color .2s,box-shadow .2s"></div>
    <div style="text-align:left;font-size:11px;color:#888;margin-bottom:4px">昵称（最多10字）</div>
    <input id="profile-name-input" type="text" maxlength="10" placeholder="起个名字吧..."
      style="width:100%;background:#111;border:1px solid #48f;border-radius:4px;color:#eee;padding:8px 10px;font-size:13px;box-sizing:border-box;margin-bottom:12px;text-align:center;font-family:inherit">
    <div style="text-align:left;font-size:11px;color:#888;margin-bottom:6px">性别</div>
    <div style="display:flex;gap:8px;margin-bottom:12px">
      <button class="btn" id="btn-gender-male" style="flex:1;font-size:15px;padding:7px">👦 男</button>
      <button class="btn" id="btn-gender-female" style="flex:1;font-size:15px;padding:7px">👧 女</button>
    </div>
    <div style="text-align:left;font-size:11px;color:#888;margin-bottom:6px">头像框</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;justify-content:center" id="frame-options">
      <div class="frame-opt" data-frame="" title="无" style="width:38px;height:38px;border-radius:50%;background:#1a1a2e;border:2px solid #334;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:9px;color:#555">无</div>
      <div class="frame-opt" data-frame="gold"   style="width:38px;height:38px;border-radius:50%;background:#1a1a2e;border:3px solid #fd4;box-shadow:0 0 7px #fd4;cursor:pointer"></div>
      <div class="frame-opt" data-frame="blue"   style="width:38px;height:38px;border-radius:50%;background:#1a1a2e;border:3px solid #48f;box-shadow:0 0 7px #48f;cursor:pointer"></div>
      <div class="frame-opt" data-frame="red"    style="width:38px;height:38px;border-radius:50%;background:#1a1a2e;border:3px solid #f44;box-shadow:0 0 7px #f44;cursor:pointer"></div>
      <div class="frame-opt" data-frame="green"  style="width:38px;height:38px;border-radius:50%;background:#1a1a2e;border:3px solid #4fd;box-shadow:0 0 7px #4fd;cursor:pointer"></div>
      <div class="frame-opt" data-frame="purple" style="width:38px;height:38px;border-radius:50%;background:#1a1a2e;border:3px solid #a4f;box-shadow:0 0 7px #a4f;cursor:pointer"></div>
    </div>
    <button class="btn primary" id="btn-profile-save" style="width:100%;margin-bottom:8px;padding:10px;font-size:14px">保存</button>
    <button class="btn" id="btn-profile-back" style="width:100%;padding:8px">← 返回</button>
  </div>
</div>

<!-- CHAT -->`
);

// ── 4. 更新 renderChatMsgs ──
h = h.replace(
`function renderChatMsgs(msgs){
  const el=document.getElementById('chat-messages');if(!el)return;
  const myNick=getChatNick();
  if(!msgs||!msgs.length){
    el.innerHTML='<div style="text-align:center;color:#444;padding:20px;font-size:11px">暂无消息，快来打个招呼！</div>';
    return;
  }
  el.innerHTML=msgs.map(m=>{
    const d=new Date(m.time||0);
    const ts=d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0');
    const own=m.nick===myNick;
    return '<div class="chat-msg'+(own?' own-msg':'')+'">'+
      '<span class="chat-nick">'+(m.nick||'匿名').replace(/</g,'&lt;')+'</span>'+
      '<span>'+(m.text||'').replace(/</g,'&lt;')+'</span>'+
      '<span class="chat-time">'+ts+'</span></div>';
  }).join('');
  el.scrollTop=el.scrollHeight;
}`,
`function getPlayerGender(){try{return localStorage.getItem('pw_gender')||'male';}catch{return'male';}}
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
    if(own){
      return '<div class="chat-msg own-msg">'+
        '<div class="chat-avatar" style="border-color:'+bc+';box-shadow:'+bsh+'">'+myEmoji+'</div>'+
        '<div class="chat-bubble">'+
        (m.text||'').replace(/</g,'&lt;')+
        '<span class="chat-time">'+ts+'</span></div></div>';
    } else {
      return '<div class="chat-msg">'+
        '<div class="chat-bubble">'+
        '<span class="chat-nick">'+(m.nick||'匿名').replace(/</g,'&lt;')+'</span>'+
        (m.text||'').replace(/</g,'&lt;')+
        '<span class="chat-time"> '+ts+'</span></div></div>';
    }
  }).join('');
  el.scrollTop=el.scrollHeight;
}`
);

// ── 5. 修改昵称点击 → 打开玩家信息 ──
h = h.replace(
`const nickEl=document.getElementById('chat-nick-show');
if(nickEl){
  nickEl.textContent=getChatNick();
  nickEl.addEventListener('click',()=>{
    const n=prompt('修改昵称:',getChatNick());
    if(n&&n.trim()){
      _chatNick=n.trim().slice(0,20);
      try{localStorage.setItem('pw_chat_nick',_chatNick);}catch(e){}
      nickEl.textContent=_chatNick;
    }
  });
}`,
`const nickEl=document.getElementById('chat-nick-show');
if(nickEl){
  nickEl.textContent=getChatNick();
  nickEl.addEventListener('click',()=>openProfile(true));
}`
);

// ── 6. 玩家信息 JS + 修改 showOverlay 包装 ──
const profileJS = `
// §23 玩家信息系统
let _profileFromChat=false;
let _profGender='male';
let _profFrame='';

function _autoNickPattern(n){
  return /^(勇猛|冷酷|神秘|传奇|狂野|精锐)(战士|法师|游侠|刺客|博士|医生)\\d{3}$/.test(n);
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
document.getElementById('btn-profile-save').addEventListener('click',()=>{
  const ni=document.getElementById('profile-name-input');
  const name=(ni.value||'').trim().slice(0,10);
  if(!name){
    ni.style.borderColor='#f44';
    ni.placeholder='请输入昵称！';
    return;
  }
  ni.style.borderColor='#48f';
  _chatNick=name;
  try{localStorage.setItem('pw_chat_nick',name);localStorage.setItem('pw_nick_set','1');}catch(e){}
  try{localStorage.setItem('pw_gender',_profGender);}catch(e){}
  try{localStorage.setItem('pw_avatar_frame',_profFrame);}catch(e){}
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

`;

h = h.replace(
`// Wrap showOverlay to track chat open state`,
profileJS + `// Wrap showOverlay to track chat open state`
);

// ── 7. showOverlay 包装：进聊天室前检查昵称 ──
h = h.replace(
`  window.showOverlay=function(id){
    _chatOpen=(id==='o-chat');
    if(_chatOpen){
      document.getElementById('chat-nick-show').textContent=getChatNick();
      startChatPoll();
    }
    orig(id);
  };`,
`  window.showOverlay=function(id){
    if(id==='o-chat'){
      try{ if(!localStorage.getItem('pw_nick_set')){ openProfile(true); return; } }catch(e){}
    }
    _chatOpen=(id==='o-chat');
    if(_chatOpen){
      document.getElementById('chat-nick-show').textContent=getChatNick();
      startChatPoll();
    }
    orig(id);
  };`
);

fs.writeFileSync('index.html', h, 'utf8');
console.log('Done. Size:', h.length);
