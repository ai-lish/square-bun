# 豪華版 Browser 測試問題記錄

**日期：** 2026-04-25
**測試版本：** `0e3cdfa`（feat/level-progression 已 merge）
**測試 URL：** https://ai-lish.github.io/square-bun/deluxe.html?v=5

---

## ✅ 已確認正常功能

| 功能 | 狀態 | 備註 |
|------|------|------|
| Lv.1 badge 顯示 | ✅ PASS | 遊戲開始後出現在標題旁 |
| 卡牌範圍 1-20 | ✅ PASS | 見到卡牌 6, 17, 1, 2（全部 ≤20） |
| 🔓 開卡按鈕 | ✅ PASS | 逐張揭開卡牌正常 |
| 🎲 擲骰按鈕 | ✅ PASS | 所有卡揭開後可按，顯示「可被 X 或 Y 整除」 |
| 因數圈顯示 | ✅ PASS | 揭卡後顯示因數圈（1, 2, 3, 6） |
| ✓ 核對按鈕 | ✅ PASS | 擲骰後啟用 |
| 🔤 平方包按鈕 | ✅ PASS | 部分disabled狀態正確 |

---

## 🔴 需要修復的問題

### Issue #1：`📚 0/20/0/20` 顯示格式錯誤

**描述：** 右上角 📚 按鈕顯示 `📚 0/20/0/20`，重複咗 twice。

**預期：** `📚 0/20` 或 `📚 0/20（成功率：—）`

**實際：** `📚 0/20/0/20`

**嚴重程度：** 中

**懷疑原因：** `updateCollectionBadge()` 可能用錯格式字符串，多餘咗一節。

**代碼位置（猜測）：** `deluxe.js` 中 `updateCollectionBadge()` 函數

**測試方法：**
```javascript
// 在 browser console 檢查
document.getElementById('coll-count').textContent
// 或
document.querySelector('.coll-btn').textContent
```

---

### Issue #2：browser console 無法讀取遊戲狀態變量

**描述：** 嘗試在 browser console 注射 `window.dice` 返回 `null`。遊戲變量可能唔喺 `window` 作用域。

**影響：** 無法用 JS injection 做自動化測試（只能靠視覺截圖判斷）。

**嚴重程度：** 低（唔影響玩家體驗，只影響 AI 測試）

**懷疑原因：** `game.js` 使用 `const/let` 宣告變量，唔會自動成為 `window` 屬性。

**建議：** 在 `game.js` 關鍵變量加 `window.` 前綴方便調試，或在 browser console 提供 `window._sb` 暴露內部狀態：

```javascript
// 建議加喺 game.js 底部
window._sb = {
  get dice() { return dice; },
  get table() { return table; },
  get selected() { return selected; },
  get collected() { return collected; },
  get currentLevel() { return currentLevel; },
  get successCount() { return successCount; },
  get attemptCount() { return attemptCount; },
  get winStreak() { return winStreak; },
  get CARD_RANGE() { return CARD_RANGE; }
};
```

---

### Issue #3：Level Summary Popup 未測試

**描述：** 由於需要收集 20 種不同卡牌才能觸發 popup，browser testing 未能完整驗證以下場景：

- 收集完 20 種卡後 popup 正確彈出
- 🔓「開放更大範圍」按鈕 → collected 保留，範圍變 1-100
- 🔄「繼續遊玩」按鈕 → collected 保留，範圍不變
- 🗑️「重置進度」按鈕 → collected 清空，回到 Lv.1

**建議：** 通過 localStorage injection 模擬已收集 19/20 張卡，快速觸發 popup。

```javascript
// 模拟收集 19/20
localStorage.setItem('sb_squarebun', JSON.stringify({
  collected: Object.fromEntries([...Array(19).keys()].map(n => [n+1, 1])),
  currentLevel: 1,
  successCount: 10,
  attemptCount: 12,
  winStreak: 3,
  penaltySet: []
}));
// 刷新頁面，再收集一張正確卡就會觸發 popup
```

---

### Issue #4：因數圈顏色邏輯未完整驗證

**描述：** 測試時骰仔為 [3, 5]，但桌面卡牌更換咗（從 6, 17, 1, 2 變成 8, 10, 9, 16），無法確認因數圈顏色邏輯是否正確（`dice.includes(f)`）。

**需要驗證：** 骰仔 [X, Y]，某卡因數 f，f 必須係 `dice.includes(f)` 先顯示綠色。

**測試方法：** 需要控制骰仔值或觀察特定卡牌（如卡 6，因數 1, 2, 3, 6）：
- 若骰仔包含 3 → 因數圈 3 顯示綠色
- 若骰仔唔包含 3 → 因數圈 3 顯示紅色

---

## 🔧 其他觀察

### 觀察 #1：豪華版入口標題正常
- 頁面 `<title>` 顯示 `平方包 - 豪華版` ✅
- 遊戲開始後顯示 `🎯 平方包 Lv.1` ✅

### 觀察 #2：成功率顯示
- 右上角顯示 `— 🔥 0`（成功率未定義，連勝 0）✅ 符合預期

### 觀察 #3：平方包按鈕狀態
- 揭卡時 disabled ✅
- 擲骰後若有平方數可揭開仍 disabled（需手動按 🎤）✅

---

## 📋 優先修復順序

| 優先 | 問題 | 預計時間 |
|------|------|----------|
| P1 | Issue #1：`📚` 顯示格式 | 5 min |
| P2 | Issue #3：Level Summary Popup 測試 | 需localStorage injection |
| P3 | Issue #4：因數圈顏色邏輯驗證 | 需特殊測試方法 |
| P4 | Issue #2：`window._sb` 調試工具（可選）| 10 min |
