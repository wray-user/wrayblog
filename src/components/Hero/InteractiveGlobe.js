import styles from './Introduction.module.css';

const InteractiveGlobe = () => {
  return (
    <iframe
      className={styles.globeFrame}
      src="https://threejsearth.web.app/"
      title="Three.js Earth"
      loading="lazy"
      allow="fullscreen"
    />
  );
};

export default InteractiveGlobe;
