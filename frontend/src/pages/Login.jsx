import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch("http://localhost:8000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ login, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.detail || "Login failed");
        return;
      }

      const data = await response.json();
      alert(data.message || "Login successful");

      setLogin("");
      setPassword("");
      navigate("/dashboard", { state: { user: login } });
    } catch (error) {
      alert("Error connecting to server");
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h1 className="card-title">Sign in</h1>
        <p className="card-subtitle">Access your programming courses demo</p>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="login">
            Login
          </label>
          <input
            id="login"
            className="form-input"
            type="text"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            required
            placeholder="student"
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className="form-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="password123"
          />
        </div>
        <button className="primary-button" type="submit">
          Log in
        </button>
      </form>
    </div>
  );
}

export default Login;

