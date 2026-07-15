from fastapi import FastAPI, status, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
import database
import models
import schemas

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Chess API")


@app.get("/")
def read_root():
    return FileResponse("index.html")


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

    hashed_password = user_data.password + "_hash"

    new_user = models.User(username=user_data.username, password_hash=hashed_password)

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


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
    submission: schemas.PuzzleSubmit, db: Session = Depends(database.get_db)
):
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
        return schemas.PuzzleResultResponse(
            is_correct=True, message="Đáp án đúng", correct_solution=correct_move_clean
        )
    else:
        return schemas.PuzzleResultResponse(
            is_correct=False,
            message="Đáp án chưa chính xác",
            correct_solution=correct_move_clean,
        )
