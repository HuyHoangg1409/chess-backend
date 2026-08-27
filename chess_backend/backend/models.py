from sqlalchemy.orm import relationship
from sqlalchemy import null
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    Text,
    ForeignKey,
    DateTime,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, DeclarativeBase
from datetime import datetime


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    user_id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(
        String, unique=True, nullable=False, index=True
    )
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    puzzle_elo: Mapped[int] = mapped_column(Integer, default=1200)
    pvp_elo: Mapped[int] = mapped_column(Integer, default=1200)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )


class Puzzles(Base):
    __tablename__ = "puzzles"

    puzzle_id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True, index=True
    )
    fen_position: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    correct_moves: Mapped[str] = mapped_column(Text, nullable=False)
    difficulty: Mapped[str] = mapped_column(String, nullable=False)
    rating: Mapped[int] = mapped_column(Integer, nullable=True)


class UserPuzzleHistory(Base):
    __tablename__ = "user_puzzle_history"

    puzzle_history_id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True, index=True
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False
    )
    puzzle_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("puzzles.puzzle_id"), nullable=False
    )
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False)
    player_elo: Mapped[int] = mapped_column(Integer, nullable=False)
    solved_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), nullable=False
    )


class GameMatches(Base):
    __tablename__ = "game_matches"

    game_id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True, index=True
    )
    white_player_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False
    )
    black_player_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False
    )
    winner_username: Mapped[str] = mapped_column(Text, nullable = False)
    result: Mapped[str] = mapped_column(String, nullable=False)
    final_fen: Mapped[str] = mapped_column(String, nullable=False)
    pgn: Mapped[str] = (mapped_column(Text, nullable=False))
    white_elo_change: Mapped[int] = (mapped_column(Integer, nullable=False))
    black_elo_change: Mapped[int] = (mapped_column(Integer, nullable=False))
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable = False)

    white_player = (relationship("User", foreign_keys=[white_player_id]))
    black_player = (relationship("User", foreign_keys=[black_player_id]))
