# Square Bun 豪華版 — UI 重新設計方案

**版本：** v1（規劃階段）
**PR：** （待建立）
**實作：** 待定
**日期：** 2026-05-01
**作者：** 小心（Zach 前線助手）

---

## 實作範圍（重要）

這是一個 UI 優化方案，不是新建頁面。

修改的檔案：
- `deluxe.html` — 新增 📚🏆 按鈕 + 兩個 modal HTML
- `deluxe.css` — 新增 modal / toast / grid 樣式
- `deluxe.js` — 新增 `showCollection()` / `showAchievements()` / `showToast()` 函數

不修改：`practice.html`、`game.js`

---

## 概述

豪華版現有 UI 問題：
1. 右下角 `.achievement-badges` bar 佔空間，影響遊戲操作
2. 冇卡牌收藏展示功能

本方案：
1. **卡牌收藏** → 新增 📚 收藏按鈕，點擊彈出 modal 網格展示
2. **成就顯示** → 移除右下角 badge bar，改為右上角 toast notification

---

## UI 設計

### Header 佈局（修訂後）

```
┌──────────────────────────────────────────────────────┐
│  🎲 平方包  │  🏆 3/6  │  📚 12/20  │  🔊  │  🔥 3 │
└──────────────────────────────────────────────────────┘
```

由左至右：
- Logo/遊戲名
- 🏆 成就按鈕（已解鎖/總數）
- 📚 收藏按鈕（已收集/總數）
- 🔊 聲音開關
- 🔥 連勝顯示（≥3 時顯示，否則隱藏）

---

## 🃏 卡牌收藏功能

### 📚 按鈕（Header）
- 顯示：`📚 12/20`（已收集/當前範圍上限）
- Hover：輕微放大動畫

### 📚 Modal 設計
- 全屏半透明黑色遮罩（點擊遮罩關閉）
- 中央白色/深色卡片框
- 標題：`📚 卡牌收藏 (12/20)`
- 右上角 `✕` 關閉按鈕

### 卡牌網格
- 響應式：桌面 5-6 列，平板 4 列，手機 3 列
- 每張卡顯示：
  - 卡牌數字（大字體居中）
  - 右下角 quantity badge（紅色圓形，如 `×3`）
- 卡牌狀態：

| 狀態 | 顯示 |
|------|------|
| 已收集 | 正常彩色卡 + 數量 badge |
| 未收集 | 灰色半透明 + 🔒 + `?` |

### 互動
- 點擊已收集卡牌：放大顯示（可見因素圈 + 收集次數）
- 滾動瀏覽大量卡牌

---

## 🏆 成就功能

### 🏆 按鈕（Header）
- 顯示：`🏆 3/6`（已解鎖/總數）
- Hover：輕微放大動畫

### 🏆 Modal 設計
- 全屏深色覆蓋
- 標題：`🏆 成就 (3/6)`
- 成就列表（可滾動）：

```
┌────────────────────────────────┐
│ ✅ 🎯 初試啼聲                  │
│    完成第一局                   │
│    ────────────────────        │
│ ✅ 🔥 Combo 新手               │
│    達成 3 連勝                  │
│    ────────────────────        │
│ 🔒 🔥🔥 Combo 狂人             │
│    達成 10 連勝                 │
│    ────────────────────        │
│ 🔒 🎯 因數大師                  │
│    10 局都在因數圈找到答案       │
│    ────────────────────        │
│ 🔒 ⭐ 平方包！                  │
│    觸發一次平方包               │
│    ────────────────────        │
│ 🔒 🏆 完美主義                  │
│    完成 10 局                   │
└────────────────────────────────┘
```

- ✅ 已解鎖：彩色 emoji + 正常文字
- 🔒 未解鎖：灰色半透明 + 鎖頭 emoji

### Toast Notification（取代右下角 Badge Bar）

**尺寸**：280px × 80px
**位置**：右上角，距邊 20px
**動畫**：由右滑入 → 停留 3 秒 → 滑出右側

**設計**：
```
┌─────────────────────────────┐
│ 🏆 成就解鎖！                │
│ 「Combo 新手」3連勝！        │
└─────────────────────────────┘
```

- 背景：深色半透明（`rgba(20,20,30,0.95)`）
- 邊框：金色（成就專用色）
- 字體：白色標題 + 金色成就名

**堆疊**：多個 toast 時垂直堆疊，間隔 10px

---

## 代碼改動說明

### deluxe.css 改動

**1. Toast 動畫**
```css
@keyframes slideInRight {
  from { transform: translateX(120%); opacity: 0; }
  to   { transform: translateX(0);    opacity: 1; }
}
@keyframes slideOutRight {
  from { transform: translateX(0);    opacity: 1; }
  to   { transform: translateX(120%); opacity: 0; }
}
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(20,20,30,0.95);
  border: 2px solid #f5c518;
  border-radius: 12px;
  padding: 16px 20px;
  min-width: 280px;
  z-index: 9999;
  animation: slideInRight 0.4s ease-out;
}
.toast.hiding { animation: slideOutRight 0.3s ease-in forwards; }
```

**2. Modal 樣式**
```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9998;
  animation: fadeIn 0.2s ease-out;
}
.modal-content {
  background: #1a1a2e;
  border-radius: 16px;
  padding: 24px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}
```

**3. 收藏卡牌網格**
```css
.collection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  gap: 8px;
  margin-top: 16px;
}
.collection-card {
  aspect-ratio: 3/4;
  background: linear-gradient(135deg, #f5c518, #ff9800);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  color: #1a1a2e;
  position: relative;
}
.collection-card.locked {
  background: #333;
  color: #666;
}
.collection-card .qty-badge {
  position: absolute;
  bottom: 2px;
  right: 2px;
  background: #e53935;
  color: white;
  font-size: 10px;
  padding: 2px 4px;
  border-radius: 4px;
}
```

### deluxe.html 改動

**4. Header 按鈕（在現有按鈕旁新增）**
```html
<button id="btn-achievements" class="btn btn-gold" onclick="showAchievements()">
  🏆 <span id="ach-count">0/6</span>
</button>
<button id="btn-collection" class="btn btn-gold" onclick="showCollection()">
  📚 <span id="col-count">0/20</span>
</button>
```

**5. Toast Container（在 body 底部）**
```html
<div id="toast-container"></div>
```

**6. 收藏 Modal（在 body 底部）**
```html
<div id="collection-modal" class="modal-overlay" style="display:none;">
  <div class="modal-content">
    <h2>📚 卡牌收藏 (<span id="col-total">0/20</span>)</h2>
    <button class="modal-close" onclick="closeModal('collection-modal')">✕</button>
    <div id="collection-grid" class="collection-grid"></div>
  </div>
</div>
```

**7. 成就 Modal（在 body 底部）**
```html
<div id="achievements-modal" class="modal-overlay" style="display:none;">
  <div class="modal-content">
    <h2>🏆 成就 (<span id="ach-total">0/6</span>)</h2>
    <button class="modal-close" onclick="closeModal('achievements-modal')">✕</button>
    <div id="achievements-list"></div>
  </div>
</div>
```

### deluxe.js 改動

**8. showToast() 函數**
```javascript
function showToast(title, message) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<strong>${title}</strong><br>${message}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('hiding');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
```

**9. showCollection() 函數**
```javascript
function showCollection() {
  const levelMax = LEVELS[currentLevel - 1].max;
  const grid = document.getElementById('collection-grid');
  grid.innerHTML = '';
  for (let n = 1; n <= levelMax; n++) {
    const card = document.createElement('div');
    const qty = collected.get(n) || 0;
    card.className = 'collection-card' + (qty === 0 ? ' locked' : '');
    card.innerHTML = qty > 0
      ? `${n}<span class="qty-badge">×${qty}</span>`
      : '🔒';
    grid.appendChild(card);
  }
  document.getElementById('col-total').textContent = `${collected.size}/${levelMax}`;
  document.getElementById('collection-modal').style.display = 'flex';
}
```

**10. showAchievements() 函數**
```javascript
function showAchievements() {
  const list = document.getElementById('achievements-list');
  list.innerHTML = DELUXE_ACHIEVEMENTS.map(a => {
    const unlocked = unlockedAchievements.has(a.id);
    return `<div class="achievement-item ${unlocked ? '' : 'locked'}">
      ${unlocked ? '✅' : '🔒'} ${a.emoji} ${a.name}
      <br><small>${a.desc}</small>
    </div>`;
  }).join('');
  const unlocked = unlockedAchievements.size;
  document.getElementById('ach-total').textContent = `${unlocked}/${DELUXE_ACHIEVEMENTS.length}`;
  document.getElementById('achievements-modal').style.display = 'flex';
}
```

**11. closeModal() 輔助函數**
```javascript
function closeModal(id) {
  document.getElementById(id).style.display = 'none';
}
```

**12. 修改 checkAchievements()（現有函數）**
```javascript
// 舊：彈出 achievement notification modal
// 新：顯示 toast，並保留 modal 通知
function checkAchievements() {
  // ... existing logic ...
  DELUXE_ACHIEVEMENTS.forEach(a => {
    if (a.check() && !unlockedAchievements.has(a.id)) {
      unlockedAchievements.add(a.id);
      saveAchievements();
      // 顯示 toast（唔再彈 modal，除非玩家主動打開成就頁）
      showToast('🏆 成就解鎖！', `「${a.name}」${a.desc}`);
    }
  });
}
```

**13. 更新 Header 按鈕計數（在合適位置調用）**
```javascript
function updateHeaderCounts() {
  const levelMax = LEVELS[currentLevel - 1].max;
  document.getElementById('col-count').textContent = `${collected.size}/${levelMax}`;
  document.getElementById('ach-count').textContent = `${unlockedAchievements.size}/${DELUXE_ACHIEVEMENTS.length}`;
}
```

---

## 移除的代碼

### deluxe.html 移除
- `.achievement-badges` bar（右下角 badge 顯示）

### deluxe.css 移除
- `.achievement-badges` 相關樣式

### deluxe.js 移除
- `showAchievementNotification()` modal 調用（改用 toast）

---

## 持久化（localStorage）

現有 localStorage 結構無需大改。

---

## 風險與測試要點

- **Toast 動畫**：確保唔會干擾遊戲操作（固定喺右上角，唔會遮住主要遊戲區域）
- **Modal 關閉**：確保點擊遮罩 / 按 X / 按 ESC 都可關閉
- **大量卡牌**：Lv.6（1-2000 範圍）需要滾動性能測試
- **Responsive**：確保手機上 modal 唔會超出屏幕

---

## 執行順序建議

1. **Phase 1**：新增 📚 收藏按鈕 + 簡單 collection modal（無篩選功能）
2. **Phase 2**：新增 🏆 成就按鈕 + achievements modal
3. **Phase 3**：移除現有 `.achievement-badges` bar，改用 toast notification
4. **Phase 4**：美化細節（動畫、hover 效果、數量 badge）
