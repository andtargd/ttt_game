// Интерфейс: отрисовка поля, настройки, счёт, звук.
(() => {
  'use strict';

  const MISTAKE_CHANCE = 0.15; // вероятность, что компьютер сделает неудачный ход
  const MIN_LIMIT = 3;
  const MAX_LIMIT = 4; // при 5+ фигурах у каждого поле 3×3 заполнится раньше, чем что-то исчезнет

  const $ = (s) => document.querySelector(s);
  const t = I18N.t;

  const store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem('ttt.' + key);
        return v === null ? fallback : JSON.parse(v);
      } catch { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem('ttt.' + key, JSON.stringify(value)); } catch { /* приватный режим */ }
    },
  };

  const settings = {
    opponent: 'pvc',
    side: 'X',
    mode: 'classic',
    limit: 3,
    showDoomed: true,
    lang: I18N.detect(),
    ...store.get('settings', {}),
  };
  if (!I18N.has(settings.lang)) settings.lang = I18N.detect();
  I18N.set(settings.lang);
  settings.limit = Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, Number(settings.limit) || MIN_LIMIT));

  let volume = store.get('volume', 0.6);
  let muted = store.get('muted', false);

  const els = {
    board: $('#board'),
    winSvg: $('#winSvg'),
    winLine: $('#winLine'),
    status: $('#status'),
    newGame: $('#newGame'),
    resetScore: $('#resetScore'),
    rules: $('#rules'),
    sideBlock: $('#sideBlock'),
    vanishBlock: $('#vanishBlock'),
    limitVal: $('#limitVal'),
    limitDec: $('#limitDec'),
    limitInc: $('#limitInc'),
    showDoomed: $('#showDoomed'),
    volume: $('#volume'),
    muteBtn: $('#muteBtn'),
    card: { X: $('#cardX'), O: $('#cardO') },
    name: { X: $('#nameX'), O: $('#nameO') },
    score: { X: $('#scoreX'), O: $('#scoreO'), D: $('#scoreD') },
    pieces: { X: $('#piecesX'), O: $('#piecesO') },
  };

  // ---------- SVG фигур ----------
  const SHAPE = {
    X: '<path d="M30 30 L70 70"/><path d="M70 30 L30 70"/>',
    O: '<circle cx="50" cy="50" r="24"/>',
  };
  const shapeSVG = (p, cls) =>
    `<svg class="${cls} ${p.toLowerCase()}" viewBox="0 0 100 100" aria-hidden="true"><g>${SHAPE[p]}</g></svg>`;
  const miniSVG = (p) => (p === 'X'
    ? '<svg class="mini x" viewBox="0 0 100 100" aria-hidden="true"><path d="M28 28 72 72M72 28 28 72"/></svg>'
    : '<svg class="mini o" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="26"/></svg>');

  // ---------- Поле ----------
  const cells = [];
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'cell empty';
    cell.innerHTML = shapeSVG('X', 'ghost') + shapeSVG('O', 'ghost');
    cell.addEventListener('click', () => onCellClick(i));
    els.board.insertBefore(cell, els.winSvg);
    cells.push(cell);
  }

  let state = null;
  let score = { X: 0, O: 0, D: 0 };
  let token = 0; // растёт при каждой новой партии — отменяет «устаревшие» таймеры
  let thinking = false;
  let statusHTML = '';

  const isCPU = (p) => settings.opponent === 'pvc' && p !== settings.side;

  function playerName(p) {
    if (settings.opponent === 'pvc') return t(p === settings.side ? 'you' : 'computer');
    return t(p === 'X' ? 'player1' : 'player2');
  }

  function onCellClick(i) {
    Sound.unlock();
    if (Game.isOver(state)) { newGame(); return; }
    if (thinking || isCPU(state.turn)) return;
    if (state.board[i]) {
      Sound.play('error');
      shake(cells[i]);
      return;
    }
    makeMove(i);
  }

  function makeMove(i) {
    const p = state.turn;
    const removed = Game.apply(state, i);

    placeMark(i, p);
    Sound.play(p === 'X' ? 'x' : 'o');
    if (removed !== null) {
      vanishMark(removed);
      Sound.play('vanish');
    }
    updateCells();

    if (Game.isOver(state)) { finish(); return; }
    if (isCPU(state.turn)) cpuMove();
    else updateTurn();
  }

  function cpuMove() {
    thinking = true;
    els.board.classList.add('locked');
    updateTurn();
    const t = token;
    setTimeout(() => {
      if (t !== token) return;
      const move = AI.choose(state, MISTAKE_CHANCE);
      thinking = false;
      els.board.classList.remove('locked');
      makeMove(move);
    }, 450 + Math.random() * 350);
  }

  function placeMark(i, p) {
    const cell = cells[i];
    cell.insertAdjacentHTML('beforeend', shapeSVG(p, 'mark'));
    cell.dataset.p = p;
  }

  function vanishMark(i) {
    const mark = cells[i].querySelector('.mark:not(.vanish)');
    if (!mark) return;
    mark.classList.add('vanish');
    setTimeout(() => mark.remove(), 650);
  }

  function shake(el) {
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
  }

  function updateCells() {
    const doomed = settings.showDoomed ? Game.doomed(state) : null;
    cells.forEach((cell, i) => {
      const v = state.board[i];
      cell.classList.toggle('empty', !v);
      cell.classList.toggle('doomed', i === doomed);
      const row = Math.floor(i / 3) + 1;
      const col = (i % 3) + 1;
      const what = t(v ? (v === 'X' ? 'cellX' : 'cellO') : 'cellEmpty') + (i === doomed ? t('cellDoomed') : '');
      cell.setAttribute('aria-label', t('cell', { r: row, c: col, what }));
    });
    renderPieces();
  }

  function renderPieces() {
    const vanish = Boolean(state.limit);
    document.body.classList.toggle('vanish-mode', vanish);
    for (const p of ['X', 'O']) {
      const box = els.pieces[p];
      if (!vanish) { box.innerHTML = ''; continue; }
      const count = state.history[p].length;
      const doomedSoon = settings.showDoomed && !Game.isOver(state) && state.turn === p && count >= state.limit;
      let html = '';
      for (let k = 0; k < state.limit; k++) {
        const cls = [k < count ? 'on' : '', doomedSoon && k === 0 ? 'old' : ''].join(' ').trim();
        html += `<i class="${cls}"></i>`;
      }
      box.innerHTML = html;
    }
  }

  function setStatus(html) {
    if (statusHTML === html) return;
    statusHTML = html;
    els.status.innerHTML = html;
    els.status.classList.remove('swap');
    void els.status.offsetWidth;
    els.status.classList.add('swap');
  }

  function updateTurn() {
    const p = state.turn;
    els.board.dataset.turn = p;
    els.card.X.classList.toggle('active', p === 'X');
    els.card.O.classList.toggle('active', p === 'O');
    renderStatus();
  }

  function renderStatus() {
    const p = state.turn;
    const w = state.winner;
    if (state.draw) {
      setStatus(`<span>${t('draw')}</span>`);
    } else if (w) {
      let text;
      if (settings.opponent === 'pvc') text = t(w === settings.side ? 'youWon' : 'cpuWon');
      else text = t('winnerIs', { name: playerName(w) });
      setStatus(`${miniSVG(w)}<span>${text}</span>`);
    } else if (thinking) {
      setStatus(`${miniSVG(p)}<span>${t('thinking')}</span><span class="dots"><i></i><i></i><i></i></span>`);
    } else if (settings.opponent === 'pvc') {
      setStatus(`${miniSVG(p)}<span>${t('yourTurn')}</span>`);
    } else {
      setStatus(`${miniSVG(p)}<span>${t('turnOf', { name: playerName(p) })}</span>`);
    }
  }

  function finish() {
    const w = state.winner;
    els.board.classList.add('over', 'locked');
    els.card.X.classList.remove('active');
    els.card.O.classList.remove('active');

    if (w) {
      state.line.forEach((i) => cells[i].classList.add('win'));
      drawWinLine(state.line, w);
      addScore(w);
      const cpuWon = settings.opponent === 'pvc' && w !== settings.side;
      Sound.play(cpuWon ? 'lose' : 'win');
    } else {
      addScore('D');
      Sound.play('draw');
    }
    renderStatus();
    els.newGame.classList.add('attention');
  }

  function drawWinLine(line, p) {
    const center = (i) => [(i % 3) * 100 + 50, Math.floor(i / 3) * 100 + 50];
    const [ax, ay] = center(line[0]);
    const [bx, by] = center(line[2]);
    const len0 = Math.hypot(bx - ax, by - ay);
    const ext = 34; // линия чуть выходит за крайние клетки
    const ux = (bx - ax) / len0;
    const uy = (by - ay) / len0;
    const l = els.winLine;
    l.setAttribute('x1', ax - ux * ext);
    l.setAttribute('y1', ay - uy * ext);
    l.setAttribute('x2', bx + ux * ext);
    l.setAttribute('y2', by + uy * ext);
    const len = len0 + ext * 2;
    l.setAttribute('class', p.toLowerCase());
    l.style.strokeDasharray = len;
    l.style.strokeDashoffset = len;
    void l.getBoundingClientRect();
    l.classList.add('show');
    l.style.strokeDashoffset = 0;
  }

  function hideWinLine() {
    els.winLine.setAttribute('class', '');
  }

  function addScore(key) {
    score[key]++;
    const el = els.score[key];
    el.textContent = score[key];
    el.classList.remove('bump');
    void el.offsetWidth;
    el.classList.add('bump');
  }

  function resetScore() {
    score = { X: 0, O: 0, D: 0 };
    for (const k of ['X', 'O', 'D']) els.score[k].textContent = '0';
  }

  // ---------- Партия ----------
  function newGame() {
    token++;
    thinking = false;
    els.newGame.classList.remove('attention');
    const hasMarks = els.board.querySelector('.mark');
    if (hasMarks && state) {
      const t = token;
      els.board.classList.add('clearing', 'locked');
      setTimeout(() => { if (t === token) startRound(); }, 300);
    } else {
      startRound();
    }
  }

  function startRound() {
    cells.forEach((cell) => {
      cell.querySelectorAll('.mark').forEach((m) => m.remove());
      cell.classList.remove('win', 'doomed', 'shake');
    });
    hideWinLine();
    els.board.classList.remove('clearing', 'locked', 'over');
    state = Game.create(settings.mode === 'vanish' ? settings.limit : 0);
    updateCells();
    if (isCPU(state.turn)) cpuMove();
    else updateTurn();
  }

  // ---------- Настройки ----------
  function syncSettingsUI() {
    document.querySelectorAll('.segmented').forEach((seg) => {
      const key = seg.dataset.setting;
      const buttons = [...seg.querySelectorAll('button')];
      const idx = Math.max(0, buttons.findIndex((b) => b.dataset.value === settings[key]));
      buttons.forEach((b, k) => {
        b.classList.toggle('active', k === idx);
        b.setAttribute('aria-pressed', k === idx);
      });
      seg.style.setProperty('--n', buttons.length);
      seg.style.setProperty('--idx', idx);
    });

    els.sideBlock.classList.toggle('closed', settings.opponent !== 'pvc');
    els.vanishBlock.classList.toggle('closed', settings.mode !== 'vanish');
    els.limitVal.textContent = settings.limit;
    els.limitDec.disabled = settings.limit <= MIN_LIMIT;
    els.limitInc.disabled = settings.limit >= MAX_LIMIT;
    els.showDoomed.checked = settings.showDoomed;

    for (const p of ['X', 'O']) els.name[p].textContent = playerName(p);

    els.rules.textContent = settings.mode === 'vanish'
      ? t('rulesVanish', { k: settings.limit, next: settings.limit + 1 })
      : t('rulesClassic');
  }

  function changeSetting(key, value) {
    if (settings[key] === value) return;
    settings[key] = value;
    store.set('settings', settings);
    Sound.play('click');
    syncSettingsUI();
    resetScore();
    newGame();
  }

  document.querySelectorAll('.segmented').forEach((seg) => {
    seg.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      if (seg.dataset.setting === 'lang') setLang(btn.dataset.value);
      else changeSetting(seg.dataset.setting, btn.dataset.value);
    });
  });

  // Смена языка не перезапускает партию и не сбрасывает счёт.
  function setLang(lang) {
    if (settings.lang === lang || !I18N.has(lang)) return;
    settings.lang = lang;
    store.set('settings', settings);
    Sound.play('click');
    I18N.set(lang);
    I18N.apply();
    syncSettingsUI();
    syncVolumeUI();
    updateCells();
    renderStatus();
  }

  function bumpLimit(delta) {
    const next = Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, settings.limit + delta));
    if (next === settings.limit) return;
    changeSetting('limit', next);
    els.limitVal.classList.remove('bump');
    void els.limitVal.offsetWidth;
    els.limitVal.classList.add('bump');
  }
  els.limitDec.addEventListener('click', () => bumpLimit(-1));
  els.limitInc.addEventListener('click', () => bumpLimit(1));

  els.showDoomed.addEventListener('change', () => {
    settings.showDoomed = els.showDoomed.checked;
    store.set('settings', settings);
    Sound.play('click');
    updateCells();
  });

  els.newGame.addEventListener('click', () => { Sound.play('click'); newGame(); });
  els.resetScore.addEventListener('click', () => { Sound.play('click'); resetScore(); });

  // ---------- Громкость ----------
  const ICONS = {
    off: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l5 5M22 9l-5 5"/>',
    low: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 9.5a3.5 3.5 0 0 1 0 5"/>',
    high: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 9.5a3.5 3.5 0 0 1 0 5"/><path d="M19 7a7 7 0 0 1 0 10"/>',
  };

  function syncVolumeUI() {
    const level = muted || volume === 0 ? 'off' : volume < 0.5 ? 'low' : 'high';
    els.muteBtn.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[level]}</svg>`;
    els.muteBtn.setAttribute('aria-label', t(level === 'off' ? 'unmute' : 'mute'));
    const shown = muted ? 0 : Math.round(volume * 100);
    els.volume.value = shown;
    els.volume.style.setProperty('--val', shown + '%');
    Sound.setVolume(volume);
    Sound.setMuted(muted);
  }

  els.volume.addEventListener('input', () => {
    volume = els.volume.value / 100;
    muted = false;
    syncVolumeUI();
    store.set('volume', volume);
    store.set('muted', muted);
  });
  els.volume.addEventListener('change', () => Sound.play('click'));

  els.muteBtn.addEventListener('click', () => {
    muted = !muted;
    if (!muted && volume === 0) volume = 0.5;
    syncVolumeUI();
    store.set('volume', volume);
    store.set('muted', muted);
    Sound.play('click');
  });

  // ---------- Старт ----------
  I18N.apply();
  syncVolumeUI();
  syncSettingsUI();
  startRound();
  setTimeout(() => els.board.classList.remove('intro'), 1200);
})();
