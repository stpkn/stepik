import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { API_BASE } from "../api/config";
import { getStoredUser, setStoredUser } from "../auth/storage";
import ThemeToggle from "../components/ThemeToggle";

function Login() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const existing = getStoredUser();
  if (existing) {
    if (existing.role === "teacher") {
      return <Navigate to="/teacher" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ login, password }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const msg =
          typeof payload.detail === "string"
            ? payload.detail
            : "Неверный логин или пароль";
        setError(msg);
        return;
      }

      const user = {
        id: payload.id,
        name: payload.name,
        role: payload.role,
      };

      if (!user.id || !user.role) {
        setError("Некорректный ответ сервера");
        return;
      }

      setStoredUser(user);
      setLogin("");
      setPassword("");

      if (user.role === "teacher") {
        navigate("/teacher", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      setError("Не удалось подключиться к серверу");
    }
  };

  return (
    <div className="login-layout">
      <div className="card auth-card">
        <div className="card-header card-header--with-toggle auth-card__header">
          <div>
            <p className="auth-brand">StepikIn</p>
            <h1 className="card-title">С&nbsp;возвращением</h1>
            <p className="card-subtitle">Введите данные для входа в систему</p>
          </div>
          <ThemeToggle />
        </div>
        {error ? (
          <p className="login-error" role="alert">
            {error}
          </p>
        ) : null}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="login">
              Логин или почта
            </label>
            <input
              id="login"
              className="form-input"
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
              placeholder="student или teacher"
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Пароль
            </label>
            <input
              id="password"
              className="form-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Введите пароль"
              autoComplete="current-password"
            />
          </div>
          <button className="primary-button" type="submit">
            Войти
          </button>
        </form>

        <div className="login-hint-box auth-hint-box">
          <p className="priority-pill priority-pill--p1">P1</p>
          <p className="login-hint-text">Тестовые учетные записи:</p>
          <ul className="login-hint-list">
            <li>student / password123</li>
            <li>teacher / teacher123</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Login;
