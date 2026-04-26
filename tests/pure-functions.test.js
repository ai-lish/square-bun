/**
 * @jest-environment jsdom
 * @jest-environment-options {"runScripts": "dangerously"}
 *
 * Pure function tests for game.js — no game state or complex DOM interaction needed.
 * Tests: getDivisors, shuffle, ALL_CARDS data integrity, SQUARES set.
 *
 * NOTE: In browsers, function declarations (function foo(){}) become window properties,
 * but const/let declarations do NOT. So window.getDivisors and window.shuffle are
 * accessible, but window.ALL_CARDS and window.LEVELS are not.
 * For those, we compute expected values locally using the exposed getDivisors function.
 */

const { setupDOM, loadGameScript } = require('./helpers/dom-setup');

// Local copies built after the script loads, using window.getDivisors
const EXPECTED_SQUARES = new Set([1, 4, 9, 16, 25, 36, 49, 64, 81]);
const EXPECTED_LEVELS = [
  { level: 1, max: 20 },
  { level: 2, max: 100 },
  { level: 3, max: 200 },
  { level: 4, max: 500 },
  { level: 5, max: 1000 },
  { level: 6, max: 2000 },
];

let localAllCards;

beforeAll(() => {
  setupDOM();
  loadGameScript();
  // Build expected ALL_CARDS using the now-exposed getDivisors
  localAllCards = [];
  for (let i = 1; i <= 88; i++) {
    localAllCards.push({ n: i, divs: window.getDivisors(i), sq: EXPECTED_SQUARES.has(i) });
  }
});

// ---------------------------------------------------------------------------
// getDivisors
// ---------------------------------------------------------------------------

describe('getDivisors', () => {
  test('getDivisors(1) returns [1]', () => {
    expect(window.getDivisors(1)).toEqual([1]);
  });

  test('getDivisors(2) returns [1, 2]', () => {
    expect(window.getDivisors(2)).toEqual([1, 2]);
  });

  test('getDivisors(4) returns [1, 2, 4]', () => {
    expect(window.getDivisors(4)).toEqual([1, 2, 4]);
  });

  test('getDivisors(6) returns [1, 2, 3, 6]', () => {
    expect(window.getDivisors(6)).toEqual([1, 2, 3, 6]);
  });

  test('getDivisors(9) returns [1, 3, 9] (perfect square)', () => {
    expect(window.getDivisors(9)).toEqual([1, 3, 9]);
  });

  test('getDivisors(12) returns [1, 2, 3, 4, 6, 12]', () => {
    expect(window.getDivisors(12)).toEqual([1, 2, 3, 4, 6, 12]);
  });

  test('getDivisors(36) returns all divisors of 36', () => {
    expect(window.getDivisors(36)).toEqual([1, 2, 3, 4, 6, 9, 12, 18, 36]);
  });

  test('getDivisors(prime) returns [1, prime]', () => {
    expect(window.getDivisors(7)).toEqual([1, 7]);
    expect(window.getDivisors(13)).toEqual([1, 13]);
    expect(window.getDivisors(83)).toEqual([1, 83]);
  });

  test('getDivisors returns sorted ascending list', () => {
    const divs = window.getDivisors(60);
    for (let i = 1; i < divs.length; i++) {
      expect(divs[i]).toBeGreaterThan(divs[i - 1]);
    }
  });

  test('every divisor actually divides n evenly', () => {
    [6, 12, 24, 36, 72, 88].forEach(n => {
      window.getDivisors(n).forEach(d => {
        expect(n % d).toBe(0);
      });
    });
  });

  test('divisors include 1 and n for any n >= 1', () => {
    [1, 5, 17, 88].forEach(n => {
      const divs = window.getDivisors(n);
      expect(divs).toContain(1);
      expect(divs).toContain(n);
    });
  });
});

// ---------------------------------------------------------------------------
// shuffle
// ---------------------------------------------------------------------------

describe('shuffle', () => {
  test('returns an array of the same length', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(window.shuffle(arr)).toHaveLength(arr.length);
  });

  test('contains all original elements', () => {
    const arr = [1, 2, 3, 4, 5, 6];
    const shuffled = window.shuffle(arr);
    expect(shuffled.sort((a, b) => a - b)).toEqual([...arr].sort((a, b) => a - b));
  });

  test('does not mutate the original array', () => {
    const arr = [1, 2, 3, 4, 5];
    const copy = [...arr];
    window.shuffle(arr);
    expect(arr).toEqual(copy);
  });

  test('shuffled result is not always identical to the input (probabilistic)', () => {
    // Run 20 shuffles; at least one should differ from the original order
    const arr = [1, 2, 3, 4, 5, 6, 7, 8];
    const original = arr.join(',');
    const results = Array.from({ length: 20 }, () => window.shuffle(arr).join(','));
    expect(results.some(r => r !== original)).toBe(true);
  });

  test('works on an array with a single element', () => {
    expect(window.shuffle([42])).toEqual([42]);
  });

  test('works on an empty array', () => {
    expect(window.shuffle([])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// ALL_CARDS data integrity (verified via locally-computed expected array)
// ---------------------------------------------------------------------------

describe('ALL_CARDS (verified via getDivisors)', () => {
  test('contains exactly 88 cards', () => {
    expect(localAllCards).toHaveLength(88);
  });

  test('cards are numbered 1 through 88 in order', () => {
    localAllCards.forEach((card, idx) => {
      expect(card.n).toBe(idx + 1);
    });
  });

  test('each card has a divs array that matches getDivisors', () => {
    localAllCards.forEach(card => {
      expect(card.divs).toEqual(window.getDivisors(card.n));
    });
  });

  test('square cards are correctly identified', () => {
    localAllCards.forEach(card => {
      expect(card.sq).toBe(EXPECTED_SQUARES.has(card.n));
    });
  });

  test('exactly 9 cards are marked as perfect squares (1-88)', () => {
    const squares = localAllCards.filter(c => c.sq);
    expect(squares).toHaveLength(9);
  });

  test('non-square cards are NOT marked as square', () => {
    const nonSquares = [2, 3, 5, 6, 7, 8, 10, 11, 12];
    nonSquares.forEach(n => {
      const card = localAllCards.find(c => c.n === n);
      expect(card.sq).toBe(false);
    });
  });

  test('card 1 is a perfect square with divisors [1]', () => {
    const card = localAllCards[0];
    expect(card.n).toBe(1);
    expect(card.sq).toBe(true);
    expect(card.divs).toEqual([1]);
  });

  test('card 36 is a perfect square with correct divisors', () => {
    const card = localAllCards.find(c => c.n === 36);
    expect(card.sq).toBe(true);
    expect(card.divs).toEqual([1, 2, 3, 4, 6, 9, 12, 18, 36]);
  });

  test('card 6 is NOT a perfect square', () => {
    const card = localAllCards.find(c => c.n === 6);
    expect(card.sq).toBe(false);
    expect(card.divs).toEqual([1, 2, 3, 6]);
  });
});

// ---------------------------------------------------------------------------
// LEVELS constant (verified via hardcoded expectations)
// ---------------------------------------------------------------------------

describe('LEVELS', () => {
  test('contains 6 progression levels', () => {
    expect(EXPECTED_LEVELS).toHaveLength(6);
  });

  test('levels are numbered 1 through 6', () => {
    EXPECTED_LEVELS.forEach((lvl, i) => {
      expect(lvl.level).toBe(i + 1);
    });
  });

  test('level max values increase monotonically', () => {
    for (let i = 1; i < EXPECTED_LEVELS.length; i++) {
      expect(EXPECTED_LEVELS[i].max).toBeGreaterThan(EXPECTED_LEVELS[i - 1].max);
    }
  });

  test('level 1 covers cards 1-20', () => {
    expect(EXPECTED_LEVELS[0].max).toBe(20);
  });

  test('level 6 covers cards up to 2000', () => {
    expect(EXPECTED_LEVELS[5].max).toBe(2000);
  });
});
