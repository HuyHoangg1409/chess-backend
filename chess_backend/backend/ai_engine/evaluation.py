import chess

PIECE_VALUE = {
    chess.PAWN: 100,
    chess.KNIGHT: 320,
    chess.BISHOP: 330,
    chess.ROOK: 500,
    chess.QUEEN: 900,
    chess.KING: 20000,
}

# Piece-Square Tables
PAWN_TABLE = [
      0,   0,   0,   0,   0,   0,   0,   0,
     50,  50,  50,  50,  50,  50,  50,  50,
     10,  10,  20,  30,  30,  20,  10,  10,
      5,   5,  10,  25,  25,  10,   5,   5,
      0,   0,   0,  20,  20,   0,   0,   0,
      5,  -5, -10,   0,   0, -10,  -5,   5,
      5,  10,  10, -20, -20,  10,  10,   5,
      0,   0,   0,   0,   0,   0,   0,   0
]

KNIGHT_TABLE = [
    -50, -40, -30, -30, -30, -30, -40, -50,
    -40, -20,   0,   0,   0,   0, -20, -40,
    -30,   0,  10,  15,  15,  10,   0, -30,
    -30,   5,  15,  20,  20,  15,   5, -30,
    -30,   0,  15,  20,  20,  15,   0, -30,
    -30,   5,  10,  15,  15,  10,   5, -30,
    -40, -20,   0,   5,   5,   0, -20, -40,
    -50, -40, -30, -30, -30, -30, -40, -50
]

BISHOP_TABLE = [
    -20, -10, -10, -10, -10, -10, -10, -20,
    -10,   0,   0,   0,   0,   0,   0, -10,
    -10,   0,   5,  10,  10,   5,   0, -10,
    -10,   5,   5,  10,  10,   5,   5, -10,
    -10,   0,  10,  10,  10,  10,   0, -10,
    -10,  10,  10,  10,  10,  10,  10, -10,
    -10,   5,   0,   0,   0,   0,   5, -10,
    -20, -10, -10, -10, -10, -10, -10, -20
]

ROOK_TABLE = [
      0,   0,   0,   0,   0,   0,   0,   0,
      5,  10,  10,  10,  10,  10,  10,   5,
     -5,   0,   0,   0,   0,   0,   0,  -5,
     -5,   0,   0,   0,   0,   0,   0,  -5,
     -5,   0,   0,   0,   0,   0,   0,  -5,
     -5,   0,   0,   0,   0,   0,   0,  -5,
     -5,   0,   0,   0,   0,   0,   0,  -5,
      0,   0,   0,   5,   5,   0,   0,   0
]

QUEEN_TABLE = [
    -20, -10, -10,  -5,  -5, -10, -10, -20,
    -10,   0,   0,   0,   0,   0,   0, -10,
    -10,   0,   5,   5,   5,   5,   0, -10,
     -5,   0,   5,   5,   5,   5,   0,  -5,
      0,   0,   5,   5,   5,   5,   0,  -5,
    -10,   5,   5,   5,   5,   5,   0, -10,
    -10,   0,   5,   0,   0,   0,   0, -10,
    -20, -10, -10,  -5,  -5, -10, -10, -20
]

KING_TABLE_MIDDLEGAME = [
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -20, -30, -30, -40, -40, -30, -30, -20,
    -10, -20, -20, -20, -20, -20, -20, -10,
     20,  20,   0,   0,   0,   0,  20,  20,
     20,  30,  10,   0,   0,  10,  30,  20
]

KING_TABLE_ENDGAME = [
    -50, -40, -30, -20, -20, -30, -40, -50,
    -30, -20, -10,   0,   0, -10, -20, -30,
    -30, -10,  20,  30,  30,  20, -10, -30,
    -30, -10,  30,  40,  40,  30, -10, -30,
    -30, -10,  30,  40,  40,  30, -10, -30,
    -30, -10,  20,  30,  30,  20, -10, -30,
    -30, -30,   0,   0,   0,   0, -30, -30,
    -50, -30, -30, -30, -30, -30, -30, -50
]

def isEndgame(board):
    """Kiểm tra thế cờ đã bước vào tàn cuộc chưa.
    Coi là tàn cuộc khi hết hậu hoặc còn hậu và còn không quá 2 quân xe mã tượng.

    Args:
        board (chess.Board): Đối tượng bàn cờ cần đánh giá

    Returns:
        bool: True nếu thế cờ đã tàn cuộc, False nếu chưa
    """
    queens = len(board.pieces(chess.QUEEN, chess.WHITE)) + len(
        board.pieces(chess.QUEEN, chess.BLACK)
    )

    minors = (
        len(board.pieces(chess.ROOK, chess.WHITE))
        + len(board.pieces(chess.ROOK, chess.BLACK))
        + len(board.pieces(chess.KNIGHT, chess.WHITE))
        + len(board.pieces(chess.KNIGHT, chess.BLACK))
        + len(board.pieces(chess.BISHOP, chess.WHITE))
        + len(board.pieces(chess.BISHOP, chess.BLACK))
    )

    return queens == 0 or (queens <= 2 and minors <= 2)


def evaluation(board: chess.Board) -> int:
    """Đánh giá trạng thái hiện tại của thế cờ dựa trên giá trị và vị trí của các quân cờ.

    Args:
        board (chess.Board): Đối tượng bàn cờ cần đánh giá

    Returns:
        int: Điểm tổng cộng của bàn cờ. Điểm dương có lợi cho quân trắng, điểm âm có lợi cho quân đen
    """
    if board.is_checkmate():
        return 20000 if board.turn == chess.WHITE else -20000
    if (
        board.is_stalemate()
        or board.is_insufficient_material()
        or board.can_claim_threefold_repetition()
        or board.can_claim_fifty_moves()
    ):
        return 0

    endgame = isEndgame(board)
    total_score = 0
    for square in chess.SQUARES:
        piece = board.piece_at(square)
        if piece is not None:
            score = PIECE_VALUE[piece.piece_type]

            if piece.piece_type == chess.PAWN:
                table = PAWN_TABLE
            if piece.piece_type == chess.KNIGHT:
                table = KNIGHT_TABLE
            if piece.piece_type == chess.ROOK:
                table = ROOK_TABLE
            if piece.piece_type == chess.BISHOP:
                table = BISHOP_TABLE
            if piece.piece_type == chess.QUEEN:
                table = QUEEN_TABLE
            if piece.piece_type == chess.KING:
                table = KING_TABLE_ENDGAME if endgame else KING_TABLE_MIDDLEGAME

            rank = chess.square_rank(square)
            file = chess.square_file(square)

            pst_index = (
                (7 - rank) * 8 + file if board.turn == chess.WHITE else rank * 8 + file
            )
            pst_value = table[pst_index]

            piece_score = score + pst_value

            if piece.color == chess.WHITE:
                total_score += piece_score
            else:
                total_score -= piece_score
    return total_score
