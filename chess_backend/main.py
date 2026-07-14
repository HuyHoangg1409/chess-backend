from fastapi import FastAPI, status, Depends, HTTPException
from sqlalchemy.orm import Session
import database
import models
import schemas

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Chess API")


@app.post(
    "/register",
    response_model=schemas.UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_user(
    user_data: schemas.UserCreate, db: Session = Depends(database.get_db)
):
    existing_user = (
        db.query(models.User).filter(models.User.username == user_data.username).first()
    )
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Tên đăng nhập đã tồn tại"
        )
    
    hashed_password = user_data.password + "_hash"

    new_user = models.User(
        username = user_data.username,
        password_hash = hashed_password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user
