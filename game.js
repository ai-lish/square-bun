
    const SQUARES = new Set([1,4,9,16,25,36,49,64,81]);
    function getDivisors(n){const d=[];for(let i=1;i<=n;i++)if(n%i===0)d.push(i);return d;}
    const ALL_CARDS=[];for(let i=1;i<=88;i++){ALL_CARDS.push({n:i,divs:getDivisors(i),sq:SQUARES.has(i)});}
    let cardCount=4,deck=[],table=[],revealed=[],selected=new Set(),dice=[null,null],score=0;
    let phase='closed',sbMode=false,sbPrevPhase='closed',maxSelect=2;
    let wrongCards=[],correctCards=[];

    function adjustCount(delta){cardCount=Math.max(2,Math.min(6,cardCount+delta));document.getElementById('count-val').textContent=cardCount;}
    function showRules(){document.getElementById('rules-modal').classList.add('show');}
    function closeRules(){document.getElementById('rules-modal').classList.remove('show');}
    function shuffle(a){const r=Array.from(a);for(let i=r.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[r[i],r[j]]=[r[j],r[i]];}return r;}

    function startGame(){
      document.getElementById('setup-screen').style.display='none';
      document.getElementById('game-screen').style.display='flex';
      score=0;document.getElementById('score').textContent=score;
      startRound();
    }

    function startRound(){
      deck=shuffle(ALL_CARDS);table=deck.splice(0,cardCount);revealed=new Array(cardCount).fill(false);
      selected.clear();dice=[null,null];phase='closed';sbMode=false;
      renderDiceSVG(document.getElementById('dice1'),0);renderDiceSVG(document.getElementById('dice2'),0);
      document.getElementById('target-badge').textContent='開卡後擲骰';document.getElementById('target-badge').className='target-badge disabled';
      document.getElementById('status-bar').textContent='請按「開卡」揭開卡牌';document.getElementById('status-bar').className='status-bar';
      document.getElementById('btn-open').disabled=false;document.getElementById('btn-open').className='btn btn-green';
      document.getElementById('btn-dice').disabled=true;document.getElementById('btn-dice').className='btn btn-ghost';
      document.getElementById('btn-sb').disabled=false;document.getElementById('btn-sb').className='btn btn-gold btn-sb-dice';document.getElementById('btn-sb').textContent='🎤 平方包';
      document.getElementById('btn-confirm').disabled=true;document.getElementById('btn-confirm').className='btn btn-ghost';
      const grid=document.getElementById('cards-grid');grid.classList.remove('dice-rolled','squarebun-mode');
      renderOpenDots();renderCards(false);
    }

    function renderOpenDots(){
      const dots=document.getElementById('open-dots');dots.innerHTML='';
      for(let i=0;i<cardCount;i++){const d=document.createElement('div');d.className='open-dot'+(revealed[i]?' revealed':'');dots.appendChild(d);}
      document.getElementById('open-status-text').textContent=`已開 ${revealed.filter(Boolean).length} / ${cardCount} 張`;
    }

    function openOneCard(){
      const ni=revealed.findIndex(r=>!r);if(ni===-1)return;
      revealed[ni]=true;renderOpenDots();renderCards(false);
      if(revealed.every(Boolean)){
        phase='open';
        document.getElementById('btn-open').disabled=true;document.getElementById('btn-open').className='btn btn-ghost';
        document.getElementById('btn-dice').disabled=false;document.getElementById('btn-dice').className='btn btn-green';
        document.getElementById('status-bar').textContent='可以擲骰，或直接用平方包！';document.getElementById('status-bar').className='status-bar gold';
      }else{
        document.getElementById('btn-open').className='btn btn-green';
        document.getElementById('btn-dice').className='btn btn-ghost';
        document.getElementById('status-bar').textContent=`再揭 ${revealed.filter(r=>!r).length} 張卡`;
        document.getElementById('status-bar').className='status-bar';
      }
    }

    function renderCards(showDivs){
      const grid=document.getElementById('cards-grid');grid.innerHTML='';
      table.forEach((card,i)=>{
        const wrapper=document.createElement('div');
        let cls='p-card';
        if(!revealed[i]){cls+=' face-down';}
        else{if(card.sq)cls+=' square-bun-card';}
        wrapper.className=cls;

        const inner=document.createElement('div');inner.className='p-card-inner';
        let frontCls='card-face card-front';
        if(revealed[i]&&selected.has(i))frontCls+=' selected';
        const front=document.createElement('div');front.className=frontCls;
        const back=document.createElement('div');back.className='card-face card-back';

        if(!revealed[i]){
          // Face down: show "?" on the front face (card back side of flip)
          front.innerHTML='<div class="card-num">?</div>';
        }else{
          const divsHtml=showDivs?`<div class="card-divs">${card.divs.slice(0,3).join(', ')}${card.divs.length>3?'...':''}</div>`:'';
          front.innerHTML=`<div class="card-num">${card.n}</div>${divsHtml}`;
          front.onclick=()=>handleCardClick(i);
          // Back face is pre-filled with factor display (used during reveal phase)
          back.innerHTML=renderFactorBack(card);
        }
        if(card._new){wrapper.classList.add('adding');card._new=false;}

        inner.appendChild(front);inner.appendChild(back);
        wrapper.appendChild(inner);
        grid.appendChild(wrapper);
      });
      if(sbMode&&!showDivs){
        document.querySelectorAll('.p-card').forEach((el,i)=>{
          if(revealed[i]&&table[i].sq&&!selected.has(i))el.querySelector('.card-front').classList.add('hint');
        });
      }
    }

    function handleCardClick(i){
      if(!revealed[i]||phase==='result'||phase==='reveal')return;

      if(sbMode){
        if(selected.has(i)){selected.delete(i);}else{selected.clear();selected.add(i);}
        renderCards(false);updateConfirmBtn();return;
      }

      // Show divisors tooltip for this card (replaced by factor reveal on confirm)

      // Normal mode: max 2 selections
      if(!selected.has(i)&&selected.size>=maxSelect){setStatus('最多揀2張！','danger');return;}
      if(selected.has(i)){selected.delete(i);}else{selected.add(i);}
      renderCards(false);updateConfirmBtn();updateStatusForPhase();
    }

    let divsTipTimer=null;
    function showDivsTip(cardIndex){
      const card=table[cardIndex];
      const tip=document.getElementById('divs-tooltip');
      tip.innerHTML=`<div class="tip-num">${card.n}</div><div class="tip-divs">可被 ${card.divs.join(', ')} 整除</div>`;
      // Position near the card
      const cardEl=document.querySelectorAll('.p-card')[cardIndex];
      if(cardEl){
        const r=cardEl.getBoundingClientRect();
        tip.style.left=Math.min(r.left,window.innerWidth-160)+'px';
        tip.style.top=(r.top-58)+'px';
      }
      tip.classList.add('show');
      if(divsTipTimer)clearTimeout(divsTipTimer);
      divsTipTimer=setTimeout(()=>tip.classList.remove('show'),2000);
    }

    function updateConfirmBtn(){
      const btn=document.getElementById('btn-confirm');
      btn.disabled=!(phase==='dice-rolled'||phase==='squarebun');
      if(phase==='squarebun'){
        btn.className='btn btn-gold';
      }else if(phase==='dice-rolled'){
        btn.className='btn btn-green';
      }else{
        btn.className='btn btn-ghost';
      }
    }

    // Render the card back (factor reveal) HTML
    // Green: factor divides dice product
    // Orange: square root of n (if perfect square)
    // Red: remaining factors
    function renderFactorBack(card){
      const D=dice[0]*dice[1];
      const sq=Math.sqrt(card.n);
      const isPerfectSquare=Number.isInteger(sq);
      const sqInt=isPerfectSquare?sq:null;
      let rows='';let row='';
      card.divs.forEach((f,idx)=>{
        let cls;
        if(f===1){cls=dice.includes(1)?'green':'red';}
        else if(isPerfectSquare&&f===sqInt){cls='orange';}
        else if(dice.includes(f)){cls='green';}
        else{cls='red';}
        row+=`<span class="factor-circle ${cls}">${f}</span>`;
        if(row.split('factor-circle').length-1===3||idx===card.divs.length-1){
          rows+=`<div class="factor-row">${row}</div>`;row='';
        }
      });
      return`<div class="card-back-number">${card.n}</div><div class="factor-rows">${rows}</div>`;
    }

    function updateStatusForPhase(){
      if(phase==='closed')setStatus('請先開卡','');
      else if(phase==='open'){
        setStatus(selected.size>0?`已選 ${selected.size}/${maxSelect} 張`:`可以擲骰，或直接用平方包！`,'');
      }else if(phase==='dice-rolled'){
        setStatus(selected.size>0?`已選 ${selected.size}/${maxSelect} 張`:`揀啱就核對，或直接核對跳過`,selected.size>0?'gold':'');
      }else if(phase==='squarebun'){
        setStatus('🎤 平方包：選擇一張平方數卡','');
      }
    }
    function setStatus(msg,cls){const el=document.getElementById('status-bar');el.textContent=msg;el.className='status-bar'+(cls?' '+cls:'');}

    // Render a die face as SVG — val 0 shows "?"
    function renderDiceSVG(el,val){
      const pip=(x,y)=>`<circle cx="${x}" cy="${y}" r="3.5" fill="#222"/>`;
      const bg='fill="#fefefe"';
      let circles='';
      if(val===0){circles=`<text x="22" y="30" text-anchor="middle" font-size="22" font-weight="900" fill="#ccc" font-family="system-ui">?</text>`;}
      else if(val===1){circles=pip(22,22);}
      else if(val===2){circles=pip(10,10)+pip(34,34);}
      else if(val===3){circles=pip(10,10)+pip(22,22)+pip(34,34);}
      else if(val===4){circles=pip(10,10)+pip(34,10)+pip(10,34)+pip(34,34);}
      else if(val===5){circles=pip(10,10)+pip(34,10)+pip(22,22)+pip(10,34)+pip(34,34);}
      else if(val===6){circles=pip(10,10)+pip(34,10)+pip(10,22)+pip(34,22)+pip(10,34)+pip(34,34);}
      el.innerHTML=`<svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="44" height="44" rx="10" ${bg}/>${circles}</svg>`;
    }

    function rollDice(){
      if(phase!=='open')return;
      dice=[Math.floor(Math.random()*6)+1,Math.floor(Math.random()*6)+1];
      const d1=document.getElementById('dice1'),d2=document.getElementById('dice2');
      d1.classList.add('rolling');d2.classList.add('rolling');
      setTimeout(()=>{renderDiceSVG(d1,dice[0]);renderDiceSVG(d2,dice[1]);d1.classList.remove('rolling');d2.classList.remove('rolling');},500);
      const targets=getTargetSet();
      document.getElementById('target-badge').textContent=`可被 ${dice[0]} 或 ${dice[1]} 整除`;
      document.getElementById('target-badge').classList.remove('disabled');
      // Check for square cards that match
      const matchingSquares=table.filter((c,i)=>revealed[i]&&c.sq&&targets.has(c.n));
      if(matchingSquares.length>0){
        document.getElementById('target-badge').classList.add('gold-bg');
      }else{
        document.getElementById('target-badge').classList.remove('gold-bg');
      }
      phase='dice-rolled';
      document.getElementById('btn-dice').className='btn btn-ghost';
      document.getElementById('btn-sb').disabled=false;
      document.getElementById('cards-grid').classList.remove('squarebun-mode');
      document.getElementById('cards-grid').classList.add('dice-rolled');
      setStatus(selected.size>0?`已選 ${selected.size}/${maxSelect} 張`:`揀啱就核對，或直接核對跳過`,'');
      updateConfirmBtn();
      setTimeout(highlightHintCards,600);
    }

    function triggerSquareBun(){
      if(phase!=='open'&&phase!=='dice-rolled'&&phase!=='closed'&&phase!=='squarebun')return;
      const wasClosed=phase==='closed';
      sbMode=!sbMode;
      const grid=document.getElementById('cards-grid');
      if(sbMode){
        selected.clear();
        document.getElementById('btn-sb').className='btn btn-gold btn-sb-dice active';
        document.getElementById('btn-sb').textContent='✕ 取消';
        sbPrevPhase=phase;
        phase='squarebun';
        grid.classList.remove('dice-rolled');
        grid.classList.add('squarebun-mode');
        setStatus('🎤 平方包：選擇一張卡牌','');
        updateConfirmBtn();
      }else{
        document.getElementById('btn-sb').className='btn btn-gold btn-sb-dice';
        document.getElementById('btn-sb').textContent='🎤 平方包';
        phase=wasClosed?'closed':'dice-rolled';
        grid.classList.remove('squarebun-mode');
        if(phase==='dice-rolled')grid.classList.add('dice-rolled');
        setStatus(selected.size>0?`已選 ${selected.size}/${maxSelect} 張`:`請選擇卡牌`,'');
        selected.clear();
        sbMode=false;
        updateConfirmBtn();
      }
    }

    function highlightHintCards(){
      if(phase!=='dice-rolled')return;
      const targets=getTargetSet();
      document.querySelectorAll('.p-card').forEach((el,i)=>{
        if(!revealed[i])return;
        if(targets.has(table[i].n))el.classList.add('hint');else el.classList.remove('hint');
      });
    }

    function getTargetSet(){
      const s=new Set();
      if(dice[0]===null)return s;
      for(const d of dice)for(let i=1;i<=88;i++)if(i%d===0)s.add(i);
      return s;
    }

    function confirmPicks(){
      if(phase!=='dice-rolled'&&phase!=='squarebun')return;
      // Always reset wrong/correct tracking at the start of each confirm
      wrongCards=[];correctCards=[];

      if(phase==='squarebun'){
        const selectedIdx=Array.from(selected)[0];
        const isSquare=table[selectedIdx].sq;
        wrongCards=isSquare?[]:[selectedIdx];
        correctCards=isSquare?[selectedIdx]:[];
        phase='reveal';
        const cards=document.querySelectorAll('.p-card');
        cards[selectedIdx].classList.add('flipped');
        if(isSquare){
          score+=selected.size;
          setStatus('🎤 平方包！ +'+selected.size+' 分','gold');
        }else{
          score=Math.max(0,score-selected.size);
          setStatus('✗ 唔係平方數！ -'+selected.size+' 分','');
        }
        document.getElementById('score').textContent=score;
        document.getElementById('continue-zone').classList.add('show');
        document.getElementById('btn-confirm').disabled=true;
        document.getElementById('btn-open').disabled=true;
        document.getElementById('btn-dice').disabled=true;
        document.getElementById('btn-sb').disabled=true;
        setTimeout(handleContinue,500);
        return;
      }

      if(selected.size>0){
        const targets=getTargetSet();
        selected.forEach(i=>{
          if(targets.has(table[i].n))correctCards.push(i);
          else wrongCards.push(i);
        });
        phase='reveal';
        // Flip selected cards to show factor backs
        const cards=document.querySelectorAll('.p-card');
        selected.forEach(i=>cards[i].classList.add('flipped'));
        // Update score
        if(wrongCards.length>0){
          score=Math.max(0,score-wrongCards.length);
          setStatus(`✗ 答錯！ -${wrongCards.length} 分`,'');
        }else{
          score+=correctCards.length;
          setStatus(`✓ 全對！ +${correctCards.length} 分`,'success');
        }
        document.getElementById('score').textContent=score;
        // Show continue button
        document.getElementById('continue-zone').classList.add('show');
        document.getElementById('btn-confirm').disabled=true;
        document.getElementById('btn-open').disabled=true;
        document.getElementById('btn-dice').disabled=true;
        document.getElementById('btn-sb').disabled=true;
        return;
      }

      // No cards selected — let player re-roll instead of penalty
      phase='result';
      // Immediately disable dice button during result display
      document.getElementById('btn-dice').disabled=true;
      document.getElementById('btn-dice').className='btn btn-ghost';
      setTimeout(()=>{
        showFlash('skip','⏭️ 冇夾到！','可再擲骰');
        // Clear dice and set phase='open' so player can re-roll
        dice=[null,null];
        renderDiceSVG(document.getElementById('dice1'),0);
        renderDiceSVG(document.getElementById('dice2'),0);
        phase='open';
        document.getElementById('btn-dice').disabled=true;
        // Re-enable dice button after Flash duration so player can re-roll
        setTimeout(()=>{
          if(phase==='open'){
            document.getElementById('btn-dice').disabled=false;
            document.getElementById('btn-dice').className='btn btn-green';
          }
        },1500);
        document.getElementById('target-badge').textContent='開卡後擲骰';
        document.getElementById('target-badge').className='target-badge disabled';
        document.getElementById('cards-grid').classList.remove('dice-rolled');
        updateConfirmBtn();
        setTimeout(()=>{
          renderCards(false);
          setStatus(selected.size>0?`已選 ${selected.size}/${maxSelect} 張`:`揀啱就核對，或直接核對跳過`,'');
        },500);
      },800);
    }

    function handleContinue(){
      document.getElementById('continue-zone').classList.remove('show');
      document.getElementById('btn-open').disabled=false;
      document.getElementById('btn-dice').disabled=true;
      document.getElementById('btn-sb').disabled=true;
      document.getElementById('btn-confirm').disabled=true;
      const toRemove=wrongCards.length>0?wrongCards:Array.from(selected);
      wrongCards=[];correctCards=[];
      selected.clear();sbMode=false;
      doNextRound(toRemove);
    }

    function doNextRound(removeIndices){
      const toRemove=new Set(removeIndices);
      // Remove cards from table (wrong cards are discarded, not returned to deck)
      table=table.filter((_,i)=>!toRemove.has(i));
      // Reset revealed — new round starts with all cards face-down
      revealed=table.map(()=>false);
      selected.clear();sbMode=false;
      // Replenish table to cardCount — draw from top of shuffled deck
      while(table.length<cardCount&&deck.length>0){table.push(deck.pop());revealed.push(false);}
      // If deck is empty or insufficient, reshuffle ALL_CARDS and continue
      if(table.length<cardCount){deck=shuffle(ALL_CARDS);while(table.length<cardCount){table.push(deck.pop());revealed.push(false);}}
      phase='closed';dice=[null,null];
      renderDiceSVG(document.getElementById('dice1'),0);renderDiceSVG(document.getElementById('dice2'),0);
      document.getElementById('target-badge').textContent='開卡後擲骰';document.getElementById('target-badge').className='target-badge disabled';
      document.getElementById('btn-open').disabled=false;document.getElementById('btn-open').className='btn btn-green';
      document.getElementById('btn-dice').disabled=true;document.getElementById('btn-dice').className='btn btn-ghost';
      document.getElementById('btn-sb').disabled=false;document.getElementById('btn-sb').className='btn btn-gold btn-sb-dice';document.getElementById('btn-sb').textContent='🎤 平方包';
      document.getElementById('btn-confirm').disabled=true;document.getElementById('btn-confirm').className='btn btn-ghost';
      const grid=document.getElementById('cards-grid');grid.classList.remove('dice-rolled','squarebun-mode');
      setStatus('請按「開卡」揭開新一回合','');
      renderOpenDots();renderCards(false);
    }

    function showFlash(type,text,sub){
      // Non-blocking feedback: status-bar + score delta + button pulse
      const statusEl=document.getElementById('status-bar');
      const scoreEl=document.getElementById('score');
      const prevScore=parseInt(scoreEl.textContent)||0;
      // 1. Status bar flash
      const colorMap={success:'success',danger:'danger',gold:'gold',skip:'info'};
      const iconMap={success:'✓',danger:'✗',gold:'🎤',skip:'⏭️'};
      statusEl.className='status-bar '+colorMap[type];
      statusEl.textContent=iconMap[type]+' '+text+(sub?('  '+sub):'');
      // 2. Score delta animation
      if(sub&&(type==='success'||type==='danger'||type==='gold')){
        const delta=sub.match(/[+-]?\d+/)?.[0]||'';
        const deltaEl=document.createElement('span');
        deltaEl.className='score-delta '+(delta.startsWith('-')?'neg':'pos');
        deltaEl.textContent=delta;
        scoreEl.parentNode.appendChild(deltaEl);
        setTimeout(()=>deltaEl.remove(),900);
      }
      // 3. Confirm button pulse
      const btn=document.getElementById('btn-confirm');
      btn.classList.remove('pulse-ok','pulse-bad');
      void btn.offsetWidth; // force reflow
      btn.classList.add(type==='danger'?'pulse-bad':'pulse-ok');
      // Reset status after 1.1s
      setTimeout(()=>{
        statusEl.className='status-bar';
        setStatus(selected.size>0?`已選 ${selected.size}/${maxSelect} 張`:`揀啱就核對，或直接核對跳過`,'');
      },1100);
    }
  