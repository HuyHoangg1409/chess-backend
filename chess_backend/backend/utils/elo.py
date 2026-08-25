def calculate_puzzle_elo(
    puzzle_elo: int, rating: int, is_correct: bool, k_factor: int = 32
) -> tuple[int, int]:
    """Tính elo mới cho người chơi dựa trên elo của câu đố

    Args:
        puzzle_elo (int): elo của người chơi
        rating (int): elo của câu đố
        is_correct (bool): Kiểm tra người chơi giải đúng hay sai
        k_factor (int): Hệ số biến động, mặc định là 32

    Returns:
        tuple[int, int]: Trả về 1 tuple bao gồm "new_elo" và "elo_change"
    """
    expected_score = 1 / (1 + 10 ** ((rating - puzzle_elo) / 400))
    actual_score = 1.0 if is_correct else 0.0

    elo_change = round(k_factor * (actual_score - expected_score))

    new_elo = max(0, puzzle_elo + elo_change)
    return new_elo, elo_change


def calculate_pvp_elo(
    white_elo: int, black_elo: int, result: str, k_factor=32
) -> tuple[int, int]:
    """Tính elo mới của 2 bên sau khi kết thúc trận đấu.

    Args:
        white_elo (int): elo của bên trắng
        black_elo (int): elo của bên đen
        result (str): Kết quả của trận đấu
        k_factor (int): Hệ số biến động, mặc định là 32

    Returns:
        tuple[int, int]: Trả về 1 tuple bao gồm "delta_white" và "delta_black"
    """
    expected_white = 1 / (1 + 10 ** ((black_elo - white_elo) / 400))
    expected_black = 1 - expected_white

    if result == "white win":
        actual_white, actual_black = 1.0, 0.0
    elif result == "black win":
        actual_white, actual_black = 0.0, 1.0
    else:
        actual_white, actual_black = 0.5, 0.5

    delta_white = round(k_factor * (actual_white - expected_white))
    delta_black = round(k_factor * (actual_black - expected_black))

    return delta_white, delta_black
