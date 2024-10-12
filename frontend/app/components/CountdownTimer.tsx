import React, { useState, useEffect } from "react";

interface CountdownTimerProps {
  initialTime: number;
  onTimerEnd: () => void;
  isRunning: boolean;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  initialTime,
  onTimerEnd,
  isRunning,
}) => {
  const [timeLeft, setTimeLeft] = useState(initialTime);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      onTimerEnd();
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, timeLeft, onTimerEnd]);

  return (
    <div className="text-center">
      <h2 className="text-4xl font-bold mb-4">Time Left: {timeLeft}</h2>
    </div>
  );
};

export default CountdownTimer;
