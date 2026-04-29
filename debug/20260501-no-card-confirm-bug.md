# Bug Report：豪華版冇揀卡牌時核對冇反應

## 📋 基本資料
- **Repo**：`/Users/zachli/square-bun/`
- **URL**：`https://ai-lish.github.io/square-bun/deluxe.html`
- **當前 commit**：`dfc0223`
- **優先順序**：🔴 高

---

## 🔍 問題描述
玩家喺 `dice-rolled` phase 完全唔揀任何卡牌，直接撳「✓ 核對」，游戲完全冇反應（冇 Flash、冇 phase 改變、冇 error）。

---

## 📁 關鍵檔案

### 1. `game.js`（`deluxe.html` 和 `practice.html` 都用）
- **位置**：Line ~410 `confirmPicks()`
- **邏輯**：
  - `if(selected.size>0)` → 正常處理選擇（flip 卡、評分等）
  - `else` 分支（Line ~520）「No cards selected」→ `phase='result'` + `showFlash('skip')` + 清骰仔 + 讓玩家再擲

### 2. `deluxe.js`（`deluxe.html` 專用，喺 `game.js` 之後載入）
- **位置**：Line ~237-291 `confirmPicks` wrapper
- **邏輯**：
  ```javascript
  const _confirmPicks = confirmPicks;  // 儲存原本遊戲邏輯
  confirmPicks = function() {
    const prePhase = phase;
    const preSelectedSize = selected.size;
    const preSuccessCount = successCount;

    // 0 cards → skip branch: re-roll instead of penalty
    if (preSelectedSize === 0) {
      phase = 'result';
      // ... 清骰仔、showFlash、set phase='open' ...
      playSkip();
      resetCombo();
      stats.skipCount++;
      checkAchievements();
      return;
    }

    _confirmPicks();  // 調用原本遊戲邏輯
    // ... 後續 wrapper 邏輯 ...
  };
  ```

### 3. `deluxe.html`（豪華版主頁）
- **Script 加載順序**（Line ~671-673）：
  ```html
  <script>var CARD_RANGE=20;</script>
  <script src="game.js"></script>
  <script src="deluxe.js"></script>
  ```

---

## 🧪 已做過嘅測試（Browser Automation）

| 測試 | 結果 |
|------|------|
| `phase === 'dice-rolled'` | ✅ 確認 |
| `selected.size === 0` | ✅ 確認 |
| `window.confirmPicks()` 直接調用 | ❌ phase 仍係 `dice-rolled` |
| fetch `/square-bun/deluxe.js` | ✅ 新版（有 `preSelectedSize === 0` block）|
| fetch `/square-bun/game.js` | ✅ 有 `else` 分支 |

---

## 🔬 懷疑方向（需要確認）

### 方向 1：`deluxe.js` wrapper 的 `_confirmPicks` 綁定問題
`const _confirmPicks = confirmPicks` 係喺 `deluxe.js` 加載時執行，呢個時候 `confirmPicks` 可能仲未完全初始化？

**驗證方法**：
```javascript
// 喺 browser console 執行
window._confirmPicks.toString().slice(0, 100)
// 如果有輸出，_confirmPicks 存在
```

### 方向 2：`playSkip()` / `resetCombo()` / `checkAchievements()` 拋 exception
wrapper 入面呢啲函數可能拋出 exception，導致 `phase='result'` 未執行到但 exception 被 onclick handler 吞咗。

**驗證方法**：
```javascript
// 喺 browser console 執行
window.confirmPicks = function() {
  const preSelectedSize = selected.size;
  if (preSelectedSize === 0) {
    console.log('ENTERED 0-card branch');
    try {
      phase = 'result';
      document.getElementById('btn-dice').disabled = true;
      console.log('phase set to result');
    } catch(e) {
      console.error('ERROR:', e);
    }
    return;
  }
};
```

### 方向 3：Browser 快取舊 JS
fetch 確認係新版，但 browser 可能跑緊 cache 入面嘅舊版。

**驗證方法**：
- Chrome DevTools → Network → Disable cache（確保打晒 ✅）
- Hard refresh：`Cmd+Shift+R`

---

## 🐛 需要 Copilot Agent 幫手確認嘅嘢

### Step 1：確認 `game.js` 源代碼
請檢查 `/Users/zachli/square-bun/game.js` line ~410-550：

1. `confirmPicks()` 函數完整內容
2. 特別係 `if(selected.size>0)` 之後有冇 `else` 分支
3. `else` 分支入面 `phase='result'` 有冇被執行到

### Step 2：確認 `deluxe.js` wrapper
請檢查 `/Users/zachli/square-bun/deluxe.js` line ~237-300：

1. `if(preSelectedSize === 0)` block 係咪喺 `_confirmPicks()` 調用**之前**
2. 呢個 block 入面有冇 `return`（確保 `_confirmPicks()` 唔會再執行一次）
3. `playSkip()`, `resetCombo()`, `checkAchievements()` 呢啲函數係咪存在

### Step 3：browser DevTools 單步調試
喺 Chrome 打開 `https://ai-lish.github.io/square-bun/deluxe.html`：

1. Hard refresh (`Cmd+Shift+R`)
2. 進入游戲，開卡，擲骰，到 `dice-rolled` phase
3. **唔好揀任何卡牌**
4. Chrome DevTools → Sources →搵 `deluxe.js`，喺 `confirmPicks` wrapper 內打斷點
5. 撳「✓ 核對」
6. 確認有冇進入 `if(preSelectedSize === 0)` block
7. 如果有，確認 `phase='result'` 有冇執行

### Step 4：嘗試修復
如果確認問題喺 `deluxe.js` wrapper，嘗試修改 `/Users/zachli/square-bun/deluxe.js`：

```javascript
// 將 if(preSelectedSize === 0) block 移到 _confirmPicks() 調用之前
// 並確保有 return
confirmPicks = function() {
  const prePhase = phase;
  const preSelectedSize = selected.size;
  const preSuccessCount = successCount;

  // 0 cards → skip branch
  if (preSelectedSize === 0) {
    phase = 'result';
    document.getElementById('btn-dice').disabled = true;
    document.getElementById('btn-dice').className = 'btn btn-ghost';
    setTimeout(() => {
      showFlash('skip', '⏭️ 冇夾到！');
      dice = [null, null];
      renderDiceSVG(document.getElementById('dice1'), 0);
      renderDiceSVG(document.getElementById('dice2'), 0);
      phase = 'open';
      document.getElementById('btn-dice').disabled = true;
      setTimeout(() => {
        if (phase === 'open') {
          document.getElementById('btn-dice').disabled = false;
          document.getElementById('btn-dice').className = 'btn btn-green';
        }
      }, 1500);
      document.getElementById('target-badge').textContent = '開卡後擲骰';
      document.getElementById('target-badge').className = 'target-badge disabled';
      document.getElementById('cards-grid').classList.remove('dice-rolled');
      updateConfirmBtn();
      setTimeout(() => {
        renderCards(false);
        setStatus('揀啱就核對，或直接核對跳過', '');
      }, 500);
    }, 800);
    playSkip();
    resetCombo();
    stats.skipCount++;
    checkAchievements();
    return;  // ⬅️ 確保 return，_confirmPicks() 不會執行
  }

  _confirmPicks();
  // ... rest of wrapper ...
};
```

---

## 📊 預期行為 vs 實際行為

| 步驟 | 預期 | 實際 |
|------|------|------|
| 1. 冇揀卡，撳核對 | `phase='result'`，status bar 顯示 ⏭️ Flash | 完全冇反應 |
| 2. | 骰仔清除為空白 | 骰仔不變 |
| 3. | `phase='open'` | `phase` 仍係 `dice-rolled` |
| 4. | 1.5秒後 🎲 按鈕變綠可再擲 | 🎲 按鈕維持原樣 |

---

## 📝 附加資料

### 測試用遊戲狀態
- 桌面卡數：4
- Phase：`dice-rolled`
- `selected.size`：0
- 骰子：任意（例如 3 和 5）
- 按鈕狀態：🎲 可用，✓ 核對可用

### 正常流程（practice.html）
`practice.html` 冇 `deluxe.js`，直接用 `game.js` 嘅 `confirmPicks`，`else` 分支正常運作。
