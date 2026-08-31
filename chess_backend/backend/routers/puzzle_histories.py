from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from ..schemas import PuzzleHistoryCreate
from ..models import UserPuzzleHistory, User, Puzzles
from ..database import get_db
from ..dependencies import get_current_user
from ..utils.elo import calculate_puzzle_elo

router = APIRouter(prefix="", tags=["Puzzle History"])


@router.post("/puzzle-histories", status_code=status.HTTP_200_OK)
def add_puzzle_history(
    history: PuzzleHistoryCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Thêm lịch sử giải đố của người chơi vào database.

    Args:
        history (PuzzleHistoryCreate): Bao gồm "puzzle_id" và "is_correct"
        db (Session): Phiên kết nối cơ sở dữ liệu
        current_user (dict): Thông tin của người dùng hiện tại được giải mã từ JWT

    Raises:
        HTTPException: Trả về lỗi 404 nếu không tìm thấy người chơi
        HTTPException: Trả về lỗi 404 nếu không tìm thấy câu đố

    Returns:
        dict: Trả về "message" thông báo lưu lịch sử thành công
    """
    db_user = db.query(User).filter(User.user_id == current_user.get("user_id")).first()
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy người chơi"
        )

    db_puzzle = db.query(Puzzles).filter(Puzzles.puzzle_id == history.puzzle_id).first()
    if not db_puzzle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy câu đố"
        )

    new_elo, elo_changed = calculate_puzzle_elo(
        db_user.puzzle_elo, db_puzzle.rating, history.is_correct
    )

    new_record = UserPuzzleHistory(
        user_id=db_user.user_id,
        puzzle_id=history.puzzle_id,
        is_correct=history.is_correct,
        player_elo=db_user.puzzle_elo,
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    return {"message": "Lưu lịch sử thành công"}
