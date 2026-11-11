// Estado de entrada: teclado y posición X del ratón sobre el canvas.
// Depende de `canvas` (declarado en game.js), pero solo lo usa dentro de los handlers.

const KEY_MAP = {
  ArrowLeft: 'left', a: 'left', A: 'left',
  ArrowRight: 'right', d: 'right', D: 'right',
  ' ': 'space',
  p: 'pause', P: 'pause',
  Escape: 'pause',
};

const input = {
  held: { left: false, right: false, space: false, pause: false }, // tecla mantenida
  pressed: { left: false, right: false, space: false, pause: false, click: false }, // pulsada desde el último frame
  mouseX: null,        // X del ratón en coordenadas del canvas (null hasta que se mueva)
  lastDevice: null,    // 'keyboard' | 'mouse': gana la última entrada recibida
};

// Llamar al final de cada frame para limpiar las pulsaciones puntuales
function clearPressed() {
  for (const k in input.pressed) input.pressed[k] = false;
}

window.addEventListener('keydown', (e) => {
  const action = KEY_MAP[e.key];
  if (!action) return;
  e.preventDefault(); // evita que Espacio haga scroll
  if (!e.repeat) input.pressed[action] = true;
  input.held[action] = true;
  if (action === 'left' || action === 'right') input.lastDevice = 'keyboard';
});

window.addEventListener('keyup', (e) => {
  const action = KEY_MAP[e.key];
  if (!action) return;
  input.held[action] = false;
});

window.addEventListener('blur', () => {
  for (const k in input.held) input.held[k] = false;
});

window.addEventListener('mousedown', (e) => {
  if (e.target === canvas) input.pressed.click = true;
});

window.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  input.mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
  input.lastDevice = 'mouse';
});
