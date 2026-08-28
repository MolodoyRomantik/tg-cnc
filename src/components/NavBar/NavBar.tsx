import styles from './NavBar.module.css';

interface NavBarProps {
  title: string;
  showBack: boolean;
  onBack: () => void;
}

export function NavBar({ title, showBack, onBack }: NavBarProps) {
  return (
    <div className={styles.bar}>
      {showBack ? (
        <button type="button" className={styles.back} onClick={onBack}>
          ‹ Назад
        </button>
      ) : (
        <span className={styles.spacer} />
      )}
      <span className={styles.title}>{title}</span>
      <span className={styles.dots}>···</span>
    </div>
  );
}
