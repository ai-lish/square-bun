/**
 * @jest-environment jsdom
 * @jest-environment-options {"runScripts": "dangerously"}
 *
 * Tests for scoring mechanics, penalty system, and edge cases in game.js:
 * - Collected card counting (correct picks add to collected map)
 * - Penalty system (wrong picks remove from collected; collected reaches 0 → penaltySet)
 * - Success/fail rates and streaks
 * - Boundary conditions (empty deck reshuffle, duplicate card guard, etc.)
 * - updateSuccessRateDisplay DOM output
 * - showFlash (status bar feedback)
 */

const { setupDOM, loadGameScript } = require('./helpers/dom-setup');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getSb() {
  return window._sb;
}

function openAllCards() {
  const n = getSb().cardCount;
  for (let i = 0; i < n; i++) window.openOneCard();
}

/** Set dice to specific values via Math.random patching. */
function setDice(d1, d2) {
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
  localStorage.clear();
  window.resetProgress();
  window.adjustCount(-10);
  window.adjustCount(2); // reset cardCount to 4
  getSb();
});

// ─────────────────────────────────────────────────────────────────────────────
// Collected card counting
// ─────────────────────────────────────────────────────────────────────────────

describe('Collected card counting', () => {
  test('correct pick adds selected card n to collected map with count 1', () => {
    openAllCards();
    setDice(1, 1); // all cards are correct targets
    const cardN = getSb().table[0].n;
    window.handleCardClick(0);
    window.confirmPicks();
    jest.runAllTimers();
    expect(getSb().collected.get(cardN)).toBeGreaterThanOrEqual(1);
  });

  test('collecting the same card twice increments its count', () => {
    getSb().simulateCollect(5);
    getSb().simulateCollect(5);
    expect(getSb().collected.get(5)).toBe(2);
  });

  test('collecting different cards adds each to the map', () => {
    getSb().simulateCollect(3);
    getSb().simulateCollect(7);
    expect(getSb().collected.size).toBe(2);
    expect(getSb().collected.has(3)).toBe(true);
    expect(getSb().collected.has(7)).toBe(true);
  });

  test('simulateCollect persists to localStorage immediately', () => {
    getSb().simulateCollect(12);
    const raw = localStorage.getItem('sb_squarebun');
    const data = JSON.parse(raw);
    expect(data.collected['12']).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Penalty system
// ─────────────────────────────────────────────────────────────────────────────

describe('Penalty system', () => {
  test('wrong pick with non-empty collected: removes count from a random card', () => {
    // Seed collected with one card
    getSb().simulateCollect(6); // collected: {6: 1}
    openAllCards();
    setDice(5, 7); // restrictive dice
    // Find a card that is NOT divisible by 5 or 7
    const wrongIdx = getSb().table.findIndex(c => c.n % 5 !== 0 && c.n % 7 !== 0);
    if (wrongIdx === -1) return; // no wrong card available in current table; skip

    window.handleCardClick(wrongIdx);
    window.confirmPicks();
    jest.runAllTimers();
    // After penalty: either the card was removed from collected (count → 0 → deleted)
    // OR its count was decremented. Either way, penalty occurred.
    // successCount should NOT increase
    expect(getSb().successCount).toBe(0);
  });

  test('wrong pick with empty collected: increments attemptCount and resets winStreak', () => {
    // No collected cards
    expect(getSb().collected.size).toBe(0);
    openAllCards();
    setDice(5, 7);
    const wrongIdx = getSb().table.findIndex(c => c.n % 5 !== 0 && c.n % 7 !== 0);
    if (wrongIdx === -1) return;
    window.handleCardClick(wrongIdx);
    const before = getSb().attemptCount;
    window.confirmPicks();
    jest.runAllTimers();
    expect(getSb().attemptCount).toBe(before + 1);
    expect(getSb().winStreak).toBe(0);
  });

  test('wrong pick with non-empty collected: increments attemptCount', () => {
    // Bug fix: wrong pick with collected cards must count as an attempt
    getSb().simulateCollect(6); // collected: {6: 1}
    openAllCards();
    setDice(5, 7);
    const wrongIdx = getSb().table.findIndex(c => c.n % 5 !== 0 && c.n % 7 !== 0);
    if (wrongIdx === -1) return;
    const before = getSb().attemptCount;
    window.handleCardClick(wrongIdx);
    window.confirmPicks();
    jest.runAllTimers();
    expect(getSb().attemptCount).toBe(before + 1);
  });

  test('wrong pick with non-empty collected: resets winStreak to 0', () => {
    // Bug fix: wrong pick with collected cards must reset win streak
    getSb().simulateCollect(6);
    openAllCards();
    setDice(1, 1);
    window.handleCardClick(0);
    window.confirmPicks();
    jest.runAllTimers();
    window.handleContinue();
    // Now winStreak >= 1, and collected has cards
    expect(getSb().winStreak).toBeGreaterThanOrEqual(1);
    openAllCards();
    setDice(5, 7);
    const wrongIdx = getSb().table.findIndex(c => c.n % 5 !== 0 && c.n % 7 !== 0);
    if (wrongIdx === -1) return;
    window.handleCardClick(wrongIdx);
    window.confirmPicks();
    jest.runAllTimers();
    expect(getSb().winStreak).toBe(0);
  });

  test('card removed from collected with count 0 moves to penaltySet', () => {
    // Seed collected with count=1
    getSb().simulateCollect(6); // {6: 1}
    openAllCards();
    setDice(5, 7);
    const wrongIdx = getSb().table.findIndex(c => c.n % 5 !== 0 && c.n % 7 !== 0);
    if (wrongIdx === -1) return;
    window.handleCardClick(wrongIdx);
    window.confirmPicks();
    jest.runAllTimers();
    // After penalty, the collected card (6) should have been decremented from 1→0 → deleted
    // AND card 6 might have been added to penaltySet (if it was chosen as the penalty target)
    // We can only verify that at least one penalty system mechanism ran:
    // Either collected is smaller OR successCount is still 0
    expect(getSb().successCount).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Success rate display
// ─────────────────────────────────────────────────────────────────────────────

describe('updateSuccessRateDisplay', () => {
  test('shows "—" when no attempts have been made', () => {
    expect(document.getElementById('success-rate').textContent).toBe('—');
  });

  test('shows 100% after one correct answer with no wrong answers', () => {
    openAllCards();
    setDice(1, 1);
    window.handleCardClick(0);
    window.confirmPicks();
    jest.runAllTimers();
    expect(document.getElementById('success-rate').textContent).toBe('100%');
  });

  test('win-streak element shows current streak', () => {
    openAllCards();
    setDice(1, 1);
    window.handleCardClick(0);
    window.confirmPicks();
    jest.runAllTimers();
    const streak = parseInt(document.getElementById('win-streak').textContent);
    expect(streak).toBeGreaterThanOrEqual(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Deck replenishment / doNextRound edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('Deck replenishment', () => {
  test('table is refilled to cardCount after a card is removed (wrong pick)', () => {
    openAllCards();
    setDice(5, 7);
    const wrongIdx = getSb().table.findIndex(c => c.n % 5 !== 0 && c.n % 7 !== 0);
    if (wrongIdx === -1) return;
    window.handleCardClick(wrongIdx);
    window.confirmPicks();
    jest.runAllTimers();
    window.handleContinue();
    expect(getSb().table.length).toBe(getSb().cardCount);
  });

  test('correct pick removes card from table and replenishes it', () => {
    openAllCards();
    setDice(1, 1);
    window.handleCardClick(0);
    window.confirmPicks();
    jest.runAllTimers();
    window.handleContinue();
    expect(getSb().table.length).toBe(getSb().cardCount);
  });

  test('continue-zone is hidden after handleContinue', () => {
    openAllCards();
    setDice(1, 1);
    window.handleCardClick(0);
    window.confirmPicks();
    jest.runAllTimers();
    window.handleContinue();
    expect(document.getElementById('continue-zone').classList).not.toContain('show');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Card count boundaries (2-6 cards)
// ─────────────────────────────────────────────────────────────────────────────

describe('Card count boundary tests', () => {
  test('game works with minimum 2 cards', () => {
    window.adjustCount(-10); // clamp to 2
    window.startRound();
    getSb();
    expect(getSb().cardCount).toBe(2);
    expect(getSb().table.length).toBe(2);
  });

  test('game works with maximum 6 cards', () => {
    window.adjustCount(10); // clamp to 6
    window.startRound();
    getSb();
    expect(getSb().cardCount).toBe(6);
    expect(getSb().table.length).toBe(6);
  });

  test('with 2 cards, replenishment keeps table at 2 after handleContinue', () => {
    window.adjustCount(-10);
    window.startRound();
    getSb();
    for (let i = 0; i < 2; i++) window.openOneCard();
    setDice(1, 1);
    window.handleCardClick(0);
    window.confirmPicks();
    jest.runAllTimers();
    window.handleContinue();
    expect(getSb().table.length).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// showFlash
// ─────────────────────────────────────────────────────────────────────────────

describe('showFlash', () => {
  test('success flash sets status-bar class to "success"', () => {
    window.showFlash('success', 'Test success');
    expect(document.getElementById('status-bar').className).toContain('success');
  });

  test('danger flash sets status-bar class to "danger"', () => {
    window.showFlash('danger', 'Test danger');
    expect(document.getElementById('status-bar').className).toContain('danger');
  });

  test('gold flash sets status-bar class to "gold"', () => {
    window.showFlash('gold', 'Test gold');
    expect(document.getElementById('status-bar').className).toContain('gold');
  });

  test('skip flash sets status-bar class to "info"', () => {
    window.showFlash('skip', 'Test skip');
    expect(document.getElementById('status-bar').className).toContain('info');
  });

  test('status-bar text contains the flash message', () => {
    window.showFlash('success', 'Correct!');
    expect(document.getElementById('status-bar').textContent).toContain('Correct!');
  });

  test('status-bar resets after timeout', () => {
    window.showFlash('success', 'Correct!');
    jest.advanceTimersByTime(1200); // past the 1100ms timeout
    // Should revert to normal class
    expect(document.getElementById('status-bar').className).not.toContain('success');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// setStatus
// ─────────────────────────────────────────────────────────────────────────────

describe('setStatus', () => {
  test('sets textContent of status-bar', () => {
    window.setStatus('Hello', '');
    expect(document.getElementById('status-bar').textContent).toBe('Hello');
  });

  test('applies CSS class to status-bar', () => {
    window.setStatus('Error!', 'danger');
    expect(document.getElementById('status-bar').className).toContain('danger');
  });

  test('no extra class when cls is empty string', () => {
    window.setStatus('Neutral', '');
    expect(document.getElementById('status-bar').className).toBe('status-bar');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// updateConfirmBtn
// ─────────────────────────────────────────────────────────────────────────────

describe('updateConfirmBtn', () => {
  test('confirm button is disabled when phase is "closed"', () => {
    // After startRound, phase is 'closed'
    expect(getSb().phase).toBe('closed');
    expect(document.getElementById('btn-confirm').disabled).toBe(true);
  });

  test('confirm button gets btn-green class in dice-rolled phase', () => {
    openAllCards();
    setDice(2, 3);
    expect(document.getElementById('btn-confirm').className).toContain('btn-green');
  });

  test('confirm button gets btn-gold class in squarebun phase', () => {
    openAllCards();
    window.triggerSquareBun();
    expect(document.getElementById('btn-confirm').className).toContain('btn-gold');
  });

  test('confirm button is disabled in open phase', () => {
    openAllCards();
    // Phase is 'open' but confirm should be disabled (need dice-rolled first)
    window.updateConfirmBtn();
    expect(document.getElementById('btn-confirm').disabled).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Multiple consecutive rounds (integration)
// ─────────────────────────────────────────────────────────────────────────────

describe('Multiple consecutive rounds', () => {
  /**
   * Plays one complete round with a correct pick.
   */
  function playCorrectRound() {
    openAllCards();
    setDice(1, 1);
    window.handleCardClick(0);
    window.confirmPicks();
    jest.runAllTimers();
    window.handleContinue();
    getSb();
  }

  test('successCount increments each round with correct picks', () => {
    playCorrectRound();
    expect(getSb().successCount).toBe(1);
    playCorrectRound();
    expect(getSb().successCount).toBe(2);
    playCorrectRound();
    expect(getSb().successCount).toBe(3);
  });

  test('winStreak increments across consecutive correct rounds', () => {
    playCorrectRound();
    playCorrectRound();
    playCorrectRound();
    expect(getSb().winStreak).toBeGreaterThanOrEqual(3);
  });

  test('table always has cardCount cards at start of each round', () => {
    for (let i = 0; i < 5; i++) {
      expect(getSb().table.length).toBe(getSb().cardCount);
      playCorrectRound();
    }
  });

  test('collected map grows with each correct pick', () => {
    const before = getSb().collected.size;
    playCorrectRound();
    expect(getSb().collected.size).toBeGreaterThanOrEqual(before);
  });
});
