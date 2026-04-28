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
        updateAchCount();
        for (const ach of newUnlocks) {
          showToast('🏆 成就解鎖！', `${ach.emoji} 「${ach.name}」`);
        }
      }
    }
    function showToast(title, message) {
      const container = document.getElementById('toast-container');
      if (!container) return;
      const toast = document.createElement('div');
      toast.className = 'achievement-toast';
      const titleEl = document.createElement('div');
      titleEl.className = 'toast-title';
      titleEl.textContent = title;
      const bodyEl = document.createElement('div');
      bodyEl.className = 'toast-body';
      bodyEl.textContent = message;
      toast.appendChild(titleEl);
      toast.appendChild(bodyEl);
      container.appendChild(toast);
      setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 350);
      }, 3000);
    }
    function updateAchCount() {
      const countEl = document.getElementById('ach-count');
      const totalEl = document.getElementById('ach-total');
      if (countEl) countEl.textContent = unlockedAchs.size;
      if (totalEl) totalEl.textContent = ACH_DEFS.length;
    }
    function showAchievements() {
      const list = document.getElementById('ach-list');
      if (!list) return;
      list.innerHTML = ACH_DEFS.map(a => {
        const unlocked = unlockedAchs.has(a.id);
        return `<div style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border-radius:10px;background:${unlocked ? 'rgba(245,193,24,0.1)' : 'rgba(255,255,255,0.04)'};border:1px solid ${unlocked ? 'rgba(245,193,24,0.25)' : 'rgba(255,255,255,0.06)'};opacity:${unlocked ? '1' : '0.55'}">
          <span style="font-size:22px;flex-shrink:0;">${unlocked ? a.emoji : '🔒'}</span>
          <div>
            <div style="font-size:13px;font-weight:700;color:${unlocked ? '#f5c518' : '#aaa'};">${a.name}</div>
            <div style="font-size:11px;color:#888;margin-top:2px;">${a.desc}</div>
          </div>
        </div>`;
      }).join('');
      document.getElementById('ach-modal-count').textContent = `${unlockedAchs.size}/${ACH_DEFS.length}`;
      document.getElementById('ach-modal').classList.add('show');
    }
    function closeAchievements() {
      document.getElementById('ach-modal').classList.remove('show');
    }
    updateAchCount();

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

      // 0 cards in dice-rolled phase → skip branch: re-roll instead of penalty
      if (preSelectedSize === 0 && prePhase !== 'squarebun') {
        phase = 'result';
        document.getElementById('btn-dice').disabled = true;
        document.getElementById('btn-dice').className = 'btn btn-ghost';
        setTimeout(() => {
          showFlash('skip', '⏭️ 冇夾到！');
          dice = [null, null];
          renderDiceSVG(document.getElementById('dice1'), 0);
          renderDiceSVG(document.getElementById('dice2'), 0);
          phase = 'open';
          document.getElementById('btn-dice').disabled = true;
          setTimeout(() => {
            if (phase === 'open') {
              document.getElementById('btn-dice').disabled = false;
              document.getElementById('btn-dice').className = 'btn btn-green';
            }
          }, 1500);
          document.getElementById('target-badge').textContent = '開卡後擲骰';
          document.getElementById('target-badge').className = 'target-badge disabled';
          document.getElementById('cards-grid').classList.remove('dice-rolled');
          updateConfirmBtn();
          setTimeout(() => {
            renderCards(false);
            setStatus('揀啱就核對，或直接核對跳過', '');
          }, 500);
        }, 800);
        playSkip();
        resetCombo();
        stats.skipCount++;
        checkAchievements();
        return;
      }

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
          // Skip (already handled above, but kept for completeness)
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
          } else if (wrongCards.length > 0) {
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

    // --- COLLECTION MODAL ---
    function openCollection(filter = "all") {
      const modal = document.getElementById('coll-modal');
      if (!modal) return;
      modal.classList.add('show');

      // Tab styling
      ["all", "legendary", "epic", "rare"].forEach(f => {
        const btn = document.getElementById("coll-tab-" + f);
        if (btn) {
          if (f === filter) {
            btn.style.background = "#2d2d4e"; btn.style.color = "white";
          } else {
            btn.style.background = "transparent"; btn.style.color = "#aaa";
          }
        }
      });

      // Derive rarity from card properties
      function cardRarity(n) {
        if (SQUARES.has(n)) return "legendary";
        const divCount = (getDivisors(n) || []).length;
        if (divCount >= 6) return "epic";
        return "rare";
      }

      const levelMax = LEVELS[currentLevel - 1].max;
      const cards = ALL_CARDS.filter(c => c.n <= levelMax);
      const filtered = cards.filter(c => filter === "all" || cardRarity(c.n) === filter);

      const content = document.getElementById("coll-content");
      if (!content) return;
      content.innerHTML = "";

      filtered.forEach(card => {
        const qty = collected.get(card.n) || 0;
        const wrap = document.createElement("div");
        wrap.style.cssText = "position:relative;display:flex;flex-direction:column;align-items:center;margin:4px;";

        const cardEl = document.createElement("div");
        cardEl.style.cssText = "width:56px;height:72px;background:var(--card-bg);border:2px solid var(--border);border-radius:10px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:default;user-select:none;";

        const numEl = document.createElement("div");
        numEl.style.cssText = "font-size:18px;font-weight:900;color:var(--accent);";
        numEl.textContent = card.n;

        const divEl = document.createElement("div");
        divEl.style.cssText = "font-size:9px;color:var(--text-dim);margin-top:2px;";
        divEl.textContent = card.divs.join("·") || "1";

        cardEl.appendChild(numEl); cardEl.appendChild(divEl);
        wrap.appendChild(cardEl);

        if (qty > 0) {
          const badge = document.createElement("div");
          badge.className = "coll-qty-badge" + (qty >= 10 ? " max" : qty >= 5 ? " high" : "");
          badge.textContent = "x" + qty;
          wrap.appendChild(badge);
        }

        content.appendChild(wrap);
      });

      // Summary stats (optional elements — present in deluxe.html, absent in deluxe_new.html)
      const summary = document.getElementById("coll-summary");
      if (summary) {
        summary.style.display = "flex";
        const totalTypes = collected.size;
        const totalCards = Array.from(collected.values()).reduce((a, b) => a + b, 0);
        const completion = levelMax > 0 ? Math.round((totalCards / levelMax) * 100) : 0;
        const typesEl = document.getElementById("coll-total-types");
        const cardsEl = document.getElementById("coll-total-cards");
        const compEl = document.getElementById("coll-completion");
        if (typesEl) typesEl.textContent = totalTypes;
        if (cardsEl) cardsEl.textContent = totalCards;
        if (compEl) compEl.textContent = completion;
      }
    }

    function closeCollection() {
      const modal = document.getElementById("coll-modal");
      if (modal) modal.classList.remove("show");
    }

  