/* 首屏开场「收好最后一个玩具」：小孩把箱子推上星星，星光升空成月亮。
   移植 App 的 OpeningRenderer（sleepy-game SleepyGameKit/Sources/SceneRender），时间线取 OpeningTuning。
   播一次停在终帧；点首屏重播；「减弱动态效果」时直接显示终帧。
   渐进增强：脚本不跑时首屏只有夜色与标题，照样能读。 */
(function () {
  var hero = document.getElementById('hero'), cv = document.getElementById('heroSky');
  if (!hero || !cv || !cv.getContext) return;
  var g = cv.getContext('2d');

  // OpeningTuning 的时间点（秒）
  var T = { stillEnd: 0.35, pushEnd: 1.15, burstEnd: 1.6, riseStart: 1.2, riseEnd: 1.95,
            starsStart: 1.3, hopStart: 1.75, hopEnd: 2.05, end: 2.45 };
  var CELL = 36, PX = 3;                 // 一格 36 CSS 像素；精灵 12×12，每像素 3
  var NIGHT = '#0D1221', STAR = '#F1D48C', MINT = '#A8E0C8';
  var MOON_R = 26;

  // 像素精灵（与 App 的 SpriteLibrary 同源）
  var KID = ['....cccc....', '...cccccc...', '..ccccccccp.', '..hhhhhhhh..', '..ffffffff..', '..fkkffkkf..',
             '..frffffrf..', '...ffffff...', '..bbbbbbbb..', '.bbbwbbbwbb.', '.bbbbbbbbbb.', '..dd....dd..'];
  var KID_PAL = { c: '#B3A6E6', h: '#D8D0F0', p: '#F1D48C', f: '#E6C3A5', k: '#2A2238', r: '#E3A0AE',
                  b: '#8EC3EA', w: '#D6ECFA', d: '#4D5E8E' };
  var CRATE = ['oooooooooooo', 'ohhhhhhhhhho', 'ohwwwwwwwwso', 'ohxwwwwwwxso', 'ohwxwwwwxwso', 'ohwwxwwxwwso',
               'ohwwwxxwwwso', 'ohwwxwwxwwso', 'ohwxwwwwxwso', 'ohxwwwwwwxso', 'ohssssssssso', 'oooooooooooo'];
  var CRATE_PAL = { o: '#3E2818', h: '#E0B07A', w: '#C08A58', x: '#7A5234', s: '#8E6440' };
  var CRATE_GOAL_PAL = { o: '#173C34', h: '#CDEFE0', w: '#8FD6BA', x: '#3F8A72', s: '#5FA88E' };

  // 22 颗星：固定位置（上 62% 区域）
  var STARS = [];
  for (var i = 0; i < 22; i++) {
    STARS.push([(Math.sin(i * 12.9898) * 43758.5453 % 1 + 1) % 1,
                ((Math.sin(i * 78.233) * 12345.678 % 1 + 1) % 1) * 0.62]);
  }

  function seg(t, a, b) { return Math.max(0, Math.min(1, (t - a) / (b - a))); }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function rgba(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return 'rgba(' + (n >> 16) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  function sprite(rows, pal, x, y) {
    for (var r = 0; r < rows.length; r++) {
      for (var c = 0; c < rows[r].length; c++) {
        var col = pal[rows[r].charAt(c)];
        if (!col) continue;
        g.fillStyle = col;
        g.fillRect(Math.round(x + c * PX), Math.round(y + r * PX), PX, PX);
      }
    }
  }
  // 像素月：每格 r/6（至少 2），过半后挖成月牙
  function moon(cx, cy, r, crescent) {
    var glow = g.createRadialGradient(cx, cy, r * 0.6, cx, cy, r * 2.4);
    glow.addColorStop(0, rgba(STAR, 0.22)); glow.addColorStop(1, rgba(STAR, 0));
    g.fillStyle = glow; g.fillRect(cx - r * 3, cy - r * 3, r * 6, r * 6);
    var u = Math.max(2, Math.round(r / 6));
    for (var y = -r; y <= r; y += u) {
      for (var x = -r; x <= r; x += u) {
        var mx = x + u / 2, my = y + u / 2;
        if (Math.sqrt(mx * mx + my * my) > r) continue;
        if (crescent && Math.sqrt((mx - r * 0.5) * (mx - r * 0.5) + (my + r * 0.35) * (my + r * 0.35)) <= r * 0.85) continue;
        g.fillStyle = mx + my < 0 ? '#F4EACB' : '#EDE3C0';
        g.fillRect(Math.round(cx + x), Math.round(cy + y), u, u);
      }
    }
  }

  // 月亮终点：默认右上；会压到标题文字时（窄屏）落到文字下方
  function moonTarget(W, H) {
    var tx = W * 0.72, ty = H * 0.2;
    var copy = hero.querySelector('.copy');
    if (copy) {
      var box = cv.getBoundingClientRect(), c = copy.getBoundingClientRect();
      var pad = MOON_R + 12;
      if (tx - pad < c.right - box.left && tx + pad > c.left - box.left && ty - pad < c.bottom - box.top) {
        ty = c.bottom - box.top + MOON_R + 20;
      }
    }
    return [tx, ty];
  }

  function draw(t) {
    var dpr = Math.min(2, window.devicePixelRatio || 1), W = cv.clientWidth, H = cv.clientHeight;
    if (!W || !H) return;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) {
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.fillStyle = NIGHT; g.fillRect(0, 0, W, H);

    // 星星在箱子到位后逐颗亮起
    for (var i = 0; i < STARS.length; i++) {
      var a = seg(t, T.starsStart + i * 0.03, T.starsStart + 0.2 + i * 0.03);
      if (a <= 0) continue;
      var size = i % 4 ? 2 : 3;
      g.fillStyle = rgba(STAR, a * (0.5 + 0.35 * Math.sin(t * 1.6 + i)));
      g.fillRect(Math.round(STARS[i][0] * W), Math.round(STARS[i][1] * H), size, size);
    }

    var cx = W / 2, floorY = H * 0.84;
    var push = easeInOut(seg(t, T.stillEnd, T.pushEnd));
    var step = push < 1 ? Math.abs(Math.sin(push * Math.PI * 3)) * 2 : 0;
    var kidX = cx - 63 + 54 * push, crateX = kidX + CELL, goalX = cx + 45;
    var onGoal = t >= T.pushEnd;

    // 地板条：7 块，两端渐隐
    for (var k = 0; k < 7; k++) {
      var edge = Math.min(k, 6 - k), fa = edge === 0 ? 0.35 : edge === 1 ? 0.7 : 1;
      var fx = cx - 126 + k * CELL;
      g.fillStyle = rgba(k % 2 ? '#141D33' : '#121A2E', fa); g.fillRect(fx, floorY, CELL, 22);
      g.fillStyle = rgba('#0E1528', fa); g.fillRect(fx, floorY, CELL, 2);
    }

    if (onGoal) {
      // 星光升空、长大，过半缺成月牙
      var lift = easeOut(seg(t, T.riseStart, T.riseEnd)), target = moonTarget(W, H);
      var fromY = floorY - CELL / 2;
      moon(goalX + (target[0] - goalX) * lift, fromY + (target[1] - fromY) * lift, 4 + (MOON_R - 4) * lift, lift > 0.5);
      // 箱子到位的薄荷色光
      var burst = 1 - seg(t, T.pushEnd, T.burstEnd);
      var gx = crateX + CELL / 2, gy = floorY - CELL / 2;
      var mint = g.createRadialGradient(gx, gy, 2, gx, gy, 70);
      mint.addColorStop(0, rgba(MINT, 0.45 * burst + 0.15)); mint.addColorStop(1, rgba(MINT, 0));
      g.fillStyle = mint; g.fillRect(gx - 78, gy - 78, 156, 156);
    } else {
      // 地上的星星标记
      g.fillStyle = rgba(STAR, 0.8);
      g.fillRect(goalX - 1, floorY - 30, 3, 24);
      g.fillRect(goalX - 12, floorY - 19, 25, 3);
    }
    sprite(CRATE, onGoal ? CRATE_GOAL_PAL : CRATE_PAL, crateX, floorY - CELL);
    var hop = t > T.hopStart && t < T.hopEnd ? Math.sin(seg(t, T.hopStart, T.hopEnd) * Math.PI) * 6 : 0;
    sprite(KID, KID_PAL, kidX, floorY - CELL - step - hop);
  }

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var t0 = 0, raf = 0, settle = 0;
  function frame(now) {
    var t = Math.max(0, (now - t0) / 1000);
    if (t >= T.end) { draw(T.end); raf = 0; return; }
    draw(t);
    raf = requestAnimationFrame(frame);
  }
  function play(delay) {
    if (reduce) { draw(T.end); return; }
    if (raf) cancelAnimationFrame(raf);
    if (settle) clearTimeout(settle);
    t0 = performance.now() + delay;
    raf = requestAnimationFrame(frame);
    // 兜底：某些环境（无头截图、后台标签页）rAF 可能迟迟不往下推进，
    // 用定时器强制落到终帧，避免停在动画中途。
    settle = setTimeout(function () {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      draw(T.end);
    }, delay + T.end * 1000 + 80);
  }
  window.addEventListener('resize', function () { if (!raf) draw(T.end); });
  // 切换语言后标题宽度会变，月亮位置要重算
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('.lang-switch') && !raf) setTimeout(function () { draw(T.end); }, 0);
  });
  hero.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('a, button')) return;
    play(0);
  });
  function start() { draw(reduce ? T.end : 0); play(800); }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start); else start();
})();
