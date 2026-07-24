from pydantic import BaseModel, Field


class UserCreate(BaseModel):
    username: str = Field(..., min_length=5, max_length=20)
    password: str = Field(..., min_length=6)


class UserResponse(BaseModel):
    user_id: int
    username: str
    elo_rating: int

    class config:
        from_attributes = True


class PuzzleCreate(BaseModel):
    fen_position: str
    correct_moves: str
    difficulty: str


class PuzzleResponse(BaseModel):
    puzzle_id: int
    fen_position: str
    difficulty: str
    correct_moves: str

    class config:
        from_attributes = True


class PuzzleSubmit(BaseModel):
    puzzle_id: int
    user_move: str


class PuzzleResultResponse(BaseModel):
    is_correct: bool
    message: str
    correct_solution: str