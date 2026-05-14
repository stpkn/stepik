import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { getAverageProgress } from "../data/mockStudent";

function Statistics() {
  const data = useOutletContext();
  const courses = data?.courses ?? [];
  const stats = data?.stats ?? {};
  const avg = getAverageProgress(courses);

  // 👇 Состояние для сохранённой картинки
  const [savedImage, setSavedImage] = useState(null);
  const studentId = data?.id ?? "anon"; // Ключ для localStorage

  // 1. Загружаем картинку при открытии страницы
  useEffect(() => {
    const stored = localStorage.getItem(`stats_img_${studentId}`);
    if (stored) setSavedImage(stored);
  }, [studentId]);

  // 2. Обработка выбора файла
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Лимит 2 МБ (localStorage вмещает ~5 МБ, лучше не превышать)
    if (file.size > 2 * 1024 * 1024) {
      alert("Файл слишком большой. Максимум 2 МБ.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result;
      setSavedImage(base64);
      try {
        localStorage.setItem(`stats_img_${studentId}`, base64);
      } catch (err) {
        alert("Не удалось сохранить: переполнено хранилище браузера");
      }
    };
    reader.readAsDataURL(file);
  };

  // 3. Удаление картинки
  const removeImage = () => {
    setSavedImage(null);
    localStorage.removeItem(`stats_img_${studentId}`);
  };

  return (
    <>
      <header className="dashboard-main-header">
        <h1 className="dashboard-welcome">Статистика</h1>
        <p className="dashboard-subtitle">
          Цифры по обучению и нагрузка по дням недели.
        </p>
      </header>

      <section className="dashboard-section" aria-labelledby="stats-numbers">
        <h2 id="stats-numbers" className="dashboard-section-title">
          Показатели
        </h2>
        <div className="stats-row stats-row--4">
          <div className="stat-tile">
            <span className="stat-tile__value">{stats.completed_courses ?? 0}</span>
            <span className="stat-tile__label">Завершённые курсы</span>
          </div>
          <div className="stat-tile">
            <span className="stat-tile__value">{stats.active_courses ?? 0}</span>
            <span className="stat-tile__label">Активные курсы</span>
          </div>
          <div className="stat-tile">
            <span className="stat-tile__value">{stats.certificates ?? 0}</span>
            <span className="stat-tile__label">Сертификаты</span>
          </div>
          <div className="stat-tile">
            <span className="stat-tile__value">{stats.study_hours ?? 0}</span>
            <span className="stat-tile__label">Часы обучения</span>
          </div>
        </div>
      </section>

      <section className="dashboard-section" aria-labelledby="stats-charts">
        <h2 id="stats-charts" className="dashboard-section-title">
          Визуализация
        </h2>
        <div className="chart-cards">
          <div className="chart-card">
            <h3 className="chart-card__title">Средний прогресс по курсам</h3>
            <p className="chart-card__metric">
              <span className="chart-card__metric-value">{avg}%</span>
              <span className="chart-card__metric-label">среднее по всем курсам</span>
            </p>
            <div
              className="progress-track progress-track--lg"
              role="progressbar"
              aria-valuenow={avg}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Средний прогресс: ${avg}%`}
            >
              <div className="progress-fill" style={{ width: `${avg}%` }} />
            </div>
            <p className="chart-card__caption">По вашим курсам из API</p>
          </div>

          {/* 👇 КАРТОЧКА С ЗАГРУЗКОЙ И СОХРАНЕНИЕМ */}
          <div className="chart-card">
            <h3 className="chart-card__title">Добавить изображение</h3>

            {!savedImage ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "30px 20px",
                  border: "2px dashed #cbd5e1",
                  borderRadius: "12px",
                  background: "#f8fafc",
                  cursor: "pointer",
                  transition: "border-color 0.2s"
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#94a3b8"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#cbd5e1"}
              >
                <label style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", cursor: "pointer", width: "100%" }}>
                  <span style={{ fontSize: "2.5rem" }}>🖼️</span>
                  <span style={{ color: "#475569", fontWeight: 500 }}>Нажми, чтобы выбрать из галереи</span>
                  <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>JPG, PNG, WEBP до 2 МБ</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
                </label>
              </div>
            ) : (
              <div style={{ position: "relative", textAlign: "center", padding: "10px 0" }}>
                <img
                  src={savedImage}
                  alt="Сохранённое изображение"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "220px",
                    borderRadius: "10px",
                    objectFit: "cover",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
                  }}
                />
                <button
                  onClick={removeImage}
                  style={{
                    position: "absolute", top: "12px", right: "12px",
                    background: "rgba(0,0,0,0.6)", color: "#fff",
                    border: "none", borderRadius: "50%", width: "32px", height: "32px",
                    cursor: "pointer", fontSize: "1.2rem", lineHeight: "1",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}
                  aria-label="Удалить изображение"
                >
                  ×
                </button>
                <p style={{ marginTop: "12px", fontSize: "0.85rem", color: "#64748b" }}>
                  ✅ Картинка сохранена локально
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

export default Statistics;