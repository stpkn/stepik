/** Утилиты для данных студента (сами курсы приходят с API) */

export function getActiveCourses(courses) {
  if (!courses) return [];
  return courses.filter((c) => c.progress < 100);
}

export function getAverageProgress(courses) {
  if (!courses || !courses.length) return 0;
  const sum = courses.reduce((acc, c) => acc + c.progress, 0);
  return Math.round(sum / courses.length);
}
