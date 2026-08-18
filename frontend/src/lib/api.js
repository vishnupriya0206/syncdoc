const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function request(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${API_URL}/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  register: (name, email, password) => request('/auth/register', { method: 'POST', body: { name, email, password } }),
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  me: (token) => request('/auth/me', { token }),

  listDocuments: (token, scope) => request(`/documents${scope ? `?scope=${scope}` : ''}`, { token }),
  createDocument: (token, title) => request('/documents', { method: 'POST', token, body: { title } }),
  getDocument: (token, id) => request(`/documents/${id}`, { token }),
  updateDocument: (token, id, patch) => request(`/documents/${id}`, { method: 'PATCH', token, body: patch }),
  deleteDocument: (token, id) => request(`/documents/${id}`, { method: 'DELETE', token }),
  inviteCollaborator: (token, id, email, role) =>
    request(`/documents/${id}/invite`, { method: 'POST', token, body: { email, role } }),
};

export { API_URL };
