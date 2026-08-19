from fastapi import FastAPI, status, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from fastapi.security import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
import chess
import backend.secure as secure
import backend.database as database
import backend.models as models
import backend.schemas as schemas
from backend.ai_engine.greedy import get_greedy_move
from backend.ai_engine.minimax import get_minimax_move
from backend.ai_engine.stockfish_engine import get_stockfish_move

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Chess API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = APIKeyHeader(name="Authorization", auto_error=False)


def get_current_user(token: str = Depends(oauth2_scheme)):
    """Xác thực người dùng dựa trên JWT được gửi kèm trong request header.

    Args:
        token (str): Chuỗi token xác thực lấy được từ header bằng oauth2_scheme

    Raises:
        HTTPException: Trả về lỗi 401 nếu request header gửi đi thiếu token
        HTTPException: Trả về lỗi 401 nếu token đã hết hạn hoặc không hợp lệ

    Returns:
        dict: Trả về thông tin chi tiết của người dùng giải mã được từ token bao gồm "sub" và "user_id"
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Thiếu token"
        )

    if token.lower().startswith("bearer "):
        token = token[7:]

    user_info = secure.get_user_from_token(token)

    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token hết hạn hoặc không hợp lệ. Đăng nhập lại",
        )

    return user_info


def calculate_new_elo(
    user_elo: int, puzzle_elo: int, is_correct: bool, k_factor: int = 32
) -> tuple[int, int]:
    """Tính elo mới cho người chơi dựa trên elo của câu đố

    Args:
        user_elo (int): elo của người chơi
        puzzle_elo (int): elo của câu đố
        is_correct (bool): Kiểm tra người chơi giải đúng hay sai
        k_factor (int): Hệ số biến động, mặc định để là 32

    Returns:
        tuple[int, int]: Trả về 1 tuple bao gồm "new_elo" và "elo_change"
    """
    expected_score = 1 / (1 + 10 ** ((puzzle_elo - user_elo) / 400))
    actual_score = 1.0 if is_correct else 0.0

    elo_change = round(k_factor * (actual_score - expected_score))

    new_elo = max(0, user_elo + elo_change)
    return new_elo, elo_change


@app.post(
    "/register",
    response_model=schemas.UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_user(
    user_data: schemas.UserCreate, db: Session = Depends(database.get_db)
):
    """Đăng ký tài khoản người dùng mới vào hệ thống.

    Args:
        user_data (schemas.UserCreate): Thông tin đăng ký bao gồm username và password
        db (Session): Phiên kết nối cơ sở dữ liệu

    Raises:
        HTTPException: Trả về lỗi 400 nếu tên đăng nhập đã tồn tại trong hệ thống

    Returns:
        dict: Trả về thông tin tài khoản vừa đăng ký tài khoản thành công không bao gồm mật khẩu
    """
    existing_user = (
        db.query(models.User).filter(models.User.username == user_data.username).first()
    )
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Tên đăng nhập đã tồn tại"
        )

    hashed_password = secure.hash_password(user_data.password)

    new_user = models.User(username=user_data.username, password_hash=hashed_password)

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@app.post("/login")
def login(user_data: schemas.UserCreate, db: Session = Depends(database.get_db)):
    """Đăng nhập hệ thống và xác thực thông tin người dùng.

    Args:
        user_data (schemas.UserCreate): Thông tin đăng nhập của người dùng
        db (Session): Phiên kết nối cơ sở dữ liệu

    Raises:
        HTTPException: Trả về lỗi 400 nếu không tồn tại tài khoản
        HTTPException: Trả về lỗi 400 nếu mật khẩu sai

    Returns:
        dict: Trả về Access Token và bearer nếu đăng nhập thành công
    """
    user = (
        db.query(models.User).filter(models.User.username == user_data.username).first()
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Không tồn tại tài khoản"
        )

    if not secure.verify_password(user_data.password, user.password_hash):  # type: ignore
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Mật khẩu sai"
        )

    access_token = secure.create_access_token(
        data={"sub": user.username, "user_id": user.user_id}
    )

    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/auth/me")
def get_my_information(
    current_user=Depends(get_current_user), db: Session = Depends(database.get_db)
):
    """Lấy thông tin của người chơi dùng đang đăng nhập hiện tại dựa vào token.

    Args:
        current_user (dict): Thông tin của user giải mã từ token bằng hàm get_current_user
        db (Session): Phiên kết nối cơ sở dữ liệu

    Raises:
        HTTPException: Trả về lỗi 404 nếu không tìm thấy người chơi trong database

    Returns:
        dict: Trả về "user_id", "username" và "elo_rating" của người chơi hiện tại
    """
    user_id = current_user.get("user_id")

    db_user = db.query(models.User).filter(user_id == models.User.user_id).first()
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy người chơi"
        )

    return {
        "user_id": db_user.user_id,
        "username": db_user.username,
        "elo_rating": db_user.elo_rating,
    }


@app.post(
    "/puzzles",
    response_model=schemas.PuzzleResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_puzzles(
    puzzle_data: schemas.PuzzleCreate, db: Session = Depends(database.get_db)
):
    """Tạo mới và thêm 1 câu đố vào database.

    Args:
        puzzle_data (schemas.PuzzleCreate): Thông tin câu đố bao gồm chuỗi FEN, đáp án đúng và độ khó tương ứng
        db (Session): Phiên kết nối cơ sở dữ liệu

    Raises:
        HTTPException: Trả về lỗi 400 nếu thế cờ đã tồn tại

    Returns:
        dict: Trả về thông tin puzzle được tạo thành công bao gồm "puzzle_id", "fen_position", "correct_moves" và "difficulty"
    """
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
    "/puzzles/randomWithDifficulty",
    response_model=schemas.PuzzleResponse,
    status_code=status.HTTP_200_OK,
)
def random_puzzles_with_difficulty(
    difficulty: str = Query(
        "Easy", description="Độ khó của thế cờ: Easy, Medium, Hard"
    ),
    db: Session = Depends(database.get_db),
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


@app.get(
    "/puzzles/randomWithoutDifficulty",
    response_model=schemas.PuzzleResponse,
    status_code=status.HTTP_200_OK,
)
def random_puzzles_without_difficulty(db: Session = Depends(database.get_db)):
    """Lấy ngẫu nhiên 1 câu đố từ database với độ khó ngẫu nhiên.

    Raises:
        HTTPException: Trả về lỗi 404 nếu không tìm thấy thế cờ nào
        db (Session): Phiên kết nối cơ sở dữ liệu

    Returns:
        dict: Trả về thông tin puzzle bao gồm "puzzle_id", "fen_position" và "difficulty" ngẫu nhiên với độ khó ngẫu nhiên
    """
    puzzle = db.query(models.Puzzles).order_by(func.random()).first()

    if not puzzle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy thế cờ"
        )

    return puzzle


@app.post("/puzzles/help", status_code=status.HTTP_200_OK)
def get_puzzle_help(
    request: schemas.HelpRequest,
    db: Session = Depends(database.get_db),
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
    db_user = (
        db.query(models.User)
        .filter(models.User.user_id == current_user.get("user_id"))
        .first()
    )
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy người chơi"
        )

    db_puzzle = (
        db.query(models.Puzzles)
        .filter(models.Puzzles.puzzle_id == request.puzzle_id)
        .first()
    )
    if not db_puzzle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy câu đố"
        )

    correctMovesArray = db_puzzle.correct_moves.strip().split(" ")
    help = correctMovesArray[request.move_index]

    new_elo, elo_change = calculate_new_elo(db_user.elo_rating, db_puzzle.rating, False)
    db_user.elo_rating -= round(abs(elo_change) / 2)
    print(f"Trừ {round(abs(elo_change) / 2)}")
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return {"hint": help}


@app.post(
    "/puzzles/check",
    response_model=schemas.PuzzleResultResponse,
    status_code=status.HTTP_200_OK,
)
def check_puzzle_answer(
    submission: schemas.PuzzleSubmit,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(get_current_user),
):
    """Kiểm tra đáp án của người chơi có chính xác không và cộng trừ elo tương ứng cho đáp án.

    Args:
        submission (schemas.PuzzleSubmit): Đáp án của người chơi được gửi đi bao gồm "puzzle_id" và "user_move"
        db (Session): Phiên kết nối cơ sở dữ liệu
        current_user (dict): Thông tin của người dùng hiện tại được giải mã từ JWT

    Raises:
        HTTPException: Trả về lỗi 404 nếu không tìm thấy người chơi
        HTTPException: Trả về lỗi 404 nếu không tìm thấy câu đố

    Returns:
        dict: Trả về kết quả từ database bao gồm "is_correct", "is_completed" và "message"
    """
    print(f"{current_user.get("sub")}, {current_user.get("user_id")}")
    db_user = (
        db.query(models.User)
        .filter(models.User.username == current_user.get("sub"))
        .first()
    )
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy người chơi"
        )

    puzzle = (
        db.query(models.Puzzles)
        .filter(models.Puzzles.puzzle_id == submission.puzzle_id)
        .first()
    )
    if not puzzle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy câu đố"
        )

    user_list = submission.user_move.strip().lower().split(" ")
    correct_list = puzzle.correct_moves.strip().lower().split(" ")

    if len(user_list) > len(correct_list):
        return schemas.PuzzleResultResponse(
            is_correct=False,
            is_completed=False,
            elo_changed=10,
            message="Đi quá nước cần thiết",
        )

    result = True

    for i in range(len(user_list)):
        if user_list[i] != correct_list[i]:
            result = False

    new_elo, elo_change = calculate_new_elo(db_user.elo_rating, puzzle.rating, result)
    print(f"{new_elo}, {elo_change}")

    if len(user_list) == len(correct_list) and result:
        db_user.elo_rating = new_elo
        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        return schemas.PuzzleResultResponse(
            is_correct=True,
            is_completed=True,
            elo_changed=elo_change,
            message="Đáp án đúng",
        )
    else:
        if result:
            return schemas.PuzzleResultResponse(
                is_correct=True,
                is_completed=False,
                elo_changed=elo_change,
                message="Đáp án đúng",
            )
        else:
            db_user.elo_rating = new_elo
            db.add(db_user)
            db.commit()
            db.refresh(db_user)

            return schemas.PuzzleResultResponse(
                is_correct=False,
                is_completed=True,
                elo_changed=elo_change,
                message="Đáp án chưa chính xác",
            )


@app.get(
    "/puzzles/{puzzle_id}",
    response_model=schemas.PuzzleResponse,
    status_code=status.HTTP_200_OK,
)
def get_puzzle_by_id(puzzle_id: int, db: Session = Depends(database.get_db)):
    """Lấy câu đố với id chỉ định từ database.

    Args:
        puzzle_id (int): ID của puzzle cần lấy
        db (Session): Phiên kết nối cơ sở dữ liệu

    Raises:
        HTTPException: Trả về lỗi 404 nếu không tìm thấy câu đố với id tương ứng

    Returns:
        dict: Trả về thông tin của 1 puzzle
    """
    puzzle = (
        db.query(models.Puzzles).filter(models.Puzzles.puzzle_id == puzzle_id).first()
    )
    if not puzzle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Không tìm thấy câu đố với id này",
        )

    return puzzle


@app.post("/history/add", status_code=status.HTTP_200_OK)
def add_puzzle_history(
    history: schemas.PuzzleHistoryCreate,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(get_current_user),
):
    """Thêm lịch sử giải đố của người chơi vào database.

    Args:
        history (schemas.PuzzleHistoryCreate): Bao gồm "puzzle_id" và "is_correct"
        db (Session): Phiên kết nối cơ sở dữ liệu
        current_user (dict): Thông tin của người dùng hiện tại được giải mã từ JWT

    Raises:
        HTTPException: Trả về lỗi 404 nếu không tìm thấy người chơi
        HTTPException: Trả về lỗi 404 nếu không tìm thấy câu đố

    Returns:
        dict: Trả về "message" thông báo lưu lịch sử thành công
    """
    db_user = (
        db.query(models.User)
        .filter(models.User.user_id == current_user.get("user_id"))
        .first()
    )
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy người chơi"
        )

    db_puzzle = (
        db.query(models.Puzzles)
        .filter(models.Puzzles.puzzle_id == history.puzzle_id)
        .first()
    )
    if not db_puzzle:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy câu đố"
        )

    new_elo, elo_changed = calculate_new_elo(
        db_user.elo_rating, db_puzzle.rating, history.is_correct
    )

    new_record = models.UserPuzzleHistory(
        user_id=db_user.user_id,
        puzzle_id=history.puzzle_id,
        is_correct=history.is_correct,
        player_elo=db_user.elo_rating,
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    return {"message": "Lưu lịch sử thành công"}


@app.post("/ai/move", status_code=status.HTTP_200_OK)
def get_ai_move(
    gameState: schemas.GameState, db: Session = Depends(database.get_db)
):
    """Lấy nước đi tốt nhất bot có thể đi với thuật toán có độ sâu tương ứng với độ khó.

    Args:
        gameState (schemas.GameState): Bao gồm "fen" và "difficult"
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
