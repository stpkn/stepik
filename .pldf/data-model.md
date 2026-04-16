# Data Model: Programming Course Platform (MVP)

## Overview
Current MVP needs only authentication data and minimal session transfer to protected route.

## Entities

### User
Purpose: Credential validation for login flow.

Fields:
- id: integer, primary key
- login: string, unique, required
- password_hash: string, required
- role: string, enum(student), required
- created_at: datetime, required

Validation:
- login length 3..64
- password_hash non-empty
- role must be student in current MVP scope

### LoginAttempt (optional audit table, recommended)
Purpose: Security and troubleshooting for authentication failures.

Fields:
- id: integer, primary key
- login: string
- success: boolean
- client_ip: string
- created_at: datetime

## SQLite Schema (target)

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  login TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('student')),
  created_at TEXT NOT NULL
);

CREATE TABLE login_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  login TEXT,
  success INTEGER NOT NULL CHECK(success IN (0, 1)),
  client_ip TEXT,
  created_at TEXT NOT NULL
);
```

## Relationships
- users (1) -> (N) login_attempts by login value (soft relation for audit).

## State Transitions

### Authentication state
- unauthenticated -> authenticated (POST /login success)
- unauthenticated -> unauthenticated (POST /login fail)

### Route access state
- authenticated user can access /dashboard
- missing user state triggers redirect to /

## UI Coverage Mapping
- Login form fields: login, password -> User validation
- Dashboard greeting: derived from authenticated login

## Normalization Notes
- Separate audit table keeps user record stable and prevents auth-log duplication in users table.
- Current MVP can start with users table only; login_attempts is extension-ready.
