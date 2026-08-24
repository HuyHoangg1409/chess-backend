from os import access
import chess
import chess.pgn
from sqlalchemy.orm import Session
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends

from ..database import get_db
from ..room_manage import chessRoom, rooms
from ..secure import get_user_from_token
from ..models import User

router = APIRouter(prefix="/ws", tags=["Multiplayer"])


@router.websocket("/{room_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    room_id: str,
    current_user: dict = Depends(get_user_from_token),
    db: Session = Depends(get_db),
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
                    game = chess.pgn.Game.from_board(room.board)
                    pgn_string = str(game)
                    await room.broadcast(
                        {
                            "type": "move",
                            "move": move_uci,
                            "pgn": pgn_string,
                            "turn": (
                                "white" if room.board.turn == chess.WHITE else "black"
                            ),
                        }
                    )

                    if room.board.is_game_over():
                        winner = None
                        reason = "Hòa cờ"
                        if room.board.is_checkmate():
                            winner = player_color
                            reason = f"{db_user.username} thắng!"
                        elif room.board.is_stalemate():
                            reason = "Hòa do hết nước đi"
                        elif room.board.is_insufficient_material():
                            reason = "Hòa do không đủ quân"
                        await room.broadcast(
                            {
                                "type": "game_over",
                                "winner": winner,
                                "reason": reason,
                                "fen": room.board.fen(),
                            }
                        )

            elif data.get("type") == "draw_offer":
                has_offered = (
                    room.white_draw_offered
                    if player_color == "white"
                    else room.black_draw_offered
                )
                if has_offered:
                    await room.broadcast(
                        {
                            "type": "error",
                            "message": "Bạn chỉ được gửi 1 lời mời cầu hòa",
                        }
                    )
                    continue
                if player_color == "white":
                    room.white_draw_offered = True
                else:
                    room.black_draw_offered = True

                opponent_ws = (
                    room.black_ws if player_color == "white" else room.white_ws
                )
                if opponent_ws:
                    await opponent_ws.send_json(
                        {"type": "draw_offered", "from_player": db_user.username}
                    )

            elif data.get("type") == "draw_respond":
                accepted = data.get("accepted", False)
                print(accepted)
                if accepted:
                    await room.broadcast(
                        {
                            "type": "game_over",
                            "winner": None,
                            "reason": "Trận đấu hòa",
                        }
                    )
                else:
                    opponent_ws = (
                        room.black_ws if player_color == "white" else room.white_ws
                    )
                    await opponent_ws.send_json({"type": "draw_declined"})

            elif data.get("type") == "resign":
                winner_color = "black" if player_color == "white" else "white"
                await room.broadcast(
                    {
                        "type": "game_over",
                        "winner": winner_color,
                        "reason": f"{db_user.username} đã đầu hàng!",
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
