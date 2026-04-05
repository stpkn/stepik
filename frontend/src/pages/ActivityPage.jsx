import React from "react";
import { useOutletContext } from "react-router-dom";

function ActivityPage() {
  const data = useOutletContext();
  const activity = data?.activity ?? [];

  return (
    <>
      <header className="dashboard-main-header">
        <h1 className="dashboard-welcome">Активность</h1>
        <p className="dashboard-subtitle">
          Последние действия в системе обучения.
        </p>
      </header>

      <section className="dashboard-section" aria-labelledby="activity-list-title">
        <h2 id="activity-list-title" className="dashboard-section-title">
          Недавние события
        </h2>
        <ul className="activity-list">
          {activity.map((item) => (
            <li key={item.id} className="activity-item">
              <span className="activity-item__text">{item.action}</span>
              <span className="activity-item__when">{item.when}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="dashboard-section" aria-labelledby="activity-planning-title">
        <h2 id="activity-planning-title" className="dashboard-section-title">
          Аналитика активности
        </h2>
        <div className="insight-grid">
          <article className="insight-card">
            <p className="priority-pill priority-pill--p2">P2</p>
            <h3 className="insight-card__title">Сигналы фокуса</h3>
            <p className="insight-text">
              Активность снизилась в середине недели. Рекомендуется короткий повтор тем по SQL.
            </p>
          </article>
          <article className="insight-card">
            <p className="priority-pill priority-pill--p3">P3</p>
            <h3 className="insight-card__title">Планировщик напоминаний</h3>
            <p className="insight-text">
              Пример: "Пятница 19:00 - завершить домашнее задание по FastAPI".
            </p>
          </article>
        </div>
      </section>
    </>
  );
}

export default ActivityPage;
