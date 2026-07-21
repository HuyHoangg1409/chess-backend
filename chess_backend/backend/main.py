from fastapi import FastAPI, status, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from fastapi.security import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
import backend.secure as secure
import backend.database as database
import backend.models as models
import backend.schemas as schemas

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Chess API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:8000/"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

oauth2_scheme = APIKeyHeader(name="Authorization", auto_error=False)


def get_current_user(token: str = Depends(oauth2_scheme)):
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Thiếu token"
        )

    if token.lower().startswith("bearer "):
        token = token[7:]

    user_info = secure.get_user_from_token(token)

    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token hết hạn hoặc không hợp lệ. Đăng nhập lại",
        )

    return user_info


@app.get("/")
def read_root():
    return FileResponse("backend/index.html")


@app.post(
    "/register",
    response_model=schemas.UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_user(
    user_data: schemas.UserCreate, db: Session = Depends(database.get_db)
):
    existing_user = (
        db.query(models.User).filter(models.User.username == user_data.username).first()
    )
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Tên đăng nhập đã tồn tại"
        )

    hashed_password = secure.hash_password(user_data.password)

    new_user = models.User(username=user_data.username, password_hash=hashed_password)

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@app.post("/login")
def login(user_data: schemas.UserCreate, db: Session = Depends(database.get_db)):
    user = (
        db.query(models.User).filter(models.User.username == user_data.username).first()
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Không tồn tại tài khoản"
        )

    if not secure.verify_password(user_data.password, user.password_hash):  # type: ignore
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Mật khẩu sai"
        )

    access_token = secure.create_access_token(
        data={"sub": user.username, "user_id": user.user_id}
    )

    return {"access_token": access_token, "token_type": "bearer"}


@app.post(
    "/puzzles",
    response_model=schemas.PuzzleResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_puzzles(
    puzzle_data: schemas.PuzzleCreate, db: Session = Depends(database.get_db)
):
    existing_puzzles = (
        db.query(models.Puzzles)
        .filter(models.Puzzles.fen_position == puzzle_data.fen_position)
        .first()
    )
    if existing_puzzles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Đã tồn tại thế cờ này"
        )

    new_puzzle = models.Puzzles(
        fen_position=puzzle_data.fen_position,
        correct_moves=puzzle_data.correct_moves,
        difficulty=puzzle_data.difficulty,
    )

    db.add(new_puzzle)
    db.commit()
    db.refresh(new_puzzle)

    return new_puzzle


@app.get(
    "/puzzles/random",
    response_model=schemas.PuzzleResponse,
    status_code=status.HTTP_200_OK,
)
def random_puzzles(
    difficulty: str = Query(
        "Easy", description="Độ khó của thế cờ: Easy, Medium, Hard"
    ),
    db: Session = Depends(database.get_db),
):
    puzzle = (
        db.query(models.Puzzles)
        .filter(models.Puzzles.difficulty == difficulty)
        .order_by(func.random())
        .first()
    )

    if not puzzle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không có thế cờ có mức độ khó tương ứng",
        )

    return puzzle


@app.post(
    "/puzzles/check",
    response_model=schemas.PuzzleResultResponse,
    status_code=status.HTTP_200_OK,
)
def check_puzzle_answer(
    submission: schemas.PuzzleSubmit,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(get_current_user),
):
    print(f"{current_user.get("sub")}, {current_user.get("user_id")}")
    db_user = (
        db.query(models.User)
        .filter(models.User.username == current_user.get("sub"))
        .first()
    )
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy người chơi"
        )

    puzzle = (
        db.query(models.Puzzles)
        .filter(models.Puzzles.puzzle_id == submission.puzzle_id)
        .first()
    )
    if not puzzle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy thế cờ"
        )

    user_move_clean = submission.user_move.strip().lower()
    correct_move_clean = puzzle.correct_moves.strip().lower()

    if user_move_clean == correct_move_clean:
        if puzzle.difficulty == "Easy":
            db_user.elo_rating += 15
        elif puzzle.difficulty == "Medium":
            db_user.elo_rating += 20
        elif puzzle.difficulty == "Hard":
            db_user.elo_rating += 25

        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        return schemas.PuzzleResultResponse(
            is_correct=True, message="Đáp án đúng", correct_solution=correct_move_clean
        )
    else:
        if puzzle.difficulty == "Easy":
            db_user.elo_rating -= 10
        elif puzzle.difficulty == "Medium":
            db_user.elo_rating -= 15
        elif puzzle.difficulty == "Hard":
            db_user.elo_rating -= 20

        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        return schemas.PuzzleResultResponse(
            is_correct=False,
            message="Đáp án chưa chính xác",
            correct_solution=correct_move_clean,
        )
