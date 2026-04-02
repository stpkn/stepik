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
    </>
  );
}

export default ActivityPage;
