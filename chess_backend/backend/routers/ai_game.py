import chess
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session

from ..schemas import GameState
from ..database import get_db
from backend.ai_engine.greedy import get_greedy_move
from backend.ai_engine.minimax import get_minimax_move
from backend.ai_engine.stockfish_engine import get_stockfish_move

router = APIRouter(prefix="/ai", tags=["AI Game"])


@router.post("/move", status_code=status.HTTP_200_OK)
def get_ai_move(gameState: GameState, db: Session = Depends(get_db)):
    """Lấy nước đi tốt nhất bot có thể đi với thuật toán có độ sâu tương ứng với độ khó.

    Args:
        gameState (GameState): Schema bao gồm "fen" và "difficult"
        db (Session): Phiên kết nối cơ sở dữ liệu

    Returns:
        dict: Trả về "best_move" là nước đi tốt nhất của thuật toán
    """
    board = chess.Board(gameState.fen)

    if gameState.difficult == 1:
        move = get_greedy_move(board)
    elif gameState.difficult == 2:
        move = get_minimax_move(board, 4)
    elif gameState.difficult == 3:
        move = get_minimax_move(board, 5)
    else:
        move = get_stockfish_move(board, 1.5, 12)

    if move is None:
        return {"best_move": None}
    return {"best_move": move.uci()}
