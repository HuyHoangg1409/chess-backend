import chess
from sqlalchemy.orm import Session
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends

from ..database import get_db
from ..room_manage import chessRoom, rooms
from ..secure import get_user_from_token
from ..models import User

router = APIRouter(prefix="/ws", tags=["Multiplayer"])


@router.websocket("/{room_id}")
async def websocket_endpoint(
    websocket: WebSocket, room_id: str, current_user: dict = Depends(get_user_from_token), db: Session = Depends(get_db)
):
    await websocket.accept()
    
    db_user = db.query(User).filter(User.user_id == current_user.get("user_id")).first()

    if room_id not in rooms:
        rooms[room_id] = chessRoom(room_id)
    room = rooms[room_id]

    player_color = None
    if room.white_ws is None:
        room.white_ws = websocket
        room.white_info = {"username": db_user.username, "elo": db_user.elo_rating}
        player_color = "white"
    elif room.black_ws is None:
        room.black_ws = websocket
        room.black_info = {"username": db_user.username, "elo": db_user.elo_rating}
        player_color = "black"
    else:
        await websocket.send_json({"type": "error", "message": "Phòng đã đủ 2 người"})

    await websocket.send_json(
        {
            "type": "init",
            "color": player_color,
            "fen": room.board.fen(),
            "room_id": room_id,
        }
    )

    if room.white_ws and room.black_ws:
        await room.broadcast(
            {
                "type": "start", 
                "fen": room.board.fen(), 
                "turn": "white",
                "white_player": room.white_info,
                "black_player": room.black_info,
            }
        )

    try:
        while True:
            data = await websocket.receive_json()

            if data.get("type") == "move":
                move_uci = data.get("move")
                try:
                    move = chess.Move.from_uci(move_uci)
                except ValueError:
                    continue

                current_turn = "white" if room.board.turn == chess.WHITE else "black"
                if player_color == current_turn and move in room.board.legal_moves:
                    room.board.push(move)
                    is_over = room.board.is_game_over()
                    game_result = room.board.result() if is_over else None

                    await room.broadcast(
                        {
                            "type": "move",
                            "move": move_uci,
                            "fen": room.board.fen(),
                            "turn": (
                                "white" if room.board.turn == chess.WHITE else "black"
                            ),
                            "is_captured": room.board.is_capture(move),
                            "is_over": is_over,
                            "result": game_result,
                        }
                    )
    except WebSocketDisconnect:
        if player_color == "white":
            room.white_ws = None
        else:
            room.black_ws = None

        await room.broadcast(
            {"type": "player-left", "message": f"Bên {player_color} đã rời khỏi phòng"}
        )

        if room.white_ws is None and room.black_ws is None:
            rooms.pop(room_id, None)
