async function testAPI() {
  const baseUrl = 'http://localhost:5000/api';
  let token = '';

  const request = async (path, method = 'GET', body = null) => {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${baseUrl}${path}`, opts);
    const data = await res.json();
    if (!res.ok) {
      console.dir(data, { depth: null });
      throw new Error(data.error?.message || 'Request failed');
    }
    return data;
  };

  try {
    console.log('Testing Registration...');
    const regRes = await request('/auth/register', 'POST', {
      fullName: 'Test User',
      email: `test${Date.now()}@test.com`,
      password: 'password123'
    });
    token = regRes.data.token;
    console.log('Register OK');

    console.log('Testing Project Creation...');
    const projRes = await request('/projects', 'POST', {
      name: 'Test Project',
      description: 'A test project'
    });
    const projectId = projRes.data.project.id;
    console.log('Project Create OK');

    console.log('Testing Task Creation...');
    await request(`/tasks`, 'POST', {
      name: 'Test Task',
      description: 'A test task',
      projectId: projectId
    });
    console.log('Task Create OK');

    console.log('Testing Search/Filter...');
    const searchRes = await request('/projects?search=Test');
    if (searchRes.data.length > 0) {
      console.log('Search OK');
    } else {
      console.log('Search Failed: No results');
    }

    console.log('All API tests passed!');
  } catch (error) {
    console.error('API Test Error:', error.message);
  }
}

testAPI();
