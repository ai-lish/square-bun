# Square Bun 豪華版 — 手機 Header + 卡牌圖鑑 UI 修復方案

**版本：** v1
**日期：** 2026-05-02
**作者：** 小心（Zach 前線助手）

---

## 問題

### Issue 1：豪華版 Header 手機顯示溢出

**描述**：手機上 Header 元素過多，部分標示離開畫面。

**當前 Header 元素**：
```
🎲 平方包 Lv.1  │  🏆 0/10  │  📚 0/20  │  —  🔥 0  │  🔊  │  📖
```
共 7 個元素 + gap，320px 屏幕必然溢出。

**修復方向**：
- 🔥 連勝：≥3 先顯示，否則隱藏（已有 `display:none` 邏輯，但可能 CSS 未生效）
- 成功率 `—`：低解像度時隱藏
- 考慮用 `flex-shrink: 0` + `overflow: hidden` 保護每個元素

---

### Issue 2：卡牌圖鑑顯示問題

**描述**：
1. 一行一個卡牌（每張卡佔據完整一行）
2. 未收集卡牌顯示數字（應顯示 `?` 或 lock 圖標）
3. 因數太多導致卡牌畫面溢出

**Pinterest 參考模式**：
- 卡牌網格展示：每張卡 50-70px 寬，統一尺寸
- Locked 卡：顯示 lock 圖標 + `?`，唔顯示數字
- Unlocked 卡：顯示數字 + quantity badge
- 唔喺網格入面顯示因數（因數太多溢出）
- 點擊卡牌 → 詳情 modal 顯示因素圈 + 收集次數

**修復方向**：
1. 改為響應式網格佈局（CSS Grid：`repeat(auto-fill, minmax(60px, 1fr))`）
2. 未收集卡：顯示 `🔒` + `?`（灰色半透明）
3. 已收集卡：顯示數字（60px × 80px 大小，唔顯示因數）
4. quantity badge：顯示喺卡牌右下角
5. 點擊已收集卡 → 打開詳情 modal，顯示因數圈 + 收集次數

---

## 📐 Issue 1 修復：Header Mobile

### CSS 改動

```css
/* Header wrapper */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  overflow: hidden;
  flex-wrap: nowrap;
}

/* Left cluster */
.header-left {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

/* Right cluster */
.header-right-cluster {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
  overflow: hidden;
}

/* Individual badges/buttons */
.score-badge, .combo-display, #ach-btn, #coll-btn, .sound-toggle, .rules-btn {
  flex-shrink: 0;
  min-width: 0;
}

/* Hide on small screens */
@media (max-width: 480px) {
  .score-badge:first-of-type {
    display: none; /* Hide success rate on small screens */
  }
  .header-title {
    font-size: 14px;
  }
}
```

### 預期效果

**桌面（>768px）**：
```
🎲 平方包 Lv.1  │  🏆 0/10  │  📚 0/20  │  —  🔥 0  │  🔊  │  📖
```

**手機（≤480px）**：
```
🎲 平方包  │  🏆 0/10  │  📚 0/20  │  🔥 0  │  🔊  │  📖
```
- 隱藏成功率 `—`
- 標題字體收細
- 每個元素 `flex-shrink: 0` 防止壓縮變形

---

## 📐 Issue 2 修復：卡牌圖鑑 Modal

### 當前問題

```html
<!-- 當前：每張卡一行，顯示因數，因數太多會溢出 -->
<div class="coll-card-wrap">
  <div class="coll-card">20</div>
  <div class="coll-card-name">20</div>
  <div class="coll-divisors">1, 2, 4, 5, 10, 20</div>  <!-- 溢出！ -->
</div>
```

### 修復後設計

**網格佈局（唔顯示因數）**：
```html
<div class="coll-grid">
  <!-- 已收集卡 -->
  <div class="coll-card-item collected">
    <div class="coll-card-front">20</div>
    <span class="coll-qty">×3</span>
  </div>
  <!-- 未收集卡 -->
  <div class="coll-card-item locked">
    <div class="coll-card-front">🔒</div>
  </div>
</div>
```

**卡牌尺寸**：
- 網格卡牌：60px × 80px（統一尺寸）
- 唔顯示因數圈
- 顯示 quantity badge（右下角）

**詳情 Modal（點擊已收集卡）**：
```html
<div id="coll-detail-modal" class="modal-overlay">
  <div class="modal">
    <h2>📚 卡牌 20</h2>
    <div class="detail-card">20</div>
    <p>收集次數：×3</p>
    <p>因數：1, 2, 4, 5, 10, 20</p>
    <button onclick="closeDetail()">關閉</button>
  </div>
</div>
```

### CSS 改動

```css
/* 網格容器 */
.coll-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  gap: 10px;
  padding: 10px;
  max-height: 60vh;
  overflow-y: auto;
}

/* 網格卡牌 */
.coll-card-item {
  width: 60px;
  height: 80px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
  position: relative;
  cursor: pointer;
}

.coll-card-item.collected {
  background: linear-gradient(135deg, #f5c518, #ff9800);
  color: #1a1a2e;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.coll-card-item.locked {
  background: #2d2d4e;
  color: #555;
  cursor: default;
}

/* Quantity badge */
.coll-qty {
  position: absolute;
  bottom: 2px;
  right: 4px;
  background: #e53935;
  color: white;
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 4px;
}

/* 詳情卡（點擊後顯示） */
.detail-card {
  width: 120px;
  height: 160px;
  background: linear-gradient(135deg, #f5c518, #ff9800);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  font-weight: bold;
  color: #1a1a2e;
  margin: 0 auto 16px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.3);
}
```

### JS 改動

```javascript
// openCollection() - 渲染網格（唔顯示因數）
function openCollection(filter = 'all') {
  const modal = document.getElementById('coll-modal');
  const grid = document.getElementById('coll-grid');
  if (!modal || !grid) return;

  const levelMax = LEVELS[currentLevel - 1].max;
  const cards = [];

  for (let n = 1; n <= levelMax; n++) {
    const qty = collected.get(n) || 0;
    if (filter === 'all' ||
        (filter === 'legendary' && SQUARES.includes(n)) ||
        (filter === 'epic' && getDivisors(n).length >= 6 && !SQUARES.includes(n)) ||
        (filter === 'rare' && getDivisors(n).length < 6)) {
      cards.push({ n, qty });
    }
  }

  grid.innerHTML = cards.map(c => `
    <div class="coll-card-item ${c.qty > 0 ? 'collected' : 'locked'}"
         ${c.qty > 0 ? `onclick="showCardDetail(${c.n})"` : ''}>
      <div class="coll-card-front">${c.qty > 0 ? c.n : '🔒'}</div>
      ${c.qty > 1 ? `<span class="coll-qty">×${c.qty}</span>` : ''}
    </div>
  `).join('');

  modal.classList.add('show');
}

// showCardDetail() - 顯示卡牌詳情（包含因數）
function showCardDetail(n) {
  const qty = collected.get(n) || 0;
  const divs = getDivisors(n).join(', ');
  const isSquare = SQUARES.includes(n);

  document.getElementById('detail-card-num').textContent = n;
  document.getElementById('detail-qty').textContent = `收集次數：×${qty}`;
  document.getElementById('detail-divs').textContent = `因數：${divs}`;
  document.getElementById('detail-type').textContent = isSquare ? '⭐ 傳說（平方數）' : (divs.split(',').length >= 6 ? '💎 史詩' : '👑 稀有');

  document.getElementById('coll-detail-modal').classList.add('show');
}
```

### HTML 新增

```html
<!-- 詳情 Modal（在 coll-modal 入面） -->
<div id="coll-detail-modal" class="modal-overlay" style="display:none;">
  <div class="modal" style="max-width:320px;text-align:center;">
    <h2 style="margin-bottom:16px;">📚 卡牌 <span id="detail-card-num"></span></h2>
    <div style="width:120px;height:160px;background:linear-gradient(135deg,#f5c518,#ff9800);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:48px;font-weight:bold;color:#1a1a2e;margin:0 auto 16px;box-shadow:0 4px 16px rgba(0,0,0,0.3);" id="detail-card-display"></div>
    <p id="detail-type" style="color:#f5c518;font-weight:bold;margin-bottom:8px;"></p>
    <p id="detail-qty" style="color:#aaa;margin-bottom:8px;"></p>
    <p id="detail-divs" style="color:#888;font-size:12px;word-break:break-all;"></p>
    <button onclick="closeDetail()" style="margin-top:16px;padding:8px 24px;background:#f5c518;color:#1a1a2e;border:none;border-radius:8px;cursor:pointer;">關閉</button>
  </div>
</div>
```

---

## 📁 實作檔案

| 檔案 | 改動 |
|------|------|
| `deluxe.css` | Header flex 樣式 + 網格卡牌 CSS + 詳情卡 CSS |
| `deluxe.html` | Header flex class + 詳情 Modal HTML |
| `deluxe.js` | `openCollection()` 改用網格 + `showCardDetail()` 新函數 |

---

## 執行順序

1. **Phase 1**：修復 Header mobile 溢出（CSS flex + media query）
2. **Phase 2**：重寫 `openCollection()` 為網格佈局（唔顯示因數）
3. **Phase 3**：新增 `showCardDetail()` 詳情 modal（點擊顯示因數）
4. **Phase 4**：美化細節（動畫、hover 效果）

---

## 預期效果

### Header Mobile（修復後）
- 所有元素喺 320px 屏幕入面正常顯示
- 成功率 `—` 自動隱藏
- 標題字體收細

### 卡牌圖鑑（修復後）
- 響應式網格：手機 3-4 列，桌面 5-6 列
- 未收集卡：🔒 圖標，唔顯示數字
- 已收集卡：數字 + quantity badge
- 點擊已收集卡：詳情 modal 顯示因數圈 + 收集次數
- 唔會因因數太多而溢出
