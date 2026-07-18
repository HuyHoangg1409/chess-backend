from sqlalchemy import Column, Integer, String, Boolean, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, DeclarativeBase


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    user_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(
        String, unique=True, nullable=False, index=True
    )
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    elo_rating: Mapped[int] = mapped_column(Integer, default=1200)


class Puzzles(Base):
    __tablename__ = "puzzles"

    puzzle_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    fen_position: Mapped[str] = mapped_column(Text, nullable=False)
    correct_moves: Mapped[str] = mapped_column(Text, nullable=False)
    difficulty: Mapped[str] = mapped_column(String, nullable=False)


class UserPuzzleHistory(Base):
    __tablename__ = "user_puzzle_history"

    puzzle_history_id: Mapped[str] = mapped_column(
        Integer, primary_key=True, index=True
    )
    user_id: Mapped[str] = mapped_column(
        Integer, ForeignKey("user.user_id"), nullable=False
    )
    puzzle_id: Mapped[str] = mapped_column(
        Integer, ForeignKey("puzzles.puzzle_id"), nullable=False
    )
    is_correct: Mapped[str] = mapped_column(Boolean, nullable=False)
