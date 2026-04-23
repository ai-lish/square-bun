# square-bun

Pure client-side HTML game — 平方包 (Square Bun) 桌遊練習模式。

- **豪華版**: `deluxe.html` — 音效、Combo、成就、粒子效果
- **練習版**: `practice.html` — 純遊戲邏輯
- **測試文檔**: [TEST_CASES.md](TEST_CASES.md) — 100 個測試案例

## 遊戲模式

| 檔案 | 描述 |
|------|------|
| `index.html` | 入口頁 — 選擇練習版或豪華版 |
| `practice.html` | 練習版 — 純遊戲邏輯 |
| `deluxe.html` | 豪華版 — 音效 + Combo + 成就 + 粒子 |

## 已修復 Bug（2026-04-23）

| Bug | 問題 | Commit |
|-----|------|--------|
| B1 | 骰仔冇1時，1因數圈顯示灰色（應為紅色） | `c26427b` |
| B2 | 冇揀任何卡確認後出現因數顯示 | 練習版已修 |
| B3 | 正確確認後 `wonNumbers` 未更新 | `a9fb518` |
| B4 | 兩張相同數字，贏了一張後所有該數字都被 block | `ea2a286` |
| B5 | 同 round 補卡出現兩張相同數字 | `2557528` |

## 測試文檔

👉 **[TEST_CASES.md](TEST_CASES.md)** — 100 個測試案例

## 設計

- 深藍 (`#1a365d`) + 橙色 (`#ed8936`)
- Noto Sans HK
- 卡片式佈局

## 玩法

1. 2–6 名玩家，88 張卡（1–88）
2. 擲 2 粒骰仔；目標數字 = 可被任一骰仔整除
3. 點擊**非目標**卡牌收集它們
4. 點擊「平方包」按鈕報告平方數

*自動創建 by OpenClaw assistant.*
