    // --- SOUND SYSTEM (Web Audio API - no external files) ---
    let soundEnabled = true;
    let audioCtx = null;
    function iconMarkup(name) {
      return `<svg class="icon" aria-hidden="true"><use href="#i-${name}"></use></svg>`;
    }
    function usesGameStyle() {
      return !!document.body && document.body.dataset.uiStyle === 'game';
    }
    function getAudioCtx() {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      return audioCtx;
    }
    function toggleSound() {
      soundEnabled = !soundEnabled;
      if (!usesGameStyle()) {
        const btn = document.getElementById('sound-toggle');
        if (btn) {
          btn.textContent = soundEnabled ? '🔊' : '🔇';
          btn.classList.toggle('muted', !soundEnabled);
        }
        return;
      }
      document.querySelectorAll('.sound-toggle').forEach(btn => {
        btn.innerHTML = soundEnabled
          ? '<svg class="icon"><use href="#i-sound"></use></svg>'
          : '<svg class="icon"><use href="#i-muted"></use></svg>';
        btn.classList.toggle('muted', !soundEnabled);
        btn.setAttribute('aria-label', soundEnabled ? '音效' : '音效已關閉');
      });
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
      if (comboStreak === 3) {
        playCombo();
        showComboFlash(usesGameStyle() ? 'Combo!' : '🔥 Combo!', usesGameStyle() ? 'var(--orange)' : '#ff6b00');
      } else if (comboStreak >= 5) {
        playCombo();
        showComboFlash(usesGameStyle() ? 'Super Combo!' : '⚡ Super Combo!', usesGameStyle() ? 'var(--gold)' : '#ffd700');
      }
    }
    function resetCombo() {
      if (comboStreak > 0) { comboStreak = 0; updateComboDisplay(); }
    }
    function showComboFlash(text, color) {
      const el = document.createElement('div');
      if (!usesGameStyle()) {
        el.textContent = text;
        el.style.cssText = `position:fixed;top:40%;left:50%;transform:translateX(-50%);font-size:28px;font-weight:900;color:${color};z-index:600;pointer-events:none;animation:comboFlash 1s ease forwards`;
      } else {
        el.className = 'combo-flash';
        el.style.color = color;
        el.innerHTML = '<svg class="icon"><use href="#i-flame"></use></svg><span></span>';
        el.querySelector('span').textContent = text;
      }
      document.body.appendChild(el);
      setTimeout(()=>el.remove(), 1000);
    }
    if (!usesGameStyle()) {
      const styleEl = document.createElement('style');
      styleEl.textContent = '@keyframes comboFlash { 0%{opacity:1;transform:translateX(-50%) scale(1)} 50%{transform:translateX(-50%) scale(1.3)} 100%{opacity:0;transform:translateX(-50%) translateY(-30px) scale(0.8)} }';
      document.head.appendChild(styleEl);
    }

    // --- ACHIEVEMENT SYSTEM ---
    const ACH_DEFS = [
      { id:'first_win',  icon:'star', name:'初試啼聲', desc:'完成第一個正確回答', check: () => stats.correctTotal >= 1 },
      { id:'five_pts',   icon:'trophy', name:'五分達成', desc:'單次結算獲得5分以上', check: () => stats.maxRoundScore >= 5 },
      { id:'combo_3',    icon:'flame', name:'Combo 新手', desc:'達成3連 Combo', check: () => stats.maxCombo >= 3 },
      { id:'combo_5',    icon:'star', name:'Combo 大師', desc:'達成5連 Combo', check: () => stats.maxCombo >= 5 },
      { id:'sb_first',   icon:'mic', name:'平方初體驗', desc:'首次使用平方包', check: () => stats.sbUsed >= 1 },
      { id:'sb_5',       icon:'trophy', name:'平方獵人', desc:'使用平方包5次', check: () => stats.sbUsed >= 5 },
      { id:'perfect_10', icon:'check', name:'完璧', desc:'連續10次回答正確', check: () => stats.maxCombo >= 10 },
      { id:'scholar',    icon:'book', name:'因數學者', desc:'查看因數顯示50次', check: () => stats.factorsViewed >= 50 },
      { id:'skip_5',     icon:'refresh', name:'跳過達人', desc:'跳過（無夾到）5次', check: () => stats.skipCount >= 5 },
      { id:'score_50',  icon:'trophy', name:'50分高手', desc:'成功次數達到50次', check: () => stats.totalScore >= 50 },
    ];
    const LEGACY_ACHIEVEMENT_EMOJI = {
      first_win:'🌟', five_pts:'5️⃣', combo_3:'🔥', combo_5:'⚡', sb_first:'🎤',
      sb_5:'👑', perfect_10:'💯', scholar:'🧮', skip_5:'⏭️', score_50:'🏆',
    };
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
          if (usesGameStyle()) showToast('成就解鎖！', ach.name);
          else showToast('🏆 成就解鎖！', `${LEGACY_ACHIEVEMENT_EMOJI[ach.id]} 「${ach.name}」`);
        }
      }
      renderDesktopSidebar();
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
      if (usesGameStyle()) {
        const mark = document.createElement('span');
        mark.className = 'toast-mark';
        mark.innerHTML = iconMarkup('trophy');
        toast.appendChild(mark);
      }
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
    function getDesktopRarity(n) {
      if (SQUARES.has(n)) return 'legendary';
      return getDivisors(n).length >= 6 ? 'epic' : 'rare';
    }
    function renderDesktopSidebar() {
      const preview = document.getElementById('desktop-collection-preview');
      if (!preview) return;
      const isDesktop = typeof window.matchMedia === 'function'
        ? window.matchMedia('(min-width: 1200px)').matches
        : window.innerWidth >= 1200;
      const levelMax = LEVELS[currentLevel - 1].max;
      const count = document.getElementById('desktop-coll-count');
      const total = document.getElementById('desktop-coll-total');
      const progress = document.getElementById('desktop-collection-progress');
      if (count) count.textContent = collected.size;
      if (total) total.textContent = levelMax;
      if (progress) progress.style.width = Math.min(100, collected.size / levelMax * 100) + '%';

      if (isDesktop) {
        let cards = '';
        for (let n = 1; n <= levelMax; n++) {
          const rarity = getDesktopRarity(n);
          const got = (collected.get(n) || 0) > 0;
          cards += `<span class="mini-card rarity-${rarity} ${got ? 'is-collected' : 'is-missing'}" title="${n}${got ? ' 已收集' : ' 未收集'}">${n}</span>`;
        }
        preview.innerHTML = cards;
      } else {
        preview.replaceChildren();
      }

      const achievementList = document.getElementById('desktop-achievement-list');
      const achievementCount = document.getElementById('desktop-achievement-count');
      if (achievementCount) achievementCount.textContent = `${unlockedAchs.size}/${ACH_DEFS.length}`;
      if (achievementList) {
        achievementList.innerHTML = ACH_DEFS.map(achievement => {
          const unlocked = unlockedAchs.has(achievement.id);
          return `<div class="desktop-achievement ${unlocked ? 'is-unlocked' : 'is-locked'}">
            <span class="desktop-achievement-icon">${iconMarkup(unlocked ? 'check' : 'lock')}</span>
            <span class="desktop-achievement-copy"><strong>${achievement.name}</strong><span>${achievement.desc}</span></span>
          </div>`;
        }).join('');
      }
    }
    function showAchievements() {
      const list = document.getElementById('ach-list');
      if (!list) return;
      list.innerHTML = ACH_DEFS.map(a => {
        const unlocked = unlockedAchs.has(a.id);
        if (!usesGameStyle()) {
          return `<div style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border-radius:10px;background:${unlocked ? 'rgba(245,193,24,0.1)' : 'rgba(255,255,255,0.04)'};border:1px solid ${unlocked ? 'rgba(245,193,24,0.25)' : 'rgba(255,255,255,0.06)'};opacity:${unlocked ? '1' : '0.55'}">
            <span style="font-size:22px;flex-shrink:0;">${unlocked ? LEGACY_ACHIEVEMENT_EMOJI[a.id] : '🔒'}</span>
            <div>
              <div style="font-size:13px;font-weight:700;color:${unlocked ? '#f5c518' : '#aaa'};">${a.name}</div>
              <div style="font-size:11px;color:#888;margin-top:2px;">${a.desc}</div>
            </div>
          </div>`;
        }
        return `<div class="achievement-row ${unlocked ? 'is-unlocked' : 'is-locked'}">
          <span class="achievement-icon">${iconMarkup(unlocked ? a.icon : 'lock')}</span>
          <span class="achievement-copy"><strong>${a.name}</strong><span>${a.desc}</span></span>
        </div>`;
      }).join('');
      document.getElementById('ach-modal-count').textContent = `${unlockedAchs.size}/${ACH_DEFS.length}`;
      document.getElementById('ach-modal').classList.add('show');
    }
    function closeAchievements() {
      document.getElementById('ach-modal').classList.remove('show');
    }
    updateAchCount();

    const _updateCollectionBadge = updateCollectionBadge;
    updateCollectionBadge = function() {
      _updateCollectionBadge();
      renderDesktopSidebar();
    };
    window.addEventListener('resize', renderDesktopSidebar);
    renderDesktopSidebar();

    // --- COLLECTION (CARD GALLERY) SYSTEM ---
    function openCollection(filter = 'all') {
      const modal = document.getElementById('coll-modal');
      const content = document.getElementById('coll-content');
      if (!modal || !content) return;
      if (!LEVELS || !currentLevel || !collected || !SQUARES || !getDivisors) return;

      const levelMax = LEVELS[currentLevel - 1].max;
      function getCardRarity(n) {
        if (SQUARES.has(n)) return 'legendary';
        const divs = getDivisors(n);
        return divs.length >= 6 ? 'epic' : 'rare';
      }
      const cards = [];
      for (let n = 1; n <= levelMax; n++) {
        const qty = collected.get(n) || 0;
        const rarity = getCardRarity(n);
        if (filter === 'all' || rarity === filter) cards.push({ n, qty, rarity });
      }

      if (!usesGameStyle()) {
        content.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(60px,1fr));gap:8px;padding:4px;">' +
          cards.map(c => {
            const isCollected = c.qty > 0;
            const rarityColor = c.rarity === 'legendary' ? '#f5c518' : c.rarity === 'epic' ? '#a855f7' : c.rarity === 'rare' ? '#3b82f6' : '#888';
            return `<div onclick="${isCollected ? `showCardDetail(${c.n})` : ''}" style="
              aspect-ratio:3/4;
              background:${isCollected ? `linear-gradient(135deg,${rarityColor},${rarityColor}99)` : '#2d2d4e'};
              border-radius:8px;
              display:flex;
              align-items:center;
              justify-content:center;
              font-size:18px;
              font-weight:900;
              color:${isCollected ? '#1a1a2e' : '#555'};
              position:relative;
              cursor:${isCollected ? 'pointer' : 'default'};
              opacity:${isCollected ? '1' : '0.5'};
              box-shadow:0 2px 6px rgba(0,0,0,0.2);
              transition:transform 0.15s;
            ">
              ${isCollected ? c.n : '🔒'}
              ${c.qty > 1 ? `<span style="position:absolute;bottom:2px;right:4px;font-size:10px;background:#e53935;color:white;padding:1px 4px;border-radius:4px;font-weight:700;">×${c.qty}</span>` : ''}
            </div>`;
          }).join('') + '</div>' +
          `<div style="margin-top:12px;text-align:center;color:#888;font-size:12px;">${cards.length} 張卡牌</div>`;
      } else {
        content.innerHTML = '<div class="coll-grid">' + cards.map(c => {
          const isCollected = c.qty > 0;
          const kind = isCollected ? 'button' : 'div';
          const classes = `collection-card rarity-${c.rarity} ${isCollected ? 'is-collected' : 'is-missing'}`;
          const action = isCollected ? `type="button" onclick="showCardDetail(${c.n})" aria-label="卡牌 ${c.n}，收集 ${c.qty} 次"` : '';
          const badgeClass = c.qty >= 10 ? ' max' : c.qty >= 5 ? ' high' : '';
          return `<${kind} class="${classes}" ${action}>
            <span class="collection-number">${c.n}</span>
            ${isCollected
              ? `<span class="coll-qty-badge${badgeClass}">×${c.qty}</span>`
              : '<span class="collection-missing-label">未收集</span>'}
          </${kind}>`;
        }).join('') + '</div><div class="collection-total">' + cards.length + ' 張卡牌</div>';
      }

      const tabMap = { all: 'all', legendary: 'leg', epic: 'epic', rare: 'rare' };
      Object.entries(tabMap).forEach(([key, id]) => {
        const btn = document.getElementById('coll-tab-' + id);
        if (!btn) return;
        if (usesGameStyle()) btn.classList.toggle('active', filter === key);
        else {
          btn.style.background = filter === key ? '#2d2d4e' : 'transparent';
          btn.style.color = filter === key ? 'white' : '#aaa';
          btn.style.fontWeight = filter === key ? '700' : '400';
        }
      });

      const summaryEl = document.getElementById('coll-summary');
      const statsEl = document.getElementById('coll-stats');
      if (summaryEl) {
        summaryEl.style.display = usesGameStyle() ? 'grid' : 'flex';
        const totalTypes = collected.size;
        const totalCards = Array.from(collected.values()).reduce((a, b) => a + b, 0);
        const completion = Math.round(totalTypes / levelMax * 100);
        document.getElementById('coll-total-types').textContent = totalTypes;
        document.getElementById('coll-total-cards').textContent = totalCards;
        document.getElementById('coll-completion').textContent = completion;
      }
      if (statsEl) statsEl.textContent = `（${collected.size}/${levelMax} 已收集）`;
      modal.classList.add('show');
    }
    function showCardDetail(n) {
      if (!collected || !SQUARES || !getDivisors) return;
      const qty = collected.get(n) || 0;
      const isSquare = SQUARES.has(n);
      const divs = getDivisors(n);
      if (!usesGameStyle()) {
        const rarityLabel = isSquare ? '⭐ 傳說（平方數）' : divs.length >= 6 ? '💎 史詩' : '👑 稀有';
        const rarityColor = isSquare ? '#f5c518' : divs.length >= 6 ? '#a855f7' : '#3b82f6';
        const factorCircles = divs.map(d => {
          const bg = (n / d === d) ? '#f5c518' : '#00c853';
          return `<div style="width:26px;height:26px;border-radius:50%;background:${bg};color:white;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;">${d}</div>`;
        }).join('');
        document.getElementById('detail-card-num').textContent = n;
        document.getElementById('detail-card-num-display').textContent = n;
        document.getElementById('detail-rarity').textContent = rarityLabel;
        document.getElementById('detail-rarity').style.color = rarityColor;
        document.getElementById('detail-qty').textContent = `收集次數：×${qty}`;
        document.getElementById('detail-divs').innerHTML = factorCircles;
      } else {
        const rarityLabel = isSquare ? '傳說（平方數）' : divs.length >= 6 ? '史詩' : '稀有';
        const rarityClass = isSquare ? 'rarity-legendary' : divs.length >= 6 ? 'rarity-epic' : 'rarity-rare';
        const factorCircles = divs.map(d => {
          const tone = (n / d === d) ? 'orange' : 'green';
          return `<span class="factor-circle ${tone}">${d}</span>`;
        }).join('');
        document.getElementById('detail-card-num').textContent = n;
        document.getElementById('detail-card-num-display').textContent = n;
        document.getElementById('detail-rarity').textContent = rarityLabel;
        document.getElementById('detail-rarity').className = rarityClass;
        document.getElementById('detail-qty').textContent = `收集次數：×${qty}`;
        document.getElementById('detail-divs').innerHTML = factorCircles;
      }
      const detailModal = document.getElementById('coll-detail-modal');
      if (detailModal) detailModal.classList.add('show');
    }
    function closeCollection() {
      document.getElementById('coll-modal').classList.remove('show');
    }

    function closeCardDetail() {
      const detailModal = document.getElementById('coll-detail-modal');
      if (detailModal) detailModal.classList.remove('show');
    }

    // Inject card detail modal HTML
    function injectCollDetailModal() {
      if (document.getElementById('coll-detail-modal')) return;
      const div = document.createElement('div');
      div.id = 'coll-detail-modal';
      div.className = 'modal-overlay';
      if (!usesGameStyle()) {
        div.style.cssText = 'display:none;align-items:center;justify-content:center;background:rgba(0,0,0,0.85);z-index:9998;';
        div.innerHTML = `<div style="background:#1a1a2e;border:2px solid #f5c518;border-radius:20px;padding:28px;max-width:340px;width:90%;text-align:center;box-shadow:0 8px 40px rgba(0,0,0,0.6);">
          <h2 style="color:#f5c518;font-size:22px;font-weight:900;margin-bottom:6px;">📚 卡牌 <span id="detail-card-num"></span></h2>
          <div id="detail-rarity" style="font-size:13px;font-weight:700;margin-bottom:12px;color:#f5c518;"></div>
          <div style="width:90px;height:120px;background:linear-gradient(135deg,#f5c518,#ff9800);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:40px;font-weight:900;color:#1a1a2e;margin:0 auto 16px;box-shadow:0 4px 16px rgba(245,166,35,0.4);"><span id="detail-card-num-display"></span></div>
          <div id="detail-qty" style="color:#aaa;font-size:14px;margin-bottom:10px;"></div>
          <div style="color:#aaa;font-size:12px;margin-bottom:8px;">因數：</div>
          <div id="detail-divs" style="display:flex;flex-wrap:wrap;gap:5px;justify-content:center;margin-bottom:18px;"></div>
          <button onclick="closeCardDetail()" style="padding:12px 28px;background:linear-gradient(135deg,#f5c518,#e09000);color:#1a1a2e;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;font-family:'Noto Sans HK',sans-serif;">關閉</button>
        </div>`;
      } else {
        div.innerHTML = `<div class="modal">
          <h2><svg class="icon"><use href="#i-book"></use></svg> 卡牌 <span id="detail-card-num"></span></h2>
          <div id="detail-rarity"></div>
          <div class="detail-card-preview"><span id="detail-card-num-display"></span></div>
          <div id="detail-qty"></div>
          <div class="detail-factors-label">因數</div>
          <div id="detail-divs"></div>
          <button class="modal-close" type="button" onclick="closeCardDetail()">關閉</button>
        </div>`;
      }
      document.body.appendChild(div);
    }
    injectCollDetailModal();

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
        spawnParticles(x, y, usesGameStyle() ? '#3DDBC4' : '#00c853', 15);
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
          showFlash('skip', usesGameStyle() ? '冇夾到！' : '⏭️ 冇夾到！');
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

    function keyboardShortcutsEnabled() {
      if (!usesGameStyle()) return false;
      const gameScreen = document.getElementById('game-screen');
      if (!gameScreen || getComputedStyle(gameScreen).display === 'none') return false;
      return typeof window.matchMedia === 'function'
        ? window.matchMedia('(min-width: 1200px)').matches
        : window.innerWidth >= 1200;
    }
    function hasBlockingOverlay() {
      if (document.querySelector('.modal-overlay.show')) return true;
      const summary = document.getElementById('level-summary-overlay');
      return !!summary && summary.style.display === 'flex';
    }
    function isTextEntry(target) {
      const element = target instanceof Element ? target : target && target.parentElement;
      return !!element && (!!element.closest('input, textarea, select, [contenteditable="true"]') || element.isContentEditable);
    }
    document.addEventListener('keydown', event => {
      if (!keyboardShortcutsEnabled() || event.ctrlKey || event.metaKey || event.altKey) return;
      if (hasBlockingOverlay() || isTextEntry(event.target)) return;

      const key = event.key.toLowerCase();
      const targetElement = event.target instanceof Element ? event.target : event.target && event.target.parentElement;
      const nativeControl = targetElement && targetElement.closest('button, a, [role="button"]');
      const gameActionControl = targetElement && targetElement.closest('#btn-open, #btn-dice, #btn-confirm, #btn-sb');
      if ((event.code === 'Space' || key === ' ' || key === 'enter') && nativeControl && !gameActionControl) return;
      if (event.code === 'Space' || key === ' ') {
        event.preventDefault();
        const diceButton = document.getElementById('btn-dice');
        if (!event.repeat && diceButton && !diceButton.disabled) rollDice();
        return;
      }
      if (key === 'enter') {
        event.preventDefault();
        const confirmButton = document.getElementById('btn-confirm');
        if (!event.repeat && confirmButton && !confirmButton.disabled) confirmPicks();
        return;
      }
      if (key === 's') {
        event.preventDefault();
        const squareBunButton = document.getElementById('btn-sb');
        if (!event.repeat && squareBunButton && !squareBunButton.disabled) triggerSquareBun();
        return;
      }
      if (/^[1-6]$/.test(key) && !event.repeat) {
        const index = Number(key) - 1;
        const card = document.querySelectorAll('.p-card')[index];
        const front = card && card.querySelector('.card-front');
        if (front && typeof front.onclick === 'function') {
          event.preventDefault();
          handleCardClick(index);
        }
      }
    });

// Ensure deluxe version is the global handler
window.openCollection = openCollection;

// --- OFFLINE ZIP DOWNLOAD ---
const OFFLINE_ZIP_JS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
const OFFLINE_README = [
  '平方包（豪華版）離線使用說明',
  '',
  '1. 解壓後雙擊 deluxe.html 開始遊玩（建議使用 Chrome／Edge）。',
  '2. 必須先解壓，不可直接在壓縮檔內開啟。',
  '',
  '檔案用途：',
  '- deluxe.html：畫面與樣式。',
  '- game.js：遊戲規則、等級、卡牌範圍。',
  '- deluxe.js：收藏、成就等介面。',
  '',
  '常見修改位置：',
  '- game.js 的 LEVELS（等級範圍）。',
  '',
  '進度儲存於該電腦該瀏覽器，與線上版互不相通。',
  '無網絡時字型會以系統字型顯示，不影響遊玩。',
].join('\n');
let jsZipLoadPromise=null;
let offlineZipInProgress=false;

function loadJSZip(){
  if(window.JSZip)return Promise.resolve(window.JSZip);
  if(jsZipLoadPromise)return jsZipLoadPromise;
  jsZipLoadPromise=new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    script.src=OFFLINE_ZIP_JS_URL;
    script.async=true;
    script.onload=()=>window.JSZip?resolve(window.JSZip):reject(new Error('JSZip unavailable'));
    script.onerror=()=>reject(new Error('JSZip load failed'));
    document.head.appendChild(script);
  }).catch(error=>{
    jsZipLoadPromise=null;
    throw error;
  });
  return jsZipLoadPromise;
}

function getOfflineZipDate(){
  const now=new Date();
  const year=now.getFullYear();
  const month=String(now.getMonth()+1).padStart(2,'0');
  const day=String(now.getDate()).padStart(2,'0');
  return ''+year+month+day;
}

async function downloadOfflineZip(){
  const button=document.getElementById('download-offline-btn');
  if(!button||offlineZipInProgress)return;
  offlineZipInProgress=true;
  const originalText=button.textContent;
  button.textContent='打包中…';
  button.disabled=true;
  let objectUrl=null;
  try{
    const JSZip=await loadJSZip();
    const sourceFiles=['deluxe.html','game.js','deluxe.js'];
    const contents={};
    for(const fileName of sourceFiles){
      const response=await fetch(new URL(fileName,document.baseURI),{cache:'no-store'});
      if(response.status!==200)throw new Error('Source fetch failed: '+fileName);
      contents[fileName]=await response.text();
    }
    const offlineHtml=contents['deluxe.html'].replace(/((?:<script\b[^>]*\bsrc=["'])(?:\.\/)?(?:game|deluxe)\.js)\?v=[^"']*(["'])/gi,'$1$2');
    const zip=new JSZip();
    const folder=zip.folder('square-bun');
    folder.file('deluxe.html',offlineHtml);
    folder.file('game.js',contents['game.js']);
    folder.file('deluxe.js',contents['deluxe.js']);
    folder.file('使用說明.txt',OFFLINE_README);
    const blob=await zip.generateAsync({type:'blob'});
    objectUrl=URL.createObjectURL(blob);
    const link=document.createElement('a');
    link.href=objectUrl;
    link.download='square-bun-deluxe-'+getOfflineZipDate()+'.zip';
    link.style.display='none';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }catch(error){
    window.alert('下載失敗，請稍後再試');
  }finally{
    if(objectUrl)setTimeout(()=>URL.revokeObjectURL(objectUrl),0);
    button.textContent=originalText;
    button.disabled=false;
    offlineZipInProgress=false;
  }
}

function setupOfflineDownloadButton(){
  const button=document.getElementById('download-offline-btn');
  if(!button)return;
  button.hidden=location.protocol==='file:';
}

setupOfflineDownloadButton();
