import chess
from .evaluation import evaluation


def minimax(
    board: chess.Board, depth: int, alpha: float, beta: float, is_maximizing: bool
) -> float:
    """Thực hiện thuật toán minimax kết hợp với cắt tỉa alpha-beta để tìm điểm số tối ưu cho trạng thái bàn cờ hiện tại.

    Args:
        board (chess.Board): Đối tượng bàn cờ hiện tại
        depth (int): Độ sâu tìm kiếm còn lại trong cây quyết định
        alpha (float): Giá trị alpha để cắt tỉa, ngưỡng tốt nhất bên maximizing
        beta (float): Giá trị beta để cắt tỉa, ngưỡng tốt nhất bên minimizing
        is_maximizing (bool): True nếu đang là lượt trắng, False nếu là lượt đen

    Returns:
        float: Điểm số đánh giá của trạng thái bàn cờ hiện tại sau khi duyệt độ sâu
    """
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


def prefer_move(board, move):
    """Ưu tiên các nước đi ăn quân lớn hơn, nước đi phong cấp và nước chiếu.

    Args:
        board (chess.Board): Đối tượng bàn cờ hiện tại
        move (move): Nước đi cần đánh giá

    Returns:
        int: Điểm tương ứng với các nước đi
    """
    if move.promotion:
        return 900

    if board.is_capture(move):
        victim = board.piece_at(move.to_square)
        attacker = board.piece_at(move.from_square)
        if victim and attacker:
            return 100*victim.piece_type - attacker.piece_type

    if board.gives_check(move):
        return 50

    return 0


def get_minimax_move(board: chess.Board, depth: int = 3):
    """Tìm và trả về nước đi tốt nhất cho người chơi hiện tại bằng thuật toán minimax.

    Args:
        board (chess.Board): Đối tượng bàn cờ hiện tại
        depth (int): Độ sâu tìm kiếm của cây quyết định. Defaults to 3.

    Returns:
        chess.Move | None: Nước đi tốt nhất được tìm thấy hoặc None
    """
    if not board.legal_moves:
        return None

    moves = list(board.legal_moves)
    moves.sort(key= lambda m: prefer_move(board, m), reverse=True)

    is_maximizing = board.turn == chess.WHITE
    best_move = None
    alpha = -float("inf")
    beta = float("inf")

    if is_maximizing:
        best_value = -float("inf")
        for move in moves:
            board.push(move)
            value = minimax(board, depth - 1, alpha, beta, False)
            board.pop()

            if value > best_value:
                best_value = value
                best_move = move

            alpha = max(alpha, best_value)
    else:
        best_value = float("inf")
        for move in moves:
            board.push(move)
            value = minimax(board, depth - 1, alpha, beta, True)
            board.pop()

            if value < best_value:
                best_value = value
                best_move = move

            beta = min(beta, best_value)

    return best_move
