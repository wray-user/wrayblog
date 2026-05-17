import { useEffect, useMemo, useState } from 'react';
import styles from './HomeContent.module.css';

const formatCount = (value) => {
  const number = Number(value) || 0;

  if (number >= 10000) {
    return `${Number((number / 1000).toFixed(1))}K`;
  }

  return number.toLocaleString();
};

const getFallbackStats = ({ posts, categories, tags }) => ({
  articles: posts.length,
  comments: 0,
  tags: tags.length,
  visits: 0,
});

const createStatItems = (stats) => [
  { label: '文章', value: formatCount(stats.articles) },
  { label: '评论', value: formatCount(stats.comments) },
  { label: '标签', value: formatCount(stats.tags) },
  { label: '访问', value: formatCount(stats.visits) },
];

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

  return Array.from(tagMap, ([name, count]) => ({ name, count }));
};

const loadStats = async (signal) => {
  const apiBaseUrl = process.env.REACT_APP_API_BASE_URL;
  const response = await fetch(
    apiBaseUrl ? `${apiBaseUrl}/api/stats` : '/api/stats',
    { signal },
  );

  if (!response.ok) {
    throw new Error('Failed to load stats');
  }

  return response.json();
};

const SITE_STARTED_AT = new Date('2026-05-01T00:00:00+08:00').getTime();

const getRunningTime = () => {
  const diffSeconds = Math.max(0, Math.floor((Date.now() - SITE_STARTED_AT) / 1000));
  const days = Math.floor(diffSeconds / 86400);
  const hours = Math.floor((diffSeconds % 86400) / 3600);
  const minutes = Math.floor((diffSeconds % 3600) / 60);
  const seconds = diffSeconds % 60;

  return `网站运行 ${days} 天 ${String(hours).padStart(2, '0')} 小时 ${String(
    minutes,
  ).padStart(2, '0')} 分 ${String(seconds).padStart(2, '0')} 秒`;
};

const ProfileCard = ({ profile, posts, categories, tags }) => {
  const fallbackStats = useMemo(
    () => getFallbackStats({ posts, categories, tags }),
    [posts, categories, tags],
  );
  const [stats, setStats] = useState(fallbackStats);
  const [runningTime, setRunningTime] = useState(getRunningTime);
  const tagItems = useMemo(() => getTagItems(posts, tags).slice(0, 12), [posts, tags]);

  useEffect(() => {
    const controller = new AbortController();

    setStats(fallbackStats);

    loadStats(controller.signal)
      .then((data) => {
        setStats({
          articles: data.articles ?? fallbackStats.articles,
          comments: data.comments ?? fallbackStats.comments,
          tags: data.tags ?? fallbackStats.tags,
          visits: data.visits ?? fallbackStats.visits,
        });
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setStats(fallbackStats);
        }
      });

    return () => controller.abort();
  }, [fallbackStats]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRunningTime(getRunningTime());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className={styles.sidebarStack}>
      <section className={styles.profileCard}>
        <img src={profile.avatar} alt={profile.name} className={styles.avatar} />

        <h3 className={styles.profileName}>{profile.name}</h3>
        <p className={styles.profileDesc}>{runningTime}</p>

        <div className={styles.stats}>
          {createStatItems(stats).map((item) => (
            <div key={item.label} className={styles.statItem}>
              <strong>{item.value}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        <div className={styles.socialLinks}>
          {profile.socialLinks.map((item) =>
            item.qrCode ? (
              <div key={item.label} className={styles.socialQrItem}>
                <button type="button" className={styles.socialIconButton}>
                  <img src={item.icon} alt={item.label} />
                </button>
                <div className={styles.qrPopover}>
                  <img src={item.qrCode} alt={`${item.label} QR code`} />
                </div>
              </div>
            ) : (
              <a
                key={item.label}
                href={item.href}
                className={styles.socialIconButton}
                target="_blank"
                rel="noreferrer"
                aria-label={item.label}
              >
                <img src={item.icon} alt="" />
              </a>
            ),
          )}
        </div>
      </section>

      <section className={styles.sideCard}>
        <div className={styles.sideCardHeader}>
          <h3 className={styles.sideTitle}>Tags</h3>
          <a href="#/tags" className={styles.moreLink}>
            More
            <span aria-hidden="true">&rsaquo;</span>
          </a>
        </div>
        <div className={styles.tagCloud}>
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

export default ProfileCard;
