import styles from './Introduction.module.css';
import InteractiveGlobe from './InteractiveGlobe';

const Introduction = ({ hero }) => {
  return (
    <section className={styles.hero}>
      <div className={styles.backgroundGlobe}>
        <InteractiveGlobe />
      </div>
      <div className={styles.overlay} />

      <div className={styles.inner}>
        <div className={styles.copy}>
          <span className={styles.badge}>{hero.badge}</span>
          <h1 className={styles.title}>{hero.title}</h1>
          {hero.subtitle && <p className={styles.subtitle}>{hero.subtitle}</p>}
        </div>
      </div>
    </section>
  );
};

export default Introduction;
