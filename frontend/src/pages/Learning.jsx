import React from "react";
import { useOutletContext } from "react-router-dom";

function Learning() {
  const data = useOutletContext();
  const courses = data?.courses ?? [];

  return (
    <>
      <header className="dashboard-main-header">
        <h1 className="dashboard-welcome">Моё обучение</h1>
        <p className="dashboard-subtitle">
          Все ваши курсы в одном месте — откройте карточку и продолжайте с того места, где остановились.
        </p>
      </header>

      <section className="dashboard-section" aria-labelledby="learning-grid-title">
        <h2 id="learning-grid-title" className="dashboard-section-title">
          Курсы
        </h2>
        <div className="course-grid">
          {courses.map((course) => (
            <article key={course.id} className="course-card-grid">
              <h3 className="course-card-grid__title">{course.title}</h3>
              <p className="course-card-grid__desc">{course.description}</p>
              <div className="progress-row">
                <span className="progress-label">Прогресс: {course.progress}%</span>
              </div>
              <div
                className="progress-track"
                role="progressbar"
                aria-valuenow={course.progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Прогресс курса «${course.title}»: ${course.progress}%`}
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

export default Learning;
