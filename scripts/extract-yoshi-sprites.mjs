#!/usr/bin/env node
/**
 * Extrae los PNG individuales de un sprite a partir del sheet master.
 *
 * Fuente de verdad: src/app/game/sprites/<nombre>.sprites.ts
 *   (export <NOMBRE>_SHEET, ej: YOSHI_SHEET / PIRANA_SHEET).
 * Este script NO modifica el sheet master; solo recorta y escribe:
 *
 *   src/assets/game/<nombre>/<anim>/<NN>.png
 *
 * Uso: node scripts/extract-yoshi-sprites.mjs <nombre>
 *   npm run extract:yoshi    -> node scripts/extract-yoshi-sprites.mjs yoshi
 *   npm run extract:piranha  -> node scripts/extract-yoshi-sprites.mjs piranha
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHEET_NAME = process.argv[2] ?? 'yoshi';
const EXPORT_NAME = `${SHEET_NAME.toUpperCase()}_SHEET`;
const SHEET_TS = join(ROOT, 'src/app/game/sprites', `${SHEET_NAME}.sprites.ts`);

/* ------------------------------------------------------------------ */
/* PNG decode / encode (solo zlib nativo, sin dependencias)            */
/* ------------------------------------------------------------------ */

function decodePng(path) {
  const buf = readFileSync(path);
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error(`no es un PNG: ${path}`);
  let off = 8;
  const chunks = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    chunks.push({ type, data: buf.subarray(off + 8, off + 8 + len) });
    off += 12 + len;
  }
  const ihdr = chunks.find((c) => c.type === 'IHDR').data;
  const width = ihdr.readUInt32BE(0);
  const height = ihdr.readUInt32BE(4);
  const bitDepth = ihdr[8];
  const colorType = ihdr[9];

  // colorType: 0 gris, 2 RGB, 3 palette, 4 gris+alpha, 6 RGBA
  const channels =
    colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 3 ? 1 : colorType === 0 ? 1 : 2;
  const rowBytes = Math.ceil((width * channels * bitDepth) / 8);
  const idat = Buffer.concat(chunks.filter((c) => c.type === 'IDAT').map((c) => c.data));
  const raw = zlib.inflateSync(idat);
  const out = Buffer.alloc(width * height * 4);
  let prev = Buffer.alloc(rowBytes);
  const paeth = (a, b, c) => {
    const p = a + b - c;
    const pa = Math.abs(p - a),
      pb = Math.abs(p - b),
      pc = Math.abs(p - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  };
  const plte = chunks.find((c) => c.type === 'PLTE')?.data ?? null;
  const trns = chunks.find((c) => c.type === 'tRNS')?.data ?? null;
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (rowBytes + 1)];
    const line = raw.subarray(y * (rowBytes + 1) + 1, (y + 1) * (rowBytes + 1));
    const cur = Buffer.alloc(rowBytes);
    for (let x = 0; x < rowBytes; x++) {
      const a = x >= 1 ? cur[x - 1] : 0;
      const b = prev[x];
      const c = x >= 1 ? prev[x - 1] : 0;
      let v = line[x];
      switch (filter) {
        case 0:
          break;
        case 1:
          v = (v + a) & 0xff;
          break;
        case 2:
          v = (v + b) & 0xff;
          break;
        case 3:
          v = (v + ((a + b) >> 1)) & 0xff;
          break;
        case 4:
          v = (v + paeth(a, b, c)) & 0xff;
          break;
        default:
          throw new Error(`filtro inválido ${filter}`);
      }
      cur[x] = v;
    }
    prev = cur;
    for (let x = 0; x < width; x++) {
      let r, g, b;
      let a = 255;
      if (colorType === 3) {
        const idx = readIndex(cur, x, bitDepth);
        if (plte) {
          r = plte[idx * 3] ?? 0;
          g = plte[idx * 3 + 1] ?? 0;
          b = plte[idx * 3 + 2] ?? 0;
        } else {
          r = g = b = 0;
        }
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

/** Lee un índice de píxel empaquetado (bitDepth 1/2/4/8, MSB primero). */
function readIndex(row, x, bitDepth) {
  if (bitDepth === 8) return row[x];
  const perByte = 8 / bitDepth;
  const byteIdx = Math.floor(x / perByte);
  const shift = 8 - bitDepth * (1 + (x % perByte));
  return (row[byteIdx] >> shift) & ((1 << bitDepth) - 1);
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

/* ------------------------------------------------------------------ */
/* Carga de la fuente de verdad (<NOMBRE>_SHEET desde el TS)           */
/* ------------------------------------------------------------------ */

async function loadSheet() {
  // Node >= 23.6: type stripping nativo. Fallback: transpile con el
  // typescript del proyecto (funciona en cualquier versión de Node).
  try {
    const mod = await import(SHEET_TS);
    return mod[EXPORT_NAME];
  } catch (e) {
    const ts = await import('typescript');
    const source = readFileSync(SHEET_TS, 'utf8');
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    });
    const mod = await import(
      `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
    );
    return mod[EXPORT_NAME];
  }
}

/* ------------------------------------------------------------------ */
/* Extracción + validación                                             */
/* ------------------------------------------------------------------ */

const problems = [];

function report(problem) {
  problems.push(problem);
  console.error(`  ✘ ${problem}`);
}

function check(ok, msg) {
  if (ok) console.log(`  ✔ ${msg}`);
  else report(msg);
}

function contains(inner, outer) {
  // Contención estricta: el rect interior debe ser DISTINTO del exterior
  // (animaciones que comparten el mismo rect, ej: tongue y tongueIdle,
  // no deben limpiarse entre sí).
  const sameRect =
    inner.x === outer.x &&
    inner.y === outer.y &&
    inner.width === outer.width &&
    inner.height === outer.height;
  return (
    !sameRect &&
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y + inner.height <= outer.y + outer.height
  );
}

/**
 * Pinta de blanco el interior de la boca de un frame (animaciones con
 * `whiteMouth: true`). Regla:
 *   1. Semillas: píxeles transparentes flanqueados por ROJO (labios)
 *      dentro de 16px a un lado y por CUALQUIER píxel opaco al otro.
 *   2. Flood fill (4-conectividad) desde las semillas a través de todos
 *      los píxeles transparentes: el interior conectado de la boca queda
 *      blanco y los labios/dientes (opacos) no se tocan.
 */
function whitenMouth(crop, width, height) {
  const at = (x, y) => (y * width + x) * 4;
  const transparent = (x, y) => crop[at(x, y) + 3] <= 8;
  const opaque = (x, y) => crop[at(x, y) + 3] > 8;
  const red = (x, y) =>
    opaque(x, y) && crop[at(x, y)] > 170 && crop[at(x, y) + 1] < 100 && crop[at(x, y) + 2] < 100;

  const find = (x, y, dx, max, test) => {
    for (let d = 1; d <= max; d++) {
      const nx = x + dx * d;
      if (nx < 0 || nx >= width) return false;
      if (test(nx, y)) return true;
    }
    return false;
  };

  const queue = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!transparent(x, y)) continue;
      const redLeft = find(x, y, -1, 16, red) && find(x, y, 1, 16, opaque);
      const redRight = find(x, y, 1, 16, red) && find(x, y, -1, 16, opaque);
      if (redLeft || redRight) {
        queue.push([x, y]);
      }
    }
  }

  while (queue.length > 0) {
    const [x, y] = queue.pop();
    if (!transparent(x, y)) continue;
    crop[at(x, y)] = 255;
    crop[at(x, y) + 1] = 255;
    crop[at(x, y) + 2] = 255;
    crop[at(x, y) + 3] = 255;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && nx < width && ny >= 0 && ny < height && transparent(nx, ny)) {
        queue.push([nx, ny]);
      }
    }
  }
}

/** Rota un buffer RGBA 90 grados. cw = true: horario; false: antihorario. */
function rotatePng(crop, width, height, cw) {
  const out = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 4;
      const dx = cw ? height - 1 - y : y;
      const dy = cw ? x : width - 1 - x;
      const d = (dy * height + dx) * 4;
      out[d] = crop[o];
      out[d + 1] = crop[o + 1];
      out[d + 2] = crop[o + 2];
      out[d + 3] = crop[o + 3];
    }
  }
  return { buf: out, w: height, h: width };
}

async function main() {
  const sheet = await loadSheet();
  console.log(`Sheet master: ${sheet.url} (${sheet.sheetWidth}x${sheet.sheetHeight})`);

  const masterPath = join(ROOT, 'src', sheet.url);
  const master = decodePng(masterPath);
  if (master.width !== sheet.sheetWidth || master.height !== sheet.sheetHeight) {
    throw new Error(
      `El sheet master no coincide con las dimensiones declaradas en ${SHEET_NAME}.sprites.ts.`,
    );
  }

  // Colección de todos los frames para detectar contención entre ellos.
  const allFrames = [];
  for (const [animName, anim] of Object.entries(sheet.animations)) {
    anim.frames.forEach((frame, i) => allFrames.push({ animName, index: i, frame }));
  }

  let written = 0;
  for (const [animName, anim] of Object.entries(sheet.animations)) {
    console.log(`\n${animName}/ (${anim.frames.length} frames, ${anim.fps} fps)`);
    anim.frames.forEach((frame, i) => {
      const n = String(i + 1).padStart(2, '0');
      const expectedSrc = `${sheet.basePath}/${animName}/${n}.png`;

      if (frame.src !== expectedSrc) {
        // Válido cuando un estado reutiliza PNG de otra animación
        // (ej: tongueIdle usa tongue/01.png, tongueFall usa tongueStyles/NN.png).
        console.log(
          `  ~ ${frame.src}: src custom (no sigue ${expectedSrc}) - OK si reutiliza un PNG existente`,
        );
      }

      const r = frame.source;
      if (
        r.x < 0 ||
        r.y < 0 ||
        r.x + r.width > sheet.sheetWidth ||
        r.y + r.height > sheet.sheetHeight
      ) {
        report(`${frame.src}: rect fuera del sheet`);
        return;
      }

      // 1. Recortar el frame del sheet master.
      let crop = Buffer.alloc(r.width * r.height * 4);
      for (let yy = 0; yy < r.height; yy++) {
        const srcOff = ((r.y + yy) * sheet.sheetWidth + r.x) * 4;
        master.rgba.copy(crop, yy * r.width * 4, srcOff, srcOff + r.width * 4);
      }

      // 2. Limpiar píxeles de OTROS sprites contenidos dentro del rect
      //    (ej: piezas pequeñas empaquetadas dentro de una pose mayor).
      //    Es seguro: los frames provienen de componentes conexos, nunca
      //    comparten píxeles opacos con el frame anfitrión.
      const contained = allFrames.filter(
        (o) => !(o.animName === animName && o.index === i) && contains(o.frame.source, r),
      );
      for (const o of contained) {
        const c = o.frame.source;
        for (let yy = 0; yy < c.height; yy++) {
          for (let xx = 0; xx < c.width; xx++) {
            const sx = c.x - r.x + xx;
            const sy = c.y - r.y + yy;
            if (sx < 0 || sy < 0 || sx >= r.width || sy >= r.height) continue;
            const mOff = ((c.y + yy) * sheet.sheetWidth + (c.x + xx)) * 4;
            const opaque = master.rgba[mOff + 3] > 8;
            if (opaque) {
              const dOff = (sy * r.width + sx) * 4;
              crop[dOff + 3] = 0;
            }
          }
        }
        console.log(
          `  ~ ${frame.src}: removidos píxeles de ${o.frame.src} (empaquetado dentro del rect)`,
        );
      }

      // 2.5. Boca blanca: rellenar el interior del hocico (si la
      //      animación lo pide). Debe correr después de la limpieza de
      //      píxeles contenidos (que ya borró lo que no es del frame).
      if (anim.whiteMouth) {
        whitenMouth(crop, r.width, r.height);
      }

      // 2.6. Rotación horneada (si la animación la pide). El frame
      //      queda rotado en el PNG y las dimensiones cambian.
      let outW = r.width;
      let outH = r.height;
      if (anim.rotate === 90) {
        const rot = rotatePng(crop, outW, outH, true);
        crop = rot.buf;
        outW = rot.w;
        outH = rot.h;
      } else if (anim.rotate === 270) {
        const rot = rotatePng(crop, outW, outH, false);
        crop = rot.buf;
        outW = rot.w;
        outH = rot.h;
      }

      // 3. Validar el recorte antes de escribir (dims ya rotadas).
      let opaquePx = 0;
      let minX = outW,
        maxX = -1,
        minY = outH,
        maxY = -1;
      for (let yy = 0; yy < outH; yy++) {
        for (let xx = 0; xx < outW; xx++) {
          if (crop[(yy * outW + xx) * 4 + 3] > 8) {
            opaquePx++;
            if (xx < minX) minX = xx;
            if (xx > maxX) maxX = xx;
            if (yy < minY) minY = yy;
            if (yy > maxY) maxY = yy;
          }
        }
      }
      if (opaquePx === 0) {
        report(`${frame.src}: frame vacío`);
        return;
      }
      if (minX !== 0 || minY !== 0 || maxX !== outW - 1 || maxY !== outH - 1) {
        report(
          `${frame.src}: el contenido no toca los bordes del rect (minX=${minX} maxX=${maxX} minY=${minY} maxY=${maxY} de ${outW}x${outH})`,
        );
        return;
      }

      // 4. Escribir el PNG individual.
      const outPath = join(ROOT, 'src', frame.src);
      mkdirSync(dirname(outPath), { recursive: true });
      writeFileSync(outPath, encodePng(outW, outH, crop));
      written++;
      console.log(`  ✔ ${frame.src} (${outW}x${outH}, ${opaquePx}px opacos)`);
    });
  }

  // 5. Validación post-escritura: re-decodificar cada PNG generado.
  console.log('\nValidación post-extracción:');
  let checked = 0;
  for (const [animName, anim] of Object.entries(sheet.animations)) {
    anim.frames.forEach((frame, i) => {
      const outPath = join(ROOT, 'src', frame.src);
      const exists = (() => {
        try {
          return readFileSync(outPath).length > 0;
        } catch {
          return false;
        }
      })();
      check(exists, `existe ${frame.src}`);
      if (!exists) return;

      const img = decodePng(outPath);
      check(
        img.width === frame.width && img.height === frame.height,
        `${frame.src}: dimensiones ${img.width}x${img.height} = ${frame.width}x${frame.height}`,
      );

      let hasOpaque = false;
      let hasTransparent = false;
      for (let p = 3; p < img.rgba.length; p += 4) {
        if (img.rgba[p] > 8) hasOpaque = true;
        else hasTransparent = true;
        if (hasOpaque && hasTransparent) break;
      }
      check(hasOpaque, `${frame.src}: contenido presente`);
      if (!hasTransparent) {
        console.log(`  ~ ${frame.src}: pieza sólida (sin píxeles transparentes) - OK`);
      }
      checked++;
    });
  }

  console.log(`\n${written} PNG escritos, ${checked} validados, ${problems.length} problemas.`);
  if (problems.length > 0) {
    console.error(
      `\nProblemas detectados. Corregí las coordenadas en ${SHEET_NAME}.sprites.ts y re-ejecutá el extractor.`,
    );
    process.exit(1);
  }
  console.log('Extracción OK.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
