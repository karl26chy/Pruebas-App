import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Directorio de recursos estáticos (logos, fuentes) del API. */
export const assetsDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../../assets'
);

/**
 * Escapa texto libre antes de insertarlo en un documento LaTeX.
 * Reemplazo de UNA pasada: el texto insertado (\textbackslash{}, \textasciitilde{})
 * no se vuelve a escanear, por lo que sus llaves internas quedan intactas.
 * Los saltos de línea pasan a `\\` (corte de línea).
 */
export function escapeLaTeX(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/(\\|%|\$|&|#|_|\{|\}|~|\^|\n)/g, (m) => {
    switch (m) {
      case '\\':
        return '\\textbackslash{}';
      case '%':
        return '\\%';
      case '$':
        return '\\$';
      case '&':
        return '\\&';
      case '#':
        return '\\#';
      case '_':
        return '\\_';
      case '{':
        return '\\{';
      case '}':
        return '\\}';
      case '~':
        return '\\textasciitilde{}';
      case '^':
        return '\\textasciicircum{}';
      case '\n':
        return '\\\\';
      default:
        return m;
    }
  });
}

/** Valores opcionales con fallback legible en el documento. */
export function textOrNa(value) {
  if (value === null || value === undefined || value === '') return 'N/D';
  return String(value);
}

/**
 * Configuración visual por institución con defaults razonables.
 * Los defaults siguen el diseño aprobado (navy + dorado); una institución con
 * su propio `institution_report_configs` los sobrescribe por completo.
 */
export function mergeConfig(config) {
  const raw = config?.config || {};
  const parseHex = (value, fallback) => {
    if (typeof value === 'string' && /^#?([0-9a-f]{6})$/i.test(value)) {
      return value.replace('#', '').toUpperCase();
    }
    return fallback;
  };
  return {
    primary: parseHex(raw.primaryColor, '1F3864'),
    secondary: parseHex(raw.secondaryColor, 'C9A227'),
    showLogo: raw.showLogo !== false,
    showAttendance: raw.showAttendance !== false,
    showEvaluations: raw.showEvaluations !== false,
    showTeacher: raw.showTeacher !== false,
  };
}

/**
 * Texto institucional del JSON de configuración (rectora, lema, teléfono, …)
 * con fallback. Mismo contrato que `configText` del cliente.
 */
export function configText(config, key, fallback = '') {
  const v = config?.config?.[key];
  if (v === null || v === undefined || v === false || v === '') return fallback;
  if (typeof v === 'string') return v.trim();
  return String(v);
}

/**
 * Bandas de desempeño S/A/B/Z escaladas a la escala de la institución
 * (factor = escala_maxima / 5). Reglas EXACTAS de `desempeno()` en
 * report.service.js: S ≥ 4.6·k, A 4.0–4.5·k, B 3.0–3.9·k, Z < 3.0·k.
 * No se inventan reglas: la leyenda y la escala se derivan de aquí.
 */
export function desempenoBands(escalaMaxima) {
  const k = (Number(escalaMaxima) || 5) / 5;
  const r = (x) => Math.round(x * 10) / 10;
  return [
    { letra: 'S', nombre: 'Superior', min: r(4.6 * k), max: r(5 * k) },
    { letra: 'A', nombre: 'Alto', min: r(4.0 * k), max: r(4.5 * k) },
    { letra: 'B', nombre: 'Básico', min: r(3.0 * k), max: r(3.9 * k) },
    { letra: 'Z', nombre: 'Bajo', min: 0, max: r(2.9 * k) },
  ];
}

/**
 * Resuelve el logo de la institución a un ARCHIVO LOCAL dentro del
 * contenedor (sin URLs externas durante la compilación). Si el logo
 * configurado no existe localmente, usa el placeholder.
 * Devuelve null si la config deshabilita el logo.
 */
export function resolveLogo(config, dir = assetsDir) {
  const opts = mergeConfig(config);
  if (!opts.showLogo) return null;

  const url = config?.logo_url;
  if (url) {
    const clean = url.replace(/^https?:\/\//i, '').split('?')[0].split('#')[0];
    const base = path.basename(clean);
    if (base) {
      const candidate = path.join(dir, base);
      if (existsSync(candidate)) return candidate;
    }
    // Fallback por extensión: si la URL apunta a un WebP/JPEG (que XeTeX no
    // incrusta) pero existe el mismo nombre en PNG, usarlo.
    const ext = path.extname(base).toLowerCase();
    if (ext && ext !== '.png') {
      const candidate = path.join(dir, base.replace(ext, '.png'));
      if (existsSync(candidate)) return candidate;
    }
  }

  const placeholder = path.join(dir, 'logo_placeholder.png');
  return existsSync(placeholder) ? placeholder : null;
}
