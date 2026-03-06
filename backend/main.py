from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Programming Course Platform (MVP)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LoginRequest(BaseModel):
    login: str
    password: str


MOCK_USERS = {
    "student": "password123",
}


@app.post("/login")
def login(request: LoginRequest):
    expected_password = MOCK_USERS.get(request.login)

    if expected_password is None or expected_password != request.password:
        raise HTTPException(status_code=401, detail="Invalid login or password")

    return {"message": f"Successfully logged in as {request.login}"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=3000, reload=True)