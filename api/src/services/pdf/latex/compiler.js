import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const TIMEOUT_MS = Number(process.env.LATEX_TIMEOUT_MS || 90000);

function runTectonic(texDir, texFileName) {
  return new Promise((resolve, reject) => {
    const child = spawn('tectonic', ['--outdir', texDir, texFileName], {
      cwd: texDir,
      env: { ...process.env, TECTONIC_CACHE_DIR: process.env.TECTONIC_CACHE_DIR || '/opt/tectonic-cache' },
    });
    let out = '';
    child.stdout.on('data', (d) => (out += d.toString()));
    child.stderr.on('data', (d) => (out += d.toString()));

    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`Compilación LaTeX agotó el tiempo (${TIMEOUT_MS} ms).`));
    }, TIMEOUT_MS);

    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });

    child.on('exit', (code) => {
      clearTimeout(timer);
      if (code === 0) resolve(out);
      else reject(new Error(`Tectonic salió con código ${code}.\n${out.trim() || 'sin detalle del compilador.'}`));
    });
  });
}

/**
 * Compila el documento .tex dentro de texDir y devuelve el Buffer del PDF.
 * NO administra la limpieza del directorio: lo hace el llamador.
 */
export async function compileTex(texDir, texFileName = 'main.tex') {
  const pdfName = texFileName.replace(/\.tex$/i, '.pdf');
  await runTectonic(texDir, texFileName);
  return readFile(path.join(texDir, pdfName));
}
