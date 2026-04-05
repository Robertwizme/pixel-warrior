#!/usr/bin/env node
const fs = require('fs'), path = require('path');
const HTML = path.join(__dirname, '..', 'index.html');
let h = fs.readFileSync(HTML, 'utf8'), ok = true;

function rep(a, b, label) {
  if (!h.includes(a)) { console.error('FAIL [' + label + ']\nExpected:\n' + a.slice(0,120)); ok = false; return; }
  h = h.replace(a, b);
  console.log('✓', label);
}

// 1. 删除竖屏遮挡 — 横竖屏都能玩
rep(
`@media screen and (max-width:900px) and (orientation:portrait){
  body::before{content:'请旋转手机为横屏模式';position:fixed;inset:0;background:#0d0d1a;color:#fd4;
    font-size:18px;font-family:"Courier New",monospace;display:flex;align-items:center;justify-content:center;
    z-index:99999;text-align:center;padding:20px;letter-spacing:2px}
  body > *{display:none!important}
  body::before{display:flex!important}
}`,
`/* portrait mode: no longer blocked */`,
'移除竖屏遮挡'
);

// 2. 把头像块 + 旧 topbar div 一起替换成 新topbar（头像作为第一个子元素）
rep(
`  <!-- Player avatar top-left -->
  <div id="menu-player-btn" onclick="openProfile(false)" style="position:absolute;top:14px;left:16px;z-index:10;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px">
    <div id="menu-avatar-icon" style="width:40px;height:40px;border-radius:50%;background:#1a1a2e;border:2px solid #334;display:flex;align-items:center;justify-content:center;font-size:23px">👦</div>
    <div id="menu-level-badge">Lv.1</div>
    <div class="xp-bar"><div id="menu-xp-bar-fill" class="xp-bar-fill" style="width:0%"></div></div>
    <div id="menu-player-name" style="font-size:9px;color:#555;max-width:52px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center"></div>
  </div>

  <!-- Top button bar -->
  <div id="menu-topbar" style="display:flex;justify-content:flex-start;flex-wrap:nowrap;gap:6px;padding:10px 16px 10px 60px;background:rgba(0,0,0,0.4);border-bottom:1px solid #1e2030;overflow-x:auto;-webkit-overflow-scrolling:touch">`,
`  <!-- Top button bar (avatar is first item) -->
  <div id="menu-topbar" style="display:flex;justify-content:flex-start;flex-wrap:nowrap;align-items:center;gap:6px;padding:6px 10px;background:rgba(0,0,0,0.4);border-bottom:1px solid #1e2030;overflow-x:auto;-webkit-overflow-scrolling:touch">
    <div id="menu-player-btn" onclick="openProfile(false)" style="cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:1px;flex-shrink:0;margin-right:6px">
      <div id="menu-avatar-icon" style="width:36px;height:36px;border-radius:50%;background:#1a1a2e;border:2px solid #334;display:flex;align-items:center;justify-content:center;font-size:20px">👦</div>
      <div id="menu-level-badge">Lv.1</div>
      <div class="xp-bar"><div id="menu-xp-bar-fill" class="xp-bar-fill" style="width:0%"></div></div>
      <div id="menu-player-name" style="font-size:9px;color:#555;max-width:52px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center"></div>
    </div>`,
'头像移入顶栏、顶栏 padding 修正'
);

// 3. 响应式：去掉 topbar 的 padding-left offset，去掉头像 top/left override
rep(
  '  #menu-topbar{padding:8px 0 8px 56px !important;gap:4px !important}',
  '  #menu-topbar{padding:5px 8px !important;gap:4px !important}',
  'topbar 响应式 padding'
);
rep(
  '  #menu-player-btn{top:10px !important;left:10px !important}',
  '',
  '移除头像 position override'
);

// 4. 版本号
rep('v0.5.5', 'v0.5.6', 'version');

if (!ok) { console.error('\n❌ failed — NOT writing'); process.exit(1); }
fs.writeFileSync(HTML, h, 'utf8');
console.log('\n✅ Done, size:', fs.statSync(HTML).size);
