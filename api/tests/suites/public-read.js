import { get } from '../helpers/http.js';
import { suite, test, equal, ok, expectError } from '../helpers/runner.js';

/**
 * Única lectura pública del API: GET /institutions (la necesita el login).
 * Con token válido se acota a la institución del usuario.
 */
export default async function publicReadSuite(world) {
  suite('Lecturas públicas y protegidas');

  await test('GET /institutions sin token es público', async () => {
    const res = await get('/institutions');
    equal(res.status, 200, 'status');
    ok(Array.isArray(res.data), 'debe devolver un array');
    ok(res.data.some(i => i.id === world.inst.A.id), 'debe incluir la institución A');
    ok(res.data.some(i => i.id === world.inst.B.id), 'debe incluir la institución B');
  });

  await test('GET /institutions/:id sin token es público', async () => {
    const res = await get(`/institutions/${world.inst.A.id}`);
    equal(res.status, 200, 'status');
    equal(res.data.id, world.inst.A.id, 'id');
  });

  await test('GET /institutions con token de admin se acota a su institución', async () => {
    const res = await get('/institutions', world.tokens.adminA);
    equal(res.status, 200, 'status');
    equal(res.data.length, 1, 'cantidad de instituciones visibles');
    equal(res.data[0].id, world.inst.A.id, 'id visible');
  });

  await test('GET /institutions con token de super admin las devuelve todas', async () => {
    const res = await get('/institutions', world.tokens.super);
    ok(res.data.some(i => i.id === world.inst.A.id), 'incluye A');
    ok(res.data.some(i => i.id === world.inst.B.id), 'incluye B');
  });

  await test('un token inválido en /institutions se trata como anónimo (no rompe el login)', async () => {
    const res = await get('/institutions', 'token-corrupto');
    equal(res.status, 200, 'status');
    ok(res.data.some(i => i.id === world.inst.B.id), 've todas, como anónimo');
  });

  for (const resource of ['users', 'grades', 'subjects', 'assignments', 'student_grades',
    'attendance', 'marks', 'citations', 'messages', 'evaluations']) {
    await test(`GET /${resource} sin token devuelve 401`, async () => {
      expectError(await get(`/${resource}`), 401, 'No autorizado. Inicia sesión.');
    });
  }
}
