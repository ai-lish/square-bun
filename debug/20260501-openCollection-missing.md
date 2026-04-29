# Bug Report：`openCollection()` 函數缺失

## 📋 基本資料
- **Repo**：`/Users/zachli/square-bun/`
- **URL**：`https://ai-lish.github.io/square-bun/deluxe.html`
- **當前 commit**：`6704415`（copilot/add-deluxe-ui-redesign-plan merge）
- **優先順序**：🟡 中
**日期：** 2026-04-29

---

## 🔍 問題描述

`deluxe.html` Header 入面有 📚 收藏按鈕，佢 `onclick="openCollection()"`，但 `deluxe.js` 入面**完全冇 `openCollection()` 函數定義**。

點擊 📚 按鈕 → **JavaScript Error**：`Uncaught ReferenceError: openCollection is not defined`

---

## 📁 關鍵檔案

### 1. `deluxe.html`（問題源頭）

**Header 按鈕**（Line ~545）：
```html
<button id="coll-btn" onclick="openCollection()" style="...">
  📚 <span id="coll-count">0</span>/<span id="coll-progress-text">20</span>
</button>
```

**Collection Modal**（Line ~606）：
```html
<div class="modal-overlay" id="coll-modal">
  <div class="modal" style="max-width:620px;...">
    <h2 style="...">📚 我的收藏</h2>
    <div style="display:flex;gap:8px;margin-bottom:12px;">
      <button id="coll-tab-all" onclick="openCollection('all')">全部</button>
      <button id="coll-tab-leg" onclick="openCollection('legendary')">⭐ 傳說</button>
      <button id="coll-tab-epic" onclick="openCollection('epic')">💎 史詩</button>
      <button id="coll-tab-rare" onclick="openCollection('rare')">👑 稀有</button>
    </div>
    <div id="coll-grid" style="display:grid;..."></div>
  </div>
</div>
```

### 2. `deluxe.js`（缺失函數）

**完全冇 `openCollection` 或 `coll-` 相關函數**。

現有相關函數只有：
- `updateAchCount()` — 更新成就計數
- `showAchievements()` — 顯示成就 modal
- `closeAchievements()` — 關閉成就 modal

---

## 🧪 測試重現

1. 打開 `https://ai-lish.github.io/square-bun/deluxe.html`
2. 點擊 📚 收藏按鈕（右側紫色按鈕）
3. Console 出現：`Uncaught ReferenceError: openCollection is not defined`

---

## 🐛 需要修復嘅嘢

喺 `deluxe.js` 新增 `openCollection(filter)` 函數：

```javascript
function openCollection(filter = 'all') {
  const modal = document.getElementById('coll-modal');
  const grid = document.getElementById('coll-grid');
  if (!modal || !grid) return;

  // 讀取當前等級範圍
  const levelMax = window.LEVELS ? window.LEVELS[window.currentLevel - 1].max : 20;
  const collected = window.collected || new Map();

  // 收集所有可見卡牌
  const cards = [];
  for (let n = 1; n <= levelMax; n++) {
    const qty = collected.get(n) || 0;
    if (filter === 'all' || (filter === 'legendary' && n >= 1000) || ...) {
      cards.push({ n, qty });
    }
  }

  // 渲染網格
  grid.innerHTML = cards.map(c => `
    <div style="
      aspect-ratio:3/4;
      background:${c.qty > 0 ? 'linear-gradient(135deg,#f5c518,#ff9800)' : '#2d2d4e'};
      border-radius:8px;
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:20px;
      font-weight:bold;
      color:${c.qty > 0 ? '#1a1a2e' : '#555'};
      position:relative;
    ">
      ${c.qty > 0 ? c.n : '🔒'}
      ${c.qty > 1 ? `<span style="position:absolute;bottom:2px;right:4px;font-size:10px;background:#e53935;color:white;padding:1px 4px;border-radius:4px;">×${c.qty}</span>` : ''}
    </div>
  `).join('');

  modal.classList.add('show');
}
```

同時需要對應嘅 **CSS** 和 **HTML 結構**（已喺 `deluxe.html` 存在）。

---

## 📝 附加資料

### PR 歷史
- `6704415` — copilot/add-deluxe-ui-redesign-plan merge commit
- 主要實作：achievement toast + 🏆 modal
- Collection 功能：HTML 已加，但 JS 函數缺失

### Plan 文件
- `planning/20260501-deluxe-ui-redesign-plan_v1.md` — 包含 `openCollection()` 的詳細設計
