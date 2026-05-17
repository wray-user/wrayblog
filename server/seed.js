// seed.js 用来把前端已有的静态文章一次性导入 MongoDB。
// 运行方式：在 server 目录执行 npm run seed。

// fs/path 用来读取同目录下的 .env 配置文件。
const fs = require('fs');
const path = require('path');

// mongoose 用来连接 MongoDB。
const mongoose = require('mongoose');

// Post 是文章数据模型，导入数据时会通过它写入 posts 集合。
const Post = require('./models/Post');

// 这里放从 wrayblog/src/data/siteData.js 迁移过来的文章。
// 后续你新增文章，也可以先在这里补一条，再重新运行 npm run seed。
const seedPosts = [
  {
    id: 1,
    slug: 'blog-structure-refresh',
    category: '技术分享',
    categorySlug: 'tech',
    tags: ['React', '组件化', '博客'],
    title: '把博客首页拆成可维护的结构',
    excerpt:
      '首页看起来像一张图，真正做起来其实是导航、横幅、文章流、侧边栏和详情页共同协作的结果。先把数据和视图拆开，后面再接接口就会轻松很多。',
    date: '2026-05-06',
    readTime: '5 min',
    image: '/img/dragon.jpg',
    content: [
      '这次改造的第一步不是盲目堆样式，而是先把页面信息拆成几个稳定区域：顶部导航、Hero、分类入口、文章流和右侧资料卡。',
      '一旦页面的数据源被统一到一个配置文件中，导航跳转、分类过滤和文章详情都可以共用一套数据，不需要每个组件自己写死内容。',
      '这样做的结果是，后续你想继续加新文章、加服务入口，或者把静态数据替换成接口返回值，修改成本都会低很多。',
    ],
  },
  {
    id: 2,
    slug: 'quietly-build-long-term',
    category: '心情随笔',
    categorySlug: 'essay',
    tags: ['长期主义', '记录', '思考'],
    title: '安静地持续更新，比一次性做很大更重要',
    excerpt:
      '很多个人站最后停止更新，不是因为不会做，而是因为一开始做得太重。给自己留下可以稳定更新的节奏，网站才会真的活起来。',
    date: '2026-04-28',
    readTime: '4 min',
    image: '/img/Twinkle.jpg',
    content: [
      '个人博客的价值，不只在于展示成品，也在于留下过程。哪怕每次只写一点，也是在给未来的自己积累可回看的坐标。',
      '相比“必须写得很完整才发”，更好的策略通常是先发一个清晰版本，再持续补充。网站也适合用这种方式迭代。',
      '参考站最大的优点之一，就是信息组织得很明确，访问者一眼就知道作者写了什么、关心什么、还提供了哪些服务入口。',
    ],
  },
  {
    id: 3,
    slug: 'monitoring-page-design',
    category: '技术分享',
    categorySlug: 'tech',
    tags: ['监控', '导航', '信息架构'],
    title: '服务型导航页应该怎么设计',
    excerpt:
      '图床、邮局、统计、监控这类功能，本质上不是文章，而是站点能力。把它们放进独立页面，用户会更容易理解每个入口的用途。',
    date: '2026-04-19',
    readTime: '6 min',
    image: '/img/girl.jpg',
    content: [
      '当一个博客开始承载多种功能时，首页只负责展示重点，具体服务则应该进入单独页面，这样既不会打乱文章阅读，也方便后续扩展。',
      '服务页面通常适合由标题、用途说明、能力卡片、常用入口和状态说明组成，重点是帮助访问者快速判断“这是什么”和“我下一步该点哪里”。',
    ],
  },
  {
    id: 4,
    slug: 'daily-observation-interface',
    category: '生活观察',
    categorySlug: 'life',
    tags: ['生活', '设计', '节奏'],
    title: '一个像博客的首页，也要有自己的节奏感',
    excerpt:
      '好的首页不只是把模块摆上去，还要让视线自然地从标题、分类、文章，再移动到作者信息和常用链接，形成一条舒服的浏览路线。',
    date: '2026-04-05',
    readTime: '3 min',
    image: '/img/car.jpg',
    content: [
      '参考站首页的优点，是先给出明确的身份信息，再展示最新内容，最后用侧边栏补充作者简介、统计信息和热门文章。',
      '这种结构很适合个人博客，因为它同时照顾了第一次来的访客和已经知道你是谁、只想快速找内容的老访客。',
    ],
  },
];

// 读取 server/.env 文件，把里面的 KEY=VALUE 写入 process.env。
const loadEnvFile = () => {
  const envPath = path.join(__dirname, '.env');

  // 服务器上如果没有 .env，就继续使用默认数据库地址。
  if (!fs.existsSync(envPath)) {
    return;
  }

  fs.readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .forEach((line) => {
      const trimmed = line.trim();

      // 空行和注释行不处理。
      if (!trimmed || trimmed.startsWith('#')) {
        return;
      }

      const separatorIndex = trimmed.indexOf('=');

      // 没有等号就不是合法配置行，直接跳过。
      if (separatorIndex === -1) {
        return;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();

      // 已经存在的环境变量优先级更高，所以这里不覆盖。
      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    });
};

// 把文章整理成后端模型需要的字段，避免把前端无关字段直接塞进数据库。
const normalizePost = (post) => ({
  title: post.title,
  slug: post.slug,
  excerpt: post.excerpt,
  content: post.content,
  category: post.category,
  categorySlug: post.categorySlug,
  tags: Array.isArray(post.tags) ? post.tags : [],
  image: post.image,
  readTime: post.readTime,
  date: post.date,
  views: Number(post.views) || 0,
  published: true,
  createAt: post.date ? new Date(`${post.date}T00:00:00.000Z`) : new Date(),
  updatedAt: new Date(),
});

// 执行导入逻辑。
const seed = async () => {
  loadEnvFile();

  // 优先使用 .env 的 MONGODB_URI；没有就连接本机 wrayblog 数据库。
  const mongoUri =
    process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wrayblog';

  await mongoose.connect(mongoUri);
  console.log('MongoDB connected');

  // 使用 bulkWrite 按 slug upsert：
  // 已存在的文章会更新，不存在的文章会新增，所以重复运行不会插入重复数据。
  const result = await Post.bulkWrite(
    seedPosts.map((post) => ({
      updateOne: {
        filter: { slug: post.slug },
        update: { $set: normalizePost(post) },
        upsert: true,
      },
    })),
  );

  console.log(
    `Seed finished: inserted ${result.upsertedCount}, updated ${result.modifiedCount}`,
  );

  await mongoose.disconnect();
};

// 捕获导入过程里的错误，方便在终端看到失败原因。
seed().catch(async (error) => {
  console.error('Seed failed:', error.message);
  await mongoose.disconnect();
  process.exit(1);
});
