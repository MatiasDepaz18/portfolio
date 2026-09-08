/**
 * Mini juego "runner" estilo dino de Google, dibujado en un <canvas>.
 * El jugador elige con qué dinosaurio correr (T-REX o ESTEGOSAURIO);
 * la velocidad sube con el score. Se controla con ▲ / Space / A / Enter
 * / tap en pantalla.
 *
 * Física: `py` es la altura sobre el suelo (positiva = arriba). Al saltar
 * `vy` sube y la gravedad la baja.
 */

export interface Dino {
  id: string;
  name: string;
  sprite: string[];
  eyeCol: number;
  eyeRow: number;
}

export const DINOS: Dino[] = [
  {
    id: 'trex',
    name: 'T-REX',
    eyeCol: 7,
    eyeRow: 1,
    sprite: [
      '......######', // 0: Cabeza superior (cols 6-11)
      '......######', // 1: Cabeza con ojo en col 7 (cols 6-11)
      '......######', // 2: Hocico superior (cols 6-11)
      '......#####.', // 3: Mandíbula (cols 6-10)
      '#....####...', // 4: Punta de cola (col 0) y cuello (cols 5-8)
      '##..#######.', // 5: Cola (cols 0-1), pecho y brazo (cols 4-10)
      '###.######..', // 6: Cola (cols 0-2), cuerpo y mano (cols 4-9)
      '#########...', // 7: Base de cola y cuerpo (cols 0-8)
      '#########...', // 8: Cuerpo inferior (cols 0-8)
      '.#######....', // 9: Panza (cols 1-7)
      '..######....', // 10: Cadera (cols 2-7)
      '...#..#.....', // 11: Patas (cols 3 y 6)
      '...##.###...', // 12: Pies (cols 3-4 y 6-8)
      '............', // 13: Base vacía
    ],
  },
  {
    id: 'stego',
    name: 'ESTEGOSAURIO',
    eyeCol: 10,
    eyeRow: 6,
    sprite: [
      '............', // 0: Espacio superior
      '...#...#....', // 1: Puntas de las placas
      '..###.###...', // 2: Placas dorsales
      '.#####.###..', // 3: Base de placas
      '..########..', // 4: Lomo
      '#..#########', // 5: Espina de cola y cuerpo
      '###.########', // 6: Cola y cabeza (ojo en col 10)
      '.###########', // 7: Base de cola y hocico
      '..#########.', // 8: Panza
      '...#######..', // 9: Cuerpo inferior
      '...#######..', // 10: Cadera
      '...##...##..', // 11: Patas
      '..###..###..', // 12: Pies anchos
      '............', // 13: Base libre
    ],
  },
];

/** Alto útil del sprite (ignora filas vacías al final para que apoye en el suelo). */
export function dinoRenderHeight(dino: Dino): number {
  for (let r = dino.sprite.length - 1; r >= 0; r--) {
    if (dino.sprite[r].includes('#')) return r + 1;
  }
  return dino.sprite.length;
}

/** Dibuja el sprite del dino (píxeles de tinta + ojo claro). */
export function drawDino(
  ctx: CanvasRenderingContext2D,
  dino: Dino,
  left: number,
  top: number,
  cell: number,
): void {
  const ink = '#0f380f';
  const lcd = '#8bac0f';
  ctx.fillStyle = ink;
  for (let row = 0; row < dino.sprite.length; row++) {
    for (let col = 0; col < dino.sprite[row].length; col++) {
      if (dino.sprite[row][col] === '#') {
        ctx.fillRect(left + col * cell, top + row * cell, cell, cell);
      }
    }
  }
  ctx.fillStyle = lcd;
  ctx.fillRect(left + dino.eyeCol * cell, top + dino.eyeRow * cell, cell, cell);
}

/** Pantalla de selección: dino centrado y agrandado con su nombre arriba. */
export function drawDinoPreview(canvas: HTMLCanvasElement, dino: Dino): void {
  canvas.width = 320;
  canvas.height = 140;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const scale = 4;
  const artW = dino.sprite[0].length * scale;
  const artH = dinoRenderHeight(dino) * scale;
  const left = Math.floor((canvas.width - artW) / 2);
  const top = Math.floor((canvas.height - artH) / 2) - 4;

  drawDino(ctx, dino, left, top, scale);

  ctx.fillStyle = '#0f380f';
  ctx.font = 'bold 10px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(dino.name, canvas.width / 2, top - 10);
}

export class MiniGame {
  private readonly W = 320;
  private readonly H = 140;
  private readonly groundY = 116;
  private readonly gravity = 1500;
  private readonly jumpVel = 460;

  private readonly CELL = 2;

  private ctx: CanvasRenderingContext2D | null;
  private raf = 0;
  private last = 0;
  private running = false;
  private over = false;

  private py = 0;
  private vy = 0;
  private obstacles: { x: number; w: number; h: number }[] = [];
  private spawnTimer = 0;
  private speed = 150;
  private score = 0;

  constructor(
    readonly canvas: HTMLCanvasElement,
    readonly dino: Dino,
  ) {
    canvas.width = this.W;
    canvas.height = this.H;
    this.ctx = typeof canvas.getContext === 'function' ? canvas.getContext('2d') : null;
  }

  start(): void {
    if (!this.ctx) return;
    this.reset();
    this.running = true;
    this.over = false;
    this.last = performance.now();
    this.raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame(this.loop) : 0;
  }

  stop(): void {
    this.running = false;
    if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(this.raf);
  }

  isReady(): boolean {
    return this.ctx !== null;
  }

  reset(): void {
    this.py = 0;
    this.vy = 0;
    this.obstacles = [];
    this.spawnTimer = 1.1;
    this.speed = 150;
    this.score = 0;
  }

  jump(): void {
    if (!this.ctx) return;
    if (this.over) {
      this.start();
      return;
    }
    if (this.py <= 0) this.vy = this.jumpVel;
  }

  private loop = (now: number): void => {
    if (!this.running) return;
    const dt = Math.min((now - this.last) / 1000, 0.05);
    this.last = now;
    this.update(dt);
    this.draw();
    this.raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame(this.loop) : 0;
  };

  private update(dt: number): void {
    this.score += dt * 16;
    this.speed = Math.min(150 + this.score * 0.12, 340);

    this.vy -= this.gravity * dt;
    this.py += this.vy * dt;
    if (this.py < 0) {
      this.py = 0;
      this.vy = 0;
    }

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      const h = 22 + Math.random() * 18;
      this.obstacles.push({ x: this.W + 6, w: 14, h });
      this.spawnTimer = 0.9 + Math.random() * 1.1;
    }
    for (const o of this.obstacles) o.x -= this.speed * dt;
    this.obstacles = this.obstacles.filter((o) => o.x + o.w > -10);

    const px = 44;
    const pw = 16;
    const ph = 24;
    const playerTop = this.groundY - ph - this.py;
    for (const o of this.obstacles) {
      const oTop = this.groundY - o.h;
      if (px < o.x + o.w && px + pw > o.x && playerTop < this.groundY && playerTop + ph > oTop) {
        this.over = true;
        this.running = false;
        if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(this.raf);
        this.draw();
        return;
      }
    }
  }

  private draw(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    ctx.clearRect(0, 0, this.W, this.H);

    // suelo
    ctx.fillStyle = '#0f380f';
    ctx.fillRect(0, this.groundY + 2, this.W, 2);

    // dinosaurio
    const left = 44;
    const top = this.groundY - dinoRenderHeight(this.dino) * this.CELL - this.py;
    drawDino(ctx, this.dino, left, top, this.CELL);

    // obstáculos (cajas)
    ctx.fillStyle = '#0f380f';
    for (const o of this.obstacles) {
      ctx.fillRect(o.x, this.groundY - o.h, o.w, o.h);
      ctx.fillRect(o.x + o.w - 3, this.groundY - o.h - 6, 3, 6);
    }

    // score
    ctx.font = 'bold 12px "JetBrains Mono Variable", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(String(Math.floor(this.score)).padStart(4, '0'), this.W - 6, 14);

    if (this.over) {
      ctx.textAlign = 'center';
      ctx.font = 'bold 15px "Press Start 2P", monospace';
      ctx.fillText('GAME OVER', this.W / 2, this.H / 2 - 8);
      ctx.font = 'bold 9px "JetBrains Mono Variable", monospace';
      ctx.fillText('A PARA REINICIAR', this.W / 2, this.H / 2 + 12);
    }
  }
}
