import { get, post, login } from '../helpers/http.js';
import { suite, test, equal, ok, notOk, expectError } from '../helpers/runner.js';

export default async function authSuite(world) {
  suite('Autenticación');

  await test('login sin credenciales devuelve 400', async () => {
    expectError(await post('/auth/login', {}), 400, 'Email y contraseña son requeridos.');
  });

  await test('login sin password devuelve 400', async () => {
    expectError(await post('/auth/login', { email: world.superEmail }), 400, 'Email y contraseña son requeridos.');
  });

  await test('login con password incorrecta devuelve 401', async () => {
    expectError(
      await post('/auth/login', { email: world.users.adminA.email, password: 'incorrecta' }),
      401,
      'Credenciales inválidas. Inténtalo de nuevo.'
    );
  });

  await test('login con email inexistente devuelve 401', async () => {
    expectError(
      await post('/auth/login', { email: 'noexiste@test.local', password: 'x' }),
      401,
      'Credenciales inválidas. Inténtalo de nuevo.'
    );
  });

  await test('login de usuario desactivado devuelve 403', async () => {
    expectError(
      await post('/auth/login', { email: world.users.inactiveUser.email, password: world.password }),
      403,
      'Tu cuenta está desactivada. Contacta al administrador.'
    );
  });

  await test('login correcto devuelve token y usuario sin password', async () => {
    const res = await post('/auth/login', { email: world.users.adminA.email, password: world.password });
    equal(res.status, 200, 'status');
    ok(typeof res.data.token === 'string' && res.data.token.length > 0, 'debe traer token');
    equal(res.data.user.id, world.users.adminA.id, 'id de usuario');
    notOk('password' in res.data.user, 'el usuario NO debe exponer password');
  });

  await test('login es insensible a mayúsculas en el email', async () => {
    const res = await post('/auth/login', {
      email: world.users.adminA.email.toUpperCase(),
      password: world.password,
    });
    equal(res.status, 200, 'status');
    equal(res.data.user.id, world.users.adminA.id, 'id de usuario');
  });

  await test('el token incluye sub, rol, email e institucion_id', async () => {
    const session = await login(world.users.teacherA.email, world.password);
    const payload = JSON.parse(Buffer.from(session.token.split('.')[1], 'base64url').toString());
    equal(payload.sub, world.users.teacherA.id, 'claim sub');
    equal(payload.rol, 'teacher', 'claim rol');
    equal(payload.email, world.users.teacherA.email, 'claim email');
    equal(payload.institucion_id, world.inst.A.id, 'claim institucion_id');
    ok(typeof payload.exp === 'number', 'debe tener expiración');
  });

  await test('GET /auth/me sin token devuelve 401', async () => {
    expectError(await get('/auth/me'), 401, 'No autorizado. Inicia sesión.');
  });

  await test('GET /auth/me con token inválido devuelve 401', async () => {
    expectError(await get('/auth/me', 'token-basura'), 401, 'Sesión expirada o inválida. Inicia sesión de nuevo.');
  });

  await test('GET /auth/me devuelve el usuario autenticado sin password', async () => {
    const res = await get('/auth/me', world.tokens.studentA);
    equal(res.status, 200, 'status');
    equal(res.data.id, world.users.studentA.id, 'id');
    notOk('password' in res.data, 'no debe exponer password');
  });

  await test('el header Authorization sin prefijo Bearer se rechaza', async () => {
    const res = await get('/auth/me', undefined);
    equal(res.status, 401, 'status');
  });
}
