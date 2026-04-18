# pixel-rpg-idle 專案說明（主 Session · 項目大腦）

## Session 分工

| Session | 負責檔案 | 觸發時機 |
|---|---|---|
| 🧠 **主 Session**（本檔） | `CLAUDE.md` | 架構規劃、模組協調、跨模組設計審核 |
| 🎨 **UI Session** | `css/style.css`、`index.html` | 面板佈局、字體、響應式、手機適配 |
| ⚔️ **遊戲邏輯 Session** | `js/game.js`（全部） | 武器、傷害、碰撞、特效、怪物行為、波次設計、生成邏輯 |
| 💾 **數據 Session** | `js/data.js`、`js/save.js` | 數值調整、新武器/天賦/補給定義、存檔 |
| 🎰 **社交/功能 Session** | `js/chat.js`、`js/ui.js` | 圖鑑、抽獎、聊天、好友、郵箱、升級畫面 |
| 🐛 **Bug Session** | 哪裡壞了修哪裡 | 開頭貼：錯誤訊息 + 哪個檔案 + 預期行為 |

> **跨模組原則**：`game.js` 是唯一中心 hub，其他 Session 修改若涉及 `game.js` 介面變動，需先在主 Session 確認邊界再執行。

---

# pixel-rpg-idle 專案說明
像素風 RPG 肉鴿遊戲，單頁 Web Game，部署在 Render。

---

## 檔案結構與模組職責

### 載入順序（index.html script 標籤順序）
```
data.js → audio.js → input.js → save.js → game.js → ui.js → chat.js → main.js
```

### 各模組職責

| 檔案 | 職責 | 對外暴露 |
|---|---|---|
| `data.js` | 常數、武器/怪物/角色定義、圖片預載、CHANGELOG | `WEAPON_DEFS`, `ENEMY_TYPES`, `CLASSES`, `STAT_UPGRADES`, `BOSS_WAVES`, `IMG_*`, `CHANGELOG`, `GAME_VERSION` |
| `audio.js` | Web Audio API 音樂/音效合成 | `SFX.play(name)`, `startMusic()`, `stopMusic()` |
| `input.js` | Canvas 尺寸、鍵盤/搖桿輸入 | `canvas`, `ctx`, `GW`, `GH`, `keys`, `_isTouchDevice` |
| `save.js` | localStorage 存檔：金幣/解鎖/成就/最佳紀錄 | `getCoins()`, `addCoins()`, `spendCoins()`, `isUnlocked()`, `unlockClass()`, `calcCoinsEarned()`, `loadBest()`, `saveBest()`, `renderMenuCoins()` |
| `game.js` | 遊戲核心：狀態機、物理、AI、戰鬥、渲染 | `gs`, `cam`, `settings`, `initGame()`, `gameLoop()`, `startWave()`, `addWeapon()`, `healPlayer()`, `awardXp()`, `addFloatingText()`, `spawnParticles()`, `triggerExplosion()`, `nearestEnemy()`, `hitEnemy()`, `render()` |
| `ui.js` | Overlay 管理、HUD、升級/關卡畫面、商店 | `showOverlay()`, `showUpgradeScreen()`, `applyUpgrade()`, `applyUpgradeEffect()`, `updateHUD()`, `showDeadScreen()`, `showGameScreen()`, `getUpgradeOptions()`, `shuffled()` |
| `chat.js` | Firebase 聊天、玩家 ID、圖鑑 | `getPlayerId()`, `openCodex()`, `renderCodexContent()`, `_CODEX_WEAPON_META`, `_CODEX_ENEMY_META` |
| `main.js` | 啟動流程、多語言 | `T(key)`, `applyLang()`, `UI_STRINGS` |

---

## 模組依賴關係

```
main.js
  └─ 依賴 settings(game.js), SFX(audio.js), 所有 DOM overlay

game.js  ←─── 核心 hub
  ├─ ui.js 直接讀取 gs，呼叫 addWeapon/applyUpgrade
  ├─ save.js 在 kill/game-over 時呼叫 addCoins/saveBest
  └─ audio.js SFX.play() 廣泛呼叫

ui.js
  ├─ 讀取 gs (game.js)
  ├─ 呼叫 game.js: addWeapon(), startWave(), healPlayer()
  └─ 呼叫 save.js: renderMenuCoins()

chat.js  （大部分自包含）
  └─ 讀取 gs 取得當前波次/角色資訊
```

---

## 關鍵資料結構

### gs（遊戲狀態，game.js）
```js
gs = {
  phase: 'playing'|'upgrading'|'dead'|'victory',
  player: { hp, maxHp, spd, level, xp, dmgMult, ... },
  weapons: [ { id, level, timer, ... } ],
  enemies: [], projectiles: [], particles: [],
  turrets: [], healTurrets: [], kamikazeBots: [], minigunTurrets: [],
  mines: [], gems: [], drops: [], floatingTexts: [],
  wave: { num, total, spawnQueue, timer, ... },
}
```

### WEAPON_DEFS（data.js）
```js
WEAPON_DEFS[id] = {
  name, icon, maxLv, type, wepCat,  // type: 'normal'|'drone'|'summon'|'turret'
  levels: [ {dmg, cd, range, ...} × maxLv ],
  describe: (lv) => string,         // 顯示於升級卡片
  fire: (w, stats, p) => void,      // 僅 normal/drone 有
}
```

### 武器升級卡片（ui.js）
```js
opt = {
  type: 'wepadd'|'wepup'|'stat'|'gun_upgrade'|'drone_upgrade'|
        'sniperup'|'missileup'|'turret_special'|'turret_lv7'|'turret_lv8'|...,
  weapId, icon, name, desc,
  // 各 type 的額外欄位不同
}
```

---

## 新增武器的標準流程

1. **data.js** — 在 `WEAPON_DEFS` 加入定義（`name/icon/maxLv/type/wepCat/levels/describe`）
2. **game.js** — `addWeapon()` 加特殊初始化；`updateWeapons()` 或獨立 `update*()` 函數處理邏輯；`render()` 加繪製
3. **ui.js** — `getUpgradeOptions()` 加特殊升級卡片邏輯；`applyUpgradeEffect()` 加對應 case
4. **chat.js** — `_CODEX_WEAPON_META` 加圖鑑條目
5. **data.js** CHANGELOG 版本遞增

---

## 新增怪物的標準流程

1. **data.js** — `ENEMY_TYPES[id]` 加定義；`getWavePlan()` 加入出現波次
2. **game.js** — `spawnEnemy()` / `updateEnemies()` 若有特殊 AI 需加分支
3. **chat.js** — `_CODEX_ENEMY_META` 加圖鑑條目

---

## 開發原則
- 每次只修改相關檔案，不動其他檔案
- 改數值優先改 `data.js`
- 改 UI 優先改 `ui.js` + `style.css`
- 武器升級邏輯分工：`data.js` 定義數值，`ui.js` 定義卡片，`game.js` 定義行為
- 避免在模組間建立新的雙向依賴；`game.js` 是唯一允許被多方讀取的中心

---

## 每次修改完成後（必須執行，不可跳過）
- 在 `js/data.js` 的 CHANGELOG 新增版本記錄
- 版本號遞增
- 新功能加入 `js/chat.js` 的對應圖鑑 Tab
- 以上兩項未完成視為任務未結束
