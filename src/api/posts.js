const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';
const TOKEN_KEY = 'wrayblog_admin_token';

const buildApiUrl = (path) => `${API_BASE_URL}${path}`;

const getAuthHeaders = () => {
  const token = typeof window === 'undefined' ? '' : localStorage.getItem(TOKEN_KEY);

  return token ? { Authorization: `Bearer ${token}` } : {};
};

const normalizeContent = (content) => {
  if (Array.isArray(content)) {
    return content;
  }

  if (typeof content === 'string' && content.trim()) {
    return content;
  }

  return [];
};

export const createPostExcerpt = (content, maxLength = 96) => {
  const rawText = Array.isArray(content) ? content.join('\n') : String(content || '');
  const text = rawText
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<video[\s\S]*?<\/video>/gi, ' ')
    .replace(/<img\b[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/[#>*_`~\-|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength)}...`;
};

export const normalizePost = (post) => {
  const content = normalizeContent(post.content);
  const categorySlug = post.categorySlug || 'uncategorized';

  return {
    id: post._id || post.id || post.slug,
    slug: post.slug,
    category: post.category || '未分类',
    categorySlug,
    techTopic:
      categorySlug === 'tech'
        ? post.techTopic || post.subcategory || post.topic || 'Python'
        : post.techTopic || post.subcategory || post.topic || '',
    tags: Array.isArray(post.tags) ? post.tags : [],
    title: post.title || '未命名文章',
    excerpt: createPostExcerpt(content),
    date:
      post.date ||
      (post.createAt ? new Date(post.createAt).toISOString().slice(0, 10) : ''),
    readTime: post.readTime || '3 min',
    image: post.image || '/img/sky.jpg',
    content,
    videos: Array.isArray(post.videos) ? post.videos : [],
    published: post.published !== false,
    visibility: post.visibility === 'private' ? 'private' : 'public',
    isPrivate: post.visibility === 'private',
    locked: Boolean(post.locked),
    views: Number(post.views) || 0,
    likes: Number(post.likes) || 0,
    liked: Boolean(post.liked),
    history: Array.isArray(post.history) ? post.history : [],
    createAt: post.createAt || '',
    updatedAt: post.updatedAt || '',
    authorName: post.authorName || 'Wray',
    authorAvatar: post.authorAvatar || '/icon/Mammon.png',
  };
};

export const fetchPosts = async () => {
  const response = await fetch(buildApiUrl('/api/posts'), {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to load posts');
  }

  const posts = await response.json();
  return posts.map(normalizePost);
};

export const fetchPostBySlug = async (slug) => {
  const response = await fetch(buildApiUrl(`/api/posts/${slug}`), {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) {
      const data = await response.json().catch(() => null);

      if (data?.post) {
        return normalizePost(data.post);
      }
    }

    throw new Error('Failed to load post');
  }

  return normalizePost(await response.json());
};
