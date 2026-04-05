import React from "react";
import { useTheme } from "../context/ThemeContext";

function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={isDark ? "Переключить на светлую тему" : "Переключить на темную тему"}
      title={isDark ? "Светлая тема" : "Темная тема"}
    >
      <span className="theme-toggle__icon" aria-hidden="true">
        {isDark ? "S" : "T"}
      </span>
      <span className="theme-toggle__text">{isDark ? "Светлая" : "Темная"}</span>
    </button>
  );
}

export default ThemeToggle;
