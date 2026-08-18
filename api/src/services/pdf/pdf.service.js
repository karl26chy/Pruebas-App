import { mkdtemp, writeFile, copyFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { compileTex } from './latex/compiler.js';
import { renderTeX } from './latex/renderer.js';
import { resolveLogo, assetsDir } from './latex/helpers.js';

function asciiFileName(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^A-Za-z0-9._-]/g, '');
}

/** Nombre individual del boletín por período: Carlos_Charris_Periodo_3_2026.pdf */
export function boletinFileName(data) {
  const student = data.student || {};
  const period = data.period || {};
  const base = asciiFileName(`${student.nombre}_${student.apellido}`) || 'estudiante';
  return `${base}_Periodo_${asciiFileName(period.numero)}_${asciiFileName(period.anio)}.pdf`;
}

/**
 * Renderiza un boletín a PDF con Tectonic/XeTeX.
 * El .tex, el logo y el PDF viven en un directorio temporal que SIEMPRE se
 * limpia al terminar (éxito o error). Devuelve { buffer, fileName }.
 */
export async function renderBoletinPDF(data, config) {
  const dir = await mkdtemp(path.join(tmpdir(), 'boletin-'));
  try {
    const logoPath = resolveLogo(config, assetsDir);
    if (logoPath) {
      await copyFile(logoPath, path.join(dir, 'logo.png'));
    }
    const tex = renderTeX(data, config, { hasLogo: Boolean(logoPath) });
    await writeFile(path.join(dir, 'main.tex'), tex, 'utf8');
    const buffer = await compileTex(dir, 'main.tex');
    return { buffer, fileName: boletinFileName(data) };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
