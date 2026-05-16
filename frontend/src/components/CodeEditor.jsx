import React, { useState, useEffect } from 'react';
import { API_BASE } from '../api/config';
import '../styles/code-editor.css';

function CodeEditor({ courseId, studentId, task, tests, taskId }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [bestSubmission, setBestSubmission] = useState(null);
  const visibleTests = Array.isArray(tests) ? tests.slice(0, 3) : [];
  const hasHiddenTests = Array.isArray(tests) && tests.length > 3;

  useEffect(() => {
    // Загрузить историю попыток
    loadSubmissions();
  }, [courseId, studentId, taskId]);

  const loadSubmissions = async () => {
    try {
      const query = taskId != null ? `?task_id=${taskId}` : "";
      const response = await fetch(
        `${API_BASE}/student/${studentId}/courses/${courseId}/submissions${query}`,
        { method: 'GET', headers: { 'Content-Type': 'application/json' } }
      );
      const data = await response.json();
      setSubmissions(data);
      
      // Найти лучшую попытку
      const best = data.find(s => s.is_correct);
      setBestSubmission(best);
    } catch (error) {
      console.error('Error loading submissions:', error);
    }
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      alert('Пожалуйста, напишите код');
      return;
    }

    setLoading(true);
    try {
      const payload = taskId != null ? { code, task_id: taskId } : { code };
      const response = await fetch(
        `${API_BASE}/student/${studentId}/courses/${courseId}/submit-code`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      const raw = await response.text();
      let data = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch (parseError) {
        throw new Error(raw || 'Некорректный ответ сервера');
      }
      if (!response.ok) {
        throw new Error(data?.detail || data?.message || raw || 'Ошибка сервера');
      }

      setResults(data);
      
      // Перезагрузить историю
      await loadSubmissions();
      
      if (data.success) {
        setCode('');
        alert('Все тесты пройдены!');
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert(error?.message || 'Ошибка при отправке кода');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="practice-shell">
      <div className="practice-grid">
        <section className="practice-pane practice-pane--task">
          <div className="pane-header">📝 Задание</div>
          <div className="pane-body">
            <h2 className="task-title">Практика</h2>
            <div className="task-text">
              {task || 'Нет описания задания'}
            </div>

            <div className="section-title">Примеры тестов</div>
            <div className="tests-list">
              {visibleTests.length > 0 ? (
                visibleTests.map((test, i) => (
                  <div key={i} className="test-card">
                    <div className="test-label">Ввод</div>
                    <div className="test-value">{test.input}</div>
                    <div className="test-label">Ожидаемый вывод</div>
                    <div className="test-value">{test.expected_output}</div>
                  </div>
                ))
              ) : (
                <div className="empty-state">Нет примеров тестов</div>
              )}
            </div>
            

            {bestSubmission && (
              <div className="best-card">
                <div className="best-title">Лучшая попытка</div>
                <div className="best-meta">
                  {new Date(bestSubmission.created_at).toLocaleString('ru-RU')}
                </div>
                <div className="best-meta">
                  Время: {bestSubmission.execution_time?.toFixed(3)}s
                </div>
                <button className="ghost-button" onClick={() => setCode(bestSubmission.code)}>
                  Загрузить код
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="practice-pane practice-pane--editor">
          <div className="pane-header pane-header--editor">
            <div className="editor-title">Редактор кода (Python)</div>
            <span className="char-count">{code.length} символов</span>
          </div>
          <div className="pane-body pane-body--editor">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="# Напишите решение здесь
def solution(n):
    # ваш код
    return result

# Можно тестировать с помощью input()
result = solution(int(input()))
print(result)"
              className="code-textarea"
              spellCheck="false"
            />
          </div>
          <div className="editor-actions">
            <button
              onClick={handleSubmit}
              disabled={loading || !code.trim()}
              className={`primary-button ${loading ? 'loading' : ''}`}
            >
              {loading ? 'Проверяю...' : 'Отправить на проверку'}
            </button>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="ghost-button"
            >
              История ({submissions.length})
            </button>
            <button
              onClick={() => setCode('')}
              className="danger-button"
            >
              Очистить
            </button>
          </div>
        </section>

        <section className="practice-pane practice-pane--tests">
          <div className="pane-header">Тесты и результаты</div>
          <div className="pane-body">
            {results ? (
              <div className="results-wrap">
                <div className={`results-title ${results.success ? 'ok' : 'bad'}`}>
                  {results.message}
                </div>
                <div className="results-list">
                  {results.results.map((result, i) => (
                    <div key={i} className={`result-card ${result.passed ? 'passed' : 'failed'}`}>
                      <div className="result-head">
                        <span>Тест {result.test_number}</span>
                        <span className="result-badge">
                          {result.passed ? 'PASSED' : 'FAILED'}
                        </span>
                        {result.time && <span className="result-time">{result.time}s</span>}
                      </div>
                      <div className="result-row">
                        <span className="result-label">Input</span>
                        <span className="result-value">{result.input}</span>
                      </div>
                      <div className="result-row">
                        <span className="result-label">Expected</span>
                        <span className="result-value">{result.expected}</span>
                      </div>
                      <div className="result-row">
                        <span className="result-label">Actual</span>
                        <span className="result-value">{result.actual || result.error || '(нет вывода)'}</span>
                      </div>
                      {result.error && result.passed === false && (
                        <div className="result-error">{result.error}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="empty-state">Пока нет результатов</div>
            )}

            {showHistory && submissions.length > 0 && (
              <div className="history-wrap">
                <div className="section-title">История попыток</div>
                <div className="history-list">
                  {submissions.map((sub, i) => (
                    <div key={sub.id} className={`history-item ${sub.is_correct ? 'ok' : 'bad'}`}>
                      <div className="history-info">
                        <span>Попытка {i + 1}</span>
                        <span>{new Date(sub.created_at).toLocaleString('ru-RU')}</span>
                      </div>
                      <button className="ghost-button" onClick={() => setCode(sub.code)}>
                        Загрузить
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default CodeEditor;
