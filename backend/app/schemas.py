from pydantic import BaseModel
from typing import List, Optional

class LoginRequest(BaseModel):
    login: str
    password: str

class StudentCreate(BaseModel):
    first_name: str
    last_name: str
    login: Optional[str] = None
    password: Optional[str] = None
    course_ids: List[int] = []
