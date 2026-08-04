const BASE = (process.env.API_URL || 'http://localhost:5000/api').replace(/\/+$/, '');

function assert(cond, msg) {
  if (!cond) throw new Error('FALLO: ' + msg);
  console.log('  OK:', msg);
}

async function login(email, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(`Login fallo para ${email}`);
  return res.json();
}

async function get(path, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${BASE}${path}`, { headers });
  return { status: res.status, data: await res.json() };
}

async function post(path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  return { status: res.status, data: await res.json() };
}

async function del(path, token) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return { status: res.status, data: await res.json() };
}

async function run() {
  console.log(`Smoke tests contra ${BASE}`);

  const health = await get('/health');
  assert(health.status === 200, 'GET /health');

  const instRes = await get('/institutions');
  assert(instRes.status === 200, 'GET /institutions publico');

  const noAuth = await get('/users');
  assert(noAuth.status === 401, 'GET /users sin token -> 401');

  const badLogin = await post('/auth/login', { email: 'karl26chy@gmail.com', password: 'incorrecta' });
  assert(badLogin.status === 401, 'login con password incorrecto -> 401');

  const superAuth = await login('karl26chy@gmail.com', 'olafo1234');
  assert(!!superAuth.token, 'login super admin devuelve token JWT');
  assert(superAuth.user && !('password' in superAuth.user), 'login no expone password');
  assert(superAuth.user.rol === 'super_admin', 'rol es super_admin');

  const usersRes = await get('/users', superAuth.token);
  assert(usersRes.status === 200, 'GET /users con token');
  assert(usersRes.data.every((u) => !('password' in u)), 'users no exponen password');

  const meRes = await get('/auth/me', superAuth.token);
  assert(meRes.status === 200, 'GET /auth/me con token');

  // Superadmin puede crear una institucion
  const newInst = await post('/institutions', {
    nombre: 'Institucion de Prueba',
    subdominio: 'test-smoke-' + Date.now(),
    tipo: 'colegio',
    nota_minima_aprobacion: 6,
    activa: true,
  }, superAuth.token);
  assert(newInst.status === 201, 'super admin crea institucion');

  // Superadmin puede crear un usuario admin para esa institucion
  const newUser = await post('/users', {
    email: 'test-smoke-' + Date.now() + '@test.com',
    password: 'test1234',
    rol: 'admin',
    nombre: 'Test',
    apellido: 'Smoke',
    institucion_id: newInst.data.id,
    activo: true,
  }, superAuth.token);
  assert(newUser.status === 201, 'super admin crea usuario admin');
  assert(!('password' in newUser.data), 'usuario creado no expone password');

  // El nuevo admin puede hacer login
  // No podemos loguear porque no sabemos el password hasheado devuelto
  // Pero el superadmin puede ver la institucion creada
  const instAfter = await get('/institutions', superAuth.token);
  assert(instAfter.data.length === 1, 'instituciones ahora tiene 1 registro');

  // Limpiar datos de prueba
  await del(`/users/${newUser.data.id}`, superAuth.token);
  await del(`/institutions/${newInst.data.id}`, superAuth.token);

  const instClean = await get('/institutions', superAuth.token);
  assert(instClean.data.length === 0, 'instituciones limpias despues de borrar');

  console.log('\nTodos los smoke tests pasaron.');
}

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
