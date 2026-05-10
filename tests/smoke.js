const http = require('http');

const host = 'localhost';
const port = 2000;

function req(path, method = 'GET', body = null, token = null) {
  const data = body ? JSON.stringify(body) : null;
  const headers = {
    'Content-Type': 'application/json',
  };
  if (data) headers['Content-Length'] = Buffer.byteLength(data);
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { hostname: host, port, path, method, headers };

  return new Promise((resolve, reject) => {
    const r = http.request(options, (res) => {
      let chunks = '';
      res.on('data', (c) => (chunks += c));
      res.on('end', () => {
        try {
          const parsed = chunks ? JSON.parse(chunks) : null;
          resolve({ status: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, body: chunks });
        }
      });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

async function run() {
  console.log('1) Health check');
  console.log(await req('/api/health'));

  console.log('\n2) Register user');
  const user = { username: `testuser_${Date.now()}`, email: `test+${Date.now()}@example.com`, password: 'password123' };
  const reg = await req('/api/auth/register', 'POST', user);
  console.log(reg);

  console.log('\n3) Login user');
  const login = await req('/api/auth/login', 'POST', { email: user.email, password: user.password });
  console.log(login);

  const token = login.body && login.body.token;
  if (!token) {
    console.error('Login failed, aborting tests');
    process.exit(1);
  }

  console.log('\n4) Create task');
  const create = await req('/api/tasks', 'POST', { title: 'Smoke test task', description: 'Created by smoke script' }, token);
  console.log(create);

  const taskId = create.body && create.body.data && create.body.data.id;

  console.log('\n5) Get tasks');
  console.log(await req('/api/tasks', 'GET', null, token));

  if (taskId) {
    console.log('\n6) Update task');
    console.log(await req(`/api/tasks/${taskId}`, 'PUT', { status: 'completed' }, token));

    console.log('\n7) Delete task');
    console.log(await req(`/api/tasks/${taskId}`, 'DELETE', null, token));
  } else {
    console.warn('No taskId returned, skipping update/delete');
  }

  console.log('\nSmoke tests completed');
}

run().catch((err) => {
  console.error('Smoke test error', err);
  process.exit(1);
});
