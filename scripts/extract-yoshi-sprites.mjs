#!/usr/bin/env node
/**
 * Extrae los PNG individuales de Yoshi a partir del sheet master.
 *
 * Fuente de verdad: src/app/game/sprites/yoshi.sprites.ts (YOSHI_SHEET).
 * Este script NO modifica yoshi.png; solo recorta y escribe:
 *
 *   src/assets/game/yoshi/<anim>/<NN>.png
 *
 * Uso: npm run extract:yoshi
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SHEET_TS = join(ROOT, 'src/app/game/sprites/yoshi.sprites.ts');

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
/* Carga de la fuente de verdad (YOSHI_SHEET desde el TS)              */
/* ------------------------------------------------------------------ */

async function loadYoshiSheet() {
  // Node >= 23.6: type stripping nativo. Fallback: transpile con el
  // typescript del proyecto (funciona en cualquier versión de Node).
  try {
    const mod = await import(SHEET_TS);
    return mod.YOSHI_SHEET;
  } catch {
    const ts = await import('typescript');
    const source = readFileSync(SHEET_TS, 'utf8');
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    });
    const mod = await import(
      `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
    );
    return mod.YOSHI_SHEET;
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

async function main() {
  const sheet = await loadYoshiSheet();
  console.log(`Sheet master: ${sheet.url} (${sheet.sheetWidth}x${sheet.sheetHeight})`);

  const masterPath = join(ROOT, 'src', sheet.url);
  const master = decodePng(masterPath);
  if (master.width !== sheet.sheetWidth || master.height !== sheet.sheetHeight) {
    throw new Error('El sheet master no coincide con las dimensiones declaradas en YOSHI_SHEET.');
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
      const crop = Buffer.alloc(r.width * r.height * 4);
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

      // 3. Validar el recorte antes de escribir.
      let opaquePx = 0;
      let minX = r.width,
        maxX = -1,
        minY = r.height,
        maxY = -1;
      for (let yy = 0; yy < r.height; yy++) {
        for (let xx = 0; xx < r.width; xx++) {
          if (crop[(yy * r.width + xx) * 4 + 3] > 8) {
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
      if (minX !== 0 || minY !== 0 || maxX !== r.width - 1 || maxY !== r.height - 1) {
        report(
          `${frame.src}: el contenido no toca los bordes del rect (minX=${minX} maxX=${maxX} minY=${minY} maxY=${maxY} de ${r.width}x${r.height})`,
        );
        return;
      }

      // 4. Escribir el PNG individual.
      const outPath = join(ROOT, 'src', frame.src);
      mkdirSync(dirname(outPath), { recursive: true });
      writeFileSync(outPath, encodePng(r.width, r.height, crop));
      written++;
      console.log(`  ✔ ${frame.src} (${r.width}x${r.height}, ${opaquePx}px opacos)`);
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
      '\nProblemas detectados. Corregí las coordenadas en yoshi.sprites.ts y re-ejecutá el extractor.',
    );
    process.exit(1);
  }
  console.log('Extracción OK.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
