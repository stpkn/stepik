import React from "react";
import { Link, useOutletContext } from "react-router-dom";
import { getActiveCourses, getAverageProgress } from "../data/mockStudent";

function Home() {
  const data = useOutletContext();
  const courses = data?.courses ?? [];
  const stats = data?.stats ?? {};
  const displayName = data?.display_name ?? "Студент";
  const active = getActiveCourses(courses);
  const avgProgress = getAverageProgress(courses);
  const featured =
    courses.filter((c) => c.featured).slice(0, 2).length > 0
      ? courses.filter((c) => c.featured).slice(0, 2)
      : courses.slice(0, 2);
  const upcoming = (data?.activity ?? []).slice(0, 4);

  const perfPoints = [32, 44, 52, 40, 67, 58, 76];

  return (
    <>
      <header className="dashboard-main-header dashboard-main-header--compact">
        <div>
          <h1 className="dashboard-welcome">Добро пожаловать, {displayName}</h1>
          <p className="dashboard-subtitle">Отслеживайте метрики и продолжайте обучение.</p>
        </div>
        <div className="dashboard-top-tools">
          <div className="dashboard-search">Поиск по курсам</div>
          <div className="dashboard-avatar">S</div>
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
            <p className="stitch-metric-card__label">Часы обучения</p>
            <p className="stitch-metric-card__value">{stats.study_hours ?? 0}</p>
            <p className="stitch-metric-card__sub">за семестр</p>
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
            {perfPoints.map((value, index) => (
              <span
                key={index}
                className="stitch-chart__bar"
                style={{ height: `${value}%` }}
                aria-hidden="true"
              />
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
          <article className="stitch-panel">
            <div className="stitch-panel__head">
              <h2 className="dashboard-section-title">Расписание на сегодня</h2>
              <span className="priority-pill priority-pill--p3">P3</span>
            </div>
            <ul className="stitch-list">
              <li>09:00 - Повтор модуля по React</li>
              <li>13:30 - Практический тест по SQL</li>
              <li>18:00 - Домашнее задание по FastAPI</li>
            </ul>
          </article>

          <article className="stitch-panel">
            <div className="stitch-panel__head">
              <h2 className="dashboard-section-title">Ближайшие задания</h2>
            </div>
            <ul className="stitch-list">
              {upcoming.map((item) => (
                <li key={item.id}>{item.action}</li>
              ))}
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
              to={`/course/${course.id}`}
              className="featured-card featured-card--link"
            >
              <h3 className="featured-card__title">{course.title}</h3>
              <p className="featured-card__desc">{course.description}</p>
              <div className="progress-row">
                <span className="progress-label">Прогресс: {course.progress}%</span>
              </div>
              <div
                className="progress-track"
                role="progressbar"
                aria-valuenow={course.progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Прогресс курса ${course.progress}%`}
              >
                <div className="progress-fill" style={{ width: `${course.progress}%` }} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="dashboard-section" aria-labelledby="home-planning">
        <h2 id="home-planning" className="dashboard-section-title">Рекомендации</h2>
        <div className="insight-grid">
          <article className="insight-card">
            <p className="priority-pill priority-pill--p2">P2</p>
            <h3 className="insight-card__title">Умные рекомендации</h3>
            <ul className="insight-list">
              <li>Завершите модуль React Components до пятницы</li>
              <li>Повторите SQL joins перед следующим тестом</li>
            </ul>
          </article>
          <article className="insight-card">
            <p className="priority-pill priority-pill--p3">P3</p>
            <h3 className="insight-card__title">Личные цели</h3>
            <ul className="insight-list">
              <li>6 часов практики кодинга на этой неделе</li>
              <li>Цель: завершить 2 теста</li>
            </ul>
          </article>
        </div>
      </section>
    </>
  );
}

export default Home;
