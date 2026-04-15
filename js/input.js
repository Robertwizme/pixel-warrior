'use strict';

// ── iOS button touch fix ──
// iOS Safari sometimes doesn't fire click on buttons inside overlays.
// Use touchend delegation to guarantee button response on all mobile browsers.
if ('ontouchstart' in window) {
  let _tapX = 0, _tapY = 0;
  document.addEventListener('touchstart', function(e){
    _tapX = e.touches[0].clientX; _tapY = e.touches[0].clientY;
  }, {passive:true});
  document.addEventListener('touchend', function(e){
    const touch = e.changedTouches[0];
    if (!touch) return;
    if (Math.abs(touch.clientX - _tapX) > 10 || Math.abs(touch.clientY - _tapY) > 10) return;
    const btn = e.target.closest('button');
    if (!btn || btn.disabled) return;
    const overlay = btn.closest('.overlay.active, #menu-topbar');
    if (!overlay) return;
    e.preventDefault();
    btn.dispatchEvent(new MouseEvent('click', {bubbles:true, cancelable:true, view:window}));
  }, {passive:false});
}

// ── 横屏全屏 ──
function _requestFullscreen() {
  const el = document.documentElement;
  const req = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
  if (req && !document.fullscreenElement && !document.webkitFullscreenElement) {
    req.call(el).catch(()=>{});
  }
}
function _checkLandscapeFullscreen() {
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || window.innerWidth <= 900;
  const isLandscape = window.innerWidth > window.innerHeight;
  if (isMobile && isLandscape) _requestFullscreen();
}
// 横屏时自动全屏；用户第一次触摸时也尝试（浏览器需要手势触发）
if (screen.orientation) screen.orientation.addEventListener('change', _checkLandscapeFullscreen);
window.addEventListener('orientationchange', _checkLandscapeFullscreen);
window.addEventListener('resize', _checkLandscapeFullscreen);
document.addEventListener('touchstart', _checkLandscapeFullscreen, {passive:true, once:false});

// ── 旋转提示（手机直屏时显示）──
// 只对触摸设备生效；同时兼容 iOS Safari（含旧版）和 Android Chrome
const _rotateHint = document.getElementById('rotate-hint');
function _updateRotateHint() {
  if (!_rotateHint) return;
  // 非触摸设备（桌面）直接隐藏，避免桌面竖窗误触发
  if (!('ontouchstart' in window)) { _rotateHint.style.display = 'none'; return; }
  // 多方法判断竖屏，按优先级：
  // 1. screen.orientation.type（Chrome/Firefox/iOS 16.4+）
  // 2. window.orientation（已废弃但 iOS 全版本可用：0/180=竖，±90=横）
  // 3. matchMedia fallback（Safari 9+）
  // 4. innerWidth/innerHeight 最终兜底
  let _portrait;
  try {
    if (screen.orientation && screen.orientation.type) {
      _portrait = screen.orientation.type.startsWith('portrait');
    } else if (typeof window.orientation !== 'undefined') {
      _portrait = (window.orientation === 0 || window.orientation === 180);
    } else {
      _portrait = window.matchMedia('(orientation:portrait)').matches;
    }
  } catch(_e) {
    _portrait = window.innerHeight > window.innerWidth;
  }
  _rotateHint.style.display = _portrait ? 'flex' : 'none';
}
// 监听所有方向变化事件（三重保险，覆盖 iOS/Android 所有版本）
if (screen.orientation) screen.orientation.addEventListener('change', _updateRotateHint);
window.addEventListener('orientationchange', _updateRotateHint);
// matchMedia change listener（iOS 13 以下无 screen.orientation，此路为主力）
(function(){
  const _mql = window.matchMedia('(orientation:portrait)');
  const _fn = function(e){ if ('ontouchstart' in window) _updateRotateHint(); };
  if (_mql.addEventListener) _mql.addEventListener('change', _fn);
  else if (_mql.addListener) _mql.addListener(_fn); // iOS ≤ 12 compat
})();
// 页面加载完毕后执行初始检测
_updateRotateHint();

// ═══════════════════════════════════════════════════════
// §1  Canvas + resize + input
// ═══════════════════════════════════════════════════════
const canvas = document.getElementById('gc');
const ctx    = canvas.getContext('2d');
const GW = 480, GH = 270;
canvas.width = GW; canvas.height = GH;

function resizeCanvas() {
  const s = Math.min(window.innerWidth/GW, window.innerHeight/GH);
  canvas.style.width  = (GW*s)+'px';
  canvas.style.height = (GH*s)+'px';
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const keys = {};
window.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

// ── Mobile touch controls ──
const _joyZone  = document.getElementById('joy-zone');
const _joyStick = document.getElementById('joy-stick');
const _joyBg    = document.getElementById('joy-bg');
const _skillBtn = document.getElementById('skill-btn');
let _joyTouchId = null;
const JOY_R = 36;

function _setMobileVisible(v) {
  _joyZone.style.display  = v ? 'block' : 'none';
  _skillBtn.style.display = v ? 'flex'  : 'none';
}

function _updateJoy(touch) {
  const r = _joyBg.getBoundingClientRect();
  const cx = r.left + r.width/2, cy = r.top + r.height/2;
  let dx = touch.clientX - cx, dy = touch.clientY - cy;
  const d = Math.sqrt(dx*dx+dy*dy);
  if (d > JOY_R) { dx = dx/d*JOY_R; dy = dy/d*JOY_R; }
  _joyStick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  const t = JOY_R * 0.28;
  keys['KeyW'] = keys['ArrowUp']    = dy < -t;
  keys['KeyS'] = keys['ArrowDown']  = dy >  t;
  keys['KeyA'] = keys['ArrowLeft']  = dx < -t;
  keys['KeyD'] = keys['ArrowRight'] = dx >  t;
}

function _clearJoy() {
  _joyTouchId = null;
  _joyStick.style.transform = 'translate(-50%,-50%)';
  keys['KeyW']=keys['KeyS']=keys['KeyA']=keys['KeyD']=false;
  keys['ArrowUp']=keys['ArrowDown']=keys['ArrowLeft']=keys['ArrowRight']=false;
}

_joyZone.addEventListener('touchstart', e => {
  e.preventDefault();
  if (_joyTouchId == null) { _joyTouchId = e.changedTouches[0].identifier; _updateJoy(e.changedTouches[0]); }
}, { passive:false });
_joyZone.addEventListener('touchmove', e => {
  e.preventDefault();
  for (const t of e.changedTouches) if (t.identifier === _joyTouchId) { _updateJoy(t); break; }
}, { passive:false });
_joyZone.addEventListener('touchend',   e => { e.preventDefault(); _clearJoy(); }, { passive:false });
_joyZone.addEventListener('touchcancel',e => { e.preventDefault(); _clearJoy(); }, { passive:false });

_skillBtn.addEventListener('touchstart', e => { e.preventDefault(); keys['Space']=true;  _skillBtn.classList.add('pressing'); },    { passive:false });
_skillBtn.addEventListener('touchend',   e => { e.preventDefault(); keys['Space']=false; _skillBtn.classList.remove('pressing'); }, { passive:false });
_skillBtn.addEventListener('touchcancel',e => { e.preventDefault(); keys['Space']=false; _skillBtn.classList.remove('pressing'); }, { passive:false });

// Only show joystick on touch-primary devices (phones/tablets), NOT on desktop with mouse
const _isTouchDevice = window.matchMedia('(pointer:coarse)').matches;
// _setMobileVisible called during gameplay only

