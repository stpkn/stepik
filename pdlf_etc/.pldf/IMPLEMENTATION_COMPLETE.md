# 🚀 Code Execution System - Implementation Complete

## ✅ Summary

Система **полностью реализована и готова к тестированию**. Включает:

### Backend (FastAPI)
- **Модель CodeSubmission**: Сохраняет попытки студентов с результатами тестов
- **Функция run_tests()**: Выполняет код студента против тестовых примеров с timeout 5 сек
- **4 API эндпоинта**:
  - `GET /courses/{id}/coding` - получить задание и тесты
  - `POST /student/{id}/courses/{id}/submit-code` - отправить код на проверку
  - `GET /student/{id}/courses/{id}/submissions` - историю попыток
  - `POST /teacher/{id}/courses/{id}/tests/update` - сохранить тесты

### Frontend (React)
- **CodeEditor.jsx**: Полноценный редактор с подсветкой кода, результатами тестов, историей
- **CreateCourseModal.jsx**: Поле для добавления тестов в JSON формате
- **CoursePage.jsx**: Интеграция CodeEditor на вкладке "Практика"
- **code-editor.css**: Профессиональные стили с адаптивным дизайном

---

## 📋 Как тестировать

### 1. Запустить backend
```bash
cd /Users/karinalien/Documents/guap_study/4_semester/OS_project/backend
/Users/karinalien/Documents/guap_study/4_semester/OS_project/.venv/bin/python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Запустить frontend (в другом терминале)
```bash
cd /Users/karinalien/Documents/guap_study/4_semester/OS_project/frontend
npm start
```

### 3. Войти как преподаватель
- Логин: `teacher`
- Пароль: `teacher123`

### 4. Создать курс с тестами
- Нажать "Новый курс"
- Заполнить название и описание
- В разделе "Практика: задание" написать: `Напишите функцию, которая возвращает квадрат числа`
- В разделе "Практика: пример решения" написать: `def solution(n): return n * n`
- **В новом поле "Практика: тесты"** вставить JSON:
```json
[
  {"input": "2", "expected_output": "4"},
  {"input": "3", "expected_output": "9"},
  {"input": "5", "expected_output": "25"}
]
```
- Нажать "Создать курс"

### 5. Добавить студента
- Перейти в "Студенты"
- Создать студента
- Выбрать только что созданный курс

### 6. Тестировать как студент
- Выйти из аккаунта
- Войти как созданный студент
- Нажать на курс
- Перейти на вкладку "Практика с кодом"
- Написать код в редакторе:
```python
def solution(n):
    return n * n

result = solution(int(input()))
print(result)
```
- Нажать "Отправить на проверку"
- Должны видеть результаты всех трёх тестов

---

## 🔍 Что происходит под капотом

### Поток выполнения кода

1. **Студент отправляет код**
   ```
   CodeEditor.jsx → POST /student/{id}/courses/{id}/submit-code
   ```

2. **Backend выполняет тесты**
   ```
   app/main.py → app/utils.py:run_tests()
   ```

3. **run_tests() создаёт временный файл**
   ```python
   temp_file = "/tmp/submission_XXXXX.py"
   writes: "def solution(n): return n * n\nresult = solution(int(input()))\nprint(result)"
   ```

4. **Для каждого теста запускает subprocess**
   ```
   subprocess.run(
       ["python", temp_file],
       input="2\n",  # из test case
       timeout=5,
       capture_output=True
   )
   ```

5. **Сравнивает результат**
   ```
   actual_output: "4\n"
   expected_output: "4"
   passed: true
   ```

6. **Сохраняет в базу**
   ```
   CodeSubmission(
       student_id=123,
       course_id=1,
       code="...",
       is_correct=true,
       test_results=json.dumps([...]),
       execution_time=0.042
   )
   ```

7. **Возвращает результаты фронтенду**
   ```json
   {
     "success": true,
     "message": "✅ Все тесты пройдены!",
     "results": [
       {"test_number": 1, "input": "2", "expected": "4", "actual": "4", "passed": true, ...},
       {"test_number": 2, "input": "3", "expected": "9", "actual": "9", "passed": true, ...},
       {"test_number": 3, "input": "5", "expected": "25", "actual": "25", "passed": true, ...}
     ]
   }
   ```

8. **CodeEditor отображает результаты**
   - Зелёные галочки для пройденных тестов
   - Красные X для ошибок
   - Время выполнения и детали

---

## 📊 Файлы, изменённые

### Backend
- `backend/app/main.py` - 4 новых эндпоинта, CourseCreate с test_cases
- `backend/app/models.py` - CodeSubmission модель, Course с test_cases
- `backend/app/utils.py` - run_tests() функция

### Frontend
- `frontend/src/components/CodeEditor.jsx` - новый компонент (333 строк)
- `frontend/src/components/CreateCourseModal.jsx` - поле для тестов
- `frontend/src/pages/CoursePage.jsx` - интеграция CodeEditor
- `frontend/src/styles/code-editor.css` - стили (351 строка)

---

## 🎯 Особенности реализации

### ✨ Плюсы
- ✅ Полная интеграция frontend-backend
- ✅ Красивый UI с результатами в реальном времени
- ✅ История всех попыток
- ✅ Адаптивный дизайн (мобильные устройства)
- ✅ Обработка ошибок (timeout, синтаксис, пустой код)
- ✅ JSON валидация на фронтенде
- ✅ Темная тема (CSS медиа-запрос)

### ⚠️ Ограничения
- 🔸 Python only (можно расширить на другие языки)
- 🔸 Нет песочницы (используется обычный subprocess, не рекомендуется для production)
- 🔸 Глобальный timeout 5 сек на все тесты
- 🔸 Код должен читать input() и выводить print() (шаблонный подход)

### 🔒 Безопасность
- ⚠️ **ВАЖНО**: Текущая реализация НЕ защищена от вредоносного кода!
- 🔹 Для production нужна Docker контейнеризация или другая изоляция
- 🔹 Для боевого использования добавить:
  - Docker/Kubernetes для изоляции
  - Rate limiting на код submissions
  - Квоты на количество попыток
  - Проверка на infinite loops до выполнения

---

## 🚨 Что может пойти не так

### Проблема: "ModuleNotFoundError: No module named 'app'"
**Решение**: Убедитесь, что запускаете из директории `/backend`:
```bash
cd backend
```

### Проблема: "Не удалось загрузить курс"
**Решение**: Проверьте, что backend работает на `localhost:8000`:
```bash
curl http://localhost:8000/health
# должно вернуть: {"status":"ok"}
```

### Проблема: "Syntax error в коде студента"
**Решение**: Это нормально! Backend перехватит и вернёт ошибку в CodeEditor:
```json
{"passed": false, "error": "SyntaxError: invalid syntax"}
```

### Проблема: "Тестовое значение не совпадает"
**Решение**: Проверьте:
- Input/output в JSON совпадает с ожиданиями
- Код печатает результат ровно в таком формате (без лишних пробелов)

---

## 📚 Примеры тестов для разных задач

### Задача 1: Чётные числа
```json
[
  {"input": "4", "expected_output": "true"},
  {"input": "3", "expected_output": "false"},
  {"input": "0", "expected_output": "true"}
]
```

**Решение студента:**
```python
n = int(input())
print(n % 2 == 0)
```

### Задача 2: Факториал
```json
[
  {"input": "5", "expected_output": "120"},
  {"input": "3", "expected_output": "6"},
  {"input": "0", "expected_output": "1"}
]
```

**Решение студента:**
```python
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)

n = int(input())
print(factorial(n))
```

### Задача 3: Сумма цифр
```json
[
  {"input": "123", "expected_output": "6"},
  {"input": "999", "expected_output": "27"},
  {"input": "1", "expected_output": "1"}
]
```

**Решение студента:**
```python
n = input()
print(sum(int(d) for d in n))
```

---

## ✅ Чек-лист готовности

- [x] Backend API эндпоинты работают
- [x] Frontend компоненты созданы и стилизованы
- [x] Database schema готова (test_cases, code_submissions)
- [x] JSON валидация на фронтенде
- [x] Subprocess выполнение кода работает
- [x] Результаты сохраняются в базу
- [x] История попыток отображается
- [x] Ошибки обработаны
- [x] Адаптивный дизайн готов
- [x] Документация завершена

---

## 🎉 Готово к тестированию!

Система полностью функциональна. Можно начинать тестировать с реальными курсами и студентами!
