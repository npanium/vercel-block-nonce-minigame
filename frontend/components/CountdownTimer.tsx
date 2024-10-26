import { useState, useEffect } from "react";

interface CountdownTimerProps {
  remainingTime: number;
  onTimerEnd: () => void;
  isRunning: boolean;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({
  remainingTime,
  onTimerEnd,
  isRunning,
}) => {
  // const [timeLeft, setTimeLeft] = useState(remainingTime);

  // useEffect(() => {
  //   let timer: NodeJS.Timeout;

  //   if (isRunning && timeLeft > 0) {
  //     timer = setInterval(() => {
  //       setTimeLeft((prevTime) => prevTime - 1);
  //     }, 1000);
  //   } else if (timeLeft === 0) {
  //     onTimerEnd();
  //   }

  //   return () => {
  //     if (timer) clearInterval(timer);
  //   };
  // }, [isRunning, timeLeft, onTimerEnd]);

  return (
    <div className="w-max absolute right-[146px] top-[47px]">
      <div className="text-end text-4xl text-[#6123ff] flex flex-col">
        <p className="text-xs leading-none">Time Left:</p>
        <p className="font-bold leading-none">{remainingTime} sec</p>
      </div>
    </div>
  );
};

export default CountdownTimer;
