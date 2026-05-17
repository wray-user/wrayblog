const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';
const TOKEN_KEY = 'wrayblog_admin_token';

const buildApiUrl = (path) => `${API_BASE_URL}${path}`;

const getAuthHeaders = () => {
  const token = typeof window === 'undefined' ? '' : localStorage.getItem(TOKEN_KEY);

  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchComments = async (slug) => {
  const response = await fetch(buildApiUrl(`/api/posts/${slug}/comments`), {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to load comments');
  }

  return response.json();
};

export const createComment = async (slug, payload) => {
  const response = await fetch(buildApiUrl(`/api/posts/${slug}/comments`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.message || 'Failed to create comment');
  }

  return response.json();
};

export const likePost = async (slug) => {
  const response = await fetch(buildApiUrl(`/api/posts/${slug}/like`), {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to like post');
  }

  return response.json();
};

export const likeComment = async (id) => {
  const response = await fetch(buildApiUrl(`/api/comments/${id}/like`), {
    method: 'PATCH',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to like comment');
  }

  return response.json();
};
