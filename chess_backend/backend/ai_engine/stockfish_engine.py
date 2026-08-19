from pathlib import Path
import platform
import chess
import chess.engine

CURRENT_DIR = Path(__file__).resolve().parent
ENGINE_FILENAME = ("stockfish.exe" if platform.system() == "Windows" else "stockfish") 
STOCKFISH_PATH = CURRENT_DIR / "engines" / ENGINE_FILENAME

def get_stockfish_move (board: chess.Board, time_limit: float = 1.5, depth: int = 12):
    """Gửi trạng thái bàn cờ hiện tại đến Stockfish qua giao thức UCI và trả về nước đi tối ưu nhất.

    Args:
        board (chess.Board): Đối tượng bàn cờ hiện tại
        time_limit (float, optional): Thời gian tính toán tối đa theo giây. Defaults to 1.5.
        depth (int, optional): Độ sâu tìm kiếm tối đa của cây nước đi. Defaults to 12.

    Returns:
        chess.Move | None: Nước đi tốt nhất mà Stockfish tính được, hoặc None nếu không tìm thấy engine/lỗi
    """
    if not STOCKFISH_PATH.exists():
        print(f"Không tìm thấy file Stockfish")
        print(STOCKFISH_PATH)
        return None

    try:
        with chess.engine.SimpleEngine.popen_uci(str(STOCKFISH_PATH)) as engine:
            result = engine.play(board, chess.engine.Limit(time=time_limit, depth=depth))
            return result.move
    except Exception as e:
        print(f"{e}")
        return None