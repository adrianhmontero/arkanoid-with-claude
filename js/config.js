// Constantes del juego (única fuente de verdad para ajustar tamaños y velocidades)
const CONFIG = {
  width: 640, height: 480,
  lives: 3,
  paddle: { w: 108, h: 12, y: 450, speed: 480 },      // px/s
  ball: { size: 16, speed: 320, maxAngle: 60 },        // px/s, grados desde la vertical
  blocks: { cols: 20, rows: 7, w: 32, h: 16, offsetY: 60 },
  rowColors: ['gray', 'red', 'yellow', 'cyan', 'magenta', 'hotpink', 'green'],
};
