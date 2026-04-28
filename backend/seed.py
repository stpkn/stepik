import os
from sqlalchemy import create_engine, Column, Integer, String, ForeignKey, Table
from sqlalchemy.orm import sessionmaker, declarative_base, relationship
from passlib.context import CryptContext

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./course_platform.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {})
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    login = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    courses = relationship("Course", back_populates="teacher")

class Course(Base):
    __tablename__ = "courses"
    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(String)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    teacher = relationship("User", back_populates="courses")

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    if db.query(User).filter(User.role == "teacher").first():
        print("⚠️ Данные уже есть. Пропускаю.")
        db.close(); return
    teacher = User(login="teacher", hashed_password=pwd_ctx.hash("teacher123"), role="teacher", first_name="Преподаватель", last_name="Тестов")
    db.add(teacher); db.flush()
    db.add_all([
        Course(title="Python Основы", description="Переменные, циклы, функции", teacher_id=teacher.id),
        Course(title="FastAPI", description="REST API на практике", teacher_id=teacher.id),
        Course(title="React", description="Фронтенд с нуля", teacher_id=teacher.id)
    ])
    db.commit(); db.close()
    print(f"✅ Готово! Преподаватель: login=teacher, pass=teacher123 | Курсов: 3")

if __name__ == "__main__": seed()
