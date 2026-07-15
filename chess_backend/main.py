from fastapi import FastAPI, status, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
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
