# 平安包練習模式 — 製作計劃 v1

**版本：** v1  
**日期：** 2026-04-29  
**作者：** 大腦  
**狀態：** 規劃中  
**基於：** practice.html（現有）+ level-progression plan

---

## 目標

增強現有 `practice.html`，加入：
1. **關卡漸進系統**（練習專用）
2. **設定面板**（自訂卡數、範圍）
3. **統計面板**（成功率、連勝、歷史）
4. **干擾卡模式**（高分關卡新增「干擾卡」）
5. **離線持久化**（localStorage）

---

## 現有代碼審視

**`practice.html` 已有：**
- ✅ 練習模式完整邏輯
- ✅ 平方包語音觸發
- ✅ 開卡 → 擲骰 → 揀卡 → 確認 → 補卡流程
- ✅ 桌面卡數選擇（2-6張）
- ✅ 卡牌 3D flip 動畫
- ✅ 因數顯示（factor back）
- ✅ 計分系統

**缺失（相對 deluxe.html）：**
- ❌ 關卡漸進（Lv.1-6）
- ❌ 持久化（localStorage）
- ❌ 干擾卡（Penalty Cards）
- ❌ 設定面板（卡數/範圍/難度）
- ❌ 統計面板

---

## 功能詳細

### 1. 關卡漸進系統（練習模式專用）

| 等級 | 卡牌範圍 | 桌面卡數 | 干擾卡 | 說明 |
|------|----------|----------|--------|------|
| 1 | 1-20 | 3張 | ❌ | 入門：細範圍 |
| 2 | 1-20 | 4張 | ❌ | 鞏固：3張→4張 |
| 3 | 1-50 | 4張 | ❌ | 中階：範圍擴大 |
| 4 | 1-50 | 5張 | ✅ | 中階+：加入干擾卡 |
| 5 | 1-100 | 5張 | ✅ | 高階：範圍再擴 |
| 6 | 1-200 | 6張 | ✅ | 終極挑戰 |

**干擾卡（Penalty Cards）：**
- 某些卡牌在 factor back 顯示紅色邊框（干擾卡）
- 干擾卡可被 dice 整除，但選擇後要扣分
- 到達 Lv.4 或以上自動啟用

### 2. 設定面板

**入口：**，頂部齒輪按鈕

| 設定 | 選項 |
|------|------|
| 桌面卡數 | 2 / 3 / 4 / 5 / 6 張 |
| 卡牌範圍 | 1-20 / 1-50 / 1-100 / 1-200 |
| 難度 | 休閒（無干擾卡）/ 挑戰（有干擾卡） |
| 聲音 | 開/關 |
| 語音提示 | 開/關 |

**設定存 localStorage**

### 3. 統計面板

accessible via top-right stats icon

**顯示：**
- 總遊戲次數
- 總得分
- 成功率 %
- 最高連勝
- 當前連勝
- 等級
- 已收集卡牌（每 level 完成後顯示 X/Y）

### 4. Level 完成彈窗

當前 level 所有卡牌收集完成後，彈出 summary popup：

```
🎉 Lv.3 完成！
成功率：78%
已收集：50/50
────────────────
[ 🏆 升級 Lv.4 ] → 1-50 + 干擾卡
[ 🔄 繼續 Lv.3 ] → 保持 1-50，無干擾卡
[ 🔁 重新開始 ] → 重置 Lv.1
```

### 5. 持久化（localStorage）

```javascript
localStorage.setItem('sb_practice', JSON.stringify({
  level: 1,
  totalScore: 0,
  totalGames: 0,
  successCount: 0,
  attemptCount: 0,
  winStreak: 0,
  bestStreak: 0,
  settings: {
    cardCount: 4,
    range: 20,
    difficulty: 'normal',  // 'easy' | 'normal' | 'hard'
    sound: true,
    voice: true
  },
  // Per-level collection (for collection feature)
  collected: {}
}));
```

---

## 文件結構

```
square-bun/
├── practice.html        ← 直接在現有 practice.html 修改
├── deluxe.html          ← 豪華版（不修改）
├── planning/
│   └── 20260429-practice-mode-enhancement.md  ← 本計劃
└── ...
```

---

## 實作順序

### Phase 1：關卡系統（核心）
1. 在 practice.html 頂部加入 `LEVELS` 配置
2. 加入 `currentLevel`、`collected` 狀態
3. 修改 `startRound()` 根據 level 過濾牌組
4. 加入 `showLevelSummaryPopup()` + overlay HTML
5. 修改 `confirmPicks()` 觸發完成檢查
6. 加入 `expandRange()`、`keepPlaying()`、`resetProgress()`

### Phase 2：設定面板
1. 在 header 加入 ⚙️ 按鈕
2. 寫設定 modal HTML + CSS
3. 讀寫 localStorage settings
4. 實作卡片選擇 UI

### Phase 3：統計面板
1. 在 header 加入 📊 按鈕
2. 寫統計 modal HTML + CSS
3. 實作 stats 更新邏輯
4. 加入 level badge UI

### Phase 4：干擾卡系統
1. 定義干擾卡邏輯（Lv.4+ 啟用）
2. 干擾卡 factor back 紅色邊框
3. 選擇干擾卡扣分處理
4. 在 summary overlay 說明干擾卡

### Phase 5：Polish
1. 完成後 summary popup 設計
2. 等級 badge 顯示（右上角）
3. 教學 tooltip（首次進入）

---

## 風險與測試要點

- **Practice → Deluxe 差異：** 練習模式不需音效/combo，專注遊戲學習體驗
- **localStorage 兼容性：** 讀到舊存檔要給預設值
- **干擾卡平衡：** Lv.4 干擾卡比例建議 10-15%
- **Mobile：** 設定面板要用滑動 panel 或 full-screen modal

---

## 参考

- 現有 `practice.html`（已完整）
- `planning/20260424-level-progression-plan_v1.md`（豪華版關卡系統）
- `deluxe.html`（豪華版完整功能參考）
