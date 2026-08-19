import backend.secure
from fastapi import Depends, HTTPException, status
from fastapi.security import APIKeyHeader

oauth2_scheme = APIKeyHeader(name="Authorization", auto_error=False)


def get_current_user(token: str = Depends(oauth2_scheme)):
    """Xác thực người dùng dựa trên JWT được gửi kèm trong request header.

    Args:
        token (str): Chuỗi token xác thực lấy được từ header bằng oauth2_scheme

    Raises:
        HTTPException: Trả về lỗi 401 nếu request header gửi đi thiếu token
        HTTPException: Trả về lỗi 401 nếu token đã hết hạn hoặc không hợp lệ

    Returns:
        dict: Trả về thông tin chi tiết của người dùng giải mã được từ token bao gồm "sub" và "user_id"
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Thiếu token"
        )

    if token.lower().startswith("bearer "):
        token = token[7:]

    user_info = secure.get_user_from_token(token)

    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token hết hạn hoặc không hợp lệ. Đăng nhập lại",
        )

    return user_info


def calculate_new_elo(
    user_elo: int, puzzle_elo: int, is_correct: bool, k_factor: int = 32
) -> tuple[int, int]:
    """Tính elo mới cho người chơi dựa trên elo của câu đố

    Args:
        user_elo (int): elo của người chơi
        puzzle_elo (int): elo của câu đố
        is_correct (bool): Kiểm tra người chơi giải đúng hay sai
        k_factor (int): Hệ số biến động, mặc định để là 32

    Returns:
        tuple[int, int]: Trả về 1 tuple bao gồm "new_elo" và "elo_change"
    """
    expected_score = 1 / (1 + 10 ** ((puzzle_elo - user_elo) / 400))
    actual_score = 1.0 if is_correct else 0.0

    elo_change = round(k_factor * (actual_score - expected_score))

    new_elo = max(0, user_elo + elo_change)
    return new_elo, elo_change