# Data Model: Programming Course Platform (MVP)

## Overview
Модель данных разделена на 2 уровня:
- Реализованный минимум (текущий код): авторизация и базовая сессия.
- Целевая MVP-модель (для следующих шагов `/pldf.plan`): учебный контент, прогресс, активность и teacher view.

## Entities

### User
Purpose: Credential validation, role routing, ownership of progress data.

Fields:
- id: integer, primary key
- login: string, unique, required
- password_hash: string, required
- role: string, enum(student), required
- created_at: datetime, required

Validation:
- login length 3..64
- password_hash non-empty
- role must be one of: student, teacher

### LoginAttempt (optional audit table, recommended)
Purpose: Security and troubleshooting for authentication failures.

Fields:
- id: integer, primary key
- login: string
- success: boolean
- client_ip: string
- created_at: datetime

### Course
Purpose: Course catalog entry shown in student learning view.

Fields:
- id: integer, primary key
- title: string, required
- level: string, required
- status: string, enum(in_progress, planned, completed), required
- progress_percent: integer, required

### UserCourseProgress
Purpose: Track student progress per course.

Fields:
- id: integer, primary key
- user_id: integer, required
- course_id: integer, required
- completed_lessons: integer, required
- total_lessons: integer, required
- updated_at: datetime, required

### ActivityEvent
Purpose: Timeline items for student activity feed.

Fields:
- id: integer, primary key
- user_id: integer, required
- event_type: string, required
- description: string, required
- created_at: datetime, required

### CohortSnapshot (teacher)
Purpose: Aggregated metrics for teacher dashboard widgets.

Fields:
- id: integer, primary key
- cohort_name: string, required
- active_students: integer, required
- avg_completion_percent: integer, required
- generated_at: datetime, required

## SQLite Schema (target)

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  login TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('student', 'teacher')),
  created_at TEXT NOT NULL
);

CREATE TABLE login_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  login TEXT,
  success INTEGER NOT NULL CHECK(success IN (0, 1)),
  client_ip TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  level TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('in_progress', 'planned', 'completed')),
  progress_percent INTEGER NOT NULL CHECK(progress_percent BETWEEN 0 AND 100)
);

CREATE TABLE user_course_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  completed_lessons INTEGER NOT NULL,
  total_lessons INTEGER NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(course_id) REFERENCES courses(id)
);

CREATE TABLE activity_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE cohort_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cohort_name TEXT NOT NULL,
  active_students INTEGER NOT NULL,
  avg_completion_percent INTEGER NOT NULL CHECK(avg_completion_percent BETWEEN 0 AND 100),
  generated_at TEXT NOT NULL
);
```

## Relationships
- users (1) -> (N) login_attempts by login value (soft relation for audit).
- users (1) -> (N) user_course_progress.
- courses (1) -> (N) user_course_progress.
- users (1) -> (N) activity_events.
- cohort_snapshots stores aggregated teacher metrics (denormalized read model).

## State Transitions

### Authentication state
- unauthenticated -> authenticated (POST /login success)
- unauthenticated -> unauthenticated (POST /login fail)

### Route access state
- authenticated user can access /home, /learning, /statistics, /activity, /teacher-dashboard
- missing user state triggers redirect to /

## UI Coverage Mapping
- Login form fields: login, password -> User validation
- Home/Learning widgets: Course + UserCourseProgress
- Statistics cards/charts: UserCourseProgress aggregation
- Activity feed: ActivityEvent
- Teacher dashboard tiles: CohortSnapshot

## Normalization Notes
- Separate audit table keeps user record stable and prevents auth-log duplication in users table.
- Реализация может идти поэтапно: сначала `users` + `login_attempts`, затем учебные и аналитические таблицы.
