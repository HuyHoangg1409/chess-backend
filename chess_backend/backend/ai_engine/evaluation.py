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


def evaluation_pawn(board: chess.Board) -> int:
    """Đánh giá điểm phụ dựa trên vị trí của quân tốt.
    Kiểm tra tốt chồng và tốt lẻ.

    Args:
        board (chess.Board): Đối tượng bàn cờ hiện tại

    Returns:
        int: Điểm đánh giá sau khi xem xét vị trí các quân tốt
    """
    score = 0
    for color in [chess.WHITE, chess.BLACK]:
        mult = 1 if color == chess.WHITE else -1
        pawn_squares = board.pieces(chess.PAWN, color)

        file_counts = [0]*8
        for square in pawn_squares:
            file_counts[chess.square_file(square)] += 1

        for f in range(8):
            if file_counts[f] > 1:
                score -= (file_counts[f] - 1) * 20 * mult

            if file_counts[f] > 0:
                has_left = file_counts[f-1] > 0 if f > 0 else False
                has_right = file_counts[f+1] > 0 if f < 7 else False
                if not has_left and not has_right:
                    score -= 15 * mult

    return score


def evaluation_rooks(board: chess.Board) -> int:
    """Đánh giá điểm phụ dựa trên vị trí của quân xe.
    Kiểm tra xe cột mở và nửa mở, xe nằm ở hàng gần rìa bàn cờ.

    Args:
        board (chess.Board): Đối tượng bàn cờ hiện tại

    Returns:
        int: Điểm đánh giá sau khi xem xét vị trí các quân xe
    """
    score = 0
    all_pawns = board.pieces(chess.PAWN, chess.WHITE) | board.pieces(chess.PAWN, chess.BLACK)

    for color in [chess.WHITE, chess.BLACK]:
        mult = 1 if chess.WHITE else -1
        ally_pawns = board.pieces(chess.PAWN, color)

        for square in board.pieces(chess.ROOK, color):
            file = chess.square_file(square)
            rank = chess.square_rank(square)

            if (color == chess.WHITE and rank == 6) or (color == chess.BLACK and rank == 1):
                score += 25 * mult

            pawns_on_file = [p for p in all_pawns if chess.square_file(p) == file]
            if not pawns_on_file:
                score += 25 * mult
            else:
                ally_file = [p for p in all_pawns if chess.square_file(p) == file]
                if not ally_file:
                    score += 15 * mult

    return score


def evaluate_king(board: chess.Board) -> int:
    """Đánh giá điểm phụ dựa trên vị trí của quân vua.
    Kiểm tra vua đã nằm trong vị trí an toàn hay còn quyền nhập thành không.

    Args:
        board (chess.Board): Đối tượng bàn cờ hiện tại

    Returns:
        int: Điểm đánh giá sau khi xem xét vị trí vua
    """
    if isEndgame(board):
        return 0

    score = 0
    for color in [chess.WHITE, chess.BLACK]:
        mult = 1 if color == chess.WHITE else -1
        king_square = board.king(color)

        if color == chess.WHITE and king_square in [chess.G1, chess.C1]:
            score += 40 * mult
        elif color == chess.BLACK and king_square in [chess.G8, chess.C8]:
            score += 40 * mult

        has_castling = board.has_kingside_castling_rights(color) or board.has_queenside_castling_rights(color)
        if not has_castling and king_square not in [chess.G1, chess.C1, chess.G8, chess.C8]:
            score -= 50 * mult

    return score


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
    white_material = 0
    black_material = 0
    pst_score = 0
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
                white_material += piece_score
                pst_score += piece_score
            else:
                black_material += piece_score
                pst_score -= piece_score

    if len(board.pieces(chess.BISHOP, chess.WHITE)) >= 2:
        pst_score += 35
    if len(board.pieces(chess.BISHOP, chess.BLACK)) >= 2:
        pst_score -= 35

    material_diff = white_material - black_material

    total_major_minor = (
        len(board.pieces(chess.QUEEN, chess.WHITE))
        + len(board.pieces(chess.QUEEN, chess.BLACK))
        + len(board.pieces(chess.ROOK, chess.WHITE))
        + len(board.pieces(chess.ROOK, chess.BLACK))
        + len(board.pieces(chess.BISHOP, chess.WHITE))
        + len(board.pieces(chess.BISHOP, chess.BLACK))
        + len(board.pieces(chess.KNIGHT, chess.WHITE))
        + len(board.pieces(chess.KNIGHT, chess.BLACK))
    )
    pieces_traded = 14 - total_major_minor

    if material_diff > 150:
        material_diff += pieces_traded * 15
    elif material_diff < -150:
        material_diff -= pieces_traded * 15
    return pst_score + material_diff + evaluation_pawn(board) + evaluation_rooks(board) + evaluate_king(board)
