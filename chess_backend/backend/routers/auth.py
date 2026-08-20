from fastapi import APIRouter, HTTPException, Depends, status, Query
from sqlalchemy.orm import Session

from ..schemas import UserResponse, UserCreate
from ..database import get_db
from ..dependencies import get_current_user
from ..models import User
from ..secure import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """Đăng ký tài khoản người dùng mới vào hệ thống.

    Args:
        user_data (UserCreate): Thông tin đăng ký bao gồm username và password
        db (Session): Phiên kết nối cơ sở dữ liệu

    Raises:
        HTTPException: Trả về lỗi 400 nếu tên đăng nhập đã tồn tại trong hệ thống

    Returns:
        dict: Trả về thông tin tài khoản vừa đăng ký tài khoản thành công không bao gồm mật khẩu
    """
    existing_user = (
        db.query(User).filter(User.username == user_data.username).first()
    )
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Tên đăng nhập đã tồn tại"
        )

    hashed_password = hash_password(user_data.password)

    new_user = User(username=user_data.username, password_hash=hashed_password)

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@router.post("/login")
def login(user_data: UserCreate, db: Session = Depends(get_db)):
    """Đăng nhập hệ thống và xác thực thông tin người dùng.

    Args:
        user_data (UserCreate): Thông tin đăng nhập của người dùng
        db (Session): Phiên kết nối cơ sở dữ liệu

    Raises:
        HTTPException: Trả về lỗi 400 nếu không tồn tại tài khoản
        HTTPException: Trả về lỗi 400 nếu mật khẩu sai

    Returns:
        dict: Trả về Access Token và bearer nếu đăng nhập thành công
    """
    user = (
        db.query(User).filter(User.username == user_data.username).first()
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Không tồn tại tài khoản"
        )

    if not verify_password(user_data.password, user.password_hash):  # type: ignore
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Mật khẩu sai"
        )

    access_token = create_access_token(
        data={"sub": user.username, "user_id": user.user_id}
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me")
def get_my_information(
    current_user=Depends(get_current_user), db: Session = Depends(get_db)
):
    """Lấy thông tin của người chơi dùng đang đăng nhập hiện tại dựa vào token.

    Args:
        current_user (dict): Thông tin của user giải mã từ token bằng hàm get_current_user
        db (Session): Phiên kết nối cơ sở dữ liệu

    Raises:
        HTTPException: Trả về lỗi 404 nếu không tìm thấy người chơi trong database

    Returns:
        dict: Trả về "user_id", "username" và "elo_rating" của người chơi hiện tại
    """
    user_id = current_user.get("user_id")

    db_user = db.query(User).filter(user_id == User.user_id).first()
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy người chơi"
        )

    return {
        "user_id": db_user.user_id,
        "username": db_user.username,
        "elo_rating": db_user.elo_rating,
    }