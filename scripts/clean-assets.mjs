#!/usr/bin/env node
/**
 * Limpia el fondo de los assets de coins, gameboy y switch.
 *
 * Los PNG subidos (coin.png, gameboy.png) no tienen transparencia: el
 * fondo viene incluido. Este script hace un flood fill desde los bordes
 * del canvas y vuelve transparente todo lo que esté cerca del color de
 * las esquinas (el fondo), dejando el objeto intacto.
 *
 * La switch (switch.png, convertido desde el webp HD) ya trae fondo
 * transparente: acá solo se le recorta la pantalla (vidrio gris plano)
 * para que el contenido de Habilidades se vea a través.
 *
 * Uso: npm run clean:assets
 * Salidas: src/assets/game/coins/coin-clean.png
 *          src/assets/game/gameboy/gameboy-clean.png
 *          src/assets/game/gameboy/gameboy-body.png
 *          src/assets/game/switch/switch-body.png
 * No modifica los originales.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/* ---------------- PNG decode/encode (solo zlib) ---------------- */

function decodePng(path) {
  const buf = readFileSync(path);
  let off = 8;
  const chunks = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    chunks.push({
      type: buf.toString('ascii', off + 4, off + 8),
      data: buf.subarray(off + 8, off + 8 + len),
    });
    off += 12 + len;
  }
  const ihdr = chunks.find((c) => c.type === 'IHDR').data;
  const width = ihdr.readUInt32BE(0);
  const height = ihdr.readUInt32BE(4);
  const bitDepth = ihdr[8];
  const colorType = ihdr[9];
  const channels =
    colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 3 ? 1 : colorType === 0 ? 1 : 2;
  const rowBytes = Math.ceil((width * channels * bitDepth) / 8);
  const raw = zlib.inflateSync(
    Buffer.concat(chunks.filter((c) => c.type === 'IDAT').map((c) => c.data)),
  );
  const out = Buffer.alloc(width * height * 4);
  let prev = Buffer.alloc(rowBytes);
  const paeth = (a, b, c) => {
    const p = a + b - c;
    const pa = Math.abs(p - a),
      pb = Math.abs(p - b),
      pc = Math.abs(p - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  };
  const readIndex = (row, x, d) => {
    if (d === 8) return row[x];
    const perByte = 8 / d;
    return (row[Math.floor(x / perByte)] >> (8 - d * (1 + (x % perByte)))) & ((1 << d) - 1);
  };
  const plte = chunks.find((c) => c.type === 'PLTE')?.data ?? null;
  const trns = chunks.find((c) => c.type === 'tRNS')?.data ?? null;
  // Bytes por píxel: los filtros PNG (Sub/Average/Paeth) predicen contra
  // el píxel anterior, o sea `bpp` bytes a la izquierda (no 1).
  const bpp = Math.max(1, channels);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (rowBytes + 1)];
    const line = raw.subarray(y * (rowBytes + 1) + 1, (y + 1) * (rowBytes + 1));
    const cur = Buffer.alloc(rowBytes);
    for (let x = 0; x < rowBytes; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0,
        b = prev[x],
        c = x >= bpp ? prev[x - bpp] : 0;
      let v = line[x];
      if (filter === 1) v = (v + a) & 0xff;
      else if (filter === 2) v = (v + b) & 0xff;
      else if (filter === 3) v = (v + ((a + b) >> 1)) & 0xff;
      else if (filter === 4) v = (v + paeth(a, b, c)) & 0xff;
      cur[x] = v;
    }
    prev = cur;
    for (let x = 0; x < width; x++) {
      let r,
        g,
        b,
        a = 255;
      if (colorType === 3) {
        const idx = readIndex(cur, x, bitDepth);
        r = plte ? (plte[idx * 3] ?? 0) : 0;
        g = plte ? (plte[idx * 3 + 1] ?? 0) : 0;
        b = plte ? (plte[idx * 3 + 2] ?? 0) : 0;
        if (trns && idx < trns.length) a = trns[idx];
      } else if (colorType === 6) {
        const o = x * 4;
        r = cur[o];
        g = cur[o + 1];
        b = cur[o + 2];
        a = cur[o + 3];
      } else if (colorType === 2) {
        const o = x * 3;
        r = cur[o];
        g = cur[o + 1];
        b = cur[o + 2];
      } else if (colorType === 0) {
        const v = readIndex(cur, x, bitDepth);
        r = g = b = v;
      } else {
        const o = x * 2;
        r = g = b = cur[o];
        a = cur[o + 1];
      }
      const o = (y * width + x) * 4;
      out[o] = r;
      out[o + 1] = g;
      out[o + 2] = b;
      out[o + 3] = a;
    }
  }
  return { width, height, rgba: out };
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}

function encodePng(w, h, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ---------------- flood fill del fondo ---------------- */

function removeBackground({ width, height, rgba }, threshold) {
  const out = Buffer.from(rgba);
  const W = width,
    H = height;

  // Color de fondo = promedio de las 4 esquinas.
  const corners = [
    [2, 2],
    [W - 3, 2],
    [2, H - 3],
    [W - 3, H - 3],
  ];
  let br = 0,
    bg = 0,
    bb = 0;
  for (const [x, y] of corners) {
    const o = (y * W + x) * 4;
    br += out[o];
    bg += out[o + 1];
    bb += out[o + 2];
  }
  br /= corners.length;
  bg /= corners.length;
  bb /= corners.length;

  const dist = (x, y) => {
    const o = (y * W + x) * 4;
    const dr = out[o] - br,
      dg = out[o + 1] - bg,
      db = out[o + 2] - bb;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  };

  const removed = new Uint8Array(W * H);
  const stack = [];
  for (let x = 0; x < W; x++) {
    stack.push([x, 0], [x, H - 1]);
  }
  for (let y = 0; y < H; y++) {
    stack.push([0, y], [W - 1, y]);
  }
  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || y < 0 || x >= W || y >= H) continue;
    const idx = y * W + x;
    if (removed[idx]) continue;
    const o = idx * 4;
    if (out[o + 3] === 0) continue;
    if (dist(x, y) > threshold) continue;
    removed[idx] = 1;
    out[o + 3] = 0;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
  return { width: W, height: H, rgba: out };
}

/* ---------------- validación ---------------- */

function validate({ width: W, height: H, rgba }, { minOpaquePct, name }) {
  let opaque = 0;
  let borderOpaque = 0;
  let lumSum = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const o = (y * W + x) * 4;
      if (rgba[o + 3] > 8) {
        opaque++;
        lumSum += (rgba[o] + rgba[o + 1] + rgba[o + 2]) / 3;
        if (x === 0 || y === 0 || x === W - 1 || y === H - 1) borderOpaque++;
      }
    }
  }
  const total = W * H;
  const opaquePct = (100 * opaque) / total;
  const problems = [];
  if (borderOpaque > 0)
    problems.push(`quedan ${borderOpaque} px opacos en el borde (fondo residual)`);
  if (opaquePct < minOpaquePct)
    problems.push(
      `solo ${opaquePct.toFixed(1)}% opaco (esperado >= ${minOpaquePct}%: el objeto se comió?)`,
    );
  console.log(
    `  ${name}: ${opaquePct.toFixed(1)}% opacos, ${borderOpaque} px en borde, lum media ${(lumSum / Math.max(1, opaque)).toFixed(0)}`,
  );
  return problems;
}

/* ---------------- main ---------------- */

const JOBS = [
  {
    name: 'coin',
    src: join(ROOT, 'src/assets/game/coins/coin.png'),
    out: join(ROOT, 'src/assets/game/coins/coin-clean.png'),
    minOpaquePct: 15,
    threshold: 40,
  },
  {
    name: 'gameboy',
    src: join(ROOT, 'src/assets/game/gameboy/gameboy.png'),
    out: join(ROOT, 'src/assets/game/gameboy/gameboy-clean.png'),
    minOpaquePct: 25,
    threshold: 40,
  },
];

/* ---------------- pantalla de la switch ---------------- */

/**
 * La switch HD (switch.png, 824x350) ya viene con fondo transparente:
 * acá solo se le recorta la pantalla. El vidrio es gris plano (51,51,51)
 * y el rect se mide del sprite (marco negro alrededor). Se verifica que
 * el interior sea vidrio antes de cortar.
 */
const SWITCH_JOB = {
  name: 'switch',
  src: join(ROOT, 'src/assets/game/switch/switch.png'),
  out: join(ROOT, 'src/assets/game/switch/switch-body.png'),
  screen: { x: 148, y: 29, w: 527, h: 296 },
};

/**
 * Vuelve transparente el rect de pantalla. Verifica antes que al menos
 * el 90% de los píxeles opacos del rect sea vidrio (gris 51,51,51).
 */
function clearSwitchScreen({ width: W, height: H, rgba }, rect) {
  const { x, y, w, h } = rect;
  if (x < 0 || y < 0 || x + w > W || y + h > H) {
    return { ok: false, why: `rect ${w}x${h} fuera del sprite ${W}x${H}` };
  }
  let glass = 0;
  let total = 0;
  for (let py = y; py < y + h; py++) {
    for (let px = x; px < x + w; px++) {
      const o = (py * W + px) * 4;
      if (rgba[o + 3] < 100) continue;
      total++;
      const r = rgba[o],
        g = rgba[o + 1],
        b = rgba[o + 2];
      if (Math.abs(r - 51) < 8 && Math.abs(g - 51) < 8 && Math.abs(b - 51) < 8) glass++;
    }
  }
  const ratio = glass / Math.max(1, total);
  if (ratio < 0.9) {
    return { ok: false, why: `solo ${(ratio * 100).toFixed(0)}% del rect es vidrio` };
  }
  for (let py = y; py < y + h; py++) {
    for (let px = x; px < x + w; px++) {
      const o = (py * W + px) * 4;
      rgba[o + 3] = 0;
    }
  }
  return { ok: true };
}

/* ---------------- recorte de pantalla (gameboy y switch) ---------------- */

/**
 * Recorta la pantalla de un sprite limpio: genera un sprite "body" con
 * la pantalla transparente (para que el contenido de la sección se vea
 * a través de la pantalla). El predicado decide qué es pantalla.
 */
function cutScreen({ width: W, height: H, rgba }, outPath, isScreen) {
  // Bounding box de los píxeles de pantalla.
  let minX = W,
    maxX = -1,
    minY = H,
    maxY = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (isScreen(x, y)) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (minX > maxX) {
    return { rect: null };
  }

  // Flood fill desde el centro de la pantalla: solo la zona continua.
  const removed = new Uint8Array(W * H);
  const stack = [[Math.floor((minX + maxX) / 2), Math.floor((minY + maxY) / 2)]];
  while (stack.length) {
    const [x, y] = stack.pop();
    if (x < 0 || y < 0 || x >= W || y >= H) continue;
    const idx = y * W + x;
    if (removed[idx]) continue;
    if (!isScreen(x, y)) continue;
    removed[idx] = 1;
    const o = idx * 4;
    rgba[o + 3] = 0;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  writeFileSync(outPath, encodePng(W, H, rgba));
  return { rect: { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 } };
}

let failed = false;
const screenRects = {};
for (const job of JOBS) {
  console.log(`\nLimpiando ${job.name}...`);
  const img = decodePng(job.src);
  const cleaned = removeBackground(img, job.threshold);
  const problems = validate(cleaned, job);
  if (problems.length > 0) {
    failed = true;
    for (const p of problems) console.error(`  ✘ ${p}`);
    console.error('  Ajustar el umbral en clean-assets.mjs y re-ejecutar.');
    continue;
  }
  mkdirSync(dirname(job.out), { recursive: true });
  writeFileSync(job.out, encodePng(cleaned.width, cleaned.height, cleaned.rgba));
  console.log(`  ✔ ${job.out}`);

  if (job.name === 'gameboy') {
    // Verde LCD: r ≈ g, b claramente menor.
    const isGameboyScreen = (x, y) => {
      const o = (y * cleaned.width + x) * 4;
      const r = cleaned.rgba[o],
        g = cleaned.rgba[o + 1],
        b = cleaned.rgba[o + 2];
      if (cleaned.rgba[o + 3] < 100) return false;
      return Math.abs(r - g) < 24 && b < r * 0.62 && r > 60;
    };
    const { rect } = cutScreen(
      cleaned,
      join(ROOT, 'src/assets/game/gameboy/gameboy-body.png'),
      isGameboyScreen,
    );
    if (rect) {
      screenRects.gameboy = rect;
      console.log(
        `  ✔ gameboy-body.png (pantalla recortada: ${rect.width}x${rect.height} en x${rect.x},y${rect.y})`,
      );
    } else {
      failed = true;
      console.error('  ✘ No se encontró la pantalla LCD (verde).');
    }
  }
}

/* La switch no pasa por removeBackground (ya tiene alpha limpio):
   se decodifica directo y se le recorta la pantalla. */
console.log(`\nProcesando ${SWITCH_JOB.name}...`);
const switchImg = decodePng(SWITCH_JOB.src);
const { ok, why } = clearSwitchScreen(switchImg, SWITCH_JOB.screen);
if (ok) {
  mkdirSync(dirname(SWITCH_JOB.out), { recursive: true });
  writeFileSync(SWITCH_JOB.out, encodePng(switchImg.width, switchImg.height, switchImg.rgba));
  screenRects.switch = SWITCH_JOB.screen;
  console.log(
    `  ✔ switch-body.png (${switchImg.width}x${switchImg.height}, pantalla ${SWITCH_JOB.screen.w}x${SWITCH_JOB.screen.h} en x${SWITCH_JOB.screen.x},y${SWITCH_JOB.screen.y})`,
  );
} else {
  failed = true;
  console.error(`  ✘ switch: ${why}. Ajustar SWITCH_JOB.screen en clean-assets.mjs.`);
}

if (failed) {
  process.exit(1);
}
console.log(
  `\nLimpieza OK. Pantallas: gameboy ${JSON.stringify(screenRects.gameboy)}, switch ${JSON.stringify(screenRects.switch)}`,
);
