# Кэш контекста планирования

**Дата создания**: 2026-04-16  
**Дата последнего обновления**: 2026-04-16

## Краткое резюме архитектуры

Проект организован как monorepo с разделением на `frontend/`, `backend/`, `packages/` и `features/`.
`frontend/` реализует SPA на React с role-based маршрутами и переключаемой темой.
`backend/` реализует REST API на FastAPI (MVP-контур авторизации).
`features/` хранит feature-first контракты модулей (`course-player`, `assessment-engine`, `user-progress`) с публичными интерфейсами.
`packages/` хранит общий код и модели, доступные всем фичам без cross-feature импортов.

## Ключевые технические решения

- React + FastAPI сохранены как основной стек без миграций.
- SQLite выбран как целевая БД для MVP.
- Contract-first подход через `.pldf/contracts/openapi.yaml`.
- Строгая граница модулей: фичи общаются через `public-api.md` и общие `packages/`.

## Структура данных

Базовая сущность `User` используется для входа и маршрутизации по защищенным экранам.
Дополнительная сущность `LoginAttempt` покрывает аудит попыток входа.
Целевая схема описана в `.pldf/data-model.md` и ориентирована на SQLite.

## Паттерны и подходы

- Lightweight layered architecture (UI -> API -> data layer).
- Feature-first decomposition для масштабирования фич по отдельным границам.
- Incremental planning: по одному шагу за запуск `/pldf.plan`.

## Основные зависимости между компонентами

- `frontend` зависит от API-контракта в `.pldf/contracts/openapi.yaml`.
- `backend` зависит от моделей данных из `.pldf/data-model.md`.
- Фичи в `features/` могут использовать только `packages/` как общий слой.
- Планирование шагов обязано сначала покрывать P1-функции из `.pldf/concept.md`.