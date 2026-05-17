const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');

const Comment = require('./models/Comment');
const Counter = require('./models/Counter');
const Post = require('./models/Post');
const PublishLock = require('./models/PublishLock');
const StudyRecord = require('./models/StudyRecord');
const User = require('./models/User');
const { sendOpenClawMessage } = require('./services/openclaw');

const loadEnvFile = () => {
  const envPath = path.join(__dirname, '.env');

  if (!fs.existsSync(envPath)) {
    return;
  }

  fs.readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .forEach((line) => {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith('#')) {
        return;
      }

      const separatorIndex = trimmed.indexOf('=');

      if (separatorIndex === -1) {
        return;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();

      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    });
};

loadEnvFile();

const app = express();
app.set('trust proxy', true);

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wrayblog';
const UPLOAD_ROOT = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');
const SITE_BASE_URL = (process.env.SITE_BASE_URL || process.env.PUBLIC_SITE_URL || '').replace(/\/$/, '');
const VISIT_NOTIFY_STEP = Math.max(1, Number(process.env.VISIT_NOTIFY_STEP) || 10);
const AGENT_API_TOKEN = process.env.AGENT_API_TOKEN || '';
const AGENT_ALLOWED_USERS = new Set(
  (process.env.AGENT_ALLOWED_USERS || [process.env.AGENT_WRAY_USER || 'wray', process.env.AGENT_DANTA_USER || 'danta'].join(','))
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean),
);
const PUBLISH_LOCK_KEY = 'global-publish';
const PUBLISH_LOCK_TTL_MS = Math.max(30, Number(process.env.PUBLISH_LOCK_TTL_SECONDS) || 300) * 1000;

const ADMIN_ACCOUNTS = [
  {
    username: process.env.ADMIN_USER || 'admin',
    password: process.env.ADMIN_PASSWORD || 'change-this-password',
    displayName: process.env.ADMIN_NAME || 'Wray',
    avatar: process.env.ADMIN_AVATAR || '/icon/Mammon.png',
    canSeeLegacyPosts: true,
    syncPassword: Boolean(process.env.ADMIN_PASSWORD),
  },
  {
    username: process.env.EDITOR_USER || 'wray',
    password: process.env.EDITOR_PASSWORD || 'change-this-writer-password',
    displayName: process.env.EDITOR_NAME || 'Wray',
    avatar: process.env.EDITOR_AVATAR || '/icon/Mammon.png',
    canSeeLegacyPosts: false,
    syncPassword: Boolean(process.env.EDITOR_PASSWORD),
  },
  {
    username: process.env.DANTA_USER || 'danta',
    password:
      process.env.DANTA_PASSWORD ||
      process.env.EDITOR_PASSWORD ||
      'change-this-writer-password',
    displayName: process.env.DANTA_NAME || 'danta',
    avatar: process.env.DANTA_AVATAR || '/icon/Mammon.png',
    canSeeLegacyPosts: false,
    syncPassword: Boolean(process.env.DANTA_PASSWORD),
  },
].filter((account) => account.username && account.password);

const SESSION_BY_TOKEN = new Map();

const hashPassword = (password) =>
  crypto.createHash('sha256').update(`wrayblog:${password}`).digest('hex');

const hashLikeIdentity = (identity) =>
  crypto.createHash('sha256').update(`wrayblog-like:${identity}`).digest('hex');

const createSessionToken = () => crypto.randomBytes(32).toString('hex');

const getBearerToken = (req) => {
  const authHeader = req.get('authorization') || '';
  return authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : '';
};

const getLikeKey = (req) => {
  const token = getBearerToken(req);
  const username = SESSION_BY_TOKEN.get(token);

  if (username) {
    return hashLikeIdentity(`user:${username}`);
  }

  return hashLikeIdentity(`ip:${req.ip || req.socket.remoteAddress || 'unknown'}`);
};

const addViewerState = (item, likeKey) => {
  const data = typeof item.toObject === 'function' ? item.toObject() : { ...item };
  const likedBy = Array.isArray(data.likedBy) ? data.likedBy : [];

  delete data.likedBy;

  return {
    ...data,
    liked: likedBy.includes(likeKey),
  };
};

const createExcerpt = (content, maxLength = 96) => {
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

  return text.length <= maxLength ? text : `${text.slice(0, maxLength)}...`;
};

const stripMarkdown = (content) => {
  const rawText = Array.isArray(content) ? content.join('\n') : String(content || '');

  return rawText
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<video[\s\S]*?<\/video>/gi, ' ')
    .replace(/<img\b[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/[#>*_`~\-|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const countTextUnits = (content) => {
  const text = stripMarkdown(content);
  const cjkCount = (text.match(/[\u3400-\u9fff]/g) || []).length;
  const wordCount = (text.replace(/[\u3400-\u9fff]/g, ' ').match(/[A-Za-z0-9]+/g) || []).length;

  return cjkCount + wordCount;
};

const formatNotifyTime = (value = new Date()) =>
  new Date(value).toLocaleString('zh-CN', {
    timeZone: process.env.NOTIFY_TIME_ZONE || 'Asia/Shanghai',
    hour12: false,
  });

const buildPostUrl = (slug) => (SITE_BASE_URL ? `${SITE_BASE_URL}/#/post/${slug}` : `#/post/${slug}`);

const buildStudyUrl = () => (SITE_BASE_URL ? `${SITE_BASE_URL}/#/category/study` : '#/category/study');

const getVisibilityLabel = (value) => (value === 'private' ? '私密' : '公开');

const getPublishStateLabel = (item) => (item.published === false ? '草稿' : '已发布');

const getStudyWordSource = (record) => [
  record.summary,
  record.content,
  ...(Array.isArray(record.topics)
    ? record.topics.map((topic) => `${topic.name || ''} ${topic.category || ''} ${topic.note || ''}`)
    : []),
].join('\n');

const notifyContentChange = (action, kind, item, account) => {
  const data = typeof item.toObject === 'function' ? item.toObject() : { ...item };
  const isStudy = kind === 'study';
  const typeName = isStudy ? '学习记录' : data.category || data.categorySlug || '文章';
  const wordCount = isStudy ? countTextUnits(getStudyWordSource(data)) : countTextUnits(data.content);
  const link = isStudy ? buildStudyUrl() : buildPostUrl(data.slug);
  const author = account?.displayName || data.authorName || account?.username || data.owner || 'unknown';
  const message = [
    `【博客${action}】`,
    `作者：${author}`,
    `类型：${typeName}`,
    `标题：${data.title || '未命名'}`,
    `时间：${formatNotifyTime(data.updatedAt || data.createAt || Date.now())}`,
    `字数：${wordCount}`,
    `状态：${getPublishStateLabel(data)} / ${getVisibilityLabel(data.visibility)}`,
    `链接：${link}`,
  ].join('\n');

  sendOpenClawMessage(message, {
    sessionKey: `wrayblog-${kind}-notify`,
  }).catch((error) => {
    console.warn(`Failed to queue OpenClaw content notification: ${error.message}`);
  });
};

const notifyVisitMilestone = (totalVisits, post) => {
  const message = [
    '【博客访问提醒】',
    `总访问量：${totalVisits}`,
    `触发规则：较上次增加 ${VISIT_NOTIFY_STEP} 次`,
    `最近访问：${post?.title || post?.slug || 'unknown'}`,
    `时间：${formatNotifyTime()}`,
  ].join('\n');

  sendOpenClawMessage(message, {
    sessionKey: 'wrayblog-visit-notify',
  }).catch((error) => {
    console.warn(`Failed to queue OpenClaw visit notification: ${error.message}`);
  });
};

const getCurrentVisitTotal = async () => {
  const visits = await Post.aggregate([
    { $match: { published: { $ne: false } } },
    {
      $group: {
        _id: null,
        total: { $sum: { $ifNull: ['$views', 0] } },
      },
    },
  ]);

  return visits[0]?.total || 0;
};

const ensureVisitCounter = async () => {
  const total = await getCurrentVisitTotal();
  await Counter.findOneAndUpdate(
    { key: 'visits' },
    {
      $setOnInsert: {
        key: 'visits',
        value: total,
        lastNotifiedValue: Math.floor(total / VISIT_NOTIFY_STEP) * VISIT_NOTIFY_STEP,
      },
    },
    { upsert: true, new: true },
  );
};

const trackVisitAndMaybeNotify = async (post) => {
  const counter = await Counter.findOneAndUpdate(
    { key: 'visits' },
    {
      $inc: { value: 1 },
      $setOnInsert: {
        key: 'visits',
        lastNotifiedValue: 0,
      },
    },
    { upsert: true, new: true },
  );

  if (counter.value - counter.lastNotifiedValue < VISIT_NOTIFY_STEP) {
    return;
  }

  const updatedCounter = await Counter.findOneAndUpdate(
    {
      key: 'visits',
      lastNotifiedValue: counter.lastNotifiedValue,
    },
    { $set: { lastNotifiedValue: counter.value } },
    { new: true },
  );

  if (updatedCounter) {
    notifyVisitMilestone(updatedCounter.value, post);
  }
};

const CATEGORY_NAME_BY_SLUG = {
  tech: '技术分享',
  essay: '心情随笔',
  study: '学习记录',
  uncategorized: '未分类',
};

const currentDateString = () => new Date().toISOString().slice(0, 10);

const makeSlug = (value, fallbackPrefix = 'post') => {
  const slug = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || `${fallbackPrefix}-${Date.now().toString(36)}`;
};

const estimateReadTime = (content) => `${Math.max(1, Math.ceil(countTextUnits(content) / 500))} min`;

const normalizeTechKind = (value) => {
  const text = String(value || '').trim().toLowerCase();
  return text === 'note' || text === '笔记' ? 'note' : 'question';
};

const normalizeAgentPostBody = (body) => {
  const categorySlug = String(body.categorySlug || body.type || 'essay').trim();

  return normalizePostInput({
    ...body,
    slug: String(body.slug || '').trim() || makeSlug(body.title),
    categorySlug,
    category: body.category || CATEGORY_NAME_BY_SLUG[categorySlug] || CATEGORY_NAME_BY_SLUG.uncategorized,
    techTopic: categorySlug === 'tech' ? body.techTopic || body.topic || 'Python' : '',
    techKind: categorySlug === 'tech' ? normalizeTechKind(body.techKind || body.techType || body.articleType) : 'question',
    noteOrder: categorySlug === 'tech' ? Number(body.noteOrder) || 0 : 0,
    tags: Array.isArray(body.tags)
      ? body.tags
      : String(body.tags || '')
          .split(/[,，\s]+/)
          .map((tag) => tag.trim())
          .filter(Boolean),
    image: body.image || '/img/sky.jpg',
    videos: Array.isArray(body.videos) ? body.videos : [],
    readTime: body.readTime || estimateReadTime(body.content),
    date: body.date || formatNotifyTime(),
    views: 0,
    published: body.draft === true ? false : body.published !== false,
  });
};

const redactPrivatePost = (post) => {
  const item = typeof post.toObject === 'function' ? post.toObject() : { ...post };

  if (item.visibility !== 'private') {
    return item;
  }

  return {
    ...item,
    content: '',
    videos: [],
    excerpt: '这是一篇私密文章，登录后可以查看正文。',
    locked: true,
  };
};

const normalizePostInput = (body) => ({
  title: body.title,
  slug: body.slug,
  excerpt: createExcerpt(body.content),
  content: body.content,
  category: body.category,
  categorySlug: body.categorySlug,
  techTopic: body.categorySlug === 'tech' ? body.techTopic || 'Python' : '',
  techKind: body.categorySlug === 'tech' ? normalizeTechKind(body.techKind || body.techType || body.articleType) : 'question',
  noteOrder: body.categorySlug === 'tech' ? Number(body.noteOrder) || 0 : 0,
  tags: Array.isArray(body.tags) ? body.tags : [],
  image: body.image,
  videos: Array.isArray(body.videos) ? body.videos : [],
  readTime: body.readTime,
  date: body.date,
  views: Number(body.views) || 0,
  published: body.published !== false,
  visibility: body.visibility === 'private' ? 'private' : 'public',
});

const normalizeStudyTopics = (topics) => {
  if (!Array.isArray(topics)) {
    return [];
  }

  return topics
    .map((topic) => ({
      name: String(topic.name || '').trim(),
      minutes: Math.max(0, Number(topic.minutes) || 0),
      category: String(topic.category || '').trim(),
      note: String(topic.note || '').trim(),
    }))
    .filter((topic) => topic.name);
};

const normalizeStudyMedia = (media) => {
  if (!Array.isArray(media)) {
    return [];
  }

  return media
    .map((item) => ({
      type: item.type === 'video' ? 'video' : 'image',
      url: String(item.url || '').trim(),
      coverUrl: String(item.coverUrl || '').trim(),
      name: String(item.name || '').trim(),
    }))
    .filter((item) => item.url);
};

const normalizeStudyRecordInput = (body, account) => {
  const topics = normalizeStudyTopics(body.topics);
  const durationMinutes =
    Number(body.durationMinutes) > 0
      ? Number(body.durationMinutes)
      : topics.reduce((sum, topic) => sum + topic.minutes, 0);
  const studyDate = String(body.studyDate || '').slice(0, 10);
  const studyUser = String(body.studyUser || account.displayName || account.username).trim();
  const title = String(body.title || `${studyDate} ${studyUser} 的学习记录`).trim();

  return {
    slug: body.slug,
    studyDate,
    studyUser,
    title,
    topics,
    durationMinutes,
    summary: String(body.summary || '').trim(),
    content: String(body.content || ''),
    tags: Array.isArray(body.tags) ? body.tags : [],
    media: normalizeStudyMedia(body.media),
    published: body.published !== false,
    visibility: body.visibility === 'private' ? 'private' : 'public',
    owner: account.username,
    authorName: account.displayName,
    authorAvatar: account.avatar,
  };
};

const getOwnerQuery = (account) => {
  if (account.canSeeLegacyPosts) {
    return {
      $or: [{ owner: account.username }, { owner: { $exists: false } }, { owner: null }],
    };
  }

  return { owner: account.username };
};

const getStudyOwnerQuery = (account) => (account.canSeeLegacyPosts ? {} : { owner: account.username });

const requireAuth = async (req, res, next) => {
  const token = getBearerToken(req);
  const username = SESSION_BY_TOKEN.get(token);

  if (!token || !username) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const account = await User.findOne({ username });

    if (!account) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    req.adminAccount = account;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

const getAuthAccount = async (req) => {
  const token = getBearerToken(req);
  const username = SESSION_BY_TOKEN.get(token);

  if (!token || !username) {
    return null;
  }

  return User.findOne({ username });
};

const requireAgentAuth = (req, res, next) => {
  if (!AGENT_API_TOKEN) {
    return res.status(503).json({ message: 'Agent API is not configured' });
  }

  if (getBearerToken(req) !== AGENT_API_TOKEN) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  return next();
};

const getAgentAccount = async (req) => {
  const username = String(req.body?.username || req.query?.username || '').trim();

  if (!username || !AGENT_ALLOWED_USERS.has(username)) {
    return null;
  }

  return User.findOne({ username });
};

const acquirePublishLock = async (holder) => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + PUBLISH_LOCK_TTL_MS);

  try {
    const lock = await PublishLock.findOneAndUpdate(
      {
        key: PUBLISH_LOCK_KEY,
        $or: [{ holder }, { expiresAt: { $lte: now } }],
      },
      {
        $set: { holder, expiresAt },
        $setOnInsert: { key: PUBLISH_LOCK_KEY },
      },
      { upsert: true, new: true },
    );

    return { acquired: true, lock };
  } catch (error) {
    if (error.code !== 11000) {
      throw error;
    }

    const lock = await PublishLock.findOne({ key: PUBLISH_LOCK_KEY });
    return { acquired: false, lock };
  }
};

const requirePublishLock = async (username, res) => {
  const lock = await PublishLock.findOne({
    key: PUBLISH_LOCK_KEY,
    holder: username,
    expiresAt: { $gt: new Date() },
  });

  if (lock) {
    return true;
  }

  res.status(423).json({
    message: 'Publish lock is required before publishing',
    code: 'PUBLISH_LOCK_REQUIRED',
  });
  return false;
};

app.use(cors());
app.use(express.json({ limit: '5mb' }));

fs.mkdirSync(UPLOAD_ROOT, { recursive: true });

app.use(
  '/api/uploads',
  express.static(UPLOAD_ROOT, {
    maxAge: '30d',
  }),
);

const isAllowedUpload = (file) =>
  file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/');

const uploadStorage = multer.diskStorage({
  destination: (req, file, callback) => {
    const folder = file.mimetype.startsWith('video/') ? 'videos' : 'images';
    const targetDir = path.join(UPLOAD_ROOT, folder);

    fs.mkdirSync(targetDir, { recursive: true });
    callback(null, targetDir);
  },
  filename: (req, file, callback) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

    callback(null, safeName);
  },
});

const upload = multer({
  storage: uploadStorage,
  limits: {
    fileSize: 200 * 1024 * 1024,
  },
  fileFilter: (req, file, callback) => {
    if (!isAllowedUpload(file)) {
      return callback(new Error('Only image and video uploads are allowed'));
    }

    return callback(null, true);
  },
});

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    message: 'Backend is running',
  });
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const account = await User.findOne({ username });

    if (!account || account.passwordHash !== hashPassword(password)) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = createSessionToken();
    SESSION_BY_TOKEN.set(token, account.username);

    return res.json({
      token,
      user: {
        username: account.username,
        displayName: account.displayName,
        avatar: account.avatar,
        motto: account.motto,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to login' });
  }
});

app.get('/api/admin/profile', requireAuth, (req, res) => {
  res.json({
    username: req.adminAccount.username,
    displayName: req.adminAccount.displayName,
    avatar: req.adminAccount.avatar,
    motto: req.adminAccount.motto,
  });
});

app.put('/api/admin/profile', requireAuth, async (req, res) => {
  try {
    const update = {
      displayName: req.body.displayName || req.adminAccount.displayName,
      avatar: req.body.avatar || req.adminAccount.avatar,
      motto: req.body.motto || '',
    };
    const wantsPasswordChange =
      req.body.currentPassword || req.body.newPassword || req.body.confirmPassword;

    if (wantsPasswordChange) {
      if (!req.body.currentPassword) {
        return res.status(400).json({ message: 'Please enter current password' });
      }

      if (req.adminAccount.passwordHash !== hashPassword(req.body.currentPassword)) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      if (!req.body.newPassword || req.body.newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters' });
      }

      if (req.body.newPassword !== req.body.confirmPassword) {
        return res.status(400).json({ message: 'New passwords do not match' });
      }

      update.passwordHash = hashPassword(req.body.newPassword);
    }

    const account = await User.findOneAndUpdate({ username: req.adminAccount.username }, update, {
      new: true,
    });

    return res.json({
      username: account.username,
      displayName: account.displayName,
      avatar: account.avatar,
      motto: account.motto,
    });
  } catch (error) {
    return res.status(400).json({ message: 'Failed to update profile' });
  }
});

app.get('/api/admin/posts', requireAuth, async (req, res) => {
  try {
    const posts = await Post.find(getOwnerQuery(req.adminAccount)).sort({ createAt: -1 });
    return res.json(posts);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load admin posts' });
  }
});

app.get('/api/admin/posts/:slug', requireAuth, async (req, res) => {
  try {
    const post = await Post.findOne({
      slug: req.params.slug,
      ...getOwnerQuery(req.adminAccount),
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    return res.json(post);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load admin post' });
  }
});

app.get('/api/admin/study-records', requireAuth, async (req, res) => {
  try {
    const records = await StudyRecord.find(getStudyOwnerQuery(req.adminAccount)).sort({
      studyDate: -1,
      createAt: -1,
    });

    return res.json(records);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load study records' });
  }
});

app.post('/api/uploads', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const folder = req.file.mimetype.startsWith('video/') ? 'videos' : 'images';

  return res.status(201).json({
    url: `/api/uploads/${folder}/${req.file.filename}`,
    type: req.file.mimetype.startsWith('video/') ? 'video' : 'image',
    name: req.file.originalname,
  });
});

app.get('/api/agent/schema', requireAgentAuth, (req, res) => {
  res.json({
    modes: {
      chat: {
        description: 'Default mode. Do not call blog APIs for normal chat.',
      },
      website: {
        description:
          'Use this mode only when the user explicitly asks to manage the website, publish content, check publish requirements, or release a publish lock.',
        activationPhrases: ['网站', '博客', '发布', '发文章', '学习记录', '后台', '访问量'],
      },
    },
    users: Array.from(AGENT_ALLOWED_USERS),
    lock: {
      acquire: 'POST /api/agent/publish-lock/acquire',
      release: 'POST /api/agent/publish-lock/release',
      ttlSeconds: Math.round(PUBLISH_LOCK_TTL_MS / 1000),
    },
    contentTypes: {
      tech: {
        endpoint: 'POST /api/agent/posts',
        updateEndpoint: 'PUT /api/agent/posts/:slug',
        deleteEndpoint: 'DELETE /api/agent/posts/:slug?username=<username>',
        required: ['username', 'categorySlug=tech', 'title', 'content', 'techTopic'],
        optional: ['techKind=question|note', 'noteOrder', 'tags', 'image', 'videos', 'visibility', 'published', 'historyMessage'],
      },
      essay: {
        endpoint: 'POST /api/agent/posts',
        updateEndpoint: 'PUT /api/agent/posts/:slug',
        deleteEndpoint: 'DELETE /api/agent/posts/:slug?username=<username>',
        required: ['username', 'categorySlug=essay', 'title', 'content'],
        optional: ['tags', 'image', 'videos', 'visibility', 'published', 'historyMessage'],
      },
      study: {
        endpoint: 'POST /api/agent/study-records',
        updateEndpoint: 'PUT /api/agent/study-records/:slug',
        deleteEndpoint: 'DELETE /api/agent/study-records/:slug?username=<username>',
        required: ['username', 'studyDate', 'studyUser', 'topics', 'content'],
        optional: ['media', 'visibility', 'published'],
      },
    },
  });
});

app.post('/api/agent/publish-lock/acquire', requireAgentAuth, async (req, res) => {
  try {
    const account = await getAgentAccount(req);

    if (!account) {
      return res.status(400).json({ message: 'Invalid or unauthorized username' });
    }

    const result = await acquirePublishLock(account.username);

    if (!result.acquired) {
      const expiresAt = result.lock?.expiresAt ? new Date(result.lock.expiresAt) : null;
      const waitSeconds = expiresAt
        ? Math.max(1, Math.ceil((expiresAt.getTime() - Date.now()) / 1000))
        : Math.round(PUBLISH_LOCK_TTL_MS / 1000);

      return res.status(423).json({
        message: `${result.lock?.holder || 'Someone'} is publishing. Please wait.`,
        code: 'PUBLISH_LOCKED',
        holder: result.lock?.holder || '',
        expiresAt,
        waitSeconds,
      });
    }

    return res.json({
      ok: true,
      holder: result.lock.holder,
      expiresAt: result.lock.expiresAt,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to acquire publish lock' });
  }
});

app.post('/api/agent/publish-lock/release', requireAgentAuth, async (req, res) => {
  try {
    const account = await getAgentAccount(req);

    if (!account) {
      return res.status(400).json({ message: 'Invalid or unauthorized username' });
    }

    const lock = await PublishLock.findOneAndDelete({
      key: PUBLISH_LOCK_KEY,
      holder: account.username,
    });

    return res.json({
      ok: true,
      released: Boolean(lock),
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to release publish lock' });
  }
});

app.post('/api/agent/posts', requireAgentAuth, async (req, res) => {
  try {
    const account = await getAgentAccount(req);

    if (!account) {
      return res.status(400).json({ message: 'Invalid or unauthorized username' });
    }

    if (!(await requirePublishLock(account.username, res))) {
      return undefined;
    }

    const postInput = normalizeAgentPostBody(req.body);

    if (postInput.categorySlug === 'study') {
      return res.status(400).json({ message: 'Use /api/agent/study-records for study records' });
    }

    if (!postInput.title || !stripMarkdown(postInput.content)) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const now = new Date();
    const post = await Post.create({
      ...postInput,
      owner: account.username,
      authorName: account.displayName,
      authorAvatar: account.avatar,
      history: [
        {
          at: now,
          message: postInput.title,
        },
      ],
    });

    notifyContentChange('创建', 'post', post, account);

    return res.status(201).json({
      ok: true,
      post,
      link: buildPostUrl(post.slug),
    });
  } catch (error) {
    return res.status(400).json({
      message: 'Failed to create agent post',
      detail: error.message,
    });
  }
});

app.put('/api/agent/posts/:slug', requireAgentAuth, async (req, res) => {
  try {
    const account = await getAgentAccount(req);

    if (!account) {
      return res.status(400).json({ message: 'Invalid or unauthorized username' });
    }

    if (!(await requirePublishLock(account.username, res))) {
      return undefined;
    }

    const postInput = normalizeAgentPostBody(req.body);
    postInput.slug = String(req.body.slug || '').trim() || req.params.slug;

    if (postInput.categorySlug === 'study') {
      return res.status(400).json({ message: 'Use /api/agent/study-records for study records' });
    }

    if (!postInput.title || !stripMarkdown(postInput.content)) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const historyMessage = String(req.body.historyMessage || 'OpenClaw 修改').trim();
    const update = {
      $set: {
        ...postInput,
        owner: account.username,
        authorName: account.displayName,
        authorAvatar: account.avatar,
      },
    };

    if (postInput.published !== false) {
      update.$push = {
        history: {
          at: new Date(),
          message: historyMessage,
        },
      };
    }

    const post = await Post.findOneAndUpdate(
      { slug: req.params.slug, ...getOwnerQuery(account) },
      update,
      { new: true, runValidators: true },
    );

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    notifyContentChange('更新', 'post', post, account);

    return res.json({
      ok: true,
      post,
      link: buildPostUrl(post.slug),
    });
  } catch (error) {
    return res.status(400).json({
      message: 'Failed to update agent post',
      detail: error.message,
    });
  }
});

app.delete('/api/agent/posts/:slug', requireAgentAuth, async (req, res) => {
  try {
    const account = await getAgentAccount(req);

    if (!account) {
      return res.status(400).json({ message: 'Invalid or unauthorized username' });
    }

    if (!(await requirePublishLock(account.username, res))) {
      return undefined;
    }

    const post = await Post.findOneAndDelete({
      slug: req.params.slug,
      ...getOwnerQuery(account),
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    notifyContentChange('删除', 'post', post, account);
    return res.json({ ok: true, deleted: post.slug });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete agent post' });
  }
});

app.post('/api/agent/study-records', requireAgentAuth, async (req, res) => {
  try {
    const account = await getAgentAccount(req);

    if (!account) {
      return res.status(400).json({ message: 'Invalid or unauthorized username' });
    }

    if (!(await requirePublishLock(account.username, res))) {
      return undefined;
    }

    const studyDate = String(req.body.studyDate || currentDateString()).slice(0, 10);
    const studyUser = String(req.body.studyUser || account.displayName || account.username).trim();
    const input = normalizeStudyRecordInput(
      {
        ...req.body,
        slug: String(req.body.slug || '').trim() || makeSlug(`${studyDate}-${studyUser}`, 'study'),
        studyDate,
        studyUser,
        title: req.body.title || `${studyDate} ${studyUser} 学习记录`,
      },
      account,
    );

    if (!input.studyDate || !input.studyUser || !input.topics.length) {
      return res.status(400).json({ message: 'Study date, user and topics are required' });
    }

    const record = await StudyRecord.create(input);
    notifyContentChange('创建', 'study', record, account);

    return res.status(201).json({
      ok: true,
      record,
      link: buildStudyUrl(),
    });
  } catch (error) {
    return res.status(400).json({
      message: 'Failed to create agent study record',
      detail: error.message,
    });
  }
});

app.put('/api/agent/study-records/:slug', requireAgentAuth, async (req, res) => {
  try {
    const account = await getAgentAccount(req);

    if (!account) {
      return res.status(400).json({ message: 'Invalid or unauthorized username' });
    }

    if (!(await requirePublishLock(account.username, res))) {
      return undefined;
    }

    const studyDate = String(req.body.studyDate || currentDateString()).slice(0, 10);
    const studyUser = String(req.body.studyUser || account.displayName || account.username).trim();
    const input = normalizeStudyRecordInput(
      {
        ...req.body,
        slug: String(req.body.slug || '').trim() || req.params.slug,
        studyDate,
        studyUser,
        title: req.body.title || `${studyDate} ${studyUser} 学习记录`,
      },
      account,
    );

    if (!input.studyDate || !input.studyUser || !input.topics.length) {
      return res.status(400).json({ message: 'Study date, user and topics are required' });
    }

    const record = await StudyRecord.findOneAndUpdate(
      { slug: req.params.slug, ...getStudyOwnerQuery(account) },
      { $set: input },
      { new: true, runValidators: true },
    );

    if (!record) {
      return res.status(404).json({ message: 'Study record not found' });
    }

    notifyContentChange('更新', 'study', record, account);

    return res.json({
      ok: true,
      record,
      link: buildStudyUrl(),
    });
  } catch (error) {
    return res.status(400).json({
      message: 'Failed to update agent study record',
      detail: error.message,
    });
  }
});

app.delete('/api/agent/study-records/:slug', requireAgentAuth, async (req, res) => {
  try {
    const account = await getAgentAccount(req);

    if (!account) {
      return res.status(400).json({ message: 'Invalid or unauthorized username' });
    }

    if (!(await requirePublishLock(account.username, res))) {
      return undefined;
    }

    const record = await StudyRecord.findOneAndDelete({
      slug: req.params.slug,
      ...getStudyOwnerQuery(account),
    });

    if (!record) {
      return res.status(404).json({ message: 'Study record not found' });
    }

    notifyContentChange('删除', 'study', record, account);
    return res.json({ ok: true, deleted: record.slug });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete agent study record' });
  }
});

app.get('/api/study-records', async (req, res) => {
  try {
    const query = req.query.includeDrafts === 'true' ? {} : { published: { $ne: false } };
    const account = await getAuthAccount(req);
    const visibleQuery = account ? query : { ...query, visibility: { $ne: 'private' } };
    const records = await StudyRecord.find(visibleQuery).sort({ studyDate: -1, createAt: -1 });

    return res.json(records);
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load study records' });
  }
});

app.get('/api/posts', async (req, res) => {
  try {
    const query = req.query.includeDrafts === 'true' ? {} : { published: { $ne: false } };
    const account = await getAuthAccount(req);
    const likeKey = getLikeKey(req);
    const posts = await Post.find(query).select('+likedBy').sort({ createAt: -1 });
    const visiblePosts = account ? posts : posts.map(redactPrivatePost);

    return res.json(visiblePosts.map((post) => addViewerState(post, likeKey)));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load posts' });
  }
});

app.get('/api/posts/:slug', async (req, res) => {
  try {
    const post = await Post.findOne({
      slug: req.params.slug,
      published: { $ne: false },
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.visibility === 'private') {
      const account = await getAuthAccount(req);

      if (!account) {
        return res.status(401).json({
          message: 'Login required',
          post: redactPrivatePost(post),
        });
      }
    }

    const likeKey = getLikeKey(req);
    const updatedPost = await Post.findOneAndUpdate(
      { slug: req.params.slug, published: { $ne: false } },
      { $inc: { views: 1 } },
      { new: true },
    ).select('+likedBy');

    trackVisitAndMaybeNotify(updatedPost).catch((error) => {
      console.warn(`Failed to track visit notification: ${error.message}`);
    });

    return res.json(addViewerState(updatedPost, likeKey));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load post' });
  }
});

app.patch('/api/posts/:slug/like', async (req, res) => {
  try {
    const likeKey = getLikeKey(req);
    const post = await Post.findOneAndUpdate(
      {
        slug: req.params.slug,
        published: { $ne: false },
        likedBy: { $ne: likeKey },
      },
      {
        $inc: { likes: 1 },
        $addToSet: { likedBy: likeKey },
      },
      { new: true },
    ).select('+likedBy');

    if (post) {
      return res.json({ likes: post.likes || 0, liked: true });
    }

    const existingPost = await Post.findOne({
      slug: req.params.slug,
      published: { $ne: false },
    }).select('+likedBy');

    if (!existingPost) {
      return res.status(404).json({ message: 'Post not found' });
    }

    return res.json({ likes: existingPost.likes || 0, liked: true });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to like post' });
  }
});

app.get('/api/posts/:slug/comments', async (req, res) => {
  try {
    const likeKey = getLikeKey(req);
    const comments = await Comment.find({ postSlug: req.params.slug })
      .select('+likedBy')
      .sort({ createAt: 1 });

    return res.json(comments.map((comment) => addViewerState(comment, likeKey)));
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load comments' });
  }
});

app.post('/api/posts/:slug/comments', async (req, res) => {
  try {
    const post = await Post.findOne({
      slug: req.params.slug,
      published: { $ne: false },
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const nickname = String(req.body.nickname || '').trim();
    const content = String(req.body.content || '').trim();

    if (!nickname || !content) {
      return res.status(400).json({ message: 'Nickname and comment are required' });
    }

    let parentId = null;

    if (req.body.parentId) {
      const parent = await Comment.findOne({
        _id: req.body.parentId,
        postSlug: req.params.slug,
      });

      if (!parent) {
        return res.status(400).json({ message: 'Parent comment not found' });
      }

      parentId = parent._id;
    }

    const comment = await Comment.create({
      postSlug: req.params.slug,
      parentId,
      nickname,
      email: String(req.body.email || '').trim(),
      website: String(req.body.website || '').trim(),
      content,
    });

    return res.status(201).json(comment);
  } catch (error) {
    return res.status(400).json({ message: 'Failed to create comment' });
  }
});

app.patch('/api/comments/:id/like', async (req, res) => {
  try {
    const likeKey = getLikeKey(req);
    const comment = await Comment.findOneAndUpdate(
      {
        _id: req.params.id,
        likedBy: { $ne: likeKey },
      },
      {
        $inc: { likes: 1 },
        $addToSet: { likedBy: likeKey },
      },
      { new: true },
    ).select('+likedBy');

    if (comment) {
      return res.json({ likes: comment.likes || 0, liked: true });
    }

    const existingComment = await Comment.findOne({ _id: req.params.id }).select('+likedBy');

    if (!existingComment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    return res.json({ likes: existingComment.likes || 0, liked: true });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to like comment' });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const query = { published: { $ne: false } };
    const [articleCount, commentCount, tags, visits] = await Promise.all([
      Post.countDocuments(query),
      Comment.countDocuments(),
      Post.distinct('tags', query),
      Post.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            total: { $sum: { $ifNull: ['$views', 0] } },
          },
        },
      ]),
    ]);

    return res.json({
      articles: articleCount,
      comments: commentCount,
      tags: tags.filter(Boolean).length,
      visits: visits[0]?.total || 0,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to load stats' });
  }
});

app.post('/api/study-records', requireAuth, async (req, res) => {
  try {
    const input = normalizeStudyRecordInput(req.body, req.adminAccount);

    if (!input.studyDate || !input.studyUser || !input.topics.length) {
      return res.status(400).json({ message: 'Study date, user and topics are required' });
    }

    const record = await StudyRecord.create(input);
    notifyContentChange('创建', 'study', record, req.adminAccount);
    return res.status(201).json(record);
  } catch (error) {
    return res.status(400).json({
      message: 'Failed to create study record',
      detail: error.message,
    });
  }
});

app.put('/api/study-records/:slug', requireAuth, async (req, res) => {
  try {
    const input = normalizeStudyRecordInput(req.body, req.adminAccount);

    if (!input.studyDate || !input.studyUser || !input.topics.length) {
      return res.status(400).json({ message: 'Study date, user and topics are required' });
    }

    const record = await StudyRecord.findOneAndUpdate(
      { slug: req.params.slug, ...getStudyOwnerQuery(req.adminAccount) },
      { $set: input },
      { new: true, runValidators: true },
    );

    if (!record) {
      return res.status(404).json({ message: 'Study record not found' });
    }

    notifyContentChange('更新', 'study', record, req.adminAccount);
    return res.json(record);
  } catch (error) {
    return res.status(400).json({
      message: 'Failed to update study record',
      detail: error.message,
    });
  }
});

app.delete('/api/study-records/:slug', requireAuth, async (req, res) => {
  try {
    const record = await StudyRecord.findOneAndDelete({
      slug: req.params.slug,
      ...getStudyOwnerQuery(req.adminAccount),
    });

    if (!record) {
      return res.status(404).json({ message: 'Study record not found' });
    }

    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete study record' });
  }
});

app.post('/api/posts', requireAuth, async (req, res) => {
  try {
    const postInput = normalizePostInput(req.body);
    const now = new Date();
    const newPost = await Post.create({
      ...postInput,
      owner: req.adminAccount.username,
      authorName: req.adminAccount.displayName,
      authorAvatar: req.adminAccount.avatar,
      history: [
        {
          at: now,
          message: postInput.title,
        },
      ],
    });

    notifyContentChange('创建', 'post', newPost, req.adminAccount);
    return res.status(201).json(newPost);
  } catch (error) {
    return res.status(400).json({
      message: 'Failed to create post',
      detail: error.message,
    });
  }
});

app.put('/api/posts/:slug', requireAuth, async (req, res) => {
  try {
    const historyMessage = String(req.body.historyMessage || '').trim();
    const shouldPublish = req.body.published !== false;
    const existingPost = await Post.findOne({
      slug: req.params.slug,
      ...getOwnerQuery(req.adminAccount),
    });

    if (!existingPost) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const isAlreadyPublished = existingPost.published !== false;

    if (shouldPublish && isAlreadyPublished && !historyMessage) {
      return res.status(400).json({ message: 'Update note is required' });
    }

    const update = {
      $set: {
        ...normalizePostInput(req.body),
        owner: req.adminAccount.username,
        authorName: req.adminAccount.displayName,
        authorAvatar: req.adminAccount.avatar,
      },
    };

    if (shouldPublish) {
      const historyEntries = [];
      const hasFirstUploadHistory =
        Array.isArray(existingPost.history) &&
        existingPost.history.some((item) => {
          const sameMessage = item.message === existingPost.title;
          const sameTime =
            item.at &&
            existingPost.createAt &&
            Math.abs(new Date(item.at).getTime() - new Date(existingPost.createAt).getTime()) < 60000;

          return sameMessage && sameTime;
        });

      if (!hasFirstUploadHistory) {
        historyEntries.push({
          at: existingPost.createAt || new Date(existingPost.date || Date.now()),
          message: existingPost.title,
        });
      }

      if (isAlreadyPublished) {
        historyEntries.push({
          at: new Date(),
          message: historyMessage,
        });
      }

      if (historyEntries.length) {
        update.$push = {
          history: { $each: historyEntries },
        };
      }
    }

    const post = await Post.findOneAndUpdate(
      { slug: req.params.slug, ...getOwnerQuery(req.adminAccount) },
      update,
      { new: true, runValidators: true },
    );

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    notifyContentChange('更新', 'post', post, req.adminAccount);
    return res.json(post);
  } catch (error) {
    return res.status(400).json({
      message: 'Failed to update post',
      detail: error.message,
    });
  }
});

app.delete('/api/posts/:slug', requireAuth, async (req, res) => {
  try {
    const post = await Post.findOneAndDelete({
      slug: req.params.slug,
      ...getOwnerQuery(req.adminAccount),
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete post' });
  }
});

mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    await Promise.all(
      ADMIN_ACCOUNTS.map((account) => {
        const update = {
          $set: {
            canSeeLegacyPosts: account.canSeeLegacyPosts,
          },
          $setOnInsert: {
            username: account.username,
            passwordHash: hashPassword(account.password),
            displayName: account.displayName,
            avatar: account.avatar,
            motto: account.motto || '',
          },
        };

        if (account.syncPassword) {
          update.$set.passwordHash = hashPassword(account.password);
        }

        return User.findOneAndUpdate({ username: account.username }, update, {
          upsert: true,
          new: true,
        });
      }),
    );
    await Post.updateMany(
      {
        categorySlug: 'tech',
        $or: [{ techTopic: { $exists: false } }, { techTopic: '' }, { techTopic: null }],
      },
      { $set: { techTopic: 'Python' } },
    );
    await ensureVisitCounter();
    console.log('MongoDB connected');
  })
  .catch((error) => {
    console.error('MongoDB connection failed:', error.message);
  });

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
