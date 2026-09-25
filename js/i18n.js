// Переводы интерфейса. Статичные тексты размечены в HTML атрибутами
// data-i18n (текст) и data-i18n-aria (aria-label), динамические берутся через I18N.t().
const I18N = (() => {
  const dict = {
    ru: {
      docTitle: 'Крестики-нолики',
      titleX: 'Крестики', titleSep: '-', titleO: 'нолики',
      language: 'Язык',
      volume: 'Громкость', mute: 'Выключить звук', unmute: 'Включить звук',
      settings: 'Настройки',
      opponent: 'Соперник', pvp: 'Игрок', pvc: 'Компьютер',
      side: 'Вы играете за', sideX: 'Крестики', sideO: 'Нолики',
      sideHint: 'Крестики всегда ходят первыми',
      mode: 'Режим игры', classic: 'Классический', vanish: 'Исчезающие',
      doomed: 'Подсветка исчезновения', doomedHint: 'Какая фигура пропадёт следующим ходом',
      newGame: 'Новая игра', resetScore: 'Сбросить счёт', draws: 'Ничьи',
      you: 'Вы', computer: 'Компьютер', player1: 'Игрок 1', player2: 'Игрок 2',
      yourTurn: 'Ваш ход', thinking: 'Компьютер думает', turnOf: 'Ходит {name}',
      youWon: 'Вы победили!', cpuWon: 'Компьютер победил', winnerIs: 'Победил {name}!', draw: 'Ничья!',
      rulesClassic: 'Соберите три фигуры в ряд — по горизонтали, вертикали или диагонали. Нет свободных клеток — ничья.',
      rulesVanish: 'У каждого на поле не больше {k} фигур: когда ставите {next}‑ю, ваша самая старая фигура исчезает. Ничьих нет — играем до победы.',
      cell: 'Ряд {r}, столбец {c}: {what}', cellX: 'крестик', cellO: 'нолик', cellEmpty: 'пусто', cellDoomed: ', исчезнет',
    },
    en: {
      docTitle: 'Tic-Tac-Toe',
      titleX: 'Tic-Tac', titleSep: '-', titleO: 'Toe',
      language: 'Language',
      volume: 'Volume', mute: 'Mute', unmute: 'Unmute',
      settings: 'Settings',
      opponent: 'Opponent', pvp: 'Player', pvc: 'Computer',
      side: 'You play as', sideX: 'Crosses', sideO: 'Noughts',
      sideHint: 'Crosses always move first',
      mode: 'Game mode', classic: 'Classic', vanish: 'Vanishing',
      doomed: 'Vanish highlight', doomedHint: 'Shows which piece disappears next move',
      newGame: 'New game', resetScore: 'Reset score', draws: 'Draws',
      you: 'You', computer: 'Computer', player1: 'Player 1', player2: 'Player 2',
      yourTurn: 'Your turn', thinking: 'Computer is thinking', turnOf: '{name}’s turn',
      youWon: 'You win!', cpuWon: 'Computer wins', winnerIs: '{name} wins!', draw: 'It’s a draw!',
      rulesClassic: 'Get three in a row — horizontally, vertically or diagonally. No free cells left means a draw.',
      rulesVanish: 'Each player can have at most {k} pieces on the board: when you place your {next}th, your oldest piece vanishes. No draws — play until someone wins.',
      cell: 'Row {r}, column {c}: {what}', cellX: 'cross', cellO: 'nought', cellEmpty: 'empty', cellDoomed: ', will vanish',
    },
    th: {
      docTitle: 'เอ็กซ์-โอ',
      titleX: 'เอ็กซ์', titleSep: '-', titleO: 'โอ',
      language: 'ภาษา',
      volume: 'ระดับเสียง', mute: 'ปิดเสียง', unmute: 'เปิดเสียง',
      settings: 'การตั้งค่า',
      opponent: 'คู่แข่ง', pvp: 'ผู้เล่น', pvc: 'คอมพิวเตอร์',
      side: 'คุณเล่นเป็น', sideX: 'กากบาท', sideO: 'วงกลม',
      sideHint: 'กากบาทเดินก่อนเสมอ',
      mode: 'โหมดเกม', classic: 'คลาสสิก', vanish: 'ตัวหายได้',
      doomed: 'ไฮไลต์ตัวที่จะหาย', doomedHint: 'แสดงว่าตัวไหนจะหายไปในตาถัดไป',
      newGame: 'เกมใหม่', resetScore: 'รีเซ็ตคะแนน', draws: 'เสมอ',
      you: 'คุณ', computer: 'คอมพิวเตอร์', player1: 'ผู้เล่น 1', player2: 'ผู้เล่น 2',
      yourTurn: 'ตาของคุณ', thinking: 'คอมพิวเตอร์กำลังคิด', turnOf: 'ตาของ{name}',
      youWon: 'คุณชนะ!', cpuWon: 'คอมพิวเตอร์ชนะ', winnerIs: '{name} ชนะ!', draw: 'เสมอ!',
      rulesClassic: 'เรียงให้ได้สามตัวในแถวเดียว — แนวนอน แนวตั้ง หรือแนวทแยง ถ้าช่องเต็มแล้วถือว่าเสมอ',
      rulesVanish: 'แต่ละคนมีตัวบนกระดานได้ไม่เกิน {k} ตัว เมื่อวางตัวที่ {next} ตัวที่เก่าที่สุดของคุณจะหายไป ไม่มีการเสมอ — เล่นจนกว่าจะมีผู้ชนะ',
      cell: 'แถว {r} คอลัมน์ {c}: {what}', cellX: 'กากบาท', cellO: 'วงกลม', cellEmpty: 'ว่าง', cellDoomed: ', จะหายไป',
    },
  };

  let lang = 'ru';

  function detect() {
    const l = (navigator.language || '').toLowerCase();
    if (l.startsWith('ru')) return 'ru';
    if (l.startsWith('th')) return 'th';
    return 'en';
  }

  function t(key, params = {}) {
    const s = dict[lang][key] ?? dict.en[key] ?? key;
    return s.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? '');
  }

  function apply() {
    document.documentElement.lang = lang;
    document.title = t('docTitle');
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
      el.setAttribute('aria-label', t(el.dataset.i18nAria));
    });
  }

  return {
    t,
    apply,
    detect,
    has: (l) => Object.prototype.hasOwnProperty.call(dict, l),
    set(l) { lang = l; },
  };
})();
