import React, { useState, useEffect } from "react";
import { useStudentData } from "../context/StudentDataContext";

function ActivityPage() {
  const { data, loading } = useStudentData();
  const activities = data?.activity ?? [];

  // 👇 Состояние для планировщика (хранится в localStorage)
  const [reminders, setReminders] = useState([]);
  const [newReminder, setNewReminder] = useState("");
  const studentId = data?.id;

  // Загрузка напоминаний при монтировании
  useEffect(() => {
    if (studentId) {
      const saved = localStorage.getItem(`reminders_${studentId}`);
      if (saved) setReminders(JSON.parse(saved));
    }
  }, [studentId]);

  // Сохранение при изменении
  useEffect(() => {
    if (studentId) {
      localStorage.setItem(`reminders_${studentId}`, JSON.stringify(reminders));
    }
  }, [reminders, studentId]);

  const addReminder = (e) => {
    e.preventDefault();
    if (!newReminder.trim()) return;
    setReminders(prev => [
      ...prev,
      { id: Date.now(), text: newReminder.trim(), completed: false }
    ]);
    setNewReminder("");
  };

  const toggleReminder = (id) => {
    setReminders(prev => prev.map(r =>
      r.id === id ? { ...r, completed: !r.completed } : r
    ));
  };

  const deleteReminder = (id) => {
    setReminders(prev => prev.filter(r => r.id !== id));
  };

  // Преобразуем технический action в человекочитаемый текст
  const formatActivity = (item) => {
    if (item.action === "course_opened") return item.details || "Открыт курс";
    if (item.action === "question_solved") return `Решён вопрос: ${item.details}`;
    if (item.action === "code_submitted") return `Отправлен код: ${item.details}`;
    return item.details || item.action;
  };

  if (loading) return <div className="page-loading">Загрузка активности...</div>;

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
          {activities.length === 0 ? (
            <li className="activity-item" style={{ color: "#64748b", fontStyle: "italic" }}>
              Пока нет записей. Открой любой курс, чтобы начать отслеживание!
            </li>
          ) : (
            activities.map((item) => (
              <li key={item.id} className="activity-item">
                <span className="activity-item__text">{formatActivity(item)}</span>
                <span className="activity-item__when">{item.when}</span>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="dashboard-section" aria-labelledby="activity-planning-title">
        <h2 id="activity-planning-title" className="dashboard-section-title">
          Планирование
        </h2>
        <div className="insight-grid">

          {/* 👇 ИНТЕРАКТИВНЫЙ ПЛАНИРОВЩИК — заменил статичную карточку */}
          <article className="insight-card">
            <h3 className="insight-card__title">Планировщик напоминаний</h3>

            {/* Форма добавления */}
            <form onSubmit={addReminder} style={{ display: "flex", gap: "6px", marginBottom: "12px" }}>
              <input
                type="text"
                className="form-input"
                placeholder="Например: Пт 19:00 — ДЗ по FastAPI"
                value={newReminder}
                onChange={(e) => setNewReminder(e.target.value)}
                style={{ fontSize: "0.9rem", padding: "6px 10px", flex: 1 }}
              />
              <button
                type="submit"
                className="teacher-btn teacher-btn--primary"
                style={{ fontSize: "0.85rem", padding: "6px 12px" }}
                disabled={!newReminder.trim()}
              >
                +
              </button>
            </form>

            {/* Список напоминаний */}
            <ul style={{ listStyle: "none", padding: 0, margin: 0, maxHeight: "150px", overflowY: "auto" }}>
              {reminders.length === 0 ? (
                <li style={{ color: "#64748b", fontSize: "0.9rem", fontStyle: "italic" }}>
                  Нет напоминаний. Добавь первое выше!
                </li>
              ) : (
                reminders.map((r) => (
                  <li
                    key={r.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "6px 0",
                      borderBottom: "1px solid #f1f5f9",
                      fontSize: "0.9rem"
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={r.completed}
                      onChange={() => toggleReminder(r.id)}
                      style={{ width: "16px", height: "16px", cursor: "pointer" }}
                    />
                    <span
                      style={{
                        flex: 1,
                        textDecoration: r.completed ? "line-through" : "none",
                        color: r.completed ? "#94a3b8" : "#94a3b8"
                      }}
                    >
                      {r.text}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteReminder(r.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#ef4444",
                        cursor: "pointer",
                        fontSize: "1rem",
                        padding: "2px 4px"
                      }}
                      aria-label="Удалить напоминание"
                    >
                      ×
                    </button>
                  </li>
                ))
              )}
            </ul>
          </article>

        </div>
      </section>
    </>
  );
}

export default ActivityPage;