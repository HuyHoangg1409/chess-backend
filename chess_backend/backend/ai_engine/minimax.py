import chess
from .evaluation import evaluation


def minimax(board: chess.Board, depth: int, is_maximizing: bool) -> float:
    if depth == 0 or board.is_game_over():
        return evaluation(board)

    if is_maximizing:
        max_evaluation = -float("inf")
        for move in board.legal_moves:
            board.push(move)
            evaluation_score = minimax(board, depth - 1, False)
            board.pop()
            max_evaluation = max(max_evaluation, evaluation_score)
        return max_evaluation
    else:
        min_evaluation = float("inf")
        for move in board.legal_moves:
            board.push(move)
            evaluation_score = minimax(board, depth - 1, True)
            board.pop()
            min_evaluation = min(min_evaluation, evaluation_score)
        return min_evaluation


def get_minimax_move(board: chess.Board, depth: int = 3):
    if not board.legal_moves:
        return None

    is_maximizing = board.turn == chess.WHITE
    best_move = None

    if is_maximizing:
        best_value = -float("inf")
        for move in board.legal_moves:
            board.push(move)
            value = minimax(board, depth - 1, False)
            board.pop()

            if value > best_value:
                best_value = value
                best_move = move
    else:
        best_value = float("inf")
        for move in board.legal_moves:
            board.push(move)
            value = minimax(board, depth - 1, True)
            board.pop()

            if value < best_value:
                best_value = value
                best_move = move

    return best_move
