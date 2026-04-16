# pixel-rpg-idle 專案說明
像素風 RPG 肉鴿遊戲，單頁 Web Game，部署在 Render。

## 檔案結構
- index.html — HTML骨架
- css/style.css — 樣式
- js/data.js — 資料/常數/怪物/武器定義
- js/audio.js — 音樂/音效
- js/input.js — 輸入/Canvas/搖桿
- js/save.js — 存檔/成就/金幣
- js/game.js — 遊戲核心邏輯
- js/ui.js — UI/Overlay/HUD
- js/chat.js — 聊天/好友/圖鑑
- js/main.js — 初始化/啟動

## 開發原則
- 每次只修改相關檔案，不動其他檔案
- 改數值優先改 data.js
- 改UI優先改 ui.js + style.css

## 每次修改完成後（必須執行，不可跳過）
- 在 js/data.js 的 CHANGELOG 新增版本記錄
- 版本號遞增
- 新功能加入 js/chat.js 的對應圖鑑Tab
- 以上兩項未完成視為任務未結束
