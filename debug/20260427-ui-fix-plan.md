# Square Bun UI 改善方案

**日期：** 2026-04-27
**目標：** 修復 deluxe.html UI 重疊問題 + 增強卡牌收藏顯示

---

## 🔴 問題分析

### 問題 1：Header 右側元素過擠

**現有程式碼（deluxe.html line 495-511）：**
```html
<div class="header">
  <div style="display:flex;align-items:center;gap:8px;">
    <div class="header-title">🎯 平方包</div>
    <span id="level-badge">Lv.1</span>
  </div>
  <div style="display:flex; align-items:center; gap:8px;">
    <!-- 7 個元素！ -->
    <div class="combo-display" id="combo-display">...</div>
    <button id="coll-btn">📚 0/20</button>
    <div class="score-badge">—</div>
    <div class="score-badge">🔥 0</div>
    <button class="sound-toggle">🔊</button>
    <button class="rules-btn">📖</button>
  </div>
</div>
```

**問題：**
- 320px 屏幕上 7 個元素 + gap 8px = 起碼 280px
- `combo-display` 初始 `display:none`，出現時突然推開所有元素
- 冇 `min-width` 或 `flex-shrink` 保護

**修復方案：**

```css
/* Header right cluster */
.header-right-cluster {
  display: flex;
  align-items: center;
  gap: 5px;           /* 收窄 gap */
  flex-shrink: 0;     /* 不壓縮 */
  overflow: hidden;   /* 溢出隱藏 */
  max-width: 55vw;    /* 限制最大寬度 */
}

/* Combo display: always in DOM, animate in/out */
.combo-display {
  display: flex !important;   /* 初始存在 */
  opacity: 0;
  transform: scale(0.85);
  transition: opacity 0.25s, transform 0.25s;
  flex-shrink: 0;
  min-width: 44px;
}
.combo-display.active {
  opacity: 1;
  transform: scale(1);
}
```

### 問題 2：Achievement Badge 固定位置可能重疊

**現有（deluxe.html line 72-82）：**
```css
.ach-badge {
  position: fixed;
  top: 20px;
  right: 20px;   /* ❌ 與 header 重疊 */
}
```

**修復方案：移到頁面底部**
```css
.ach-badge {
  top: auto !important;
  bottom: 80px !important;   /* 避開 bottom controls */
  right: 16px !important;
  max-width: 100px;
}
```

---

## 📋 方案 A：UI 重疊修復（CSS-only）

### Step 1：新增 CSS class

在 `deluxe.html` `<style>` 底部（`@media (hover: hover)` 之後）加入：

```css
/* ===== FIX: Header Cluster Overflow ===== */
.header {
  flex-wrap: nowrap !important;
  overflow: hidden;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.header-right-cluster {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
  overflow: hidden;
  max-width: 55vw;
}

/* Combo display: always in DOM, animate in/out */
.combo-display {
  display: flex !important;
  opacity: 0;
  transform: scale(0.85);
  transition: opacity 0.25s, transform 0.25s;
  flex-shrink: 0;
  min-width: 44px;
}
.combo-display.active {
  opacity: 1;
  transform: scale(1);
}

/* Achievement badges: move to bottom-right */
.ach-badge {
  top: auto !important;
  bottom: 80px !important;
  right: 16px !important;
  max-width: 100px;
}

/* Card tooltip: avoid header overlap */
.card-divs-tooltip {
  z-index: 200;
}

/* Score badges: prevent squishing */
.score-badge {
  min-width: 36px;
  flex-shrink: 0;
  text-align: center;
}
#coll-btn {
  flex-shrink: 0;
  min-width: 58px;
}
```

### Step 2：修改 HTML structure

在 `deluxe.html` line 494-512：

**改之前：**
```html
<div class="header">
  <div style="display:flex;align-items:center;gap:8px;"><div class="header-title">🎯 平方包</div><span id="level-badge" style="background:var(--gold);color:white;border-radius:12px;padding:2px 10px;font-size:12px;font-weight:900;">Lv.1</span></div>
  <div style="display:flex; align-items:center; gap:8px;">
    <div class="combo-display" id="combo-display">
      <span class="combo-fire">🔥</span>
      <span class="combo-count" id="combo-count">0</span>
    </div>
    <button id="coll-btn" onclick="openCollection()" style="background:linear-gradient(135deg,#6c5ce7,#a29bfe);border:none;color:white;padding:4px 10px;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(108,92,231,0.3);">📚 <span id="coll-count">0</span>/<span id="coll-progress-text">20</span></button>
    <div class="score-badge" style="border-color:#00c853;color:#00c853;background:#f0fff4;"><span id="success-rate">—</span></div>
    <div class="score-badge" style="border-color:#ff6b00;color:#ff6b00;background:#fffaf0;">🔥 <span id="win-streak">0</span></div>
    <button class="sound-toggle" id="sound-toggle" onclick="toggleSound()" title="音效">🔊</button>
    <button class="rules-btn" onclick="showRules()">📖</button>
  </div>
</div>
```

**改之後：**
```html
<div class="header">
  <div class="header-left"><div class="header-title">🎯 平方包</div><span id="level-badge" style="background:var(--gold);color:white;border-radius:12px;padding:2px 10px;font-size:12px;font-weight:900;">Lv.1</span></div>
  <div class="header-right-cluster">
    <div class="combo-display" id="combo-display">
      <span class="combo-fire">🔥</span>
      <span class="combo-count" id="combo-count">0</span>
    </div>
    <button id="coll-btn" onclick="openCollection()" style="background:linear-gradient(135deg,#6c5ce7,#a29bfe);border:none;color:white;padding:4px 10px;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 2px 8px rgba(108,92,231,0.3);flex-shrink:0;">📚 <span id="coll-count">0</span>/<span id="coll-progress-text">20</span></button>
    <div class="score-badge" style="border-color:#00c853;color:#00c853;background:#f0fff4;flex-shrink:0;"><span id="success-rate">—</span></div>
    <div class="score-badge" style="border-color:#ff6b00;color:#ff6b00;background:#fffaf0;flex-shrink:0;">🔥 <span id="win-streak">0</span></div>
    <button class="sound-toggle" id="sound-toggle" onclick="toggleSound()" title="音效" style="flex-shrink:0;">🔊</button>
    <button class="rules-btn" onclick="showRules()" style="flex-shrink:0;">📖</button>
  </div>
</div>
```

---

## 📋 方案 B：卡牌收藏顯示增強

### 現有 Collection Modal

**位置：** `deluxe.html` line 562-574，邏輯喺 `game.js` 的 `openCollection()` 函數

### 增強 1：加入 Quantity Badge

**CSS（在 deluxe.html `<style>`）：**
```css
.coll-card-wrap {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.coll-qty-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: var(--accent);
  color: white;
  font-size: 11px;
  font-weight: 900;
  min-width: 22px;
  height: 22px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  z-index: 10;
}
.coll-qty-badge.high { background: var(--gold); color: white; }
.coll-qty-badge.max { background: linear-gradient(135deg, #ff6b00, #ff4500); }
```

**JS 改動（game.js `openCollection`）：**
在生成每張卡時加入：
```javascript
// 喺 coll-card-wrap 入面加 quantity badge
const qty = collected.get(n);
if (qty > 0) {
  const badge = document.createElement('div');
  badge.className = 'coll-qty-badge' + (qty >= 5 ? ' high' : '') + (qty >= 10 ? ' max' : '');
  badge.textContent = 'x' + qty;
  cardWrap.appendChild(badge);
}
```

### 增強 2：加入 Summary 統計行

**HTML（在 coll-modal 頂部加入）：**
```html
<div class="coll-summary" style="display:flex;justify-content:space-around;padding:8px 0;margin-bottom:8px;border-bottom:1px solid var(--border);">
  <div style="text-align:center;">
    <div style="font-size:20px;font-weight:900;color:var(--accent);"><span id="coll-total-types">0</span></div>
    <div style="font-size:11px;color:var(--text-dim);">種</div>
  </div>
  <div style="text-align:center;">
    <div style="font-size:20px;font-weight:900;color:var(--gold);"><span id="coll-total-cards">0</span></div>
    <div style="font-size:11px;color:var(--text-dim);">張</div>
  </div>
  <div style="text-align:center;">
    <div style="font-size:20px;font-weight:900;color:var(--success);"><span id="coll-completion">0</span>%</div>
    <div style="font-size:11px;color:var(--text-dim);">完成</div>
  </div>
</div>
```

**JS（在 `openCollection` call 時更新）：**
```javascript
const totalTypes = collected.size;
const totalCards = Array.from(collected.values()).reduce((a, b) => a + b, 0);
const completion = Math.round((totalCards / lvl.max) * 100);
document.getElementById('coll-total-types').textContent = totalTypes;
document.getElementById('coll-total-cards').textContent = totalCards;
document.getElementById('coll-completion').textContent = completion;
```

---

## 📋 優先次序

| 優先 | 方案 | 工作量 | 效益 |
|------|------|--------|------|
| P1 | 方案 A：CSS 重疊修復 | 小（純 CSS + HTML class）| 高 |
| P2 | 方案 B：Quantity Badge | 中（需改 JS）| 高 |
| P3 | 方案 B：Summary 統計 | 小（HTML + JS）| 中 |

---

## 🔧 實施步驟

### Step 1（立即做）：CSS 修復
1. 在 `deluxe.html` `<style>` 底部加入修復 CSS block
2. 修改 header HTML，加入 `class="header-left"` 和 `class="header-right-cluster"`

### Step 2（之後做）：Quantity Badge
1. 在 `deluxe.html` `<style>` 加入 `.coll-qty-badge` CSS
2. 在 `game.js` 的 `openCollection()` 加入 quantity badge 邏輯

### Step 3（可選）：Summary 統計
1. 在 `coll-modal` 加入 summary HTML
2. 在 `game.js` 的 `openCollection()` call 時更新

---

## ⚠️ 注意事項

1. **CSS `!important`** — 謹慎使用，只在必要時用
2. **破壞性變更** — HTML class 改名需確認冇其他地方引用
3. **Mobile First** — 從最小屏幕（320px）開始測試
4. **deluxe.html 分離** — 豪華版獨立維護，唔影響 practice.html
5. **`combo-display` display:none** — JS `updateComboDisplay()` 會自動加 `active` class，CSS transition 會處理動畫
