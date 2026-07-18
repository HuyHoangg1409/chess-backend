import sys, os

parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(parent_dir)
csv_path = os.path.join(parent_dir, "data", "puzzles.csv")

import pandas as pd
from backend.database import sessionLocal
from backend.models import Puzzles


def get_difficulty(rating: int):
    if rating < 1200:
        return "Easy"
    elif rating < 1800:
        return "Medium"
    else:
        return "Hard"


def load_puzzles_to_db(file_path):
    df = pd.read_csv(file_path, encoding="utf-8")

    data = df[["FEN", "Moves", "Rating"]].sample(n=200)

    db = sessionLocal()
    try:
        for _, row in data.iterrows():
            exists = db.query(Puzzles).filter(Puzzles.fen_position == row['FEN']).first()
            
            if not exists:
                puzzle = Puzzles(
                    fen_position=row["FEN"],
                    correct_moves=row["Moves"],
                    difficulty=get_difficulty(row["Rating"]),
                )
                db.add(puzzle)
        db.commit()
    except Exception as e:
        print(f"{e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    load_puzzles_to_db(csv_path)
