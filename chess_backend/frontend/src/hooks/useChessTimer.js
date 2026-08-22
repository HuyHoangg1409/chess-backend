import { useState, useEffect, useCallback } from "react";

export function useChessTimer({
    initialTime = 600,
    gameStarted = false,
    isCompleted = false,
    currentTurn = "w",
    playerColor = "white",
    onTimeOut = () => {}
}) {
    const [playerTime, setPlayerTime] = useState(initialTime);
    const [opponentTime, setOpponentTime] = useState(initialTime);

    /**
     * Định dạng thời gian hiển thị (MM:SS)
     */
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    /**
     * Đặt lại thời gian về giá trị khởi tạo hoặc giá trị mới
     */
    const resetTimer = useCallback((newTime = initialTime) => {
        setPlayerTime(newTime);
        setOpponentTime(newTime);
    }, [initialTime]);

    useEffect(() => {
        if(!gameStarted || isCompleted) return;

        const timer = setInterval(() => {
            const isMyTurn = currentTurn === (playerColor === "white" ? "w" : "b");
            if (isMyTurn) {
                setPlayerTime((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        onTimeOut("player");
                        return 0;
                    }
                    return prev -1;
                })
            }
            else {
                setOpponentTime((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        onTimeOut("opponent");
                        return 0;
                    }
                    return prev - 1;
                })
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [gameStarted, isCompleted, currentTurn, playerColor, onTimeOut]);

    return {
        playerTime,
        opponentTime,
        setPlayerTime,
        setOpponentTime,
        formatTime,
        resetTimer,
    }
}