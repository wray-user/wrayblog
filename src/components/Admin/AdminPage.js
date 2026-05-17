import { useEffect, useMemo, useRef, useState } from 'react';
import { MdEditor, config as mdEditorConfig } from 'md-editor-rt';
import 'md-editor-rt/lib/style.css';
import {
  createAdminPost,
  createAdminStudyRecord,
  deleteAdminPost,
  deleteAdminStudyRecord,
  fetchAdminProfile,
  fetchAdminPosts,
  fetchAdminStudyRecords,
  loginAdmin,
  updateAdminPost,
  updateAdminStudyRecord,
  updateAdminProfile,
  uploadAdminMedia,
} from '../../api/admin';
import styles from './AdminPage.module.css';
import './AdminMarkdownEditor.css';

mdEditorConfig({
  markdownItConfig: (md) => {
    if (md.core.ruler.__wrayPreserveBlankLines) {
      return;
    }

    md.core.ruler.push('wray_preserve_blank_lines', (state) => {
      const nextTokens = [];
      let previousBlockToken = null;

      state.tokens.forEach((token) => {
        if (previousBlockToken && token.level === 0 && token.map && previousBlockToken.map) {
          const blankLineCount = token.map[0] - previousBlockToken.map[1];

          if (blankLineCount > 0) {
            const blankLineToken = new state.Token('html_block', '', 0);
            blankLineToken.block = true;
            blankLineToken.map = [previousBlockToken.map[1], token.map[0]];
            blankLineToken.content = Array.from({ length: blankLineCount }, () =>
              '<div class="markdown-blank-line" aria-hidden="true"></div>',
            ).join('\n');
            nextTokens.push(blankLineToken);
          }
        }

        nextTokens.push(token);

        if (token.level === 0 && token.map) {
          previousBlockToken = token;
        }
      });

      state.tokens = nextTokens;
    });

    md.core.ruler.__wrayPreserveBlankLines = true;
  },
});

const TOKEN_KEY = 'wrayblog_admin_token';
const USER_KEY = 'wrayblog_admin_user';
const MARKDOWN_DRAFT_KEY = 'markdown_draft';
const MARKDOWN_THEME_KEY = 'mdv3_theme_store';

const MARKDOWN_PREVIEW_THEMES = [
  { value: 'default', label: 'Default' },
  { value: 'github', label: 'GitHub' },
  { value: 'cyanosis', label: 'Cyanosis' },
];

const MARKDOWN_CODE_THEMES = [
  { value: 'atom', label: 'Atom' },
  { value: 'github', label: 'GitHub' },
  { value: 'dark', label: 'Dark' },
];

const getStoredMarkdownThemes = () => {
  if (typeof window === 'undefined') {
    return { codeTheme: 'atom', previewTheme: 'github' };
  }

  const stored = window.localStorage.getItem(MARKDOWN_THEME_KEY);
  const [codeTheme, previewTheme] = String(stored || '').split('|');

  return {
    codeTheme: MARKDOWN_CODE_THEMES.some((theme) => theme.value === codeTheme) ? codeTheme : 'atom',
    previewTheme: MARKDOWN_PREVIEW_THEMES.some((theme) => theme.value === previewTheme) ? previewTheme : 'github',
  };
};

const THEME_OPTIONS = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
];

const getStoredTheme = () => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const mode = window.localStorage.getItem('themeMode');
  return mode === 'dark' || mode === 'light' ? mode : 'light';
};

const label = {
  login: '\u767b\u5f55',
  loggingIn: '\u767b\u5f55\u4e2d...',
  username: '\u7528\u6237\u540d',
  password: '\u5bc6\u7801',
  backSite: '\u8fd4\u56de\u7f51\u7ad9',
  adminTitle: '\u6587\u7ae0\u7ba1\u7406',
  allPosts: '\u5168\u90e8\u6587\u7ae0',
  published: '\u5df2\u53d1\u5e03',
  drafts: '\u8349\u7a3f',
  newPost: '\u65b0\u5efa\u6587\u7ae0',
  editPost: '\u7f16\u8f91\u6587\u7ae0',
  untitled: '\u672a\u547d\u540d\u6587\u7ae0',
  uncategorized: '\u672a\u5206\u7c7b',
  title: '\u6807\u9898',
  titlePlaceholder: '\u8f93\u5165\u6587\u7ae0\u6807\u9898',
  category: '\u5206\u7c7b',
  techTopic: '\u6280\u672f\u7ec6\u5206\u7c7b',
  techKind: '\u6280\u672f\u7c7b\u578b',
  techQuestion: '\u95ee\u9898',
  techNote: '\u7b14\u8bb0',
  noteOrder: '\u7b14\u8bb0\u6392\u5e8f',
  visibility: '\u6743\u9650',
  public: '\u516c\u5f00',
  private: '\u79c1\u5bc6',
  tags: '\u6807\u7b7e',
  historyMessage: '\u672c\u6b21\u4fee\u6539\u8bf4\u660e',
  historyMessagePlaceholder: '\u4f8b\u5982\uff1a\u8865\u5145 History \u6309\u94ae\u548c\u8bc4\u8bba\u533a\u4ea4\u4e92',
  historyCommitTitle: '\u586b\u5199\u672c\u6b21\u4fee\u6539\u8bf4\u660e',
  historyCommitHint: '\u56de\u8f66\u5373\u53ef\u786e\u8ba4\u53d1\u5e03\uff0c\u53d6\u6d88\u4f1a\u4fdd\u5b58\u4e3a\u8349\u7a3f\u3002',
  confirmPublish: '\u786e\u8ba4\u53d1\u5e03',
  cancelSaveDraft: '\u53d6\u6d88',
  coverUrl: '\u5c01\u9762\u5730\u5740',
  uploadCover: '\u4e0a\u4f20\u5c01\u9762',
  content: 'Markdown \u6b63\u6587',
  preview: '\u5b9e\u65f6\u9884\u89c8',
  saveDraft: '\u4fdd\u5b58\u8349\u7a3f',
  publish: '\u53d1\u5e03\u6587\u7ae0',
  saving: '\u5904\u7406\u4e2d...',
  delete: '\u5220\u9664',
  logout: '\u9000\u51fa',
  loading: '\u6b63\u5728\u52a0\u8f7d\u6587\u7ae0...',
  loaded: '\u5df2\u52a0\u8f7d',
  articles: '\u7bc7\u6587\u7ae0',
  loginSuccess: '\u767b\u5f55\u6210\u529f',
  loggedOut: '\u5df2\u9000\u51fa\u540e\u53f0',
  editing: '\u6b63\u5728\u7f16\u8f91\uff1a',
  creating: '\u6b63\u5728\u65b0\u5efa\u6587\u7ae0',
  titleRequired: '\u6807\u9898\u548c\u6b63\u6587\u4e0d\u80fd\u4e3a\u7a7a',
  historyRequired: '\u7f16\u8f91\u6587\u7ae0\u65f6\u9700\u8981\u586b\u5199\u672c\u6b21\u4fee\u6539\u8bf4\u660e',
  publishing: '\u6b63\u5728\u53d1\u5e03\u6587\u7ae0...',
  savingDraft: '\u6b63\u5728\u4fdd\u5b58\u8349\u7a3f...',
  publishedDone: '\u6587\u7ae0\u5df2\u53d1\u5e03',
  draftDone: '\u8349\u7a3f\u5df2\u4fdd\u5b58',
  confirmDeletePrefix: '\u786e\u5b9a\u5220\u9664\u300a',
  confirmDeleteSuffix: '\u300b\u5417\uff1f',
  deleting: '\u6b63\u5728\u5220\u9664\u6587\u7ae0...',
  deleted: '\u6587\u7ae0\u5df2\u5220\u9664',
  uploadCovering: '\u6b63\u5728\u4e0a\u4f20\u5c01\u9762...',
  uploadCoverDone: '\u5c01\u9762\u4e0a\u4f20\u6210\u529f',
  uploadMedia: '\u4e0a\u4f20\u5a92\u4f53',
  uploadMediaDone: '\u5a92\u4f53\u4e0a\u4f20\u6210\u529f',
  draftSavedAt: '\u8349\u7a3f\u5df2\u4fdd\u5b58',
  draftAutoSavedAt: '\u8349\u7a3f\u5df2\u81ea\u52a8\u4fdd\u5b58',
  fullscreenEdit: '\u5168\u5c4f\u7f16\u8f91',
  exitFullscreen: '\u9000\u51fa\u5168\u5c4f',
  empty: '\u8fd9\u91cc\u6682\u65f6\u6ca1\u6709\u7b26\u5408\u6761\u4ef6\u7684\u6587\u7ae0\u3002',
  themeMode: '\u5207\u6362\u9875\u9762\u6a21\u5f0f',
  accountManage: '\u8d26\u6237\u7ba1\u7406',
  accountSettings: '\u8d26\u6237\u8bbe\u7f6e',
  accountInfo: '\u8d26\u6237\u4fe1\u606f',
  displayName: '\u6635\u79f0',
  avatar: '\u5934\u50cf',
  motto: '\u7b7e\u540d',
  currentPassword: '\u5f53\u524d\u5bc6\u7801',
  newPassword: '\u65b0\u5bc6\u7801',
  confirmPassword: '\u786e\u8ba4\u65b0\u5bc6\u7801',
  saveAccount: '\u4fdd\u5b58',
  cancel: '\u53d6\u6d88',
  accountSaved: '\u8d26\u6237\u4fe1\u606f\u5df2\u4fdd\u5b58',
  studyDate: '\u5b66\u4e60\u65e5\u671f',
  studyUser: '\u5b66\u4e60\u4eba',
  studyTopics: '\u4eca\u65e5\u5b66\u4e60\u660e\u7ec6',
  studyTopicName: '\u5b66\u4e60\u5185\u5bb9',
  studyTopicCategory: '\u5206\u7c7b',
  studyTopicMinutes: '\u65f6\u957f\uff08\u5206\u949f\uff09',
  studyTopicNote: '\u5907\u6ce8',
  addStudyTopic: '\u6dfb\u52a0\u4e00\u4e2a\u5b66\u4e60\u4e3b\u9898',
  removeStudyTopic: '\u5220\u9664',
  studySummary: '\u4eca\u65e5\u5b66\u4e60\u5185\u5bb9',
  studyContent: '\u4eca\u65e5\u5b66\u4e60\u5185\u5bb9',
  studyPreview: '\u524d\u53f0\u5361\u7247\u9884\u89c8',
  studyImages: '\u56fe\u7247 / \u89c6\u9891',
  publishRecord: '\u53d1\u5e03\u8bb0\u5f55',
  recordSaved: '\u5b66\u4e60\u8bb0\u5f55\u5df2\u4fdd\u5b58',
  recordPublished: '\u5b66\u4e60\u8bb0\u5f55\u5df2\u53d1\u5e03',
  studyRequired: '\u5b66\u4e60\u65e5\u671f\u3001\u5b66\u4e60\u4eba\u548c\u81f3\u5c11\u4e00\u4e2a\u5b66\u4e60\u4e3b\u9898\u4e0d\u80fd\u4e3a\u7a7a',
};

const CATEGORY_OPTIONS = [
  { name: '\u5b66\u4e60\u8bb0\u5f55', slug: 'study' },
  { name: '\u6280\u672f\u5206\u4eab', slug: 'tech' },
  { name: '\u5fc3\u60c5\u968f\u7b14', slug: 'essay' },
];

const TECH_TOPIC_OPTIONS = [
  'Python',
  '\u0043\u8bed\u8a00',
  'C++',
  'Ai Agent',
  'Linux',
  'Powershell',
  'MySQL',
  'JavaScript',
  'HTML',
  'CSS',
  'Java',
  'Git',
  '\u722c\u866b',
  'NodeJs',
  'React',
  '\u6570\u636e\u7ed3\u6784',
  '\u6df1\u5ea6\u5b66\u4e60',
  '\u6cb9\u7334\u811a\u672c',
  'Catia',
  'Latex',
  'Selenium',
];

const currentMinute = () => {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(
    now.getHours(),
  )}:${pad(now.getMinutes())}`;
};

const currentDate = () => currentMinute().slice(0, 10);

const makeFallbackSlug = () => {
  const stamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 12);
  return `post-${stamp}`;
};

const slugify = (value) => {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || makeFallbackSlug();
};

const estimateReadTime = (content) => {
  const textContent = String(content || '').replace(/[#>*_`[\]()!-]/g, '');
  const minutes = Math.max(1, Math.ceil(textContent.trim().length / 500));
  return `${minutes} min`;
};

const contentToMarkdown = (content) => (Array.isArray(content) ? content.join('\n\n') : String(content || ''));

const normalizeTechKind = (value) =>
  String(value || '').trim().toLowerCase() === 'note' || String(value || '').trim() === '\u7b14\u8bb0'
    ? 'note'
    : 'question';

const createEmptyForm = () => ({
  title: '',
  slug: makeFallbackSlug(),
  category: CATEGORY_OPTIONS[1].name,
  categorySlug: CATEGORY_OPTIONS[1].slug,
  techTopic: TECH_TOPIC_OPTIONS[0],
  techKind: 'question',
  noteOrder: 0,
  tagsText: '',
  content: '',
  date: currentMinute(),
  readTime: '1 min',
  image: '/img/sky.jpg',
  videos: [],
  studyDate: currentDate(),
  studyUser: '',
  studyTopics: [{ name: '', minutes: 30, category: '', note: '' }],
  studySummary: '',
  studyMedia: [],
  published: true,
  visibility: 'public',
  views: 0,
});

const postToForm = (post) => ({
  title: post.title || '',
  slug: post.slug || makeFallbackSlug(),
  category: post.category || CATEGORY_OPTIONS[1].name,
  categorySlug: post.categorySlug || CATEGORY_OPTIONS[1].slug,
  techTopic: post.techTopic || post.subcategory || TECH_TOPIC_OPTIONS[0],
  techKind: normalizeTechKind(post.techKind || post.techType || post.articleType),
  noteOrder: Number(post.noteOrder) || 0,
  tagsText: Array.isArray(post.tags) ? post.tags.join(', ') : '',
  content: contentToMarkdown(post.content),
  date: post.date || currentMinute(),
  readTime: post.readTime || '3 min',
  image: post.image || '/img/sky.jpg',
  videos: Array.isArray(post.videos) ? post.videos : [],
  studyDate: post.studyDate || currentDate(),
  studyUser: post.studyUser || post.authorName || '',
  studyTopics: Array.isArray(post.topics) && post.topics.length
    ? post.topics.map((topic) => ({
        name: topic.name || '',
        minutes: Number(topic.minutes) || 0,
        category: topic.category || '',
        note: topic.note || '',
      }))
    : [{ name: '', minutes: 30, category: '', note: '' }],
  studySummary: post.summary || '',
  studyMedia: Array.isArray(post.media) ? post.media : [],
  published: post.published !== false,
  visibility: post.visibility === 'private' ? 'private' : 'public',
  views: Number(post.views) || 0,
});

const formToPayload = (form) => ({
  title: form.title.trim(),
  slug: form.slug.trim() || slugify(form.title),
  category: form.category.trim() || label.uncategorized,
  categorySlug: form.categorySlug.trim() || 'uncategorized',
  techTopic: form.categorySlug === 'tech' ? form.techTopic || TECH_TOPIC_OPTIONS[0] : '',
  techKind: form.categorySlug === 'tech' ? normalizeTechKind(form.techKind) : 'question',
  noteOrder: form.categorySlug === 'tech' && normalizeTechKind(form.techKind) === 'note' ? Number(form.noteOrder) || 0 : 0,
  tags: form.tagsText
    .split(/[,?\s]+/)
    .map((tag) => tag.trim())
    .filter(Boolean),
  content: form.content,
  date: form.date || currentMinute(),
  readTime: estimateReadTime(form.content),
  image: form.image.trim() || '/img/sky.jpg',
  videos: form.videos,
  views: Number(form.views) || 0,
  published: form.published,
  visibility: form.visibility === 'private' ? 'private' : 'public',
});

const getStudyDuration = (topics) =>
  topics.reduce((sum, topic) => sum + Math.max(0, Number(topic.minutes) || 0), 0);

const formatStudyDuration = (minutes) => {
  const total = Math.max(0, Number(minutes) || 0);
  const hours = Math.floor(total / 60);
  const rest = total % 60;

  if (hours && rest) {
    return `${hours}小时${rest}分钟`;
  }

  if (hours) {
    return `${hours}小时`;
  }

  return `${rest}分钟`;
};

const formToStudyPayload = (form, currentUser) => {
  const studyDate = form.studyDate || currentDate();
  const studyUser = form.studyUser.trim() || currentUser?.displayName || currentUser?.username || 'Wray';
  const cleanTopics = form.studyTopics
    .map((topic) => ({
      name: topic.name.trim(),
      minutes: Math.max(0, Number(topic.minutes) || 0),
      category: topic.category.trim(),
      note: topic.note.trim(),
    }))
    .filter((topic) => topic.name);
  const title = `${studyDate} ${studyUser} 的学习记录`;

  return {
    slug: form.slug.trim() || slugify(`${studyDate}-${studyUser}-${Date.now()}`),
    title,
    studyDate,
    studyUser,
    topics: cleanTopics,
    durationMinutes: getStudyDuration(cleanTopics),
    summary: '',
    content: form.content,
    tags: [],
    media: form.studyMedia,
    published: form.published,
    visibility: form.visibility === 'private' ? 'private' : 'public',
  };
};

const ThemeIcon = ({ mode }) => {
  if (mode === 'dark') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20.2 14.4A7.5 7.5 0 0 1 9.6 3.8 8.6 8.6 0 1 0 20.2 14.4Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
};

const EyeIcon = ({ hidden = false }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M2.5 12s3.3-6 9.5-6 9.5 6 9.5 6-3.3 6-9.5 6-9.5-6-9.5-6Z" />
    <circle cx="12" cy="12" r="3" />
    {hidden && <path className={styles.eyeSlash} d="M4 4l16 16" />}
  </svg>
);

const AdminPage = () => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || '');
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
    } catch (error) {
      return null;
    }
  });
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [posts, setPosts] = useState([]);
  const [studyRecords, setStudyRecords] = useState([]);
  const [form, setForm] = useState(createEmptyForm);
  const [editingSlug, setEditingSlug] = useState('');
  const [editingKind, setEditingKind] = useState('post');
  const [status, setStatus] = useState('');
  const [listFilter, setListFilter] = useState('all');
  const [postSearch, setPostSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [historyMessage, setHistoryMessage] = useState('');
  const [markdownDraftStatus, setMarkdownDraftStatus] = useState('');
  const [markdownEditorKey, setMarkdownEditorKey] = useState(0);
  const [markdownPreviewTheme] = useState(() => getStoredMarkdownThemes().previewTheme);
  const [markdownCodeTheme] = useState(() => getStoredMarkdownThemes().codeTheme);
  const [themeMode, setThemeMode] = useState(getStoredTheme);
  const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    username: '',
    displayName: '',
    avatar: '/icon/Mammon.png',
    motto: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [visiblePasswords, setVisiblePasswords] = useState({});
  const imageInputRef = useRef(null);
  const studyMediaInputRef = useRef(null);
  const accountAvatarInputRef = useRef(null);
  const markdownEditorRef = useRef(null);
  const markdownEditorEventRef = useRef(null);
  const markdownBrowserFullscreenRef = useRef(false);
  const markdownContentRef = useRef('');
  const markdownDirtyRef = useRef(false);

  const sortedPosts = useMemo(
    () =>
      [
        ...posts.map((post) => ({ ...post, itemKind: 'post' })),
        ...studyRecords.map((record) => ({
          ...record,
          itemKind: 'study',
          category: '\u5b66\u4e60\u8bb0\u5f55',
          categorySlug: 'study',
          date: record.studyDate,
        })),
      ].sort(
        (a, b) =>
          new Date(b.studyDate || b.createAt || b.date || 0).getTime() -
          new Date(a.studyDate || a.createAt || a.date || 0).getTime(),
      ),
    [posts, studyRecords],
  );

  const adminStats = useMemo(() => {
    const allItems = [...posts, ...studyRecords];
    const publishedPosts = allItems.filter((post) => post.published !== false);
    const draftPosts = allItems.filter((post) => post.published === false);
    return { all: allItems.length, published: publishedPosts.length, drafts: draftPosts.length };
  }, [posts, studyRecords]);

  const filteredPosts = useMemo(() => {
    const normalizedSearch = postSearch.trim().toLowerCase();
    const statusMatchedPosts =
      listFilter === 'published'
        ? sortedPosts.filter((post) => post.published !== false)
        : listFilter === 'drafts'
          ? sortedPosts.filter((post) => post.published === false)
          : sortedPosts;

    if (!normalizedSearch) {
      return statusMatchedPosts;
    }

    return statusMatchedPosts.filter((post) =>
      [
        post.title,
        post.category,
        post.categorySlug,
        post.techTopic,
        normalizeTechKind(post.techKind) === 'note' ? label.techNote : label.techQuestion,
        post.studyUser,
        post.content,
        ...(Array.isArray(post.tags) ? post.tags : []),
        ...(Array.isArray(post.topics) ? post.topics.map((topic) => `${topic.name} ${topic.category}`) : []),
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [listFilter, postSearch, sortedPosts]);

  const statusFilteredCount = useMemo(() => {
    if (listFilter === 'published') {
      return sortedPosts.filter((post) => post.published !== false).length;
    }

    if (listFilter === 'drafts') {
      return sortedPosts.filter((post) => post.published === false).length;
    }

    return sortedPosts.length;
  }, [listFilter, sortedPosts]);

  const listTitle = useMemo(() => {
    if (listFilter === 'published') {
      return `${label.published}${label.articles}\uff1a${filteredPosts.length}`;
    }

    if (listFilter === 'drafts') {
      return `${label.drafts}\uff1a${filteredPosts.length}`;
    }

    return `${label.allPosts}\uff1a${filteredPosts.length}`;
  }, [filteredPosts.length, listFilter]);

  const loadPosts = async (nextToken = token, options = {}) => {
    if (!nextToken) {
      return;
    }

    setIsLoading(true);
    if (!options.silent) {
      setStatus(label.loading);
    }

    try {
      const [items, records] = await Promise.all([
        fetchAdminPosts(nextToken),
        fetchAdminStudyRecords(nextToken),
      ]);
      setPosts(items);
      setStudyRecords(records);
      if (!options.silent) {
        setStatus(`${label.loaded} ${items.length + records.length} ${label.articles}`);
      }
    } catch (error) {
      setStatus(error.message);
      if (error.message === 'Unauthorized') {
        handleLogout();
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    root.setAttribute('data-theme', themeMode);

    window.localStorage.setItem('themeMode', themeMode);
  }, [themeMode]);

  useEffect(() => {
    window.localStorage.setItem(MARKDOWN_THEME_KEY, `${markdownCodeTheme}|${markdownPreviewTheme}`);
  }, [markdownCodeTheme, markdownPreviewTheme]);

  useEffect(() => {
    const draft = window.localStorage.getItem(MARKDOWN_DRAFT_KEY);

    if (draft) {
      setForm((current) => (current.content ? current : { ...current, content: draft }));
    }
  }, []);

  useEffect(() => {
    markdownContentRef.current = form.content;
  }, [form.content]);

  const unlockPageAfterFullscreen = () => {
    window.requestAnimationFrame(() => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.pointerEvents = '';
      document.documentElement.style.pointerEvents = '';
    });
  };

  useEffect(() => {
    const closeMarkdownFullscreen = () => {
      markdownEditorRef.current?.togglePageFullscreen?.(false);
      unlockPageAfterFullscreen();

      if (document.fullscreenElement || markdownBrowserFullscreenRef.current) {
        document.exitFullscreen?.().catch(() => {});
        markdownBrowserFullscreenRef.current = false;
        setMarkdownEditorKey((current) => current + 1);
        unlockPageAfterFullscreen();
      }
    };

    const handleKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        event.stopPropagation();
        saveMarkdownDraft(false);
        return;
      }

      if (event.key === 'Escape') {
        closeMarkdownFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  useEffect(() => {
    const editor = markdownEditorRef.current;

    if (!editor?.on || markdownEditorEventRef.current === editor) {
      return;
    }

    markdownEditorEventRef.current = editor;
    editor.on('fullscreen', (statusValue) => {
      markdownBrowserFullscreenRef.current = Boolean(statusValue);
    });
  });

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (document.fullscreenElement) {
        if (document.querySelector('.wray-md-editor.md-editor-fullscreen')) {
          markdownBrowserFullscreenRef.current = true;
        }

        return;
      }

      window.setTimeout(() => {
        if (markdownBrowserFullscreenRef.current) {
          markdownBrowserFullscreenRef.current = false;
          setMarkdownEditorKey((current) => current + 1);
          unlockPageAfterFullscreen();
        }
      }, 50);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!markdownDirtyRef.current) {
        return;
      }

      saveMarkdownDraft(true);
    }, 240000);

    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateMarkdownContent = (value) => {
    markdownDirtyRef.current = true;
    updateField('content', value);
  };

  const saveMarkdownDraft = (isAuto = false) => {
    const now = new Date();
    const time = now.toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    window.localStorage.setItem(MARKDOWN_DRAFT_KEY, markdownContentRef.current || '');
    markdownDirtyRef.current = false;
    setMarkdownDraftStatus(`${isAuto ? label.draftAutoSavedAt : label.draftSavedAt} ${time}`);
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setStatus(label.loggingIn);

    try {
      const data = await loginAdmin(loginForm.username, loginForm.password);
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setToken(data.token);
      setCurrentUser(data.user);
      setStatus(label.loginSuccess);
      await loadPosts(data.token);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken('');
    setCurrentUser(null);
    setPosts([]);
    setStudyRecords([]);
    setEditingSlug('');
    setEditingKind('post');
    setForm(createEmptyForm());
    setStatus(label.loggedOut);
  };

  const openAccountSettings = async () => {
    setIsAccountSettingsOpen(true);
    setStatus('');

    try {
      const profile = await fetchAdminProfile(token);
      setProfileForm({
        username: profile.username || currentUser?.username || '',
        displayName: profile.displayName || currentUser?.displayName || '',
        avatar: profile.avatar || currentUser?.avatar || '/icon/Mammon.png',
        motto: profile.motto || currentUser?.motto || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      setStatus(error.message);
    }
  };

  const updateProfileField = (field, value) => {
    setProfileForm((current) => ({ ...current, [field]: value }));
  };

  const togglePasswordVisibility = (field) => {
    setVisiblePasswords((current) => ({ ...current, [field]: !current[field] }));
  };

  const renderPasswordInput = (field, autoComplete) => (
    <span className={styles.passwordField}>
      <input
        type={visiblePasswords[field] ? 'text' : 'password'}
        value={profileForm[field]}
        onChange={(event) => updateProfileField(field, event.target.value)}
        autoComplete={autoComplete}
      />
      <button
        type="button"
        className={styles.eyeButton}
        onClick={() => togglePasswordVisibility(field)}
        aria-label={visiblePasswords[field] ? 'Hide password' : 'Show password'}
      >
        <EyeIcon hidden={!visiblePasswords[field]} />
      </button>
    </span>
  );

  const handleAccountAvatarUpload = async (file) => {
    if (!file) {
      return;
    }

    setIsUploading(true);
    setStatus(label.uploadCovering);

    try {
      const media = await uploadAdminMedia(token, file);
      updateProfileField('avatar', media.url);
      setStatus(label.uploadCoverDone);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const saveAccountSettings = async (event) => {
    event.preventDefault();
    setIsSaving(true);

    try {
      const profile = await updateAdminProfile(token, profileForm);
      const nextUser = {
        ...(currentUser || {}),
        ...profile,
      };
      localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
      setCurrentUser(nextUser);
      setProfileForm((current) => ({
        ...current,
        ...profile,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
      setIsAccountSettingsOpen(false);
      setStatus(label.accountSaved);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNewPost = () => {
    setEditingSlug('');
    setEditingKind('post');
    setForm(createEmptyForm());
    setHistoryMessage('');
    setIsHistoryDialogOpen(false);
    setStatus(label.creating);
  };

  const handleEditPost = (post) => {
    setEditingSlug(post.slug);
    setEditingKind(post.itemKind === 'study' ? 'study' : 'post');
    setForm(postToForm(post));
    setHistoryMessage('');
    setIsHistoryDialogOpen(false);
    setStatus(label.editing + post.title);
  };

  const handleTitleChange = (value) => {
    setForm((current) => ({ ...current, title: value, slug: editingSlug ? current.slug : slugify(value) }));
  };

  const handleCategoryChange = (slug) => {
    const category = CATEGORY_OPTIONS.find((item) => item.slug === slug);
    if (!category) {
      updateField('categorySlug', slug);
      return;
    }

    setForm((current) => ({
      ...current,
      category: category.name,
      categorySlug: category.slug,
      techTopic: category.slug === 'tech' ? current.techTopic || TECH_TOPIC_OPTIONS[0] : '',
      techKind: category.slug === 'tech' ? current.techKind || 'question' : 'question',
      noteOrder: category.slug === 'tech' ? Number(current.noteOrder) || 0 : 0,
      studyUser:
        category.slug === 'study'
          ? current.studyUser || currentUser?.displayName || currentUser?.username || 'Wray'
          : current.studyUser,
    }));
  };

  const handleUploadCover = async (file) => {
    if (!file) {
      return;
    }

    setIsUploading(true);
    setStatus(label.uploadCovering);

    try {
      const media = await uploadAdminMedia(token, file);
      updateField('image', media.url);
      setStatus(label.uploadCoverDone);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const updateStudyTopic = (index, field, value) => {
    setForm((current) => ({
      ...current,
      studyTopics: current.studyTopics.map((topic, topicIndex) =>
        topicIndex === index ? { ...topic, [field]: value } : topic,
      ),
    }));
  };

  const addStudyTopic = () => {
    setForm((current) => ({
      ...current,
      studyTopics: [...current.studyTopics, { name: '', minutes: 30, category: '', note: '' }],
    }));
  };

  const removeStudyTopic = (index) => {
    setForm((current) => ({
      ...current,
      studyTopics:
        current.studyTopics.length > 1
          ? current.studyTopics.filter((_, topicIndex) => topicIndex !== index)
          : current.studyTopics,
    }));
  };

  const handleUploadStudyMedia = async (files) => {
    const fileList = Array.from(files || []);

    if (!fileList.length) {
      return;
    }

    setIsUploading(true);
    setStatus(label.uploadMedia);

    try {
      const uploaded = [];

      for (const file of fileList) {
        // Uploads are intentionally sequential to keep server pressure low.
        // eslint-disable-next-line no-await-in-loop
        const media = await uploadAdminMedia(token, file);
        uploaded.push({
          type: media.type === 'video' ? 'video' : 'image',
          url: media.url,
          name: media.name || file.name,
        });
      }

      setForm((current) => ({
        ...current,
        studyMedia: [...current.studyMedia, ...uploaded],
      }));
      setStatus(label.uploadMediaDone);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const removeStudyMedia = (url) => {
    setForm((current) => ({
      ...current,
      studyMedia: current.studyMedia.filter((item) => item.url !== url),
    }));
  };

  const savePost = async (shouldPublish, nextHistoryMessage = '') => {
    if (form.categorySlug === 'study') {
      const payload = {
        ...formToStudyPayload({ ...form, published: shouldPublish }, currentUser),
        published: shouldPublish,
      };

      if (!payload.studyDate || !payload.studyUser || !payload.topics.length) {
        setStatus(label.studyRequired);
        return false;
      }

      setIsSaving(true);
      setStatus(shouldPublish ? label.publishing : label.savingDraft);

      try {
        if (editingSlug && editingKind === 'study') {
          await updateAdminStudyRecord(token, editingSlug, payload);
        } else {
          await createAdminStudyRecord(token, payload);
          setEditingSlug(payload.slug);
          setEditingKind('study');
        }

        setForm((current) => ({
          ...current,
          ...payload,
          title: payload.title,
          studyTopics: payload.topics,
          studySummary: payload.summary,
          studyMedia: payload.media,
          tagsText: current.tagsText,
        }));
        await loadPosts(token, { silent: true });
        setStatus(shouldPublish ? label.recordPublished : label.recordSaved);
        return true;
      } catch (error) {
        setStatus(error.message);
        return false;
      } finally {
        setIsSaving(false);
      }
    }

    if (!form.title.trim() || !form.content.trim()) {
      setStatus(label.titleRequired);
      return false;
    }

    const shouldAskHistory = editingSlug && editingKind === 'post' && form.published !== false;

    if (shouldAskHistory && shouldPublish && !nextHistoryMessage.trim()) {
      setStatus(label.historyRequired);
      return false;
    }

    setIsSaving(true);
    setStatus(shouldPublish ? label.publishing : label.savingDraft);

    try {
      const payload = {
        ...formToPayload(form),
        slug: editingSlug || slugify(form.title),
        date: editingSlug ? form.date || currentMinute() : currentMinute(),
        readTime: estimateReadTime(form.content),
        views: editingSlug ? Number(form.views) || 0 : 0,
        published: shouldPublish,
        ...(shouldAskHistory && shouldPublish ? { historyMessage: nextHistoryMessage.trim() } : {}),
      };

      if (editingSlug) {
        await updateAdminPost(token, editingSlug, payload);
      } else {
        await createAdminPost(token, payload);
        setEditingSlug(payload.slug);
      }

      setForm((current) => ({ ...current, ...payload, tagsText: current.tagsText }));
      setHistoryMessage('');
      await loadPosts(token, { silent: true });
      setStatus(shouldPublish ? label.publishedDone : label.draftDone);
      return true;
    } catch (error) {
      setStatus(error.message);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    savePost(false);
  };

  const handlePublishClick = () => {
    if (editingSlug && editingKind === 'post' && form.categorySlug !== 'study' && form.published !== false) {
      setHistoryMessage('');
      setIsHistoryDialogOpen(true);
      return;
    }

    savePost(true);
  };

  const confirmHistoryPublish = async (event) => {
    event.preventDefault();
    const success = await savePost(true, historyMessage);
    if (success) {
      setIsHistoryDialogOpen(false);
    }
  };

  const cancelHistoryPublish = async () => {
    setIsHistoryDialogOpen(false);
    setHistoryMessage('');
    await savePost(false);
  };

  const handleDelete = async (post) => {
    const confirmed = window.confirm(label.confirmDeletePrefix + post.title + label.confirmDeleteSuffix);

    if (!confirmed) {
      return;
    }

    setStatus(label.deleting);

    try {
      if (post.itemKind === 'study') {
        await deleteAdminStudyRecord(token, post.slug);
      } else {
        await deleteAdminPost(token, post.slug);
      }
      if (editingSlug === post.slug) {
        handleNewPost();
      }
      await loadPosts(token, { silent: true });
      setStatus(label.deleted);
    } catch (error) {
      setStatus(error.message);
    }
  };

  if (!token) {
    return (
      <main className={styles.loginPage}>
        <form className={styles.loginCard} onSubmit={handleLogin}>
          <h1 className={styles.loginLogo}>Wray</h1>
          <label>
            {label.username}
            <input
              value={loginForm.username}
              placeholder="username"
              autoComplete="username"
              onChange={(event) => setLoginForm((current) => ({ ...current, username: event.target.value }))}
            />
          </label>
          <label>
            {label.password}
            <input
              type="password"
              value={loginForm.password}
              placeholder="password"
              autoComplete="current-password"
              onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
            />
          </label>
          <button type="submit" disabled={isLoading}>
            {isLoading ? label.loggingIn : label.login}
          </button>
          <a href="#/" className={styles.loginBackLink}>
            &larr; {label.backSite}
          </a>
          {status && <p className={styles.status}>{status}</p>}
        </form>
      </main>
    );
  }

  const isStudyForm = form.categorySlug === 'study';
  const studyDuration = getStudyDuration(form.studyTopics);
  const renderMarkdownEditor = () => (
    <section className={`${styles.markdownArea} wray-md-editor-area`}>
      <MdEditor
        key={markdownEditorKey}
        ref={markdownEditorRef}
        id="admin-post-editor"
        value={form.content || ''}
        onChange={(value) => updateMarkdownContent(value)}
        language="zh-CN"
        theme={themeMode === 'dark' ? 'dark' : 'light'}
        previewTheme={markdownPreviewTheme}
        codeTheme={markdownCodeTheme}
        className="wray-md-editor"
        style={{ height: '660px' }}
        placeholder="请输入文章内容，支持 Markdown..."
        onSave={() => saveMarkdownDraft(false)}
        onUploadImg={async (files, callback) => {
          setIsUploading(true);
          setStatus(label.uploadMedia);

          try {
            const urls = await Promise.all(
              Array.from(files || []).map(async (file) => {
                const media = await uploadAdminMedia(token, file);
                return media.url;
              }),
            );

            callback(urls);
            setStatus(label.uploadMediaDone);
          } catch (error) {
            setStatus(error.message);
          } finally {
            setIsUploading(false);
          }
        }}
      />
      {markdownDraftStatus && <p className={styles.draftStatus}>{markdownDraftStatus}</p>}
    </section>
  );

  return (
    <main className={styles.adminPage}>
      <header className={styles.adminHeader}>
        <div>
          <a href="#/" className={styles.backHomeLink} aria-label={label.backSite}>
            <span>&larr;</span>
            <strong>{label.backSite}</strong>
          </a>
          <p className={styles.kicker}>Wray Blog Admin</p>
          <h1>{label.adminTitle}</h1>
        </div>
        <section className={styles.summaryPanel} aria-label={label.adminTitle}>
          <div className={styles.summaryCards}>
            <button
              type="button"
              className={listFilter === 'all' ? styles.summaryCardActive : styles.summaryCard}
              onClick={() => setListFilter('all')}
            >
              <strong>{adminStats.all}</strong>
              <span>{label.allPosts}</span>
            </button>
            <button
              type="button"
              className={listFilter === 'published' ? styles.summaryCardActive : styles.summaryCard}
              onClick={() => setListFilter('published')}
            >
              <strong>{adminStats.published}</strong>
              <span>{label.published}</span>
            </button>
            <button
              type="button"
              className={listFilter === 'drafts' ? styles.summaryCardActive : styles.summaryCard}
              onClick={() => setListFilter('drafts')}
            >
              <strong>{adminStats.drafts}</strong>
              <span>{label.drafts}</span>
            </button>
          </div>
        </section>
        <div className={styles.headerActions}>
          <div className={styles.themePicker}>
            <button type="button" className={styles.iconButton} aria-label={label.themeMode}>
              <ThemeIcon mode={themeMode} />
            </button>
            <div className={styles.themeMenu} role="menu" aria-label={label.themeMode}>
              {THEME_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={styles.themeOption}
                  role="menuitemradio"
                  aria-checked={themeMode === option.value}
                  onClick={() => setThemeMode(option.value)}
                >
                  <ThemeIcon mode={option.value} />
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className={styles.accountMenu}>
            <button type="button" className={styles.accountButton} aria-label={label.username}>
              <img src={currentUser?.avatar || '/icon/Mammon.png'} alt="" />
              <span>{currentUser?.displayName || currentUser?.username || 'Wray'}</span>
            </button>
            <div className={styles.accountDropdown}>
              <strong>{currentUser?.displayName || currentUser?.username || 'Wray'}</strong>
              <button type="button" onClick={openAccountSettings}>{label.accountManage}</button>
              <button type="button" onClick={handleLogout}>{label.logout}</button>
            </div>
          </div>
        </div>
      </header>

      {status && <div className={styles.notice}>{status}</div>}

      <section className={styles.adminLayout}>
        <aside className={styles.postPanel}>
          <button type="button" className={styles.primaryButton} onClick={handleNewPost}>
            {label.newPost}
          </button>
          <label className={styles.publishedSearch}>
            搜索
            <input
              value={postSearch}
              onChange={(event) => setPostSearch(event.target.value)}
              placeholder={`在 ${statusFilteredCount} 篇内容中搜索`}
            />
          </label>
          <p className={styles.listMeta}>{listTitle}</p>
          <div className={styles.postList}>
            {filteredPosts.map((post) => (
              <article
                key={post._id || post.slug}
                className={editingSlug === post.slug ? styles.postItemActive : styles.postItem}
              >
                <button type="button" onClick={() => handleEditPost(post)}>
                  <strong>{post.title}</strong>
                  <span>{post.category || label.uncategorized}</span>
                  <small>{post.published === false ? label.drafts : post.date}</small>
                </button>
                <button type="button" className={styles.deleteButton} onClick={() => handleDelete(post)}>
                  {label.delete}
                </button>
              </article>
            ))}
            {filteredPosts.length === 0 && <p className={styles.emptyList}>{label.empty}</p>}
          </div>
        </aside>

        <form className={styles.editorPanel} onSubmit={handleSubmit}>
          <div className={styles.editorHeader}>
            <div>
              <p className={styles.kicker}>{editingSlug ? label.editPost : label.newPost}</p>
              <h2>
                {isStudyForm
                  ? `${form.studyDate || currentDate()} ${form.studyUser || currentUser?.displayName || currentUser?.username || 'Wray'} 的学习记录`
                  : form.title || label.untitled}
              </h2>
            </div>
            <div className={styles.editorActions}>
              <button type="submit" disabled={isSaving || isUploading}>
                {isSaving ? label.saving : label.saveDraft}
              </button>
              <button
                type="button"
                className={styles.publishButton}
                onClick={handlePublishClick}
                disabled={isSaving || isUploading}
              >
                {isSaving ? label.saving : isStudyForm ? label.publishRecord : label.publish}
              </button>
            </div>
          </div>

          <div className={styles.formGrid}>
            {!isStudyForm && (
              <label>
                {label.title}
                <input
                  value={form.title}
                  onChange={(event) => handleTitleChange(event.target.value)}
                  placeholder={label.titlePlaceholder}
                />
              </label>
            )}
            <label>
              {label.category}
              <select value={form.categorySlug} onChange={(event) => handleCategoryChange(event.target.value)}>
                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category.slug} value={category.slug}>{category.name}</option>
                ))}
              </select>
            </label>
            {form.categorySlug === 'tech' && (
              <label>
                {label.techTopic}
                <select value={form.techTopic || TECH_TOPIC_OPTIONS[0]} onChange={(event) => updateField('techTopic', event.target.value)}>
                  {TECH_TOPIC_OPTIONS.map((topic) => (
                    <option key={topic} value={topic}>{topic}</option>
                  ))}
                </select>
              </label>
            )}
            {form.categorySlug === 'tech' && (
              <label>
                {label.techKind}
                <select value={form.techKind || 'question'} onChange={(event) => updateField('techKind', event.target.value)}>
                  <option value="question">{label.techQuestion}</option>
                  <option value="note">{label.techNote}</option>
                </select>
              </label>
            )}
            {form.categorySlug === 'tech' && form.techKind === 'note' && (
              <label>
                {label.noteOrder}
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.noteOrder}
                  onChange={(event) => updateField('noteOrder', event.target.value)}
                  placeholder="0"
                />
              </label>
            )}
            <label>
              {label.visibility}
              <select value={form.visibility} onChange={(event) => updateField('visibility', event.target.value)}>
                <option value="public">{label.public}</option>
                <option value="private">{label.private}</option>
              </select>
            </label>
            {!isStudyForm && (
              <label>
                {label.tags}
                <input value={form.tagsText} onChange={(event) => updateField('tagsText', event.target.value)} placeholder="React, MongoDB" />
              </label>
            )}
          </div>

          {isStudyForm ? (
            <section className={styles.studyEditor}>
              <div className={styles.studyFields}>
                <div className={styles.formGrid}>
                  <label>
                    {label.studyDate}
                    <input
                      type="date"
                      value={form.studyDate}
                      onChange={(event) => updateField('studyDate', event.target.value)}
                    />
                  </label>
                  <label>
                    {label.studyUser}
                    <input
                      value={form.studyUser}
                      onChange={(event) => updateField('studyUser', event.target.value)}
                      placeholder={currentUser?.displayName || currentUser?.username || 'Wray'}
                    />
                  </label>
                </div>

                <section className={styles.studyTopicPanel}>
                  <div className={styles.studyTopicHeader}>
                    <strong>{label.studyTopics}</strong>
                    <span>总计 {formatStudyDuration(studyDuration)}</span>
                  </div>
                  {form.studyTopics.map((topic, index) => (
                    <div key={index} className={styles.studyTopicRow}>
                      <input
                        value={topic.name}
                        onChange={(event) => updateStudyTopic(index, 'name', event.target.value)}
                        placeholder={label.studyTopicName}
                      />
                      <input
                        value={topic.category}
                        onChange={(event) => updateStudyTopic(index, 'category', event.target.value)}
                        placeholder={label.studyTopicCategory}
                      />
                      <input
                        type="number"
                        min="0"
                        value={topic.minutes}
                        onChange={(event) => updateStudyTopic(index, 'minutes', event.target.value)}
                        placeholder={label.studyTopicMinutes}
                      />
                      <button type="button" onClick={() => removeStudyTopic(index)}>
                        {label.removeStudyTopic}
                      </button>
                    </div>
                  ))}
                  <button type="button" className={styles.fileButton} onClick={addStudyTopic}>
                    + {label.addStudyTopic}
                  </button>
                </section>

                {renderMarkdownEditor()}

                <section className={styles.studyMediaPanel}>
                  <div className={styles.studyTopicHeader}>
                    <strong>{label.studyImages}</strong>
                    <button
                      type="button"
                      className={styles.fileButton}
                      onClick={() => studyMediaInputRef.current?.click()}
                    >
                      + {label.uploadMedia}
                    </button>
                  </div>
                  <input
                    ref={studyMediaInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className={styles.hiddenFileInput}
                    onChange={(event) => {
                      handleUploadStudyMedia(event.target.files);
                      event.target.value = '';
                    }}
                  />
                  <div className={styles.studyMediaList}>
                    {form.studyMedia.map((item) => (
                      <figure key={item.url}>
                        {item.type === 'video' ? (
                          <video src={item.url} controls preload="metadata" />
                        ) : (
                          <img src={item.url} alt="" />
                        )}
                        <figcaption>
                          <span>{item.name || item.url}</span>
                          <button type="button" onClick={() => removeStudyMedia(item.url)}>
                            {label.delete}
                          </button>
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </section>
              </div>

              <aside className={styles.studyPreviewCard}>
                <p>{label.studyPreview}</p>
                <header>
                  <span>{form.studyUser || currentUser?.displayName || currentUser?.username || 'Wray'}</span>
                  <strong>{formatStudyDuration(studyDuration)}</strong>
                </header>
                <h3>{form.studyTopics.map((topic) => topic.name).filter(Boolean).join(' · ') || '学习主题'}</h3>
                <p>{form.content || '今日学习内容会显示在这里。'}</p>
              </aside>
            </section>
          ) : (
            <>
              <section className={styles.mediaPanel}>
                <div className={styles.coverBox}>
                  <img src={form.image} alt="cover preview" />
                </div>
                <div className={styles.mediaControls}>
                  <label>
                    {label.coverUrl}
                    <input value={form.image} onChange={(event) => updateField('image', event.target.value)} placeholder="/img/sky.jpg" />
                  </label>
                  <button type="button" className={styles.fileButton} onClick={() => imageInputRef.current?.click()}>
                    {label.uploadCover}
                  </button>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className={styles.hiddenFileInput}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        handleUploadCover(file);
                      }
                      event.target.value = '';
                    }}
                  />
                </div>
              </section>

              {renderMarkdownEditor()}
            </>
          )}
        </form>
      </section>
      {isHistoryDialogOpen && (
        <div className={styles.dialogBackdrop} role="presentation">
          <form className={styles.historyCommitDialog} onSubmit={confirmHistoryPublish}>
            <h2>{label.historyCommitTitle}</h2>
            <p>{label.historyCommitHint}</p>
            <label>
              {label.historyMessage}
              <input
                value={historyMessage}
                onChange={(event) => setHistoryMessage(event.target.value)}
                placeholder={label.historyMessagePlaceholder}
                autoFocus
              />
            </label>
            <div className={styles.historyCommitActions}>
              <button type="button" onClick={cancelHistoryPublish} disabled={isSaving || isUploading}>
                {label.cancelSaveDraft}
              </button>
              <button type="submit" disabled={isSaving || isUploading || !historyMessage.trim()}>
                {isSaving ? label.saving : label.confirmPublish}
              </button>
            </div>
          </form>
        </div>
      )}
      {isAccountSettingsOpen && (
        <section className={styles.accountSettingsPage} aria-label={label.accountSettings}>
          <header className={styles.accountSettingsHeader}>
            <div>
              <h2>{label.accountSettings}</h2>
              <span>{profileForm.username || currentUser?.username}</span>
            </div>
            <button type="button" onClick={() => setIsAccountSettingsOpen(false)}>
              {label.cancel}
            </button>
          </header>
          <div className={styles.accountSettingsShell}>
            <nav className={styles.accountSettingsNav} aria-label={label.accountSettings}>
              <span className={styles.accountSettingsNavActive}>{label.accountInfo}</span>
            </nav>
            <form className={styles.accountSettingsForm} onSubmit={saveAccountSettings}>
              <div className={styles.accountAvatarRow}>
                <span>{label.avatar}</span>
                <button
                  type="button"
                  className={styles.avatarPicker}
                  onClick={() => accountAvatarInputRef.current?.click()}
                  aria-label={label.avatar}
                >
                  <img src={profileForm.avatar || '/icon/Mammon.png'} alt="" />
                  <span>
                    <strong>云</strong>
                    设置头像
                  </span>
                </button>
                <input
                  ref={accountAvatarInputRef}
                  type="file"
                  accept="image/*"
                  className={styles.hiddenFileInput}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      handleAccountAvatarUpload(file);
                    }
                    event.target.value = '';
                  }}
                />
              </div>
              <label>
                {label.username}
                <input value={profileForm.username} disabled />
              </label>
              <label>
                {label.displayName}
                <input
                  value={profileForm.displayName}
                  onChange={(event) => updateProfileField('displayName', event.target.value)}
                />
              </label>
              <label>
                {label.motto}
                <textarea
                  value={profileForm.motto}
                  onChange={(event) => updateProfileField('motto', event.target.value)}
                />
              </label>
              <div className={styles.passwordGroup}>
                <label>{label.currentPassword}</label>
                {renderPasswordInput('currentPassword', 'current-password')}
                <p>{label.newPassword}</p>
                {renderPasswordInput('newPassword', 'new-password')}
                <p>{label.confirmPassword}</p>
                {renderPasswordInput('confirmPassword', 'new-password')}
              </div>
              <div className={styles.accountSettingsActions}>
                <button type="submit" disabled={isSaving}>
                  {isSaving ? label.saving : label.saveAccount}
                </button>
                <button type="button" onClick={() => setIsAccountSettingsOpen(false)}>
                  {label.cancel}
                </button>
              </div>
            </form>
          </div>
        </section>
      )}
    </main>
  );
};

export default AdminPage;
