import chess
from .evaluation import evaluation


def minimax(
    board: chess.Board, depth: int, alpha: float, beta: float, is_maximizing: bool
) -> float:
    if board.is_checkmate():
        return -20000 - depth if board.turn == chess.WHITE else 20000 + depth
    if board.is_game_over():
        return 0
    if depth == 0:
        return evaluation(board)

    if is_maximizing:
        max_evaluation = -float("inf")
        for move in board.legal_moves:
            board.push(move)
            evaluation_score = minimax(board, depth - 1, alpha, beta, False)
            board.pop()
            max_evaluation = max(max_evaluation, evaluation_score)
            alpha = max(alpha, evaluation_score)
            if beta <= alpha:
                break
        return max_evaluation
    else:
        min_evaluation = float("inf")
        for move in board.legal_moves:
            board.push(move)
            evaluation_score = minimax(board, depth - 1, alpha, beta, True)
            board.pop()
            min_evaluation = min(min_evaluation, evaluation_score)
            beta = min(beta, evaluation_score)
            if beta <= alpha:
                break
        return min_evaluation


def get_minimax_move(board: chess.Board, depth: int = 3):
    if not board.legal_moves:
        return None

    is_maximizing = board.turn == chess.WHITE
    best_move = None
    alpha = -float("inf")
    beta = float("inf")

    if is_maximizing:
        best_value = -float("inf")
        for move in board.legal_moves:
            board.push(move)
            value = minimax(board, depth - 1, alpha, beta, False)
            board.pop()

            if value > best_value:
                best_value = value
                best_move = move

            alpha = max(alpha, best_value)
    else:
        best_value = float("inf")
        for move in board.legal_moves:
            board.push(move)
            value = minimax(board, depth - 1, alpha, beta, True)
            board.pop()

            if value < best_value:
                best_value = value
                best_move = move

            beta = min(beta, best_value)

    return best_move
