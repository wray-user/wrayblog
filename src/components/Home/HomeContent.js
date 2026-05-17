import { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import styles from './HomeContent.module.css';
import CategoryTabs from './CategoryTabs';
import ContributionCard from './ContributionCard';
import PostList from './PostList';
import ProfileCard from './ProfileCard';
import { createComment, fetchComments, likeComment, likePost } from '../../api/comments';

const POSTS_PER_PAGE = 12;

const text = {
  today: '\u4eca\u5929',
  daysAgo: '\u5929\u524d',
  commentPlaceholder: '\u7f16\u5199\u8bc4\u8bba',
  submitComment: '\u63d0\u4ea4\u8bc4\u8bba',
  nickname: '\u6635\u79f0',
  email: '\u7535\u5b50\u90ae\u7bb1',
  category: '\u5206\u7c7b',
  articleToc: '\u6587\u7ae0\u76ee\u5f55',
  noToc: '\u8fd8\u6ca1\u6709\u53ef\u751f\u6210\u76ee\u5f55\u7684\u6587\u7ae0\u3002',
  noTopicPosts: '\u8fd9\u4e2a\u4e3b\u9898\u4e0b\u6682\u65f6\u6ca1\u6709\u6587\u7ae0\u3002',
  techShare: '\u6280\u672f\u5206\u4eab',
  techQuestion: '\u95ee\u9898',
  techNote: '\u7b14\u8bb0',
  topic: '\u4e13\u9898',
  private: '\u79c1\u5bc6',
  privateTitle: '\u8fd9\u662f\u4e00\u7bc7\u79c1\u5bc6\u6587\u7ae0',
  privateDesc: '\u8bf7\u5148\u767b\u5f55\u540e\u53f0\u8d26\u53f7\uff0c\u518d\u56de\u5230\u8fd9\u7bc7\u6587\u7ae0\u67e5\u770b\u6b63\u6587\u3002',
  login: '\u53bb\u767b\u5f55',
  comments: '\u8bc4\u8bba',
  reply: '\u56de\u590d',
  replyComment: '\u56de\u590d\u8bc4\u8bba',
  replies: '\u6761\u56de\u590d',
  expandReplies: '\u5c55\u5f00',
  collapseReplies: '\u6536\u8d77',
  noComments: '\u8fd8\u6ca1\u6709\u8bc4\u8bba\uff0c\u6765\u5199\u7b2c\u4e00\u6761\u5427\u3002',
  commentLikeFailed: '\u8bc4\u8bba\u70b9\u8d5e\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5',
  loadingCommentsFailed: '\u8bc4\u8bba\u52a0\u8f7d\u5931\u8d25',
  likeFailed: '\u70b9\u8d5e\u5931\u8d25\uff0c\u8bf7\u7a0d\u540e\u518d\u8bd5',
  submittingComment: '\u6b63\u5728\u63d0\u4ea4\u8bc4\u8bba...',
  commentSubmitted: '\u8bc4\u8bba\u5df2\u63d0\u4ea4',
  copied: '\u5df2\u590d\u5236',
  copyFailed: '\u590d\u5236\u5931\u8d25',
  share: '\u5206\u4eab',
  copy: '\u590d\u5236',
  allTags: '\u6240\u6709\u6807\u7b7e',
  history: 'History',
  historyTitle: '\u4fee\u6539\u5386\u53f2',
  noHistory: '\u8fd8\u6ca1\u6709\u5386\u53f2\u8bb0\u5f55',
  wechat: '\u5fae\u4fe1',
  moments: '\u670b\u53cb\u5708',
  qq: 'QQ',
  qzone: 'QQ\u7a7a\u95f4',
  serviceNote: '\u8fd9\u4e2a\u6a21\u5757\u5df2\u7ecf\u9884\u7559\u4e3a\u72ec\u7acb\u843d\u5730\u9875\uff0c\u540e\u9762\u53ef\u4ee5\u7ee7\u7eed\u63a5\u5165\u771f\u5b9e\u670d\u52a1\u5730\u5740\u6216\u540e\u53f0\u80fd\u529b\u3002',
  notFoundTitle: '\u8fd9\u4e2a\u9875\u9762\u8fd8\u6ca1\u6709\u5185\u5bb9',
  notFoundDesc: '\u5df2\u7ecf\u505a\u597d\u5f02\u5e38\u8def\u7531\u515c\u5e95\uff0c\u53ef\u4ee5\u56de\u9996\u9875\u6216\u7ee7\u7eed\u8865\u5145\u65b0\u9875\u9762\u6570\u636e\u3002',
  backHome: '\u8fd4\u56de\u9996\u9875',
};

const TECH_TOPIC_ITEMS = [
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

const TECH_TOPIC_VISIBLE_COUNT = 14;

const getCommentId = (comment) => comment._id || comment.id;
const getPostTopic = (post) =>
  post.categorySlug === 'tech' ? post.techTopic || post.subcategory || post.topic || 'Python' : '';

const postMatchesTopic = (post, topic) => {
  if (!topic) {
    return true;
  }

  return getPostTopic(post) === topic;
};

const normalizeTechKind = (value) =>
  String(value || '').trim().toLowerCase() === 'note' || String(value || '').trim() === '\u7b14\u8bb0'
    ? 'note'
    : 'question';

const getPostTechKind = (post) => normalizeTechKind(post?.techKind || post?.techType || post?.articleType);

const sortTechPostsByKind = (posts, kind) =>
  [...posts].sort((a, b) => {
    if (kind === 'note') {
      const orderA = Number.isFinite(Number(a.noteOrder)) ? Number(a.noteOrder) : Number.MAX_SAFE_INTEGER;
      const orderB = Number.isFinite(Number(b.noteOrder)) ? Number(b.noteOrder) : Number.MAX_SAFE_INTEGER;

      if (orderA !== orderB) {
        return orderA - orderB;
      }
    }

    return (
      new Date(b.createAt || b.date || 0).getTime() -
      new Date(a.createAt || a.date || 0).getTime()
    );
  });

const contentToMarkdown = (content) =>
  Array.isArray(content) ? content.join('\n\n') : String(content || '');

const getPostCharacterCount = (post) => {
  const raw = contentToMarkdown(post?.content || post?.excerpt || '');
  const cleaned = raw
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<video[\s\S]*?<\/video>/gi, ' ')
    .replace(/<img\b[^>]*>/gi, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#*_`~>|-]/g, ' ')
    .replace(/\s+/g, '');

  return cleaned.length || String(post?.excerpt || '').replace(/\s+/g, '').length;
};

const getRecordDate = (post) => {
  if (post?.studyDate) {
    const studyDate = new Date(`${post.studyDate}T00:00:00`);
    return Number.isNaN(studyDate.getTime()) ? new Date() : studyDate;
  }

  const history = Array.isArray(post?.history) ? post.history : [];
  const firstHistoryAt = history
    .map((item) => item.at || item.createAt)
    .filter(Boolean)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];
  const date = new Date(firstHistoryAt || post?.createAt || post?.date || post?.updatedAt);

  return Number.isNaN(date.getTime()) ? new Date() : date;
};

const getRecordDateKey = (post) => {
  const date = getRecordDate(post);
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const getTodayDateKey = () => {
  const date = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const getRecordMonthKey = (post) => getRecordDateKey(post).slice(0, 7);

const formatStudyDate = (dateKey) => {
  const date = new Date(`${dateKey}T00:00:00`);
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${dateKey.replace(/-/g, '.')}  ${weekdays[date.getDay()]}`;
};

const getStudyMinutes = (post) => {
  if (Number(post.durationMinutes) > 0) {
    return Number(post.durationMinutes);
  }

  if (Number(post.studyMinutes) > 0) {
    return Number(post.studyMinutes);
  }

  if (Number(post.studyHours) > 0) {
    return Math.round(Number(post.studyHours) * 60);
  }

  const durationText = `${post.duration || post.studyDuration || post.readTime || ''}`;
  const hourMatch = durationText.match(/(\d+(?:\.\d+)?)\s*h/i);
  if (hourMatch) {
    return Math.round(Number(hourMatch[1]) * 60);
  }

  const minuteMatch = durationText.match(/(\d+(?:\.\d+)?)\s*min/i);
  if (minuteMatch) {
    return Math.max(1, Math.round(Number(minuteMatch[1])));
  }

  return Math.max(1, Math.ceil(getPostCharacterCount(post) / 500) * 30);
};

const formatStudyDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (hours && rest) {
    return `${hours}小时${rest}分`;
  }

  if (hours) {
    return `${hours}小时`;
  }

  return `${rest || 0}分钟`;
};

const getStudyPerson = (post) => post.studyUser || post.authorName || post.owner || 'Wray';
const getStudyCategory = (post) => {
  const topics = Array.isArray(post.topics) ? post.topics : [];

  return (
    topics.find((topic) => topic.category)?.category ||
    post.studyCategory ||
    post.learningCategory ||
    post.techTopic ||
    post.tags?.[0] ||
    '学习'
  );
};

const getStudyTopicCategories = (post) => {
  const topics = Array.isArray(post.topics) ? post.topics : [];
  return Array.from(new Set(topics.map((topic) => topic.category).filter(Boolean)));
};

const getStudyContentPreview = (post) => {
  const raw = contentToMarkdown(post?.content || post?.summary || post?.excerpt || '');
  return raw
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#*_`~>|-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const buildStudyMonthOptions = (recordMonths) => {
  const months = new Set(recordMonths);
  const now = new Date();

  for (let index = 0; index < 24; index += 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    months.add(month);
  }

  return Array.from(months).sort((a, b) => b.localeCompare(a));
};

const extractHeadings = (markdown) => {
  const matches = String(markdown || '').matchAll(/^(#{1,3})\s+(.+)$/gm);

  return Array.from(matches, (match, index) => ({
    id: `heading-${index + 1}`,
    level: match[1].length,
    text: match[2].replace(/[#*_`~]/g, '').trim(),
  })).filter((item) => item.text);
};

const buildTocGroups = (headings) => {
  if (!headings.length) {
    return [];
  }

  const minLevel = Math.min(...headings.map((heading) => heading.level));
  const groups = [];

  headings.forEach((heading) => {
    if (heading.level === minLevel || !groups.length) {
      groups.push({ ...heading, children: [] });
      return;
    }

    groups[groups.length - 1].children.push(heading);
  });

  return groups;
};

const headingIdByText = (headings, value) => {
  const normalized = String(value || '').replace(/[#*_`~]/g, '').trim();
  return headings.find((heading) => heading.text === normalized)?.id;
};

const headingIdByIndex = (headings, index, value) => {
  const normalized = String(value || '').replace(/[#*_`~]/g, '').trim();
  const heading = headings.filter((item) => item.text === normalized)[index] || headings[index];
  return heading?.id;
};

const formatCommentDate = (value) => {
  const time = new Date(value || Date.now()).getTime();
  const diffDays = Math.max(0, Math.floor((Date.now() - time) / 86400000));

  if (diffDays <= 0) {
    return text.today;
  }

  if (diffDays < 30) {
    return `${diffDays} ${text.daysAgo}`;
  }

  return new Date(time).toISOString().slice(0, 10);
};

const formatHistoryDate = (value) => {
  const date = new Date(value || Date.now());
  if (Number.isNaN(date.getTime())) {
    return String(value || '');
  }

  const pad = (item) => String(item).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
};

const getPostHistory = (post) => {
  const history = Array.isArray(post?.history) ? post.history : [];
  const firstUploadAt = post?.createAt || post?.date;
  const firstUploadItem = post
    ? {
        at: firstUploadAt,
        message: post.title,
        isFirstUpload: true,
      }
    : null;
  const historyItems = history.map((item) => ({
    at: item.at || item.createAt || firstUploadAt,
    message: item.message || post.title,
  }));

  if (firstUploadItem) {
    const hasFirstUpload = historyItems.some((item) => {
      const sameMessage = item.message === firstUploadItem.message;
      const sameTime =
        item.at &&
        firstUploadItem.at &&
        Math.abs(new Date(item.at).getTime() - new Date(firstUploadItem.at).getTime()) < 60000;

      return sameMessage && sameTime;
    });

    if (!hasFirstUpload) {
      historyItems.push(firstUploadItem);
    }
  }

  return historyItems.sort((a, b) => new Date(b.at || 0).getTime() - new Date(a.at || 0).getTime());
};

const getPostFirstUploadDate = (post) => {
  const history = Array.isArray(post?.history) ? post.history : [];
  const firstHistoryTime = history
    .map((item) => item.at || item.createAt)
    .filter(Boolean)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];

  return formatHistoryDate(firstHistoryTime || post?.createAt || post?.date);
};

const HeartIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20.8 4.6c-1.8-1.8-4.8-1.8-6.6 0L12 6.8 9.8 4.6C8 2.8 5 2.8 3.2 4.6s-1.8 4.8 0 6.6L12 20l8.8-8.8c1.8-1.8 1.8-4.8 0-6.6Z" />
  </svg>
);

const CommentIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.8 8.8 0 0 1-3.8-.9L3 20l1.2-4.1A8.1 8.1 0 0 1 3 11.5a8.5 8.5 0 0 1 9-8.4 8.5 8.5 0 0 1 9 8.4Z" />
  </svg>
);

const ShareIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <path d="m8.6 10.6 6.8-4.2" />
    <path d="m8.6 13.4 6.8 4.2" />
  </svg>
);

const SHARE_ICON_SRC = {
  wechat: '/icon/\u5fae\u4fe1.svg',
  moments: '/icon/\u5fae\u4fe1\u670b\u53cb\u5708.svg',
  qq: '/icon/QQ.svg',
  qzone: '/icon/QQ\u52a8\u6001.svg',
};

const SocialShareIcon = ({ type, label }) => (
  <img src={SHARE_ICON_SRC[type]} alt={label} />
);

const getQrCodeUrl = (value) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=8&data=${encodeURIComponent(value)}`;

const getShareTargets = (shareUrl, title) => {
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title || '');

  return [
    { key: 'wechat', label: text.wechat, qrValue: shareUrl },
    { key: 'moments', label: text.moments, qrValue: shareUrl },
    {
      key: 'qq',
      label: text.qq,
      href: `https://connect.qq.com/widget/shareqq/index.html?url=${encodedUrl}&title=${encodedTitle}`,
    },
    {
      key: 'qzone',
      label: text.qzone,
      href: `https://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=${encodedUrl}&title=${encodedTitle}`,
    },
  ].map((item) => ({ ...item, qrValue: item.qrValue || item.href }));
};

const ShareDialog = ({ shareUrl, title, shareToast, onCopy, onClose }) => {
  const handleShareClick = async (event, item) => {
    const canNativeShare =
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function' &&
      navigator.canShare?.({ url: shareUrl, title }) !== false;

    if (canNativeShare) {
      event.preventDefault();

      try {
        await navigator.share({
          title: title || document.title,
          text: title || document.title,
          url: shareUrl,
        });
      } catch (error) {
        // User cancellation should simply keep the dialog open for QR fallback.
      }

      return;
    }

    if (!item.href) {
      event.preventDefault();
    }
  };

  return (
    <div className={styles.shareBackdrop} role="presentation">
      <section className={styles.shareDialog} role="dialog" aria-modal="true">
        <h3>{text.share}</h3>
        <div className={styles.shareGrid}>
          {getShareTargets(shareUrl, title).map((item) => (
            <a
              key={item.key}
              href={item.href || shareUrl}
              target={item.href ? '_blank' : undefined}
              rel={item.href ? 'noreferrer' : undefined}
              className={styles.shareOption}
              onClick={(event) => handleShareClick(event, item)}
            >
              <span className={styles.shareSocialIcon}>
                <SocialShareIcon type={item.key} label={item.label} />
              </span>
              <strong>{item.label}</strong>
              <span className={styles.shareQrPopover}>
                <img src={getQrCodeUrl(shareUrl)} alt={`${item.label} QR code`} />
              </span>
            </a>
          ))}
        </div>
        <div className={styles.shareUrl}>
          <span>{shareUrl}</span>
          <button type="button" onClick={onCopy}>{text.copy}</button>
        </div>
        {shareToast && <div className={styles.shareToast}>{shareToast}</div>}
        <button
          type="button"
          className={styles.shareClose}
          onClick={onClose}
          aria-label="Close share dialog"
        >
          x
        </button>
      </section>
    </div>
  );
};

const HistoryDialog = ({ post, onClose }) => {
  const historyItems = getPostHistory(post);

  return (
    <div className={styles.historyBackdrop} role="presentation" onClick={onClose}>
      <section
        className={styles.historyDialog}
        role="dialog"
        aria-modal="true"
        aria-label={text.historyTitle}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.historyDialogHeader}>
          <h3>{text.historyTitle}</h3>
          <button type="button" onClick={onClose} aria-label="Close history dialog">
            x
          </button>
        </div>
        <div className={styles.historyList}>
          {historyItems.map((item, index) => (
            <article key={`${item.at}-${index}`} className={styles.historyItem}>
              <time>{formatHistoryDate(item.at)}</time>
              <p>{item.message}</p>
            </article>
          ))}
          {historyItems.length === 0 && <p className={styles.emptyComments}>{text.noHistory}</p>}
        </div>
      </section>
    </div>
  );
};

const CommentEditor = ({ value, onChange, onSubmit }) => {
  const updateField = (field, nextValue) => {
    onChange({ ...value, [field]: nextValue });
  };

  return (
    <form className={styles.commentForm} onSubmit={onSubmit}>
      <div className={styles.commentEditorBox}>
        <textarea
          value={value.content}
          onChange={(event) => updateField('content', event.target.value)}
          placeholder={text.commentPlaceholder}
          required
        />
      </div>
      <div className={styles.commentFields}>
        <input
          value={value.nickname}
          onChange={(event) => updateField('nickname', event.target.value)}
          placeholder={text.nickname}
          required
        />
        <input
          type="email"
          value={value.email}
          onChange={(event) => updateField('email', event.target.value)}
          placeholder={text.email}
        />
        <button type="submit">{text.submitComment}</button>
      </div>
    </form>
  );
};

const CommentThread = ({ slug, comments, setComments, commentStatus, setCommentStatus }) => {
  const [replyTarget, setReplyTarget] = useState('');
  const [replyForm, setReplyForm] = useState({ nickname: '', email: '', content: '' });
  const [expandedReplies, setExpandedReplies] = useState({});

  const { topComments, repliesByParent } = useMemo(() => {
    const groupedReplies = new Map();
    const roots = [];

    comments.forEach((comment) => {
      const parentId = comment.parentId ? String(comment.parentId) : '';

      if (!parentId) {
        roots.push(comment);
        return;
      }

      groupedReplies.set(parentId, [...(groupedReplies.get(parentId) || []), comment]);
    });

    return { topComments: roots, repliesByParent: groupedReplies };
  }, [comments]);

  useEffect(() => {
    setReplyTarget('');
    setReplyForm({ nickname: '', email: '', content: '' });
    setExpandedReplies({});
  }, [slug]);

  const updateCommentLike = async (comment) => {
    if (comment.liked) {
      return;
    }

    try {
      const data = await likeComment(getCommentId(comment));
      setComments((current) =>
        current.map((item) =>
          getCommentId(item) === getCommentId(comment)
            ? { ...item, likes: data.likes, liked: Boolean(data.liked) }
            : item,
        ),
      );
    } catch (error) {
      setCommentStatus(text.commentLikeFailed);
    }
  };

  const submitReply = async (event, parent) => {
    event.preventDefault();
    setCommentStatus(text.submittingComment);

    try {
      const parentId = getCommentId(parent);
      const comment = await createComment(slug, { ...replyForm, parentId });
      setComments((current) => [...current, comment]);
      setReplyForm({ nickname: '', email: '', content: '' });
      setReplyTarget('');
      setExpandedReplies((current) => ({ ...current, [parentId]: true }));
      setCommentStatus(text.commentSubmitted);
    } catch (error) {
      setCommentStatus(error.message);
    }
  };

  const renderComment = (comment, isReply = false) => {
    const commentId = getCommentId(comment);
    const replies = repliesByParent.get(String(commentId)) || [];
    const isExpanded = Boolean(expandedReplies[commentId]);

    return (
      <article key={commentId} className={isReply ? styles.commentReply : styles.commentItem}>
        <div className={styles.commentAvatar}>{comment.nickname.slice(0, 1).toUpperCase()}</div>
        <div className={styles.commentContent}>
          <div className={styles.commentMeta}>
            <strong>{comment.nickname}</strong>
            <span>{formatCommentDate(comment.createAt)}</span>
          </div>
          <div className={styles.commentText}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
              {comment.content}
            </ReactMarkdown>
          </div>
          <div className={styles.commentActions}>
            <button
              type="button"
              className={comment.liked ? styles.likeButtonActive : styles.likeButton}
              onClick={() => updateCommentLike(comment)}
              aria-label="Like comment"
            >
              <HeartIcon />
              <span>{Number(comment.likes) || 0}</span>
            </button>
            {!isReply && (
              <button type="button" onClick={() => setReplyTarget(commentId)}>
                {text.reply}
              </button>
            )}
          </div>
          {!isReply && replyTarget === commentId && (
            <div className={styles.replyEditor}>
              <CommentEditor
                value={replyForm}
                onChange={setReplyForm}
                onSubmit={(event) => submitReply(event, comment)}
              />
            </div>
          )}
          {!isReply && replies.length > 0 && (
            <>
              <button
                type="button"
                className={styles.expandRepliesButton}
                onClick={() =>
                  setExpandedReplies((current) => ({ ...current, [commentId]: !isExpanded }))
                }
              >
                {isExpanded ? text.collapseReplies : text.expandReplies}
                {' '}
                {replies.length}
                {' '}
                {text.replies}
              </button>
              {isExpanded && (
                <div className={styles.replyList}>
                  {replies.map((reply) => renderComment(reply, true))}
                </div>
              )}
            </>
          )}
        </div>
      </article>
    );
  };

  return (
    <>
      {commentStatus && <p className={styles.commentStatus}>{commentStatus}</p>}
      <h3>{comments.length} {text.comments}</h3>
      <div className={styles.commentList}>
        {topComments.map((comment) => renderComment(comment))}
        {comments.length === 0 && <p className={styles.emptyComments}>{text.noComments}</p>}
      </div>
    </>
  );
};

const FeedPage = ({ siteData, page }) => {
  const contentRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(page.posts.length / POSTS_PER_PAGE));
  const pagedPosts = useMemo(() => {
    const start = (currentPage - 1) * POSTS_PER_PAGE;
    return page.posts.slice(start, start + POSTS_PER_PAGE);
  }, [currentPage, page.posts]);

  useEffect(() => {
    setCurrentPage(1);
  }, [page.activeCategory]);

  useEffect(() => {
    setCurrentPage((value) => Math.min(value, totalPages));
  }, [totalPages]);

  const goToPage = (pageNumber) => {
    const nextPage = Math.min(Math.max(1, pageNumber), totalPages);
    setCurrentPage(nextPage);
    window.requestAnimationFrame(() => {
      contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  return (
    <div className={styles.inner}>
      <aside className={styles.sidebar}>
        <ProfileCard
          profile={siteData.profile}
          posts={siteData.posts}
          categories={siteData.categories}
          tags={siteData.tags}
        />
      </aside>
      <div className={styles.content} ref={contentRef}>
        <CategoryTabs categories={siteData.categories} active={page.activeCategory} />
        <PostList posts={pagedPosts} />
        <nav className={styles.pagination} aria-label="Post pagination">
          <button
            type="button"
            className={styles.paginationArrow}
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Previous page"
          >
            <span aria-hidden="true">&larr;</span>
          </button>
          <div className={styles.pageNumberGroup}>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                className={
                  pageNumber === currentPage ? styles.pageNumberActive : styles.pageNumber
                }
                onClick={() => goToPage(pageNumber)}
                aria-current={pageNumber === currentPage ? 'page' : undefined}
              >
                {pageNumber}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={styles.paginationArrow}
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Next page"
          >
            <span aria-hidden="true">&rarr;</span>
          </button>
        </nav>
      </div>
      <aside className={styles.leftRail}>
        <ContributionCard posts={siteData.posts} />
      </aside>
    </div>
  );
};

const TechArticleReader = ({ post, posts = [], onSelectPost }) => {
  const markdownContent = useMemo(() => contentToMarkdown(post?.content), [post?.content]);
  const headings = useMemo(() => extractHeadings(markdownContent), [markdownContent]);
  const videos = Array.isArray(post?.videos) ? post.videos : [];
  const authorName = post?.authorName || 'Wray';
  const authorAvatar = post?.authorAvatar || '/icon/Mammon.png';
  const postIndex = posts.findIndex((item) => item.slug === post?.slug);
  const previousPost = postIndex >= 0 ? posts[postIndex + 1] : null;
  const nextPost = postIndex > 0 ? posts[postIndex - 1] : null;
  const shareUrl =
    !post || typeof window === 'undefined'
      ? post ? `#/post/${post.slug}` : '#'
      : `${window.location.origin}${window.location.pathname}#/post/${post.slug}`;
  const [comments, setComments] = useState([]);
  const [commentForm, setCommentForm] = useState({ nickname: '', email: '', content: '' });
  const [commentStatus, setCommentStatus] = useState('');
  const [articleLikes, setArticleLikes] = useState(Number(post?.likes) || 0);
  const [articleLiked, setArticleLiked] = useState(Boolean(post?.liked));
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [shareToast, setShareToast] = useState('');

  useEffect(() => {
    setArticleLikes(Number(post?.likes) || 0);
    setArticleLiked(Boolean(post?.liked));
  }, [post?.liked, post?.likes]);

  useEffect(() => {
    if (!post?.slug) {
      setComments([]);
      setCommentStatus('');
      return undefined;
    }

    let isMounted = true;
    setComments([]);
    setCommentStatus('');

    fetchComments(post.slug)
      .then((items) => {
        if (isMounted) {
          setComments(items);
        }
      })
      .catch(() => {
        if (isMounted) {
          setCommentStatus(text.loadingCommentsFailed);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [post?.slug]);

  useEffect(() => {
    if (!shareToast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setShareToast(''), 1800);
    return () => window.clearTimeout(timer);
  }, [shareToast]);

  const headingRenderCounts = {};
  const markdownComponents = {
    h1: ({ children, ...props }) => {
      const value = Array.isArray(children) ? children.join('') : String(children || '');
      const index = headingRenderCounts[value] || 0;
      headingRenderCounts[value] = index + 1;
      const id = headingIdByIndex(headings, index, value);
      return <h1 id={id} {...props}>{children}</h1>;
    },
    h2: ({ children, ...props }) => {
      const value = Array.isArray(children) ? children.join('') : String(children || '');
      const index = headingRenderCounts[value] || 0;
      headingRenderCounts[value] = index + 1;
      const id = headingIdByIndex(headings, index, value);
      return <h2 id={id} {...props}>{children}</h2>;
    },
    h3: ({ children, ...props }) => {
      const value = Array.isArray(children) ? children.join('') : String(children || '');
      const index = headingRenderCounts[value] || 0;
      headingRenderCounts[value] = index + 1;
      const id = headingIdByIndex(headings, index, value);
      return <h3 id={id} {...props}>{children}</h3>;
    },
  };

  const handlePostLike = async () => {
    if (!post?.slug || articleLiked) {
      return;
    }

    try {
      const data = await likePost(post.slug);
      setArticleLikes(data.likes);
      setArticleLiked(Boolean(data.liked));
    } catch (error) {
      setCommentStatus(text.likeFailed);
    }
  };

  const submitComment = async (event) => {
    event.preventDefault();
    if (!post?.slug) {
      return;
    }

    setCommentStatus(text.submittingComment);

    try {
      const comment = await createComment(post.slug, commentForm);
      setComments((current) => [...current, comment]);
      setCommentForm((current) => ({ ...current, content: '' }));
      setCommentStatus(text.commentSubmitted);
    } catch (error) {
      setCommentStatus(error.message);
    }
  };

  const copyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareToast(text.copied);
    } catch (error) {
      setShareToast(text.copyFailed);
    }
  };

  const scrollToComments = (event) => {
    event.preventDefault();
    document.getElementById('tech-comments')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const switchPost = (event, nextPostItem) => {
    event.preventDefault();
    if (nextPostItem) {
      onSelectPost?.(nextPostItem.slug);
    }
  };

  if (!post) {
    return (
      <article className={styles.techArticleReader}>
        <div className={styles.emptyArticleSpace} aria-hidden="true" />
      </article>
    );
  }

  return (
    <>
      <article className={styles.techArticleReader}>
        <header className={styles.articleHeader}>
          <div className={styles.articleMeta}>
            {post.isPrivate && <span className={styles.privateChip}>{text.private}</span>}
            <span className={styles.authorMeta}>
              <img src={authorAvatar} alt="" />
              <span>{authorName}</span>
            </span>
            <span>{getPostFirstUploadDate(post)}</span>
            <span>{getPostCharacterCount(post)}字</span>
            <button
              type="button"
              className={styles.historyButton}
              onClick={() => setIsHistoryOpen(true)}
            >
              {text.history}
            </button>
          </div>
          <div className={styles.articleActions}>
            <button
              type="button"
              className={articleLiked ? styles.likeButtonActive : styles.likeButton}
              onClick={handlePostLike}
              aria-label="Like post"
            >
              <HeartIcon />
              <span>{articleLikes}</span>
            </button>
            <a href="#tech-comments" onClick={scrollToComments} aria-label="View comments">
              <CommentIcon />
              <span>{comments.length}</span>
            </a>
            <button type="button" onClick={() => setIsShareOpen(true)} aria-label="Share post">
              <ShareIcon />
            </button>
          </div>
        </header>
        <h2
          id={headings.length ? undefined : 'tech-article-content'}
          className={styles.articleTitle}
        >
          {post.title}
        </h2>
        {post.locked ? (
          <div className={styles.privateNotice}>
            <h3>{text.privateTitle}</h3>
            <p>{text.privateDesc}</p>
            <a href="#/admin">{text.login}</a>
          </div>
        ) : (
          <div className={styles.articleBody}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={markdownComponents}
            >
              {markdownContent}
            </ReactMarkdown>
          </div>
        )}
        {!post.locked && videos.length > 0 && (
          <div className={styles.articleVideos}>
            {videos.map((video) => (
              <video key={video} src={video} controls preload="metadata" />
            ))}
          </div>
        )}
        <nav className={styles.postPager} aria-label="Post pager">
          {previousPost ? (
            <a href={`#/post/${previousPost.slug}`} onClick={(event) => switchPost(event, previousPost)}>
              <span>&lsaquo;</span>
              <strong>{previousPost.title}</strong>
            </a>
          ) : <span />}
          {nextPost ? (
            <a href={`#/post/${nextPost.slug}`} onClick={(event) => switchPost(event, nextPost)}>
              <strong>{nextPost.title}</strong>
              <span>&rsaquo;</span>
            </a>
          ) : <span />}
        </nav>
        <section className={styles.commentsSection} id="tech-comments">
          <h3>{text.comments}</h3>
          <CommentEditor value={commentForm} onChange={setCommentForm} onSubmit={submitComment} />
          <CommentThread
            slug={post.slug}
            comments={comments}
            setComments={setComments}
            commentStatus={commentStatus}
            setCommentStatus={setCommentStatus}
          />
        </section>
      </article>
      {isShareOpen && (
        <ShareDialog
          shareUrl={shareUrl}
          title={post.title}
          shareToast={shareToast}
          onCopy={copyShareUrl}
          onClose={() => setIsShareOpen(false)}
        />
      )}
      {isHistoryOpen && <HistoryDialog post={post} onClose={() => setIsHistoryOpen(false)} />}
    </>
  );
};

const TechArticleToc = ({ post }) => {
  const markdownContent = contentToMarkdown(post?.content);
  const headings = extractHeadings(markdownContent);
  const tocGroups = buildTocGroups(headings);

  const scrollToHeading = (event, headingId) => {
    event.preventDefault();
    const target = document.getElementById(headingId);
    if (!target) {
      return;
    }

    const top = target.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  };

  return (
    <aside className={styles.techArticleToc}>
      <nav aria-label={text.articleToc}>
        <h3>{text.articleToc}</h3>
        {tocGroups.map((group, index) => (
          <div key={group.id} className={styles.techTocGroup}>
            <a
              href={`#${group.id}`}
              className={styles.techTocLink}
              onClick={(event) => scrollToHeading(event, group.id)}
            >
              {index + 1}. {group.text}
            </a>
            {group.children.length > 0 && (
              <div className={styles.techTocChildren}>
                {group.children.map((child) => (
                  <a
                    key={child.id}
                    href={`#${child.id}`}
                    className={styles.techTocSubLink}
                    onClick={(event) => scrollToHeading(event, child.id)}
                  >
                    {child.text}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
};

const TechCategoryPage = ({ page }) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState('');
  const [techKind, setTechKind] = useState('question');
  const moreRef = useRef(null);
  const categoryShellRef = useRef(null);
  const listRef = useRef(null);
  const activeTopic = page.activeTopic || TECH_TOPIC_ITEMS[0];
  const visibleTopics = TECH_TOPIC_ITEMS.slice(0, TECH_TOPIC_VISIBLE_COUNT);
  const moreTopics = TECH_TOPIC_ITEMS.slice(TECH_TOPIC_VISIBLE_COUNT);
  const topicPosts = page.posts.filter((post) => postMatchesTopic(post, activeTopic));
  const activePostInTopic = topicPosts.find((post) => post.slug === page.activePostSlug);
  const visiblePosts = sortTechPostsByKind(
    topicPosts.filter((post) => getPostTechKind(post) === techKind),
    techKind,
  );
  const activePostInKind = visiblePosts.find((post) => post.slug === page.activePostSlug);
  const firstPostSlug = activePostInKind?.slug || visiblePosts[0]?.slug || '';
  const selectedPost = visiblePosts.find((post) => post.slug === selectedSlug) || visiblePosts[0];

  useEffect(() => {
    setTechKind(activePostInTopic ? getPostTechKind(activePostInTopic) : 'question');
  }, [activePostInTopic, activeTopic]);

  useEffect(() => {
    setSelectedSlug(firstPostSlug);
  }, [activeTopic, firstPostSlug, page.activePostSlug, techKind]);

  useEffect(() => {
    const activeLink = listRef.current?.querySelector('[data-active="true"]');
    activeLink?.scrollIntoView({ block: 'nearest' });
  }, [selectedSlug, visiblePosts.length]);

  useEffect(() => {
    if (!isMoreOpen) {
      return undefined;
    }

    const closeMorePanel = (event) => {
      if (!moreRef.current?.contains(event.target)) {
        setIsMoreOpen(false);
      }
    };

    document.addEventListener('pointerdown', closeMorePanel);
    return () => document.removeEventListener('pointerdown', closeMorePanel);
  }, [isMoreOpen]);

  const selectPost = (slug, shouldScroll = true) => {
    setSelectedSlug(slug);
    window.history.replaceState(
      null,
      '',
      `#/category/tech/${encodeURIComponent(activeTopic)}/${encodeURIComponent(slug)}`,
    );
    if (shouldScroll) {
      window.requestAnimationFrame(() => {
        categoryShellRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  };

  const switchTechKind = (nextKind) => {
    setTechKind(nextKind);
    const nextPosts = sortTechPostsByKind(
      topicPosts.filter((post) => getPostTechKind(post) === nextKind),
      nextKind,
    );
    const nextSlug = nextPosts[0]?.slug || '';
    setSelectedSlug(nextSlug);
    window.history.replaceState(null, '', `#/category/tech/${encodeURIComponent(activeTopic)}`);
  };

  return (
    <div className={styles.categoryShell} ref={categoryShellRef}>
      <section className={styles.topicHeader}>
        <h2>{text.techShare}</h2>
        <div className={styles.topicLinks}>
          {visibleTopics.map((topic) => (
            <a
              key={topic}
              href={`#/category/tech/${encodeURIComponent(topic)}`}
              className={topic === activeTopic ? styles.topicLinkActive : undefined}
            >
              {topic}
            </a>
          ))}
          {moreTopics.length > 0 && (
            <div className={styles.topicMoreWrap} ref={moreRef}>
              <button type="button" onClick={() => setIsMoreOpen((open) => !open)}>
                More
                <span aria-hidden="true">&#8250;</span>
              </button>
              {isMoreOpen && (
                <div className={styles.topicMorePanel}>
                  {moreTopics.map((topic) => (
                    <a
                      key={topic}
                      href={`#/category/tech/${encodeURIComponent(topic)}`}
                      className={topic === activeTopic ? styles.topicLinkActive : undefined}
                      onClick={() => setIsMoreOpen(false)}
                    >
                      {topic}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
      <div className={styles.techLearningLayout}>
        <aside className={styles.techWholeToc} ref={listRef}>
          <div className={styles.techTocHeader}>
            <h3>{activeTopic}</h3>
            <div className={styles.techKindSwitch} aria-label="\u6280\u672f\u6587\u7ae0\u7c7b\u578b">
              <button
                type="button"
                className={techKind === 'question' ? styles.techKindActive : undefined}
                onClick={() => switchTechKind('question')}
              >
                {text.techQuestion}
              </button>
              <button
                type="button"
                className={techKind === 'note' ? styles.techKindActive : undefined}
                onClick={() => switchTechKind('note')}
              >
                {text.techNote}
              </button>
            </div>
          </div>
          {visiblePosts.map((post) => (
            <a
              key={post.slug}
              href={`#/category/tech/${encodeURIComponent(activeTopic)}/${encodeURIComponent(post.slug)}`}
              className={post.slug === selectedPost?.slug ? styles.techPostLinkActive : undefined}
              data-active={post.slug === selectedPost?.slug ? 'true' : undefined}
              onClick={(event) => {
                event.preventDefault();
                selectPost(post.slug);
              }}
            >
              {post.title}
            </a>
          ))}
        </aside>
        <section className={styles.categoryPostColumn}>
          <TechArticleReader post={selectedPost} posts={visiblePosts} onSelectPost={selectPost} />
        </section>
        <TechArticleToc post={selectedPost} />
      </div>
    </div>
  );
};

const EssayCategoryPage = ({ page }) => {
  const [selectedSlug, setSelectedSlug] = useState('');
  const categoryShellRef = useRef(null);
  const listRef = useRef(null);
  const visiblePosts = page.posts;
  const activePost = visiblePosts.find((post) => post.slug === page.activePostSlug);
  const firstPostSlug = activePost?.slug || visiblePosts[0]?.slug || '';
  const selectedPost = visiblePosts.find((post) => post.slug === selectedSlug) || visiblePosts[0];

  useEffect(() => {
    setSelectedSlug(firstPostSlug);
  }, [firstPostSlug, page.activePostSlug]);

  useEffect(() => {
    const activeLink = listRef.current?.querySelector('[data-active="true"]');
    activeLink?.scrollIntoView({ block: 'nearest' });
  }, [selectedSlug, visiblePosts.length]);

  const selectPost = (slug, shouldScroll = true) => {
    setSelectedSlug(slug);
    window.history.replaceState(null, '', `#/category/essay/${encodeURIComponent(slug)}`);
    if (shouldScroll) {
      window.requestAnimationFrame(() => {
        categoryShellRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  };

  return (
    <div className={styles.categoryShell} ref={categoryShellRef}>
      <section className={styles.essayHeader}>
        <h2>{page.category.name}</h2>
      </section>
      <div className={styles.techLearningLayout}>
        <aside className={styles.techWholeToc} ref={listRef}>
          <h3>{page.category.name}</h3>
          {visiblePosts.map((post) => (
            <a
              key={post.slug}
              href={`#/category/essay/${encodeURIComponent(post.slug)}`}
              className={post.slug === selectedPost?.slug ? styles.techPostLinkActive : undefined}
              data-active={post.slug === selectedPost?.slug ? 'true' : undefined}
              onClick={(event) => {
                event.preventDefault();
                selectPost(post.slug);
              }}
            >
              {post.title}
            </a>
          ))}
        </aside>
        <section className={styles.categoryPostColumn}>
          <TechArticleReader post={selectedPost} posts={visiblePosts} onSelectPost={selectPost} />
        </section>
        <TechArticleToc post={selectedPost} />
      </div>
    </div>
  );
};

const StudyMediaStrip = ({ post }) => {
  const media = (Array.isArray(post.media) && post.media.length
    ? post.media.map((item) => ({ type: item.type, src: item.url || item.src }))
    : [
        ...(post.image ? [{ type: 'image', src: post.image }] : []),
        ...(Array.isArray(post.videos) ? post.videos.map((src) => ({ type: 'video', src })) : []),
      ]).filter((item) => item.src && item.src !== '/img/sky.jpg');
  const visibleMedia = media.slice(0, 3);
  const extraCount = media.length - visibleMedia.length;

  if (!media.length) {
    return null;
  }

  return (
    <div className={styles.studyMediaStrip}>
      {visibleMedia.map((item, index) => (
        <a key={`${item.src}-${index}`} href={item.src} target="_blank" rel="noreferrer">
          {item.type === 'video' ? (
            <span className={styles.studyVideoThumb}>
              <span aria-hidden="true">▶</span>
            </span>
          ) : (
            <img src={item.src} alt="" />
          )}
        </a>
      ))}
      {extraCount > 0 && <span className={styles.studyMediaMore}>+{extraCount}</span>}
    </div>
  );
};

const StudyRecordCard = ({ post, person }) => {
  if (!post) {
    return (
      <article className={styles.studyRecordEmpty}>
        <h4>{person}</h4>
        <p>今天还没有记录</p>
      </article>
    );
  }

  const topics = Array.isArray(post.topics) ? post.topics : [];
  const categories = getStudyTopicCategories(post);
  const contentPreview = getStudyContentPreview(post);

  return (
    <article className={styles.studyRecordCard}>
      <header>
        <span className={styles.authorMeta}>
          <img src={post.authorAvatar || '/icon/Mammon.png'} alt="" />
          <strong>{getStudyPerson(post)}</strong>
        </span>
        <span>{formatStudyDuration(getStudyMinutes(post))}</span>
      </header>
      <div className={styles.studyRecordMeta}>
        {(categories.length ? categories : [getStudyCategory(post)]).slice(0, 4).map((category) => (
          <span key={category}>{category}</span>
        ))}
      </div>
      {topics.length > 0 && (
        <ol className={styles.studyTopicList}>
          {topics.map((topic) => (
            <li key={`${topic.name}-${topic.minutes}`}>
              <span>{topic.name}</span>
              {topic.minutes > 0 && <strong>{formatStudyDuration(topic.minutes)}</strong>}
            </li>
          ))}
        </ol>
      )}
      {contentPreview && <p>{contentPreview}</p>}
      <StudyMediaStrip post={post} />
      <time>{formatHistoryDate(getRecordDate(post))}</time>
    </article>
  );
};

const StudyCalendar = ({ records, activeMonth, selectedDate, onSelectDate }) => {
  const monthDate = activeMonth ? new Date(`${activeMonth}-01T00:00:00`) : new Date();
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const monthStart = new Date(year, month, 1);
  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - ((monthStart.getDay() + 6) % 7));
  const dailyMinutes = records.reduce((map, post) => {
    const key = getRecordDateKey(post);
    map[key] = (map[key] || 0) + getStudyMinutes(post);
    return map;
  }, {});

  return (
    <section className={styles.studySideCard}>
      <h3>月度学习日历</h3>
      <div className={styles.studyCalendarGrid}>
        {Array.from({ length: 42 }, (_, index) => {
          const date = new Date(gridStart);
          date.setDate(gridStart.getDate() + index);
          const key = getRecordDateKey({ date: date.toISOString() });
          const minutes = dailyMinutes[key] || 0;
          const inMonth = date.getMonth() === month;

          return (
            <button
              key={key}
              type="button"
              className={styles.studyCalendarDay}
              data-active={selectedDate === key ? 'true' : undefined}
              data-has-record={minutes > 0 ? 'true' : undefined}
              data-muted={inMonth ? undefined : 'true'}
              title={`${key} ${formatStudyDuration(minutes)}`}
              onClick={() => {
                onSelectDate(key);
              }}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </section>
  );
};

const StudyCategoryPage = ({ page }) => {
  const allPeople = useMemo(
    () => Array.from(new Set(page.posts.map(getStudyPerson))).filter(Boolean),
    [page.posts],
  );
  const allCategories = useMemo(
    () =>
      Array.from(new Set(page.posts.flatMap((post) => {
        const categories = getStudyTopicCategories(post);
        return categories.length ? categories : [getStudyCategory(post)];
      }))).filter(Boolean),
    [page.posts],
  );
  const allMonths = useMemo(
    () =>
      buildStudyMonthOptions(Array.from(new Set(page.posts.map(getRecordMonthKey))).filter(Boolean)),
    [page.posts],
  );
  const [personFilter, setPersonFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const todayDateKeyRef = useRef(getTodayDateKey());
  const [monthFilter, setMonthFilter] = useState(todayDateKeyRef.current.slice(0, 7));
  const [keyword, setKeyword] = useState('');
  const [selectedDate, setSelectedDate] = useState(todayDateKeyRef.current);

  useEffect(() => {
    setMonthFilter((current) => current || allMonths[0] || '');
  }, [allMonths]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const nextToday = getTodayDateKey();
      const previousToday = todayDateKeyRef.current;

      if (nextToday !== previousToday) {
        todayDateKeyRef.current = nextToday;
        setSelectedDate((current) => (current === previousToday ? nextToday : current));
        setMonthFilter((current) =>
          current === previousToday.slice(0, 7) ? nextToday.slice(0, 7) : current,
        );
      }
    }, 60 * 1000);

    return () => window.clearInterval(timer);
  }, []);

  const filteredPosts = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return page.posts.filter((post) => {
      const personMatched = personFilter === 'all' || getStudyPerson(post) === personFilter;
      const categories = getStudyTopicCategories(post);
      const categoryMatched =
        categoryFilter === 'all' ||
        categories.includes(categoryFilter) ||
        (!categories.length && getStudyCategory(post) === categoryFilter);
      const monthMatched = !monthFilter || getRecordMonthKey(post) === monthFilter;
      const keywordMatched =
        !normalizedKeyword ||
        [post.title, post.excerpt, contentToMarkdown(post.content), ...getStudyTopicCategories(post)]
          .join(' ')
          .toLowerCase()
          .includes(normalizedKeyword);

      return personMatched && categoryMatched && monthMatched && keywordMatched;
    });
  }, [categoryFilter, keyword, monthFilter, page.posts, personFilter]);

  const timelineGroups = useMemo(() => {
    const groups = filteredPosts.reduce((map, post) => {
      const key = getRecordDateKey(post);
      map.set(key, [...(map.get(key) || []), post]);
      return map;
    }, new Map());

    const items = Array.from(groups, ([dateKey, posts]) => ({
      dateKey,
      posts: posts.sort((a, b) => getStudyPerson(a).localeCompare(getStudyPerson(b), 'zh-Hans-CN')),
    })).sort((a, b) => b.dateKey.localeCompare(a.dateKey));

    if (!selectedDate) {
      return items;
    }

    const selectedGroup = items.find((group) => group.dateKey === selectedDate);
    return selectedGroup ? [selectedGroup] : [{ dateKey: selectedDate, posts: [] }];
  }, [filteredPosts, selectedDate]);

  const monthDays = new Set(filteredPosts.map(getRecordDateKey)).size;
  const totalMinutes = filteredPosts.reduce((sum, post) => sum + getStudyMinutes(post), 0);
  const mediaCount = filteredPosts.reduce(
    (sum, post) =>
      sum +
      (Array.isArray(post.media) && post.media.length
        ? post.media.length
        : (post.image && post.image !== '/img/sky.jpg' ? 1 : 0) +
          (Array.isArray(post.videos) ? post.videos.length : 0)),
    0,
  );
  const recentCategories = Array.from(new Set(page.posts.flatMap((post) => {
    const categories = getStudyTopicCategories(post);
    return categories.length ? categories : [getStudyCategory(post)];
  }))).filter(Boolean);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const visibleRecentCategories = showAllCategories ? recentCategories : recentCategories.slice(0, 8);
  const timelinePeople = personFilter === 'all' ? allPeople : [personFilter];
  const handleSelectDate = (dateKey) => {
    setSelectedDate(dateKey);
    setMonthFilter(dateKey.slice(0, 7));
  };

  return (
    <div className={styles.studyShell}>
      <section className={styles.studyHero}>
        <div>
          <span>学习记录</span>
          <h2>今天也在进步</h2>
          <p>记录每天的课程、阅读、项目和思考，把两个人的学习节奏放在同一条时间线上。</p>
        </div>
        <div className={styles.studyHeroStats}>
          <strong>{monthDays}</strong>
          <span>本月学习天数</span>
          <strong>{formatStudyDuration(totalMinutes)}</strong>
          <span>累计学习时长</span>
        </div>
      </section>

      <section className={styles.studyFilters} aria-label="学习记录筛选">
        <div className={styles.studyPersonTabs}>
          <button
            type="button"
            className={personFilter === 'all' ? styles.studyFilterActive : undefined}
            onClick={() => setPersonFilter('all')}
          >
            全部
          </button>
          {allPeople.map((person) => (
            <button
              key={person}
              type="button"
              className={personFilter === person ? styles.studyFilterActive : undefined}
              onClick={() => setPersonFilter(person)}
            >
              {person}
            </button>
          ))}
        </div>
        <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
          <option value="all">分类：全部</option>
          {allCategories.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        <select
          value={monthFilter}
          onChange={(event) => {
            setMonthFilter(event.target.value);
            setSelectedDate('');
          }}
        >
          {allMonths.map((month) => (
            <option key={month} value={month}>{month}</option>
          ))}
        </select>
        <input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="搜索标题、标签或正文"
        />
      </section>

      <section className={styles.studyOverview}>
        <article><strong>{monthDays}</strong><span>本月天数</span></article>
        <article><strong>{formatStudyDuration(totalMinutes)}</strong><span>总学习时长</span></article>
        <article><strong>{timelineGroups.length}</strong><span>连续打卡参考</span></article>
        <article><strong>{mediaCount}</strong><span>已上传媒体</span></article>
      </section>

      <div className={styles.studyMainGrid}>
        <section className={styles.studyTimeline}>
          {timelineGroups.map((group) => (
            <article key={group.dateKey} id={`study-day-${group.dateKey}`} className={styles.studyDayGroup}>
              <h3>{formatStudyDate(group.dateKey)}</h3>
              <div className={styles.studyRecordGrid}>
                {(timelinePeople.length ? timelinePeople : ['Wray', 'danta']).map((person) => (
                  <StudyRecordCard
                    key={person}
                    person={person}
                    post={group.posts.find((post) => getStudyPerson(post) === person)}
                  />
                ))}
              </div>
            </article>
          ))}
          {timelineGroups.length === 0 && (
            <section className={styles.studyEmpty}>
              <h3>这个筛选下还没有学习记录</h3>
              <p>发布一条学习记录后，这里会按日期自动分组展示。</p>
            </section>
          )}
        </section>
        <aside className={styles.studySide}>
          <StudyCalendar
            records={filteredPosts}
            activeMonth={monthFilter}
            selectedDate={selectedDate}
            onSelectDate={handleSelectDate}
          />
          <section className={styles.studySideCard}>
            <h3>最近分类</h3>
            <div className={styles.studyTagCloud}>
              {visibleRecentCategories.map((category) => <span key={category}>{category}</span>)}
              {recentCategories.length === 0 && <p>暂无分类</p>}
            </div>
            {recentCategories.length > 8 && (
              <button
                type="button"
                className={styles.studyMoreButton}
                onClick={() => setShowAllCategories((current) => !current)}
              >
                {showAllCategories ? '收起' : 'More ›'}
              </button>
            )}
          </section>
          <section className={styles.studySideCard}>
            <h3>本月目标</h3>
            <p>保持稳定记录，把每天学到的内容留成可回看的轨迹。</p>
          </section>
        </aside>
      </div>
    </div>
  );
};

const PlainCategoryPage = ({ page }) => (
  <div className={styles.categoryShell}>
    <section className={styles.plainCategoryHeader}>
      <span>{text.category}</span>
      <h2>{page.category.name}</h2>
      <p>{page.category.description}</p>
    </section>
    <div className={styles.plainCategoryContent}>
      <PostList posts={page.posts} />
    </div>
  </div>
);

const CategoryPage = ({ page }) => {
  if (page.category.slug === 'tech') {
    return <TechCategoryPage page={page} />;
  }

  if (page.category.slug === 'essay') {
    return <EssayCategoryPage page={page} />;
  }

  if (page.category.slug === 'study') {
    return <StudyCategoryPage page={page} />;
  }

  return <PlainCategoryPage page={page} />;
};

const PostPage = ({ post, posts }) => {
  const videos = Array.isArray(post.videos) ? post.videos : [];
  const authorName = post.authorName || 'Wray';
  const authorAvatar = post.authorAvatar || '/icon/Mammon.png';
  const markdownContent = contentToMarkdown(post.content);
  const headings = useMemo(() => extractHeadings(markdownContent), [markdownContent]);
  const tocGroups = useMemo(
    () =>
      buildTocGroups(
        headings.length ? headings : [{ id: 'article-content', level: 1, text: post.title }],
      ),
    [headings, post.title],
  );
  const [comments, setComments] = useState([]);
  const [commentForm, setCommentForm] = useState({ nickname: '', email: '', content: '' });
  const [commentStatus, setCommentStatus] = useState('');
  const [articleLikes, setArticleLikes] = useState(Number(post.likes) || 0);
  const [articleLiked, setArticleLiked] = useState(Boolean(post.liked));
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [shareToast, setShareToast] = useState('');
  const postIndex = posts.findIndex((item) => item.slug === post.slug);
  const previousPost = postIndex >= 0 ? posts[postIndex + 1] : null;
  const nextPost = postIndex > 0 ? posts[postIndex - 1] : null;
  const shareUrl =
    typeof window === 'undefined'
      ? `#/post/${post.slug}`
      : `${window.location.origin}${window.location.pathname}#/post/${post.slug}`;

  useEffect(() => {
    setArticleLikes(Number(post.likes) || 0);
    setArticleLiked(Boolean(post.liked));
  }, [post.liked, post.likes]);

  useEffect(() => {
    let isMounted = true;

    fetchComments(post.slug)
      .then((items) => {
        if (isMounted) {
          setComments(items);
        }
      })
      .catch(() => {
        if (isMounted) {
          setCommentStatus(text.loadingCommentsFailed);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [post.slug]);

  useEffect(() => {
    if (!shareToast) {
      return undefined;
    }

    const timer = window.setTimeout(() => setShareToast(''), 1800);
    return () => window.clearTimeout(timer);
  }, [shareToast]);

  const markdownComponents = {
    h1: ({ children, ...props }) => {
      const value = Array.isArray(children) ? children.join('') : String(children || '');
      const id = headingIdByText(headings, value);
      return <h1 id={id} {...props}>{children}</h1>;
    },
    h2: ({ children, ...props }) => {
      const value = Array.isArray(children) ? children.join('') : String(children || '');
      const id = headingIdByText(headings, value);
      return <h2 id={id} {...props}>{children}</h2>;
    },
    h3: ({ children, ...props }) => {
      const value = Array.isArray(children) ? children.join('') : String(children || '');
      const id = headingIdByText(headings, value);
      return <h3 id={id} {...props}>{children}</h3>;
    },
  };

  const handlePostLike = async () => {
    if (articleLiked) {
      return;
    }

    try {
      const data = await likePost(post.slug);
      setArticleLikes(data.likes);
      setArticleLiked(Boolean(data.liked));
    } catch (error) {
      setCommentStatus(text.likeFailed);
    }
  };

  const submitComment = async (event) => {
    event.preventDefault();
    setCommentStatus(text.submittingComment);

    try {
      const comment = await createComment(post.slug, commentForm);
      setComments((current) => [...current, comment]);
      setCommentForm((current) => ({ ...current, content: '' }));
      setCommentStatus(text.commentSubmitted);
    } catch (error) {
      setCommentStatus(error.message);
    }
  };

  const copyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareToast(text.copied);
    } catch (error) {
      setShareToast(text.copyFailed);
    }
  };

  const scrollToHeading = (event, headingId) => {
    event.preventDefault();
    document.getElementById(headingId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className={styles.postLayout}>
      <aside className={styles.tocAside}>
        <nav className={styles.tocCard} aria-label={text.articleToc}>
          <h3>{text.articleToc}</h3>
          {tocGroups.map((group, index) => (
            <div key={group.id} className={styles.tocGroup}>
              <div className={styles.tocGroupHeader}>
                <a
                  href={`#${group.id}`}
                  className={styles.tocLink}
                  onClick={(event) => scrollToHeading(event, group.id)}
                >
                  {index + 1}. {group.text}
                </a>
              </div>
              {group.children.length > 0 && (
                <div className={styles.tocChildren}>
                  {group.children.map((child) => (
                    <a
                      key={child.id}
                      href={`#${child.id}`}
                      className={styles.tocSubLink}
                      onClick={(event) => scrollToHeading(event, child.id)}
                    >
                      {child.text}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>
      <article className={styles.articlePage}>
        <header className={styles.articleHeader}>
          <div className={styles.articleMeta}>
            <a href={`#/category/${post.categorySlug}`} className={styles.category}>
              {post.category}
            </a>
            {post.isPrivate && <span className={styles.privateChip}>{text.private}</span>}
            <span className={styles.authorMeta}>
              <img src={authorAvatar} alt="" />
              <span>{authorName}</span>
            </span>
            <span>{getPostFirstUploadDate(post)}</span>
            <span>{getPostCharacterCount(post)}字</span>
            <button
              type="button"
              className={styles.historyButton}
              onClick={() => setIsHistoryOpen(true)}
            >
              {text.history}
            </button>
          </div>
          <div className={styles.articleActions}>
            <button
              type="button"
              className={articleLiked ? styles.likeButtonActive : styles.likeButton}
              onClick={handlePostLike}
              aria-label="Like post"
            >
              <HeartIcon />
              <span>{articleLikes}</span>
            </button>
            <a href="#comments" aria-label="View comments">
              <CommentIcon />
              <span>{comments.length}</span>
            </a>
            <button type="button" onClick={() => setIsShareOpen(true)} aria-label="Share post">
              <ShareIcon />
            </button>
          </div>
        </header>
        <h2 className={styles.articleTitle} id={!headings.length ? 'article-content' : undefined}>
          {post.title}
        </h2>
        {post.locked ? (
          <div className={styles.privateNotice}>
            <h3>{text.privateTitle}</h3>
            <p>{text.privateDesc}</p>
            <a href="#/admin">{text.login}</a>
          </div>
        ) : (
          <div className={styles.articleBody}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={markdownComponents}
            >
              {markdownContent}
            </ReactMarkdown>
          </div>
        )}
        {!post.locked && videos.length > 0 && (
          <div className={styles.articleVideos}>
            {videos.map((video) => (
              <video key={video} src={video} controls preload="metadata" />
            ))}
          </div>
        )}
        <nav className={styles.postPager} aria-label="Post pager">
          {previousPost ? (
            <a href={`#/post/${previousPost.slug}`}>
              <span>&lsaquo;</span>
              <strong>{previousPost.title}</strong>
            </a>
          ) : <span />}
          {nextPost ? (
            <a href={`#/post/${nextPost.slug}`}>
              <strong>{nextPost.title}</strong>
              <span>&rsaquo;</span>
            </a>
          ) : <span />}
        </nav>
        <section className={styles.commentsSection} id="comments">
          <h3>{text.comments}</h3>
          <CommentEditor value={commentForm} onChange={setCommentForm} onSubmit={submitComment} />
          <CommentThread
            slug={post.slug}
            comments={comments}
            setComments={setComments}
            commentStatus={commentStatus}
            setCommentStatus={setCommentStatus}
          />
        </section>
      </article>
      {isShareOpen && (
        <ShareDialog
          shareUrl={shareUrl}
          title={post.title}
          shareToast={shareToast}
          onCopy={copyShareUrl}
          onClose={() => setIsShareOpen(false)}
        />
      )}
      {isHistoryOpen && <HistoryDialog post={post} onClose={() => setIsHistoryOpen(false)} />}
    </div>
  );
};

const getTagItems = (posts, fallbackTags) => {
  const tagMap = new Map();

  posts.forEach((post) => {
    (post.tags || []).forEach((tag) => {
      tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
    });
  });

  if (!tagMap.size) {
    fallbackTags.forEach((tag) => tagMap.set(tag, 1));
  }

  return Array.from(tagMap, ([name, count]) => ({ name, count })).sort((a, b) =>
    a.name.localeCompare(b.name, 'zh-Hans-CN'),
  );
};

const TagsPage = ({ siteData }) => {
  const tagItems = getTagItems(siteData.posts, siteData.tags);

  return (
    <div className={styles.singleColumnWide}>
      <section className={styles.allTagsPage}>
        <h2 className={styles.sideTitle}>{text.allTags}</h2>
        <div className={styles.allTagCloud}>
          {tagItems.map((tag) => (
            <span key={tag.name} className={styles.countTagChip}>
              #{tag.name}
              <sup>{tag.count}</sup>
            </span>
          ))}
        </div>
      </section>
    </div>
  );
};

const ServicePage = ({ service }) => (
  <div className={styles.singleColumn}>
    <section className={styles.servicePage}>
      <h2 className={styles.articleTitle}>{service.title}</h2>
      <p className={styles.sectionDesc}>{service.summary}</p>
      <div className={styles.serviceGrid}>
        {service.highlights.map((item) => (
          <article key={item} className={styles.serviceCard}>
            <h3>{item}</h3>
            <p>{text.serviceNote}</p>
          </article>
        ))}
      </div>
      <div className={styles.ctaRow}>
        {service.links.map((item) => (
          <a key={item.label} href={item.href} className={styles.ctaLink}>
            {item.label}
          </a>
        ))}
      </div>
    </section>
  </div>
);

const AboutPage = ({ siteData }) => (
  <div className={styles.singleColumn}>
    <section className={styles.aboutPage}>
      <p className={styles.sectionDesc}>{siteData.about.intro}</p>
      <div className={styles.aboutFactGrid}>
        {siteData.about.facts.map((item) => (
          <article key={item.label} className={styles.aboutFactCard}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </div>
      <h2 className={styles.aboutSectionTitle}>这个博客可以做什么</h2>
      <div className={styles.serviceGrid}>
        {siteData.about.blocks.map((block) => (
          <article key={block.title} className={styles.serviceCard}>
            <h3>{block.title}</h3>
            <p>{block.text}</p>
          </article>
        ))}
      </div>
      <h2 className={styles.aboutSectionTitle}>这几天我做了什么</h2>
      <div className={styles.aboutTimeline}>
        {siteData.about.recentWork.map((item) => (
          <article key={item.date} className={styles.aboutTimelineItem}>
            <time>{item.date}</time>
            <div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  </div>
);

const NotFoundPage = () => (
  <div className={styles.singleColumn}>
    <section className={styles.emptyState}>
      <h2>{text.notFoundTitle}</h2>
      <p>{text.notFoundDesc}</p>
      <a href="#/" className={styles.ctaLink}>{text.backHome}</a>
    </section>
  </div>
);

const HomeContent = ({ siteData, page }) => (
  <main className={styles.page}>
    {page.type === 'feed' && <FeedPage siteData={siteData} page={page} />}
    {page.type === 'category' && <CategoryPage page={page} />}
    {page.type === 'post' && <PostPage post={page.post} posts={siteData.posts} />}
    {page.type === 'service' && <ServicePage service={page.service} />}
    {page.type === 'about' && <AboutPage siteData={siteData} />}
    {page.type === 'tags' && <TagsPage siteData={siteData} />}
    {page.type === 'not-found' && <NotFoundPage />}
  </main>
);

export default HomeContent;
