# Square Bun 豪華版 — 關卡漸進系統提案

**版本：** v1 → v2（更新實作範圍說明，避免混淆）
**日期：** 2026-04-24
**作者：** 小心（Zach 前線助手）

---

## 實作範圍（重要）

**這是一個擴展現有 deluxe.html 的方案，不是新建頁面。**

修改的檔案：
- `deluxe.html` — 新增 Summary Overlay HTML
- `game.js` — 新增 LEVELS 配置、currentLevel 狀態、startRound() 修改、expandRange() / keepPlaying() / resetProgress() 函數
- `deluxe.js` — confirmPicks() 新增完成檢查、showLevelSummaryPopup() 調用

不修改：`practice.html`、`index.html`

---

## 概述

在完成當前範圍所有卡牌收集後，開放新範圍。核心設計：擴大範圍或繼續遊玩均**不重置已收集記錄**。

卡牌範圍逐步擴大：1-20 → 1-100 → 1-200 → 1-500 → 1-1000 → 1-2000。

---

## 關卡設計

| 等級 | 卡牌範圍 | 收集完成條件 |
|------|----------|------------|
| 1 | 1–20 | 收集全部 20 種 |
| 2 | 1–100 | 收集全部 100 種 |
| 3 | 1–200 | 收集全部 200 種 |
| 4 | 1–500 | 收集全部 500 種 |
| 5 | 1–1000 | 收集全部 1000 種 |
| 6 | 1–2000 | 完成終極收集 |

> 每回合仍然只顯示 4 張卡。挑戰來自玩家需要在更大範圍內心算「可被 X 或 Y 整除」。

---

## 完成後流程

完成當前範圍所有卡牌收集後，彈出 Summary popup：

| 按鈕 | 行為 |
|------|------|
| 🔓 開放更大範圍 | 擴大卡牌範圍，已收集記錄**完整保留** |
| 🔄 繼續遊玩 | 保持當前範圍，已收集記錄**完整保留** |
| 🗑️ 重置進度 | 清除所有已收集記錄，從頭開始 |

> 關鍵：擴大範圍不會丟失已收集的卡牌。

---

## 代碼改動說明

### game.js 改動

**1. LEVELS 配置（在文件頂部新增）**
```javascript
const LEVELS = [
  { level: 1, max: 20 },
  { level: 2, max: 100 },
  { level: 3, max: 200 },
  { level: 4, max: 500 },
  { level: 5, max: 1000 },
  { level: 6, max: 2000 },
];
```

**2. currentLevel 狀態（在現有狀態附近新增）**
```javascript
let currentLevel = 1;  // 當前等級（默認 1-20 範圍）
```

**3. startRound() 修改（現有函數需修改一行）**
```javascript
function startRound() {
  // 改：用當前等級的 max 值過濾牌組，不再是固定的 20
  const levelMax = LEVELS[currentLevel - 1].max;
  const baseDeck = ALL_CARDS.filter(c => c.n <= levelMax && !penaltySet.has(c.n));
  deck = shuffle(baseDeck);
  // ... 其餘不變
}
```

**4. 新增函數（放在檔案合適位置）**
```javascript
function expandRange() {
  if (currentLevel < LEVELS.length) {
    currentLevel++;
    document.getElementById('level-summary-overlay').style.display = 'none';
    startRound();
  }
}

function keepPlaying() {
  document.getElementById('level-summary-overlay').style.display = 'none';
  startRound();
}

function resetProgress() {
  collected = new Map();
  penaltySet = new Set();
  successCount = 0;
  attemptCount = 0;
  winStreak = 0;
  currentLevel = 1;
  document.getElementById('level-summary-overlay').style.display = 'none';
  startGame();
}
```

### deluxe.js 改動

**5. confirmPicks() 成功後新增檢查（在一輪正確收取後新增）**
```javascript
// 現有成功邏輯不變 ...
collected.set(n, (collected.get(n) || 0) + 1);
playSound('correct');
spawnParticles(...);

// 【新增】檢查是否完成當前範圍所有卡牌
if (collected.size >= LEVELS[currentLevel - 1].max) {
  showLevelSummaryPopup();
}
```

**6. showLevelSummaryPopup()（新增函數）**
```javascript
function showLevelSummaryPopup() {
  const level = LEVELS[currentLevel - 1];
  const rate = attemptCount > 0 ? Math.round(successCount / attemptCount * 100) : 0;
  document.getElementById('summary-range').textContent = `1-${level.max}`;
  document.getElementById('summary-rate').textContent = `${rate}%`;
  document.getElementById('summary-collected').textContent = `${collected.size}/${level.max}`;
  document.getElementById('next-range').textContent = currentLevel < LEVELS.length
    ? `1-${LEVELS[currentLevel].max}` : 'MAX';
  document.getElementById('current-range').textContent = `1-${level.max}`;
  document.getElementById('level-summary-overlay').style.display = 'flex';
}
```

### deluxe.html 改動

**7. 新增 Summary Overlay（在 body 底部新增）**
```html
<div id="level-summary-overlay" style="display:none; ...">
  <div style="...">
    <h2 style="color:#f5c518;">🎉 <span id="summary-range">1-20</span> 完成！</h2>
    <p>成功率：<span id="summary-rate">85%</span></p>
    <p>已收集：<span id="summary-collected">20/20</span></p>
    <br>
    <button onclick="expandRange()">🔓 開放更大範圍（<span id="next-range">1-100</span>）</button>
    <br><br>
    <button onclick="keepPlaying()">🔄 繼續遊玩（保持 <span id="current-range">1-20</span>）</button>
    <br><br>
    <button onclick="resetProgress()" style="background:#333;">🗑️ 重置進度</button>
  </div>
</div>
```

---

## UI 改動

**右上角進度顯示**（現有 📚 0/20 旁新增等級標示）
```
Lv.1  📚 12/20
```
- 等級跟隨 `currentLevel` 更新
- `📚` 跟隨 `collected.size / LEVELS[currentLevel-1].max` 更新

---

## 持久化（localStorage）

```javascript
// 現有 localStorage 結構無需大改，只需加入 currentLevel
localStorage.setItem('sb_squarebun', JSON.stringify({
  collected: { 1: 2, 4: 1, ... },
  penaltySet: [15, 7],
  currentLevel: 1,      // 【新增】當前等級
  successCount: 18,
  attemptCount: 20,
  winStreak: 12,
}));
```

---

## 風險與測試要點

- **Lv.1 → Lv.2 過渡測試**：小量卡（20→100），快速驗證 collected 保留
- **DOM 元素限制**：每回合只渲染 4 張卡，無論範圍多大 DOM 壓力不變；`ALL_CARDS` 已是數據陣列，無需 DOM 批量建立
- **localStorage 兼容性**：若讀到舊存檔（無 currentLevel），預設為 1（1-20 範圍）
- **Lv.6 完成後**：expandRange() 按鈕不顯示或禁用，提示「已達到最大範圍」

---

## 執行順序建議

1. 先實現 Lv.1 → Lv.2 過渡（最小改動，驗證 collected 保留機制）
2. 再擴展至 Lv.3–Lv.6 等級配置（只需修改 LEVELS 陣列）
3. 最後加入 Summary popup 視覺效果
