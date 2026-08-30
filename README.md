# Chess

Web cờ vua trực tuyến , cho phép người chơi đấu real-time, đấu với AI, giải puzzle cờ vua để rèn luyện tư duy cùng hệ thống Elo riêng cho từng chế độ.

## Mục lục

- [Tính năng](#tính-năng)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Cài đặt](#cài-đặt)
  - [1. Clone dự án](#1-Clone-dự-án)
  - [2. Cài đặt Backend](#2-cài-đặt-backend)
  - [3. Cài đặt Frontend](#3-cài-đặt-frontend)
- [Biến môi trường](#biến-môi-trường)
- [Chạy ứng dụng](#chạy-ứng-dụng)
- [Triển khai (Deployment)](#triển-khai-deployment)
- [Tổng quan API](#tổng-quan-api)
- [Hệ thống Elo](#hệ-thống-elo)

## Tính năng

- **Xác thực người dùng**: Đăng ký / đăng nhập bằng JWT, mật khẩu được mã hoá với bcrypt.
- **Đấu với AI (Bot)**: 4 mức độ khó, sử dụng thuật toán Greedy, Minimax (alpha-beta, độ sâu 4-5) và tích hợp engine **Stockfish** cho mức khó nhất.
- **Đấu real-time (PvP)**: Kết nối hai người chơi qua **WebSocket**, đồng bộ nước đi theo thời gian thực.
- **Giải đố**: Ngân hàng câu đố cờ vua với 3 mức độ (Easy / Medium / Hard) có gợi ý (hint) và chấm điểm tự động.
- **Hệ thống Elo**: Elo riêng cho chế độ Puzzle (`puzzle_elo`) và PvP (`pvp_elo`) được tính theo công thức Elo chuẩn.
- **Lịch sử đấu**: Lưu lại tối đa 30 trận gần nhất kèm PGN, FEN cuối trận, kết quả và biến động Elo; xem lại chi tiết từng ván.
- **Trải nghiệm giao diện**: Bàn cờ tương tác kéo-thả, hiệu ứng âm thanh cho từng loại nước đi (ăn quân, nhập thành, chiếu tướng...).

## Công nghệ sử dụng

### Backend
- **FastAPI:** Web framework.
- **PostgreSQL & SQLAlchemy:** Cơ sở dữ liệu và quản lý dữ liệu.
- **python-chess:** Xử lý luật cờ vua, FEN và PGN.
- **WebSocket:** Giao tiếp thời gian thực cho chế độ chơi 2 người.

### Frontend
- **React & Vite:** Thư viện và công cụ xây dựng giao diện.
- **Tailwind CSS:** Thiết kế giao diện.
- **chess.js & react-chessboard:** Xử lý logic và hiển thị bàn cờ phía người dùng.

## Cấu trúc thư mục

```
backend/
  ai_engine/           # Các thuật toán AI: greedy, minimax, stockfish, opening book
  routers/              # Các API route: auth, ai_game, puzzle_game, multiplayer, matches
  scripts/               # Script tiện ích (nạp dữ liệu puzzle vào database)
  utils/                  # Hàm tiện ích (tính Elo)
  models.py            # Định nghĩa database (SQLAlchemy)
  schemas.py           # Pydantic schemas cho request/response
  main.py               # Entry point FastAPI
  config.py             # Đọc biến môi trường (.env)
  database.py         # Khởi tạo kết nối database
  secure.py             # Hash password, tạo/giải mã JWT
  room_manage.py    # Quản lý phòng đấu PvP qua WebSocket

frontend/
  src/
    components/       # Các component dùng chung (Header, Sidebar, Login, ChessBoard...)
    features/            # Các chế độ chơi: playWithBots, playWithPeople, puzzle
    hooks/                # Custom hooks (useChessTimer)
    services/            # Gọi API tới backend (api.js)
    utils/                 # Hàm hỗ trợ xử lý cờ & âm thanh
  public/                # Ảnh quân cờ, icon, âm thanh
```

## Yêu cầu hệ thống

- Python **3.11+**
- Node.js **18+** và npm
- PostgreSQL (database đang chạy sẵn)
- (Tuỳ chọn) File thực thi [Stockfish](https://drive.google.com/drive/folders/1UimHWgVv3AFxB6PoZJnJluvl3tMopqIi?usp=sharing) — cần thiết nếu muốn dùng mức độ AI cao nhất

## Cài đặt

### 1. Clone dự án

```bash
git clone https://github.com/HuyHoangg1409/chess-backend.git
cd chess-backend
```

### 2. Cài đặt Backend

```bash
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

pip install -r backend/requirements.txt
```

Tạo file `.env` trong thư mục `chess_backend/` (xem chi tiết ở phần [Biến môi trường](#biến-môi-trường)).

**Nạp dữ liệu puzzle (tuỳ chọn):**
Đặt file [puzzles.csv](https://drive.google.com/drive/folders/1wqQReilWozmCT5cG2gIchtTNtQ_XG33_?usp=sharing) vào `backend/data/puzzles.csv`, sau đó chạy:

```bash
python -m backend.scripts.load_puzzle
```

**Cài đặt Stockfish (tuỳ chọn, cho mức AI cao nhất):**
Tải Stockfish tương ứng hệ điều hành và đặt file thực thi tại:

```
backend/ai_engine/engines/stockfish       # Linux/macOS
backend/ai_engine/engines/stockfish.exe   # Windows
```

### 3. Cài đặt Frontend

```bash
cd frontend
npm install
```

```
VITE_API_BASE_URL=http://localhost:8000
```

## Biến môi trường

> ⚠️ File `.env` chứa thông tin nhạy cảm (mật khẩu DB, secret key...). Bên dưới chỉ là mẫu (template) để bạn tự điền giá trị của mình.

File `backend/.env`:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<database>
SECRET_KEY=<chuỗi-bí-mật-ngẫu-nhiên>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

## Chạy ứng dụng

**Backend** (chạy tại `http://localhost:8000`, tài liệu API tự sinh tại `/docs`):

```bash
uvicorn backend.main:app --reload
```

**Frontend** (chạy tại `http://localhost:5173`):

```bash
cd frontend
npm run dev
```

## Tổng quan API

| Nhóm | Endpoint | Mô tả |
|---|---|---|
| Auth | `POST /auth/register` | Đăng ký tài khoản mới |
| Auth | `POST /auth/login` | Đăng nhập, trả về JWT |
| Auth | `GET /auth/me` | Lấy thông tin người dùng hiện tại |
| AI Game | `POST /ai/move` | Lấy nước đi của bot theo độ khó (1-4) |
| Puzzle | `GET /puzzles/randomWithDifficulty` | Lấy puzzle ngẫu nhiên theo độ khó |
| Puzzle | `GET /puzzles/randomWithoutDifficulty` | Lấy puzzle ngẫu nhiên |
| Puzzle | `POST /puzzles/check` | Kiểm tra đáp án & cập nhật Elo |
| Puzzle | `POST /puzzles/help` | Lấy gợi ý nước đi (trừ Elo) |
| Multiplayer | `WS /ws/{room_id}` | Kết nối WebSocket cho phòng đấu PvP |
| Matches | `GET /matches/my-history` | Lịch sử 30 trận gần nhất |
| Matches | `GET /matches/{match_id}` | Chi tiết một ván đấu |

> Xem đầy đủ và thử trực tiếp các API tại Swagger UI: `http://localhost:8000/docs`

## Hệ thống Elo

Elo được tính theo công thức Elo chuẩn với hệ số biến động `k = 32`:

- **Puzzle Elo**: So sánh Elo người chơi với rating của puzzle -> giải đúng cộng điểm, giải sai bị trừ điểm, dùng gợi ý trừ nửa điểm.
- **PvP Elo**: So sánh Elo giữa hai người chơi sau mỗi ván (thắng / thua / hoà) để tính điểm cộng/trừ cho cả hai bên.
