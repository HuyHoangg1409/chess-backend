import os
import math
import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine
from backend.config import settings

engine = create_engine(settings.DATABASE_URL)

file_path = "backend/data/puzzles.csv"
df = pd.read_csv(file_path, nrows=1000000, on_bad_lines="skip")


def get_difficulty(rating: int):
    if rating < 1200:
        return "Easy"
    elif rating < 1800:
        return "Medium"
    else:
        return "Hard"


df = df.rename(
    columns={
        "PuzzleId": "puzzle_id",
        "FEN": "fen_position",
        "Moves": "correct_moves",
        "Rating": "rating",
    }
)

df["rating"] = df["rating"].astype(int)
df["difficulty"] = df["rating"].apply(get_difficulty)

columns_needed = ["fen_position", "correct_moves", "difficulty", "rating"]
df = df[columns_needed]

total_rows = len(df)

chunk_size = 1000
num_chunks = math.ceil(total_rows / chunk_size)

for i in range(num_chunks):
    start_index = i * chunk_size
    end_index = min(start_index + chunk_size, total_rows)

    chunk_df = df.iloc[start_index:end_index]

    chunk_df.to_sql(
        name="puzzles", con=engine, if_exists="append", index=False, method="multi"
    )

    percent = int((end_index / total_rows) * 100)
    print(f"Loaded: {end_index}/{total_rows} puzzles - {percent}%")

print("Done loading")
