import React, { useEffect, useState, useCallback } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { API_BASE } from "../api/config";
import { getStoredUser } from "../auth/storage";
import ThemeToggle from "../components/ThemeToggle";
import CodeEditor from "../components/CodeEditor";
import FlashcardStudy from "../components/FlashcardStudy";
import "../styles/code-editor.css";
import "../styles/flashcard.css";

export default function CoursePage() {
  const { id } = useParams();
  const courseId = Number(id);
  const user = getStoredUser();

  console.log("USER:", user);
  const idValid = Number.isFinite(courseId) && courseId > 0;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState({});
  const [checked, setChecked] = useState({});
  const [progress, setProgress] = useState(0);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const load = useCallback(() => {
    if (!user || user.role !== "student" || !idValid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`${API_BASE}/student/${user.id}/course/${courseId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((json) => {
        setData(json);
        setProgress(json.progress ?? 0);
        if (Array.isArray(json.coding_tasks) && json.coding_tasks.length > 0) {
          setSelectedTaskId(json.coding_tasks[0].id ?? null);
        } else if (json.coding_task || json.coding_solution || (json.tests && json.tests.length > 0)) {
          setSelectedTaskId(null);
        }
        setSelected({});
        const solved = json.solved_question_ids ?? [];
        const chk = {};
        solved.forEach((qid) => {
          chk[qid] = "ok";
        });
        setChecked(chk);
      })
      .catch(() => {
        setData(null);
        setError("Не удалось загрузить курс.");
      })
      .finally(() => setLoading(false));
  }, [user, courseId, idValid]);

 useEffect(() => {
  if (!user?.id || !courseId) return;

  const load = async () => {
    try {
      const res = await fetch(
        `${API_BASE}/student/${user.id}/course/${courseId}`
      );
      const json = await res.json();
      setData(json);
      if (Array.isArray(json.coding_tasks) && json.coding_tasks.length > 0) {
        setSelectedTaskId(json.coding_tasks[0].id ?? null);
      }
    } catch (e) {
      setError("Не удалось загрузить курс");
    } finally {
      setLoading(false);
    }
  };

  load();
}, [user?.id, courseId]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role === "teacher") {
    return <Navigate to="/teacher" replace />;
  }
  if (user.role !== "student") {
    return <Navigate to="/login" replace />;
  }

  if (!idValid) {
    return (
      <div className="dashboard-page">
        <main className="dashboard-main">
          <div className="dashboard-state dashboard-state--error" role="alert">
            <p>Некорректный адрес курса.</p>
            <Link to="/dashboard/learning" className="dashboard-retry-btn">
              К списку курсов
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="dashboard-page">
        <aside className="dashboard-sidebar" aria-label="Навигация">
          <div className="sidebar-brand-row">
            <div className="sidebar-brand">StepikIn Студент</div>
            <ThemeToggle />
          </div>
          <nav className="sidebar-nav">
            <Link to="/dashboard" className="sidebar-link">
              Главная
            </Link>
          </nav>
        </aside>
        <main className="dashboard-main">
          <div className="dashboard-state dashboard-state--loading" role="status">
            <p>Загрузка курса…</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="dashboard-page">
        <aside className="dashboard-sidebar" aria-label="Навигация">
          <div className="sidebar-brand-row">
            <div className="sidebar-brand">StepikIn Студент</div>
            <ThemeToggle />
          </div>
          <Link to="/dashboard/learning" className="sidebar-link">
            ← К курсам
          </Link>
        </aside>
        <main className="dashboard-main">
          <div className="dashboard-state dashboard-state--error" role="alert">
            <p>{error || "Нет данных"}</p>
            <button type="button" className="dashboard-retry-btn" onClick={load}>
              Повторить
            </button>
          </div>
        </main>
      </div>
    );
  }

  const selectAnswer = (questionId, answerId) => {
    setSelected((prev) => ({ ...prev, [questionId]: answerId }));
  };

  const checkQuestion = async (questionId) => {
    const answerId = selected[questionId];
    if (answerId == null) {
      window.alert("Выберите вариант ответа");
      return;
    }
    try {
      const res = await fetch(
        `${API_BASE}/student/${user.id}/course/${courseId}/answer`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question_id: questionId, answer_id: answerId }),
        }
      );
      if (!res.ok) throw new Error(await res.text());
      const out = await res.json();
      setChecked((prev) => ({
        ...prev,
        [questionId]: out.correct ? "ok" : "bad",
      }));
      setProgress(out.progress ?? progress);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Ошибка проверки");
    }
  };

  return (
    <div className="dashboard-page">
      <aside className="dashboard-sidebar" aria-label="Навигация">
        <div className="sidebar-brand-row">
          <div className="sidebar-brand">StepikIn Студент</div>
          <ThemeToggle />
        </div>
        <nav className="sidebar-nav">
          <Link to="/dashboard" className="sidebar-link">
            Главная
          </Link>
          <Link to="/dashboard/learning" className="sidebar-link">
            Моё обучение
          </Link>
        </nav>
      </aside>
      <main className="dashboard-main course-page">
        <header className="dashboard-main-header">
          <p className="course-page__breadcrumb">
            <Link to="/dashboard/learning">Моё обучение</Link>
            <span aria-hidden="true"> / </span>
            <span>{data.title}</span>
          </p>
          <h1 className="dashboard-welcome">{data.title}</h1>
          {data.description ? (
            <p className="dashboard-subtitle course-page__lead">{data.description}</p>
          ) : null}
          <div className="course-page__progress-meta">
            <span className="progress-label">Прогресс по курсу: {progress}%</span>
            <div className="progress-track course-page__progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </header>

        {data.theory ? (
          <section className="dashboard-section" aria-labelledby="course-theory">
            <h2 id="course-theory" className="dashboard-section-title">
              Теория
            </h2>
            <div className="course-page__block">{data.theory}</div>
          </section>
        ) : null}

        {data.questions?.length > 0 ? (
          <section className="dashboard-section" aria-labelledby="course-quiz">
            <h2 id="course-quiz" className="dashboard-section-title">
              Тест
            </h2>
            <div className="course-page__questions">
              {data.questions.map((q, idx) => {
                const done = checked[q.id] === "ok";
                return (
                <article key={q.id} className="course-page__question-card">
                  <h3 className="course-page__question-title">
                    {idx + 1}. {q.text}
                  </h3>
                  {done ? (
                    <p className="course-page__result course-page__result--ok">
                      Верно — ответ засчитан
                    </p>
                  ) : (
                    <>
                      <div className="course-page__options" role="radiogroup" aria-label={q.text}>
                        {q.answers.map((a) => (
                          <label key={a.id} className="course-page__option">
                            <input
                              type="radio"
                              name={`q-${q.id}`}
                              checked={selected[q.id] === a.id}
                              onChange={() => selectAnswer(q.id, a.id)}
                            />
                            <span>{a.text}</span>
                          </label>
                        ))}
                      </div>
                      <div className="course-page__check-row">
                        <button
                          type="button"
                          className="teacher-btn teacher-btn--primary"
                          onClick={() => checkQuestion(q.id)}
                        >
                          Проверить
                        </button>
                        {checked[q.id] === "bad" && (
                          <span className="course-page__result course-page__result--bad">
                            Неверно, попробуйте снова
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </article>
              );
              })}
            </div>
          </section>
        ) : null}

        {(() => {
          const hasLegacy = data.coding_task || data.coding_solution || (data.tests && data.tests.length > 0);
          const tasks = Array.isArray(data.coding_tasks) && data.coding_tasks.length > 0
            ? data.coding_tasks
            : hasLegacy
            ? [
                {
                  id: null,
                  title: "",
                  task: data.coding_task || "",
                  solution: data.coding_solution || "",
                  tests: data.tests || [],
                },
              ]
            : [];
          if (!tasks.length) return null;
          const activeTask = tasks.find((t) => t.id === selectedTaskId) || tasks[0];
          const activeIndex = tasks.indexOf(activeTask);
          return (
            <section className="dashboard-section" aria-labelledby="course-code">
              <h2 id="course-code" className="dashboard-section-title">
                💻 Практика с кодом
              </h2>
              {tasks.length > 1 ? (
                <div className="form-group">
                  <label className="form-label" htmlFor="course-task-select">
                    Выберите практику
                  </label>
                  <select
                    id="course-task-select"
                    className="form-input"
                    value={activeTask.id ?? activeIndex}
                    onChange={(e) => {
                      const value = e.target.value;
                      const numericValue = Number(value);
                      if (Number.isFinite(numericValue)) {
                        const task = tasks.find((t) => t.id === numericValue) || tasks[numericValue];
                        setSelectedTaskId(task?.id ?? null);
                      } else {
                        setSelectedTaskId(null);
                      }
                    }}
                  >
                    {tasks.map((task, idx) => (
                      <option key={task.id ?? idx} value={task.id ?? idx}>
                        {task.title?.trim() || `Практика ${idx + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              <CodeEditor
                courseId={courseId}
                studentId={user.id}
                task={activeTask.task || ""}
                tests={activeTask.tests || []}
                taskId={activeTask.id}
              />
            </section>
          );
        })()}

        <section className="dashboard-section" aria-labelledby="course-flashcards">
          <h2 id="course-flashcards" className="dashboard-section-title">
            Карточки для запоминания
          </h2>
          <FlashcardStudy
            courseId={courseId}
            studentId={user.id}
          />
        </section>
      </main>
    </div>
  );
}
