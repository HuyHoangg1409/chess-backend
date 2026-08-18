import chess
import chess.polyglot
import time
from .evaluation import evaluation
from .openings import get_opening_move

transposition_table = {}
MAX_TRANSPOSITION_TABLE_SIZE = 50000
TIME_LIMIT = 3.0


def save_to_transposition_table(board_hash, depth, score):
    """Tự động đẩy thế cờ cũ nhất ra nếu cache đầy"""
    if len(transposition_table) >= MAX_TRANSPOSITION_TABLE_SIZE:
        del transposition_table[next(iter(transposition_table))]
    transposition_table[board_hash] = (depth, score)


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
            return 100 * victim.piece_type - attacker.piece_type
        return 100

    if board.gives_check(move):
        return 10

    return 0


def quiescence(board, alpha, beta, is_maximizing, q_depth=0, max_q_depth=3):
    """Tìm kiếm tĩnh tránh bỏ sót việc ăn quân khi duyệt hết độ sâu.

    Args:
        board (chess.Board): Đối tượng bàn cờ hiện tại
        alpha (float): Giá trị alpha để cắt tỉa, ngưỡng tốt nhất bên maximizing
        beta (float): Giá trị beta để cắt tỉa, ngưỡng tốt nhất bên minimizing
        is_maximizing (bool): True nếu đang là lượt trắng, False nếu là lượt đen
        q_depth (int): Độ sâu thêm đang duyệt. Defaults to 0.
        max_q_depth (int): Độ sâu thêm tối đa có thể duyệt. Defaults to 3.

    Returns:
        float: Điểm số đánh giá thế cờ nếu tiếp tục trao đổi quân
    """
    stand_pat = evaluation(board)

    if q_depth >= max_q_depth or board.is_game_over():
        return stand_pat

    if is_maximizing:
        if stand_pat >= beta:
            return beta
        if stand_pat > alpha:
            alpha = stand_pat

        captures = list(board.generate_legal_captures())
        captures.sort(key=lambda m: prefer_move(board, m), reverse=True)

        for move in captures:
            if stand_pat + 900 + 200 < alpha and not move.promotion:
                continue

            board.push(move)
            score = quiescence(board, alpha, beta, False, q_depth + 1, max_q_depth)
            board.pop()

            if score >= beta:
                return beta
            if score > alpha:
                alpha = score
        return alpha
    else:
        if stand_pat <= alpha:
            return alpha
        if stand_pat < beta:
            beta = stand_pat

        captures = list(board.generate_legal_captures())
        captures.sort(key=lambda m: prefer_move(board, m), reverse=True)

        for move in captures:
            if stand_pat - 900 - 200 > beta and not move.promotion:
                continue

            board.push(move)
            score = quiescence(board, alpha, beta, True, q_depth + 1, max_q_depth)
            board.pop()

            if score <= alpha:
                return alpha
            if score < beta:
                beta = score
        return beta


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
    board_hash = chess.polyglot.zobrist_hash(board)
    if board_hash in transposition_table:
        cached_depth, cached_score = transposition_table[board_hash]
        if cached_depth >= depth:
            return cached_score

    if depth == 0:
        return quiescence(board, alpha, beta, is_maximizing)

    moves = list(board.legal_moves)
    if not moves:
        if board.is_check():
            return -20000 - depth if is_maximizing else 20000 + depth
        return 0
    moves.sort(key=lambda m: prefer_move(board, m), reverse=True)

    if is_maximizing:
        max_evaluation = -float("inf")
        for move in moves:
            board.push(move)
            evaluation_score = minimax(board, depth - 1, alpha, beta, False)
            board.pop()
            max_evaluation = max(max_evaluation, evaluation_score)
            alpha = max(alpha, evaluation_score)
            if beta <= alpha:
                break

        save_to_transposition_table(board_hash, depth, max_evaluation)
        return max_evaluation
    else:
        min_evaluation = float("inf")
        for move in moves:
            board.push(move)
            evaluation_score = minimax(board, depth - 1, alpha, beta, True)
            board.pop()
            min_evaluation = min(min_evaluation, evaluation_score)
            beta = min(beta, evaluation_score)
            if beta <= alpha:
                break

        save_to_transposition_table(board_hash, depth, min_evaluation)
        return min_evaluation


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

    opening_moves = get_opening_move(board)
    if opening_moves:
        print("work")
        time.sleep(1.5)
        return opening_moves

    transposition_table.clear()

    start_time = time.perf_counter()
    best_move_overall = list(board.legal_moves)[0]

    for current_depth in range(1, depth + 1):
        moves = list(board.legal_moves)
        moves.sort(
            key=lambda m: (m == best_move_overall, prefer_move(board, m)), reverse=True
        )

        is_maximizing = board.turn == chess.WHITE
        best_move = moves[0]
        alpha = -float("inf")
        beta = float("inf")

        if is_maximizing:
            best_value = -float("inf")
            for move in moves:
                if time.perf_counter() - start_time > TIME_LIMIT:
                    break

                board.push(move)
                value = minimax(board, current_depth - 1, alpha, beta, False)
                board.pop()

                if value > best_value:
                    best_value = value
                    best_move = move

                alpha = max(alpha, best_value)
        else:
            best_value = float("inf")
            for move in moves:
                if time.perf_counter() - start_time > TIME_LIMIT:
                    break

                board.push(move)
                value = minimax(board, current_depth - 1, alpha, beta, True)
                board.pop()

                if value < best_value:
                    best_value = value
                    best_move = move

                beta = min(beta, best_value)

        if time.perf_counter() - start_time <= TIME_LIMIT:
            best_move_overall = best_move
        else:
            break

    return best_move_overall
