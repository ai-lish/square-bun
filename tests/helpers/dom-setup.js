/**
 * Minimal DOM fixture that mirrors the HTML elements required by game.js.
 * Call setupDOM() before loading the game script in each test suite.
 */
function setupDOM() {
  document.body.innerHTML = `
    <div id="setup-screen"></div>
    <div id="game-screen" style="display:none"></div>
    <span id="count-val">4</span>
    <span id="score">0</span>
    <div id="dice1"></div>
    <div id="dice2"></div>
    <div id="target-badge" class="target-badge disabled">開卡後擲骰</div>
    <div id="open-dots"></div>
    <span id="open-status-text">已開 0 / 4 張</span>
    <div id="cards-grid"></div>
    <div id="continue-zone"></div>
    <div id="status-bar" class="status-bar">請先開卡</div>
    <button id="btn-open">🔓 開卡</button>
    <button id="btn-dice" disabled>🎲 擲骰</button>
    <button id="btn-sb">🎤 平方包</button>
    <button id="btn-confirm" disabled>✓ 核對</button>
    <div id="rules-modal"></div>
    <div id="divs-tooltip"></div>
    <div id="level-badge">Lv.1</div>
    <div id="success-rate">—</div>
    <div id="win-streak">0</div>
    <div id="coll-count">0</div>
    <div id="coll-progress-text">20</div>
    <div id="level-summary-overlay" style="display:none">
      <div id="summary-range"></div>
      <div id="summary-rate"></div>
      <div id="summary-collected"></div>
      <div id="next-range"></div>
      <div id="current-range"></div>
      <button id="expand-btn"></button>
    </div>
  `;
}

/**
 * Load game.js into the current jsdom window by appending a <script> element.
 * Requires the test environment to be configured with runScripts: 'dangerously'.
 */
function loadGameScript() {
  const fs = require('fs');
  const path = require('path');
  const code = fs.readFileSync(path.join(__dirname, '../../game.js'), 'utf-8');
  const script = document.createElement('script');
  script.textContent = code;
  document.body.appendChild(script);
}

module.exports = { setupDOM, loadGameScript };
