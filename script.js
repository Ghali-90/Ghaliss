/* ===== EDIT THESE ===== */
const CONFIG = {
  email: "you@example.com",
  whatsappNumber: "15551234567" // country code + number, digits only
};

const $ = (s, el = document) => el.querySelector(s);

/* ---------- Mobile menu ---------- */
const menuBtn = $("#menu-btn"), nav = $("#nav");
if (menuBtn) menuBtn.addEventListener("click", () => {
  menuBtn.setAttribute("aria-expanded", nav.classList.toggle("open"));
});

/* ---------- Reveal on scroll ---------- */
const io = new IntersectionObserver((entries, o) => entries.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add("in"); o.unobserve(e.target); }
}), { threshold: 0.12 });
document.querySelectorAll(".reveal").forEach(el => io.observe(el));

/* ---------- Typing effect ---------- */
const typed = $("#typed");
if (typed) {
  const words = JSON.parse(typed.dataset.words);
  let w = 0, c = 0, del = false;
  (function tick() {
    const word = words[w];
    typed.textContent = word.slice(0, c);
    if (!del && c === word.length) { del = true; return setTimeout(tick, 1400); }
    if (del && c === 0) { del = false; w = (w + 1) % words.length; }
    c += del ? -1 : 1;
    setTimeout(tick, del ? 45 : 90);
  })();
}

/* ---------- Request form -> opens email app ---------- */
const reqForm = $("#request-form");
if (reqForm) reqForm.addEventListener("submit", e => {
  e.preventDefault();
  const f = reqForm.elements, err = (el, m) => el.parentElement.querySelector(".error").textContent = m;
  let ok = true;
  [f.name, f.email, f.message].forEach(i => err(i, ""));
  if (!f.name.value.trim()) { err(f.name, "Enter your name."); ok = false; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.value)) { err(f.email, "Enter a valid email."); ok = false; }
  if (f.message.value.trim().length < 5) { err(f.message, "Write your request."); ok = false; }
  if (!ok) return;
  const subject = encodeURIComponent("Request from " + f.name.value.trim());
  const body = encodeURIComponent(f.message.value.trim() + "\n\n" + f.name.value.trim() + " (" + f.email.value.trim() + ")");
  window.location.href = `mailto:${CONFIG.email}?subject=${subject}&body=${body}`;
  $("#form-status").textContent = "Opening your email app. Press send there to finish.";
});

/* ---------- Runner game (like Chrome's offline game) ---------- */
function createRunner(canvas) {
  const c = canvas.getContext("2d"), W = canvas.width, H = canvas.height, GY = H - 28;
  let y, vy, obs, speed, score, frame, alive, raf = 0;
  const reset = () => { y = 0; vy = 0; obs = []; speed = 5; score = 0; frame = 0; alive = true; };
  const jump = () => { if (!alive) reset(); else if (y === 0) vy = 13; };
  function loop() {
    frame++; score += .12; speed = 5 + score / 60;
    vy -= .75; y = Math.max(0, y + vy); if (y === 0) vy = 0;
    if (alive && (!obs.length || obs[obs.length - 1].x < W - 220 - Math.random() * 200)) {
      obs.push({ x: W + 10, w: 16 + Math.random() * 14, h: 26 + Math.random() * 26 });
    }
    if (alive) obs.forEach(o => o.x -= speed);
    obs = obs.filter(o => o.x + o.w > 0);
    const px = 50, pw = 28, ph = 34, top = GY - y - ph;
    if (alive) obs.forEach(o => {
      if (px + pw > o.x && px < o.x + o.w && top + ph > GY - o.h) alive = false;
    });
    c.clearRect(0, 0, W, H);
    c.fillStyle = "#ddd8cb"; c.fillRect(0, GY, W, 2);
    c.fillStyle = "#19a58b"; obs.forEach(o => c.fillRect(o.x, GY - o.h, o.w, o.h));
    c.fillStyle = "#0e1b3d"; c.fillRect(px, top, pw, ph);
    c.fillStyle = "#f2b705"; c.fillRect(px + 18, top + 6, 6, 6);
    c.fillStyle = "#16203a"; c.font = "bold 16px system-ui"; c.textAlign = "right";
    c.fillText(String(Math.floor(score)).padStart(5, "0"), W - 12, 24);
    if (!alive) { c.textAlign = "center"; c.font = "bold 20px system-ui"; c.fillText("Game over. Tap or press Space to retry", W / 2, H / 2 - 10); }
    raf = requestAnimationFrame(loop);
  }
  return {
    start() { reset(); cancelAnimationFrame(raf); loop(); },
    stop() { cancelAnimationFrame(raf); },
    jump
  };
}

/* ---------- Weak / offline network detection ---------- */
(function netWatch() {
  const banner = document.createElement("div");
  banner.className = "net-banner"; banner.hidden = true;
  banner.innerHTML = '<span id="net-msg"></span><button type="button" id="net-play">Play a game</button>';
  const overlay = document.createElement("div");
  overlay.className = "overlay"; overlay.hidden = true;
  overlay.innerHTML = '<div class="overlay-box" role="dialog" aria-label="Offline game"><h3>Connection is weak</h3><p>Jump over the blocks while you wait. Tap the game or press Space.</p><canvas width="600" height="160"></canvas><button class="btn dark" type="button" id="net-close">Close</button></div>';
  document.body.append(banner, overlay);
  const runner = createRunner($("canvas", overlay));
  const msg = $("#net-msg");
  const isWeak = () => { const n = navigator.connection; return n && (n.saveData || /2g/.test(n.effectiveType)); };
  function check() {
    if (!navigator.onLine) { msg.textContent = "You are offline."; banner.hidden = false; }
    else if (isWeak()) { msg.textContent = "Network is weak."; banner.hidden = false; }
    else { banner.hidden = true; if (!overlay.hidden) close(); }
  }
  function open() { overlay.hidden = false; runner.start(); }
  function close() { overlay.hidden = true; runner.stop(); }
  $("#net-play").addEventListener("click", open);
  $("#net-close").addEventListener("click", close);
  $("canvas", overlay).addEventListener("pointerdown", runner.jump);
  document.addEventListener("keydown", e => {
    if (!overlay.hidden && (e.code === "Space" || e.code === "ArrowUp")) { e.preventDefault(); runner.jump(); }
    if (e.key === "Escape") close();
  });
  window.addEventListener("online", check);
  window.addEventListener("offline", check);
  if (navigator.connection) navigator.connection.addEventListener("change", check);
  check();
  window.openRunner = open; // used by the "Play offline game" button on the Play page
})();

/* ---------- Sliding puzzle ---------- */
const board = $("#puzzle");
if (board) {
  let tiles, moves, size = 3;
  const movesEl = $("#moves"), winEl = $("#win");
  function shuffle() {
    tiles = [1, 2, 3, 4, 5, 6, 7, 8, 0]; moves = 0; winEl.textContent = "";
    let blank = 8, prev = -1;
    for (let i = 0; i < 150; i++) { // random legal moves keep it solvable
      const r = Math.floor(blank / size), col = blank % size, opts = [];
      if (r > 0) opts.push(blank - size); if (r < 2) opts.push(blank + size);
      if (col > 0) opts.push(blank - 1); if (col < 2) opts.push(blank + 1);
      const choices = opts.filter(o => o !== prev), n = choices[Math.floor(Math.random() * choices.length)];
      [tiles[blank], tiles[n]] = [tiles[n], tiles[blank]]; prev = blank; blank = n;
    }
    draw();
  }
  function draw() {
    board.innerHTML = "";
    tiles.forEach((t, i) => {
      const b = document.createElement("button");
      b.className = "tile" + (t ? "" : " blank"); b.textContent = t || ""; b.type = "button";
      if (t) b.setAttribute("aria-label", "Tile " + t);
      b.addEventListener("click", () => move(i));
      board.appendChild(b);
    });
    movesEl.textContent = moves;
  }
  function move(i) {
    const blank = tiles.indexOf(0), near = Math.abs(i - blank) === size || (Math.abs(i - blank) === 1 && Math.floor(i / size) === Math.floor(blank / size));
    if (!near) return;
    [tiles[i], tiles[blank]] = [tiles[blank], tiles[i]]; moves++; draw();
    if (tiles.slice(0, 8).every((t, k) => t === k + 1)) {
      winEl.textContent = `Solved in ${moves} moves!`;
      board.querySelectorAll(".tile").forEach(t => t.classList.add("ok"));
    }
  }
  $("#shuffle").addEventListener("click", shuffle);
  shuffle();
}

/* ---------- Chat box (message opens WhatsApp) ---------- */
const chat = $("#chat-form");
if (chat) {
  const list = $("#msgs"), input = $("#chat-input");
  const add = (text, me) => {
    const d = document.createElement("div");
    d.className = "bubble" + (me ? " me" : ""); d.textContent = text;
    list.appendChild(d); list.scrollTop = list.scrollHeight;
  };
  add("Hi! Type a message and I will open WhatsApp so you can send it to me.");
  chat.addEventListener("submit", e => {
    e.preventDefault();
    const text = input.value.trim(); if (!text) return;
    add(text, true); input.value = "";
    setTimeout(() => add("Opening WhatsApp… press send there."), 500);
    setTimeout(() => window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`, "_blank", "noopener"), 1100);
  });
}

/* ---------- Footer year ---------- */
const yr = $("#year"); if (yr) yr.textContent = new Date().getFullYear();
