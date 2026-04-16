import React, { useEffect, useState, useCallback } from "react";
import { Link, Navigate } from "react-router-dom";
import { API_BASE } from "../api/config";
import { getStoredUser, clearStoredUser } from "../auth/storage";

async function fetchTeacher(id) {
  const res = await fetch(`${API_BASE}/teacher/${id}`);
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json();
}

function TeacherDashboardView({ teacherId }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchTeacher(teacherId)
      .then(setData)
      .catch(() => {
        setData(null);
        setError("Не удалось загрузить данные преподавателя. Проверьте, что сервер запущен.");
      })
      .finally(() => setLoading(false));
  }, [teacherId]);

  useEffect(() => {
    load();
  }, [load]);

  const footer = (
    <div className="sidebar-footer">
      <Link to="/dashboard" className="sidebar-link">
        Кабинет студента
      </Link>
      <Link
        to="/login"
        className="sidebar-link sidebar-link--logout"
        onClick={() => clearStoredUser()}
      >
        Выход
      </Link>
    </div>
  );

  if (loading) {
    return (
      <div className="dashboard-page">
        <aside className="dashboard-sidebar" aria-label="Навигация преподавателя">
          <div className="sidebar-brand">Кабинет преподавателя</div>
          {footer}
        </aside>
        <main className="dashboard-main dashboard-main--wide">
          <div className="dashboard-state dashboard-state--loading" role="status">
            <p>Загрузка…</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="dashboard-page">
        <aside className="dashboard-sidebar" aria-label="Навигация преподавателя">
          <div className="sidebar-brand">Кабинет преподавателя</div>
          {footer}
        </aside>
        <main className="dashboard-main dashboard-main--wide">
          <div className="dashboard-state dashboard-state--error" role="alert">
            <p>{error || "Нет данных"}</p>
            <button type="button" className="dashboard-retry-btn" onClick={load}>
              Повторить
            </button>
          </div>
        </main>
      </div>
    );
  }

  const students = data.students_progress ?? [];
  const courses = data.courses ?? [];
  const stats = data.stats ?? {};
  const activity = data.activity ?? [];

  return (
    <div className="dashboard-page">
      <aside className="dashboard-sidebar" aria-label="Навигация преподавателя">
        <div className="sidebar-brand">Кабинет преподавателя</div>
        <nav className="sidebar-nav">
          <a href="#teacher-students" className="sidebar-link">
            Прогресс студентов
          </a>
          <a href="#teacher-courses" className="sidebar-link">
            Курсы
          </a>
          <a href="#teacher-stats" className="sidebar-link">
            Статистика
          </a>
          <a href="#teacher-activity" className="sidebar-link">
            Активность
          </a>
          <a href="#teacher-manage" className="sidebar-link">
            Управление
          </a>
        </nav>
        {footer}
      </aside>

      <main className="dashboard-main dashboard-main--wide">
        <header className="dashboard-main-header">
          <h1 className="dashboard-welcome">
            Добро пожаловать, {data.display_name}
          </h1>
          <p className="dashboard-subtitle">
            Управление курсами и отслеживание успеваемости.
          </p>
        </header>

        <section
          id="teacher-students"
          className="dashboard-section"
          aria-labelledby="teacher-students-title"
        >
          <h2 id="teacher-students-title" className="dashboard-section-title">
            Прогресс студентов
          </h2>
          <div className="teacher-table-wrap">
            <table className="teacher-table">
              <thead>
                <tr>
                  <th scope="col">Имя</th>
                  <th scope="col">Курс</th>
                  <th scope="col">Прогресс</th>
                </tr>
              </thead>
              <tbody>
                {students.map((row) => (
                  <tr key={row.id}>
                    <td data-label="Имя">{row.name}</td>
                    <td data-label="Курс">{row.course}</td>
                    <td data-label="Прогресс">
                      <span className="teacher-table__progress">{row.progress}%</span>
                      <div
                        className="progress-track progress-track--inline"
                        role="progressbar"
                        aria-valuenow={row.progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className="progress-fill"
                          style={{ width: `${row.progress}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section
          id="teacher-courses"
          className="dashboard-section"
          aria-labelledby="teacher-courses-title"
        >
          <h2 id="teacher-courses-title" className="dashboard-section-title">
            Курсы
          </h2>
          <div className="teacher-course-grid">
            {courses.map((c) => (
              <article key={c.id} className="teacher-course-card">
                <h3 className="teacher-course-card__title">{c.title}</h3>
                <dl className="teacher-course-card__meta">
                  <div>
                    <dt>Студентов</dt>
                    <dd>{c.students_count}</dd>
                  </div>
                  <div>
                    <dt>Средний прогресс</dt>
                    <dd>{c.avg_progress}%</dd>
                  </div>
                </dl>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${c.avg_progress}%` }} />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          id="teacher-stats"
          className="dashboard-section"
          aria-labelledby="teacher-stats-title"
        >
          <h2 id="teacher-stats-title" className="dashboard-section-title">
            Статистика
          </h2>
          <div className="stats-row stats-row--4">
            <div className="stat-tile">
              <span className="stat-tile__value">{stats.total_students ?? 0}</span>
              <span className="stat-tile__label">Всего студентов</span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile__value">{stats.active_courses ?? 0}</span>
              <span className="stat-tile__label">Активные курсы</span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile__value">{stats.completed_courses ?? 0}</span>
              <span className="stat-tile__label">Завершённые курсы</span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile__value">{stats.avg_progress ?? 0}%</span>
              <span className="stat-tile__label">Средний прогресс</span>
            </div>
          </div>
        </section>

        <section
          id="teacher-activity"
          className="dashboard-section"
          aria-labelledby="teacher-activity-title"
        >
          <h2 id="teacher-activity-title" className="dashboard-section-title">
            Активность
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

        <section
          id="teacher-manage"
          className="dashboard-section"
          aria-labelledby="teacher-manage-title"
        >
          <h2 id="teacher-manage-title" className="dashboard-section-title">
            Управление курсами
          </h2>
          <div className="teacher-manage-card">
            <p className="teacher-manage-card__hint">
              Кнопки только для интерфейса — без сохранения на сервере.
            </p>
            <div className="teacher-manage-actions">
              <button type="button" className="teacher-btn teacher-btn--primary">
                Создать курс
              </button>
              <button type="button" className="teacher-btn teacher-btn--secondary">
                Редактировать
              </button>
              <button type="button" className="teacher-btn teacher-btn--danger">
                Удалить
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function TeacherDashboard() {
  const user = getStoredUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role === "student") {
    return <Navigate to="/dashboard" replace />;
  }
  if (user.role !== "teacher") {
    return <Navigate to="/login" replace />;
  }
  return <TeacherDashboardView teacherId={user.id} />;
}

export default TeacherDashboard;
