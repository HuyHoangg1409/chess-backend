from sqlalchemy import Column, Integer, String, Boolean, Text, ForeignKey
from database import Base


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    elo_rating = Column(Integer, default=1200)


class Puzzles(Base):
    __tablename__ = "puzzles"

    puzzle_id = Column(Integer, primary_key=True, index=True)
    fen_position = Column(Text, nullable=False)
    correct_moves = Column(Text, nullable=False)
    difficulty = Column(String)


class UserPuzzleHistory(Base):
    __tablename__ = "user_puzzle_history"

    puzzle_history_id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("user.user_id"), nullable=False)
    puzzle_id = Column(Integer, ForeignKey("puzzles.puzzle_id"), nullable=False)

    is_correct = Column(Boolean, nullable=False)
