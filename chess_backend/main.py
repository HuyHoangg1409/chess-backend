from fastapi import FastAPI
from database import engine
import models

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Chess API")

@app.get("/")
def read_root():
    return {"message": "Active models"}