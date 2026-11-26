// ================================================================
//  HANGMAN — PewPlay
//  @bg #f4efe6
//  @accent #e4572e
//  @light
//  Indovina la parola lettera per lettera prima che il disegno sia
//  completo. Categoria come indizio, 6 errori, serie di vittorie.
// ================================================================
(function () {
  'use strict';
  const { clamp, sfx, store } = PP;

  const GAME_ID = 'hangman';
  const BANK = {
    Animals: 'ELEPHANT GIRAFFE KANGAROO PENGUIN CROCODILE BUTTERFLY SQUIRREL HEDGEHOG FLAMINGO OCTOPUS CHEETAH GORILLA PANTHER RACCOON TORTOISE',
    Food: 'SPAGHETTI SANDWICH PANCAKES AVOCADO BROCCOLI CHOCOLATE PINEAPPLE STRAWBERRY BURRITO DUMPLING LASAGNA PRETZEL MUFFIN POPCORN',
    Countries: 'ARGENTINA AUSTRALIA CANADA EGYPT FINLAND GERMANY ICELAND INDONESIA JAPAN KENYA MEXICO NORWAY PORTUGAL VIETNAM BRAZIL',
    Sports: 'BASKETBALL VOLLEYBALL BADMINTON SWIMMING GYMNASTICS SKATEBOARD MARATHON WRESTLING SNOWBOARD TRIATHLON FENCING BOWLING',
    Science: 'MOLECULE GRAVITY TELESCOPE ELECTRON MAGNET OXYGEN VOLCANO FOSSIL BACTERIA ENERGY CRYSTAL GALAXY EQUATION PROTEIN',
    Home: 'KITCHEN BLANKET WARDROBE CUPBOARD BATHTUB STAIRCASE CURTAIN PILLOW LANTERN CHIMNEY DOORBELL BOOKSHELF CARPET MIRROR',
    Jobs: 'ARCHITECT ASTRONAUT CARPENTER ELECTRICIAN FIREFIGHTER JOURNALIST LIBRARIAN MECHANIC MUSICIAN PHOTOGRAPHER SCIENTIST VETERINARIAN',
    Nature: 'WATERFALL RAINFOREST THUNDERSTORM GLACIER LIGHTNING SUNFLOWER MOUNTAIN HURRICANE MEADOW CANYON AVALANCHE LAGOON',
  };
  const CATS = Object.keys(BANK);
  const LEVELS = ['Easy', 'Normal', 'Hard'];
  const LIVES = [8, 6, 5];
  const KEYS = ['ABCDEFGHI', 'JKLMNOPQR', 'STUVWXYZ'];

  let level = 1;
  let word, cat, guessed, wrong, done, won, streak, shake, swing, keyRects = [], lastWords = [];

  function start() {
    streak = store.get('streak', 0);
    newWord();
  }
  function newWord() {
    cat = PP.pick(CATS);
    let pool = BANK[cat].split(' ').filter(w => !lastWords.includes(w));
    if (level === 0) { const short = pool.filter(w => w.length <= 8); if (short.length) pool = short; }
    word = PP.pick(pool);
    lastWords.push(word); if (lastWords.length > 20) lastWords.shift();
    guessed = new Set(); wrong = 0; done = false; won = false; shake = 0; swing = 0;
    // facile: una lettera già scoperta
    if (level === 0) guessed.add(PP.pick([...word]));
  }

  function guess(ch) {
    if (done || guessed.has(ch)) return;
    guessed.add(ch);
    if (word.includes(ch)) {
      const n = [...word].filter(c => c === ch).length;
      sfx.tone(520 + n * 80, 0.08, 'triangle', 0.13);
      if ([...word].every(c => guessed.has(c))) win();
    } else {
      wrong++; shake = 0.35; swing = 1;
      sfx.tone(200, 0.15, 'sawtooth', 0.08, 140);
      if (wrong >= LIVES[level]) lose();
    }
  }
  function win() {
    done = true; won = true; streak++;
    store.set('streak', streak); store.set('bestStreak', Math.max(store.get('bestStreak', 0), streak));
    store.set('wins', store.get('wins', 0) + 1);
    sfx.win();
    PP.burst(PP.W / 2, PP.H * 0.35, ['#e4572e', '#29335c', '#f3a712', '#669bbc'], 50, 360, 5, 1.2, 300);
  }
  function lose() {
    done = true; won = false;
    const s = streak; streak = 0; store.set('streak', 0);
    sfx.lose();
    PP.game.overDelay = 1500;
    PP.over('Out of guesses', `The word was ${word} (${cat}).\nStreak: ${s} · Best streak: ${store.get('bestStreak', 0)}`);
  }

  function update(dt) { shake = Math.max(0, shake - dt); swing = Math.max(0, swing - dt * 0.7); }

  // ── DISEGNO ─────────────────────────────────────
  function layout() {
    const W = PP.W, H = PP.H;
    const land = W > H * 1.2;
    const kbH = clamp(H * (land ? 0.36 : 0.28), 140, 220);
    return { land, kbH, kbY: H - kbH - 10, figX: land ? W * 0.25 : W / 2, figY: land ? 70 : 60, figH: land ? H - kbH - 110 : (H - kbH - 70) * 0.48 };
  }

  function drawFigure(ctx, L) {
    const h = clamp(L.figH, 80, 340), s = h / 300, x = L.figX - 60 * s, y = L.figY;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#6b4f35'; ctx.lineWidth = 10;
    // patibolo in legno
    ctx.beginPath(); ctx.moveTo(-30, 290); ctx.lineTo(150, 290); ctx.moveTo(10, 290); ctx.lineTo(10, 10); ctx.lineTo(150, 10); ctx.moveTo(10, 60); ctx.lineTo(60, 10); ctx.stroke();
    ctx.strokeStyle = '#b08a5a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(150, 10); ctx.lineTo(150, 50); ctx.stroke();
    const lives = LIVES[level];
    // parti del corpo in proporzione agli errori (6 parti)
    const parts = Math.round(wrong / lives * 6);
    ctx.save(); ctx.translate(150, 50); ctx.rotate(Math.sin(PP.time * 6) * 0.08 * swing);
    ctx.strokeStyle = '#29335c'; ctx.lineWidth = 7;
    if (parts >= 1) { ctx.beginPath(); ctx.arc(0, 28, 26, 0, 7); ctx.fillStyle = '#ffe3c9'; ctx.fill(); ctx.stroke();
      if (done && !won) { ctx.lineWidth = 3; for (const ex of [-9, 9]) { ctx.beginPath(); ctx.moveTo(ex - 5, 22); ctx.lineTo(ex + 5, 30); ctx.moveTo(ex + 5, 22); ctx.lineTo(ex - 5, 30); ctx.stroke(); } }
      else { ctx.fillStyle = '#29335c'; PP.circle(-9, 26, 3.5, '#29335c'); PP.circle(9, 26, 3.5, '#29335c'); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 36, 8, parts >= 4 ? Math.PI * 1.15 : 0.2, parts >= 4 ? Math.PI * 1.85 : Math.PI - 0.2); ctx.stroke(); }
      ctx.lineWidth = 7; }
    if (parts >= 2) { ctx.beginPath(); ctx.moveTo(0, 54); ctx.lineTo(0, 140); ctx.stroke(); }
    if (parts >= 3) { ctx.beginPath(); ctx.moveTo(0, 75); ctx.lineTo(-38, 110); ctx.stroke(); }
    if (parts >= 4) { ctx.beginPath(); ctx.moveTo(0, 75); ctx.lineTo(38, 110); ctx.stroke(); }
    if (parts >= 5) { ctx.beginPath(); ctx.moveTo(0, 140); ctx.lineTo(-30, 195); ctx.stroke(); }
    if (parts >= 6) { ctx.beginPath(); ctx.moveTo(0, 140); ctx.lineTo(30, 195); ctx.stroke(); }
    ctx.restore();
    ctx.restore();
  }

  function draw(ctx, W, H) {
    ctx.fillStyle = '#f4efe6'; ctx.fillRect(0, 0, W, H);
    // righe di quaderno
    ctx.strokeStyle = 'rgba(41,51,92,.07)'; ctx.lineWidth = 1;
    for (let y = 30; y < H; y += 28) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    if (!word) { newWord(); }
    const L = layout();
    if (PP.state === 'menu') { wrong = 4; drawFigure(ctx, { ...L, figX: W / 2, figY: H * 0.08, figH: H * 0.3 }); wrong = 0; return; }
    drawFigure(ctx, L);
    // parola
    const area = L.land ? { x: W * 0.48, w: W * 0.5, y: L.figY + L.figH * 0.45 } : { x: 12, w: W - 24, y: L.figY + clamp(L.figH, 80, 340) + 76 };
    const n = word.length, slot = Math.min(54, area.w / n);
    const x0 = area.x + area.w / 2 - (slot * n) / 2 + (shake > 0 ? Math.sin(shake * 60) * 6 : 0);
    PP.text(cat.toUpperCase(), area.x + area.w / 2, area.y - slot * 0.9, 13, '#e4572e', 'center', 900);
    for (let i = 0; i < n; i++) {
      const ch = word[i], show = guessed.has(ch) || done;
      const cx = x0 + slot * (i + 0.5);
      ctx.fillStyle = '#29335c'; ctx.fillRect(cx - slot * 0.36, area.y + slot * 0.42, slot * 0.72, 3);
      if (show) PP.text(ch, cx, area.y, slot * 0.7, guessed.has(ch) ? '#29335c' : '#e4572e', 'center', 900);
    }
    PP.text(`Streak ${streak}`, 14, 30, 17, '#29335c', 'left', 800);
    PP.text(`${LIVES[level] - wrong} guesses left`, 14, 52, 12, wrong >= LIVES[level] - 2 ? '#e4572e' : 'rgba(41,51,92,.65)', 'left', 700);
    // tastiera
    keyRects = [];
    const kh = (L.kbH - 20) / 3, gap = 6;
    KEYS.forEach((row, r) => {
      const kw = Math.min(52, (W - 16 - gap * 8) / 9);
      const total = row.length * kw + (row.length - 1) * gap;
      [...row].forEach((ch, i) => {
        const x = W / 2 - total / 2 + i * (kw + gap), y = L.kbY + r * (kh + 6);
        const used = guessed.has(ch), good = used && word.includes(ch);
        PP.rr(x, y, kw, kh, 8);
        ctx.fillStyle = !used ? '#fff' : good ? '#5ac46e' : '#d6d0c4'; ctx.fill();
        ctx.strokeStyle = 'rgba(41,51,92,.15)'; ctx.lineWidth = 1; ctx.stroke();
        PP.text(ch, x + kw / 2, y + kh / 2 + 1, Math.min(20, kw * 0.48), used && !good ? 'rgba(41,51,92,.35)' : used ? '#fff' : '#29335c', 'center', 800);
        keyRects.push({ ch, x, y, w: kw, h: kh });
      });
    });
    if (done && won) {
      const bw = 170, bh = 48, bx = W / 2 - bw / 2, by = L.kbY - bh - 14;
      keyRects.push({ ch: 'NEXT', x: bx, y: by, w: bw, h: bh });
      PP.rr(bx, by, bw, bh, 14); ctx.fillStyle = '#e4572e'; ctx.fill();
      PP.text('Next word →', W / 2, by + bh / 2 + 1, 17, '#fff', 'center', 800);
    }
    PP.drawFx();
  }

  function pointerDown(p) {
    for (const k of keyRects) if (p.x >= k.x && p.x <= k.x + k.w && p.y >= k.y && p.y <= k.y + k.h) {
      if (k.ch === 'NEXT') { newWord(); sfx.click(); } else guess(k.ch);
      return;
    }
  }
  function keyDown(code) {
    if (/^Key[A-Z]$/.test(code)) guess(code.slice(3));
    if ((code === 'Enter' || code === 'Space') && done && won) newWord();
  }

  function demo(n) {
    level = 1; streak = [0, 3, 7, 1][n];
    cat = ['', 'Animals', 'Countries', 'Food'][n]; word = ['', 'PENGUIN', 'PORTUGAL', 'AVOCADO'][n];
    guessed = new Set(n === 1 ? ['E', 'N', 'S', 'T', 'G'] : n === 2 ? ['P', 'O', 'R', 'T', 'U', 'G', 'A', 'L', 'E'] : ['A', 'O', 'Z', 'Q', 'K', 'M']);
    wrong = [...guessed].filter(c => !word.includes(c)).length;
    done = n === 2; won = n === 2; shake = 0; swing = 0;
    if (n === 2) PP.burst(PP.W / 2, PP.H * 0.35, ['#e4572e', '#29335c', '#f3a712', '#669bbc'], 40, 260, 5, 2, 0);
  }

  function icon(c, S) {
    c.fillStyle = '#f4efe6'; c.fillRect(0, 0, S, S);
    c.lineCap = 'round'; c.strokeStyle = '#6b4f35'; c.lineWidth = S * 0.035;
    c.beginPath(); c.moveTo(S * 0.28, S * 0.78); c.lineTo(S * 0.72, S * 0.78); c.moveTo(S * 0.36, S * 0.78); c.lineTo(S * 0.36, S * 0.22); c.lineTo(S * 0.62, S * 0.22); c.stroke();
    c.strokeStyle = '#b08a5a'; c.lineWidth = S * 0.012; c.beginPath(); c.moveTo(S * 0.62, S * 0.22); c.lineTo(S * 0.62, S * 0.3); c.stroke();
    c.strokeStyle = '#29335c'; c.lineWidth = S * 0.022; c.fillStyle = '#ffe3c9';
    c.beginPath(); c.arc(S * 0.62, S * 0.36, S * 0.06, 0, 7); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(S * 0.62, S * 0.42); c.lineTo(S * 0.62, S * 0.58); c.moveTo(S * 0.62, S * 0.46); c.lineTo(S * 0.55, S * 0.53); c.stroke();
    c.fillStyle = '#e4572e'; c.font = `900 ${S * 0.1}px system-ui, sans-serif`; c.textAlign = 'center'; c.fillText('A _ C', S * 0.5, S * 0.7);
  }

  PP.run({
    id: GAME_ID,
    title: 'Hangman',
    intro: 'Guess the hidden word one letter at a time before the drawing is finished.\nThe category is your clue.',
    choices: () => [{ label: 'Difficulty', options: LEVELS, value: level, onChange: i => { level = i; store.set('level', i); } }],
    bestText: () => { const b = store.get('bestStreak', 0); return b ? `Best streak: ${b} · Words solved: ${store.get('wins', 0)}` : ''; },
    pauseText: () => `Streak ${streak}`,
    lettersInput: true,
    init() { level = store.get('level', 1); },
    start, update, draw, pointerDown, keyDown, demo, icon,
  });
})();
