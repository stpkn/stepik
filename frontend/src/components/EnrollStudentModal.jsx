import React, { useEffect, useState } from "react";
import { API_BASE } from "../api/config";

export default function EnrollStudentModal({ isOpen, onClose, teacherId, onEnrolled }) {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    Promise.all([
      fetch(`${API_BASE}/teacher/${teacherId}/students`).then(r => r.ok ? r.json() : []),
      fetch(`${API_BASE}/teacher/${teacherId}/courses`).then(r => r.ok ? r.json() : [])
    ]).then(([s, c]) => {
      setStudents(s);
      setCourses(c);
      setLoading(false);
    });
  }, [isOpen, teacherId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !selectedCourse) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/teacher/${teacherId}/courses/${selectedCourse}/enroll/${selectedStudent}`, {
        method: "POST",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Ошибка зачисления");
      }
      alert("✅ Ученик успешно зачислен");
      onClose();
      onEnrolled?.();
    } catch (err) {
      alert(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="add-student-modal" role="presentation" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="add-student-modal__panel" role="dialog" aria-modal="true" onMouseDown={e => e.stopPropagation()}>
        <div className="add-student-modal__head">
          <h2 className="add-student-modal__title">Зачислить ученика на курс</h2>
          <button type="button" className="add-student-modal__close" onClick={onClose} aria-label="Закрыть">×</button>
        </div>

        <form className="add-student-modal__form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Ученик</label>
            <select
              className="form-input"
              value={selectedStudent}
              onChange={e => setSelectedStudent(e.target.value)}
              required
              disabled={loading || students.length === 0}
            >
              <option value="">Выберите ученика</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.login})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Курс</label>
            <select
              className="form-input"
              value={selectedCourse}
              onChange={e => setSelectedCourse(e.target.value)}
              required
              disabled={loading || courses.length === 0}
            >
              <option value="">Выберите курс</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          <div className="add-student-modal__actions">
            <button type="button" className="teacher-btn teacher-btn--secondary" onClick={onClose} disabled={loading}>
              Отмена
            </button>
            <button type="submit" className="teacher-btn teacher-btn--primary" disabled={loading || !selectedStudent || !selectedCourse}>
              {loading ? "Зачисление…" : "Зачислить"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}