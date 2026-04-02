import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { API_BASE } from "../api/config";
import { getStoredUser, setStoredUser } from "../auth/storage";

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
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">Вход</h1>
          <p className="card-subtitle">Получите доступ к вашим курсам</p>
        </div>
        {error ? (
          <p className="login-error" role="alert">
            {error}
          </p>
        ) : null}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login">
              Логин
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
              placeholder="пароль"
              autoComplete="current-password"
            />
          </div>
          <button className="primary-button" type="submit">
            Войти
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
