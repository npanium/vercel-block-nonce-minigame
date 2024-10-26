import { useEffect, useState } from "react";

interface UseRemainingTimeReturn {
  remainingTime: number;
  isExpired: boolean;
  formattedTime: string;
}

export const useRemainingTime = (
  startTime?: number,
  duration?: number
): UseRemainingTimeReturn => {
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!startTime || !duration) return;

    const calculateRemainingTime = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      return Math.max(0, duration - elapsed);
    };

    const updateTime = () => {
      const remaining = calculateRemainingTime();
      setRemainingTime(remaining);
      setIsExpired(remaining <= 0);
    };

    // Initial calculation
    updateTime();

    // Update every second
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [startTime, duration]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return {
    remainingTime,
    isExpired,
    formattedTime: formatTime(remainingTime),
  };
};
