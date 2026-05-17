import { useEffect, useMemo, useState } from 'react';
import './App.css';
import Header from './components/Header/Header';
import Introduction from './components/Hero/Introduction';
import HomeContent from './components/Home/HomeContent';
import Footer from './components/Footer/Footer';
import MusicPlayer from './components/MusicPlayer/MusicPlayer';
import AdminPage from './components/Admin/AdminPage';
import siteData from './data/siteData';
import { fetchPostBySlug, fetchPosts } from './api/posts';
import { fetchStudyRecords } from './api/studyRecords';

const getHashPath = () => window.location.hash.replace(/^#/, '') || '/';

const parseRoute = () => {
  const path = getHashPath();
  const [, section, slug, ...rest] = path.split('/');

  if (!section) {
    return { type: 'home' };
  }

  if (section === 'admin') {
    return { type: 'admin' };
  }

  if (section === 'about') {
    return { type: 'about' };
  }

  if (section === 'post' && slug) {
    return { type: 'post', slug };
  }

  if (section === 'category' && slug) {
    const decodedRest = rest.map((item) => decodeURIComponent(item));

    return {
      type: 'category',
      slug,
      topic: slug === 'tech' ? decodedRest[0] || '' : '',
      postSlug: slug === 'tech' ? decodedRest[1] || '' : decodedRest[0] || '',
    };
  }

  if (section === 'tags') {
    return { type: 'tags' };
  }

  if (section === 'service' && slug) {
    return { type: 'service', slug };
  }

  return { type: 'not-found' };
};

const deriveCategories = (baseCategories) =>
  baseCategories.filter((category) =>
    ['all', 'tech', 'essay', 'study'].includes(category.slug),
  );

const deriveTags = (posts, fallbackTags) => {
  const tags = Array.from(new Set(posts.flatMap((post) => post.tags || [])));
  return tags.length ? tags : fallbackTags;
};

const findService = (slug) =>
  siteData.services.find((item) => item.slug === slug);

function App() {
  const [route, setRoute] = useState(parseRoute);
  const [posts, setPosts] = useState(siteData.posts);
  const [studyRecords, setStudyRecords] = useState([]);
  const [remotePost, setRemotePost] = useState(null);

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(parseRoute());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    let isMounted = true;

    fetchPosts()
      .then((items) => {
        if (isMounted && items.length) {
          setPosts(items);
        }
      })
      .catch(() => {
        if (isMounted) {
          setPosts(siteData.posts);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    fetchStudyRecords()
      .then((items) => {
        if (isMounted) {
          setStudyRecords(items);
        }
      })
      .catch(() => {
        if (isMounted) {
          setStudyRecords([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    setRemotePost(null);

    if (route.type !== 'post') {
      return () => {
        isMounted = false;
      };
    }

    fetchPostBySlug(route.slug)
      .then((post) => {
        if (isMounted) {
          setRemotePost(post);
        }
      })
      .catch(() => {
        if (isMounted) {
          setRemotePost(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [route]);

  const pageData = useMemo(() => {
    const categories = deriveCategories(siteData.categories);
    const currentSiteData = {
      ...siteData,
      posts,
      categories,
      tags: deriveTags(posts, siteData.tags),
    };

    if (route.type === 'home') {
      return {
        siteData: currentSiteData,
        hero: currentSiteData.hero,
        page: {
          type: 'feed',
          activeCategory: 'all',
          posts,
        },
      };
    }

    if (route.type === 'category') {
      const category = categories.find((item) => item.slug === route.slug);

      if (!category) {
        return {
          siteData: currentSiteData,
          hero: currentSiteData.notFound.hero,
          page: { type: 'not-found' },
        };
      }

      return {
        siteData: currentSiteData,
        hero: {
          title: category.name,
          subtitle: category.description,
          badge: '分类页',
          image: category.image,
        },
        page: {
          type: 'category',
          category,
          activeCategory: category.slug,
          activeTopic: route.topic || '',
          activePostSlug: route.postSlug || '',
          posts:
            category.slug === 'study'
              ? studyRecords
              : posts.filter((post) => post.categorySlug === category.slug),
        },
      };
    }

    if (route.type === 'post') {
      const post = remotePost || posts.find((item) => item.slug === route.slug);

      if (!post) {
        return {
          siteData: currentSiteData,
          hero: currentSiteData.notFound.hero,
          page: { type: 'not-found' },
        };
      }

      if (post.categorySlug === 'tech' || post.categorySlug === 'essay') {
        const category = categories.find((item) => item.slug === post.categorySlug);
        const topic = post.categorySlug === 'tech' ? post.techTopic || 'Python' : '';
        const categoryPosts = posts.filter((item) => item.categorySlug === post.categorySlug);
        const categoryPagePosts = categoryPosts.some((item) => item.slug === post.slug)
          ? categoryPosts
          : [post, ...categoryPosts];

        return {
          siteData: currentSiteData,
          hero: {
            title: category?.name || post.category,
            subtitle: category?.description || '',
            badge: '分类页',
            image: category?.image || post.image,
          },
          page: {
            type: 'category',
            category: category || {
              name: post.category,
              slug: post.categorySlug,
              description: '',
            },
            activeCategory: post.categorySlug,
            activeTopic: topic,
            activePostSlug: post.slug,
            posts: categoryPagePosts,
          },
        };
      }

      return {
        siteData: currentSiteData,
        hero: {
          title: post.title,
          subtitle: '',
          badge: post.category,
          image: post.image,
        },
        page: {
          type: 'post',
          post,
        },
      };
    }

    if (route.type === 'service') {
      const service = findService(route.slug);

      if (!service) {
        return {
          siteData: currentSiteData,
          hero: currentSiteData.notFound.hero,
          page: { type: 'not-found' },
        };
      }

      return {
        siteData: currentSiteData,
        hero: {
          title: service.title,
          subtitle: service.summary,
          badge: '功能页',
          image: service.image,
        },
        page: {
          type: 'service',
          service,
        },
      };
    }

    if (route.type === 'about') {
      return {
        siteData: currentSiteData,
        hero: currentSiteData.about.hero,
        page: {
          type: 'about',
        },
      };
    }

    if (route.type === 'tags') {
      return {
        siteData: currentSiteData,
        hero: {
          title: '所有标签',
          subtitle: '按标签快速查看站内内容主题。',
          badge: 'Tags',
          image: currentSiteData.hero.image,
        },
        page: {
          type: 'tags',
        },
      };
    }

    return {
      siteData: currentSiteData,
      hero: currentSiteData.notFound.hero,
      page: { type: 'not-found' },
    };
  }, [posts, remotePost, route, studyRecords]);

  if (route.type === 'admin') {
    return <AdminPage />;
  }

  return (
    <div id="App" className="appShell">
      <Header navItems={pageData.siteData.navItems} posts={pageData.siteData.posts} />
      {pageData.page.type !== 'category' && <Introduction hero={pageData.hero} />}
      <HomeContent siteData={pageData.siteData} page={pageData.page} />
      <Footer siteData={pageData.siteData} />
      <MusicPlayer />
    </div>
  );
}

export default App;
