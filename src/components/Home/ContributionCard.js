import { useMemo, useState } from 'react';
import styles from './HomeContent.module.css';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const weekdayHeader = ['Mon', 'Thu', 'Sun'];

const toDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const formatTooltipDate = (date) =>
  date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  });

const contentToText = (content) => {
  if (Array.isArray(content)) {
    return content.join('\n');
  }

  return String(content || '');
};

const countPostWords = (post) => {
  const text = contentToText(post.content || post.excerpt)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<video[\s\S]*?<\/video>/gi, ' ')
    .replace(/<img[\s\S]*?>/gi, ' ')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_`~\-|]/g, ' ')
    .trim();
  const chineseChars = text.match(/[\u4e00-\u9fa5]/g)?.length || 0;
  const words = text.match(/[A-Za-z0-9]+/g)?.length || 0;

  return chineseChars + words;
};

const getPublishDate = (post) => {
  const history = Array.isArray(post.history) ? post.history : [];
  const firstHistoryAt = history
    .map((item) => item.at || item.createAt)
    .filter(Boolean)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];
  const value = firstHistoryAt || post.createAt || post.date || post.updatedAt;
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
};

const getContributionPosts = (posts) =>
  posts
    .filter((post) => post.published !== false && !post.locked)
    .map((post) => ({
      post,
      date: getPublishDate(post),
      words: countPostWords(post),
    }))
    .filter((item) => item.date && item.words > 0);

const getContributionLevel = ({ count = 0, words = 0 } = {}) => {
  if (!count || !words) {
    return 0;
  }

  const score = count * 2 + words / 500;

  if (score >= 6) return 4;
  if (score >= 4) return 3;
  if (score >= 2.6) return 2;
  return 1;
};

const getContributionYears = (items) => {
  const years = items.map((item) => item.date.getFullYear());
  return Math.max(...years, new Date().getFullYear());
};

const buildMonthlyContributionData = (items, activeYear) => {
  const dailyMap = items.reduce((map, item) => {
    if (item.date.getFullYear() !== activeYear) {
      return map;
    }

    const key = toDateKey(item.date);
    const day = map[key] || { count: 0, words: 0 };
    day.count += 1;
    day.words += item.words;
    map[key] = day;

    return map;
  }, {});

  return {
    total: items.filter((item) => item.date.getFullYear() === activeYear).length,
    months: months.map((month, monthIndex) => {
      const monthStart = new Date(activeYear, monthIndex, 1);
      const gridStart = new Date(monthStart);
      gridStart.setDate(monthStart.getDate() - ((monthStart.getDay() + 6) % 7));

      const days = Array.from({ length: 42 }, (_, index) => {
        const date = new Date(gridStart);
        date.setDate(gridStart.getDate() + index);
        const key = toDateKey(date);
        const info = dailyMap[key];
        const inMonth = date.getFullYear() === activeYear && date.getMonth() === monthIndex;

        return {
          key: `${month}-${index}`,
          date,
          inMonth,
          level: inMonth ? getContributionLevel(info) : 0,
          count: inMonth ? info?.count || 0 : 0,
          words: inMonth ? info?.words || 0 : 0,
        };
      });

      return {
        month,
        days,
      };
    }),
  };
};

const ContributionCard = ({ posts }) => {
  const contributionItems = useMemo(() => getContributionPosts(posts), [posts]);
  const latestYear = getContributionYears(contributionItems);
  const [activeYear, setActiveYear] = useState(latestYear);
  const contribution = buildMonthlyContributionData(contributionItems, activeYear);
  const switchYearWindow = (step) => {
    const nextYear = step > 0 ? activeYear - 1 : Math.min(activeYear + 1, latestYear);

    setActiveYear(nextYear);
  };

  return (
    <section className={styles.contributionWide}>
      <div className={styles.contributionWideHeader}>
        <h3>{contribution.total} contributions in {activeYear}</h3>
      </div>

      <div className={styles.contributionWideYears}>
        <button
          type="button"
          className={styles.contributionYearArrow}
          onClick={() => switchYearWindow(-1)}
          disabled={activeYear >= latestYear}
          aria-label="Previous year"
        >
          ←
        </button>
        <button className={styles.contributionYearActive} type="button">
          {activeYear}
        </button>
        <button
          type="button"
          className={styles.contributionYearArrow}
          onClick={() => switchYearWindow(1)}
          aria-label="Next year"
        >
          →
        </button>
      </div>

      <div className={styles.contributionVerticalGraph}>
        <div className={styles.contributionWeekHeader}>
          <span />
          {weekdayHeader.map((weekday) => (
            <span key={weekday}>{weekday}</span>
          ))}
        </div>

        {contribution.months.map((monthBlock) => (
          <div key={monthBlock.month} className={styles.contributionMonthRow}>
            <span className={styles.contributionMonthName}>{monthBlock.month}</span>
            <div className={styles.contributionMonthGrid}>
              {monthBlock.days.map((day) => (
                <span
                  key={day.key}
                  className={styles.contributionCell}
                  data-level={day.level}
                  data-empty={day.inMonth ? undefined : 'true'}
                  data-tooltip={
                    day.inMonth
                      ? `${day.count} contributions on ${formatTooltipDate(day.date)}. About ${day.words} words`
                      : undefined
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.contributionLegend}>
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <i key={level} className={styles.contributionCell} data-level={level} />
        ))}
        <span>More</span>
      </div>
    </section>
  );
};

export default ContributionCard;
