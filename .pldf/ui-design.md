# UI Design: Programming Course Platform (MVP)

Based on: .pldf/concept.md

## Overview
Current UI scope is intentionally compact: authentication and protected dashboard confirmation.

Prototype entry: .pldf/ui-prototype/index.html

## Screens

### S1: Login (P1)
File: .pldf/ui-prototype/login.html
Purpose: Accept login/password and send credentials to backend.

### S2: Dashboard (P1)
File: .pldf/ui-prototype/dashboard.html
Purpose: Show successful authenticated state.

## User Flows

### F1: Successful login
1. User opens login screen.
2. User enters login/password and submits.
3. Backend validates credentials.
4. Frontend navigates to dashboard.

### F2: Failed login
1. User submits invalid credentials.
2. Backend returns error.
3. Frontend shows failure alert.

## Navigation
- / -> Login
- /dashboard -> Protected dashboard (redirect to / if no user state)

## Data Requirements

### Login
- Input: login, password
- API: POST /login
- States: idle, success, invalid credentials, network failure

### Dashboard
- Input: user from navigation state
- API dependency: none in current MVP

## Error Handling
- Login: alert on backend validation error or connectivity error.
- Dashboard: redirect to login when user state is missing.

## Validation Checklist
- [x] All implemented screens documented
- [x] User flows mapped to current code
- [x] Data requirements documented

Version: 1.0 | Ratified: 2026-04-16 | Last update: 2026-04-16
# UI Design: Programming Course Platform (MVP)

Based on: .pldf/concept.md

## Overview
The design uses a role-first information architecture. Student screens focus on daily learning momentum, while the teacher screen prioritizes cohort visibility and intervention signals.

Prototype entry: .pldf/ui-prototype/index.html

## Screens

### S1: Login (P1)
File: .pldf/ui-prototype/login.html
Purpose: Authenticate user and route by role.

### S2: Student Dashboard Home (P1)
File: .pldf/ui-prototype/dashboard-home.html
Purpose: At-a-glance summary of active courses, progress, and next actions.

### S3: Learning (P1)
File: .pldf/ui-prototype/learning.html
Purpose: Manage course learning flow with module-level visibility.

### S4: Statistics (P1)
File: .pldf/ui-prototype/statistics.html
Purpose: Show outcomes, trend signals, and weekly effort profile.

### S5: Activity (P1)
File: .pldf/ui-prototype/activity.html
Purpose: Display chronological learning actions and reminders.

### S6: Teacher Dashboard (P1)
File: .pldf/ui-prototype/teacher-dashboard.html
Purpose: Track student progress across courses and monitor weak spots.

### P2 Widgets (embedded in P1 screens)
- Smart recommendations widget on Dashboard Home (P2)
- Week-over-week comparison widget on Statistics (P2)
- Review queue widget on Teacher Dashboard (P2)

### P3 Widgets (embedded in P1 screens)
- Personal goals widget on Dashboard Home (P3)
- CSV export preview on Statistics (P3)
- Cohort heatmap preview on Teacher Dashboard (P3)
- Reminder planner on Activity (P3)

## User Flows

### F1: Student login to daily learning action
1. User opens Login.
2. User enters credentials and submits.
3. System validates user and opens Student Dashboard Home.
4. User selects Continue Learning and navigates to Learning.

Alternative path:
- If credentials are invalid, Login shows an inline error and keeps entered login.

### F2: Student checks progress and adjusts plan
1. User opens Statistics from global nav.
2. User reviews completion and weekly trend bars.
3. User opens Activity to inspect recent events.
4. User uses reminder planner for next study block.

Alternative path:
- If statistics data is unavailable, screen shows retry panel.

### F3: Teacher monitors cohort and intervenes
1. Teacher logs in and opens Teacher Dashboard.
2. Teacher checks students with low progress.
3. Teacher reviews queue for assignments needing feedback.
4. Teacher chooses a course focus for next lesson.

Alternative path:
- If teacher has no active courses, dashboard shows empty-state guidance.

## Navigation

Entry
- /login -> role redirect

Student branch
- /dashboard (home)
- /dashboard/learning
- /dashboard/statistics
- /dashboard/activity

Teacher branch
- /teacher

Prototype navigation mirrors this structure with direct links between all pages.

## Data Requirements Per Screen

### Login
- Input: login, password
- Output: user id, role, display name
- States: idle, loading, invalid credentials

### Student Dashboard Home
- Display: student name, active courses, progress percentages, study hours, recommendation cards, personal goals
- Source: student profile, enrolled courses, progress, stats
- States: loading cards, partial data, empty enrolled courses

### Learning
- Display: course list, module completion, next lesson actions
- Input: filter by status or topic
- Source: student courses, per-course progress

### Statistics
- Display: completion KPIs, weekly study bars, course progress table, trend comparison, export preview
- Source: student stats and weekly hours
- States: normal, stale data warning, API error

### Activity
- Display: timeline of events, event type markers, reminder planner
- Source: student activity log
- Input: create reminder item (prototype only)

### Teacher Dashboard
- Display: class stats, student progress table, course averages, review queue, cohort heatmap preview
- Source: teacher stats, students_progress, courses
- States: no students, normal, high-risk cohort warning

## Error Handling
- Inline field validation on Login.
- Non-blocking warning banners for partial or stale data.
- Dedicated retry panel for API failures on data-driven screens.
- Empty states with a suggested next action for no-data scenarios.

## Adaptivity
- Desktop-first grid with responsive collapse at small widths.
- Navigation wraps into compact rows on mobile.
- Cards shift from multi-column to single-column under tablet breakpoints.

## Key Design Decisions

### 1. Single shared shell for student screens
- Reason: Reduces cognitive load and keeps orientation stable between Home, Learning, Statistics, and Activity.
- Impact: Technology stage should prioritize reusable layout components and shared state for navigation context.

### 2. P2 and P3 modeled as embedded widgets instead of separate pages
- Reason: Keeps MVP route count small while still validating secondary and optional value.
- Impact: Architecture stage should support pluggable widget modules with feature flags.

### 3. Teacher dashboard emphasizes risk-first ranking
- Reason: Teachers need fast detection of low-progress students more than deep drill-down in MVP.
- Impact: Backend stage should expose sorted or filterable progress data for prioritization.

## Validation Checklist
- [x] All P1, P2, P3 functions represented on screens/widgets
- [x] User flows complete and logically connected
- [x] Design matches web platform constraints
- [x] HTML/CSS prototype uses valid standalone structure
- [x] Navigation links between all screens are present
- [x] Design addresses concept problems for both roles
- [x] Data requirements defined for each screen

Version: 1.0 | Ratified: 2026-04-05 | Last update: 2026-04-05
