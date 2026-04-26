    // --- SOUND SYSTEM (Web Audio API - no external files) ---
    let soundEnabled = true;
    let audioCtx = null;
    function getAudioCtx() {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      return audioCtx;
    }
    function toggleSound() {
      soundEnabled = !soundEnabled;
      const btn = document.getElementById('sound-toggle');
      btn.textContent = soundEnabled ? '🔊' : '🔇';
      btn.classList.toggle('muted', !soundEnabled);
    }
    function playTone(freq, type, duration, volume = 0.3) {
      if (!soundEnabled) return;
      try {
        const ctx = getAudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = type; osc.frequency.value = freq;
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.start(); osc.stop(ctx.currentTime + duration);
      } catch(e) {}
    }
    function playCardFlip() { playTone(800, 'sine', 0.08, 0.2); }
    function playDiceRoll() {
      if (!soundEnabled) return;
      try {
        const ctx = getAudioCtx();
        for (let i = 0; i < 6; i++) {
          setTimeout(() => {
            playTone(200 + Math.random() * 400, 'triangle', 0.1, 0.15);
          }, i * 60);
        }
      } catch(e) {}
    }
    function playSelect() { playTone(600, 'sine', 0.1, 0.25); }
    function playDeselect() { playTone(400, 'sine', 0.08, 0.15); }
    function playCorrect() {
      playTone(523, 'sine', 0.15, 0.3);
      setTimeout(() => playTone(659, 'sine', 0.15, 0.3), 100);
      setTimeout(() => playTone(784, 'sine', 0.25, 0.3), 200);
    }
    function playWrong() {
      playTone(200, 'sawtooth', 0.3, 0.3);
      setTimeout(() => playTone(150, 'sawtooth', 0.4, 0.3), 150);
    }
    function playSquareBun() {
      playTone(523, 'sine', 0.15, 0.35);
      setTimeout(() => playTone(659, 'sine', 0.15, 0.35), 100);
      setTimeout(() => playTone(784, 'sine', 0.15, 0.35), 200);
      setTimeout(() => playTone(1047, 'sine', 0.4, 0.35), 300);
    }
    function playCombo() {
      playTone(880, 'sine', 0.1, 0.3);
      setTimeout(() => playTone(1100, 'sine', 0.15, 0.35), 80);
    }
    function playSkip() { playTone(440, 'triangle', 0.2, 0.2); }

    // Hook sounds into existing functions
    const _openOneCard = openOneCard;
    openOneCard = function() {
      _openOneCard();
      playCardFlip();
    };
    const _rollDice = rollDice;
    rollDice = function() {
      playDiceRoll();
      _rollDice();
    };
    const _handleCardClick = handleCardClick;
    handleCardClick = function(i) {
      const wasSelected = selected.has(i);
      _handleCardClick(i);
      if (selected.has(i) !== wasSelected) {
        (selected.has(i) ? playSelect : playDeselect)();
      }
    };
    const _triggerSquareBun = triggerSquareBun;
    triggerSquareBun = function() {
      if (sbMode) { playDeselect(); } else { playSelect(); }
      _triggerSquareBun();
    };

    // --- COMBO SYSTEM ---
    let comboStreak = 0;
    function getComboBonus(streak) {
      if (streak >= 5) return 2; // double points
      if (streak >= 3) return 1; // +1 bonus
      return 0;
    }
    function updateComboDisplay() {
      const el = document.getElementById('combo-display');
      const countEl = document.getElementById('combo-count');
      if (comboStreak >= 2) {
        el.classList.add('active');
        if (comboStreak >= 5) {
          el.className = 'combo-display active super';
          countEl.textContent = comboStreak + 'x';
        } else {
          el.className = 'combo-display active fire';
          countEl.textContent = comboStreak + 'x';
        }
      } else {
        el.classList.remove('active', 'fire', 'super');
      }
    }
    function addCombo() {
      comboStreak++;
      updateComboDisplay();
      if (comboStreak === 3) { playCombo(); showComboFlash('🔥 Combo!', '#ff6b00'); }
      else if (comboStreak >= 5) { playCombo(); showComboFlash('⚡ Super Combo!', '#ffd700'); }
    }
    function resetCombo() {
      if (comboStreak > 0) { comboStreak = 0; updateComboDisplay(); }
    }
    function showComboFlash(text, color) {
      const el = document.createElement('div');
      el.textContent = text;
      el.style.cssText = `position:fixed;top:40%;left:50%;transform:translateX(-50%);font-size:28px;font-weight:900;color:${color};z-index:600;pointer-events:none;animation:comboFlash 1s ease forwards`;
      document.body.appendChild(el);
      setTimeout(()=>el.remove(), 1000);
    }
    const styleEl = document.createElement('style');
    styleEl.textContent = '@keyframes comboFlash { 0%{opacity:1;transform:translateX(-50%) scale(1)} 50%{transform:translateX(-50%) scale(1.3)} 100%{opacity:0;transform:translateX(-50%) translateY(-30px) scale(0.8)} }';
    document.head.appendChild(styleEl);

    // --- ACHIEVEMENT SYSTEM ---
    const ACH_DEFS = [
      { id:'first_win',  emoji:'🌟', name:'初試啼聲', desc:'完成第一個正確回答', check: () => stats.correctTotal >= 1 },
      { id:'five_pts',   emoji:'5️⃣', name:'五分達成', desc:'單次結算獲得5分以上', check: () => stats.maxRoundScore >= 5 },
      { id:'combo_3',    emoji:'🔥', name:'Combo 新手', desc:'達成3連 Combo', check: () => stats.maxCombo >= 3 },
      { id:'combo_5',    emoji:'⚡', name:'Combo 大師', desc:'達成5連 Combo', check: () => stats.maxCombo >= 5 },
      { id:'sb_first',   emoji:'🎤', name:'平方初體驗', desc:'首次使用平方包', check: () => stats.sbUsed >= 1 },
      { id:'sb_5',       emoji:'👑', name:'平方獵人', desc:'使用平方包5次', check: () => stats.sbUsed >= 5 },
      { id:'perfect_10', emoji:'💯', name:'完璧', desc:'連續10次回答正確', check: () => stats.maxCombo >= 10 },
      { id:'scholar',    emoji:'🧮', name:'因數學者', desc:'查看因數顯示50次', check: () => stats.factorsViewed >= 50 },
      { id:'skip_5',     emoji:'⏭️', name:'跳過達人', desc:'跳過（無夾到）5次', check: () => stats.skipCount >= 5 },
      { id:'score_50',  emoji:'🏆', name:'50分高手', desc:'成功次數達到50次', check: () => stats.totalScore >= 50 },
    ];
    let stats = JSON.parse(localStorage.getItem('sb_stats') || '{"correctTotal":0,"maxRoundScore":0,"maxCombo":0,"sbUsed":0,"factorsViewed":0,"skipCount":0,"totalScore":0,"achievements":[]}');
    let unlockedAchs = new Set(stats.achievements);
    function saveStats() {
      stats.achievements = Array.from(unlockedAchs);
      localStorage.setItem('sb_stats', JSON.stringify(stats));
    }
    function checkAchievements(extra = {}) {
      Object.assign(stats, extra);
      stats.totalScore = successCount;
      let newUnlocks = [];
      for (const ach of ACH_DEFS) {
        if (!unlockedAchs.has(ach.id) && ach.check()) {
          unlockedAchs.add(ach.id);
          newUnlocks.push(ach);
        }
      }
      if (newUnlocks.length > 0) {
        saveStats();
        renderAchBadges();
        showAchNotification(newUnlocks[0]);
      }
    }
    function showAchNotification(ach) {
      document.getElementById('ach-notify-emoji').textContent = ach.emoji;
      document.getElementById('ach-notify-name').textContent = ach.name;
      document.getElementById('ach-notify-desc').textContent = ach.desc;
      const notify = document.getElementById('ach-notify');
      notify.classList.add('show');
      setTimeout(() => notify.classList.remove('show'), 3000);
    }
    function renderAchBadges() {
      const container = document.getElementById('ach-badges');
      container.innerHTML = '';
      for (const ach of ACH_DEFS) {
        if (unlockedAchs.has(ach.id)) {
          const icon = document.createElement('div');
          icon.className = 'ach-icon';
          icon.textContent = ach.emoji;
          icon.setAttribute('data-tip', ach.name);
          container.appendChild(icon);
        }
      }
    }
    renderAchBadges();

    // --- PARTICLE SYSTEM ---
    const particles = [];
    const canvas = document.getElementById('particles-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    window.addEventListener('resize', () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; });
    function spawnParticles(x, y, color, count = 20) {
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
        const speed = 3 + Math.random() * 4;
        particles.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2,
          life: 1,
          color,
          size: 3 + Math.random() * 4,
        });
      }
    }
    function spawnParticlesFromCard(cardIndex) {
      const cardEls = document.querySelectorAll('.p-card');
      if (cardEls[cardIndex]) {
        const r = cardEls[cardIndex].getBoundingClientRect();
        const x = r.left + r.width / 2;
        const y = r.top + r.height / 2;
        spawnParticles(x, y, '#00c853', 15);
      }
    }
    function animateParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        p.vy += 0.15; // gravity
        p.life -= 0.025;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(animateParticles);
    }
    animateParticles();

    // --- HOOK INTO confirmPicks ---
    const _confirmPicks = confirmPicks;
    confirmPicks = function() {
      const prePhase = phase;
      const preSelectedSize = selected.size;
      const preSuccessCount = successCount;
      _confirmPicks();
      // After _confirmPicks runs, phase will be 'reveal' and cards will be flipped
      // Use a short delay to check results
      setTimeout(() => {
        // Determine result based on successCount change (each correct = +1)
        const successDiff = successCount - preSuccessCount;
        if (prePhase === 'squarebun') {
          // Square Bun result
          const isSquare = table[Array.from(selected)[0]]?.sq;
          if (isSquare) {
            playSquareBun();
            stats.sbUsed++;
            const cardIdx = Array.from(selected)[0];
            setTimeout(() => spawnParticlesFromCard(cardIdx), 200);
          } else {
            playWrong();
            resetCombo();
          }
          checkAchievements();
        } else if (preSelectedSize === 0) {
          // Skip
          playSkip();
          resetCombo();
          stats.skipCount++;
          checkAchievements();
        } else {
          // Normal pick
          if (successDiff > 0) {
            playCorrect();
            addCombo();
            stats.correctTotal++;
            stats.maxRoundScore = Math.max(stats.maxRoundScore, 1);
            stats.maxCombo = Math.max(stats.maxCombo, comboStreak);
            // Spawn particles on correct cards
            for (const idx of Array.from(selected)) {
              if (correctCards.includes(idx)) {
                setTimeout(() => spawnParticlesFromCard(idx), 200);
              }
            }
          } else if (successDiff < 0) {
            playWrong();
            document.body.classList.add('shake');
            setTimeout(() => document.body.classList.remove('shake'), 400);
            resetCombo();
          }
          checkAchievements({ factorsViewed: stats.factorsViewed + 1 });
        }
      }, 100);
    };

    // --- HOOK into doNextRound (reset combo on new round) ---
    const _doNextRound = doNextRound;
    doNextRound = function(removeIndices, correctIndices) {
      // Combo already reset on wrong/skip in confirmPicks above
      _doNextRound(removeIndices, correctIndices);
    };

  