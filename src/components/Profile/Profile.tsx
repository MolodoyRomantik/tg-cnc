import type { Level } from '../../types/curriculum';
import {
  computeAccuracy,
  computeLevel,
  computeSolved,
  computeStreak,
  computeWeekActivity,
  computeXp,
  type ProgressState,
} from '../../state/progress';
import { formatRelativeDate } from '../../lib/date';
import { getTelegramUser } from '../../telegram';
import styles from './Profile.module.css';

interface ProfileProps {
  levels: Level[];
  progress: ProgressState;
}

const WEEKDAY_LABELS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

function findLessonTitle(levels: Level[], lessonId: string): string {
  for (const level of levels) {
    const lesson = level.lessons.find((ls) => ls.id === lessonId);
    if (lesson) return lesson.title;
  }
  return lessonId;
}

export function Profile({ levels, progress }: ProfileProps) {
  const user = getTelegramUser();
  const xp = computeXp(progress);
  const { level, into, goal } = computeLevel(xp);
  const streak = computeStreak(progress);
  const solved = computeSolved(progress);
  const accuracy = computeAccuracy(progress);
  const lessonsStarted = Object.keys(progress.lessons).length;
  const week = computeWeekActivity(progress);

  const lessonTotal = levels.reduce((n, lv) => n + lv.lessons.length, 0);
  const closedLevels = levels.filter((lv) => lv.lessons.every((ls) => progress.lessons[ls.id]?.passed)).length;
  const flawlessLessons = Object.values(progress.lessons).filter(
    (lp) => lp.total > 0 && lp.best === lp.total,
  ).length;

  const badges = [
    { glyph: String(closedLevels), label: 'Уровни\nзакрыты', achieved: closedLevels > 0 },
    { glyph: String(flawlessLessons), label: 'Тесты\nбез ошибок', achieved: flawlessLessons > 0 },
    { glyph: String(lessonTotal), label: 'Уроков\nпройдено', achieved: closedLevels === levels.length },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.avatar}>
          {user?.photoUrl ? (
            <img src={user.photoUrl} alt="" className={styles.avatarImg} />
          ) : (
            <span className={styles.avatarInitial}>{(user?.name ?? 'Т')[0]}</span>
          )}
        </div>
        <div className={styles.headerBody}>
          <span className={styles.name}>{user?.name ?? 'Токарь-программист'}</span>
          <span className={styles.subtitle}>Оператор-наладчик ЧПУ</span>
          <span className={styles.levelChip}>Уровень {level}</span>
        </div>
      </div>

      <div className={styles.xpCard}>
        <div className={styles.xpRow}>
          <span className={styles.xpLabel}>До уровня {level + 1}</span>
          <span className={styles.xpValue}>
            {into} / {goal} XP
          </span>
        </div>
        <div className={styles.xpTrack}>
          <div className={styles.xpFill} style={{ width: `${(into / goal) * 100}%` }} />
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statTile}>
          <div className={styles.statValue}>{solved}</div>
          <div className={styles.statLabel}>вопросов решено</div>
        </div>
        <div className={styles.statTile}>
          <div className={styles.statValue} style={{ color: 'var(--a-ok)' }}>
            {accuracy !== null ? `${accuracy}%` : '—'}
          </div>
          <div className={styles.statLabel}>средняя точность</div>
        </div>
        <div className={styles.statTile}>
          <div className={styles.statValue} style={{ color: 'var(--a-accent)' }}>
            {streak}
          </div>
          <div className={styles.statLabel}>дней подряд</div>
        </div>
        <div className={styles.statTile}>
          <div className={styles.statValue}>{lessonsStarted}</div>
          <div className={styles.statLabel}>уроков начато</div>
        </div>
      </div>

      <div className={styles.sectionsCard}>
        <div className={styles.sectionsHead}>Прогресс по разделам</div>
        {levels.map((level_) => {
          const done = level_.lessons.filter((ls) => progress.lessons[ls.id]?.passed).length;
          const pct = Math.round((done / level_.lessons.length) * 100);
          return (
            <div key={level_.id} className={styles.sectionRow}>
              <div className={styles.sectionRowHead}>
                <span className={styles.sectionName}>{level_.title}</span>
                <span className={styles.sectionCount}>
                  {done}/{level_.lessons.length}
                </span>
              </div>
              <div className={styles.sectionTrack}>
                <div
                  className={styles.sectionFill}
                  style={{ width: `${pct}%`, background: pct === 100 ? 'var(--a-ok)' : 'var(--a-accent)' }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.badgeRow}>
        {badges.map((badge) => (
          <div key={badge.label} className={styles.badge} style={{ opacity: badge.achieved ? 1 : 0.45 }}>
            <span className={styles.badgeGlyph}>{badge.glyph}</span>
            <span className={styles.badgeLabel}>
              {badge.label.split('\n').map((line, i) => (
                <span key={i}>
                  {line}
                  {i === 0 && <br />}
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>

      <div className={styles.weekCard}>
        <div className={styles.weekHead}>
          <span className={styles.sectionsHead} style={{ padding: 0 }}>
            Активность за неделю
          </span>
          <span className={styles.weekCount}>
            {week.filter((d) => d.active).length} из 7 дней
          </span>
        </div>
        <div className={styles.weekBars}>
          {week.map((d) => {
            const date = new Date(d.key);
            const active = d.active;
            const isToday = d.key === week[week.length - 1].key;
            return (
              <div key={d.key} className={styles.weekBarCol}>
                <span
                  className={styles.weekBar}
                  style={{
                    height: active ? '32px' : '4px',
                    background: active ? (isToday ? 'var(--a-accent)' : 'var(--a-accent-soft)') : 'var(--a-fill)',
                  }}
                />
                <span className={styles.weekLabel}>{WEEKDAY_LABELS[date.getDay()]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {progress.recentAttempts.length > 0 && (
        <div className={styles.attemptsCard}>
          <div className={styles.attemptsHead}>Последние попытки</div>
          {progress.recentAttempts.map((a, i) => {
            const passed = a.total > 0 && a.score / a.total >= 0.7;
            return (
              <div key={i} className={styles.attemptRow}>
                <span
                  className={styles.attemptTile}
                  style={{
                    background: passed ? 'var(--a-ok-soft)' : 'var(--a-fill)',
                    color: passed ? 'var(--a-ok)' : 'var(--a-text2)',
                  }}
                >
                  {a.lessonId}
                </span>
                <span className={styles.attemptBody}>
                  <span className={styles.attemptTitle}>{findLessonTitle(levels, a.lessonId)}</span>
                  <span className={styles.attemptWhen}>{formatRelativeDate(a.at)}</span>
                </span>
                <span className={styles.attemptScore} style={{ color: passed ? 'var(--a-ok)' : 'var(--a-text2)' }}>
                  {a.score}/{a.total}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
