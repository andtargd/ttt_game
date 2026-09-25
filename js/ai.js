// Компьютерный соперник: негамакс с альфа-бета отсечением.
// В классике перебор полный; в режиме исчезающих фигур игра может длиться
// бесконечно, поэтому глубина ограничена и в листьях используется эвристика.
const AI = (() => {
  const WIN = 1000;
  const ORDER = [4, 0, 2, 6, 8, 1, 3, 5, 7]; // центр и углы — первыми, так отсечение работает лучше
  const VANISH_DEPTH = 8;

  function orderedMoves(board) {
    return ORDER.filter((i) => !board[i]);
  }

  // Оценка позиции с точки зрения того, чей сейчас ход.
  function heuristic(s) {
    const me = s.turn;
    const op = Game.other(me);
    let v = 0;
    for (const l of Game.LINES) {
      let m = 0, o = 0;
      for (const i of l) {
        if (s.board[i] === me) m++;
        else if (s.board[i] === op) o++;
      }
      if (m === 2 && o === 0) v += 10;
      else if (o === 2 && m === 0) v -= 10;
    }
    return v;
  }

  function negamax(s, depth, alpha, beta, ply) {
    if (depth === 0) return heuristic(s);
    let best = -Infinity;
    for (const m of orderedMoves(s.board)) {
      const c = Game.clone(s);
      Game.apply(c, m);
      let score;
      if (c.winner) score = WIN - ply;
      else if (c.draw) score = 0;
      else score = -negamax(c, depth - 1, -beta, -alpha, ply + 1);
      if (score > best) best = score;
      if (best > alpha) alpha = best;
      if (alpha >= beta) break;
    }
    return best;
  }

  // Точная оценка каждого возможного хода (полное окно на корне).
  function evaluate(state) {
    const depth = state.limit ? VANISH_DEPTH : 9;
    return Game.empties(state.board).map((move) => {
      const c = Game.clone(state);
      Game.apply(c, move);
      let score;
      if (c.winner) score = WIN;
      else if (c.draw) score = 0;
      else score = -negamax(c, depth - 1, -Infinity, Infinity, 1);
      return { move, score };
    });
  }

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // mistakeChance — вероятность намеренно выбрать не лучший ход.
  function choose(state, mistakeChance) {
    const scored = evaluate(state);
    const best = Math.max(...scored.map((s) => s.score));
    const top = scored.filter((s) => s.score === best);
    const worse = scored.filter((s) => s.score < best);
    if (worse.length && Math.random() < mistakeChance) return pick(worse).move;
    return pick(top).move;
  }

  return { choose, evaluate };
})();
