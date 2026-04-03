const fs = require('fs');
let h = fs.readFileSync('index.html', 'utf8');

// ── 1. 版本号 & 公告 ──
h = h.replace("const GAME_VERSION = 'v0.3.2';", "const GAME_VERSION = 'v0.3.3';");
h = h.replace(
`const CHANGELOG = [
  {
    version: 'v0.3.2',`,
`const CHANGELOG = [
  { version:'v0.3.3', date:'2026-04-03', items:[
    '聊天气泡重排：自己靠右+头像在右+时间在左，他人靠左+显示头像',
    '设置新增白色/黑色背景一键切换',
    '版本号移至右下角',
    '界面响应式优化（手机/平板/电脑）',
    '首次进聊天室自动弹出起名界面（最多10字）',
  ]},
  {
    version: 'v0.3.2',`
);

// ── 2. CSS：聊天气泡 + 主题 + 响应式 ──
h = h.replace(
`.chat-msg{display:flex;align-items:flex-end;gap:7px;padding:3px 4px}
.chat-msg.own-msg{flex-direction:row-reverse;justify-content:flex-start}
.chat-msg:not(.own-msg){flex-direction:row}
.chat-bubble{background:rgba(255,255,255,0.06);border-radius:10px;padding:6px 10px;max-width:76%;word-break:break-all;font-size:11px;line-height:1.6}
.chat-msg.own-msg .chat-bubble{background:rgba(68,136,255,0.15);border-bottom-right-radius:2px;text-align:right}
.chat-msg:not(.own-msg) .chat-bubble{border-bottom-left-radius:2px}
.chat-nick{display:block;color:#4fd;font-weight:700;font-size:10px;margin-bottom:2px}
.chat-time{color:#555;font-size:9px;margin-left:4px}
.chat-avatar{width:32px;height:32px;border-radius:50%;background:#1a1a2e;display:flex;align-items:center;justify-content:center;font-size:19px;flex-shrink:0;border:2px solid #334}`,
`.chat-msg{display:flex;align-items:flex-end;gap:6px;padding:3px 2px}
.chat-msg.own-msg{flex-direction:row;justify-content:flex-end;align-items:flex-end}
.chat-msg:not(.own-msg){flex-direction:row;align-items:flex-end}
.chat-bubble{background:rgba(255,255,255,0.06);border-radius:10px;padding:7px 11px;max-width:72%;word-break:break-all;font-size:12px;line-height:1.6}
.chat-msg.own-msg .chat-bubble{background:rgba(68,136,255,0.15);border-bottom-right-radius:2px;text-align:left}
.chat-msg:not(.own-msg) .chat-bubble{border-bottom-left-radius:2px}
.chat-nick{display:block;color:#4fd;font-weight:700;font-size:10px;margin-bottom:2px}
.chat-time{color:#555;font-size:9px;margin-left:4px}
.chat-time-own{color:#555;font-size:9px;white-space:nowrap;align-self:flex-end;margin-right:4px;flex-shrink:0}
.chat-avatar{width:34px;height:34px;border-radius:50%;background:#1a1a2e;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;border:2px solid #334}
/* ── Light theme ── */
body.theme-light{background:#eef2fa}
body.theme-light #o-menu{background:#eef2fa !important}
body.theme-light .overlay:not(#o-menu){background:rgba(228,234,248,0.98) !important}
body.theme-light .panel{background:#fff !important;border-color:#ccd !important;color:#111 !important}
body.theme-light .btn{background:#e8eef8 !important;color:#111 !important;border-color:#aab !important}
body.theme-light .btn.primary{background:#3a7bff !important;color:#fff !important;border-color:#3a7bff !important}
body.theme-light .game-title{color:#1a3a8a !important;text-shadow:0 0 12px #aaf !important}
body.theme-light .game-sub{color:#446 !important}
body.theme-light .chat-bubble{background:rgba(0,0,0,0.06) !important;color:#111 !important}
body.theme-light .chat-msg.own-msg .chat-bubble{background:rgba(58,123,255,0.13) !important}
body.theme-light .chat-nick{color:#0055aa !important}
body.theme-light .chat-time,.chat-time-own{color:#888 !important}
body.theme-light #chat-messages{background:#f4f8ff}
body.theme-light #hud{background:rgba(238,244,255,0.95) !important;color:#111 !important}
body.theme-light #hud-hp-bar,body.theme-light #hud-xp-bar{background:#ccd !important}
body.theme-light #menu-topbar{background:rgba(220,228,248,0.9) !important;border-color:#bbc !important}
body.theme-light #menu-coins-bar{color:#554400 !important}
body.theme-light #best-run{color:#334 !important}
body.theme-light #menu-chat-preview{background:rgba(210,220,245,0.6) !important;border-color:#bbc !important}
body.theme-light #menu-chat-preview:hover{background:rgba(200,215,245,0.8) !important}
body.theme-light .setting-row span{color:#111}
body.theme-light input{background:#f5f7ff !important;color:#111 !important;border-color:#aab !important}
/* ── Responsive ── */
@media(max-width:520px){
  .panel{max-width:100vw !important;width:100% !important;border-radius:10px !important;padding:14px 12px !important;margin:0 !important}
  .btn{font-size:11px !important}
  #menu-topbar{padding:8px 6px !important;gap:4px !important}
  #menu-topbar .btn{padding:6px 8px !important;font-size:10px !important}
  .game-title{font-size:30px !important}
  .chat-bubble{max-width:80% !important;font-size:12px !important}
  .chat-avatar{width:28px !important;height:28px !important;font-size:14px !important}
  #btn-start{font-size:14px !important;padding:10px 24px !important}
  #menu-player-btn{top:10px !important;left:10px !important}
}
@media(min-width:521px) and (max-width:900px){
  .panel{max-width:92vw !important}
  #menu-topbar .btn{padding:6px 11px !important;font-size:11px !important}
}`
);

// ── 3. renderChatMsgs：时间在左，气泡，头像在右；他人左侧头像 ──
h = h.replace(
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
  }).join('');`,
`  el.innerHTML=msgs.map(m=>{
    const d=new Date(m.time||0);
    const ts=d.getHours().toString().padStart(2,'0')+':'+d.getMinutes().toString().padStart(2,'0');
    const own=m.nick===myNick;
    if(own){
      // 自己：时间在左 → 气泡 → 头像在右
      return '<div class="chat-msg own-msg">'+
        '<span class="chat-time-own">'+ts+'</span>'+
        '<div class="chat-bubble">'+
        '<span class="chat-nick">'+myNick.replace(/</g,'&lt;')+'</span>'+
        (m.text||'').replace(/</g,'&lt;')+
        '</div>'+
        '<div class="chat-avatar" style="border-color:'+bc+';box-shadow:'+bsh+'">'+myEmoji+'</div>'+
        '</div>';
    } else {
      // 他人：头像在左 → 气泡
      const firstCh=(m.nick||'?').charAt(0);
      return '<div class="chat-msg">'+
        '<div class="chat-avatar" style="font-size:14px;font-weight:700;color:#4fd">'+firstCh+'</div>'+
        '<div class="chat-bubble">'+
        '<span class="chat-nick">'+(m.nick||'匿名').replace(/</g,'&lt;')+'</span>'+
        (m.text||'').replace(/</g,'&lt;')+
        '<span class="chat-time"> '+ts+'</span>'+
        '</div></div>';
    }
  }).join('');`
);

// ── 4. 版本号移至右下角（和开始按钮同列，位于其下方） ──
h = h.replace(
`  <div style="display:flex;justify-content:space-between;align-items:flex-end;padding:16px 24px;background:rgba(0,0,0,0.4);border-top:1px solid #1e2030">
    <div id="menu-version" style="font-size:9px;color:#333;letter-spacing:1px"></div>
    <button class="btn primary" id="btn-start" style="font-size:16px;padding:12px 34px;letter-spacing:2px;box-shadow:0 0 20px #fd44">⚔ 开始游戏</button>
  </div>`,
`  <div style="display:flex;justify-content:flex-end;align-items:flex-end;padding:16px 24px;background:rgba(0,0,0,0.4);border-top:1px solid #1e2030">
    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
      <button class="btn primary" id="btn-start" style="font-size:16px;padding:12px 34px;letter-spacing:2px;box-shadow:0 0 20px #fd44">⚔ 开始游戏</button>
      <div id="menu-version" style="font-size:9px;color:#444;letter-spacing:1px;text-align:right"></div>
    </div>
  </div>`
);

// ── 5. 设置：主题切换按钮 ──
h = h.replace(
`    <div class="setting-row">
      <span id="lbl-lang">🌐 语言 / Language</span>
      <button id="lang-toggle" class="btn" style="padding:4px 14px;font-size:11px">English</button>
    </div>
    <hr style="border:0;border-top:1px solid #222;margin:12px 0">`,
`    <div class="setting-row">
      <span id="lbl-lang">🌐 语言 / Language</span>
      <button id="lang-toggle" class="btn" style="padding:4px 14px;font-size:11px">English</button>
    </div>
    <div class="setting-row">
      <span>🎨 背景主题</span>
      <button id="theme-toggle" class="btn" style="padding:4px 14px;font-size:11px">☀️ 白色</button>
    </div>
    <hr style="border:0;border-top:1px solid #222;margin:12px 0">`
);

// ── 6. 主题 JS（在 SFX toggle 之后插入） ──
h = h.replace(
`// SFX toggle listener
document.getElementById('tog-sfx').addEventListener('click',()=>{
  settings.sfx=!settings.sfx;
  document.getElementById('tog-sfx').classList.toggle('on',settings.sfx);
});`,
`// SFX toggle listener
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
})();`
);

fs.writeFileSync('index.html', h, 'utf8');
console.log('Done. Size:', h.length);
