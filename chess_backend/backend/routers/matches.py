from sqlalchemy import desc
from sqlalchemy import or_
from fastapi import status
from sqlalchemy.orm import Session
from fastapi import APIRouter, HTTPException, Depends

from ..dependencies import get_current_user
from ..database import get_db
from ..models import GameMatches, User

router = APIRouter(prefix="/matches", tags=["matches"])


@router.get("/my-history")
def get_my_match_history(
    db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    """Trả về tối đa 30 lịch sử đấu gần nhất của người chơi theo thứ tự mới nhất.

    Args:
        db (Session): Phiên kết nối database
        current_user (dict): Thông tin của người chơi bao gồm "sub" và "user_id"

    Returns:
        list: danh sách các trận đấu của người chơi
    """
    user_id = current_user.get("user_id")

    matches = (
        db.query(GameMatches)
        .filter(
            or_(
                GameMatches.white_player_id == user_id,
                GameMatches.black_player_id == user_id,
            )
        )
        .order_by(desc(GameMatches.created_at))
        .limit(30)
        .all()
    )

    history_list = []
    for m in matches:
        is_white = m.white_player_id == user_id

        opponent_id = m.black_player_id if is_white else m.white_player_id
        opponent_info = db.query(User).filter(User.user_id == opponent_id).first()

        my_result = (
            "draw"
            if m.winner_username is None
            else "win" if current_user.get("sub") == m.winner_username else "lose"
        )

        history_list.append(
            {
                "id": m.game_id,
                "opponent_username": opponent_info.username,
                "my_color": "white" if is_white else "black",
                "result": my_result,
                "elo_change": m.white_elo_change if is_white else m.black_elo_change,
                "created_at": m.created_at,
            }
        )

    return history_list


@router.get("/{match_id}")
def get_match_detail(
    match_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    """Lấy lịch sử ván đấu dựa trên id của trận đấu.

    Args:
        match_id (int): ID của ván đấu
        db (Session): Phiên kết nối database
        current_user (dict): Thông tin người chơi hiện tại bao gồm "sub" và "user_id"

    Raises:
        HTTPException: Trả về 404 nếu không tìm thấy trận đấu

    Returns:
        dict: Trả về thông tin của ván đấu bao gồm "id", "result", "winner", "fen", "pgn", "created_at", "white" và "black"
    """
    db_match_info = (
        db.query(GameMatches).filter(GameMatches.game_id == match_id).first()
    )
    if not db_match_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy lịch sử đấu"
        )

    white_player = (
        db.query(User).filter(User.user_id == db_match_info.white_player_id).first()
    )
    black_player = (
        db.query(User).filter(User.user_id == db_match_info.black_player_id).first()
    )

    return {
        "id": db_match_info.game_id,
        "result": db_match_info.result,
        "winner": db_match_info.winner_username,
        "fen": db_match_info.final_fen,
        "pgn": db_match_info.pgn,
        "created_at": db_match_info.created_at,
        "white": {
            "id": white_player.user_id,
            "username": white_player.username,
            "elo_change": db_match_info.white_elo_change,
        },
        "black": {
            "id": black_player.user_id,
            "username": black_player.username,
            "elo_change": db_match_info.black_elo_change,
        },
    }
