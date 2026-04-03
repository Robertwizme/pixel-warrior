const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

// 1. 聊天室占满全屏
h = h.replace(
`<!-- CHAT -->
<div class="overlay" id="o-chat">
  <div class="panel" style="max-width:480px;width:92%;max-height:80vh;display:flex;flex-direction:column;padding:16px">
    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
      <div style="color:#4fd;font-size:16px">💬 <span id="chat-title">聊天室</span></div>
      <div style="display:flex;align-items:center;gap:8px">
        <span id="chat-nick-show" style="font-size:10px;color:#888;cursor:pointer" title="点击修改昵称"></span>
        <button class="btn" id="btn-chat-back" style="padding:4px 10px;font-size:11px">← 返回</button>
      </div>
    </div>
    <!-- Messages -->
    <div id="chat-messages" style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:3px;min-height:200px;max-height:52vh;margin-bottom:10px"></div>
    <!-- Input area (toggled by left button) -->
    <div style="display:flex;align-items:center;gap:6px;border-top:1px solid #222;padding-top:10px">
      <button id="btn-chat-compose" class="btn" style="padding:6px 10px;font-size:13px;min-width:36px" title="写消息">✏️</button>
      <div id="chat-input-area" style="flex:1;display:none;gap:6px">
        <input id="chat-input" type="text" maxlength="100" placeholder="输入消息（最多100字）..."
          style="width:calc(100% - 58px);background:#111;border:1px solid #48f;border-radius:3px;
          color:#eee;padding:7px 10px;font-size:12px;font-family:monospace">
        <button class="btn primary" id="btn-chat-send" style="padding:6px 12px;font-size:12px">发</button>
      </div>
      <div id="chat-compose-hint" style="font-size:10px;color:#555;flex:1">点击 ✏️ 写消息</div>
    </div>
    <!-- Config hint -->
    <div id="chat-config-hint" style="display:none;text-align:center;padding:20px;color:#555;font-size:11px">
      请先在设置中配置 Firebase URL<br>
      <span style="color:#333;font-size:9px">console.firebase.google.com → Realtime Database → 复制URL</span>
    </div>
  </div>
</div>`,
`<!-- CHAT -->
<div class="overlay" id="o-chat" style="background:#0d0d1a;align-items:stretch;justify-content:stretch;flex-direction:column">
  <!-- Chat header -->
  <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:rgba(0,0,0,0.5);border-bottom:1px solid #1e2030;flex-shrink:0">
    <div style="display:flex;align-items:center;gap:8px">
      <span id="chat-nick-show" style="font-size:13px;color:#4fd;cursor:pointer;font-weight:700" title="点击修改昵称">...</span>
    </div>
    <div style="color:#4fd;font-size:15px;font-weight:700">💬 聊天室</div>
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
</div>`
);

// 2. 修复 renderChatMsgs：自己靠右+头像在右，他人靠左
h = h.replace(
`  el.innerHTML=msgs.map(m=>{
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
  }).join('');`,
`  el.innerHTML=msgs.map(m=>{
    const d=new Date(m.time||0);
    const ts=d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0');
    const own=m.nick===myNick;
    if(own){
      // 自己：靠右，头像在右侧
      return '<div class="chat-msg own-msg">'+
        '<div class="chat-bubble">'+
        '<span class="chat-nick" style="text-align:right;display:block">'+myNick.replace(/</g,'&lt;')+'</span>'+
        (m.text||'').replace(/</g,'&lt;')+
        '<span class="chat-time"> '+ts+'</span></div>'+
        '<div class="chat-avatar" style="border-color:'+bc+';box-shadow:'+bsh+'">'+myEmoji+'</div>'+
        '</div>';
    } else {
      // 他人：靠左，无头像
      return '<div class="chat-msg">'+
        '<div class="chat-bubble">'+
        '<span class="chat-nick">'+(m.nick||'匿名').replace(/</g,'&lt;')+'</span>'+
        (m.text||'').replace(/</g,'&lt;')+
        '<span class="chat-time"> '+ts+'</span></div></div>';
    }
  }).join('');`
);

// 3. CSS：own-msg 靠右
h = h.replace(
`.chat-msg.own-msg{flex-direction:row}
.chat-msg:not(.own-msg){flex-direction:row-reverse}`,
`.chat-msg.own-msg{flex-direction:row-reverse;justify-content:flex-start}
.chat-msg:not(.own-msg){flex-direction:row}`
);

h = h.replace(
`.chat-msg.own-msg .chat-bubble{background:rgba(68,136,255,0.15);border-bottom-left-radius:2px}
.chat-msg:not(.own-msg) .chat-bubble{border-bottom-right-radius:2px}`,
`.chat-msg.own-msg .chat-bubble{background:rgba(68,136,255,0.15);border-bottom-right-radius:2px;text-align:right}
.chat-msg:not(.own-msg) .chat-bubble{border-bottom-left-radius:2px}`
);

fs.writeFileSync('index.html', h, 'utf8');
console.log('Done. Size:', h.length);
