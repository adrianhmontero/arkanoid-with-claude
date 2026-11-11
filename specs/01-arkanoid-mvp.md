# SPEC 01 — MVP del Arkanoid

> **Estado:** Borrador
> **Depende de:** ninguna (usa los assets ya existentes en `assets/`)
> **Fecha:** 2026-11-11
> **Objetivo:** Un Arkanoid jugable en el navegador, de un solo nivel, con paddle, bola, 140 bloques, vidas, pausa y pantallas de inicio, victoria y game over.

---

## Alcance

**Dentro:**

- `index.html` con un `<canvas>` de 640x480, servido desde la raíz del proyecto.
- Game loop con `requestAnimationFrame` y delta de tiempo.
- Paddle controlado con teclado (← → / A D) y ratón (sigue la X del cursor).
- Una bola que rebota en paredes (izquierda, derecha, arriba), paddle y bloques.
- Rebote en el paddle con ángulo según el punto de impacto, a velocidad constante.
- Parrilla de 7 filas x 20 bloques (un color por fila), todos se rompen de un golpe.
- 3 vidas; la bola que cae por abajo resta una vida y vuelve a quedar pegada al paddle.
- Estados: inicio, jugando, pausa, game over, victoria.
- Pausa con `P` o `Esc`.
- Solo gráficos: sprites del spritesheet. Sin audio ni animación de explosión.
- HUD mínimo: vidas restantes.

**Fuera de alcance (para specs futuros):**

- Sonidos (`ball-bounce.mp3`, `break-sound.mp3`).
- Animación de explosión (`EXPLOSION_FRAMES`, `EXPLOSION_DURATION`).
- Puntuación y récords.
- Varios niveles.
- Power-ups, bloques de varios golpes, bloques indestructibles.
- Control táctil.
- Persistencia (localStorage, etc.).
- Tests automáticos, `package.json`, bundler, lint.

---

## Modelo de datos

Los scripts son clásicos (no módulos) y comparten globals, igual que `assets/spritesheet.js`.

```js
// js/config.js — constantes (única fuente de verdad para ajustar el juego)
const CONFIG = {
  width: 640, height: 480,
  lives: 3,
  paddle: { w: 108, h: 12, y: 450, speed: 480 },      // px/s
  ball: { size: 16, speed: 320, maxAngle: 60 },        // px/s, grados desde la vertical
  blocks: { cols: 20, rows: 7, w: 32, h: 16, offsetY: 60 },
  rowColors: ['gray', 'red', 'yellow', 'cyan', 'magenta', 'hotpink', 'green'],
};

// js/game.js — estado
const state = {
  phase: 'start',            // 'start' | 'playing' | 'paused' | 'gameover' | 'win'
  lives: 3,
  paddle: { x: 0, y: 0, w: 0, h: 0 },
  ball: { x: 0, y: 0, vx: 0, vy: 0, stuck: true },  // stuck: pegada al paddle
  blocks: [/* { x, y, w, h, color, alive } */],
};
```

Convenciones:

- Origen de coordenadas arriba a la izquierda.
- Velocidades en píxeles/segundo, multiplicadas por el delta en segundos.
- Los bloques se dibujan a su tamaño nativo (32x16): 20 columnas x 32 = 640 px exactos.
- Paddle y bola se dibujan escalados con `drawSprite` a los tamaños de `CONFIG`.
- Orden de colores de arriba abajo: gray, red, yellow, cyan, magenta, hotpink, green.

---

## Plan de implementación

1. Crear `index.html` con el canvas 640x480, carga de `assets/spritesheet.js`, `js/config.js` y `js/game.js` (vacío). Prueba: `python -m http.server`, la página abre sin errores en consola.
2. En `js/game.js`, arrancar el game loop con delta y llamar a `loadSpritesheet`; limpiar el canvas con fondo oscuro. Prueba: el loop corre y no hay errores al cargar el sheet.
3. Crear `js/input.js` con el estado de teclado (←, →, A, D, Espacio, P, Esc) y posición X del ratón sobre el canvas.
4. Dibujar y mover el paddle (teclado y ratón), limitado a los bordes. Prueba: se mueve con ambos controles sin salirse.
5. Añadir la bola pegada al paddle; Espacio o clic la lanza con ángulo inicial ligeramente aleatorio hacia arriba.
6. Rebote de la bola en paredes laterales y techo.
7. Rebote en el paddle con ángulo según el punto de impacto (centro = vertical, bordes = `maxAngle`), conservando la velocidad.
8. Generar la parrilla de bloques desde `CONFIG` y dibujarla con `drawSprite`.
9. Colisión bola-bloque: el bloque deja de estar `alive` y la bola rebota en el eje de menor penetración.
10. Vidas: al caer por abajo se resta una vida y la bola vuelve a estar pegada; dibujar vidas en el HUD.
11. Máquina de estados: pantallas de inicio, game over (0 vidas) y victoria (0 bloques vivos); Espacio reinicia la partida.
12. Pausa con `P`/`Esc` (congela el update y muestra "PAUSA"); reanuda con la misma tecla.

---

## Criterios de aceptación

- [ ] Al abrir `index.html` servido desde la raíz no hay errores en la consola.
- [ ] Aparece la pantalla de inicio y Espacio comienza la partida.
- [ ] Se ven 140 bloques en 7 filas de 20, con los colores en el orden definido.
- [ ] El paddle se mueve con ← →, con A D y con el ratón, y nunca sale del canvas.
- [ ] Con la bola pegada, Espacio o clic la lanza hacia arriba.
- [ ] La bola rebota en paredes izquierda, derecha y techo.
- [ ] Un impacto en el centro del paddle lanza la bola casi vertical; en el borde, con ángulo cercano a 60° desde la vertical.
- [ ] La velocidad de la bola es constante tras cada rebote (no acelera ni se frena).
- [ ] Al tocar un bloque, este desaparece y la bola rebota.
- [ ] Si la bola cae por abajo, las vidas bajan en 1 y la bola vuelve pegada al paddle.
- [ ] Al llegar a 0 vidas aparece "Game Over" y Espacio reinicia con 3 vidas y todos los bloques.
- [ ] Al romper los 140 bloques aparece "Victoria" y Espacio reinicia la partida.
- [ ] `P` o `Esc` pausa el juego (bola y paddle quietos, texto "PAUSA") y la misma tecla lo reanuda.
- [ ] El HUD muestra las vidas restantes y se actualiza al perder una.
- [ ] La bola no atraviesa bloques ni paddle a 60 fps ni a 30 fps (el delta está limitado a un máximo para evitar saltos).

---

## Decisiones tomadas y descartadas

- **Sí:** scripts clásicos con globals (`index.html` + `js/config.js`, `js/input.js`, `js/game.js`). Coherente con `assets/spritesheet.js`, que ya es un script global, y sin servidor especial más allá del estático.
- **No:** ES modules. Obligarían a mezclar módulos con el spritesheet global; fricción innecesaria.
- **No:** un único archivo gigante. Crece mal cuando lleguen niveles y power-ups.
- **Sí:** bloques a tamaño nativo 32x16 y 20 columnas, que llenan el canvas de 640 px exactos sin escalar.
- **Sí:** teclado y ratón a la vez. Ambos escriben la misma X del paddle; gana el último que se haya movido.
- **No:** control táctil. Pide gestionar eventos y escalado de pantalla; va en otro spec.
- **Sí:** rebote del paddle según punto de impacto con velocidad constante. Es lo característico del Arkanoid y evita partidas predecibles.
- **Sí:** pausa con `P`/`Esc` (elegida por el usuario frente a la opción de flujo mínimo).
- **No:** audio ni explosiones en el MVP; se dejan para un spec propio y se usarán `EXPLOSION_FRAMES` y los mp3 existentes.
- **Sí:** verificación manual con checklist. El repo no tiene tooling de tests y añadirlo ampliaría el MVP.
- **Sí:** `CONFIG` en un archivo propio, para poder ajustar tamaños y velocidades sin tocar la lógica.
- **Sí:** tamaño del paddle (108x12) y velocidades (paddle 480 px/s, bola 320 px/s) como valores iniciales de partida, ajustables en `CONFIG` tras probar el juego. El paddle nativo (162x14) es demasiado ancho para 640 px.

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Abrir con `file://` rompe la carga del spritesheet (canvas/CORS). | Servir con `python -m http.server` desde la raíz; documentarlo en el README. |
| La bola atraviesa bloques o el paddle con deltas grandes (pestaña en segundo plano). | Limitar el delta a un máximo (p. ej. 1/30 s) y resolver colisiones por eje. |
| La bola se queda en un bucle casi horizontal. | Garantizar un ángulo mínimo respecto a la horizontal tras cada rebote. |
| Ratón y teclado compiten por la posición del paddle. | Gana la última entrada recibida. |
| El sheet no ha cargado cuando arranca el loop (`drawSprite` hace no-op). | Arrancar el estado `start` dentro del callback de `loadSpritesheet`. |

---

## Lo que **no** está en este spec

- Sonidos y animación de explosión.
- Puntuación, récords y persistencia.
- Más de un nivel.
- Power-ups y bloques especiales.
- Control táctil.
- Tests automáticos, bundler y tooling de build.

Cada uno de estos, si se hace, va en su propio spec.
