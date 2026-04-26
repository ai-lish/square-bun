# 豪華版 Browser 測試問題記錄

**日期：** 2026-04-25
**測試版本：** `0e3cdfa` → `b4e2578` → `1bcb263` → `f2c5e2d`（Issue #4 修復）→ `183b4c1`（清理 node_modules）
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
| `window._sb` 調試工具 | ✅ PASS | 大佬已加入 `checkLevelCompletion()` 內 |
| 📚 Badge 格式 | ✅ PASS | `📚 20/20` / `📚 20/100` 正確顯示 |
| Level Summary Popup 內容 | ✅ PASS | `🎉 完成！ 1-20 全部收集！ 成功率 85% 已收集 20/20` |
| 🔓 開放更大範圍 | ✅ PASS | collected=20, level=2, max=100, 新卡 1-100 |
| 🔄 繼續遊玩 | ✅ PASS | collected=20, level=1, max=20, stats 全保留 |
| 🗑️ 重置進度 | ✅ PASS | collected=0, level=1, stats=0, localStorage=null |

---

## 🔴 需要修復的問題

### Issue #1：`📚 X/Y/X/Y` 顯示格式錯誤 ✅ 已修復 + 已驗證

**描述：** 右上角 📚 按鈕顯示 `📚 X/Y/X/Y`，`coll-count` 和 `coll-progress-text` 都包含 `X/Y`。

**根因：** 兩個函數同時更新同一個格式：

1. `updateCollectionBadge()` 將 `coll-count` 設為 `X/Y`（錯誤）
2. `updateLevelBadge()` 將 `coll-progress-text` 設為 `X/Y`（錯誤）

**修復（commit `b4e2578` + `1bcb263`）：**
- `updateCollectionBadge()`：`coll-count = X`，`coll-progress-text = Y`（分開）
- `updateLevelBadge()`：只更新 level badge，移除 `coll-progress-text` 更新

**修復後預期：** `📚 X/Y`（coll-count=X，coll-progress-text=Y）

**驗證結果（v4 CDN）：**
| 場景 | coll-count | coll-progress-text | 按鈕顯示 |
|------|-----------|-------------------|---------|
| Lv.1 collected=20 | `20` | `20` | `📚 20/20` ✅ |
| Lv.2 collected=20 | `20` | `100` | `📚 20/100` ✅ |
| 初始 | `0` | `20` | `📚 0/20` ✅ |

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

### Issue #3：Level Summary Popup ✅ 已完整測試

**測試方法：** 使用 `window._sb` 調試工具（`checkLevelCompletion()`）直接觸發 popup。

**測試結果：**

#### 🎯 T2: Popup 內容驗證
| 元素 | 預期值 | 實際值 | 狀態 |
|------|--------|--------|------|
| Popup display | flex | flex | ✅ |
| summary-range | 1-20 | 1-20 | ✅ |
| summary-rate | 85% | 85% | ✅ |
| summary-collected | 20/20 | 20/20 | ✅ |
| expand-btn | 🔓 開放更大範圍（1-100） | 🔓 開放更大範圍（1-100） | ✅ |
| next-range | 1-100 | 1-100 | ✅ |

#### 🎯 T3: 🔄 繼續遊玩（保持 1-20）
| 狀態 | 點擊前 | 點擊後 | 預期 |
|------|--------|--------|------|
| collected.size | 20 | 20 | ✅ 保留 |
| currentLevel | 1 | 1 | ✅ 不變 |
| lvlMax | 20 | 20 | ✅ 保持 1-20 |
| successCount | 17 | 17 | ✅ 保留 |
| winStreak | 5 | 5 | ✅ 保留 |
| popupDisplay | flex | none | ✅ 已關閉 |

#### 🎯 T4: 🗑️ 重置進度
| 狀態 | 點擊前 | 點擊後 | 預期 |
|------|--------|--------|------|
| collected.size | 20 | 0 | ✅ 完全清除 |
| currentLevel | 1 | 1 | ✅ 回 Lv.1 |
| successCount | 17 | 0 | ✅ 完全清除 |
| attemptCount | 20 | 0 | ✅ 完全清除 |
| winStreak | 5 | 0 | ✅ 完全清除 |
| localStorage | collected=... | null, null | ✅ 完全清除 |
| popupDisplay | flex | none | ✅ 已關閉 |

#### 🎯 T5: 🔓 開放更大範圍（1-100）
| 狀態 | 點擊前 | 點擊後 | 預期 |
|------|--------|--------|------|
| collected.size | 20 | 20 | ✅ 完整保留 |
| currentLevel | 1 | 2 | ✅ Lv.2 |
| lvlMax | 20 | 100 | ✅ 擴大到 1-100 |
| collBtn | 📚 20/20 | 📚 20/100 | ✅ 動態更新 |
| levelBadge | Lv.1 | Lv.2 | ✅ |
| tableCards | — | [37, 81, 13, 75] | ✅ 新卡 1-100 |
| popupDisplay | flex | none | ✅ 已關閉 |

---

### Issue #4：✓ 核對 按鈕完全無反應（Button ReferenceError）🔴 ✅ 已修復

**描述：** 點擊 ✓ 核對 按鈕後完全冇反應，遊戲狀態（attemptCount, collected）冇任何變化。

**根因：** deluxe.js 仍然引用 `score` 變量，但 Level Progression PR 已將 `score` 移除，改為 `successCount` + `attemptCount` + `winStreak`。

**出錯位置：** `deluxe.js` 的 `confirmPicks` wrapper 內：
```javascript
// BEFORE (BROKEN):
const preScore = score;            // ReferenceError: score is not defined
const scoreDiff = score - preScore; // ReferenceError
if (scoreDiff > 0) { ... }         // scoreDiff undefined
```

**修復（commit `f2c5e2d`）：**
```javascript
// AFTER (FIXED):
const preSuccessCount = successCount;
const successDiff = successCount - preSuccessCount; // each correct = +1
if (successDiff > 0) { ... }
```

**其他修復：**
- `stats.totalScore = score;` → `stats.totalScore = successCount;`
- `stats.maxRoundScore = Math.max(..., scoreDiff)` → `Math.max(..., 1)`
- `score_50` 成就描述：`總得分` → `成功次數`

**驗證：** 等 GitHub Pages deploy 後重新測試 ✓ 核對 按鈕。

---

### Issue #5：因數圈顏色邏輯未完整驗證

**描述：** 測試時骰仔為 [3, 5]，但桌面卡牌更換咗，無法確認因數圈顏色邏輯是否正確（`dice.includes(f)`）。

**需要驗證：** 骰仔 [X, Y]，某卡因數 f，f 必須係 `dice.includes(f)` 先顯示綠色。

**測試方法：** 需要控制骰仔值或觀察特定卡牌（如卡 6，因數 1, 2, 3, 6）：
- 若骰仔包含 3 → 因數圈 3 顯示綠色
- 若骰仔唔包含 3 → 因數圈 3 顯示紅色

---

### Issue #6：冇揀任何卡時 ✓ 核對 完全無反應 🔴 未修復

**描述：** 擲骰後（骰仔 2, 3），冇揀任何卡，點擊 ✓ 核對，嘗試計數和连胜均無變化。

**根因：** `game.js` 第 383 行：
```javascript
if(selected.size>0){
  // ... evaluate picks ...
}
// ❌ 當 selected.size === 0，整個 block 被跳過，函數直接結束！
```

**實際行為：** 點擊 ✓ 核對後，按鈕變 disabled，但冇任何 stats 更新、冇 status message、冇 UI 反饋。

**預期行為：** 冇揀任何卡 → 應該視為「跳過」，結算統計：
- 若桌上有目標卡（可被骰仔整除）→ 算答錯，`attemptCount++`, `winStreak=0`
- 若桌上冇目標卡 → 正確跳過，遊戲繼續

**修復方向：** 在 `if(selected.size>0)` 後加上 `else` 分支：
```javascript
if(selected.size>0){
  // existing logic
}else{
  // 計算桌上是否有目標卡
  const targets = getTargetSet();
  if(targets.size > 0){
    // 有目標卡但冇揀 → 答錯
    wrongCards = Array.from(selected); // empty, but signals wrong
    attemptCount++; winStreak=0;
    setStatus('✗ 跳過了目標卡！', '');
  }else{
    // 冇目標卡 → 正確跳過
    setStatus('✓ 跳過（冇目標卡）', '');
  }
  phase='reveal';
  document.getElementById('continue-zone').classList.add('show');
  document.getElementById('btn-confirm').disabled=true;
  setTimeout(handleContinue, 500);
}
```

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

| 優先 | 問題 | 狀態 |
|------|------|------|
| P1 | Issue #1：`📚` 顯示格式 | ✅ 已修復 + 已驗證 |
| P2 | Issue #3：Level Summary Popup 測試 | ✅ 已完整測試（全部通過）|
| P3 | Issue #4：✓ 核對 按鈕 ReferenceError | ✅ 已修復 `f2c5e2d` |
| P4 | Issue #6：冇揀卡時 ✓ 核對 無反應 | 🔴 未修復（需加 `else` 分支）|
| P5 | Issue #5：因數圈顏色邏輯驗證 | ⚠️ 未驗證 |
| P6 | Issue #2：`window._sb` 調試工具 | ✅ 已存在 |
