import chess

PIECE_VALUE = {
    chess.PAWN: 100,
    chess.KNIGHT: 320,
    chess.BISHOP: 330,
    chess.ROOK: 500,
    chess.QUEEN: 900,
    chess.KING: 20000,
}


def evaluation(board: chess.Board) -> int:
    if board.is_checkmate():
        return 20000 if board.turn == chess.WHITE else -20000
    if board.is_stalemate() or board.is_insufficient_material():
        return 0

    total_score = 0
    for square in chess.SQUARES:
        piece = board.piece_at(square)
        if piece is not None:
            score = PIECE_VALUE[piece.piece_type]
            if piece.color == chess.WHITE:
                total_score += score
            else:
                total_score -= score
    return total_score
