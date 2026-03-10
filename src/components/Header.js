import styles from './Header.module.css';



const Card = ({title, content, videoUrl}) => {   /* {title, content, imageUrl} */
    return (
        <div className={styles.container}>
            {/* // 如果是图片 */}
            {/* {imageUrl && <img src={imageUrl} alt={title} className={styles.imge}/>} */}

            {/* // 如果是视频 &&：逻辑与运算符，规则是「左边为真，才执行右边」； */}
            {videoUrl && <video src={videoUrl} alt={title} className={styles.video}  
            autoPlay muted loop playsInline preload="auto"  
            />}     

            <h3 className={styles.title}>{title}</h3>
            <p className={styles.content}>{content}</p>
        </div>
    )
}

export default Card; 