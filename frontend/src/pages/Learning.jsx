import React , { useState }  from "react";
import { Link, useOutletContext } from "react-router-dom";

function Learning() {
  const data = useOutletContext();
  const courses = data?.courses ?? [];
  const [activeFilter, setActiveFilter] = useState("all");

  const filteredCourses = courses.filter((course) => {
    if (activeFilter === "in_progress") return course.progress > 0 && course.progress < 100;
    if (activeFilter === "completed") return course.progress === 100;
    if (activeFilter === "attention") return course.progress === 0;
    return true; // "all"
  });


  return (
    <>
      <header className="dashboard-main-header">
        <h1 className="dashboard-welcome">Моё обучение</h1>
        <p className="dashboard-subtitle">
          Все курсы в одном месте: фильтруйте список и продолжайте с последнего шага.
        </p>
      </header>

      <section className="dashboard-section" aria-labelledby="learning-filters-title">
        <h2 id="learning-filters-title" className="dashboard-section-title">
          Фильтры и фокус
        </h2>
        <div className="filter-card">

          <div className="chip-row">
            {["all", "in_progress", "completed", "attention"].map((filterId) => {
              const labels = {
                all: "Все",
                in_progress: "В процессе",
                completed: "Завершенные",
                attention: "Требуют внимания",
              };
              return (
                <button
                  key={filterId}
                  type="button"
                  className={`chip ${activeFilter === filterId ? "chip--active" : ""}`}
                  onClick={() => setActiveFilter(filterId)}
                  style={{
                    cursor: "pointer",
                    border: activeFilter === filterId ? "2px solid #4f46e5" : "1px solid #cbd5e1",
                    background: activeFilter === filterId ? "#eef2ff" : "transparent",
                    color: activeFilter === filterId ? "#4f46e5" : "inherit",
                    fontWeight: activeFilter === filterId ? 600 : 400,
                  }}
                >
                  {labels[filterId]}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="dashboard-section" aria-labelledby="learning-grid-title">
        <h2 id="learning-grid-title" className="dashboard-section-title">
          Курсы
        </h2>
        <div className="course-grid">
          {filteredCourses.map((course) => (
            <Link
              key={course.id}
              to={`/course/${course.id}`}
              className="course-card-grid course-card-grid--link"
            >
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
            </Link>
          ))}
        </div>
      </section>

      <section className="dashboard-section" aria-labelledby="learning-next-step">
        <h2 id="learning-next-step" className="dashboard-section-title">
          Следующий шаг
        </h2>
        <div className="notice-banner">
          Пожалуйста, откройте и изучите следующие модули курса!
        </div>
      </section>
    </>
  );
}

export default Learning;