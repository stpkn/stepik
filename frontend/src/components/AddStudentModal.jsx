import React, { useEffect, useState } from "react";
import { API_BASE } from "../api/config";

export default function AddStudentModal({
  isOpen,
  onClose,
  teacherId,
  onStudentCreated,
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [coursesList, setCoursesList] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);

  useEffect(() => {
    if (!isOpen) {
      setFirstName("");
      setLastName("");
      setLogin("");
      setPassword("");
      setSubmitting(false);
      setCoursesList([]);
      setSelectedCourses([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    let cancelled = false;
    fetch(`${API_BASE}/teacher/${teacherId}/courses`)
      .then(async (res) => {
        if (!res.ok) {
          const t = await res.text();
          throw new Error(t || res.statusText);
        }
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setCoursesList(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setCoursesList([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, teacherId]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropMouseDown = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const toggleCourse = (courseId) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fn = firstName.trim();
    const ln = lastName.trim();
    if (!fn || !ln) return;
    if (coursesList.length > 0 && selectedCourses.length === 0) {
      window.alert(
        "Выберите хотя бы один курс, чтобы записать ученика. Если курсов нет — сначала создайте курс."
      );
      return;
    }
    setSubmitting(true);
    try {
      const body = { first_name: fn, last_name: ln, course_ids: selectedCourses };
      const lo = login.trim();
      const pw = password;
      if (lo) body.login = lo;
      if (pw) body.password = pw;
      const res = await fetch(`${API_BASE}/teacher/${teacherId}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
      }
      const data = await res.json();
      window.alert(
        `Ученик создан.\nЛогин: ${data.login}\nПароль: ${data.password}`
      );
      onClose();
      onStudentCreated();
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : "Не удалось создать ученика"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="add-student-modal"
      role="presentation"
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        className="add-student-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-student-modal-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="add-student-modal__head">
          <h2 id="add-student-modal-title" className="add-student-modal__title">
            Добавить ученика
          </h2>
          <button
            type="button"
            className="add-student-modal__close"
            onClick={onClose}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>
        <form className="add-student-modal__form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="add-student-first">
              Имя <span aria-hidden="true">*</span>
            </label>
            <input
              id="add-student-first"
              className="form-input"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              autoComplete="given-name"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="add-student-last">
              Фамилия <span aria-hidden="true">*</span>
            </label>
            <input
              id="add-student-last"
              className="form-input"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              autoComplete="family-name"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="add-student-login">
              Логин
            </label>
            <input
              id="add-student-login"
              className="form-input"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="add-student-password">
              Пароль
            </label>
            <input
              id="add-student-password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          {coursesList.length > 0 && (
            <fieldset className="form-group add-student-modal__courses">
              <legend className="form-label">Курсы для записи</legend>
              <p className="add-student-modal__courses-hint">
                Отметьте один или несколько курсов.
              </p>
              {coursesList.map((c) => (
                <label key={c.id} className="add-student-modal__course-row">
                  <input
                    type="checkbox"
                    checked={selectedCourses.includes(c.id)}
                    onChange={() => toggleCourse(c.id)}
                  />
                  <span>{c.title}</span>
                </label>
              ))}
            </fieldset>
          )}
          <div className="add-student-modal__actions">
            <button
              type="button"
              className="teacher-btn teacher-btn--secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Отмена
            </button>
            <button
              type="submit"
              className="teacher-btn teacher-btn--primary"
              disabled={submitting}
            >
              {submitting ? "Сохранение…" : "Создать"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
