from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, Table
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
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    teacher = relationship("User", back_populates="courses")
    students = relationship("User", secondary=enrollments, back_populates="enrolled")

class LoginRequest(BaseModel):
    login: str; password: str

class StudentCreate(BaseModel):
    first_name: str; last_name: str
    login: Optional[str] = None; password: Optional[str] = None
    course_ids: List[int] = []

app = FastAPI(title="Course Platform")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000","http://127.0.0.1:3000"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

def verify_password(plain, hashed): return pwd_context.verify(plain, hashed)
def hash_password(pw): return pwd_context.hash(pw)

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

@app.get("/student/{student_id}")
def get_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(User).filter(User.id==student_id, User.role=="student").first()
    if not student: raise HTTPException(404, "Студент не найден")
    courses = [{"id":c.id,"title":c.title,"description":c.description,"progress":0,"featured":False} for c in student.enrolled]
    return {"id":student.id,"display_name":f"{student.first_name} {student.last_name}","courses":courses,"stats":{"completed_courses":0,"active_courses":len(courses),"certificates":0,"study_hours":0},"weekly_hours":[],"activity":[]}

@app.get("/teacher/{teacher_id}")
def get_teacher(teacher_id: int, db: Session = Depends(get_db)):
    teacher = db.query(User).filter(User.id==teacher_id, User.role=="teacher").first()
    if not teacher: raise HTTPException(404, "Преподаватель не найден")
    my_courses = db.query(Course).filter(Course.teacher_id==teacher_id).all()
    students_progress = [{"id":s.id,"name":f"{s.first_name} {s.last_name}","course":c.title,"progress":0} for c in my_courses for s in c.students]
    teacher_courses = [{"id":c.id,"title":c.title,"students_count":len(c.students),"avg_progress":0} for c in my_courses]
    return {"id":teacher.id,"display_name":f"{teacher.first_name} {teacher.last_name}","students_progress":students_progress,"courses":teacher_courses,"stats":{"total_students":len(set(s.id for c in my_courses for s in c.students)),"active_courses":len(my_courses),"completed_courses":0,"avg_progress":0},"activity":[]}

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
