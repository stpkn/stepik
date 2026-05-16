import React, { useEffect, useState } from "react";
import { API_BASE } from "../api/config";

function emptyQuestion() {
  return {
    text: "",
    answers: [
      { text: "", is_correct: true },
      { text: "", is_correct: false },
    ],
  };
}

function emptyPracticeTask() {
  return {
    title: "",
    task: "",
    solution: "",
    tests: "",
  };
}

export default function CreateCourseModal({
  isOpen,
  onClose,
  teacherId,
  onCourseCreated,
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [theory, setTheory] = useState("");
  const [practiceTasks, setPracticeTasks] = useState([emptyPracticeTask()]);
  const [aiTargetTaskIndex, setAiTargetTaskIndex] = useState(0);
  const [flashcards, setFlashcards] = useState("");
  const [aiMode, setAiMode] = useState("tests");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [aiError, setAiError] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setDescription("");
      setTheory("");
      setPracticeTasks([emptyPracticeTask()]);
      setAiTargetTaskIndex(0);
      setFlashcards("");
      setAiMode("tests");
      setAiPrompt("");
      setAiResult("");
      setAiError(null);
      setAiLoading(false);
      setQuestions([]);
      setSubmitting(false);
    }
  }, [isOpen]);

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

  const addQuestion = () => {
    setQuestions((prev) => [...prev, emptyQuestion()]);
  };

  const addPracticeTask = () => {
    setPracticeTasks((prev) => {
      const next = [...prev, emptyPracticeTask()];
      setAiTargetTaskIndex(next.length - 1);
      return next;
    });
  };

  const removePracticeTask = (index) => {
    setPracticeTasks((prev) => {
      if (prev.length <= 1) return [emptyPracticeTask()];
      const next = prev.filter((_, i) => i !== index);
      const nextIndex = Math.max(0, Math.min(aiTargetTaskIndex, next.length - 1));
      setAiTargetTaskIndex(nextIndex);
      return next;
    });
  };

  const setPracticeTaskField = (index, field, value) => {
    setPracticeTasks((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const removeQuestion = (qi) => {
    setQuestions((prev) => prev.filter((_, i) => i !== qi));
  };

  const setQuestionText = (qi, value) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qi ? { ...q, text: value } : q))
    );
  };

  const addAnswer = (qi) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i !== qi
          ? q
          : { ...q, answers: [...q.answers, { text: "", is_correct: false }] }
      )
    );
  };

  const removeAnswer = (qi, ai) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qi) return q;
        if (q.answers.length <= 2) return q;
        const next = q.answers.filter((_, j) => j !== ai);
        if (!next.some((a) => a.is_correct)) next[0] = { ...next[0], is_correct: true };
        return { ...q, answers: next };
      })
    );
  };

  const setAnswerText = (qi, ai, value) => {
    setQuestions((prev) =>
      prev.map((q, qIdx) =>
        qIdx !== qi
          ? q
          : {
              ...q,
              answers: q.answers.map((a, aIdx) =>
                aIdx === ai ? { ...a, text: value } : a
              ),
            }
      )
    );
  };

  const setCorrectAnswer = (qi, ai) => {
    setQuestions((prev) =>
      prev.map((q, qIdx) =>
        qIdx !== qi
          ? q
          : {
              ...q,
              answers: q.answers.map((a, aIdx) => ({
                ...a,
                is_correct: aIdx === ai,
              })),
            }
      )
    );
  };

  const normalizeAiText = (text) =>
    text.replace(/```json/gi, "").replace(/```/g, "").trim();

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) {
      window.alert("Введите описание для генерации");
      return;
    }

    setAiLoading(true);
    setAiError(null);

    try {
      const res = await fetch(`${API_BASE}/teacher/${teacherId}/assistant/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: aiMode, text: aiPrompt.trim() }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setAiResult(normalizeAiText(data.result || ""));
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Ошибка генерации");
    } finally {
      setAiLoading(false);
    }
  };

  const applyAiResult = () => {
    const text = normalizeAiText(aiResult);
    if (!text) {
      window.alert("Нет результата для вставки");
      return;
    }

    if (aiMode === "tests") {
      if (!practiceTasks.length) {
        setPracticeTasks([emptyPracticeTask()]);
        setAiTargetTaskIndex(0);
        setPracticeTaskField(0, "tests", text);
        return;
      }
      setPracticeTaskField(aiTargetTaskIndex, "tests", text);
      return;
    }
    if (aiMode === "flashcards") {
      setFlashcards(text);
      return;
    }
    if (aiMode === "questions") {
      try {
        const data = JSON.parse(text);
        if (!Array.isArray(data)) {
          window.alert("Ожидается JSON массив вопросов");
          return;
        }
        setQuestions(data);
      } catch (err) {
        window.alert("Неверный JSON для вопросов: " + err.message);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) {
      window.alert("Укажите название курса");
      return;
    }
    for (let qi = 0; qi < questions.length; qi++) {
      const q = questions[qi];
      if (!q.text.trim()) {
        window.alert(`Заполните текст вопроса ${qi + 1} или удалите пустой вопрос`);
        return;
      }
      if (q.answers.length < 2) {
        window.alert(`Вопрос ${qi + 1}: нужно минимум два варианта ответа`);
        return;
      }
      const correct = q.answers.filter((a) => a.is_correct).length;
      if (correct !== 1) {
        window.alert(`Вопрос ${qi + 1}: отметьте ровно один правильный ответ`);
        return;
      }
      for (let ai = 0; ai < q.answers.length; ai++) {
        if (!q.answers[ai].text.trim()) {
          window.alert(`Вопрос ${qi + 1}: заполните текст всех ответов`);
          return;
        }
      }
    }
    const rawTasks = practiceTasks
      .map((task) => ({
        title: task.title.trim(),
        task: task.task.trim(),
        solution: task.solution.trim(),
        testsRaw: task.tests.trim(),
      }))
      .filter((task) => task.title || task.task || task.solution || task.testsRaw);

    const codingTasks = [];
    for (let i = 0; i < rawTasks.length; i++) {
      const task = rawTasks[i];
      const label = `Практическое задание ${i + 1}`;
      if (!task.task) {
        window.alert(`${label}: заполните описание задания`);
        return;
      }
      let tests = [];
      if (task.testsRaw) {
        try {
          tests = JSON.parse(task.testsRaw);
          if (!Array.isArray(tests)) {
            window.alert(`${label}: тесты должны быть JSON массивом объектов {input, expected_output}`);
            return;
          }
          for (const test of tests) {
            const hasInput = Object.prototype.hasOwnProperty.call(test, "input");
            const hasExpected = Object.prototype.hasOwnProperty.call(test, "expected_output");
            if (!hasInput || typeof test.input !== "string" || !hasExpected || typeof test.expected_output !== "string") {
              window.alert(`${label}: каждый тест должен иметь поля input и expected_output (строки)`);
              return;
            }
          }
        } catch (err) {
          window.alert(`${label}: неверный JSON в поле тестов: ${err.message}`);
          return;
        }
      }
      codingTasks.push({
        title: task.title || null,
        task: task.task,
        solution: task.solution,
        tests,
      });
    }

    // Validate flashcards if provided
    let cards = [];
    if (flashcards.trim()) {
      try {
        cards = JSON.parse(flashcards);
        if (!Array.isArray(cards)) {
          window.alert("Карточки должны быть JSON массивом объектов {question, answer}");
          return;
        }
        for (const card of cards) {
          if (!card.question || typeof card.question !== 'string' ||
              !card.answer || typeof card.answer !== 'string') {
            window.alert("Каждая карточка должна иметь поля: question (строка) и answer (строка)");
            return;
          }
        }
      } catch (err) {
        window.alert("Неверный JSON в поле карточек: " + err.message);
        return;
      }
    }

    const body = {
      title: t,
      description: description.trim(),
      theory: theory.trim(),
      coding_tasks: codingTasks,
      flashcards: cards,
      questions: questions.map((q) => ({
        text: q.text.trim(),
        answers: q.answers.map((a) => ({
          text: a.text.trim(),
          is_correct: a.is_correct,
        })),
      })),
    };

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/teacher/${teacherId}/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || res.statusText);
      }
      window.alert("Курс создан");
      onClose();
      onCourseCreated();
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : "Не удалось создать курс"
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
        className="add-student-modal__panel create-course-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-course-modal-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="add-student-modal__head">
          <h2 id="create-course-modal-title" className="add-student-modal__title">
            Новый курс
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
            <label className="form-label" htmlFor="course-title">
              Название курса <span aria-hidden="true">*</span>
            </label>
            <input
              id="course-title"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="course-desc">
              Описание
            </label>
            <textarea
              id="course-desc"
              className="form-input create-course-modal__textarea"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="course-theory">
              Теория
            </label>
            <textarea
              id="course-theory"
              className="form-input create-course-modal__textarea"
              rows={4}
              value={theory}
              onChange={(e) => setTheory(e.target.value)}
              placeholder="Лекционный материал, определения…"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="ai-helper-mode">
              AI помощник (GigaChat)
            </label>
            <select
              id="ai-helper-mode"
              className="form-input"
              value={aiMode}
              onChange={(e) => setAiMode(e.target.value)}
            >
              <option value="tests">Тесты для практики</option>
              <option value="questions">Вопросы к теории</option>
              <option value="flashcards">Флеш-карточки</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="ai-helper-prompt">
              Текст для генерации
            </label>
            <textarea
              id="ai-helper-prompt"
              className="form-input create-course-modal__textarea"
              rows={3}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder={
                aiMode === "tests"
                  ? "Опишите практическое задание для генерации тестов"
                  : "Вставьте теорию для генерации вопросов или карточек"
              }
            />
            <div className="create-course-modal__toolbar">
              <button
                type="button"
                className="teacher-btn teacher-btn--secondary"
                onClick={handleAiGenerate}
                disabled={aiLoading}
              >
                {aiLoading ? "Генерация..." : "Сгенерировать"}
              </button>
            </div>
            {aiMode === "tests" ? (
              <div className="form-group">
                <label className="form-label" htmlFor="ai-helper-task-target">
                  Практика для тестов
                </label>
                <select
                  id="ai-helper-task-target"
                  className="form-input"
                  value={aiTargetTaskIndex}
                  onChange={(e) => setAiTargetTaskIndex(Number(e.target.value))}
                >
                  {practiceTasks.map((_, idx) => (
                    <option key={idx} value={idx}>
                      Практика {idx + 1}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            {aiError && (
              <small style={{ color: "#b91c1c", display: "block", marginTop: "6px" }}>
                {aiError}
              </small>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="ai-helper-result">
              Результат генерации
            </label>
            <textarea
              id="ai-helper-result"
              className="form-input create-course-modal__textarea"
              rows={4}
              value={aiResult}
              onChange={(e) => setAiResult(e.target.value)}
              placeholder="Результат появится здесь"
            />
            <div className="create-course-modal__toolbar">
              <button
                type="button"
                className="teacher-btn teacher-btn--secondary"
                onClick={applyAiResult}
                disabled={!aiResult.trim()}
              >
                Вставить в курс
              </button>
            </div>
          </div>
          <div className="create-course-modal__toolbar">
            <button
              type="button"
              className="teacher-btn teacher-btn--secondary"
              onClick={addPracticeTask}
            >
              + Практическое задание
            </button>
          </div>

          {practiceTasks.map((task, idx) => (
            <div key={idx} className="create-course-modal__question">
              <div className="create-course-modal__question-head">
                <p className="create-course-modal__question-label">
                  Практика {idx + 1}
                </p>
                <button
                  type="button"
                  className="teacher-btn teacher-btn--danger create-course-modal__q-remove"
                  onClick={() => removePracticeTask(idx)}
                >
                  Удалить практику
                </button>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor={`course-task-title-${idx}`}>
                  Название практики
                </label>
                <input
                  id={`course-task-title-${idx}`}
                  className="form-input"
                  value={task.title}
                  onChange={(e) => setPracticeTaskField(idx, "title", e.target.value)}
                  placeholder="Например: Работа со строками"
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor={`course-coding-task-${idx}`}>
                  Практика: задание
                </label>
                <textarea
                  id={`course-coding-task-${idx}`}
                  className="form-input create-course-modal__textarea"
                  rows={3}
                  value={task.task}
                  onChange={(e) => setPracticeTaskField(idx, "task", e.target.value)}
                  placeholder="Формулировка задачи для студента"
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor={`course-coding-sol-${idx}`}>
                  Практика: пример решения
                </label>
                <textarea
                  id={`course-coding-sol-${idx}`}
                  className="form-input create-course-modal__textarea"
                  rows={3}
                  value={task.solution}
                  onChange={(e) => setPracticeTaskField(idx, "solution", e.target.value)}
                  placeholder="Образец решения (для проверки себя)"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor={`course-test-cases-${idx}`}>
                  Практика: тесты (JSON)
                </label>
                <textarea
                  id={`course-test-cases-${idx}`}
                  className="form-input create-course-modal__textarea"
                  rows={4}
                  value={task.tests}
                  onChange={(e) => setPracticeTaskField(idx, "tests", e.target.value)}
                  placeholder={'[{"input": "2", "expected_output": "4"}, {"input": "3", "expected_output": "9"}]'}
                />
                <small style={{ color: "#666", display: "block", marginTop: "5px" }}>
                  JSON массив объектов с полями: input (входные данные) и expected_output (ожидаемый результат)
                </small>
              </div>
            </div>
          ))}

          <div className="form-group">
            <label className="form-label" htmlFor="course-flashcards">
              Карточки для запоминания (JSON)
            </label>
            <textarea
              id="course-flashcards"
              className="form-input create-course-modal__textarea"
              rows={4}
              value={flashcards}
              onChange={(e) => setFlashcards(e.target.value)}
              placeholder={'[{"question": "Что такое переменная?", "answer": "Переменная - это..."}, {"question": "Что такое функция?", "answer": "Функция - это..."}]'}
            />
            <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
              JSON массив объектов с полями: question (вопрос) и answer (ответ)
            </small>
          </div>

          <div className="create-course-modal__toolbar">
            <button
              type="button"
              className="teacher-btn teacher-btn--secondary"
              onClick={addQuestion}
            >
              Добавить вопрос
            </button>
          </div>

          {questions.map((q, qi) => (
            <div key={qi} className="create-course-modal__question">
              <div className="create-course-modal__question-head">
                <p className="create-course-modal__question-label">
                  Вопрос {qi + 1}
                </p>
                <button
                  type="button"
                  className="teacher-btn teacher-btn--danger create-course-modal__q-remove"
                  onClick={() => removeQuestion(qi)}
                >
                  Удалить вопрос
                </button>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor={`course-q-${qi}`}>
                  Текст вопроса <span aria-hidden="true">*</span>
                </label>
                <input
                  id={`course-q-${qi}`}
                  className="form-input"
                  value={q.text}
                  onChange={(e) => setQuestionText(qi, e.target.value)}
                />
              </div>
              <fieldset className="create-course-modal__answers">
                <legend className="form-label">Варианты ответа (отметьте верный)</legend>
                {q.answers.map((a, ai) => (
                  <label
                    key={ai}
                    className="create-course-modal__answer-row"
                  >
                    <input
                      type="radio"
                      name={`course-q${qi}-correct`}
                      checked={a.is_correct}
                      onChange={() => setCorrectAnswer(qi, ai)}
                    />
                    <input
                      type="text"
                      className="form-input"
                      value={a.text}
                      onChange={(e) => setAnswerText(qi, ai, e.target.value)}
                      placeholder={`Ответ ${ai + 1}`}
                    />
                    {q.answers.length > 2 && (
                      <button
                        type="button"
                        className="create-course-modal__answer-remove"
                        onClick={() => removeAnswer(qi, ai)}
                        aria-label="Удалить вариант"
                      >
                        ×
                      </button>
                    )}
                  </label>
                ))}
                <button
                  type="button"
                  className="teacher-btn teacher-btn--secondary create-course-modal__add-answer"
                  onClick={() => addAnswer(qi)}
                >
                  Добавить вариант ответа
                </button>
              </fieldset>
            </div>
          ))}

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
              {submitting ? "Сохранение…" : "Создать курс"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
