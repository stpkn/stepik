import React from "react";
import { Link } from "react-router-dom";
import { useStudentData } from "../context/StudentDataContext"; // ✅ Используем реальный контекст

function Home() {
  const { data, loading } = useStudentData(); // ✅ Получаем данные напрямую
  const courses = data?.courses ?? [];
  const stats = data?.stats ?? {};
  const displayName = data?.display_name ?? "Студент";
  const activities = data?.activity ?? []; // ✅ Берём активность из профиля

  // Простой расчёт без mock-файлов
  const active = courses.filter(c => c.progress > 0 && c.progress < 100);
  const avgProgress = courses.length > 0
    ? Math.round(courses.reduce((acc, c) => acc + c.progress, 0) / courses.length)
    : 0;

  const featured = courses.slice(0, 2);
  const upcoming = activities.slice(0, 4); // Последние 4 действия

  // ✅ Форматирование активности (как на вкладке "Активность")
  const formatActivity = (item) => {
    if (item.action === "course_opened") return item.details || "Открыт курс";
    if (item.action === "question_solved") return `Решён вопрос: ${item.details}`;
    if (item.action === "code_submitted") return `Отправлен код: ${item.details}`;
    return item.details || item.action;
  };

  if (loading) return <div className="page-loading">Загрузка...</div>;

  return (
    <>
      <header className="dashboard-main-header dashboard-main-header--compact">
        <div>
          <h1 className="dashboard-welcome">Добро пожаловать, {displayName}</h1>
          <p className="dashboard-subtitle">Отслеживайте метрики и продолжайте обучение.</p>
        </div>
        <div className="dashboard-top-tools">
          <div className="dashboard-avatar">С</div>
        </div>
      </header>

      <section className="dashboard-section dashboard-section--tight" aria-labelledby="home-overview">
        <h2 id="home-overview" className="dashboard-section-title">Обзор успеваемости</h2>
        <div className="stitch-metric-grid">
          <article className="stitch-metric-card">
            <p className="stitch-metric-card__label">Общий прогресс</p>
            <p className="stitch-metric-card__value">{avgProgress}%</p>
            <div className="progress-track"><div className="progress-fill" style={{ width: `${avgProgress}%` }} /></div>
          </article>
          <article className="stitch-metric-card">
            <p className="stitch-metric-card__label">Активные курсы</p>
            <p className="stitch-metric-card__value">{active.length}</p>
            <p className="stitch-metric-card__sub">в процессе сейчас</p>
          </article>
          <article className="stitch-metric-card">
            <p className="stitch-metric-card__label">Сертификаты</p>
            <p className="stitch-metric-card__value">{stats.certificates ?? 0}</p>
            <p className="stitch-metric-card__sub">получено</p>
          </article>
        </div>
      </section>

      <section className="dashboard-section dashboard-2col" aria-labelledby="home-academic-panel">
        <div className="stitch-panel">
          <div className="stitch-panel__head">
            <h2 id="home-academic-panel" className="dashboard-section-title">Академическая динамика</h2>
            <span className="priority-pill priority-pill--p2">Тренд</span>
          </div>
          <div className="stitch-chart">
            {[32, 44, 52, 40, 67, 58, 76].map((value, index) => (
              <span key={index} className="stitch-chart__bar" style={{ height: `${value}%` }} aria-hidden="true" />
            ))}
          </div>
          <div className="stitch-courses-compact">
            {featured.map((course) => (
              <article className="stitch-course-tile" key={course.id}>
                <h3 className="stitch-course-tile__title">{course.title}</h3>
                <p className="stitch-course-tile__meta">{course.progress}% завершено</p>
              </article>
            ))}
          </div>
        </div>

        <div className="stitch-side-stack">
          {/* ✅ ОБНОВЛЁННЫЙ БЛОК "МОИ ДЕЙСТВИЯ" */}
          <article className="stitch-panel">
            <div className="stitch-panel__head">
              <h2 className="dashboard-section-title">Мои действия</h2>
            </div>
            <ul className="stitch-list">
              {upcoming.length === 0 ? (
                <li style={{ color: "#64748b", fontStyle: "italic", padding: "8px 0" }}>
                  Пока нет действий. Открой курс, чтобы начать!
                </li>
              ) : (
                upcoming.map((item) => (
                  <li key={item.id} style={{ padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
                    {formatActivity(item)}
                  </li>
                ))
              )}
            </ul>
          </article>
        </div>
      </section>

      <section className="dashboard-section" aria-labelledby="home-learning-feed">
        <h2 id="home-learning-feed" className="dashboard-section-title">Продолжить обучение</h2>
        <div className="featured-grid">
          {(courses.length ? courses : featured).slice(0, 3).map((course) => (
            <Link
              key={course.id}
              to={`/dashboard/course/${course.id}`} // ✅ Исправлен путь под роутер
              className="featured-card featured-card--link"
            >
              <h3 className="featured-card__title">{course.title}</h3>
              <p className="featured-card__desc">{course.description}</p>
              <div className="progress-row">
                <span className="progress-label">Прогресс: {course.progress}%</span>
              </div>
              <div className="progress-track" role="progressbar" aria-valuenow={course.progress} aria-valuemin={0} aria-valuemax={100}>
                <div className="progress-fill" style={{ width: `${course.progress}%` }} />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

export default Home;