import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './Header.module.css';

const LOGIN_AVATAR_URL =
  'https://frank2019.life/themes/theme-earth/assets/images/default-avatar.svg?v=1.15.3';

const themeOptions = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
];

const SunIcon = () => (
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

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20.2 14.4A7.5 7.5 0 0 1 9.6 3.8 8.6 8.6 0 1 0 20.2 14.4Z" />
  </svg>
);

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-4.6-4.6" />
  </svg>
);

const getStoredTheme = () => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const mode = window.localStorage.getItem('themeMode');
  return mode === 'dark' || mode === 'light' ? mode : 'light';
};

const Header = ({ navItems, posts = [] }) => {
  const [themeMode, setThemeMode] = useState(getStoredTheme);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const themePickerRef = useRef(null);
  const searchInputRef = useRef(null);

  const searchResults = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    if (!keyword) {
      return [];
    }

    return posts.filter((post) => {
      const contentText = Array.isArray(post.content)
        ? post.content.join(' ')
        : String(post.content || '');
      const searchableText = [
        post.title,
        post.excerpt,
        post.category,
        ...(post.tags || []),
        contentText,
      ]
        .join(' ')
        .toLowerCase();

      return searchableText.includes(keyword);
    });
  }, [posts, searchKeyword]);

  useEffect(() => {
    const root = document.documentElement;

    root.setAttribute('data-theme', themeMode);

    window.localStorage.setItem('themeMode', themeMode);
  }, [themeMode]);

  useEffect(() => {
    if (!isThemeMenuOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!themePickerRef.current?.contains(event.target)) {
        setIsThemeMenuOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsThemeMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isThemeMenuOpen]);

  useEffect(() => {
    if (!isSearchOpen) {
      return undefined;
    }

    searchInputRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen]);

  const renderThemeIcon = (mode) => {
    if (mode === 'dark') {
      return <MoonIcon />;
    }

    return <SunIcon />;
  };

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <a className={styles.brand} href="#/" aria-label="返回首页">
          <img src="/img/嘟嘟.png" alt="站点头像" className={styles.logo} />
        </a>

        <nav className={styles.nav} aria-label="站点导航">
          {navItems.map((item) => (
            <a key={item.label} href={item.href} className={styles.navItem}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className={styles.actions}>
          <div className={styles.themePicker} ref={themePickerRef}>
            <button
              className={styles.iconButton}
              type="button"
              aria-expanded={isThemeMenuOpen}
              aria-haspopup="menu"
              onClick={() => setIsThemeMenuOpen((isOpen) => !isOpen)}
              aria-label="调整页面模式"
            >
              {renderThemeIcon(themeMode)}
            </button>

            <div
              className={`${styles.themeMenu} ${isThemeMenuOpen ? styles.themeMenuOpen : ''}`}
              role="menu"
            >
              {themeOptions.map((option) => (
                <button
                  key={option.value}
                  className={styles.themeOption}
                  type="button"
                  role="menuitemradio"
                  aria-checked={themeMode === option.value}
                  onClick={() => {
                    setThemeMode(option.value);
                    setIsThemeMenuOpen(false);
                  }}
                >
                  {renderThemeIcon(option.value)}
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            className={styles.iconButton}
            type="button"
            aria-label="搜索"
            onClick={() => setIsSearchOpen(true)}
          >
            <SearchIcon />
          </button>

          <a className={styles.iconButton} href="#/admin" aria-label="后端管理登录">
            <img src={LOGIN_AVATAR_URL} alt="" className={styles.avatarIcon} />
            <span className={styles.loginTooltip}>Login</span>
          </a>
        </div>
      </div>

      {isSearchOpen && (
        <div className={styles.searchLayer} role="dialog" aria-modal="true" aria-label="搜索文章">
          <button
            className={styles.searchBackdrop}
            type="button"
            aria-label="关闭搜索"
            onClick={() => setIsSearchOpen(false)}
          />

          <div className={styles.searchPanel}>
            <div className={styles.searchBox}>
              <SearchIcon />
              <input
                ref={searchInputRef}
                value={searchKeyword}
                type="search"
                placeholder="输入关键词以搜索"
                aria-label="搜索关键词"
                onChange={(event) => setSearchKeyword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && searchResults[0]) {
                    window.location.hash = `#/post/${searchResults[0].slug}`;
                    setIsSearchOpen(false);
                  }
                }}
              />
            </div>

            <div className={styles.searchResults}>
              {searchKeyword.trim() && searchResults.length > 0 ? (
                searchResults.map((post) => (
                  <a
                    key={post.id}
                    className={styles.searchResult}
                    href={`#/post/${post.slug}`}
                    onClick={() => setIsSearchOpen(false)}
                  >
                    <strong>{post.title}</strong>
                    <span>{post.excerpt}</span>
                  </a>
                ))
              ) : (
                <p className={styles.emptySearch}>
                  {searchKeyword.trim() ? '没有搜索结果' : '输入关键词搜索文章'}
                </p>
              )}
            </div>

            <div className={styles.searchFooter}>
              <span>Enter 打开</span>
              <span>Esc 关闭</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
