const API_BASE = 'http://localhost:5000/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: any = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'API error');
  return data;
}

export async function login(email: string, password: string, role?: string) {
  const payload: any = { email, password };
  if (role) payload.role = role;
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (data.token) localStorage.setItem('token', data.token);
  return data;
}

export async function register(payload: {
  name: string;
  email: string;
  password: string;
  role: string;
  contact?: string;
}) {
  const data = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (data.token) localStorage.setItem('token', data.token);
  return data;
}

export function logout() {
  localStorage.removeItem('token');
}

export { request }; 