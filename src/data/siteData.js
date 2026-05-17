const siteData = {
  hero: {
    title: 'Wray 笔记',
    subtitle: '记录蜕变后的自己',
    badge: '首页',
    image: '/img/sky.jpg',
  },
  navItems: [
    { label: '首页', href: '#/' },
    { label: '图床', href: '#/service/image-host' },
    { label: '邮局', href: '#/service/mail' },
    { label: '资源', href: '#/service/resources' },
    { label: '统计', href: '#/service/analytics' },
    { label: '监控', href: '#/service/monitoring' },
    { label: '网盘', href: '#/service/drive' },
    { label: '探针', href: '#/service/probe' },
    { label: '关于我', href: '#/about' },
    { label: '开往', href: '#/service/travelling' },
  ],
  categories: [
    {
      slug: 'all',
      name: 'All',
      description: '查看全部文章。',
      image: '/img/sky.jpg',
    },
    {
      slug: 'tech',
      name: '技术分享',
      description: '前端、部署、工具和踩坑记录。',
      image: '/img/dragon.jpg',
    },
    {
      slug: 'essay',
      name: '心情随笔',
      description: '偏感受、观点和个人记录的内容。',
      image: '/img/Twinkle.jpg',
    },
    {
      slug: 'study',
      name: '学习记录',
      description: '课程、工具、读书和长期学习笔记。',
      image: '/img/sky.jpg',
    },
  ],
  posts: [
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
  ],
  profile: {
    name: 'Wray 笔记',
    description: '记录技术、观察和日常思考，慢慢把个人站做成一个长期更新的数字据点。',
    avatar: '/icon/Mammon.png',
    stats: [
      { label: '文章', value: '24' },
      { label: '分类', value: '3' },
      { label: '标签', value: '18' },
      { label: '访问', value: '12.8K' },
    ],
    socialLinks: [
      {
        label: 'GitHub',
        href: 'https://github.com/wray-user',
        icon: '/icon/github.svg',
      },
      {
        label: 'Gmail',
        href: 'https://mail.google.com/mail/?view=cm&fs=1&to=wray4424@gmail.com',
        icon: '/icon/gmail.svg',
      },
      {
        label: '微信',
        icon: '/icon/wechat.svg',
        qrCode: '/icon/wechat-qr.svg',
      },
    ],
  },
  popularPosts: [
    { title: '把博客首页拆成可维护的结构', href: '#/post/blog-structure-refresh' },
    { title: '服务型导航页应该怎么设计', href: '#/post/monitoring-page-design' },
    { title: '安静地持续更新，比一次性做很大更重要', href: '#/post/quietly-build-long-term' },
  ],
  tags: ['React', '组件化', '博客', '监控', '部署', '生活', '长期主义', '记录'],
  services: [
    {
      slug: 'image-host',
      title: '图床',
      summary: '统一放置文章配图、封面和外链图片，让内容管理更轻。',
      image: '/img/girl.jpg',
      highlights: ['拖拽上传体验', '统一外链地址', '适合文章封面管理'],
      links: [
        { label: '返回首页', href: '#/' },
        { label: '查看技术文章', href: '#/category/tech' },
      ],
    },
    {
      slug: 'mail',
      title: '邮局',
      summary: '作为个人站的通信入口，适合放邮箱说明、联系渠道和常见回复方式。',
      image: '/img/sky.jpg',
      highlights: ['联系说明', '合作方式', '常见问题整理'],
      links: [
        { label: '关于我', href: '#/about' },
        { label: '返回首页', href: '#/' },
      ],
    },
    {
      slug: 'resources',
      title: '资源',
      summary: '集中整理常用资料、工具入口、下载链接和学习素材，方便后续持续扩展。',
      image: '/img/Twinkle.jpg',
      highlights: ['资料整理', '工具入口', '学习素材'],
      links: [
        { label: '返回首页', href: '#/' },
        { label: '学习记录', href: '#/category/study' },
      ],
    },
    {
      slug: 'analytics',
      title: '统计',
      summary: '集中展示访问量、来源趋势和内容表现，让博客增长更可见。',
      image: '/img/car.jpg',
      highlights: ['访问概览', '热门文章表现', '内容迭代依据'],
      links: [
        { label: '热门文章', href: '#/post/blog-structure-refresh' },
        { label: '返回首页', href: '#/' },
      ],
    },
    {
      slug: 'monitoring',
      title: '监控',
      summary: '监控页适合放站点在线状态、接口探活和运行说明。',
      image: '/img/dragon.jpg',
      highlights: ['在线状态面板', '服务可用性说明', '问题排查入口'],
      links: [
        { label: '查看服务设计文章', href: '#/post/monitoring-page-design' },
        { label: '返回首页', href: '#/' },
      ],
    },
    {
      slug: 'drive',
      title: '网盘',
      summary: '用于整理资料下载、模板归档和站点资源备份。',
      image: '/img/Twinkle.jpg',
      highlights: ['资料归档', '资源下载', '内容备份说明'],
      links: [
        { label: '返回首页', href: '#/' },
        { label: '关于我', href: '#/about' },
      ],
    },
    {
      slug: 'probe',
      title: '探针',
      summary: '展示服务器基础信息、运行环境和节点状态，适合运维类博客。',
      image: '/img/girl.jpg',
      highlights: ['节点信息', '资源占用概览', '运维调试展示'],
      links: [
        { label: '技术分享', href: '#/category/tech' },
        { label: '返回首页', href: '#/' },
      ],
    },
    {
      slug: 'travelling',
      title: '开往',
      summary: '友情链接或站点互访入口，帮助博客接入更大的独立站生态。',
      image: '/img/sky.jpg',
      highlights: ['朋友站点集合', '站点互访', '生态联动入口'],
      links: [
        { label: '关于我', href: '#/about' },
        { label: '返回首页', href: '#/' },
      ],
    },
  ],
  about: {
    hero: {
      title: '关于我',
      subtitle: '这里记录 Wray 笔记的建站时间、功能边界和最近几天的迭代轨迹。',
      badge: 'About',
      image: '/img/car.jpg',
    },
    intro:
      '我是 Wray，这个博客从 2026-05-01 00:00 开始运行。它最初是一个用来记录技术、观察和日常思考的个人站，现在正在慢慢长成一个可以写文章、管理学习记录、发布内容、统计访问和承载个人服务入口的数字据点。',
    facts: [
      { label: '建站时间', value: '2026-05-01 00:00' },
      { label: '技术栈', value: 'React 19 / Express 5 / MongoDB' },
      { label: '内容方向', value: '技术分享、心情随笔、学习记录' },
      { label: '站点形态', value: '前后端分离的个人博客与内容后台' },
    ],
    blocks: [
      {
        title: '文章与专题',
        text: '博客支持技术分享、心情随笔和学习记录三类内容。技术文章可以按 Python、C 语言、React、Linux、Git 等专题继续细分，方便以后把零散笔记沉淀成可检索的知识库。',
      },
      {
        title: '后台发布',
        text: '后台可以登录、创建和编辑文章，支持草稿、公开/私密、历史记录、封面图、视频和媒体上传。私密文章在未登录时会隐藏正文，只保留提示。',
      },
      {
        title: '学习记录',
        text: '学习页可以按日期、成员、分类和月份整理每天学到的内容，展示学习时长、主题、媒体资料和月度日历，让进步不只是记忆里的感觉。',
      },
      {
        title: '互动与统计',
        text: '文章页支持目录、阅读字数、评论、回复、点赞、分享和浏览统计；侧边资料卡会显示文章、评论、标签和访问量。',
      },
      {
        title: '站点服务入口',
        text: '导航里预留了图床、邮局、资源、统计、监控、网盘、探针和开往等独立功能页，后续可以逐步接入真实服务地址。',
      },
      {
        title: '自动化能力',
        text: '后端已经预留 Agent 发布接口、发布锁、访问里程碑提醒和 OpenClaw 通知，用来让内容更新、学习记录和站点提醒更自动化。',
      },
    ],
    recentWork: [
      {
        date: '2026-05-08',
        title: '打好前端视觉和社交基础',
        text: '整理首页视觉、音乐播放器、页脚、头像和 GitHub/Gmail/微信等联系入口，让站点先有一个稳定可看的外壳。',
      },
      {
        date: '2026-05-09',
        title: '搭起后端和部署骨架',
        text: '补齐 Express 服务、MongoDB 模型、种子数据、部署说明和环境配置，博客开始从静态页面转向可持久化的数据系统。',
      },
      {
        date: '2026-05-10',
        title: '接入文章互动',
        text: '加入文章接口、评论接口、点赞、分享和文章详情阅读体验，开始让内容页不只是展示文字，也能留下反馈。',
      },
      {
        date: '2026-05-11',
        title: '完善后台、学习记录和分类页',
        text: '扩展后台编辑器、学习记录模型、分类专题页、文章历史、媒体上传和头部导航，把日常写作和学习打卡流程连起来。',
      },
      {
        date: '2026-05-12',
        title: '补上自动化、通知和发布安全',
        text: '增加 OpenClaw 通知、访问里程碑提醒、Agent 发布接口、发布锁、站点统计和构建产物，给后续持续更新留出更稳的通道。',
      },
    ],
  },
  notFound: {
    hero: {
      title: '页面不存在',
      subtitle: '这个地址还没有对应内容，我已经给你保留了统一的异常落点。',
      badge: '404',
      image: '/img/Twinkle.jpg',
    },
  },
};

export default siteData;
