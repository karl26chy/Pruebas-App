import { get, post, put, del } from '../helpers/http.js';
import { suite, test, equal, expectError } from '../helpers/runner.js';

/** Rutas desconocidas, health check y forma de las respuestas de error. */
export default async function errorsSuite(world) {
  suite('Errores y rutas desconocidas');

  await test('GET /api/health responde ok', async () => {
    const res = await get('/health');
    equal(res.status, 200, 'status');
    equal(res.data.status, 'ok', 'cuerpo');
  });

  await test('un recurso no declarado devuelve 404', async () => {
    expectError(await get('/inventado', world.tokens.super), 404, 'Recurso no encontrado.');
  });

  await test('POST a un recurso no declarado devuelve 404', async () => {
    expectError(await post('/inventado', { x: 1 }, world.tokens.super), 404, 'Recurso no encontrado.');
  });

  await test('PUT a un recurso no declarado devuelve 404', async () => {
    expectError(await put('/inventado/1', { x: 1 }, world.tokens.super), 404, 'Recurso no encontrado.');
  });

  await test('DELETE a un recurso no declarado devuelve 404', async () => {
    expectError(await del('/inventado/1', world.tokens.super), 404, 'Recurso no encontrado.');
  });

  await test('un id inexistente en un recurso válido devuelve 404', async () => {
    expectError(await get('/users/id-que-no-existe', world.tokens.super), 404, 'Recurso no encontrado.');
  });

  await test('los errores siempre vienen con la forma { error: string }', async () => {
    const res = await get('/users');
    equal(res.status, 401, 'status');
    equal(typeof res.data.error, 'string', 'campo error');
    equal(Object.keys(res.data).length, 1, 'solo el campo error');
  });
}
