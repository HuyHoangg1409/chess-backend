import chess
from fastapi import WebSocket
from typing import Optional, Dict
from .models import User, GameMatches
from .utils.elo import calculate_pvp_elo


class chessRoom:
    def __init__(self, room_id: str):
        self.room_id = room_id
        self.board = chess.Board()

        self.white_ws: Optional[WebSocket] = None
        self.black_ws: Optional[WebSocket] = None
        self.white_user_id: Optional[int] = None
        self.black_user_id: Optional[int] = None
        self.white_info: Optional[dict] = None
        self.black_info: Optional[dict] = None
        self.white_draw_offered = False
        self.black_draw_offered = False

    async def broadcast(self, message: dict):
        for ws in [self.white_ws, self.black_ws]:
            if ws is not None:
                try:
                    await ws.send_json(message)
                except Exception:
                    pass

    async def handle_game_over(self, db, result: str, pgn_string: str):
        white_user = db.query(User).filter(User.user_id == self.white_user_id).first()
        black_user = db.query(User).filter(User.user_id == self.black_user_id).first()
        if not white_user or not black_user:
            return

        white_elo, black_elo = white_user.pvp_elo, black_user.pvp_elo
        delta_white, delta_black = calculate_pvp_elo(
            white_elo, black_elo, result, k_factor=32
        )

        white_user.pvp_elo += delta_white
        black_user.pvp_elo += delta_black
        
        self.white_info["elo"] = white_user.pvp_elo
        self.black_info["elo"] = black_user.pvp_elo

        winner_username = (
            self.white_info.get("username")
            if result == "white win"
            else self.black_info.get("username")
        )
        new_match_history = GameMatches(
            white_player_id=self.white_user_id,
            black_player_id=self.black_user_id,
            winner_username=winner_username,
            result=result,
            final_fen=self.board.fen(),
            pgn=pgn_string,
            white_elo_change=delta_white,
            black_elo_change=delta_black,
        )

        db.add(new_match_history)
        db.commit()
        db.refresh(new_match_history)
        print(white_user.pvp_elo)
        print(black_user.pvp_elo)

        return white_user.pvp_elo, black_user.pvp_elo, delta_white, delta_black


rooms: Dict[str, chessRoom] = {}
