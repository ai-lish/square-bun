/**
 * @jest-environment jsdom
 * @jest-environment-options {"runScripts": "dangerously"}
 *
 * Tests for the level progression system in game.js:
 * - checkLevelCompletion (triggers when collected >= level.max)
 * - expandRange (advances to next level)
 * - keepPlaying (stays at current level)
 * - resetProgress (wipes all progress)
 * - saveProgress / loadProgress (localStorage persistence)
 * - Level max boundaries (cards filtered by level)
 */

const { setupDOM, loadGameScript } = require('./helpers/dom-setup');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getSb() {
  window.checkLevelCompletion(); // sets window._sb as a side-effect
  return window._sb;
}

function resetAll() {
  localStorage.clear();
  window.resetProgress();
  getSb();
}

// ─────────────────────────────────────────────────────────────────────────────
// Setup
// ─────────────────────────────────────────────────────────────────────────────

beforeAll(() => {
  setupDOM();
  loadGameScript();
  jest.useFakeTimers();
});

afterAll(() => {
  jest.useRealTimers();
});

beforeEach(() => {
  resetAll();
});

// ─────────────────────────────────────────────────────────────────────────────
// checkLevelCompletion
// ─────────────────────────────────────────────────────────────────────────────

describe('checkLevelCompletion', () => {
  test('does NOT show popup when collected < level max', () => {
    // collected is empty; level 1 max is 20
    window.checkLevelCompletion();
    expect(document.getElementById('level-summary-overlay').style.display).not.toBe('flex');
  });

  test('shows popup when collected.size >= level max', () => {
    // Fill collected to exactly level 1 max (20)
    for (let n = 1; n <= 20; n++) {
      getSb().simulateCollect(n);
    }
    window.checkLevelCompletion();
    expect(document.getElementById('level-summary-overlay').style.display).toBe('flex');
  });

  test('popup shows correct range text for level 1', () => {
    for (let n = 1; n <= 20; n++) getSb().simulateCollect(n);
    window.checkLevelCompletion();
    expect(document.getElementById('summary-range').textContent).toBe('1-20');
  });

  test('popup shows collected/max correctly', () => {
    for (let n = 1; n <= 20; n++) getSb().simulateCollect(n);
    window.checkLevelCompletion();
    const text = document.getElementById('summary-collected').textContent;
    expect(text).toBe('20/20');
  });

  test('popup shows next-range for subsequent level', () => {
    for (let n = 1; n <= 20; n++) getSb().simulateCollect(n);
    window.checkLevelCompletion();
    expect(document.getElementById('next-range').textContent).toBe('1-100');
  });

  test('expand button is visible when there is a next level', () => {
    for (let n = 1; n <= 20; n++) getSb().simulateCollect(n);
    window.checkLevelCompletion();
    expect(document.getElementById('expand-btn').style.display).not.toBe('none');
  });

  test('expand button is hidden at max level (level 6)', () => {
    // Advance to level 6
    const levels = getSb().LEVELS;
    // Fill and expand through all levels
    for (let lvl = 1; lvl <= 5; lvl++) {
      const max = levels[lvl - 1].max;
      for (let n = 1; n <= max; n++) getSb().simulateCollect(n);
      window.expandRange();
    }
    // Now at level 6, fill it too
    const maxLvl6 = levels[5].max;
    for (let n = 1; n <= maxLvl6; n++) getSb().simulateCollect(n);
    window.checkLevelCompletion();
    expect(document.getElementById('expand-btn').style.display).toBe('none');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// expandRange
// ─────────────────────────────────────────────────────────────────────────────

describe('expandRange', () => {
  test('advances currentLevel by 1', () => {
    expect(getSb().currentLevel).toBe(1);
    // Fill level 1 and expand
    for (let n = 1; n <= 20; n++) getSb().simulateCollect(n);
    window.checkLevelCompletion();
    window.expandRange();
    expect(getSb().currentLevel).toBe(2);
  });

  test('levelMax updates to the new level max after expanding', () => {
    for (let n = 1; n <= 20; n++) getSb().simulateCollect(n);
    window.checkLevelCompletion();
    window.expandRange();
    expect(getSb().levelMax).toBe(100);
  });

  test('level badge updates to new level', () => {
    for (let n = 1; n <= 20; n++) getSb().simulateCollect(n);
    window.checkLevelCompletion();
    window.expandRange();
    expect(document.getElementById('level-badge').textContent).toBe('Lv.2');
  });

  test('popup is hidden after expanding', () => {
    for (let n = 1; n <= 20; n++) getSb().simulateCollect(n);
    window.checkLevelCompletion();
    window.expandRange();
    expect(document.getElementById('level-summary-overlay').style.display).toBe('none');
  });

  test('collected count is preserved when expanding', () => {
    for (let n = 1; n <= 20; n++) getSb().simulateCollect(n);
    const countBefore = getSb().collected.size;
    window.checkLevelCompletion();
    window.expandRange();
    expect(getSb().collected.size).toBe(countBefore);
  });

  test('does not expand beyond level 6', () => {
    // Advance to level 6
    const levels = getSb().LEVELS;
    for (let lvl = 1; lvl <= 5; lvl++) {
      const max = levels[lvl - 1].max;
      for (let n = 1; n <= max; n++) getSb().simulateCollect(n);
      window.expandRange();
    }
    expect(getSb().currentLevel).toBe(6);
    window.expandRange(); // should NOT advance beyond 6
    expect(getSb().currentLevel).toBe(6);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// keepPlaying
// ─────────────────────────────────────────────────────────────────────────────

describe('keepPlaying', () => {
  test('keeps currentLevel unchanged', () => {
    expect(getSb().currentLevel).toBe(1);
    window.keepPlaying();
    expect(getSb().currentLevel).toBe(1);
  });

  test('hides the level summary popup', () => {
    for (let n = 1; n <= 20; n++) getSb().simulateCollect(n);
    window.checkLevelCompletion();
    expect(document.getElementById('level-summary-overlay').style.display).toBe('flex');
    window.keepPlaying();
    expect(document.getElementById('level-summary-overlay').style.display).toBe('none');
  });

  test('preserves collected map', () => {
    for (let n = 1; n <= 5; n++) getSb().simulateCollect(n);
    window.keepPlaying();
    expect(getSb().collected.size).toBe(5);
  });

  test('preserves successCount', () => {
    getSb().successCount; // just to initialize _sb
    // simulate some successes by direct state (via simulateCollect)
    for (let n = 1; n <= 3; n++) getSb().simulateCollect(n);
    const sc = getSb().successCount;
    window.keepPlaying();
    expect(getSb().successCount).toBe(sc);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// resetProgress
// ─────────────────────────────────────────────────────────────────────────────

describe('resetProgress', () => {
  test('resets currentLevel to 1', () => {
    for (let n = 1; n <= 20; n++) getSb().simulateCollect(n);
    window.expandRange(); // go to level 2
    expect(getSb().currentLevel).toBe(2);
    window.resetProgress();
    getSb();
    expect(getSb().currentLevel).toBe(1);
  });

  test('clears collected map', () => {
    for (let n = 1; n <= 10; n++) getSb().simulateCollect(n);
    expect(getSb().collected.size).toBe(10);
    window.resetProgress();
    getSb();
    expect(getSb().collected.size).toBe(0);
  });

  test('resets successCount to 0', () => {
    // Simulate some successes
    for (let n = 1; n <= 5; n++) getSb().simulateCollect(n);
    window.resetProgress();
    getSb();
    expect(getSb().successCount).toBe(0);
  });

  test('resets attemptCount to 0', () => {
    window.resetProgress();
    getSb();
    expect(getSb().attemptCount).toBe(0);
  });

  test('resets winStreak to 0', () => {
    window.resetProgress();
    getSb();
    expect(getSb().winStreak).toBe(0);
  });

  test('clears localStorage after reset', () => {
    for (let n = 1; n <= 5; n++) getSb().simulateCollect(n);
    window.resetProgress();
    // After resetProgress → saveProgress, localStorage should have the reset values
    const raw = localStorage.getItem('sb_squarebun');
    expect(raw).not.toBeNull();
    const data = JSON.parse(raw);
    expect(data.currentLevel).toBe(1);
    expect(Object.keys(data.collected).length).toBe(0);
  });

  test('hides the level summary popup on reset', () => {
    for (let n = 1; n <= 20; n++) getSb().simulateCollect(n);
    window.checkLevelCompletion();
    window.resetProgress();
    expect(document.getElementById('level-summary-overlay').style.display).toBe('none');
  });

  test('level badge shows Lv.1 after reset', () => {
    for (let n = 1; n <= 20; n++) getSb().simulateCollect(n);
    window.expandRange(); // go to level 2
    window.resetProgress();
    expect(document.getElementById('level-badge').textContent).toBe('Lv.1');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// saveProgress / loadProgress (localStorage persistence)
// ─────────────────────────────────────────────────────────────────────────────

describe('saveProgress / loadProgress', () => {
  test('progress is persisted to localStorage', () => {
    for (let n = 1; n <= 5; n++) getSb().simulateCollect(n);
    expect(localStorage.getItem('sb_squarebun')).not.toBeNull();
  });

  test('collected cards survive a game restart (via loadProgress)', () => {
    for (let n = 1; n <= 5; n++) getSb().simulateCollect(n);
    // Restart game — loadProgress reads from localStorage
    window.startGame();
    getSb();
    expect(getSb().collected.size).toBe(5);
  });

  test('currentLevel survives a restart', () => {
    for (let n = 1; n <= 20; n++) getSb().simulateCollect(n);
    window.expandRange(); // go to level 2
    window.startGame();
    getSb();
    expect(getSb().currentLevel).toBe(2);
  });

  test('corrupted localStorage data is handled gracefully', () => {
    localStorage.setItem('sb_squarebun', 'not-valid-json{{{');
    expect(() => window.startGame()).not.toThrow();
    getSb();
    // Should fallback to defaults
    expect(getSb().currentLevel).toBeGreaterThanOrEqual(1);
  });

  test('missing localStorage data results in default state', () => {
    localStorage.removeItem('sb_squarebun');
    window.startGame();
    getSb();
    expect(getSb().successCount).toBe(0);
    expect(getSb().collected.size).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Level max filtering (cards available per level)
// ─────────────────────────────────────────────────────────────────────────────

describe('Level card range filtering', () => {
  test('level 1 deck only contains cards 1-20', () => {
    // After resetProgress, we're at level 1 with max=20
    // Start a fresh round; table cards should all be ≤ 20
    const tableCards = getSb().table;
    tableCards.forEach(card => {
      expect(card.n).toBeLessThanOrEqual(20);
      expect(card.n).toBeGreaterThanOrEqual(1);
    });
  });

  test('level 2 deck can contain cards 1-100', () => {
    for (let n = 1; n <= 20; n++) getSb().simulateCollect(n);
    window.expandRange(); // now at level 2
    getSb();
    // The deck should now be able to provide cards > 20
    // Start many rounds until we see one
    let sawAbove20 = false;
    for (let attempt = 0; attempt < 50 && !sawAbove20; attempt++) {
      window.startRound();
      getSb();
      sawAbove20 = getSb().table.some(c => c.n > 20);
    }
    expect(sawAbove20).toBe(true);
  });

  test('coll-count DOM element shows current collected size', () => {
    for (let n = 1; n <= 5; n++) getSb().simulateCollect(n);
    expect(document.getElementById('coll-count').textContent).toBe('5');
  });

  test('coll-progress-text shows level max', () => {
    expect(document.getElementById('coll-progress-text').textContent).toBe('20');
  });
});
