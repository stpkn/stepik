import React from "react";
import { Navigate, NavLink, Link } from "react-router-dom";
import { StudentDataProvider } from "../context/StudentDataContext";
import { getStoredUser, clearStoredUser } from "../auth/storage";
import ThemeToggle from "./ThemeToggle";

function StudentLayout() {
  const user = getStoredUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role === "teacher") {
    return <Navigate to="/teacher" replace />;
  }
  if (user.role !== "student") {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="dashboard-page">
      <aside className="dashboard-sidebar" aria-label="Главная навигация">
        <div className="sidebar-brand-row">
          <div className="sidebar-brand">StepikIn Студент</div>
          <ThemeToggle />
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/dashboard" className="sidebar-link" end>
            Главная
          </NavLink>
          <NavLink to="/dashboard/learning" className="sidebar-link">
            Моё обучение
          </NavLink>
          <NavLink to="/dashboard/statistics" className="sidebar-link">
            Статистика
          </NavLink>
          <NavLink to="/dashboard/activity" className="sidebar-link">
            Активность
          </NavLink>
        </nav>
        <Link
          to="/login"
          className="sidebar-link sidebar-link--logout"
          onClick={() => clearStoredUser()}
        >
          Выйти
        </Link>
      </aside>
      <main className="dashboard-main">
        <StudentDataProvider studentId={user.id} />
      </main>
    </div>
  );
}

export default StudentLayout;
