import React, { useEffect, useState, useCallback } from "react";
import { Link, Navigate } from "react-router-dom";
import { API_BASE } from "../api/config";
import { getStoredUser, clearStoredUser } from "../auth/storage";
import ThemeToggle from "../components/ThemeToggle";
import AddStudentModal from "../components/AddStudentModal";
import CreateCourseModal from "../components/CreateCourseModal";

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
  const [studentsList, setStudentsList] = useState([]);
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [createCourseOpen, setCreateCourseOpen] = useState(false);

  const refreshStudents = useCallback(() => {
    fetch(`${API_BASE}/teacher/${teacherId}/students`)
      .then(async (res) => {
        if (!res.ok) {
          const t = await res.text();
          throw new Error(t || res.statusText);
        }
        return res.json();
      })
      .then(setStudentsList)
      .catch(() => setStudentsList([]));
  }, [teacherId]);

  useEffect(() => {
    refreshStudents();
  }, [refreshStudents]);

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
          <div className="sidebar-brand-row">
            <div className="sidebar-brand">StepikIn Преподаватель</div>
            <ThemeToggle />
          </div>
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
          <div className="sidebar-brand-row">
            <div className="sidebar-brand">StepikIn Преподаватель</div>
            <ThemeToggle />
          </div>
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
        <div className="sidebar-brand-row">
          <div className="sidebar-brand">StepikIn Преподаватель</div>
          <ThemeToggle />
        </div>
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
          <a href="#teacher-class-list" className="sidebar-link">
            Ученики
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
            Риск-ориентированный обзор по студентам и курсам.
          </p>
        </header>

        <section
          className="dashboard-section"
          aria-labelledby="teacher-priority-title"
        >
          <h2 id="teacher-priority-title" className="dashboard-section-title">
            Приоритетные студенты
          </h2>
          <div className="notice-banner notice-banner--warn">
            Сфокусируйтесь на студентах с прогрессом ниже 50%: это повысит общий темп группы.
          </div>
        </section>

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
          id="teacher-class-list"
          className="dashboard-section"
          aria-labelledby="teacher-class-list-title"
        >
          <div className="teacher-class-list-head">
            <h2 id="teacher-class-list-title" className="dashboard-section-title">
              Ученики
            </h2>
            <button
              type="button"
              className="teacher-btn teacher-btn--primary"
              onClick={() => setAddStudentOpen(true)}
            >
              Добавить ученика
            </button>
          </div>
          {studentsList.length === 0 ? (
            <p className="teacher-class-list-empty">Пока нет учеников на ваших курсах.</p>
          ) : (
            <ul className="teacher-class-list">
              {studentsList.map((s) => (
                <li key={s.id} className="teacher-class-list__item">
                  <span className="teacher-class-list__name">
                    {s.first_name} {s.last_name}
                  </span>
                  <span className="teacher-class-list__login">{s.login}</span>
                </li>
              ))}
            </ul>
          )}
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
              <button
                type="button"
                className="teacher-btn teacher-btn--primary"
                onClick={() => setCreateCourseOpen(true)}
              >
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

          <div className="insight-grid" style={{ marginTop: "14px" }}>
            <article className="insight-card">
              <p className="priority-pill priority-pill--p2">P2</p>
              <h3 className="insight-card__title">Очередь проверок</h3>
              <ul className="insight-list">
                <li>4 задания ожидают обратной связи</li>
                <li>2 запроса на разбор ошибки в коде</li>
              </ul>
            </article>
            <article className="insight-card">
              <p className="priority-pill priority-pill--p3">P3</p>
              <h3 className="insight-card__title">Превью тепловой карты группы</h3>
              <p className="insight-text">
                Дополнительный вид для анализа активности по темам и неделям.
              </p>
            </article>
          </div>
        </section>

        <AddStudentModal
          isOpen={addStudentOpen}
          onClose={() => setAddStudentOpen(false)}
          teacherId={teacherId}
          onStudentCreated={refreshStudents}
        />
        <CreateCourseModal
          isOpen={createCourseOpen}
          onClose={() => setCreateCourseOpen(false)}
          teacherId={teacherId}
          onCourseCreated={load}
        />
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
