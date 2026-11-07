import { getEmotionCategory, getEmotionColor } from './emotionUtils';

const getLocalDateKey = dateMs => {
  const date = new Date(dateMs);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDominantCategoryForDay = entries => {
  const categoryScores = new Map();

  entries.forEach(entry => {
    const category = getEmotionCategory(entry.emotion);
    if (!category) return;

    if (!categoryScores.has(category)) {
      categoryScores.set(category, { intensitySum: 0, count: 0, maxIntensity: 0 });
    }

    const score = categoryScores.get(category);
    const intensity = Number(entry.intensity) || 0;
    score.intensitySum += intensity;
    score.count += 1;
    score.maxIntensity = Math.max(score.maxIntensity, intensity);
  });

  return [...categoryScores.entries()]
    .sort(([, first], [, second]) => (
      second.intensitySum - first.intensitySum
      || second.count - first.count
      || second.maxIntensity - first.maxIntensity
    ))[0]?.[0] || null;
};

export const buildWeekdayPattern = (entries, limit = Infinity) => {
  const entriesByDate = new Map();

  entries.forEach(entry => {
    const dateKey = getLocalDateKey(entry.date);
    if (!entriesByDate.has(dateKey)) entriesByDate.set(dateKey, []);
    entriesByDate.get(dateKey).push(entry);
  });

  const analyzedDays = [...entriesByDate.entries()]
    .slice(0, limit)
    .map(([date, dayEntries]) => ({
      date,
      category: getDominantCategoryForDay(dayEntries),
    }))
    .filter(day => day.category);

  const categoryCounts = new Map();
  analyzedDays.forEach(day => {
    categoryCounts.set(day.category, (categoryCounts.get(day.category) || 0) + 1);
  });

  const ranking = [...categoryCounts.entries()]
    .sort(([, firstCount], [, secondCount]) => secondCount - firstCount)
    .map(([category, count]) => ({
      category,
      count,
      color: getEmotionColor(category),
    }));

  const winner = ranking[0] || null;
  const secondPlace = ranking[1]?.count || 0;
  const daysAnalyzed = analyzedDays.length;

  return {
    daysAnalyzed,
    analyzedDays,
    ranking,
    winner: winner ? {
      ...winner,
      share: daysAnalyzed ? winner.count / daysAnalyzed : 0,
      isClear: winner.count / daysAnalyzed >= 0.5 && winner.count - secondPlace >= 2,
    } : null,
    hasEnoughData: daysAnalyzed >= 3,
  };
};
