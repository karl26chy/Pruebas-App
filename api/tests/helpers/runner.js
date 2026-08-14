const state = {
  passed: 0,
  failed: 0,
  failures: [],
  currentSuite: '',
};

export function suite(name) {
  state.currentSuite = name;
  console.log(`\n── ${name} ${'─'.repeat(Math.max(0, 58 - name.length))}`);
}

export async function test(name, fn) {
  try {
    await fn();
    state.passed++;
    console.log(`   ok   ${name}`);
  } catch (err) {
    state.failed++;
    state.failures.push({ suite: state.currentSuite, name, message: err.message });
    console.log(`   FAIL ${name}`);
    console.log(`        ${err.message}`);
  }
}

export function equal(actual, expected, what = 'valor') {
  if (actual !== expected) {
    throw new Error(`${what}: esperado ${JSON.stringify(expected)}, recibido ${JSON.stringify(actual)}`);
  }
}

export function ok(condition, message = 'se esperaba una condición verdadera') {
  if (!condition) throw new Error(message);
}

export function notOk(condition, message = 'se esperaba una condición falsa') {
  if (condition) throw new Error(message);
}

export function contains(text, fragment, what = 'texto') {
  if (typeof text !== 'string' || !text.includes(fragment)) {
    throw new Error(`${what}: se esperaba que contuviera ${JSON.stringify(fragment)}, recibido ${JSON.stringify(text)}`);
  }
}

/** Verifica status y, si se indica, el mensaje de error exacto de la respuesta. */
export function expectError(res, status, message, what = 'respuesta') {
  equal(res.status, status, `${what} status`);
  if (message !== undefined) {
    equal(res.data && res.data.error, message, `${what} mensaje`);
  }
}

export function report() {
  const total = state.passed + state.failed;
  console.log(`\n${'═'.repeat(62)}`);
  if (state.failed === 0) {
    console.log(`  TODO VERDE — ${state.passed}/${total} verificaciones pasaron.`);
  } else {
    console.log(`  ${state.failed} FALLO(S) de ${total} verificaciones:\n`);
    for (const f of state.failures) {
      console.log(`   · [${f.suite}] ${f.name}`);
      console.log(`     ${f.message}`);
    }
  }
  console.log(`${'═'.repeat(62)}\n`);
  return state.failed === 0 ? 0 : 1;
}

export function stats() {
  return { passed: state.passed, failed: state.failed };
}
