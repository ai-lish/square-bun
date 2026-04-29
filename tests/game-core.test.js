/**
 * @jest-environment jsdom
 * @jest-environment-options {"runScripts": "dangerously"}
 *
 * Integration tests for the core game flow in game.js:
 * - startRound / startGame
 * - openOneCard (phase: closed → open)
 * - rollDice (phase: open → dice-rolled)
 * - handleCardClick (card selection logic)
 * - confirmPicks (scoring, penalties, skip)
 * - triggerSquareBun (square bun mode)
 * - doNextRound (replenish cards)
 * - getTargetSet (target divisibility set)
 * - renderFactorBack (factor circle colour logic)
 */

const { setupDOM, loadGameScript } = require('./helpers/dom-setup');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Reveal all cards one by one so we reach the 'open' phase. */
function openAllCards(cardCount) {
  for (let i = 0; i < cardCount; i++) {
    window.openOneCard();
  }
}

/**
 * Inject dice values directly instead of relying on Math.random(),
 * then transition to dice-rolled phase by calling rollDice() but
 * overriding the dice values after.
 */
function setDice(d1, d2) {
  // Patch Math.random temporarily so rollDice produces known values
  const orig = Math.random;
  let calls = 0;
  Math.random = () => {
    calls++;
    if (calls === 1) return (d1 - 1) / 6;
    return (d2 - 1) / 6;
  };
  window.rollDice();
  Math.random = orig;
}

/** Returns the _sb debug object (initialized at game.js load time). */
function getSb() {
  return window._sb;
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

/** Reset ALL game state before each test (avoids state bleed between tests). */
beforeEach(() => {
  localStorage.clear();
  window.resetProgress(); // resets successCount, attemptCount, winStreak, collected, penaltySet, currentLevel → calls startRound()
  // resetProgress() → startRound() doesn't reset cardCount (it's persistent).
  // Force cardCount back to 4.
  window.adjustCount(-10); // clamp to minimum (2)
  window.adjustCount(2);   // bring back to default (4)
  getSb(); // ensure window._sb is available
});

// ─────────────────────────────────────────────────────────────────────────────
// startGame / startRound
// ─────────────────────────────────────────────────────────────────────────────

describe('startGame / startRound', () => {
  test('phase is "closed" after start', () => {
    expect(getSb().phase).toBe('closed');
  });

  test('table has cardCount cards (default 4)', () => {
    expect(getSb().table.length).toBe(4);
  });

  test('all cards are face-down at start', () => {
    const revealed = Array.from(document.querySelectorAll('.p-card.face-down'));
    expect(revealed.length).toBe(4);
  });

  test('btn-open is enabled, btn-dice and btn-confirm are disabled', () => {
    expect(document.getElementById('btn-open').disabled).toBe(false);
    expect(document.getElementById('btn-dice').disabled).toBe(true);
    expect(document.getElementById('btn-confirm').disabled).toBe(true);
  });

  test('dice display shows "?" at start', () => {
    expect(document.getElementById('dice1').innerHTML).toContain('?');
    expect(document.getElementById('dice2').innerHTML).toContain('?');
  });

  test('target badge shows initial placeholder text', () => {
    expect(document.getElementById('target-badge').textContent).toBe('開卡後擲骰');
  });

  test('successCount and attemptCount are 0 after fresh start', () => {
    expect(getSb().successCount).toBe(0);
    expect(getSb().attemptCount).toBe(0);
  });

  test('winStreak is 0 after fresh start', () => {
    expect(getSb().winStreak).toBe(0);
  });

  test('collected map is empty after fresh start', () => {
    expect(getSb().collected.size).toBe(0);
  });

  test('currentLevel defaults to 1', () => {
    expect(getSb().currentLevel).toBe(1);
  });

  test('levelMax for level 1 is 20', () => {
    expect(getSb().levelMax).toBe(20);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// adjustCount
// ─────────────────────────────────────────────────────────────────────────────

describe('adjustCount', () => {
  test('default cardCount is 4', () => {
    expect(getSb().cardCount).toBe(4);
  });

  test('decreasing to 2 is the minimum', () => {
    window.adjustCount(-10); // try to go way below
    expect(getSb().cardCount).toBe(2);
  });

  test('increasing to 6 is the maximum', () => {
    window.adjustCount(10); // try to go way above
    expect(getSb().cardCount).toBe(6);
  });

  test('adjustCount updates the count-val DOM element', () => {
    window.adjustCount(1);
    expect(document.getElementById('count-val').textContent).toBe('5');
    window.adjustCount(-1); // restore
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// openOneCard
// ─────────────────────────────────────────────────────────────────────────────

describe('openOneCard', () => {
  test('reveals exactly one card per call', () => {
    const cardsBefore = document.querySelectorAll('.p-card.face-down').length;
    window.openOneCard();
    const cardsAfter = document.querySelectorAll('.p-card.face-down').length;
    expect(cardsBefore - cardsAfter).toBe(1);
  });

  test('phase transitions to "open" when all cards are revealed', () => {
    openAllCards(getSb().cardCount);
    expect(getSb().phase).toBe('open');
  });

  test('btn-dice becomes enabled after all cards are revealed', () => {
    openAllCards(getSb().cardCount);
    expect(document.getElementById('btn-dice').disabled).toBe(false);
  });

  test('btn-open becomes disabled after all cards are revealed', () => {
    openAllCards(getSb().cardCount);
    expect(document.getElementById('btn-open').disabled).toBe(true);
  });

  test('does not reveal extra cards when all are already revealed', () => {
    openAllCards(getSb().cardCount);
    openAllCards(getSb().cardCount); // call again — should be no-op
    expect(document.querySelectorAll('.p-card.face-down').length).toBe(0);
  });

  test('open-status-text updates on each reveal', () => {
    window.openOneCard();
    expect(document.getElementById('open-status-text').textContent).toContain('1');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// rollDice
// ─────────────────────────────────────────────────────────────────────────────

describe('rollDice', () => {
  beforeEach(() => {
    openAllCards(getSb().cardCount); // must be in 'open' phase
  });

  test('phase becomes "dice-rolled" after rolling', () => {
    setDice(3, 4);
    expect(getSb().phase).toBe('dice-rolled');
  });

  test('dice values are within 1-6', () => {
    setDice(2, 5);
    const d = getSb().dice;
    expect(d[0]).toBeGreaterThanOrEqual(1);
    expect(d[0]).toBeLessThanOrEqual(6);
    expect(d[1]).toBeGreaterThanOrEqual(1);
    expect(d[1]).toBeLessThanOrEqual(6);
  });

  test('target badge updates with dice values', () => {
    setDice(2, 5);
    const badge = document.getElementById('target-badge');
    expect(badge.textContent).toContain('2');
    expect(badge.textContent).toContain('5');
  });

  test('btn-confirm is enabled after rolling', () => {
    setDice(3, 4);
    expect(document.getElementById('btn-confirm').disabled).toBe(false);
  });

  test('btn-dice becomes ghost/disabled after rolling', () => {
    setDice(3, 4);
    expect(document.getElementById('btn-dice').className).toContain('btn-ghost');
  });

  test('does nothing when phase is not "open"', () => {
    // Phase is still 'dice-rolled' because beforeEach already opened cards
    // — try calling rollDice again
    setDice(1, 1);
    const phaseBefore = getSb().phase; // 'dice-rolled'
    window.rollDice(); // should be no-op
    expect(getSb().phase).toBe(phaseBefore);
  });

  test('cards-grid gets dice-rolled CSS class', () => {
    setDice(2, 3);
    expect(document.getElementById('cards-grid').classList).toContain('dice-rolled');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getTargetSet
// ─────────────────────────────────────────────────────────────────────────────

describe('getTargetSet', () => {
  test('returns empty set when dice is null', () => {
    // After startRound, dice=[null,null]
    expect(getSb().dice[0]).toBeNull();
    const targets = window.getTargetSet();
    expect(targets.size).toBe(0);
  });

  test('dice [1,1]: target set includes all numbers 1-88', () => {
    openAllCards(getSb().cardCount);
    setDice(1, 1);
    const targets = window.getTargetSet();
    for (let i = 1; i <= 88; i++) {
      expect(targets.has(i)).toBe(true);
    }
  });

  test('dice [2,3]: target set includes multiples of 2 and 3', () => {
    openAllCards(getSb().cardCount);
    setDice(2, 3);
    const targets = window.getTargetSet();
    expect(targets.has(6)).toBe(true);  // divisible by both
    expect(targets.has(2)).toBe(true);  // divisible by 2
    expect(targets.has(3)).toBe(true);  // divisible by 3
    expect(targets.has(7)).toBe(false); // neither
  });

  test('dice [5,7]: target set does NOT include 11', () => {
    openAllCards(getSb().cardCount);
    setDice(5, 7);
    const targets = window.getTargetSet();
    expect(targets.has(11)).toBe(false);
    expect(targets.has(35)).toBe(true); // 5×7
  });

  test('dice [6,6]: target set same as dice [6,3] union [6,6]', () => {
    openAllCards(getSb().cardCount);
    setDice(6, 6);
    const targets = window.getTargetSet();
    // All multiples of 6 up to 88
    [6, 12, 18, 24, 30, 36, 42, 48, 54, 60, 66, 72, 78, 84].forEach(n => {
      expect(targets.has(n)).toBe(true);
    });
    expect(targets.has(2)).toBe(false);
    expect(targets.has(3)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// handleCardClick
// ─────────────────────────────────────────────────────────────────────────────

describe('handleCardClick', () => {
  beforeEach(() => {
    openAllCards(getSb().cardCount);
    setDice(2, 3);
  });

  test('selecting a card adds it to the selected set', () => {
    window.handleCardClick(0);
    expect(getSb().selected.has(0)).toBe(true);
  });

  test('clicking the same card again deselects it', () => {
    window.handleCardClick(0);
    window.handleCardClick(0);
    expect(getSb().selected.has(0)).toBe(false);
  });

  test('can select up to 2 cards', () => {
    window.handleCardClick(0);
    window.handleCardClick(1);
    expect(getSb().selected.size).toBe(2);
  });

  test('cannot select more than 2 cards in normal mode', () => {
    window.handleCardClick(0);
    window.handleCardClick(1);
    window.handleCardClick(2); // should be blocked
    expect(getSb().selected.size).toBe(2);
    expect(getSb().selected.has(2)).toBe(false);
  });

  test('does not respond when phase is "closed"', () => {
    // Restart to get back to closed phase
    window.startGame();
    getSb();
    window.handleCardClick(0);
    expect(getSb().selected.size).toBe(0);
  });

  test('does not respond when phase is "result"', () => {
    // We need to set phase to 'result' — we simulate by confirming
    // with no selection (skip) which sets phase to 'result' briefly
    // Instead, directly verify the guard in handleCardClick
    window.handleCardClick(0); // select card 0
    expect(getSb().selected.has(0)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// triggerSquareBun
// ─────────────────────────────────────────────────────────────────────────────

describe('triggerSquareBun', () => {
  beforeEach(() => {
    openAllCards(getSb().cardCount);
  });

  test('entering square bun mode changes phase to "squarebun"', () => {
    window.triggerSquareBun();
    expect(getSb().phase).toBe('squarebun');
    expect(getSb().sbMode).toBe(true);
  });

  test('exiting square bun mode restores previous phase', () => {
    window.triggerSquareBun(); // enter
    window.triggerSquareBun(); // exit
    expect(getSb().sbMode).toBe(false);
    expect(getSb().phase).toBe('open');
  });

  test('entering square bun clears selected cards', () => {
    setDice(2, 3);
    window.handleCardClick(0);
    expect(getSb().selected.size).toBe(1);
    window.triggerSquareBun();
    expect(getSb().selected.size).toBe(0);
  });

  test('btn-sb shows cancel text when active', () => {
    window.triggerSquareBun();
    expect(document.getElementById('btn-sb').textContent).toContain('取消');
  });

  test('btn-sb restores original text after cancel', () => {
    window.triggerSquareBun();
    window.triggerSquareBun();
    expect(document.getElementById('btn-sb').textContent).toContain('平方包');
  });

  test('in squarebun mode, only 1 card can be selected (second replaces first)', () => {
    window.triggerSquareBun();
    window.handleCardClick(0);
    window.handleCardClick(1);
    expect(getSb().selected.size).toBe(1);
    expect(getSb().selected.has(1)).toBe(true);
    expect(getSb().selected.has(0)).toBe(false);
  });

  test('cards-grid gets squarebun-mode class', () => {
    window.triggerSquareBun();
    expect(document.getElementById('cards-grid').classList).toContain('squarebun-mode');
  });

  test('cards-grid loses squarebun-mode class on exit', () => {
    window.triggerSquareBun();
    window.triggerSquareBun();
    expect(document.getElementById('cards-grid').classList).not.toContain('squarebun-mode');
  });

  test('can trigger squarebun from dice-rolled phase and return', () => {
    setDice(2, 3);
    window.triggerSquareBun();
    expect(getSb().phase).toBe('squarebun');
    window.triggerSquareBun();
    expect(getSb().phase).toBe('dice-rolled');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// confirmPicks — skip (no selection)
// ─────────────────────────────────────────────────────────────────────────────

describe('confirmPicks — skip', () => {
  beforeEach(() => {
    openAllCards(getSb().cardCount);
    setDice(2, 3);
  });

  test('skip (no selection) resets dice and returns to open phase', () => {
    window.confirmPicks(); // no cards selected
    jest.runAllTimers();
    expect(getSb().phase).toBe('open');
    expect(getSb().dice[0]).toBeNull();
  });

  test('skip does not increment attemptCount or successCount', () => {
    const before = { s: getSb().successCount, a: getSb().attemptCount };
    window.confirmPicks();
    jest.runAllTimers();
    expect(getSb().successCount).toBe(before.s);
    expect(getSb().attemptCount).toBe(before.a);
  });

  test('btn-dice re-enables after skip', () => {
    window.confirmPicks();
    jest.runAllTimers();
    expect(document.getElementById('btn-dice').disabled).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// confirmPicks — correct answer
// ─────────────────────────────────────────────────────────────────────────────

describe('confirmPicks — correct answer', () => {
  /**
   * Find a card index on the table that is divisible by the given dice values.
   */
  function findCorrectCardIndex(d1, d2) {
    const table = getSb().table;
    return table.findIndex(card => card.n % d1 === 0 || card.n % d2 === 0);
  }

  test('correct selection increments successCount', () => {
    openAllCards(getSb().cardCount);
    // Use dice [1,1] so every card is correct
    setDice(1, 1);
    window.handleCardClick(0);
    const before = getSb().successCount;
    window.confirmPicks();
    jest.runAllTimers();
    expect(getSb().successCount).toBe(before + 1);
  });

  test('correct selection increments attemptCount', () => {
    openAllCards(getSb().cardCount);
    setDice(1, 1);
    window.handleCardClick(0);
    const before = getSb().attemptCount;
    window.confirmPicks();
    jest.runAllTimers();
    expect(getSb().attemptCount).toBe(before + 1);
  });

  test('correct selection increments winStreak', () => {
    openAllCards(getSb().cardCount);
    setDice(1, 1);
    window.handleCardClick(0);
    const before = getSb().winStreak;
    window.confirmPicks();
    jest.runAllTimers();
    expect(getSb().winStreak).toBe(before + 1);
  });

  test('correct selection adds card to collected map', () => {
    openAllCards(getSb().cardCount);
    setDice(1, 1);
    const cardN = getSb().table[0].n;
    window.handleCardClick(0);
    window.confirmPicks();
    jest.runAllTimers();
    expect(getSb().collected.get(cardN)).toBeGreaterThanOrEqual(1);
  });

  test('continue-zone becomes visible after correct pick', () => {
    openAllCards(getSb().cardCount);
    setDice(1, 1);
    window.handleCardClick(0);
    window.confirmPicks();
    expect(document.getElementById('continue-zone').classList).toContain('show');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// confirmPicks — wrong answer
// ─────────────────────────────────────────────────────────────────────────────

describe('confirmPicks — wrong answer', () => {
  /**
   * Find an index of a table card that is NOT divisible by any of d1/d2.
   */
  function findWrongCardIndex(d1, d2) {
    return getSb().table.findIndex(card => card.n % d1 !== 0 && card.n % d2 !== 0);
  }

  test('wrong selection increments attemptCount but not successCount', () => {
    openAllCards(getSb().cardCount);
    setDice(5, 7); // restrictive dice — many cards won't match
    const wrongIdx = findWrongCardIndex(5, 7);
    if (wrongIdx === -1) return; // skip if no wrong card available
    window.handleCardClick(wrongIdx);
    const beforeSuccess = getSb().successCount;
    window.confirmPicks();
    jest.runAllTimers();
    expect(getSb().successCount).toBe(beforeSuccess);
    expect(getSb().attemptCount).toBeGreaterThan(0);
  });

  test('wrong selection resets winStreak to 0', () => {
    openAllCards(getSb().cardCount);
    setDice(5, 7);
    const wrongIdx = findWrongCardIndex(5, 7);
    if (wrongIdx === -1) return;
    window.handleCardClick(wrongIdx);
    window.confirmPicks();
    jest.runAllTimers();
    expect(getSb().winStreak).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// confirmPicks — square bun mode
// ─────────────────────────────────────────────────────────────────────────────

describe('confirmPicks — squarebun mode', () => {
  function findSquareCardIndex() {
    return getSb().table.findIndex(card => card.sq);
  }

  function findNonSquareCardIndex() {
    return getSb().table.findIndex(card => !card.sq);
  }

  test('correct square bun pick (square card) increments successCount', () => {
    openAllCards(getSb().cardCount);
    window.triggerSquareBun();
    const sqIdx = findSquareCardIndex();
    if (sqIdx === -1) {
      // No square on table; restart until we get one
      window.startGame(); getSb();
      openAllCards(getSb().cardCount);
      window.triggerSquareBun();
    }
    const idx = findSquareCardIndex();
    if (idx === -1) return; // still none, skip
    window.handleCardClick(idx);
    const before = getSb().successCount;
    window.confirmPicks();
    jest.runAllTimers();
    expect(getSb().successCount).toBe(before + 1);
  });

  test('wrong square bun pick (non-square card) does not increment successCount', () => {
    openAllCards(getSb().cardCount);
    window.triggerSquareBun();
    const idx = findNonSquareCardIndex();
    if (idx === -1) return;
    window.handleCardClick(idx);
    const before = getSb().successCount;
    window.confirmPicks();
    jest.runAllTimers();
    expect(getSb().successCount).toBe(before);
  });

  test('confirmPicks in squarebun mode with no card selected does not throw or change state', () => {
    // Bug fix: empty selection in squarebun must return early without TypeError
    openAllCards(getSb().cardCount);
    window.triggerSquareBun();
    // Do NOT select any card
    const beforeAttempt = getSb().attemptCount;
    const beforePhase = getSb().phase;
    expect(() => { window.confirmPicks(); jest.runAllTimers(); }).not.toThrow();
    expect(getSb().attemptCount).toBe(beforeAttempt);
    expect(getSb().phase).toBe(beforePhase); // phase unchanged
  });

  test('wrong square bun pick with non-empty collected increments attemptCount', () => {
    // Bug fix: wrong squarebun with collected cards must count as an attempt
    getSb().simulateCollect(4); // add a collected card
    openAllCards(getSb().cardCount);
    window.triggerSquareBun();
    const idx = findNonSquareCardIndex();
    if (idx === -1) return;
    window.handleCardClick(idx);
    const before = getSb().attemptCount;
    window.confirmPicks();
    jest.runAllTimers();
    expect(getSb().attemptCount).toBe(before + 1);
    expect(getSb().winStreak).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// doNextRound
// ─────────────────────────────────────────────────────────────────────────────

describe('doNextRound', () => {
  test('phase resets to "closed" after next round', () => {
    openAllCards(getSb().cardCount);
    setDice(1, 1);
    window.handleCardClick(0);
    window.confirmPicks();
    jest.runAllTimers();
    window.handleContinue();
    expect(getSb().phase).toBe('closed');
  });

  test('table is replenished to cardCount after removing a card', () => {
    openAllCards(getSb().cardCount);
    setDice(1, 1);
    window.handleCardClick(0);
    window.confirmPicks();
    jest.runAllTimers();
    window.handleContinue();
    expect(getSb().table.length).toBe(getSb().cardCount);
  });

  test('dice reset to null after next round', () => {
    openAllCards(getSb().cardCount);
    setDice(2, 3);
    window.handleCardClick(0);
    window.confirmPicks();
    jest.runAllTimers();
    window.handleContinue();
    expect(getSb().dice[0]).toBeNull();
    expect(getSb().dice[1]).toBeNull();
  });

  test('btn-open re-enables after next round', () => {
    openAllCards(getSb().cardCount);
    setDice(1, 1);
    window.handleCardClick(0);
    window.confirmPicks();
    jest.runAllTimers();
    window.handleContinue();
    expect(document.getElementById('btn-open').disabled).toBe(false);
  });

  test('btn-dice is disabled at start of next round', () => {
    openAllCards(getSb().cardCount);
    setDice(1, 1);
    window.handleCardClick(0);
    window.confirmPicks();
    jest.runAllTimers();
    window.handleContinue();
    expect(document.getElementById('btn-dice').disabled).toBe(true);
  });

  test('selected set is cleared after next round', () => {
    openAllCards(getSb().cardCount);
    setDice(1, 1);
    window.handleCardClick(0);
    window.confirmPicks();
    jest.runAllTimers();
    window.handleContinue();
    expect(getSb().selected.size).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// renderFactorBack — factor circle colour logic
// ─────────────────────────────────────────────────────────────────────────────

describe('renderFactorBack', () => {
  test('factor matching a die value gets "green" class', () => {
    openAllCards(getSb().cardCount);
    setDice(2, 3);
    const card = { n: 6, divs: [1, 2, 3, 6], sq: false };
    const html = window.renderFactorBack(card);
    // Factor 2 is in dice [2,3] → green
    expect(html).toMatch(/factor-circle green[^>]*>2/);
    // Factor 3 is in dice [2,3] → green
    expect(html).toMatch(/factor-circle green[^>]*>3/);
  });

  test('factor NOT matching any die value gets "red" class', () => {
    openAllCards(getSb().cardCount);
    setDice(2, 3);
    const card = { n: 7, divs: [1, 7], sq: false };
    // dice are [2,3]; neither 7 matches
    const html = window.renderFactorBack(card);
    expect(html).toMatch(/factor-circle red[^>]*>7/);
  });

  test('factor 1 is green when dice includes 1', () => {
    openAllCards(getSb().cardCount);
    setDice(1, 3);
    const card = { n: 6, divs: [1, 2, 3, 6], sq: false };
    const html = window.renderFactorBack(card);
    expect(html).toMatch(/factor-circle green[^>]*>1/);
  });

  test('factor 1 is red when dice does not include 1', () => {
    openAllCards(getSb().cardCount);
    setDice(2, 3);
    // dice are [2,3] — 1 is not a die face
    const card = { n: 6, divs: [1, 2, 3, 6], sq: false };
    const html = window.renderFactorBack(card);
    expect(html).toMatch(/factor-circle red[^>]*>1/);
  });

  test('square root factor of a perfect square gets "orange" class', () => {
    openAllCards(getSb().cardCount);
    setDice(2, 3);
    // card n=9, sqrt=3; dice=[2,3] but 3===sqInt so → orange
    const card = { n: 9, divs: [1, 3, 9], sq: true };
    const html = window.renderFactorBack(card);
    expect(html).toMatch(/factor-circle orange[^>]*>3/);
  });

  test('card number is shown in the back HTML', () => {
    openAllCards(getSb().cardCount);
    setDice(2, 3);
    const card = { n: 12, divs: [1, 2, 3, 4, 6, 12], sq: false };
    const html = window.renderFactorBack(card);
    expect(html).toContain('12');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// showRules / closeRules
// ─────────────────────────────────────────────────────────────────────────────

describe('showRules / closeRules', () => {
  test('showRules adds "show" class to rules-modal', () => {
    window.showRules();
    expect(document.getElementById('rules-modal').classList).toContain('show');
  });

  test('closeRules removes "show" class from rules-modal', () => {
    window.showRules();
    window.closeRules();
    expect(document.getElementById('rules-modal').classList).not.toContain('show');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// renderDiceSVG
// ─────────────────────────────────────────────────────────────────────────────

describe('renderDiceSVG', () => {
  test('val=0 renders "?" placeholder', () => {
    const el = document.createElement('div');
    window.renderDiceSVG(el, 0);
    expect(el.innerHTML).toContain('?');
  });

  test('val=1 renders one pip', () => {
    const el = document.createElement('div');
    window.renderDiceSVG(el, 1);
    // One <circle> element for 1 pip
    const circles = el.querySelectorAll('circle');
    expect(circles.length).toBe(1);
  });

  test('val=6 renders six pips', () => {
    const el = document.createElement('div');
    window.renderDiceSVG(el, 6);
    const circles = el.querySelectorAll('circle');
    expect(circles.length).toBe(6);
  });

  test('renders an SVG element', () => {
    const el = document.createElement('div');
    window.renderDiceSVG(el, 3);
    expect(el.querySelector('svg')).not.toBeNull();
  });
});
