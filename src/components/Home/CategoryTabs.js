import styles from './HomeContent.module.css';

const CategoryTabs = ({ categories, active }) => {
  return (
    <div className={styles.tabs}>
      {categories.map((item) => (
        <a
          key={item.slug}
          href={item.slug === 'all' ? '#/' : `#/category/${item.slug}`}
          className={item.slug === active ? styles.tabActive : styles.tab}
        >
          {item.name}
        </a>
      ))}
    </div>
  );
};

export default CategoryTabs;
