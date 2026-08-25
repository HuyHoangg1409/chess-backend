import backend.secure
from fastapi import Depends, HTTPException, status
from fastapi.security import APIKeyHeader

from backend.secure import get_user_from_token

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

    user_info = get_user_from_token(token)

    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token hết hạn hoặc không hợp lệ. Đăng nhập lại",
        )

    return user_info