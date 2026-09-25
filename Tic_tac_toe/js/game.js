// Чистая логика игры: состояние поля, ходы, проверка победы.
// limit = 0 — классический режим; limit >= 3 — режим исчезающих фигур
// (у каждого игрока на поле не больше limit фигур).
const Game = (() => {
  const LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];

  const other = (p) => (p === 'X' ? 'O' : 'X');

  function create(limit = 0) {
    return {
      board: Array(9).fill(null),
      history: { X: [], O: [] }, // порядок ходов каждого игрока, старые — в начале
      turn: 'X',
      limit,
      winner: null,
      line: null,
      draw: false,
      moves: 0,
    };
  }

  function clone(s) {
    return {
      board: s.board.slice(),
      history: { X: s.history.X.slice(), O: s.history.O.slice() },
      turn: s.turn,
      limit: s.limit,
      winner: s.winner,
      line: s.line,
      draw: s.draw,
      moves: s.moves,
    };
  }

  function findLine(board, p) {
    for (const l of LINES) {
      if (board[l[0]] === p && board[l[1]] === p && board[l[2]] === p) return l;
    }
    return null;
  }

  function empties(board) {
    const res = [];
    for (let i = 0; i < 9; i++) if (!board[i]) res.push(i);
    return res;
  }

  // Делает ход текущего игрока. Возвращает индекс исчезнувшей фигуры (или null).
  function apply(s, i) {
    const p = s.turn;
    s.board[i] = p;
    s.history[p].push(i);

    let removed = null;
    if (s.limit && s.history[p].length > s.limit) {
      removed = s.history[p].shift();
      s.board[removed] = null;
    }

    const line = findLine(s.board, p);
    if (line) {
      s.winner = p;
      s.line = line;
    } else if (!s.limit && s.board.every(Boolean)) {
      s.draw = true;
    }

    s.turn = other(p);
    s.moves++;
    return removed;
  }

  // Фигура текущего игрока, которая исчезнет после его хода.
  function doomed(s) {
    if (!s.limit || s.winner || s.draw) return null;
    const h = s.history[s.turn];
    return h.length >= s.limit ? h[0] : null;
  }

  const isOver = (s) => Boolean(s.winner || s.draw);

  return { LINES, other, create, clone, findLine, empties, apply, doomed, isOver };
})();
