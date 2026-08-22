import chess
from fastapi import WebSocket
from typing import Optional, Dict

class chessRoom:
    def __init__(self, room_id: str):
        self.room_id = room_id
        self.board = chess.Board()

        self.white_ws: Optional[WebSocket] = None
        self.black_ws: Optional[WebSocket] = None
        self.white_info: None
        self.black_info: None

    async def broadcast(self, message: dict):
        for ws in [self.white_ws, self.black_ws]:
            if ws is not None:
                try:
                    await ws.send_json(message)
                except Exception:
                    pass


rooms: Dict[str, chessRoom] = {}