import React from "react";
import { useOutletContext } from "react-router-dom";
import { getActiveCourses, getAverageProgress } from "../data/mockStudent";

function Home() {
  const data = useOutletContext();
  const courses = data?.courses ?? [];
  const displayName = data?.display_name ?? "Студент";
  const active = getActiveCourses(courses);
  const avgProgress = getAverageProgress(courses);
  const featured = courses.filter((c) => c.featured).slice(0, 3);

  return (
    <>
      <header className="dashboard-main-header">
        <h1 className="dashboard-welcome">Добро пожаловать, {displayName}</h1>
        <p className="dashboard-subtitle">
          Продолжайте обучение — у вас всё хорошо получается.
        </p>
      </header>

      <section className="dashboard-section" aria-labelledby="home-overview">
        <h2 id="home-overview" className="dashboard-section-title">
          Краткий обзор
        </h2>
        <div className="home-overview-row">
          <div className="overview-card">
            <span className="overview-card__value">{active.length}</span>
            <span className="overview-card__label">Активных курсов</span>
            <p className="overview-card__hint">Курсы, которые ещё не завершены</p>
          </div>
          <div className="overview-card">
            <span className="overview-card__value">{avgProgress}%</span>
            <span className="overview-card__label">Средний прогресс</span>
            <p className="overview-card__hint">По всем курсам в списке</p>
          </div>
        </div>
      </section>

      <section className="dashboard-section" aria-labelledby="home-featured">
        <h2 id="home-featured" className="dashboard-section-title">
          Рекомендуемые курсы
        </h2>
        <div className="featured-grid">
          {featured.map((course) => (
            <article key={course.id} className="featured-card">
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
                aria-label={`Прогресс: ${course.progress}%`}
              >
                <div className="progress-fill" style={{ width: `${course.progress}%` }} />
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

export default Home;
