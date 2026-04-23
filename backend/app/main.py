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
    UniqueConstraint,
    inspect,
    text,
)
from sqlalchemy.orm import sessionmaker, declarative_base, Session, relationship
from passlib.context import CryptContext
from pydantic import BaseModel
from typing import List, Optional
import uuid, os
from dotenv import load_dotenv

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
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    teacher = relationship("User", back_populates="courses")
    students = relationship("User", secondary=enrollments, back_populates="enrolled")
    questions = relationship("Question", back_populates="course", cascade="all, delete-orphan")

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
    questions: List[QuestionIn] = []

class AnswerCheckIn(BaseModel):
    question_id: int
    answer_id: int

app = FastAPI(title="Course Platform")

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
    if stmts:
        with engine.begin() as conn:
            for s in stmts:
                conn.execute(text(s))

@app.on_event("startup")
def _ensure_tables():
    _migrate_schema()

app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000","http://127.0.0.1:3000"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

def verify_password(plain, hashed): return pwd_context.verify(plain, hashed)
def hash_password(pw): return pwd_context.hash(pw)

def compute_student_course_progress(db: Session, student_id: int, course_id: int) -> int:
    n = db.query(Question).filter(Question.course_id == course_id).count()
    if n == 0:
        return 100
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
    questions_out = []
    qrows = db.query(Question).filter(Question.course_id==course_id).order_by(Question.id).all()
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
    return {
        "id": course.id,
        "title": course.title,
        "description": course.description or "",
        "theory": course.theory or "",
        "coding_task": course.coding_task or "",
        "coding_solution": course.coding_solution or "",
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
    return {"id":student.id,"display_name":f"{student.first_name} {student.last_name}","courses":courses,"stats":{"completed_courses":0,"active_courses":len(courses),"certificates":0,"study_hours":0},"weekly_hours":[],"activity":[]}

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
    ctask = (req.coding_task or "").strip() or None
    csol = (req.coding_solution or "").strip() or None
    course = Course(
        title=req.title.strip(),
        description=(req.description or "").strip() or None,
        theory=theory,
        coding_task=ctask,
        coding_solution=csol,
        teacher_id=teacher_id,
    )
    db.add(course); db.flush()
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
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
