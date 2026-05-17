import styles from './Bg.module.css'
import BlogEditor from '../MainContent/BlogEditor';

const Bg = () => {
    return (
        <div className={styles.background}>
              <main>
        <BlogEditor />
      </main>
        </div>
        
    )
}

export default Bg;