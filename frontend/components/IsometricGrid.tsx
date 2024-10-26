import { useRemainingTime } from "@/hooks/useRemainingTime";
import { useState, useEffect } from "react";

interface IsometricGridProps {
  gridSize: number;
  squareSize: number;
  startTime: number;
  totalTime: number;
  remainingTime: number;
  updateInterval: number;

  className: string | undefined;
}

const IsometricGrid: React.FC<IsometricGridProps> = ({
  gridSize,
  squareSize,
  startTime,
  totalTime,
  remainingTime,
  updateInterval,

  className,
}) => {
  const [isAnimated, setIsAnimated] = useState(true);
  const [hoveredSquares, setHoveredSquares] = useState<Set<number>>(new Set());
  // const { remainingTime } = useRemainingTime(startTime, totalTime);

  const squares = Array.from(
    { length: gridSize * gridSize },
    (_, index) => index
  );
  useEffect(() => {
    if (remainingTime === 0) {
      // Reset hover states when not running
      setHoveredSquares(new Set());
      return;
    }

    if (remainingTime < 2) {
      // Set all squares to hovered when time is up
      setHoveredSquares(new Set(squares));
      return;
    }

    // Skip updates that aren't on the interval
    if (remainingTime % updateInterval !== 0) {
      return;
    }

    // Calculate how many updates should have occurred
    const elapsedUpdates = Math.floor(
      (totalTime - remainingTime) / updateInterval
    );
    if (elapsedUpdates === 0) return; // Prevent division by zero

    // Calculate how many squares to hover at this point
    const squaresPerUpdate = squares.length / (totalTime / updateInterval);
    const targetHoverCount = Math.min(
      Math.floor(squaresPerUpdate * elapsedUpdates),
      squares.length
    );

    setHoveredSquares((prev) => {
      const newSet = new Set(prev);

      // Only add squares if the target hover count is greater than the current size
      if (newSet.size < targetHoverCount) {
        const remainingSquares = squares.filter((index) => !newSet.has(index));

        while (newSet.size < targetHoverCount && remainingSquares.length > 0) {
          const randomIndex =
            remainingSquares[
              Math.floor(Math.random() * remainingSquares.length)
            ];
          newSet.add(randomIndex);
        }
      }

      return newSet;
    });
  }, [remainingTime, squareSize, gridSize]);

  return (
    <>
      <div
        className={`isometric-grid ${
          isAnimated ? "animated" : ""
        } ${className}`}
        style={{
          transformStyle: "preserve-3d",
          perspective: "10000px",
          width: `${squareSize * gridSize}px`,
          height: `${squareSize * gridSize}px`,
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
              {/* <div
                className="face bottom"
                style={{
                  borderRadius: "10%",
                  boxShadow: "0 0 0px 10px #161525",
                  backgroundColor: "#5c44fe",
                  transform: `translateZ(-${squareSize / 2}px)`,
                }}
              ></div> */}
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
          position: absolute;
          left: 50%;
          display: inline-block;
          transform: rotateX(0deg) rotateZ(0deg);
          transition: transform 1s ease-out;
        }
        .isometric-grid.animated {
          transform: rotateX(60deg) rotateZ(-45deg) translateX(-5%)
            translateY(-60%);
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
          border-radius: 3px;
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
