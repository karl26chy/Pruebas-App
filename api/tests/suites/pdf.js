import { suite, test, equal, ok, notOk, contains } from '../helpers/runner.js';
import {
  escapeLaTeX,
  mergeConfig,
  textOrNa,
  configText,
  desempenoBands,
  resolveLogo,
  assetsDir,
} from '../../src/services/pdf/latex/helpers.js';
import { getTemplate, availableTemplates } from '../../src/services/pdf/latex/templates/registry.js';
import { renderTeX } from '../../src/services/pdf/latex/renderer.js';

/** AcademicReportData mínimo para probar el renderer (sin compilar). */
function sampleData(overrides = {}) {
  const subjects = overrides.subjects ?? [
    {
      materia_id: 'm1',
      materia: 'Matemáticas',
      docente: 'Prof. Ana Gómez',
      evaluaciones: [
        { evaluacion_id: 'e1', nombre: 'Parcial 1', porcentaje: 25, fecha: '2026-02-15', nota: 4.5 },
        { evaluacion_id: 'e2', nombre: 'Parcial 2', porcentaje: 25, fecha: '2026-03-01', nota: 4.0 },
      ],
      promedio: 4.25,
      desempeno: 'A',
      estado: 'Aprobado',
      fallas: null,
      justificadas: null,
    },
  ];
  return {
    student: { id: 's1', nombre: 'Juan', apellido: 'Fernández', identificacion: '1045', tipo_documento: 'CC', edad: 15, genero: 'M' },
    institution: {
      id: 'i1',
      nombre: 'Liceo Alegre Juventud',
      tipo: 'colegio',
      escala_maxima: 5,
      nota_minima_aprobacion: 3,
      reportConfig: overrides.config ?? null,
    },
    period: { id: 'p1', numero: 1, nombre: 'Primer periodo', anio: 2026, fecha_inicio: '2026-01-01', fecha_fin: '2026-03-31', activo: true },
    grade: { id: 'g1', nombre: 'Sexto', tipo_grado: 'A' },
    subjects,
    attendance: { presente: 28, ausente: 2, justificada: 1, total: 31, tasa: 90 },
    summary: { promedioGeneral: 4.25, estadoGlobal: 'Aprobado', escalaMaxima: 5, notaMinimaAprobacion: 3 },
    ...overrides,
  };
}

const baseConfig = {
  template: 'default',
  logo_url: '/logo.png',
  config: {
    showLogo: true,
    showAttendance: true,
    showEvaluations: true,
    showTeacher: true,
  },
};

/** Renderiza la plantilla default con los datos indicados. */
function render(data) {
  const config = data.institution.reportConfig || null;
  return renderTeX(data, config, { hasLogo: true });
}

export default async function pdfSuite() {
  suite('PDF LaTeX (escape, config y registro de plantillas)');

  await test('escapeLaTeX escapa los caracteres especiales', () => {
    equal(escapeLaTeX('a%b'), 'a\\%b', 'porcentaje');
    equal(escapeLaTeX('a$b'), 'a\\$b', 'dólar');
    equal(escapeLaTeX('a&b'), 'a\\&b', 'ampersand');
    equal(escapeLaTeX('a#b'), 'a\\#b', 'numeral');
    equal(escapeLaTeX('a_b'), 'a\\_b', 'guion bajo');
    equal(escapeLaTeX('a{b}c'), 'a\\{b\\}c', 'llaves');
    equal(escapeLaTeX('a~b'), 'a\\textasciitilde{}b', 'virgulilla');
    equal(escapeLaTeX('a^b'), 'a\\textasciicircum{}b', 'acento circunflejo');
  });

  await test('escapeLaTeX escapa el backslash primero', () => {
    equal(escapeLaTeX('a\\b'), 'a\\textbackslash{}b', 'backslash');
    equal(escapeLaTeX('a\\%b'), 'a\\textbackslash{}\\%b', 'backslash + porcentaje sin doble escape');
  });

  await test('escapeLaTeX convierte saltos de línea a corte LaTeX', () => {
    equal(escapeLaTeX('a\nb'), 'a\\\\b', 'salto de línea');
  });

  await test('escapeLaTeX maneja null/undefined/cero', () => {
    equal(escapeLaTeX(null), '', 'null');
    equal(escapeLaTeX(undefined), '', 'undefined');
    equal(escapeLaTeX(0), '0', 'cero');
  });

  await test('mergeConfig aplica defaults del diseño aprobado (navy + dorado)', () => {
    const cfg = mergeConfig(null);
    equal(cfg.primary, '1F3864', 'color primario default (navy)');
    equal(cfg.secondary, 'C9A227', 'color secundario default (dorado)');
    equal(cfg.showLogo, true, 'logo visible por defecto');
    equal(cfg.showAttendance, true, 'asistencia visible por defecto');
  });

  await test('mergeConfig normaliza colores hex y respeta la configuración', () => {
    const cfg = mergeConfig({ config: { primaryColor: '#00FF33', showLogo: false } });
    equal(cfg.primary, '00FF33', 'color sin numeral');
    equal(cfg.showLogo, false, 'logo deshabilitado');
  });

  await test('configText devuelve el texto institucional con fallback', () => {
    equal(configText(null, 'rectora'), '', 'sin config → fallback');
    equal(configText({ config: { rectora: '  EMMA  ' } }, 'rectora'), 'EMMA', 'recorta espacios');
    equal(configText({ config: { lema: '' } }, 'lema', 'LÍDERES'), 'LÍDERES', 'vacío → fallback');
    equal(configText({ config: { escala: 0 } }, 'escala', 'x'), '0', 'cero no es vacío');
  });

  await test('desempenoBands escala las reglas del sistema (escala 5)', () => {
    const b = desempenoBands(5);
    equal(b.length, 4, 'cuatro bandas');
    equal(b[0].letra, 'S', 'S');
    equal(b[0].min, 4.6, 'S ≥ 4.6');
    equal(b[1].max, 4.5, 'A ≤ 4.5');
    equal(b[2].min, 3.0, 'B ≥ 3.0');
    equal(b[3].max, 2.9, 'Z ≤ 2.9');
  });

  await test('desempenoBands escala a escala 10 (factor 2)', () => {
    const b = desempenoBands(10);
    equal(b[0].min, 9.2, 'S ≥ 9.2');
    equal(b[0].max, 10, 'S ≤ 10');
    equal(b[1].min, 8.0, 'A ≥ 8.0');
    equal(b[3].max, 5.8, 'Z ≤ 5.8');
  });

  await test('textOrNa devuelve fallback para vacíos', () => {
    equal(textOrNa(null), 'N/D', 'null');
    equal(textOrNa(''), 'N/D', 'vacío');
    equal(textOrNa(4.5), '4.5', 'número');
  });

  await test('resolveLogo cae al placeholder y resuelve fallback por extensión', () => {
    const ph = resolveLogo(null, assetsDir);
    ok(ph && ph.endsWith('logo_placeholder.png'), 'sin config → placeholder');
    const png = resolveLogo({ logo_url: '/logo_lic.webp' }, assetsDir);
    ok(!png || png.endsWith('.png'), 'URL .webp resuelve a .png si existe');
  });

  await test('registry resuelve default y tolera nombres desconocidos', () => {
    ok(getTemplate('default') === getTemplate(undefined), 'undefined cae a default');
    ok(getTemplate('no_existe') === getTemplate('default'), 'desconocido cae a default');
    ok(availableTemplates().includes('default'), 'default está registrada');
  });

  // ---- Renderizado de la plantilla (texto LaTeX, sin compilador) -----------

  await test('renderDefaultBoletin produce un documento completo con datos del sistema', () => {
    const tex = render(sampleData({ config: baseConfig }));
    contains(tex, '\\documentclass[10pt,a4paper]{article}', 'preámbulo');
    contains(tex, 'INFORME ACADÉMICO Y CONVIVENCIAL', 'título');
    contains(tex, 'LICEO ALEGRE JUVENTUD', 'institución');
    contains(tex, 'Juan Fernández', 'estudiante');
    contains(tex, '\\sectiontitle{INFORMACIÓN DEL ESTUDIANTE}', 'tarjeta estudiante');
    contains(tex, '\\sectiontitle{RESUMEN ACADÉMICO}', 'tarjeta resumen');
    contains(tex, '\\sectiontitle{DESEMPEÑO ACADÉMICO}', 'sección desempeño');
    contains(tex, '\\sectiontitle{ASISTENCIA}', 'tarjeta asistencia');
    contains(tex, '\\sectiontitle{OBSERVACIONES}', 'tarjeta observaciones');
    contains(tex, 'ESCALA DE EVALUACIÓN INSTITUCIONAL', 'franja de escala');
    contains(tex, 'Página \\thepage\\ de \\pageref{LastPage}', 'numeración de página');
  });

  await test('el header ya no incluye cápsula de período/año ni bloque lateral', () => {
    const tex = render(sampleData({ config: baseConfig }));
    notOk(tex.includes('PERÍODO 1'), 'sin cápsula de período en el header');
    notOk(tex.includes('AÑO ACADÉMICO'), 'sin bloque lateral AÑO ACADÉMICO');
    notOk(tex.includes('FECHA DE GENERACIÓN'), 'sin bloque lateral FECHA DE GENERACIÓN');
    notOk(tex.includes('IDENTIFICACIÓN'), 'sin bloque lateral IDENTIFICACIÓN');
    contains(tex, '>{\\centering\\arraybackslash}p{2.65cm}>{\\centering\\arraybackslash}X', 'header de 2 columnas (logo | centro)');
    notOk(tex.includes('p{4.15cm}'), 'sin la columna lateral derecha');
  });

  await test('período, año, identificación y fecha viven solo en INFORMACIÓN DEL ESTUDIANTE', () => {
    const tex = render(sampleData({ config: baseConfig }));
    contains(tex, '\\labelvalue{Período}', 'período en la tarjeta');
    contains(tex, '\\labelvalue{Identificación}', 'identificación en la tarjeta');
    contains(tex, '\\labelvalue{Año académico}', 'año en la tarjeta');
    contains(tex, '\\labelvalue{Fecha de generación}', 'fecha en la tarjeta');
    contains(tex, '\\labelvalue{Estudiante}', 'estudiante en la tarjeta');
    contains(tex, '\\labelvalue{Grado}', 'grado en la tarjeta');
    ok(/\d{2}\/\d{2}\/\d{4}/.test(tex), 'fecha en formato DD/MM/YYYY');
    notOk(/de \w+ de \d{4}/.test(tex), 'sin fecha en formato largo');
  });

  await test('la tabla usa un span dinámico de evaluaciones (una fila de encabezado)', () => {
    const subjects = [
      {
        materia_id: 'm1', materia: 'M1', docente: 'D1',
        evaluaciones: [
          { evaluacion_id: 'e1', nombre: 'Parcial 1', porcentaje: 30, fecha: null, nota: 4.0 },
          { evaluacion_id: 'e2', nombre: 'Parcial 2', porcentaje: 30, fecha: null, nota: 3.5 },
          { evaluacion_id: 'e3', nombre: 'Parcial 3', porcentaje: 40, fecha: null, nota: 4.5 },
        ],
        promedio: 4.1, desempeno: 'A', estado: 'Aprobado', fallas: null, justificadas: null,
      },
    ];
    const tex = render(sampleData({ subjects, config: baseConfig }));
    contains(tex, '\\multicolumn{3}{>{\\columncolor{Navy}}c}', 'span de 3 evaluaciones');
    notOk(tex.includes('Parcial 1'), 'sin nombres de evaluación en el encabezado (una fila)');
  });

  await test('5 evaluaciones generan el span correspondiente sin nombres en el encabezado', () => {
    const evals = Array.from({ length: 5 }, (_, i) => ({
      evaluacion_id: `e${i}`, nombre: `Evaluación larga ${i}`, porcentaje: 20, fecha: null, nota: 4.0,
    }));
    const subjects = [{ materia_id: 'm1', materia: 'M1', docente: 'D1', evaluaciones: evals, promedio: 4.0, desempeno: 'A', estado: 'Aprobado', fallas: null, justificadas: null }];
    const tex = render(sampleData({ subjects, config: baseConfig }));
    contains(tex, '\\multicolumn{5}{>{\\columncolor{Navy}}c}', 'span de 5 evaluaciones');
    notOk(tex.includes('Evaluación larga'), 'nombres de evaluación no van al encabezado');
  });

  await test('showEvaluations=false elimina la columna de evaluaciones', () => {
    const config = { ...baseConfig, config: { ...baseConfig.config, showEvaluations: false } };
    const tex = render(sampleData({ config }));
    notOk(tex.includes('EVALUACIONES'), 'sin encabezado EVALUACIONES');
    notOk(tex.includes('multicolumn{'), 'sin span de evaluaciones');
  });

  await test('showTeacher=false elimina la columna de docente', () => {
    const config = { ...baseConfig, config: { ...baseConfig.config, showTeacher: false } };
    const tex = render(sampleData({ config }));
    notOk(tex.includes('DOCENTE'), 'sin encabezado DOCENTE');
  });

  await test('pocas materias usan tabularx (una página) y muchas usan longtable', () => {
    const few = render(sampleData({ config: baseConfig }));
    contains(few, '\\begin{tabularx}{\\textwidth}', 'pocas materias → tabularx');
    notOk(few.includes('\\begin{longtable}'), 'sin longtable');
    const manySubjects = Array.from({ length: 24 }, (_, i) => ({
      materia_id: `m${i}`, materia: `Materia ${i}`, docente: 'D', evaluaciones: [], promedio: null, desempeno: null, estado: 'Sin notas', fallas: null, justificadas: null,
    }));
    const many = render(sampleData({ subjects: manySubjects, config: baseConfig }));
    contains(many, '\\begin{longtable}', 'muchas materias → longtable');
    contains(many, '\\endfirsthead', 'longtable repite encabezado');
  });

  await test('sin materias muestra el mensaje dinámico sin romper', () => {
    const tex = render(sampleData({ subjects: [], config: baseConfig }));
    contains(tex, 'Sin materias registradas para este estudiante.', 'mensaje vacío');
    contains(tex, '\\multicolumn', 'fila que abarca todas las columnas');
  });

  await test('los datos de configuración institucional se reflejan dinámicamente', () => {
    const config = {
      template: 'default',
      logo_url: '/logo.png',
      config: {
        rectora: 'EMMA LUZ PEÑARANDA OSORIO',
        directorDeGrupo: 'CARLOS MARTÍNEZ',
        coordinador: 'MARÍA PUENTES',
        telefono: '(605) 345-6789',
        direccion: 'Cra 12 # 34-56',
        lema: 'LÍDERES DEL FUTURO',
        observaciones: 'Excelente comportamiento.',
      },
    };
    const tex = render(sampleData({ config }));
    notOk(tex.includes('EMMA LUZ PEÑARANDA OSORIO'), 'el nombre de la rectora NO se imprime');
    notOk(tex.includes('CARLOS MARTÍNEZ'), 'el nombre del director NO se imprime');
    contains(tex, 'Rector(a)', 'etiqueta de firma Rector(a)');
    contains(tex, 'Director(a) de grupo', 'etiqueta de firma Director(a) de grupo');
    equal((tex.match(/\\rule\{5\.9cm\}\{0\.6pt\}/g) || []).length, 2, 'dos líneas de firma');
    contains(tex, '\\begin{tabularx}{\\textwidth}{X X}', 'dos firmas en dos columnas horizontales');
    contains(tex, 'LÍDERES DEL FUTURO', 'lema en encabezado/footer');
    contains(tex, 'Excelente comportamiento.', 'observaciones');
    notOk(tex.includes('INFORMACIÓN INSTITUCIONAL'), 'sección INFORMACIÓN INSTITUCIONAL eliminada');
    notOk(tex.includes('Coordinador(a)'), 'el coordinador no se usa en firmas');
    notOk(tex.includes('(605) 345-6789'), 'teléfono no se muestra (info institucional eliminada)');
    notOk(tex.includes('Cra 12'), 'dirección no se muestra');
  });

  await test('una sola firma configurada produce una sola línea centrada', () => {
    const config = { ...baseConfig, config: { ...baseConfig.config, rectora: 'EMMA LUZ PEÑARANDA OSORIO' } };
    const tex = render(sampleData({ config }));
    equal((tex.match(/\\rule\{5\.9cm\}\{0\.6pt\}/g) || []).length, 1, 'una línea de firma');
    contains(tex, 'Rector(a)', 'etiqueta Rector(a)');
    notOk(tex.includes('Director(a) de grupo'), 'sin director → sin su firma');
    notOk(tex.includes('\\begin{tabularx}{\\textwidth}{X X}'), 'una firma centrada sin dos columnas');
  });

  await test('sin cargos ni observaciones la plantilla se adapta (omite firmas)', () => {
    const config = { template: 'default', logo_url: null, config: { showLogo: false } };
    const tex = render(sampleData({ config }));
    notOk(tex.includes('Rector(a)'), 'sin rector → sin firma');
    notOk(tex.includes('\\rule{5.9cm}'), 'sin firmas → sin líneas de firma');
  });

  await test('la escala y el desempeño se derivan de summary (sin hardcodear 4.6–5.0)', () => {
    const data = sampleData({ config: baseConfig });
    data.summary = { promedioGeneral: 4.25, estadoGlobal: 'Aprobado', escalaMaxima: 10, notaMinimaAprobacion: 6 };
    const tex = render(data);
    contains(tex, '\\textbf{Escala máxima:} 10.00', 'escala máxima dinámica');
    contains(tex, '\\textbf{Mínima aprobación:} 6.00', 'mínima de aprobación dinámica');
    contains(tex, 'Superior (9.2–10.0)', 'bandas escaladas a 10');
    notOk(tex.includes('4.6–5.0'), 'no hay valores hardcodeados de la escala 5');
  });

  await test('los chips de estado usan los colores funcionales correctos', () => {
    const tex = render(sampleData({ config: baseConfig }));
    contains(tex, '\\colorbox{SuccessLight}{\\color{Success}\\bfseries\\scriptsize APROBADO}', 'chip aprobado');
    const reprobado = sampleData({ config: baseConfig });
    reprobado.subjects[0].estado = 'Reprobado';
    const tex2 = render(reprobado);
    contains(tex2, '\\colorbox{DangerLight}{\\color{Danger}\\bfseries\\scriptsize REPROBADO}', 'chip reprobado');
  });

  await test('los nombres con caracteres especiales se escapan correctamente', () => {
    const data = sampleData({ config: baseConfig });
    data.student.nombre = 'Andrés 50% "El _Profe_"';
    data.institution.nombre = 'Colegio #1 & Hermanos';
    const tex = render(data);
    contains(tex, 'Andrés 50\\% "El \\_Profe\\_"', 'nombre escapado');
    contains(tex, 'COLEGIO \\#1 \\& HERMANOS', 'institución escapada (y en mayúsculas en el encabezado)');
  });

  await test('el encabezado de la columna # usa \\# en LaTeX', () => {
    const tex = render(sampleData({ config: baseConfig }));
    contains(tex, '\\bfseries \\#', 'celda de numeral escapada');
  });

  // ---- Plantilla institucional "liceo_alegre_juventud" ----------------------

  /** Renderiza la plantilla Liceo con los datos indicados. */
  function renderLiceo(overrides = {}) {
    const data = sampleData(overrides);
    data.institution.reportConfig = overrides.config ?? {
      template: 'liceo_alegre_juventud',
      logo_url: '/logo_liceo_alegre_juventud.png',
      config: {
        showLogo: true,
        showAttendance: true,
        showEvaluations: true,
        showTeacher: true,
      },
    };
    return renderTeX(data, data.institution.reportConfig, { hasLogo: true });
  }

  await test('liceo_alegre_juventud selecciona el renderer Liceo (no cae en default)', () => {
    const t = getTemplate('liceo_alegre_juventud');
    ok(t === getTemplate('liceo_alegre_juventud') && t.name !== undefined, 'resuelve el template registrado');
    // El output del Liceo usa su identidad (Ink/Gold) y NO la del default (Navy/LightNavy).
    const tex = renderLiceo();
    contains(tex, '\\definecolor{Ink}', 'usa el color principal del Liceo');
    notOk(tex.includes('\\definecolor{Navy}'), 'no usa el color principal del default');
    notOk(tex.includes('\\definecolor{LightNavy}'), 'no usa la zebra del default');
  });

  await test('liceo_alegre_juventud tiene defaults de color propios sin config de colores', () => {
    // Sin primaryColor/secondaryColor en el config: la identidad es del template.
    const tex = renderLiceo();
    contains(tex, '\\definecolor{Ink}{HTML}{887030}', 'primary default dorado del Liceo');
    contains(tex, '\\definecolor{Gold}{HTML}{303030}', 'secondary default tinta del Liceo');
  });

  await test('liceo_alegre_juventud es estructuralmente distinto de default (anti-clon)', () => {
    const liceo = renderLiceo();
    const def = render(sampleData({ config: baseConfig }));
    // El Liceo tiene elementos estructurales que el default NO tiene.
    contains(liceo, 'Franja superior institucional', 'franja superior presente');
    notOk(def.includes('Franja superior institucional'), 'el default no tiene franja superior');
    // Borde de tarjetas: el Liceo usa dorado, el default usa BorderGray.
    contains(liceo, '\\fcolorbox{Gold}{white}', 'tarjetas con borde dorado');
    notOk(liceo.includes('\\fcolorbox{BorderGray}{white}'), 'las tarjetas del Liceo no usan borde gris');
    // Ambos documentos difieren en contenido.
    ok(liceo !== def, 'los .tex de ambos templates son diferentes');
  });

  await test('liceo_alegre_juventud expone sus marcadores visuales distintivos', () => {
    const tex = renderLiceo();
    contains(tex, '\\textcolor{Gold}{INFORME ACADÉMICO Y CONVIVENCIAL}', 'título institucional en dorado');
    contains(tex, 'LightGold', 'zebra dorada de la tabla');
    contains(tex, '\\sectiontitle{DESEMPEÑO ACADÉMICO}', 'sección desempeño');
    contains(tex, '\\sectiontitle{INFORMACIÓN DEL ESTUDIANTE}', 'tarjeta estudiante');
    contains(tex, 'ESCALA DE EVALUACIÓN INSTITUCIONAL', 'franja de escala');
    contains(tex, 'Página \\thepage\\ de \\pageref{LastPage}', 'numeración de página');
  });

  await test('liceo_alegre_juventud: una config explícita de colores sobrescribe los defaults', () => {
    const tex = renderLiceo({
      config: {
        template: 'liceo_alegre_juventud',
        logo_url: '/logo_liceo_alegre_juventud.png',
        config: {
          showLogo: true, showAttendance: true, showEvaluations: true, showTeacher: true,
          primaryColor: '#123456', secondaryColor: '#ABCDEF',
        },
      },
    });
    contains(tex, '\\definecolor{Ink}{HTML}{123456}', 'primary sobrescrito por config');
    contains(tex, '\\definecolor{Gold}{HTML}{ABCDEF}', 'secondary sobrescrito por config');
    notOk(tex.includes('\\definecolor{Ink}{HTML}{887030}'), 'ya no usa el default dorado');
  });

  await test('liceo_alegre_juventud comparte la misma maquinaria de datos que default', () => {
    const liceo = renderLiceo();
    // Mismos datos académicos (estudiante, materias, resumen, asistencia, escala).
    contains(liceo, 'Juan Fernández', 'estudiante');
    contains(liceo, 'Matemáticas', 'materia');
    contains(liceo, '\\labelvalue{Grado}', 'grado en tarjeta');
    contains(liceo, '\\labelvalue{Período}', 'período en tarjeta');
    contains(liceo, '\\textbf{Escala máxima:}', 'escala dinámica');
    contains(liceo, '\\textbf{Mínima aprobación:}', 'mínima dinámica');
  });
}
