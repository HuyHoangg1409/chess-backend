import chess
from .evaluation import evaluation


def get_greedy_move(board: chess.Board) -> chess.Move | None:
    best_move = None

    is_maximizing = board.turn == chess.WHITE
    best_evaluation = -float("inf") if is_maximizing else float("inf")

    for move in board.legal_moves:
        board.push(move)
        evaluation_score = evaluation(board)
        board.pop()

        if is_maximizing:
            if evaluation_score > best_evaluation:
                best_evaluation = evaluation_score
                best_move = move
        else:
            if evaluation_score < best_evaluation:
                best_evaluation = evaluation_score
                best_move = move

    return best_move
