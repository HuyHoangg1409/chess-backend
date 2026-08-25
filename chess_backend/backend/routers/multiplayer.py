from os import access
import chess
import chess.pgn
from sqlalchemy.orm import Session
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends

from ..database import get_db
from ..room_manage import chessRoom, rooms
from ..secure import get_user_from_token
from ..models import User
from ..utils.elo import calculate_pvp_elo

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
        room.white_info = {"username": db_user.username, "elo": db_user.pvp_elo}
        room.white_user_id = db_user.user_id
        player_color = "white"
    elif room.black_ws is None:
        room.black_ws = websocket
        room.black_info = {"username": db_user.username, "elo": db_user.pvp_elo}
        room.black_user_id = db_user.user_id
        player_color = "black"
    else:
        await websocket.send_json({"type": "error", "message": "Phòng đã đủ 2 người"})
        await websocket.close()
        return

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
            player_color = "white" if room.white_ws == websocket else "black"
            opponent_ws = room.black_ws if player_color == "white" else room.white_ws
            # game = chess.pgn.Game.from_board(room.board)
            # pgn_string = str(game)

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
                        result = "draw"
                        if room.board.is_checkmate():
                            winner = player_color
                            reason = f"{db_user.username} thắng!"
                            result = f"{winner} win"
                        elif room.board.is_stalemate():
                            reason = "Hòa do hết nước đi"
                        elif room.board.is_insufficient_material():
                            reason = "Hòa do không đủ quân"
                        white_elo, black_elo, delta_w, delta_b = (
                            await room.handle_game_over(db, result, pgn_string)
                        )
                        await room.broadcast(
                            {
                                "type": "game_over",
                                "winner": winner,
                                "reason": reason,
                                "fen": room.board.fen(),
                                "white_elo": white_elo,
                                "black_elo": black_elo,
                                "white_elo_change": delta_w,
                                "black_elo_change": delta_b,
                            }
                        )

            elif data.get("type") == "draw_offer":
                has_offered = (
                    room.white_draw_offered
                    if player_color == "white"
                    else room.black_draw_offered
                )
                if has_offered:
                    await websocket.send_json(
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

                if opponent_ws:
                    await opponent_ws.send_json(
                        {"type": "draw_offered", "from_player": db_user.username}
                    )

            elif data.get("type") == "draw_respond":
                accepted = data.get("accepted", False)
                if accepted:
                    game = chess.pgn.Game.from_board(room.board)
                    pgn_string = str(game)
                    white_elo, black_elo, delta_w, delta_b = (
                        await room.handle_game_over(db, "draw", pgn_string)
                    )
                    await room.broadcast(
                        {
                            "type": "game_over",
                            "winner": None,
                            "reason": "Trận đấu hòa",
                            "white_elo": white_elo,
                            "black_elo": black_elo,
                            "white_elo_change": delta_w,
                            "black_elo_change": delta_b,
                        }
                    )
                else:
                    await opponent_ws.send_json({"type": "draw_declined"})

            elif data.get("type") == "play_again_offer":
                await opponent_ws.send_json(
                    {
                        "type": "play_again_offered",
                        "from_player": db_user.username,
                    }
                )

            elif data.get("type") == "play_again_respond":
                accepted = data.get("accepted", False)
                if accepted:
                    room.white_ws, room.black_ws = room.black_ws, room.white_ws
                    room.white_info, room.black_info = room.black_info, room.white_info
                    room.white_user_id, room.black_user_id = room.black_user_id, room.white_user_id
                    room.white_draw_offered = False
                    room.black_draw_offered = False
                    room.board = chess.Board()
                    await room.broadcast(
                        {
                            "type": "start",
                            "fen": room.board.fen(),
                            "turn": "white",
                            "white_player": room.white_info,
                            "black_player": room.black_info,
                        }
                    )
                else:
                    await opponent_ws.send_json({"type": "play_again_declined"}),

            elif data.get("type") == "resign":
                game = chess.pgn.Game.from_board(room.board)
                pgn_string = str(game)
                winner_color = "black" if player_color == "white" else "white"
                white_elo, black_elo, delta_w, delta_b = await room.handle_game_over(
                    db, f"{winner_color} win", pgn_string
                )
                await room.broadcast(
                    {
                        "type": "game_over",
                        "winner": winner_color,
                        "reason": f"{db_user.username} đã đầu hàng!",
                        "white_elo": white_elo,
                        "black_elo": black_elo,
                        "white_elo_change": delta_w,
                        "black_elo_change": delta_b,
                    }
                )

    except WebSocketDisconnect:
        leaving_color = "white" if room.white_ws == websocket else "black"
        if room.white_ws == websocket:
            room.white_ws = None
            room.white_info = None
        elif room.black_ws == websocket:
            room.black_ws = None
            room.black_info = None

        await room.broadcast(
            {"type": "player_left", "message": f"Bên {leaving_color} đã rời khỏi phòng"}
        )

        if room.white_ws is None and room.black_ws is None:
            rooms.pop(room_id, None)
