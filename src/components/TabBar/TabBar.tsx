import styles from './TabBar.module.css';

interface TabBarProps {
  active: 'home' | 'profile';
  onHome: () => void;
  onProfile: () => void;
}

export function TabBar({ active, onHome, onProfile }: TabBarProps) {
  return (
    <div className={styles.bar}>
      <button
        type="button"
        className={styles.tab}
        style={{ color: active === 'home' ? 'var(--a-accent)' : 'var(--a-text3)' }}
        onClick={onHome}
      >
        <span className={styles.glyph}>▦</span>
        <span className={styles.label}>Уроки</span>
      </button>
      <button
        type="button"
        className={styles.tab}
        style={{ color: active === 'profile' ? 'var(--a-accent)' : 'var(--a-text3)' }}
        onClick={onProfile}
      >
        <span className={styles.glyph}>◍</span>
        <span className={styles.label}>Профиль</span>
      </button>
    </div>
  );
}
