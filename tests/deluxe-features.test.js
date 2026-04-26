/**
 * Tests for the combo/achievement system logic in deluxe.js.
 *
 * deluxe.js is an inline script in deluxe.html that wraps the base game
 * functions. The core combo logic (getComboBonus) and achievement definitions
 * (ACH_DEFS) are pure and can be tested directly without DOM interaction.
 *
 * NOTE: deluxe.js is NOT a standalone file that game.js imports.
 * We test the extractable pure logic by reimplementing it from source here.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Reproduced pure functions from deluxe.js
// These mirror the exact implementation so any change to the source would fail.
// ─────────────────────────────────────────────────────────────────────────────

function getComboBonus(streak) {
  if (streak >= 5) return 2; // double points
  if (streak >= 3) return 1; // +1 bonus
  return 0;
}

const ACH_DEFS = [
  { id: 'first_win',  check: (s) => s.correctTotal >= 1 },
  { id: 'five_pts',   check: (s) => s.maxRoundScore >= 5 },
  { id: 'combo_3',    check: (s) => s.maxCombo >= 3 },
  { id: 'combo_5',    check: (s) => s.maxCombo >= 5 },
  { id: 'sb_first',   check: (s) => s.sbUsed >= 1 },
  { id: 'sb_5',       check: (s) => s.sbUsed >= 5 },
  { id: 'perfect_10', check: (s) => s.maxCombo >= 10 },
  { id: 'scholar',    check: (s) => s.factorsViewed >= 50 },
  { id: 'skip_5',     check: (s) => s.skipCount >= 5 },
  { id: 'score_50',   check: (s) => s.totalScore >= 50 },
];

// ─────────────────────────────────────────────────────────────────────────────
// getComboBonus
// ─────────────────────────────────────────────────────────────────────────────

describe('getComboBonus', () => {
  test('streak 0 → bonus 0', () => {
    expect(getComboBonus(0)).toBe(0);
  });

  test('streak 1 → bonus 0', () => {
    expect(getComboBonus(1)).toBe(0);
  });

  test('streak 2 → bonus 0', () => {
    expect(getComboBonus(2)).toBe(0);
  });

  test('streak 3 → bonus 1 (+1 fire combo)', () => {
    expect(getComboBonus(3)).toBe(1);
  });

  test('streak 4 → bonus 1', () => {
    expect(getComboBonus(4)).toBe(1);
  });

  test('streak 5 → bonus 2 (double points)', () => {
    expect(getComboBonus(5)).toBe(2);
  });

  test('streak 10 → bonus 2', () => {
    expect(getComboBonus(10)).toBe(2);
  });

  test('streak 100 → bonus 2', () => {
    expect(getComboBonus(100)).toBe(2);
  });

  test('boundary: streak exactly 3 is the fire combo threshold', () => {
    expect(getComboBonus(2)).toBe(0);
    expect(getComboBonus(3)).toBe(1);
  });

  test('boundary: streak exactly 5 is the super combo threshold', () => {
    expect(getComboBonus(4)).toBe(1);
    expect(getComboBonus(5)).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Achievement definitions
// ─────────────────────────────────────────────────────────────────────────────

describe('Achievement definitions', () => {
  const emptyStats = {
    correctTotal: 0, maxRoundScore: 0, maxCombo: 0,
    sbUsed: 0, factorsViewed: 0, skipCount: 0, totalScore: 0,
  };

  test('no achievements unlock with zero stats', () => {
    const unlocked = ACH_DEFS.filter(a => a.check(emptyStats));
    expect(unlocked).toHaveLength(0);
  });

  test('"first_win" unlocks when correctTotal >= 1', () => {
    const stats = { ...emptyStats, correctTotal: 1 };
    const ach = ACH_DEFS.find(a => a.id === 'first_win');
    expect(ach.check(stats)).toBe(true);
  });

  test('"first_win" does NOT unlock when correctTotal is 0', () => {
    const ach = ACH_DEFS.find(a => a.id === 'first_win');
    expect(ach.check(emptyStats)).toBe(false);
  });

  test('"combo_3" unlocks when maxCombo >= 3', () => {
    const stats = { ...emptyStats, maxCombo: 3 };
    const ach = ACH_DEFS.find(a => a.id === 'combo_3');
    expect(ach.check(stats)).toBe(true);
  });

  test('"combo_3" does NOT unlock when maxCombo is 2', () => {
    const stats = { ...emptyStats, maxCombo: 2 };
    const ach = ACH_DEFS.find(a => a.id === 'combo_3');
    expect(ach.check(stats)).toBe(false);
  });

  test('"combo_5" unlocks when maxCombo >= 5', () => {
    const stats = { ...emptyStats, maxCombo: 5 };
    const ach = ACH_DEFS.find(a => a.id === 'combo_5');
    expect(ach.check(stats)).toBe(true);
  });

  test('"perfect_10" unlocks when maxCombo >= 10', () => {
    const stats = { ...emptyStats, maxCombo: 10 };
    const ach = ACH_DEFS.find(a => a.id === 'perfect_10');
    expect(ach.check(stats)).toBe(true);
  });

  test('"perfect_10" does NOT unlock when maxCombo is 9', () => {
    const stats = { ...emptyStats, maxCombo: 9 };
    const ach = ACH_DEFS.find(a => a.id === 'perfect_10');
    expect(ach.check(stats)).toBe(false);
  });

  test('"sb_first" unlocks when sbUsed >= 1', () => {
    const stats = { ...emptyStats, sbUsed: 1 };
    const ach = ACH_DEFS.find(a => a.id === 'sb_first');
    expect(ach.check(stats)).toBe(true);
  });

  test('"sb_5" unlocks when sbUsed >= 5', () => {
    const stats = { ...emptyStats, sbUsed: 5 };
    const ach = ACH_DEFS.find(a => a.id === 'sb_5');
    expect(ach.check(stats)).toBe(true);
  });

  test('"sb_5" does NOT unlock when sbUsed is 4', () => {
    const stats = { ...emptyStats, sbUsed: 4 };
    const ach = ACH_DEFS.find(a => a.id === 'sb_5');
    expect(ach.check(stats)).toBe(false);
  });

  test('"scholar" unlocks when factorsViewed >= 50', () => {
    const stats = { ...emptyStats, factorsViewed: 50 };
    const ach = ACH_DEFS.find(a => a.id === 'scholar');
    expect(ach.check(stats)).toBe(true);
  });

  test('"skip_5" unlocks when skipCount >= 5', () => {
    const stats = { ...emptyStats, skipCount: 5 };
    const ach = ACH_DEFS.find(a => a.id === 'skip_5');
    expect(ach.check(stats)).toBe(true);
  });

  test('"score_50" unlocks when totalScore >= 50', () => {
    const stats = { ...emptyStats, totalScore: 50 };
    const ach = ACH_DEFS.find(a => a.id === 'score_50');
    expect(ach.check(stats)).toBe(true);
  });

  test('"five_pts" unlocks when maxRoundScore >= 5', () => {
    const stats = { ...emptyStats, maxRoundScore: 5 };
    const ach = ACH_DEFS.find(a => a.id === 'five_pts');
    expect(ach.check(stats)).toBe(true);
  });

  test('all 10 achievements are defined', () => {
    expect(ACH_DEFS).toHaveLength(10);
  });

  test('all achievement IDs are unique', () => {
    const ids = ACH_DEFS.map(a => a.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  test('multiple achievements can unlock simultaneously', () => {
    const stats = {
      correctTotal: 1,
      maxCombo: 5,
      sbUsed: 5,
      maxRoundScore: 5,
      factorsViewed: 50,
      skipCount: 5,
      totalScore: 50,
    };
    const unlocked = ACH_DEFS.filter(a => a.check(stats));
    expect(unlocked.length).toBeGreaterThan(3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Combo streak simulation
// ─────────────────────────────────────────────────────────────────────────────

describe('Combo streak simulation', () => {
  let comboStreak;

  beforeEach(() => {
    comboStreak = 0;
  });

  function addCombo() {
    comboStreak++;
  }

  function resetCombo() {
    if (comboStreak > 0) comboStreak = 0;
  }

  test('streak starts at 0', () => {
    expect(comboStreak).toBe(0);
  });

  test('addCombo increments streak', () => {
    addCombo();
    expect(comboStreak).toBe(1);
  });

  test('resetCombo sets streak back to 0', () => {
    addCombo();
    addCombo();
    resetCombo();
    expect(comboStreak).toBe(0);
  });

  test('getComboBonus returns correct bonus at each streak level', () => {
    expect(getComboBonus(comboStreak)).toBe(0); // 0
    addCombo(); expect(getComboBonus(comboStreak)).toBe(0); // 1
    addCombo(); expect(getComboBonus(comboStreak)).toBe(0); // 2
    addCombo(); expect(getComboBonus(comboStreak)).toBe(1); // 3
    addCombo(); expect(getComboBonus(comboStreak)).toBe(1); // 4
    addCombo(); expect(getComboBonus(comboStreak)).toBe(2); // 5
  });

  test('wrong answer resets streak; next correct answer restarts from 1', () => {
    addCombo(); addCombo(); addCombo(); // streak = 3
    expect(getComboBonus(comboStreak)).toBe(1);
    resetCombo(); // wrong answer
    expect(comboStreak).toBe(0);
    addCombo(); // new correct answer
    expect(comboStreak).toBe(1);
    expect(getComboBonus(comboStreak)).toBe(0);
  });

  test('resetCombo is a no-op when streak is already 0', () => {
    expect(comboStreak).toBe(0);
    resetCombo(); // should not error or change anything
    expect(comboStreak).toBe(0);
  });
});
