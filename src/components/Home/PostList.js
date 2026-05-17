import styles from './HomeContent.module.css';

const MetaIcon = ({ children }) => (
  <span className={styles.postMetaIcon} aria-hidden="true">
    {children}
  </span>
);

const getCharacterCount = (post) => {
  const raw = Array.isArray(post.content)
    ? post.content.join('\n')
    : String(post.content || post.excerpt || '');
  const text = raw
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<video[\s\S]*?<\/video>/gi, ' ')
    .replace(/<img[\s\S]*?>/gi, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#*_`~>|-]/g, ' ')
    .replace(/\s+/g, '');

  return text.length || String(post.excerpt || '').replace(/\s+/g, '').length;
};

const getPublishedDate = (post) => {
  const value = post.createAt || post.createdAt || post.date || post.updatedAt;
  const date = value ? new Date(value) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return '';
  }

  const pad = (number) => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const getPostHref = (post) => {
  if (post.categorySlug === 'tech') {
    const topic = post.techTopic || 'Python';
    return `#/category/tech/${encodeURIComponent(topic)}/${encodeURIComponent(post.slug)}`;
  }

  if (post.categorySlug === 'essay') {
    return `#/category/essay/${encodeURIComponent(post.slug)}`;
  }

  return `#/post/${post.slug}`;
};

const PostList = ({ posts }) => (
  <div className={styles.postList}>
    {posts.map((post) => {
      const tags = Array.isArray(post.tags) ? post.tags : [];
      const characterCount = getCharacterCount(post);
      const authorName = post.authorName || 'Wray';
      const authorAvatar = post.authorAvatar || '/icon/Mammon.png';
      const postHref = getPostHref(post);
      const publishedDate = getPublishedDate(post);

      return (
        <article key={post.id || post.slug} className={styles.postCard}>
          <div className={styles.postBody}>
            <div className={styles.metaRow}>
              <a href={`#/category/${post.categorySlug}`} className={styles.category}>
                {post.category}
              </a>
              {post.isPrivate && <span className={styles.privateListChip}>私密</span>}
              <span className={styles.tags}>
                {tags.map((tag) => `#${tag}`).join('  ')}
              </span>
            </div>

            <h2 className={styles.postTitle}>
              <a href={postHref} className={styles.postTitleLink}>
                {post.title}
              </a>
            </h2>
            <p className={styles.postExcerpt}>{post.excerpt}</p>

            <div className={styles.postFooter}>
              <span className={styles.authorMeta}>
                <img src={authorAvatar} alt="" />
                <span>{authorName}</span>
              </span>
              {publishedDate && <span>Published on {publishedDate}</span>}
              <span>
                <MetaIcon>¶</MetaIcon>
                {characterCount}字
              </span>
            </div>
          </div>

          <a href={postHref} className={styles.postImageWrap}>
            <img src={post.image} alt={post.title} className={styles.postImage} />
          </a>
        </article>
      );
    })}
  </div>
);

export default PostList;
