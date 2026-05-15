import sys, pathlib

# Ensure project root is on sys.path so imports like `app.utils` work
# whether this file is run as a module or executed directly (reloader
# child processes may set different __name__). Inserting unconditionally
# is safe and makes running `python backend/app/main.py` possible.
project_root = pathlib.Path(__file__).resolve().parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    ForeignKey,
    Table,
    Boolean,
    Text,
    DateTime,
    Float,
    UniqueConstraint,
    inspect,
    text,
    or_,
)
from sqlalchemy.orm import sessionmaker, declarative_base, Session, relationship
from passlib.context import CryptContext
from pydantic import BaseModel
from typing import List, Optional
import uuid, os, json, re
from datetime import datetime
from dotenv import load_dotenv
from app.utils import run_tests
from config import API_KEY
from gigachat import GigaChat

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./course_platform.db")
connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

enrollments = Table("enrollments", Base.metadata,
    Column("student_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("course_id", Integer, ForeignKey("courses.id"), primary_key=True))

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    login = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    courses = relationship("Course", back_populates="teacher")
    enrolled = relationship("Course", secondary=enrollments, back_populates="students")

class Course(Base):
    __tablename__ = "courses"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String)
    theory = Column(Text, nullable=True)
    coding_task = Column(Text, nullable=True)
    coding_solution = Column(Text, nullable=True)
    test_cases = Column(Text, nullable=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    teacher = relationship("User", back_populates="courses")
    students = relationship("User", secondary=enrollments, back_populates="enrolled")
    questions = relationship("Question", back_populates="course", cascade="all, delete-orphan")
    coding_tasks = relationship("CodingTask", back_populates="course", cascade="all, delete-orphan")

class CodingTask(Base):
    __tablename__ = "coding_tasks"
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    title = Column(String, nullable=True)
    task = Column(Text, nullable=True)
    solution = Column(Text, nullable=True)
    test_cases = Column(Text, nullable=True)
    course = relationship("Course", back_populates="coding_tasks")

class Question(Base):
    __tablename__ = "questions"
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    text = Column(String, nullable=False)
    course = relationship("Course", back_populates="questions")
    answers = relationship("Answer", back_populates="question", cascade="all, delete-orphan")

class Answer(Base):
    __tablename__ = "answers"
    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    text = Column(String, nullable=False)
    is_correct = Column(Boolean, nullable=False, default=False)
    question = relationship("Question", back_populates="answers")

class CourseProgress(Base):
    __tablename__ = "course_progress"
    student_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    course_id = Column(Integer, ForeignKey("courses.id"), primary_key=True)
    progress = Column(Integer, nullable=False, default=0)

class StudentQuestionResult(Base):
    __tablename__ = "student_question_results"
    __table_args__ = (UniqueConstraint("student_id", "question_id", name="uq_student_question"),)
    id = Column(Integer, primary_key=True, autoincrement=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    is_correct = Column(Boolean, nullable=False, default=False)

class CodeSubmission(Base):
    __tablename__ = "code_submissions"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    coding_task_id = Column(Integer, ForeignKey("coding_tasks.id"), nullable=True)
    code = Column(Text, nullable=False)
    language = Column(String, default="python")
    is_correct = Column(Boolean, default=False)
    test_results = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    execution_time = Column(Float, nullable=True)

class Flashcard(Base):
    __tablename__ = "flashcards"
    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    cards = Column(Text, nullable=False)  # JSON: [{"question": "...", "answer": "..."}]
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class FlashcardProgress(Base):
    __tablename__ = "flashcard_progress"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    card_index = Column(Integer, nullable=False)
    confidence = Column(String, nullable=False)  # "still_learning", "almost_there", "mastered"
    reviewed_at = Column(DateTime, default=datetime.utcnow)

class LoginRequest(BaseModel):
    login: str; password: str

class StudentCreate(BaseModel):
    first_name: str; last_name: str
    login: Optional[str] = None; password: Optional[str] = None
    course_ids: List[int] = []

class AnswerIn(BaseModel):
    text: str; is_correct: bool

class QuestionIn(BaseModel):
    text: str; answers: List[AnswerIn]

class CourseCreate(BaseModel):
    title: str
    description: str = ""
    theory: str = ""
    coding_task: str = ""
    coding_solution: str = ""
    test_cases: List["TestCaseIn"] = []
    coding_tasks: List["CodingTaskIn"] = []
    flashcards: List["FlashcardCardIn"] = []
    questions: List[QuestionIn] = []

class AnswerCheckIn(BaseModel):
    question_id: int
    answer_id: int

class CodeSubmitRequest(BaseModel):
    code: str
    task_id: Optional[int] = None

class TestCaseIn(BaseModel):
    input: str
    expected_output: str

class TestCasesUpdateRequest(BaseModel):
    tests: List[TestCaseIn]
    task_id: Optional[int] = None

class CodingTaskIn(BaseModel):
    title: Optional[str] = None
    task: str = ""
    solution: str = ""
    tests: List[TestCaseIn] = []

class FlashcardCardIn(BaseModel):
    question: str
    answer: str

class FlashcardCreateRequest(BaseModel):
    cards: List[FlashcardCardIn]

class FlashcardProgressRequest(BaseModel):
    card_index: int
    confidence: str  # "still_learning", "almost_there", "mastered"
class ActivityLog(Base):
    __tablename__ = "activity_logs"
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)  # e.g., "course_opened"
    details = Column(String, nullable=True)  # e.g., "Открыт курс: Введение в Python"
    created_at = Column(DateTime, default=datetime.utcnow)

class AssistantGenerateRequest(BaseModel):
    mode: str  # "tests", "questions", "flashcards"
    text: str

app = FastAPI(title="Course Platform")

def build_assistant_prompt(mode: str, text: str) -> Optional[str]:
    base = "Отвечай строго в формате JSON без пояснений и без обрамления."
    if mode == "tests":
        return (
            f"{base}\n"
            "Сгенерируй набор тестов для задания.\n"
            "Формат: [{\"input\": \"...\", \"expected_output\": \"...\"}, ...]\n"
            "input и expected_output всегда строки.\n"
            f"Задание: {text}"
        )
    if mode == "questions":
        return (
            f"{base}\n"
            "Сгенерируй вопросы по теории с вариантами ответов.\n"
            "Формат: [{\"text\": \"...\", \"answers\": [{\"text\": \"...\", \"is_correct\": true/false}, ...]}, ...]\n"
            "В каждом вопросе ровно один правильный ответ, минимум 4 ответа.\n"
            f"Теория: {text}"
        )
    if mode == "flashcards":
        return (
            f"{base}\n"
            "Сгенерируй карточки для запоминания.\n"
            "Формат: [{\"question\": \"...\", \"answer\": \"...\"}, ...]\n"
            f"Теория: {text}"
        )
    return None

def build_summary_prompt(text: str) -> str:
    return (
        "Кратко резюмируй текст в 3-4 абзацах. "
        "Без списков, заголовков и JSON."
        f"\nТекст: {text}"
    )

def count_paragraphs(text: str) -> int:
    parts = re.split(r"\n\s*\n", text.strip())
    return len([p for p in parts if p.strip()])

def normalize_ai_json(text: str) -> str:
    return text.replace("```json", "").replace("```", "").strip()

def serialize_test_cases(test_cases: List["TestCaseIn"]) -> Optional[str]:
    if not test_cases:
        return None
    return json.dumps([{"input": t.input, "expected_output": t.expected_output} for t in test_cases])

def parse_test_cases(test_cases: Optional[str]) -> List[dict]:
    if not test_cases:
        return []
    try:
        data = json.loads(test_cases)
        return data if isinstance(data, list) else []
    except Exception:
        return []

def validate_assistant_result(mode: str, text: str) -> Optional[str]:
    """Return error message if invalid, else None."""
    try:
        data = json.loads(text)
    except Exception as exc:
        return f"Неверный JSON: {exc}"

    if not isinstance(data, list):
        return "Ожидается JSON массив"

    if mode == "tests":
        for i, item in enumerate(data, start=1):
            if not isinstance(item, dict):
                return f"Тест {i}: ожидается объект"
            if "input" not in item or "expected_output" not in item:
                return f"Тест {i}: нужны поля input и expected_output"
            if not isinstance(item["input"], str) or not isinstance(item["expected_output"], str):
                return f"Тест {i}: input и expected_output должны быть строками"
        return None

    if mode == "flashcards":
        for i, item in enumerate(data, start=1):
            if not isinstance(item, dict):
                return f"Карточка {i}: ожидается объект"
            if "question" not in item or "answer" not in item:
                return f"Карточка {i}: нужны поля question и answer"
            if not isinstance(item["question"], str) or not isinstance(item["answer"], str):
                return f"Карточка {i}: question и answer должны быть строками"
            if not item["question"].strip() or not item["answer"].strip():
                return f"Карточка {i}: question и answer не должны быть пустыми"
        return None

    if mode == "questions":
        for i, item in enumerate(data, start=1):
            if not isinstance(item, dict):
                return f"Вопрос {i}: ожидается объект"
            if "text" not in item or "answers" not in item:
                return f"Вопрос {i}: нужны поля text и answers"
            if not isinstance(item["text"], str) or not item["text"].strip():
                return f"Вопрос {i}: text должен быть непустой строкой"
            answers = item["answers"]
            if not isinstance(answers, list) or len(answers) < 2:
                return f"Вопрос {i}: answers должен быть массивом минимум из 2 вариантов"
            correct_count = 0
            for j, ans in enumerate(answers, start=1):
                if not isinstance(ans, dict):
                    return f"Вопрос {i} ответ {j}: ожидается объект"
                if "text" not in ans or "is_correct" not in ans:
                    return f"Вопрос {i} ответ {j}: нужны поля text и is_correct"
                if not isinstance(ans["text"], str) or not ans["text"].strip():
                    return f"Вопрос {i} ответ {j}: text должен быть непустой строкой"
                if not isinstance(ans["is_correct"], bool):
                    return f"Вопрос {i} ответ {j}: is_correct должен быть bool"
                if ans["is_correct"]:
                    correct_count += 1
            if correct_count != 1:
                return f"Вопрос {i}: должен быть ровно один правильный ответ"
        return None

    return "Неизвестный режим"

def _migrate_schema():
    Base.metadata.create_all(bind=engine)
    if "sqlite" not in DATABASE_URL:
        return
    insp = inspect(engine)
    if "courses" not in insp.get_table_names():
        return
    cols = {c["name"] for c in insp.get_columns("courses")}
    stmts = []
    if "theory" not in cols:
        stmts.append("ALTER TABLE courses ADD COLUMN theory TEXT")
    if "coding_task" not in cols:
        stmts.append("ALTER TABLE courses ADD COLUMN coding_task TEXT")
    if "coding_solution" not in cols:
        stmts.append("ALTER TABLE courses ADD COLUMN coding_solution TEXT")
    if "test_cases" not in cols:
        stmts.append("ALTER TABLE courses ADD COLUMN test_cases TEXT")
    if "code_submissions" in insp.get_table_names():
        cs_cols = {c["name"] for c in insp.get_columns("code_submissions")}
        if "coding_task_id" not in cs_cols:
            stmts.append("ALTER TABLE code_submissions ADD COLUMN coding_task_id INTEGER")
    if stmts:
        with engine.begin() as conn:
            for s in stmts:
                conn.execute(text(s))

    db = SessionLocal()
    try:
        courses = db.query(Course).all()
        for course in courses:
            exists = db.query(CodingTask).filter(CodingTask.course_id == course.id).first()
            if exists:
                continue
            if course.coding_task or course.coding_solution or course.test_cases:
                db.add(CodingTask(
                    course_id=course.id,
                    title=None,
                    task=course.coding_task,
                    solution=course.coding_solution,
                    test_cases=course.test_cases,
                ))
        db.commit()
    finally:
        db.close()

@app.on_event("startup")
def _ensure_tables():
    _migrate_schema()

app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000","http://127.0.0.1:3000"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()
def log_activity(db: Session, student_id: int, action: str, details: str = ""):
    db.add(ActivityLog(student_id=student_id, action=action, details=details))
    db.commit()
def verify_password(plain, hashed): return pwd_context.verify(plain, hashed)
def hash_password(pw): return pwd_context.hash(pw)

def compute_student_course_progress(db: Session, student_id: int, course_id: int) -> int:
    n = db.query(Question).filter(Question.course_id == course_id).count()
    if n == 0:
        return 0  # 👈 Меняем на 0%
    qids = [r[0] for r in db.query(Question.id).filter(Question.course_id == course_id).all()]
    solved = db.query(StudentQuestionResult).filter(
        StudentQuestionResult.student_id == student_id,
        StudentQuestionResult.question_id.in_(qids),
        StudentQuestionResult.is_correct == True,
    ).count()
    return int(round(100.0 * solved / n))
    qids = [r[0] for r in db.query(Question.id).filter(Question.course_id == course_id).all()]
    solved = db.query(StudentQuestionResult).filter(
        StudentQuestionResult.student_id == student_id,
        StudentQuestionResult.question_id.in_(qids),
        StudentQuestionResult.is_correct == True,
    ).count()
    return int(round(100.0 * solved / n))




def sync_course_progress_row(db: Session, student_id: int, course_id: int) -> int:
    pct = compute_student_course_progress(db, student_id, course_id)
    row = db.query(CourseProgress).filter(
        CourseProgress.student_id == student_id,
        CourseProgress.course_id == course_id,
    ).first()
    if row:
        row.progress = pct
    else:
        db.add(CourseProgress(student_id=student_id, course_id=course_id, progress=pct))
    return pct

def get_student_course_progress(db: Session, student_id: int, course_id: int) -> int:
    return compute_student_course_progress(db, student_id, course_id)

@app.get("/health")
def health(): return {"status":"ok"}

@app.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.login == req.login).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(401, "Неверный логин или пароль")
    return {"id": user.id, "name": f"{user.first_name} {user.last_name}", "role": user.role}

@app.get("/courses")
def list_courses(db: Session = Depends(get_db)):
    return [{"id":c.id,"title":c.title,"description":c.description,"teacher_id":c.teacher_id} for c in db.query(Course).all()]

@app.get("/student/{student_id}/course/{course_id}")
def get_student_course_content(student_id: int, course_id: int, db: Session = Depends(get_db)):
    student = db.query(User).filter(User.id==student_id, User.role=="student").first()
    if not student: raise HTTPException(404, "Студент не найден")
    course = db.query(Course).filter(Course.id==course_id).first()
    if not course: raise HTTPException(404, "Курс не найден")
    if course not in student.enrolled:
        raise HTTPException(403, "Вы не записаны на этот курс")
    log_activity(db, student_id, "course_opened", f"Открыт курс: {course.title}")

    questions_out = []
    qrows = db.query(Question).filter(Question.course_id == course_id).order_by(Question.id).all()
    qids = [q.id for q in qrows]
    solved_ids = []
    if qids:
        solved_ids = [
            r.question_id
            for r in db.query(StudentQuestionResult).filter(
                StudentQuestionResult.student_id == student_id,
                StudentQuestionResult.question_id.in_(qids),
                StudentQuestionResult.is_correct == True,
            ).all()
        ]
    for q in qrows:
        ans = [{"id": a.id, "text": a.text} for a in q.answers]
        questions_out.append({"id": q.id, "text": q.text, "answers": ans})
    
    tasks_rows = db.query(CodingTask).filter(CodingTask.course_id == course_id).order_by(CodingTask.id).all()
    coding_tasks = []
    for task in tasks_rows:
        coding_tasks.append({
            "id": task.id,
            "title": task.title or "",
            "task": task.task or "",
            "solution": task.solution or "",
            "tests": parse_test_cases(task.test_cases),
        })
    primary_task = coding_tasks[0] if coding_tasks else {"task": "", "solution": "", "tests": []}
    
    # Parse flashcards from database
    flashcards = []
    flashcard_row = db.query(Flashcard).filter(Flashcard.course_id==course_id).first()
    if flashcard_row:
        try:
            flashcards = json.loads(flashcard_row.cards)
        except:
            flashcards = []
    
    return {
        "id": course.id,
        "title": course.title,
        "description": course.description or "",
        "theory": course.theory or "",
        "coding_task": primary_task["task"],
        "coding_solution": primary_task["solution"],
        "tests": primary_task["tests"],
        "coding_tasks": coding_tasks,
        "flashcards": flashcards,
        "questions": questions_out,
        "progress": get_student_course_progress(db, student_id, course_id),
        "solved_question_ids": solved_ids,
    }

@app.post("/student/{student_id}/course/{course_id}/answer")
def submit_answer(student_id: int, course_id: int, body: AnswerCheckIn, db: Session = Depends(get_db)):
    student = db.query(User).filter(User.id==student_id, User.role=="student").first()
    if not student: raise HTTPException(404, "Студент не найден")
    course = db.query(Course).filter(Course.id==course_id).first()
    if not course: raise HTTPException(404, "Курс не найден")
    if course not in student.enrolled:
        raise HTTPException(403, "Вы не записаны на этот курс")
    question = db.query(Question).filter(Question.id==body.question_id, Question.course_id==course_id).first()
    if not question: raise HTTPException(400, "Вопрос не относится к этому курсу")
    answer = db.query(Answer).filter(Answer.id==body.answer_id, Answer.question_id==question.id).first()
    if not answer: raise HTTPException(400, "Ответ не относится к вопросу")
    cur = compute_student_course_progress(db, student_id, course_id)
    if not answer.is_correct:
        return {"correct": False, "progress": cur}
    existing = db.query(StudentQuestionResult).filter(
        StudentQuestionResult.student_id==student_id,
        StudentQuestionResult.question_id==question.id,
    ).first()
    if existing:
        existing.is_correct = True
    else:
        db.add(StudentQuestionResult(student_id=student_id, question_id=question.id, is_correct=True))
    db.flush()
    pct = sync_course_progress_row(db, student_id, course_id)
    db.commit()
    return {"correct": True, "progress": pct}

@app.get("/student/{student_id}")
def get_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(User).filter(User.id==student_id, User.role=="student").first()
    if not student: raise HTTPException(404, "Студент не найден")
    courses = []
    for c in student.enrolled:
        pct = get_student_course_progress(db, student.id, c.id)
        courses.append({"id":c.id,"title":c.title,"description":c.description or "","progress":pct,"featured":False})
    recent = db.query(ActivityLog).filter(
        ActivityLog.student_id == student_id
    ).order_by(ActivityLog.created_at.desc()).limit(20).all()

    activity_list = []
    for act in recent:
        when = act.created_at.strftime("%d.%m.%Y %H:%M") if act.created_at else ""
        activity_list.append({
            "id": act.id,
            "action": act.action,
            "details": act.details,
            "when": when
        })

    return {
        "id": student.id,
        "display_name": f"{student.first_name} {student.last_name}",
        "courses": courses,
        "stats": {"completed_courses": 0, "active_courses": len(courses), "certificates": 0, "study_hours": 0},
        "weekly_hours": [],
        "activity": activity_list  # 👈 теперь не пустой массив
    }
@app.get("/teacher/{teacher_id}")
def get_teacher(teacher_id: int, db: Session = Depends(get_db)):
    teacher = db.query(User).filter(User.id==teacher_id, User.role=="teacher").first()
    if not teacher: raise HTTPException(404, "Преподаватель не найден")
    my_courses = db.query(Course).filter(Course.teacher_id==teacher_id).all()
    students_progress = []
    for c in my_courses:
        for s in c.students:
            pct = get_student_course_progress(db, s.id, c.id)
            students_progress.append({
                "id": f"sp{s.id}_c{c.id}",
                "name": f"{s.first_name} {s.last_name}",
                "course": c.title,
                "progress": pct,
            })
    teacher_courses = []
    for c in my_courses:
        studs = c.students
        if not studs:
            avg = 0
        else:
            tot = sum(get_student_course_progress(db, s.id, c.id) for s in studs)
            avg = int(round(tot / len(studs)))
        teacher_courses.append({"id":c.id,"title":c.title,"students_count":len(studs),"avg_progress":avg})
    all_prog = [get_student_course_progress(db, s.id, c.id) for c in my_courses for s in c.students]
    avg_all = int(round(sum(all_prog) / len(all_prog))) if all_prog else 0
    return {"id":teacher.id,"display_name":f"{teacher.first_name} {teacher.last_name}","students_progress":students_progress,"courses":teacher_courses,"stats":{"total_students":len(set(s.id for c in my_courses for s in c.students)),"active_courses":len(my_courses),"completed_courses":0,"avg_progress":avg_all},"activity":[]}

@app.get("/teacher/{teacher_id}/students")
def list_teacher_students(teacher_id: int, db: Session = Depends(get_db)):
    teacher = db.query(User).filter(User.id==teacher_id, User.role=="teacher").first()
    if not teacher: raise HTTPException(404, "Преподаватель не найден")
    my_courses = db.query(Course).filter(Course.teacher_id==teacher_id).all()
    seen = set()
    out = []
    for c in my_courses:
        for s in c.students:
            if s.id in seen: continue
            seen.add(s.id)
            out.append({"id": s.id, "first_name": s.first_name, "last_name": s.last_name, "login": s.login})
    out.sort(key=lambda x: x["id"])
    return out

@app.get("/teacher/{teacher_id}/courses")
def list_teacher_courses_short(teacher_id: int, db: Session = Depends(get_db)):
    teacher = db.query(User).filter(User.id==teacher_id, User.role=="teacher").first()
    if not teacher: raise HTTPException(404, "Преподаватель не найден")
    rows = db.query(Course).filter(Course.teacher_id==teacher_id).order_by(Course.id).all()
    return [{"id": c.id, "title": c.title} for c in rows]

@app.post("/teacher/{teacher_id}/courses")
def create_teacher_course(teacher_id: int, req: CourseCreate, db: Session = Depends(get_db)):
    teacher = db.query(User).filter(User.id==teacher_id, User.role=="teacher").first()
    if not teacher: raise HTTPException(404, "Преподаватель не найден")
    if not req.title.strip(): raise HTTPException(400, "Укажите название курса")
    theory = (req.theory or "").strip() or None
    tasks_payload = req.coding_tasks or []
    if not tasks_payload and (req.coding_task or req.coding_solution or req.test_cases):
        tasks_payload = [CodingTaskIn(
            title=None,
            task=req.coding_task or "",
            solution=req.coding_solution or "",
            tests=req.test_cases or [],
        )]
    primary_task = tasks_payload[0] if tasks_payload else None
    ctask = (primary_task.task or "").strip() if primary_task else None
    csol = (primary_task.solution or "").strip() if primary_task else None
    test_cases_json = serialize_test_cases(primary_task.tests) if primary_task else None
    course = Course(
        title=req.title.strip(),
        description=(req.description or "").strip() or None,
        theory=theory,
        coding_task=ctask,
        coding_solution=csol,
        test_cases=test_cases_json,
        teacher_id=teacher_id,
    )
    db.add(course); db.flush()

    for task in tasks_payload:
        db.add(CodingTask(
            course_id=course.id,
            title=(task.title or "").strip() or None,
            task=(task.task or "").strip() or None,
            solution=(task.solution or "").strip() or None,
            test_cases=serialize_test_cases(task.tests),
        ))
    
    # Create flashcards if provided
    if req.flashcards:
        flashcard = Flashcard(
            course_id=course.id,
            cards=json.dumps([{"question": card.question, "answer": card.answer} for card in req.flashcards])
        )
        db.add(flashcard)
    
    for q in req.questions:
        qt = (q.text or "").strip()
        if not qt: raise HTTPException(400, "Текст вопроса не может быть пустым")
        if len(q.answers) < 2: raise HTTPException(400, "Минимум два варианта ответа на вопрос")
        correct_count = sum(1 for a in q.answers if a.is_correct)
        if correct_count != 1: raise HTTPException(400, "У каждого вопроса должен быть ровно один правильный ответ")
        question = Question(course_id=course.id, text=qt)
        db.add(question); db.flush()
        for a in q.answers:
            at = (a.text or "").strip()
            if not at: raise HTTPException(400, "Текст ответа не может быть пустым")
            db.add(Answer(question_id=question.id, text=at, is_correct=a.is_correct))
    db.commit(); db.refresh(course)
    return {"course_id": course.id, "message": "Курс создан"}

@app.post("/teacher/{teacher_id}/students")
def create_student(teacher_id: int, req: StudentCreate, db: Session = Depends(get_db)):
    teacher = db.query(User).filter(User.id==teacher_id, User.role=="teacher").first()
    if not teacher: raise HTTPException(404, "Преподаватель не найден")
    login = (req.login or f"stu_{uuid.uuid4().hex[:8]}").strip()
    if db.query(User).filter(User.login==login).first(): raise HTTPException(400, "Логин занят")
    password = (req.password or uuid.uuid4().hex[:10]).strip()
    student = User(login=login, hashed_password=hash_password(password), role="student", first_name=req.first_name, last_name=req.last_name)
    db.add(student); db.flush()
    for cid in req.course_ids:
        course = db.query(Course).filter(Course.id==cid, Course.teacher_id==teacher_id).first()
        if not course: raise HTTPException(400, f"Курс {cid} не ваш")
        student.enrolled.append(course)
    db.commit(); db.refresh(student)
    return {"id":student.id,"login":student.login,"password":password,"role":"student"}


@app.post("/teacher/{teacher_id}/courses/{course_id}/enroll/{student_id}")
def enroll_student_to_course(teacher_id: int, course_id: int, student_id: int, db: Session = Depends(get_db)):
    teacher = db.query(User).filter(User.id == teacher_id, User.role == "teacher").first()
    if not teacher:
        raise HTTPException(404, "Преподаватель не найден")

    course = db.query(Course).filter(Course.id == course_id, Course.teacher_id == teacher_id).first()
    if not course:
        raise HTTPException(404, "Курс не найден или не принадлежит вам")

    student = db.query(User).filter(User.id == student_id, User.role == "student").first()
    if not student:
        raise HTTPException(404, "Студент не найден")

    # Проверка на дубликат зачисления
    existing = db.query(enrollments).filter(
        enrollments.c.student_id == student_id,
        enrollments.c.course_id == course_id
    ).first()
    if existing:
        raise HTTPException(400, "Студент уже зачислен на этот курс")

    # Зачисляем через таблицу связей
    db.execute(enrollments.insert().values(student_id=student_id, course_id=course_id))
    db.commit()

    return {"message": "Студент успешно зачислен на курс"}
@app.delete("/teacher/{teacher_id}/courses/{course_id}")
def delete_course(teacher_id: int, course_id: int, db: Session = Depends(get_db)):
    teacher = db.query(User).filter(User.id == teacher_id, User.role == "teacher").first()
    if not teacher:
        raise HTTPException(404, "Преподаватель не найден")

    # Проверяем, что курс принадлежит учителю
    course = db.query(Course).filter(Course.id == course_id, Course.teacher_id == teacher_id).first()
    if not course:
        raise HTTPException(404, "Курс не найден или не принадлежит вам")

    # Безопасная очистка зависимостей
    db.query(CourseProgress).filter(CourseProgress.course_id == course_id).delete()
    db.query(FlashcardProgress).filter(FlashcardProgress.course_id == course_id).delete()
    db.query(Flashcard).filter(Flashcard.course_id == course_id).delete()
    db.query(CodeSubmission).filter(CodeSubmission.course_id == course_id).delete()

    # Удаляем студентов из этого курса
    db.execute(enrollments.delete().where(enrollments.c.course_id == course_id))

    # Вопросы удалятся сами благодаря cascade="all, delete-orphan" в модели
    db.delete(course)
    db.commit()

    return {"message": "Курс успешно удалён"}

@app.delete("/teacher/{teacher_id}/students/{student_id}")
def delete_student(teacher_id: int, student_id: int, db: Session = Depends(get_db)):
    # 1. Проверяем преподавателя
    teacher = db.query(User).filter(User.id == teacher_id, User.role == "teacher").first()
    if not teacher:
        raise HTTPException(404, "Преподаватель не найден")

    # 2. Проверяем студента
    student = db.query(User).filter(User.id == student_id, User.role == "student").first()
    if not student:
        raise HTTPException(404, "Студент не найден")

    # 3. Проверка: студент должен быть записан хотя бы в один курс этого учителя
    teacher_course_ids = [c.id for c in teacher.courses]
    is_enrolled = db.query(enrollments).filter(
        enrollments.c.student_id == student_id,
        enrollments.c.course_id.in_(teacher_course_ids)
    ).first()
    if not is_enrolled:
        raise HTTPException(403, "Этот студент не относится к вашим курсам")

    # 4. Очистка связанных данных (чтобы SQLAlchemy не выбросил ошибку FK)
    db.query(CourseProgress).filter(CourseProgress.student_id == student_id).delete()
    db.query(StudentQuestionResult).filter(StudentQuestionResult.student_id == student_id).delete()
    db.query(CodeSubmission).filter(CodeSubmission.student_id == student_id).delete()
    db.query(FlashcardProgress).filter(FlashcardProgress.student_id == student_id).delete()
    db.execute(enrollments.delete().where(enrollments.c.student_id == student_id))

    # 5. Удаляем самого студента
    db.delete(student)
    db.commit()

    return {"message": "Студент успешно удалён"}


@app.post("/teacher/{teacher_id}/assistant/generate")
def generate_assistant_content(teacher_id: int, req: AssistantGenerateRequest, db: Session = Depends(get_db)):
    teacher = db.query(User).filter(User.id==teacher_id, User.role=="teacher").first()
    if not teacher:
        raise HTTPException(404, "Преподаватель не найден")
    if not req.text.strip():
        raise HTTPException(400, "Введите описание для генерации")

    source_text = req.text.strip()

    if not API_KEY:
        raise HTTPException(500, "API ключ GigaChat не настроен")

    try:
        with GigaChat(credentials=API_KEY, verify_ssl_certs=False) as giga:
            if req.mode in {"flashcards", "questions"} and count_paragraphs(source_text) > 3:
                summary_prompt = build_summary_prompt(source_text)
                summary_response = giga.chat(summary_prompt)
                summary = (
                    summary_response.choices[0].message.content
                    if summary_response and summary_response.choices
                    else ""
                ).strip()
                if not summary:
                    raise HTTPException(500, "Не удалось получить резюме текста")
                source_text = summary

            prompt = build_assistant_prompt(req.mode, source_text)
            if not prompt:
                raise HTTPException(400, "Некорректный режим")
            content = ""
            last_error = None
            for _ in range(5):
                response = giga.chat(prompt)
                content = response.choices[0].message.content if response and response.choices else ""
                normalized = normalize_ai_json(content)
                last_error = validate_assistant_result(req.mode, normalized)
                if not last_error:
                    content = normalized
                    break
                prompt = (
                    "В твоем ответе есть ошибка. Исправь и верни только JSON без пояснений.\n"
                    f"Ошибка: {last_error}\n"
                    f"Текущий ответ: {normalized}"
                )
            if last_error:
                raise HTTPException(400, f"Ошибка валидации ответа ИИ: {last_error}")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(500, f"Ошибка GigaChat: {exc}")

    return {"result": content}

@app.get("/courses/{course_id}/coding")
def get_coding_task(
    course_id: int,
    student_id: Optional[int] = None,
    task_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    """Получить задание, тесты и историю попыток студента"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(404, "Курс не найден")

    tasks_rows = db.query(CodingTask).filter(CodingTask.course_id == course_id).order_by(CodingTask.id).all()
    if task_id is not None:
        selected_task = next((t for t in tasks_rows if t.id == task_id), None)
        if not selected_task:
            raise HTTPException(404, "Практическое задание не найдено")
    else:
        selected_task = tasks_rows[0] if tasks_rows else None
    
    result = {
        "id": course.id,
        "title": course.title,
        "task_id": selected_task.id if selected_task else None,
        "task": selected_task.task if selected_task and selected_task.task else "",
        "solution": selected_task.solution if selected_task and selected_task.solution else "",
        "tests": parse_test_cases(selected_task.test_cases) if selected_task else [],
        "tasks": [{"id": t.id, "title": t.title or "", "task": t.task or ""} for t in tasks_rows],
    }
    
    # Если студент указан, добавить его попытки
    if student_id and selected_task:
        submissions_query = db.query(CodeSubmission).filter(
            CodeSubmission.student_id == student_id,
            CodeSubmission.course_id == course_id,
        )
        if len(tasks_rows) == 1:
            submissions_query = submissions_query.filter(
                or_(
                    CodeSubmission.coding_task_id == selected_task.id,
                    CodeSubmission.coding_task_id.is_(None),
                )
            )
        else:
            submissions_query = submissions_query.filter(CodeSubmission.coding_task_id == selected_task.id)
        submissions = submissions_query.order_by(CodeSubmission.created_at.desc()).all()
        
        result["submissions"] = [{
            "id": s.id,
            "code": s.code,
            "is_correct": s.is_correct,
            "results": json.loads(s.test_results or "[]") if s.test_results else [],
            "created_at": s.created_at.isoformat(),
            "execution_time": s.execution_time
        } for s in submissions]
        
        # Best result
        best = next((s for s in submissions if s.is_correct), None)
        result["best_submission"] = {"id": best.id, "is_correct": True} if best else None
    
    return result

@app.post("/student/{student_id}/courses/{course_id}/submit-code")
def submit_code(student_id: int, course_id: int, code_data: CodeSubmitRequest, db: Session = Depends(get_db)):
    """Отправить код на проверку"""
    student = db.query(User).filter(User.id==student_id, User.role=="student").first()
    if not student:
        raise HTTPException(404, "Студент не найден")
    
    course = db.query(Course).filter(Course.id==course_id).first()
    if not course:
        raise HTTPException(404, "Курс не найден")
    
    if course not in student.enrolled:
        raise HTTPException(403, "Вы не записаны на этот курс")
    
    tasks_rows = db.query(CodingTask).filter(CodingTask.course_id == course_id).order_by(CodingTask.id).all()
    if not tasks_rows:
        raise HTTPException(400, "В курсе нет практических заданий")
    if code_data.task_id is not None:
        task = next((t for t in tasks_rows if t.id == code_data.task_id), None)
        if not task:
            raise HTTPException(404, "Практическое задание не найдено")
    elif len(tasks_rows) == 1:
        task = tasks_rows[0]
    else:
        raise HTTPException(400, "Укажите task_id для отправки решения")

    # Запустить тесты
    test_results, is_correct, exec_time, error = run_tests(code_data.code, task.test_cases or "[]")
    
    # Сохранить в БД
    submission = CodeSubmission(
        student_id=student_id,
        course_id=course_id,
        coding_task_id=task.id,
        code=code_data.code,
        is_correct=is_correct,
        test_results=json.dumps(test_results),
        error_message=error,
        execution_time=exec_time
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)
    
    return {
        "success": is_correct,
        "results": test_results,
        "message": "Все тесты пройдены!" if is_correct else "Некоторые тесты не прошли",
        "submission_id": submission.id,
        "execution_time": exec_time
    }

@app.get("/student/{student_id}/courses/{course_id}/submissions")
def get_submissions(
    student_id: int,
    course_id: int,
    task_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    """Получить историю попыток студента"""
    student = db.query(User).filter(User.id==student_id, User.role=="student").first()
    if not student:
        raise HTTPException(404, "Студент не найден")
    
    submissions_query = db.query(CodeSubmission).filter(
        CodeSubmission.student_id == student_id,
        CodeSubmission.course_id == course_id,
    )
    if task_id is not None:
        submissions_query = submissions_query.filter(CodeSubmission.coding_task_id == task_id)
    submissions = submissions_query.order_by(CodeSubmission.created_at.desc()).all()
    
    return [{
        "id": s.id,
        "code": s.code,
        "is_correct": s.is_correct,
        "results": json.loads(s.test_results or "[]"),
        "error_message": s.error_message,
        "created_at": s.created_at.isoformat(),
        "execution_time": s.execution_time
    } for s in submissions]

@app.post("/teacher/{teacher_id}/courses/{course_id}/tests/update")
def update_tests(teacher_id: int, course_id: int, tests_data: TestCasesUpdateRequest, db: Session = Depends(get_db)):
    """Обновить тесты для курса (только для преподавателя)"""
    course = db.query(Course).filter(
        Course.id == course_id,
        Course.teacher_id == teacher_id
    ).first()
    
    if not course:
        raise HTTPException(404, "Курс не найден или не ваш")
    
    tasks_rows = db.query(CodingTask).filter(CodingTask.course_id == course_id).order_by(CodingTask.id).all()
    if not tasks_rows:
        raise HTTPException(400, "В курсе нет практических заданий")
    if tests_data.task_id is not None:
        task = next((t for t in tasks_rows if t.id == tests_data.task_id), None)
        if not task:
            raise HTTPException(404, "Практическое задание не найдено")
    elif len(tasks_rows) == 1:
        task = tasks_rows[0]
    else:
        raise HTTPException(400, "Укажите task_id для обновления тестов")

    task.test_cases = serialize_test_cases(tests_data.tests)
    if course.coding_task or course.coding_solution or course.test_cases:
        if len(tasks_rows) == 1 and task.id == tasks_rows[0].id:
            course.test_cases = task.test_cases
    db.commit()

    return {"message": "✅ Тесты обновлены", "count": len(tests_data.tests), "task_id": task.id}

@app.post("/teacher/{teacher_id}/courses/{course_id}/flashcards")
def create_flashcards(teacher_id: int, course_id: int, req: FlashcardCreateRequest, db: Session = Depends(get_db)):
    """Создать или обновить карточки для курса (только для преподавателя)"""
    course = db.query(Course).filter(
        Course.id == course_id,
        Course.teacher_id == teacher_id
    ).first()
    
    if not course:
        raise HTTPException(404, "Курс не найден или не ваш")
    
    if not req.cards:
        raise HTTPException(400, "Нужна минимум одна карточка")
    
    # Проверить, что все карточки имеют непустые вопрос и ответ
    for card in req.cards:
        if not card.question.strip():
            raise HTTPException(400, "Вопрос не может быть пустым")
        if not card.answer.strip():
            raise HTTPException(400, "Ответ не может быть пустым")
    
    # Проверить есть ли уже карточки для этого курса
    existing = db.query(Flashcard).filter(Flashcard.course_id == course_id).first()
    if existing:
        existing.cards = json.dumps([{"question": card.question, "answer": card.answer} for card in req.cards])
        existing.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return {"flashcard_id": existing.id, "message": "Карточки обновлены", "count": len(req.cards)}
    else:
        flashcard = Flashcard(
            course_id=course_id,
            cards=json.dumps([{"question": card.question, "answer": card.answer} for card in req.cards])
        )
        db.add(flashcard)
        db.commit()
        db.refresh(flashcard)
        return {"flashcard_id": flashcard.id, "message": "Карточки созданы", "count": len(req.cards)}

@app.get("/courses/{course_id}/flashcards")
def get_flashcards(course_id: int, db: Session = Depends(get_db)):
    """Получить карточки для курса"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(404, "Курс не найден")
    
    flashcard = db.query(Flashcard).filter(Flashcard.course_id == course_id).first()
    if not flashcard:
        return {"cards": [], "total": 0}
    
    try:
        cards = json.loads(flashcard.cards)
    except:
        cards = []
    
    return {"cards": cards, "total": len(cards)}

@app.post("/student/{student_id}/courses/{course_id}/flashcard-progress")
def save_flashcard_progress(student_id: int, course_id: int, req: FlashcardProgressRequest, db: Session = Depends(get_db)):
    """Сохранить прогресс по карточке"""
    student = db.query(User).filter(User.id == student_id, User.role == "student").first()
    if not student:
        raise HTTPException(404, "Студент не найден")
    
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(404, "Курс не найден")
    
    if course not in student.enrolled:
        raise HTTPException(403, "Вы не записаны на этот курс")
    
    if req.confidence not in ["still_learning", "almost_there", "mastered"]:
        raise HTTPException(400, "Некорректный уровень уверенности")
    
    # Сохранить или обновить прогресс
    existing = db.query(FlashcardProgress).filter(
        FlashcardProgress.student_id == student_id,
        FlashcardProgress.course_id == course_id,
        FlashcardProgress.card_index == req.card_index
    ).first()
    
    if existing:
        existing.confidence = req.confidence
        existing.reviewed_at = datetime.utcnow()
    else:
        progress = FlashcardProgress(
            student_id=student_id,
            course_id=course_id,
            card_index=req.card_index,
            confidence=req.confidence
        )
        db.add(progress)
    
    db.commit()
    return {"message": "Прогресс сохранён"}

@app.get("/student/{student_id}/courses/{course_id}/flashcard-progress")
def get_flashcard_progress(student_id: int, course_id: int, db: Session = Depends(get_db)):
    """Получить прогресс по карточкам"""
    student = db.query(User).filter(User.id == student_id, User.role == "student").first()
    if not student:
        raise HTTPException(404, "Студент не найден")
    
    progress_records = db.query(FlashcardProgress).filter(
        FlashcardProgress.student_id == student_id,
        FlashcardProgress.course_id == course_id
    ).all()
    
    return {
        "progress": [{
            "card_index": p.card_index,
            "confidence": p.confidence,
            "reviewed_at": p.reviewed_at.isoformat()
        } for p in progress_records]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
