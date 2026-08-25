import chess
from fastapi import APIRouter, HTTPException, Depends, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..schemas import (
    PuzzleResponse,
    PuzzleResultResponse,
    PuzzleCreate,
    PuzzleSubmit,
    PuzzleHistoryCreate,
    HelpRequest,
)
from ..database import get_db
from ..dependencies import get_current_user
from ..models import Puzzles, User, UserPuzzleHistory
from ..utils.elo import calculate_puzzle_elo

router = APIRouter(prefix="/puzzles", tags=["Puzzle Game"])


@router.post(
    "",
    response_model=PuzzleResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_puzzles(puzzle_data: PuzzleCreate, db: Session = Depends(get_db)):
    """Tạo mới và thêm 1 câu đố vào database.

    Args:
        puzzle_data (PuzzleCreate): Thông tin câu đố bao gồm chuỗi FEN, đáp án đúng và độ khó tương ứng
        db (Session): Phiên kết nối cơ sở dữ liệu

    Raises:
        HTTPException: Trả về lỗi 400 nếu thế cờ đã tồn tại

    Returns:
        dict: Trả về thông tin puzzle được tạo thành công bao gồm "puzzle_id", "fen_position", "correct_moves" và "difficulty"
    """
    existing_puzzles = (
        db.query(Puzzles)
        .filter(Puzzles.fen_position == puzzle_data.fen_position)
        .first()
    )
    if existing_puzzles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Đã tồn tại thế cờ này"
        )

    new_puzzle = Puzzles(
        fen_position=puzzle_data.fen_position,
        correct_moves=puzzle_data.correct_moves,
        difficulty=puzzle_data.difficulty,
    )

    db.add(new_puzzle)
    db.commit()
    db.refresh(new_puzzle)

    return new_puzzle


@router.get(
    "/randomWithDifficulty",
    response_model=PuzzleResponse,
    status_code=status.HTTP_200_OK,
)
def random_puzzles_with_difficulty(
    difficulty: str = Query(
        "Easy", description="Độ khó của thế cờ: Easy, Medium, Hard"
    ),
    db: Session = Depends(get_db),
):
    """Lấy ngẫu nhiên 1 câu đố từ database với độ khó cụ thể.

    Args:
        difficulty (str): Mức độ khó mong muốn của câu đố
        db (Session): Phiên kết nối cơ sở dữ liệu

    Raises:
        HTTPException: Trả về lỗi 404 nếu không tìm thấy thế cờ có mức độ khó tương ứng

    Returns:
        dict: Trả về thông tin puzzle bao gồm "puzzle_id", "fen_position" và "difficulty" ngẫu nhiên với độ khó tương ứng
    """
    puzzle = (
        db.query(Puzzles)
        .filter(Puzzles.difficulty == difficulty)
        .order_by(func.random())
        .first()
    )

    if not puzzle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không có thế cờ có mức độ khó tương ứng",
        )

    return puzzle


@router.get(
    "/randomWithoutDifficulty",
    response_model=PuzzleResponse,
    status_code=status.HTTP_200_OK,
)
def random_puzzles_without_difficulty(db: Session = Depends(get_db)):
    """Lấy ngẫu nhiên 1 câu đố từ database với độ khó ngẫu nhiên.

    Raises:
        HTTPException: Trả về lỗi 404 nếu không tìm thấy thế cờ nào
        db (Session): Phiên kết nối cơ sở dữ liệu

    Returns:
        dict: Trả về thông tin puzzle bao gồm "puzzle_id", "fen_position" và "difficulty" ngẫu nhiên với độ khó ngẫu nhiên
    """
    puzzle = db.query(Puzzles).order_by(func.random()).first()

    if not puzzle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy thế cờ"
        )

    return puzzle


@router.post("/help", status_code=status.HTTP_200_OK)
def get_puzzle_help(
    request: HelpRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Trả về nước đi chính xác theo đáp án hiện tại của người chơi.

    Args:
        request (schemas.HelpRequest): Bao gồm "puzzle_id" và "move_index"
        db (Session): Phiên kết nối cơ sở dữ liệu
        current_user (dict): Thông tin của người dùng hiện tại được giải mã từ JWT

    Raises:
        HTTPException: Trả về lỗi 404 nếu không tìm thấy người chơi trong database
        HTTPException: Trả về lỗi 404 nếu không tìm thấy câu đố trong database

    Returns:
        dict: Trả về dict bao gồm "hint" là nước đi chính xác mà người chơi cần
    """
    db_user = db.query(User).filter(User.user_id == current_user.get("user_id")).first()
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy người chơi"
        )

    db_puzzle = db.query(Puzzles).filter(Puzzles.puzzle_id == request.puzzle_id).first()
    if not db_puzzle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy câu đố"
        )

    correctMovesArray = db_puzzle.correct_moves.strip().split(" ")
    help = correctMovesArray[request.move_index]

    new_elo, elo_change = calculate_puzzle_elo(db_user.puzzle_elo, db_puzzle.rating, False)
    db_user.puzzle_elo -= round(abs(elo_change) / 2)
    print(f"Trừ {round(abs(elo_change) / 2)}")
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return {"hint": help}


@router.post(
    "/check",
    response_model=PuzzleResultResponse,
    status_code=status.HTTP_200_OK,
)
def check_puzzle_answer(
    submission: PuzzleSubmit,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Kiểm tra đáp án của người chơi có chính xác không và cộng trừ elo tương ứng cho đáp án.

    Args:
        submission (PuzzleSubmit): Đáp án của người chơi được gửi đi bao gồm "puzzle_id" và "user_move"
        db (Session): Phiên kết nối cơ sở dữ liệu
        current_user (dict): Thông tin của người dùng hiện tại được giải mã từ JWT

    Raises:
        HTTPException: Trả về lỗi 404 nếu không tìm thấy người chơi
        HTTPException: Trả về lỗi 404 nếu không tìm thấy câu đố

    Returns:
        dict: Trả về kết quả từ database bao gồm "is_correct", "is_completed" và "message"
    """
    print(f"{current_user.get("sub")}, {current_user.get("user_id")}")
    db_user = db.query(User).filter(User.username == current_user.get("sub")).first()
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy người chơi"
        )

    puzzle = db.query(Puzzles).filter(Puzzles.puzzle_id == submission.puzzle_id).first()
    if not puzzle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy câu đố"
        )

    user_list = submission.user_move.strip().lower().split(" ")
    correct_list = puzzle.correct_moves.strip().lower().split(" ")

    if len(user_list) > len(correct_list):
        return PuzzleResultResponse(
            is_correct=False,
            is_completed=False,
            elo_changed=10,
            message="Đi quá nước cần thiết",
        )

    result = True

    for i in range(len(user_list)):
        if user_list[i] != correct_list[i]:
            result = False

    new_elo, elo_change = calculate_puzzle_elo(db_user.puzzle_elo, puzzle.rating, result)
    print(f"{new_elo}, {elo_change}")

    if len(user_list) == len(correct_list) and result:
        db_user.puzzle_elo = new_elo
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        return PuzzleResultResponse(
            is_correct=True,
            is_completed=True,
            elo_changed=elo_change,
            message="Đáp án đúng",
        )
    else:
        if result:
            return PuzzleResultResponse(
                is_correct=True,
                is_completed=False,
                elo_changed=elo_change,
                message="Đáp án đúng",
            )
        else:
            db_user.puzzle_elo = new_elo
            db.add(db_user)
            db.commit()
            db.refresh(db_user)

            return PuzzleResultResponse(
                is_correct=False,
                is_completed=True,
                elo_changed=elo_change,
                message="Đáp án chưa chính xác",
            )


@router.get(
    "/{puzzle_id}",
    response_model=PuzzleResponse,
    status_code=status.HTTP_200_OK,
)
def get_puzzle_by_id(puzzle_id: int, db: Session = Depends(get_db)):
    """Lấy câu đố với id chỉ định từ database.

    Args:
        puzzle_id (int): ID của puzzle cần lấy
        db (Session): Phiên kết nối cơ sở dữ liệu

    Raises:
        HTTPException: Trả về lỗi 404 nếu không tìm thấy câu đố với id tương ứng

    Returns:
        dict: Trả về thông tin của 1 puzzle
    """
    puzzle = db.query(Puzzles).filter(Puzzles.puzzle_id == puzzle_id).first()
    if not puzzle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy câu đố với id này",
        )

    return puzzle


@router.post("/history/add", status_code=status.HTTP_200_OK)
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
