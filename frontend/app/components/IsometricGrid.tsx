import React, { useState, useEffect } from "react";

interface IsometricGridProps {
  gridSize: number;
  squareSize: number;
  initialTime: number; // Total time in seconds
  updateInterval: number; // Interval for updating hover effects in seconds
  isRunning: boolean;
}

const IsometricGrid: React.FC<IsometricGridProps> = ({
  gridSize,
  squareSize,
  initialTime,
  updateInterval,
  isRunning,
}) => {
  const [isAnimated, setIsAnimated] = useState(true);
  const [hoveredSquares, setHoveredSquares] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState(initialTime);
  //   const [isRunning, setIsRunning] = useState(false);

  const squares = Array.from(
    { length: gridSize * gridSize },
    (_, index) => index
  );

  const handleAnimateClick = () => {
    setIsAnimated(!isAnimated);
  };

  const handleStartStop = () => {
    // setIsRunning(!isRunning);
    if (!isRunning && timeLeft === 0) {
      setTimeLeft(initialTime);
      setHoveredSquares(new Set());
    }
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      intervalId = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    }

    return () => clearInterval(intervalId);
  }, [isRunning, timeLeft]);

  useEffect(() => {
    if (timeLeft === 0) {
      //   setIsRunning(false);
      setHoveredSquares(new Set(squares)); // Hover all squares when time reaches zero
      return;
    }

    if (timeLeft % updateInterval !== 0 && timeLeft !== initialTime) {
      return;
    }

    const totalUpdates = Math.floor(initialTime / updateInterval);
    const squaresPerUpdate = squares.length / totalUpdates;
    const elapsedUpdates = Math.floor(
      (initialTime - timeLeft) / updateInterval
    );
    const targetHoverCount = Math.min(
      Math.floor(squaresPerUpdate * elapsedUpdates),
      squares.length
    );

    setHoveredSquares((prev) => {
      const newSet = new Set(prev);
      while (newSet.size < targetHoverCount) {
        const remainingSquares = squares.filter((index) => !newSet.has(index));
        if (remainingSquares.length === 0) break;
        const randomIndex =
          remainingSquares[Math.floor(Math.random() * remainingSquares.length)];
        newSet.add(randomIndex);
      }
      return newSet;
    });
  }, [timeLeft, initialTime, updateInterval, squares]);
  return (
    <>
      <button onClick={handleAnimateClick} className="animate-button">
        {isAnimated ? "Flatten Grid" : "Animate Grid"}
      </button>
      <button onClick={handleStartStop} className="start-stop-button">
        {isRunning ? "Stop" : "Start"}
      </button>
      <div>Time left: {timeLeft} seconds</div>
      <div
        className={`isometric-grid ${isAnimated ? "animated" : ""}`}
        style={{
          transformStyle: "preserve-3d",
          perspective: "10000px",
          padding: `${squareSize * 2}px`,
        }}
      >
        {squares.map((index) => {
          const row = Math.floor(index / gridSize);
          const col = index % gridSize;
          return (
            <div
              key={index}
              className={`isometric-square ${
                hoveredSquares.has(index) ? "hovered" : ""
              }`}
              style={{
                width: `${squareSize}px`,
                height: `${squareSize}px`,
                position: "absolute",
                left: `${col * squareSize}px`,
                top: `${row * squareSize}px`,
                transformStyle: "preserve-3d",
                transition: "all 0.3s ease-out",
              }}
            >
              <div className="face right"></div>
              <div className="face left"></div>
              <div className="face top"></div>
              <div
                className="face top"
                style={{
                  backgroundColor: "#5c44fe",
                  transform: `translateZ(${squareSize / 4}px)`,
                }}
              ></div>
            </div>
          );
        })}
      </div>
      <style jsx>{`
        .animate-button,
        .start-stop-button {
          margin-right: 10px;
          margin-bottom: 20px;
          padding: 10px 20px;
          font-size: 16px;
          cursor: pointer;
        }
        .isometric-grid {
          position: relative;
          display: inline-block;
          transform: rotateX(0deg) rotateZ(0deg);
          transition: transform 1s ease-out;
        }
        .isometric-grid.animated {
          transform: rotateX(60deg) rotateZ(-45deg);
        }
        .isometric-square {
          transform-style: preserve-3d;
          cursor: pointer;
        }
        .isometric-square.hovered {
          transform: translateZ(${squareSize / 2}px);
        }
        .isometric-square .face {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 1px solid #00f5d4;
          border-radius: 5px;
        }
        .isometric-square .right {
          background-color: #5cffbb;
          transform: rotateX(-90deg) translateZ(${squareSize / 2}px);
          box-shadow: inset 0 0 10px 5px #5cacca;
        }
        .isometric-square .left {
          background-color: #5daeca;
          transform: rotateY(-90deg) translateZ(${squareSize / 2}px);
          box-shadow: inset 0 0 10px 5px #5c84cb;
        }
        .isometric-square .top {
          background-color: #4361ee;
          transform: translateZ(${squareSize / 2}px);
          box-shadow: inset 0 0 10px 5px #5c44fe;
        }
        .isometric-square.hovered .right {
          background-color: #9d77ba;
          box-shadow: inset 0 0 15px 5px #b5179e;
        }
        .isometric-square.hovered .left {
          background-color: #9b2de8;
          box-shadow: inset 0 0 15px 5px #b5179e;
        }
        .isometric-square.hovered .top {
          background-color: #c922ca;
          box-shadow: inset 0 0 15px 5px #f72585;
        }
      `}</style>
    </>
  );
};

export default IsometricGrid;
