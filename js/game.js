const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const MAX_DT = 1 / 30; // límite del delta (s) para evitar saltos con pestañas en segundo plano

const state = {
  phase: 'start',            // 'start' | 'playing' | 'paused' | 'gameover' | 'win'
  lives: CONFIG.lives,
  paddle: { x: 0, y: 0, w: 0, h: 0 },
  ball: { x: 0, y: 0, vx: 0, vy: 0, stuck: true },  // stuck: pegada al paddle
  blocks: [],                // { x, y, w, h, color, alive }
};

let lastTime = 0;

function initPaddle() {
  const p = state.paddle;
  p.w = CONFIG.paddle.w;
  p.h = CONFIG.paddle.h;
  p.y = CONFIG.paddle.y;
  p.x = (CONFIG.width - p.w) / 2;
}

function updatePaddle(dt) {
  const p = state.paddle;
  if (input.lastDevice === 'mouse' && input.mouseX !== null) {
    p.x = input.mouseX - p.w / 2;            // el centro sigue al cursor
  } else {
    const dir = (input.held.right ? 1 : 0) - (input.held.left ? 1 : 0);
    p.x += dir * CONFIG.paddle.speed * dt;
  }
  p.x = Math.max(0, Math.min(CONFIG.width - p.w, p.x));
}

// Genera la parrilla de bloques desde CONFIG (rows x cols, un color por fila)
function createBlocks() {
  const c = CONFIG.blocks;
  state.blocks = [];
  for (let row = 0; row < c.rows; row++) {
    for (let col = 0; col < c.cols; col++) {
      state.blocks.push({
        x: col * c.w,
        y: c.offsetY + row * c.h,
        w: c.w,
        h: c.h,
        color: CONFIG.rowColors[row],
        alive: true,
      });
    }
  }
}

const LAUNCH_SPREAD = 15; // grados máximos de desvío aleatorio respecto a la vertical al lanzar

function resetBall() {
  const b = state.ball;
  b.stuck = true;
  b.vx = 0;
  b.vy = 0;
  attachBall();
}

// Mantiene la bola pegada al centro superior del paddle
function attachBall() {
  const b = state.ball, p = state.paddle;
  b.x = p.x + (p.w - CONFIG.ball.size) / 2;
  b.y = p.y - CONFIG.ball.size;
}

function launchBall() {
  const b = state.ball;
  const angle = (Math.random() * 2 - 1) * LAUNCH_SPREAD * Math.PI / 180;
  b.vx = CONFIG.ball.speed * Math.sin(angle);
  b.vy = -CONFIG.ball.speed * Math.cos(angle);
  b.stuck = false;
}

function updateBall(dt) {
  const b = state.ball;
  if (b.stuck) {
    attachBall();
    if (input.pressed.space || input.pressed.click) launchBall();
    return;
  }
  b.x += b.vx * dt;
  b.y += b.vy * dt;
  bounceWalls();
  bouncePaddle();
  bounceBlocks();
  checkBallLost();
}

// La bola cae por abajo: se resta una vida y vuelve pegada al paddle
function checkBallLost() {
  if (state.ball.y > CONFIG.height) {
    state.lives--;
    resetBall();
  }
}

// Colisión bola-bloque: el bloque se rompe y la bola rebota en el eje de menor penetración.
// Se resuelve un solo bloque por frame para no invertir la velocidad dos veces.
function bounceBlocks() {
  const b = state.ball, size = CONFIG.ball.size;
  for (const bl of state.blocks) {
    if (!bl.alive) continue;
    if (b.x + size <= bl.x || b.x >= bl.x + bl.w ||
        b.y + size <= bl.y || b.y >= bl.y + bl.h) continue;

    bl.alive = false;

    const fromLeft = b.x + size - bl.x;       // penetración por el lado izquierdo del bloque
    const fromRight = bl.x + bl.w - b.x;      // ... por el derecho
    const fromTop = b.y + size - bl.y;        // ... por arriba
    const fromBottom = bl.y + bl.h - b.y;     // ... por abajo
    const penX = Math.min(fromLeft, fromRight);
    const penY = Math.min(fromTop, fromBottom);

    if (penX < penY) {
      if (fromLeft < fromRight) { b.x = bl.x - size; b.vx = -Math.abs(b.vx); }
      else { b.x = bl.x + bl.w; b.vx = Math.abs(b.vx); }
    } else {
      if (fromTop < fromBottom) { b.y = bl.y - size; b.vy = -Math.abs(b.vy); }
      else { b.y = bl.y + bl.h; b.vy = Math.abs(b.vy); }
    }
    return;
  }
}

// Rebote en el paddle: centro = vertical, bordes = maxAngle. Conserva la velocidad.
function bouncePaddle() {
  const b = state.ball, p = state.paddle, size = CONFIG.ball.size;
  if (b.vy <= 0) return; // solo cuando la bola baja
  const overlaps = b.x + size > p.x && b.x < p.x + p.w &&
                   b.y + size > p.y && b.y < p.y + p.h;
  if (!overlaps) return;

  const offset = (b.x + size / 2 - (p.x + p.w / 2)) / (p.w / 2); // -1 (izq) .. 1 (der)
  const t = Math.max(-1, Math.min(1, offset));
  const angle = t * CONFIG.ball.maxAngle * Math.PI / 180;
  b.vx = CONFIG.ball.speed * Math.sin(angle);
  b.vy = -CONFIG.ball.speed * Math.cos(angle);
  b.y = p.y - size; // sobre el paddle, para no volver a colisionar
}

// Rebote en paredes izquierda, derecha y techo (el fondo no rebota: ahí se pierde la vida)
function bounceWalls() {
  const b = state.ball, size = CONFIG.ball.size;
  if (b.x < 0) {
    b.x = 0;
    b.vx = Math.abs(b.vx);
  } else if (b.x + size > CONFIG.width) {
    b.x = CONFIG.width - size;
    b.vx = -Math.abs(b.vx);
  }
  if (b.y < 0) {
    b.y = 0;
    b.vy = Math.abs(b.vy);
  }
}

// Reinicia la partida: 3 vidas, todos los bloques, paddle centrado y bola pegada
function resetGame() {
  state.lives = CONFIG.lives;
  initPaddle();
  resetBall();
  createBlocks();
}

function update(dt) {
  // Pausa: P o Esc alterna entre jugando y pausa (el update queda congelado)
  if (input.pressed.pause) {
    if (state.phase === 'playing') state.phase = 'paused';
    else if (state.phase === 'paused') state.phase = 'playing';
  }
  if (state.phase === 'paused') return;

  if (state.phase !== 'playing') {
    // Inicio / game over / victoria: Espacio (re)inicia la partida
    if (input.pressed.space) {
      if (state.phase !== 'start') resetGame();
      state.phase = 'playing';
      input.pressed.space = false; // no reutilizar esta pulsación para lanzar la bola
    }
    return;
  }

  updatePaddle(dt);
  updateBall(dt);

  if (state.lives <= 0) {
    state.phase = 'gameover';
  } else if (state.blocks.every((bl) => !bl.alive)) {
    state.phase = 'win';
  }
}

function draw() {
  ctx.fillStyle = '#10101c';
  ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);

  for (const bl of state.blocks) {
    if (bl.alive) drawSprite(ctx, 'block_' + bl.color, bl.x, bl.y, bl.w, bl.h);
  }

  const p = state.paddle;
  drawSprite(ctx, 'paddle', p.x, p.y, p.w, p.h);

  const b = state.ball;
  drawSprite(ctx, 'ball', b.x, b.y, CONFIG.ball.size, CONFIG.ball.size);

  drawHUD();
  drawOverlay();
}

const OVERLAYS = {
  start: ['ARKANOID', 'Espacio para empezar'],
  paused: ['PAUSA', 'P o Esc para reanudar'],
  gameover: ['Game Over', 'Espacio para reiniciar'],
  win: ['Victoria', 'Espacio para reiniciar'],
};

function drawOverlay() {
  const lines = OVERLAYS[state.phase];
  if (!lines) return;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 48px monospace';
  ctx.fillText(lines[0], CONFIG.width / 2, CONFIG.height / 2 - 20);
  ctx.font = '20px monospace';
  ctx.fillText(lines[1], CONFIG.width / 2, CONFIG.height / 2 + 30);
}

function drawHUD() {
  ctx.fillStyle = '#ffffff';
  ctx.font = '16px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('Vidas: ' + Math.max(0, state.lives), 10, 10);
}

function loop(time) {
  const dt = Math.min((time - lastTime) / 1000, MAX_DT);
  lastTime = time;
  update(dt);
  draw();
  clearPressed();
  requestAnimationFrame(loop);
}

// El loop arranca cuando el spritesheet ya está cargado
loadSpritesheet(() => {
  initPaddle();
  resetBall();
  createBlocks();
  lastTime = performance.now();
  requestAnimationFrame(loop);
});
