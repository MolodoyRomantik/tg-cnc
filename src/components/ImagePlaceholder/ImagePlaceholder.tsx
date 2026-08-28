import styles from './ImagePlaceholder.module.css';

interface ImagePlaceholderProps {
  height: number;
  caption?: string;
}

export function ImagePlaceholder({ height, caption = 'Схема появится позже' }: ImagePlaceholderProps) {
  return (
    <div className={styles.box} style={{ height }}>
      <span className={styles.caption}>{caption}</span>
    </div>
  );
}
