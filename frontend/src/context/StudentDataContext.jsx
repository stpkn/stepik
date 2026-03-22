import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Outlet } from "react-router-dom";
import { API_BASE } from "../api/config";

const StudentDataContext = createContext(null);

export function useStudentData() {
  const ctx = useContext(StudentDataContext);
  if (!ctx) {
    throw new Error("useStudentData должен использоваться внутри StudentDataProvider");
  }
  return ctx;
}

async function fetchStudentPayload(id) {
  const res = await fetch(`${API_BASE}/student/${id}`);
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || `Ошибка ${res.status}`);
  }
  return res.json();
}

export function StudentDataProvider({ studentId }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const load = useCallback(() => {
    if (!studentId) {
      setLoading(false);
      setError("Не указан студент");
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    fetchStudentPayload(studentId)
      .then(setData)
      .catch(() => {
        setData(null);
        setError("Не удалось загрузить данные студента. Проверьте, что сервер запущен.");
      })
      .finally(() => setLoading(false));
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  const value = { loading, error, data, reload: load };

  return (
    <StudentDataContext.Provider value={value}>
      <StudentDataOutlet />
    </StudentDataContext.Provider>
  );
}

function StudentDataOutlet() {
  const { loading, error, data, reload } = useStudentData();

  if (loading) {
    return (
      <div className="dashboard-state dashboard-state--loading" role="status">
        <p>Загрузка…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-state dashboard-state--error" role="alert">
        <p>{error}</p>
        <button type="button" className="dashboard-retry-btn" onClick={reload}>
          Повторить
        </button>
      </div>
    );
  }

  return <Outlet context={data} />;
}
