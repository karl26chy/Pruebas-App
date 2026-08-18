import {
  escapeLaTeX,
  mergeConfig,
  textOrNa,
  configText,
  desempenoBands,
} from '../../helpers.js';

/**
 * Plantilla "default" del boletín por período (LaTeX/Tectonic).
 *
 * SOLO PRESENTA información: no consulta la BD, no calcula notas y no
 * verifica permisos. Los datos llegan ya resueltos en AcademicReportData.
 *
 * Diseño institucional aprobado (una página A4):
 *   ENCABEZADO (logo · institución · título · cápsula PERÍODO/AÑO · tarjeta lateral)
 *   INFORMACIÓN DEL ESTUDIANTE + RESUMEN ACADÉMICO
 *   DESEMPEÑO ACADÉMICO (tabla dinámica zebra # · área · docente · eval. · prom. · desempeño · estado)
 *   LEYENDA DE DESEMPEÑO
 *   ASISTENCIA + OBSERVACIONES
 *   ESCALA DE EVALUACIÓN INSTITUCIONAL (franja)
 *   FIRMAS (Rectora · Director(a) de grupo)
 *   FOOTER
 *
 * Todo es DINÁMICO: materias, evaluaciones (número variable de columnas),
 * escala, colores, cargos, lema, observaciones. Nada está hardcodeado.
 * La sección "INFORMACIÓN INSTITUCIONAL" NO se renderiza.
 */

const TEXTW = 19.0; // cm: A4 (21) - márgenes laterales (1.0×2)
const FIXED = {
  num: 0.35,
  doc: 2.25,
  prom: 1.65,
  des: 1.9,
  est: 1.9,
  evalMin: 0.9,
  evalMax: 1.0,
  evalNone: 2.3,
  matMin: 4.0,
};
const ROW_H = 0.5; // altura estimada por fila (cm)
const HEADER_H = 1.0; // altura estimada del encabezado de tabla
const TABLE_BUDGET = 11.5; // cm reservados para la tabla en una página

function clip(value, n) {
  const s = String(value);
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

function fmt(value) {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(2) : '—';
}

function nint(value) {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  return Number.isFinite(n) ? String(n) : '—';
}

function bandRange(b) {
  const lo = Number(b.min) > 0 ? Number(b.min).toFixed(1) : '0';
  const hi = Number(b.max).toFixed(1);
  return `${lo}–${hi}`;
}

/** Color funcional de una letra de desempeño (S/A→éxito, B→aviso, Z→peligro). */
function bandColor(letra) {
  const l = String(letra || '').toUpperCase();
  if (l === 'Z') return 'Danger';
  if (l === 'B') return 'Warning';
  return 'Success';
}

/** Badge de color funcional (padding compacto para columnas estrechas). */
function chipBox(bg, fg, text) {
  return `{\\setlength{\\fboxsep}{1.5pt}\\colorbox{${bg}}{\\color{${fg}}\\bfseries\\scriptsize ${text}}}`;
}

/** Badge de desempeño (S/A/B/Z) para la tabla y la leyenda. */
function desempenoChip(desempeno) {
  if (!desempeno) return '—';
  const letra = String(desempeno).toUpperCase();
  return chipBox(`${bandColor(letra)}Light`, bandColor(letra), escapeLaTeX(letra));
}

/** Badge de estado (Aprobado/Reprobado/Sin notas) para la tabla y el resumen. */
function estadoChip(estado) {
  const s = String(estado || '');
  const low = s.toLowerCase();
  if (low === 'aprobado') return chipBox('SuccessLight', 'Success', 'APROBADO');
  if (low === 'reprobado') return chipBox('DangerLight', 'Danger', 'REPROBADO');
  return chipBox('NeutralLight', 'Neutral', 'SIN NOTAS');
}

/** Chip de estado para el RESUMEN (ancho fijo, centrado). */
function resumenChip(estado) {
  return `\\parbox{2.6cm}{\\centering ${estadoChip(estado)}}`;
}

export function renderDefaultBoletin(data, config, ctx = {}) {
  const opts = mergeConfig(config);
  const es = escapeLaTeX;

  const student = data.student || {};
  const period = data.period || {};
  const summary = data.summary || {};
  const attendance = data.attendance || {};
  const institution = data.institution || {};
  const grade = data.grade || null;
  const subjects = data.subjects || [];

  const nombreCompleto = `${textOrNa(student.nombre)} ${textOrNa(student.apellido)}`.trim();
  const identificacion =
    [student.tipo_documento, student.identificacion].filter(Boolean).join(' ') || 'N/D';
  const grado = grade ? `${grade.nombre} "${grade.tipo_grado}"` : 'Sin asignar';
  const periodoLabel = period.nombre
    ? `${period.nombre} (${period.numero})`
    : period.numero
      ? `Período ${period.numero}`
      : '';
  const fecha = (() => {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()}`;
  })();

  const lema = configText(config, 'lema');
  const observaciones = configText(config, 'observaciones') || configText(config, 'observacion');

  // ---------- Escala de desempeño (reglas del sistema, sin inventar) ----------
  const customBands = Array.isArray(config?.config?.desempenoEscala)
    ? config.config.desempenoEscala
    : null;
  const bands = customBands && customBands.length >= 2
    ? customBands
    : desempenoBands(summary.escalaMaxima);

  // ---------- Firmas dinámicas: etiquetas SIN nombres de persona ----------
  // El boletín se imprime para firmarse a mano; los cargos configurados
  // solo activan el espacio de firma (los nombres no se renderizan).
  const firmas = [];
  if (configText(config, 'rectora') || configText(config, 'rector')) {
    firmas.push('Rector(a)');
  }
  if (configText(config, 'directorDeGrupo') || configText(config, 'director_de_grupo')) {
    firmas.push('Director(a) de grupo');
  }

  // ---------- Tabla académica dinámica ----------
  const showTeacher = opts.showTeacher;
  const hasEvalCols = opts.showEvaluations;
  const maxEvals = Math.max(0, ...subjects.map((s) => s.evaluaciones?.length || 0));
  const N = hasEvalCols ? (maxEvals > 0 ? maxEvals : 1) : 0;
  const fixedBase =
    FIXED.num + (showTeacher ? FIXED.doc : 0) + FIXED.prom + FIXED.des + FIXED.est;
  let colEval = FIXED.evalNone;
  if (N > 0) {
    const avail = Math.max(0.5, TEXTW - fixedBase - FIXED.matMin);
    colEval = Math.max(FIXED.evalMin, Math.min(FIXED.evalMax, avail / N));
  }
  const ncols = 2 + (showTeacher ? 1 : 0) + N + 3;
  // En longtable las columnas p{} no absorben espacio: hay que descontar los
  // \tabcolsep internos (3pt c/u) para que la tabla mida exactamente \textwidth.
  const tabcolsepCm = 3 / 28.45274;
  const internalGaps = 2 * (ncols - 1) * tabcolsepCm;
  const matW = Math.max(3.0, TEXTW - internalGaps - (fixedBase + N * colEval));

  const evalSpecs = Array.from({ length: N }, () => `>{\\centering\\arraybackslash}p{${colEval.toFixed(2)}cm}`).join('');
  const specX =
    `{@{}>{\\centering\\arraybackslash}p{${FIXED.num}cm}` +
    `>{\\raggedright\\arraybackslash}X` +
    (showTeacher ? `>{\\raggedright\\arraybackslash}p{${FIXED.doc}cm}` : '') +
    evalSpecs +
    `>{\\centering\\arraybackslash}p{${FIXED.prom}cm}` +
    `>{\\centering\\arraybackslash}p{${FIXED.des}cm}` +
    `>{\\centering\\arraybackslash}p{${FIXED.est}cm}@{}}`;
  const specP = specX.replace(
    '>{\\raggedright\\arraybackslash}X',
    `>{\\raggedright\\arraybackslash}p{${matW.toFixed(2)}cm}`
  );

  // Encabezado de UNA fila (referencia aprobada); \scriptsize por celda.
  const hcell = (t) => `{\\scriptsize \\color{white}\\bfseries ${t}}`;
  const h1 = [hcell('\\#'), hcell('ÁREA / ASIGNATURA')];
  if (showTeacher) h1.push(hcell('DOCENTE'));
  if (hasEvalCols) {
    if (maxEvals > 0) {
      h1.push(`\\multicolumn{${N}}{>{\\columncolor{Navy}}c}{\\scriptsize \\color{white}\\bfseries EVALUACIONES}`);
    } else {
      h1.push(hcell('EVALUACIONES'));
    }
  }
  h1.push(hcell('PROMEDIO'), hcell('DESEMPEÑO'), hcell('ESTADO'));

  let rowsTex;
  if (subjects.length === 0) {
    rowsTex = `\\multicolumn{${ncols}}{c}{\\textit{Sin materias registradas para este estudiante.}} \\\\`;
  } else {
    const bodyRows = subjects.map((s, i) => {
      const cells = [String(i + 1), `\\textcolor{ink}{${es(textOrNa(s.materia))}}`];
      if (showTeacher) cells.push(`\\textcolor{ink}{${es(textOrNa(s.docente))}}`);
      if (hasEvalCols) {
        if (maxEvals > 0) {
          const evals = s.evaluaciones || [];
          for (let e = 0; e < N; e++) {
            const ev = evals[e];
            const nota = ev ? ev.nota : undefined;
            cells.push(nota === null || nota === undefined ? '—' : fmt(nota));
          }
        } else {
          cells.push('\\textcolor{Neutral}{Sin notas}');
        }
      }
      cells.push(`\\textbf{\\textcolor{ink}{${fmt(s.promedio)}}}`, desempenoChip(s.desempeno), estadoChip(s.estado));
      return `${cells.join(' & ')} \\\\`;
    });
    rowsTex = bodyRows.join('\n');
  }

  const headRows = `\\rowcolor{Navy}${h1.join(' & ')} \\\\
\\arrayrulecolor{Gold}\\hline`;

  const useLong = subjects.length > 0 && subjects.length * ROW_H + HEADER_H > TABLE_BUDGET;
  const tableGroup =
    '{\\setlength{\\tabcolsep}{3pt}\\renewcommand{\\arraystretch}{1.12}\\footnotesize\n\\rowcolors{3}{white}{LightNavy}\n';
  let table;
  if (useLong) {
    table = `${tableGroup}\\begin{longtable}${specP}
${headRows}
\\endfirsthead
${headRows}
\\endhead
\\arrayrulecolor{BorderGray}
${rowsTex}
\\arrayrulecolor{BorderGray}\\hline
\\end{longtable}
\\rowcolors{0}{white}{white}}`;
  } else {
    table = `${tableGroup}\\begin{tabularx}{\\textwidth}${specX}
${headRows}
\\arrayrulecolor{BorderGray}
${rowsTex}
\\arrayrulecolor{BorderGray}\\hline
\\end{tabularx}
\\rowcolors{0}{white}{white}}`;
  }

  // ---------- Leyenda de desempeño ----------
  const legendItems = bands
    .map((b) => `${desempenoChip(b.letra)}\\ ${es(b.nombre)}`)
    .join('\\quad\n');
  const legend = `\\vspace{0.02cm}
\\begin{center}
{\\scriptsize\\textbf{Desempeño:}\\quad
${legendItems}}
\\end{center}`;

  // ---------- Resumen académico ----------
  const promTex = fmt(summary.promedioGeneral);
  const innerResumen = `\\vspace{0.06cm}
\\begin{tabularx}{\\linewidth}{X X}
\\centering
{\\scriptsize\\color{TextGray}Promedio general}\\par
\\vspace{1pt}
{\\headingfont\\bfseries\\Large\\textcolor{Navy}{${promTex}}}
&
\\centering
{\\scriptsize\\color{TextGray}Estado general}\\par
\\vspace{1pt}
${resumenChip(summary.estadoGlobal)}
\\end{tabularx}
\\vspace{0.08cm}
\\noindent\\color{BorderGray}\\rule{\\linewidth}{0.4pt}
\\vspace{0.05cm}
\\begin{tabularx}{\\linewidth}{X X}
\\centering
{\\scriptsize\\color{TextGray}Escala máxima}\\par
{\\small\\bfseries ${fmt(summary.escalaMaxima)}}
&
\\centering
{\\scriptsize\\color{TextGray}Nota mínima de aprobación}\\par
{\\small\\bfseries ${fmt(summary.notaMinimaAprobacion)}}
\\end{tabularx}`;

  // ---------- Información del estudiante ----------
  const innerEstudiante = `\\vspace{0.05cm}
\\begin{tabularx}{\\linewidth}{X X}
\\labelvalue{Estudiante}{${es(nombreCompleto)}}
&
\\labelvalue{Identificación}{${es(identificacion)}}
\\\\[5pt]
\\labelvalue{Grado}{${es(grado)}}
&
\\labelvalue{Período}{${es(periodoLabel)}}
\\\\[5pt]
\\labelvalue{Año académico}{${es(period.anio || '—')}}
&
\\labelvalue{Fecha de generación}{${es(fecha)}}
\\end{tabularx}`;

  // ---------- Asistencia ----------
  const attRows = [
    ['Presente', nint(attendance.presente)],
    ['Ausente', nint(attendance.ausente)],
    ['Inasistencia justificada', nint(attendance.justificada)],
    ['Total', nint(attendance.total)],
  ];
  const innerAsistencia = `\\vspace{0.04cm}
\\begin{tabularx}{\\linewidth}{X r}
${attRows.map(([l, v]) => `{\\scriptsize ${es(l)}} & {\\bfseries ${v}}`).join(' \\\\\n')}
\\\\
\\hline
\\hline
\\end{tabularx}
\\vspace{0.05cm}
\\colorbox{LightNavy}{\\parbox{\\dimexpr\\linewidth-2\\fboxsep\\relax}{\\centering\\scriptsize Tasa de asistencia\\quad\\headingfont\\bfseries ${nint(attendance.tasa)}\\%}}`;

  // ---------- Observaciones ----------
  const innerObservaciones = observaciones
    ? `\\vspace{0.06cm}{\\small\\textcolor{ink}{${es(clip(observaciones, 400))}}}`
    : '\\rule{0pt}{2.4cm}';

  // ---------- Fila inferior: Asistencia + Observaciones ----------
  let bottomRow;
  if (opts.showAttendance) {
    bottomRow = `\\noindent
\\begin{minipage}[t]{4.2cm}\\card{\\sectiontitle{ASISTENCIA}${innerAsistencia}}\\end{minipage}%
\\hspace{0.4cm}%
\\begin{minipage}[t]{\\dimexpr\\textwidth-4.6cm\\relax}\\card{\\sectiontitle{OBSERVACIONES}${innerObservaciones}}\\end{minipage}`;
  } else {
    bottomRow = `\\noindent
\\begin{minipage}[t]{\\textwidth}\\card{\\sectiontitle{OBSERVACIONES}${innerObservaciones}}\\end{minipage}`;
  }

  // ---------- Escala institucional (franja dinámica) ----------
  const bandsLine = bands
    .map((b) => `\\textcolor{${bandColor(b.letra)}}{\\bfseries ${es(b.letra)}} = ${es(b.nombre)} (${bandRange(b)})`)
    .join('\\quad\n');
  const escalaStrip = `\\noindent
\\fcolorbox{BorderGray}{LightGold}{\\parbox{\\dimexpr\\textwidth-2\\fboxrule-2\\fboxsep\\relax}{
\\centering
{\\headingfont\\bfseries\\scriptsize\\textcolor{ink}{ESCALA DE EVALUACIÓN INSTITUCIONAL}}\\par
\\vspace{0.03cm}
{\\scriptsize
\\textbf{Escala máxima:} ${fmt(summary.escalaMaxima)}
\\quad
\\textbf{Mínima aprobación:} ${fmt(summary.notaMinimaAprobacion)}
\\qquad
${bandsLine}
}\\par
}}`;

  // ---------- Firmas (horizontales, sin nombres; para firma manuscrita) ----------
  let firmasTex = '';
  if (firmas.length > 0) {
    const firmaCell = (cargo) =>
      `\\parbox{6.2cm}{\\vspace{0.6cm}\\centering
\\rule{5.9cm}{0.6pt}\\\\[0.12cm]
{\\scriptsize\\bfseries ${es(cargo)}}}`;
    if (firmas.length === 1) {
      firmasTex = `\\noindent\\centering
${firmaCell(firmas[0])}`;
    } else {
      firmasTex = `\\noindent
\\begin{tabularx}{\\textwidth}{X X}
\\centering${firmaCell(firmas[0])} &
\\centering${firmaCell(firmas[1])}
\\end{tabularx}`;
    }
  }

  // ---------- Encabezado ----------
  const logoCell =
    ctx.hasLogo && opts.showLogo
      ? '\\includegraphics[width=2.25cm,height=2.25cm,keepaspectratio]{logo.png}'
      : '\\rule{0pt}{2.25cm}';

  const centerCell = `{\\headingfont\\bfseries\\Large\\textcolor{Navy}{${es(String(institution.nombre || '').toUpperCase())}}}\\par
${lema ? `{\\scriptsize\\color{TextGray}${es(lema)}}\\par` : ''}
\\vspace{2pt}
{\\headingfont\\bfseries\\large\\textcolor{ink}{INFORME ACADÉMICO Y CONVIVENCIAL}}\\par`;

  const headerTex = `\\noindent
\\begin{tabularx}{\\textwidth}{>{\\centering\\arraybackslash}p{2.65cm}>{\\centering\\arraybackslash}X}
${logoCell} & ${centerCell} \\\\
\\end{tabularx}
\\vspace{0.08cm}
\\noindent\\textcolor{Navy}{\\rule{\\textwidth}{1.2pt}}
\\vspace{0.02cm}
\\noindent\\textcolor{Gold}{\\rule{\\textwidth}{1.8pt}}
\\vspace{0.12cm}`;

  const cardsTopTex = `\\noindent
\\begin{minipage}[t]{0.49\\textwidth}\\card{\\sectiontitle{INFORMACIÓN DEL ESTUDIANTE}${innerEstudiante}}\\end{minipage}%
\\hfill
\\begin{minipage}[t]{0.49\\textwidth}\\card{\\sectiontitle{RESUMEN ACADÉMICO}${innerResumen}}\\end{minipage}`;

  const footerLeft = `\\textsf{${es(String(institution.nombre || '').toUpperCase())}}${lema ? `\\hspace{0.6em}\\textcolor{Gold}{\\textsf{•}}\\hspace{0.6em}\\textsf{${es(lema)}}` : ''}`;

  const tex = `\\documentclass[10pt,a4paper]{article}

\\usepackage[top=0.85cm,bottom=0.9cm,left=1.0cm,right=1.0cm]{geometry}
\\usepackage{fontspec}
\\setmainfont{DejaVu Serif}
\\newfontfamily\\headingfont{DejaVu Sans}
\\usepackage{graphicx}
\\usepackage{array}
\\usepackage{longtable}
\\usepackage{tabularx}
\\usepackage[table]{xcolor}
\\usepackage{fancyhdr}
\\usepackage{lastpage}

\\definecolor{Navy}{HTML}{${opts.primary}}
\\definecolor{Gold}{HTML}{${opts.secondary}}
\\definecolor{LightNavy}{HTML}{EEF3F8}
\\definecolor{LightGold}{HTML}{FBF7E8}
\\definecolor{BorderGray}{HTML}{C9D2DC}
\\definecolor{TextGray}{HTML}{4B5563}
\\definecolor{ink}{HTML}{1F2937}
\\definecolor{Success}{HTML}{198754}
\\definecolor{SuccessLight}{HTML}{EAF6EE}
\\definecolor{Danger}{HTML}{C62828}
\\definecolor{DangerLight}{HTML}{FCECEC}
\\definecolor{Warning}{HTML}{D89B00}
\\definecolor{WarningLight}{HTML}{FFF7DC}
\\definecolor{Neutral}{HTML}{6B7280}
\\definecolor{NeutralLight}{HTML}{F1F3F5}

\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{0pt}
\\setlength{\\tabcolsep}{3pt}
\\setlength{\\fboxsep}{3pt}
\\setlength{\\fboxrule}{0.4pt}
\\setlength{\\arrayrulewidth}{0.5pt}
\\setlength{\\footskip}{0.55cm}

\\newcommand{\\sectiontitle}[1]{%
  \\vspace{0.04cm}%
  \\colorbox{Navy}{\\parbox{\\dimexpr\\linewidth-2\\fboxsep\\relax}{%
    \\color{white}\\headingfont\\bfseries\\scriptsize\\raggedright #1}}%
  \\vspace{0.05cm}\\par%
}

\\newcommand{\\card}[1]{%
  \\fcolorbox{BorderGray}{white}{%
    \\parbox{\\dimexpr\\linewidth-2\\fboxrule-2\\fboxsep\\relax}{#1}}}

\\newcommand{\\labelvalue}[2]{%
  \\parbox[t]{0.98\\linewidth}{%
    {\\scriptsize\\color{TextGray}\\headingfont #1}\\par
    \\vspace{1pt}%
    {\\small\\bfseries #2}\\par}}

\\pagestyle{fancy}
\\fancyhf{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}
\\fancyfoot[C]{{\\setlength{\\fboxsep}{0pt}\\colorbox{Navy}{\\parbox[b][0.5cm][c]{\\linewidth}{%
\\color{white}\\scriptsize\\headingfont
\\hspace*{0.4cm}${footerLeft}%
\\hfill Página \\thepage\\ de \\pageref{LastPage}\\hspace*{0.4cm}}}}}

\\begin{document}

% ============ Encabezado ============
${headerTex}

% ============ Estudiante + Resumen ============
${cardsTopTex}

\\vspace{0.12cm}

% ============ Desempeño académico ============
\\sectiontitle{DESEMPEÑO ACADÉMICO}
${table}

${legend}

\\vspace{0.08cm}

% ============ Asistencia + Observaciones ============
${bottomRow}

\\vspace{0.12cm}

% ============ Escala de evaluación ============
${escalaStrip}

\\vspace{0.25cm}

% ============ Firmas ============
${firmasTex}

\\end{document}
`;

  return tex;
}
