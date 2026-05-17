const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';
const TOKEN_KEY = 'wrayblog_admin_token';

const buildApiUrl = (path) => `${API_BASE_URL}${path}`;

const getAuthHeaders = () => {
  const token = typeof window === 'undefined' ? '' : localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const normalizeMedia = (record) => {
  const explicitMedia = Array.isArray(record.media) ? record.media : [];
  const legacyMedia = [
    ...(record.image ? [{ type: 'image', url: record.image }] : []),
    ...(Array.isArray(record.videos)
      ? record.videos.map((url) => ({ type: 'video', url }))
      : []),
  ];

  return (explicitMedia.length ? explicitMedia : legacyMedia)
    .map((item) => ({
      type: item.type === 'video' ? 'video' : 'image',
      url: item.url || item.src || '',
      coverUrl: item.coverUrl || '',
      name: item.name || '',
    }))
    .filter((item) => item.url);
};

export const normalizeStudyRecord = (record) => {
  const topics = Array.isArray(record.topics)
    ? record.topics
        .map((topic) => ({
          name: topic.name || '',
          minutes: Number(topic.minutes) || 0,
          category: topic.category || '',
          note: topic.note || '',
        }))
        .filter((topic) => topic.name)
    : [];
  const durationMinutes =
    Number(record.durationMinutes) ||
    topics.reduce((sum, topic) => sum + (Number(topic.minutes) || 0), 0);

  return {
    id: record._id || record.id || record.slug,
    slug: record.slug,
    category: '学习记录',
    categorySlug: 'study',
    title: record.title || `${record.studyDate || ''} ${record.studyUser || 'Wray'} 的学习记录`,
    studyDate: record.studyDate || (record.createAt ? String(record.createAt).slice(0, 10) : ''),
    studyUser: record.studyUser || record.authorName || 'Wray',
    authorName: record.authorName || record.studyUser || 'Wray',
    authorAvatar: record.authorAvatar || '/icon/Mammon.png',
    topics,
    durationMinutes,
    summary: record.summary || record.excerpt || '',
    excerpt: record.summary || record.excerpt || '',
    content: record.content || '',
    tags: Array.isArray(record.tags) ? record.tags : [],
    media: normalizeMedia(record),
    image: normalizeMedia(record).find((item) => item.type === 'image')?.url || '/img/sky.jpg',
    videos: normalizeMedia(record).filter((item) => item.type === 'video').map((item) => item.url),
    published: record.published !== false,
    visibility: record.visibility === 'private' ? 'private' : 'public',
    isPrivate: record.visibility === 'private',
    createAt: record.createAt || '',
    updatedAt: record.updatedAt || '',
  };
};

export const fetchStudyRecords = async () => {
  const response = await fetch(buildApiUrl('/api/study-records'), {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to load study records');
  }

  const records = await response.json();
  return records.map(normalizeStudyRecord);
};
