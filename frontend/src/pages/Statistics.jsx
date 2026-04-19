import React from "react";
import { useOutletContext } from "react-router-dom";
import { getAverageProgress } from "../data/mockStudent";

function Statistics() {
  const data = useOutletContext();
  const courses = data?.courses ?? [];
  const stats = data?.stats ?? {};
  const weeklyHours = data?.weekly_hours ?? [];

  const avg = getAverageProgress(courses);
  const maxHours =
    weeklyHours.length > 0
      ? Math.max(...weeklyHours.map((d) => d.hours), 1)
      : 1;

  return (
    <>
      <header className="dashboard-main-header">
        <h1 className="dashboard-welcome">Статистика</h1>
        <p className="dashboard-subtitle">
          Цифры по обучению и нагрузка по дням недели.
        </p>
      </header>

      <section className="dashboard-section" aria-labelledby="stats-numbers">
        <h2 id="stats-numbers" className="dashboard-section-title">
          Показатели
        </h2>
        <div className="stats-row stats-row--4">
          <div className="stat-tile">
            <span className="stat-tile__value">{stats.completed_courses ?? 0}</span>
            <span className="stat-tile__label">Завершённые курсы</span>
          </div>
          <div className="stat-tile">
            <span className="stat-tile__value">{stats.active_courses ?? 0}</span>
            <span className="stat-tile__label">Активные курсы</span>
          </div>
          <div className="stat-tile">
            <span className="stat-tile__value">{stats.certificates ?? 0}</span>
            <span className="stat-tile__label">Сертификаты</span>
          </div>
          <div className="stat-tile">
            <span className="stat-tile__value">{stats.study_hours ?? 0}</span>
            <span className="stat-tile__label">Часы обучения</span>
          </div>
        </div>
      </section>

      <section className="dashboard-section" aria-labelledby="stats-charts">
        <h2 id="stats-charts" className="dashboard-section-title">
          Визуализация
        </h2>
        <div className="chart-cards">
          <div className="chart-card">
            <h3 className="chart-card__title">Средний прогресс по курсам</h3>
            <p className="chart-card__metric">
              <span className="chart-card__metric-value">{avg}%</span>
              <span className="chart-card__metric-label">среднее по всем курсам</span>
            </p>
            <div
              className="progress-track progress-track--lg"
              role="progressbar"
              aria-valuenow={avg}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Средний прогресс: ${avg}%`}
            >
              <div className="progress-fill" style={{ width: `${avg}%` }} />
            </div>
            <p className="chart-card__caption">По вашим курсам из API</p>
          </div>
          <div className="chart-card">
            <h3 className="chart-card__title">Часы по дням недели</h3>
            <ul className="bar-chart" aria-label="Часы обучения по дням">
              {weeklyHours.map((row) => (
                <li key={row.day} className="bar-chart__row">
                  <span className="bar-chart__day">{row.day}</span>
                  <div className="bar-chart__track">
                    <div
                      className="bar-chart__fill"
                      style={{ width: `${(row.hours / maxHours) * 100}%` }}
                    />
                  </div>
                  <span className="bar-chart__val">{row.hours} ч</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="dashboard-section" aria-labelledby="stats-extra-title">
        <h2 id="stats-extra-title" className="dashboard-section-title">
          Дополнительные аналитические блоки
        </h2>
        <div className="insight-grid">
          <article className="insight-card">
            <p className="priority-pill priority-pill--p2">P2</p>
            <h3 className="insight-card__title">Сравнение неделя к неделе</h3>
            <p className="insight-text">
              Текущая неделя: +11% активности относительно предыдущей.
            </p>
          </article>
          <article className="insight-card">
            <p className="priority-pill priority-pill--p3">P3</p>
            <h3 className="insight-card__title">Экспорт отчета</h3>
            <p className="insight-text">
              Предпросмотр выгрузки CSV для прогресса и недельной активности.
            </p>
          </article>
        </div>
        <div className="notice-banner notice-banner--warn">
          Если API временно недоступен, показывается последний успешный снимок и кнопка повторной загрузки.
        </div>
      </section>
    </>
  );
}

export default Statistics;
