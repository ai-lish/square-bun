# Bug: `openCollection()` 兩邊定義，舊版覆寫新版

## 📋 基本資料
- **Repo**：`/Users/zachli/square-bun/`
- **URL**：`https://ai-lish.github.io/square-bun/deluxe.html`
- **優先順序**：🔴 高

---

## 🔍 問題描述

Zach 回報：卡牌圖鑑 UI 靚，但點擊冇反應。

**觀察**：
- UI 靚（新 CSS生效）
- Tab 篩選冇反應
- 點擊已收集卡冇反應

---

## 🐛 根本原因

`game.js` 和 `deluxe.js` **兩邊都定義咗 `openCollection()` 函數**：

| 檔案 | Line | 定義 |
|------|------|------|
| `game.js` | 85 | 舊版（`coll-content.innerHTML=""` + 舊卡格式）|
| `deluxe.js` | 214 | 新版（網格 + `showCardDetail()`）|

`deluxe.html` loading order：
```html
<script src="game.js"></script>   <!-- 先load，定義舊版 openCollection -->
<script src="deluxe.js"></script>  <!-- 後load，定義新版 openCollection -->
```

理論上新版應該 override 舊版，但可能 `game.js` 入面有其他地方再次 call `openCollection()` 覆寫咗新版。

---

## 🧪 驗證方法

喺 browser console 輸入：
```javascript
// 檢查邊個 openCollection 係 global
console.log(window.openCollection.toString().substring(0, 100));
// 如果係舊版，會見到 "coll-content.innerHTML=""
// 如果係新版，會見到 "grid-template-columns"

// 臨時 override
window._testOpenCollection = window.openCollection;
```

---

## ✅ 修復方案

### Option A（推薦）：刪除 `game.js` 入面嘅 `openCollection()`

`game.js` 係 `practice.html` 用，唔刪。但 `deluxe.html` 唔需要 `game.js` 入面嘅 `openCollection()`。

**風險**：檢查 `game.js` 入面 `openCollection()` 有冇其他 dependency。

### Option B：`deluxe.js` 入面加 `window.openCollection = openCollection`

確保 `deluxe.js` 版本係 global。

### Option C：`deluxe.html` 入面刪除 `game.js` 嘅 `openCollection`

喺 `deluxe.html` 加：
```html
<script src="game.js"></script>
<script>
  // 刪除 game.js 嘅 openCollection，保留 deluxe.js 版本
  delete window.openCollection;
</script>
<script src="deluxe.js"></script>
```

---

## 📁 關鍵代碼位置

### game.js（舊版，line 85）
```javascript
function openCollection(filter="all"){
  const modal=document.getElementById('coll-modal');
  if(!modal)return;
  modal.classList.add('show');
  // ... 舊版 render cards
  content.innerHTML="";  // 覆寫 coll-content！
  filtered.forEach(card=>{...});
}
```

### deluxe.js（新版本，line 214）
```javascript
function openCollection(filter = 'all') {
  const modal = document.getElementById('coll-modal');
  const content = document.getElementById('coll-content');
  if (!modal || !content) return;
  // ... 新版 render grid
  content.innerHTML = '<div style="display:grid;...">...'</div>';
}
```

### deluxe.html（line 642-643）
```html
<script src="game.js"></script>
<script src="deluxe.js"></script>
```
