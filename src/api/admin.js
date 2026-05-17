const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

const buildApiUrl = (path) => `${API_BASE_URL}${path}`;

const requestJson = async (path, options = {}) => {
  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || data.message || 'Request failed');
  }

  return data;
};

const withAuth = (token) => ({
  Authorization: `Bearer ${token}`,
});

export const loginAdmin = (username, password) =>
  requestJson('/api/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });

export const fetchAdminPosts = (token) =>
  requestJson('/api/admin/posts', {
    headers: withAuth(token),
  });

export const fetchAdminStudyRecords = (token) =>
  requestJson('/api/admin/study-records', {
    headers: withAuth(token),
  });

export const fetchAdminProfile = (token) =>
  requestJson('/api/admin/profile', {
    headers: withAuth(token),
  });

export const updateAdminProfile = (token, profile) =>
  requestJson('/api/admin/profile', {
    method: 'PUT',
    headers: withAuth(token),
    body: JSON.stringify(profile),
  });

export const createAdminPost = (token, post) =>
  requestJson('/api/posts', {
    method: 'POST',
    headers: withAuth(token),
    body: JSON.stringify(post),
  });

export const createAdminStudyRecord = (token, record) =>
  requestJson('/api/study-records', {
    method: 'POST',
    headers: withAuth(token),
    body: JSON.stringify(record),
  });

export const updateAdminPost = (token, slug, post) =>
  requestJson(`/api/posts/${encodeURIComponent(slug)}`, {
    method: 'PUT',
    headers: withAuth(token),
    body: JSON.stringify(post),
  });

export const updateAdminStudyRecord = (token, slug, record) =>
  requestJson(`/api/study-records/${encodeURIComponent(slug)}`, {
    method: 'PUT',
    headers: withAuth(token),
    body: JSON.stringify(record),
  });

export const deleteAdminPost = (token, slug) =>
  requestJson(`/api/posts/${encodeURIComponent(slug)}`, {
    method: 'DELETE',
    headers: withAuth(token),
  });

export const deleteAdminStudyRecord = (token, slug) =>
  requestJson(`/api/study-records/${encodeURIComponent(slug)}`, {
    method: 'DELETE',
    headers: withAuth(token),
  });

export const uploadAdminMedia = async (token, file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(buildApiUrl('/api/uploads'), {
    method: 'POST',
    headers: withAuth(token),
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || data.message || 'Upload failed');
  }

  return data;
};
