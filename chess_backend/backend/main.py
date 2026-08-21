from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import backend.database as database
import backend.models as models

from .routers import ai_game, puzzle_game, auth, multiplayer

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Chess API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router)
app.include_router(puzzle_game.router)
app.include_router(ai_game.router)
app.include_router(multiplayer.router)
