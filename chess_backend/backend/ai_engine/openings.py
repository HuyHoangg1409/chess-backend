import os
import chess
import chess.polyglot

BOOK_PATH = os.path.join(os.path.dirname(__file__), "books", "gm2001.bin")


def get_opening_move(board):
    """Tra cứu khai cuộc trong sách.

    Args:
        board (chess.Board): Đối tượng bàn cờ hiện tại

    Returns:
        chess.move | None: Trả về nước đi chuẩn uci hoặc None nếu hết sách
    """
    if not os.path.exists(BOOK_PATH):
        print("ERO")
        print(BOOK_PATH)
        return None

    try:
        with chess.polyglot.open_reader(BOOK_PATH) as reader:
            entry = reader.weighted_choice(board)
            return entry.move
    except (IndexError, Exception):
        return None
