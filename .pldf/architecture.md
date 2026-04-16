# Архитектура проекта: Programming Course Platform (MVP)

Основано на: .pldf/concept.md, .pldf/ui-design.md, .pldf/tech-stack.md

## Структура проекта

```text
OS_project/
├── packages/
│   ├── common-utils/
│   │   ├── src/index.js          # Публичные утилиты обработки данных
│   │   └── README.md
│   └── pldf-models/
│       ├── src/index.js          # Общие модели данных PLDF
│       └── README.md
├── features/
│   ├── course-player/
│   │   └── public-api.md         # Строгий интерфейс фичи
│   ├── assessment-engine/
│   │   └── public-api.md
│   └── user-progress/
│       └── public-api.md
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   └── Dashboard.jsx
│   │   ├── App.jsx
│   │   ├── index.jsx
│   │   └── styles.css
│   ├── package.json
│   └── webpack.config.js
├── backend/
│   ├── main.py
│   └── requirements.txt
├── .pldf/
│   ├── concept.md
│   ├── ui-design.md
│   ├── tech-stack.md
│   ├── data-model.md
│   ├── architecture.md
│   └── contracts/
│       ├── auth-login.yaml
│       ├── dashboard-screen.md
│       └── openapi.yaml
└── pdlf_etc/
    └── .pldf/memory/progress.json
```

Обоснование структуры:
- Monorepo сохраняет frontend и backend в одном репозитории.
- Feature-first вынесен в отдельную директорию `features/` для изоляции доменных модулей.
- Общий код централизован в `packages/`, чтобы избежать дублирования и хаотичных зависимостей.
- PLDF артефакты в `.pldf/` дают ИИ-агенту источник истины для следующих этапов.

## Модель данных

Ссылка на детальную модель: .pldf/data-model.md

Краткое описание:
- Основные сущности: User, LoginAttempt (audit extension)
- База данных: SQLite 3
- Состояния: unauthenticated/authenticated route flow

## API контракты

Ссылка на контракты: .pldf/contracts/

Краткое описание:
- Количество endpoint: 1
- Группа endpoint: auth
- Реализованный endpoint: POST /login
- Экран Dashboard не имеет backend endpoint в текущем MVP (подтверждено контрактом dashboard-screen.md)

## Внешние зависимости

### Внешние сервисы/API
- Нет обязательных внешних сервисов в текущем MVP.

### Библиотеки и пакеты
- Frontend: react, react-dom, react-router-dom
- Backend: fastapi, uvicorn
- DB: sqlite3 (standard Python library module)

### Инструменты разработки
- Webpack + Babel
- Uvicorn local server
- Planned: pytest, vitest, playwright

## Принципы организации кода

- Separation of concerns: UI, routing, backend API, contracts documented separately.
- Contract-first sync: frontend action must map to documented API contract.
- Minimal viable architecture: only required layers/endpoints now, extension points documented.
- AI-agent friendly workflow: every stage artifact is explicit and machine-readable.
- Feature isolation: агент изменяет только целевую фичу (`features/<name>`) и `packages/` по интерфейсу.
- Strict interfaces: каждая фича публикует API только через `public-api.md`.
- Dependency rule: запрещены cross-feature импорты, разрешены только импорты из `packages/`.

## Архитектурные паттерны

- Layered architecture (lightweight):
  - Presentation layer: React pages
  - API layer: FastAPI routes
  - Data layer: SQLite persistence (target schema in data-model.md)
- Contract-first REST: OpenAPI contract is canonical reference for backend/frontend sync.

## Безопасность

- Authentication: login/password validation via POST /login.
- Authorization: dashboard route protected by frontend state redirect check.
- Data protection: store password_hash (not plain text) in SQLite target model.
- CORS: restricted to localhost frontend origin.

## Производительность

- Current MVP has negligible load; no mandatory cache.
- SQLite chosen for local speed and low operational overhead.
- Future scale path: move to PostgreSQL without changing REST contract surface.

## Валидация архитектуры

- [x] Все экраны из прототипов имеют соответствующие endpoint или явно не требуют endpoint
- [x] Модель данных покрывает UI требования
- [x] Структура проекта соответствует выбранному стеку
- [x] API контракты соответствуют элементам прототипов
- [x] Нет лишних endpoint
- [x] Модель данных логична и нормализована для текущего масштаба
- [x] Архитектура расширяема
- [x] Документация создана

## Ключевые решения этапа

### 1. Lightweight Layered Architecture вместо сложной Clean Architecture
- Причина: Текущий MVP содержит 2 экрана и 1 endpoint; сложная многослойная схема была бы преждевременной оптимизацией.
- Влияние: На этапе `/pldf.plan` шаги будут короткими и прямыми, без избыточной инфраструктуры.

### 2. Contract-first API через единый openapi.yaml
- Причина: Для разработки с ИИ-агентом важен один машинно-читаемый источник API-правил.
- Влияние: Любой новый UI action сначала добавляется в контракт, затем реализуется в backend/frontend.

### 3. SQLite как базовый persistence слой с возможностью миграции
- Причина: Соответствует выбранному стеку и обеспечивает быстрый локальный цикл разработки.
- Влияние: В плане реализации будет отдельный шаг по репозиториям и миграциям, совместимым с будущим переходом на PostgreSQL.

### 4. Monorepo + Feature-first с жесткими интерфейсами
- Причина: Такой формат повышает точность работы ИИ-агента, ограничивая область изменений конкретной фичей и общими пакетами.
- Влияние: В `/pldf.plan` задачи будут назначаться по фичам и контрактам, что снижает риск случайных изменений в соседних модулях.

Статус: Утверждено
Утверждено: 2026-04-16
