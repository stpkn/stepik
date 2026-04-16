"""
Мок-данные и API для студента, преподавателя и курсов.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Programming Course Platform (MVP)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Учётные записи (логин / пароль / роль) ---
# id совпадает с сущностью студента или преподавателя для GET /student/{id} и GET /teacher/{id}
USERS = [
    {
        "id": 1,
        "login": "student",
        "password": "password123",
        "role": "student",
        "name": "Иван Петров",
    },
    {
        "id": 2,
        "login": "teacher",
        "password": "teacher123",
        "role": "teacher",
        "name": "преподаватель",
    },
]

# --- Студенты (id — для GET /student/{id}) ---
STUDENTS = [
    {"id": 1, "login": "student", "display_name": "Иван Петров"},
    {"id": 2, "display_name": "Мария Соколова"},
    {"id": 3, "display_name": "Алексей Ким"},
    {"id": 4, "display_name": "Елена Волкова"},
    {"id": 5, "display_name": "Дмитрий Орлов"},
    {"id": 6, "display_name": "Ольга Нестерова"},
    {"id": 7, "display_name": "Никита Зайцев"},
]

# --- Преподаватели (id — для GET /teacher/{id}, совпадает с USERS id преподавателя) ---
TEACHERS = [
    {"id": 2, "display_name": "преподаватель"},
]

# --- Курсы ---
COURSES = [
    {
        "id": 1,
        "title": "Основы Python",
        "description": "Синтаксис, типы данных, функции и основы ООП на практике.",
        "teacher_id": 2,
        "featured": True,
    },
    {
        "id": 2,
        "title": "Структуры данных и алгоритмы",
        "description": "Списки, деревья, графы и оценка сложности алгоритмов.",
        "teacher_id": 2,
        "featured": True,
    },
    {
        "id": 3,
        "title": "Веб-API на FastAPI",
        "description": "REST, валидация, зависимости и развёртывание сервисов.",
        "teacher_id": 2,
        "featured": False,
    },
    {
        "id": 4,
        "title": "Основы React",
        "description": "Компоненты, хуки, маршрутизация и работа с формами.",
        "teacher_id": 2,
        "featured": True,
    },
    {
        "id": 5,
        "title": "Git и системы контроля версий",
        "description": "Ветки, слияния, code review и совместная работа в команде.",
        "teacher_id": 2,
        "featured": False,
    },
    {
        "id": 6,
        "title": "Базы данных: SQL и проектирование",
        "description": "Нормализация, запросы, индексы и проектирование схем.",
        "teacher_id": 2,
        "featured": False,
    },
]

# --- Записи на курс: student_id, course_id ---
ENROLLMENTS = [
    {"student_id": 1, "course_id": 1},
    {"student_id": 1, "course_id": 2},
    {"student_id": 1, "course_id": 3},
    {"student_id": 1, "course_id": 4},
    {"student_id": 1, "course_id": 5},
    {"student_id": 1, "course_id": 6},
    {"student_id": 2, "course_id": 4},
    {"student_id": 3, "course_id": 3},
    {"student_id": 4, "course_id": 2},
    {"student_id": 5, "course_id": 1},
    {"student_id": 6, "course_id": 6},
    {"student_id": 7, "course_id": 5},
]

# --- Прогресс: student_id, course_id, progress (0–100) ---
PROGRESS = [
    {"student_id": 1, "course_id": 1, "progress": 72},
    {"student_id": 1, "course_id": 2, "progress": 45},
    {"student_id": 1, "course_id": 3, "progress": 100},
    {"student_id": 1, "course_id": 4, "progress": 18},
    {"student_id": 1, "course_id": 5, "progress": 90},
    {"student_id": 1, "course_id": 6, "progress": 33},
    {"student_id": 2, "course_id": 4, "progress": 18},
    {"student_id": 3, "course_id": 3, "progress": 100},
    {"student_id": 4, "course_id": 2, "progress": 45},
    {"student_id": 5, "course_id": 1, "progress": 55},
    {"student_id": 6, "course_id": 6, "progress": 33},
    {"student_id": 7, "course_id": 5, "progress": 90},
]

# Доп. поля для панели студента (не выводятся из enrollments)
STUDENT_EXTRA = {
    1: {
        "stats": {
            "completed_courses": 3,
            "active_courses": 5,
            "certificates": 2,
            "study_hours": 127,
        },
        "weekly_hours": [
            {"day": "Пн", "hours": 4},
            {"day": "Вт", "hours": 6},
            {"day": "Ср", "hours": 3},
            {"day": "Чт", "hours": 5},
            {"day": "Пт", "hours": 7},
            {"day": "Сб", "hours": 2},
            {"day": "Вс", "hours": 5},
        ],
        "activity": [
            {"id": 1, "action": "Завершён урок: «Переменные и типы данных»", "when": "Сегодня, 14:32"},
            {"id": 2, "action": "Начат курс «Основы React»", "when": "Вчера, 09:15"},
            {"id": 3, "action": "Получен сертификат по курсу «Основы Python»", "when": "5 марта 2025"},
            {"id": 4, "action": "Сдан тест по теме «Циклы» (92%)", "when": "03.03.2025"},
            {"id": 5, "action": "Завершён урок: «Компоненты и пропсы»", "when": "28.02.2025"},
            {"id": 6, "action": "Начат курс «Базы данных: SQL»", "when": "25.02.2025"},
            {"id": 7, "action": "Завершён урок: «REST и HTTP-методы»", "when": "22.02.2025"},
            {"id": 8, "action": "Добавлен комментарий к домашнему заданию", "when": "20.02.2025"},
        ],
    }
}

TEACHER_EXTRA = {
    2: {
        "stats": {
            "total_students": 47,
            "active_courses": 4,
            "completed_courses": 128,
            "avg_progress": 68,
        },
        "activity": [
            {"id": 1, "action": "Студент завершил урок «Функции и области видимости»", "when": "Сегодня, 11:20"},
            {"id": 2, "action": "Добавлен новый курс «Тестирование ПО»", "when": "Вчера, 16:45"},
            {"id": 3, "action": "Студент сдал итоговый тест по модулю «React Hooks»", "when": "03.03.2025"},
            {"id": 4, "action": "Опубликовано домашнее задание к уроку 7", "when": "01.03.2025"},
            {"id": 5, "action": "Студент начал курс «Основы Python»", "when": "28.02.2025"},
            {"id": 6, "action": "Обновлено описание курса «FastAPI»", "when": "26.02.2025"},
        ],
    }
}


class LoginRequest(BaseModel):
    login: str
    password: str


def _course_by_id(cid: int):
    for c in COURSES:
        if c["id"] == cid:
            return c
    return None


def _student_by_id(sid: int):
    for s in STUDENTS:
        if s["id"] == sid:
            return s
    return None


def _progress_lookup(student_id: int, course_id: int) -> int:
    for p in PROGRESS:
        if p["student_id"] == student_id and p["course_id"] == course_id:
            return p["progress"]
    return 0


def _find_user_by_login(login: str):
    login_lower = login.strip().lower()
    for u in USERS:
        if u["login"].lower() == login_lower:
            return u
    return None


@app.post("/login")
def login(request: LoginRequest):
    user = _find_user_by_login(request.login)
    if user is None or user["password"] != request.password:
        raise HTTPException(status_code=401, detail="Неверный логин или пароль")
    return {
        "id": user["id"],
        "name": user["name"],
        "role": user["role"],
    }


@app.get("/courses")
def list_courses():
    """Список всех курсов."""
    return list(COURSES)


@app.get("/student/{student_id}")
def get_student(student_id: int):
    """Информация о студенте, его курсы и прогресс."""
    student = _student_by_id(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Студент не найден")

    courses_out = []
    for e in ENROLLMENTS:
        if e["student_id"] != student_id:
            continue
        c = _course_by_id(e["course_id"])
        if not c:
            continue
        pct = _progress_lookup(student_id, c["id"])
        courses_out.append(
            {
                "id": c["id"],
                "title": c["title"],
                "description": c["description"],
                "progress": pct,
                "featured": c["featured"],
            }
        )

    extra = STUDENT_EXTRA.get(student_id, {})
    stats = extra.get(
        "stats",
        {
            "completed_courses": 0,
            "active_courses": len([x for x in courses_out if x["progress"] < 100]),
            "certificates": 0,
            "study_hours": 0,
        },
    )
    weekly = extra.get("weekly_hours", [])
    activity = extra.get("activity", [])

    return {
        "id": student["id"],
        "display_name": student["display_name"],
        "courses": courses_out,
        "stats": stats,
        "weekly_hours": weekly,
        "activity": activity,
    }


@app.get("/teacher/{teacher_id}")
def get_teacher(teacher_id: int):
    """Преподаватель: сводка по курсам и прогресс студентов."""
    teacher = next((t for t in TEACHERS if t["id"] == teacher_id), None)
    if not teacher:
        raise HTTPException(status_code=404, detail="Преподаватель не найден")

    my_course_ids = {c["id"] for c in COURSES if c["teacher_id"] == teacher_id}

    students_progress = []
    row_id = 0
    for e in ENROLLMENTS:
        if e["course_id"] not in my_course_ids:
            continue
        st = _student_by_id(e["student_id"])
        co = _course_by_id(e["course_id"])
        if not st or not co:
            continue
        row_id += 1
        pct = _progress_lookup(e["student_id"], e["course_id"])
        students_progress.append(
            {
                "id": row_id,
                "name": st["display_name"],
                "course": co["title"],
                "progress": pct,
            }
        )

    teacher_courses = []
    for c in COURSES:
        if c["teacher_id"] != teacher_id:
            continue
        cid = c["id"]
        enrolls = [e for e in ENROLLMENTS if e["course_id"] == cid]
        count = len(enrolls)
        if count == 0:
            avg = 0
        else:
            total = sum(_progress_lookup(e["student_id"], cid) for e in enrolls)
            avg = round(total / count)
        teacher_courses.append(
            {
                "id": c["id"],
                "title": c["title"],
                "students_count": count,
                "avg_progress": avg,
            }
        )

    extra = TEACHER_EXTRA.get(teacher_id, {})
    stats = extra.get(
        "stats",
        {
            "total_students": len({e["student_id"] for e in ENROLLMENTS if e["course_id"] in my_course_ids}),
            "active_courses": len(my_course_ids),
            "completed_courses": 0,
            "avg_progress": 0,
        },
    )
    activity = extra.get("activity", [])

    return {
        "id": teacher["id"],
        "display_name": teacher["display_name"],
        "students_progress": students_progress,
        "courses": teacher_courses,
        "stats": stats,
        "activity": activity,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
