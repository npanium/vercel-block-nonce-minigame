import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";

const shapes = [
  "semicircle",
  "circle",
  "hexagon",
  "square",
  "triangle",
  "cross",
  "diamond",
  "star",
];

interface CellData {
  shape: string;
  offset: {
    x: number;
    y: number;
  };
}

interface Position {
  x: number;
  y: number;
}

interface GridGameProps {
  gridSize: number;
  onCellReveal: () => void;
  enemyPositions: Position[]; // New prop for enemy positions
}

const GridGame: React.FC<GridGameProps> = ({
  gridSize,
  onCellReveal,
  enemyPositions,
}) => {
  const [grid, setGrid] = useState<CellData[][]>([]);
  const [cursorPosition, setCursorPosition] = useState<Position>({
    x: -1,
    y: -1,
  });
  const [revealedCells, setRevealedCells] = useState<Position[]>([]);

  useEffect(() => {
    const createGrid = () =>
      Array(gridSize)
        .fill(null)
        .map(() =>
          Array(gridSize)
            .fill(null)
            .map(() => ({
              shape: shapes[Math.floor(Math.random() * shapes.length)],
              offset: { x: 0, y: 0 },
            }))
        );

    setGrid(createGrid());
    setRevealedCells([]);

    const intervalId = setInterval(() => {
      setGrid((prevGrid) =>
        prevGrid.map((row) =>
          row.map((cell) => ({
            ...cell,
            offset: {
              x: Math.sin(Date.now() / 1000 + Math.random() * 10) * 5,
              y: Math.cos(Date.now() / 1000 + Math.random() * 10) * 5,
            },
          }))
        )
      );
    }, 50);

    return () => clearInterval(intervalId);
  }, [gridSize]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / (rect.width / gridSize));
      const y = Math.floor((e.clientY - rect.top) / (rect.height / gridSize));
      setCursorPosition({ x, y });
    },
    [gridSize]
  );

  const handleCellClick = useCallback(
    (x: number, y: number) => {
      setRevealedCells((prev) => {
        if (!prev.some((cell) => cell.x === x && cell.y === y)) {
          onCellReveal();
          return [...prev, { x, y }];
        }
        return prev;
      });
    },
    [onCellReveal]
  );

  const isEnemyCell = (x: number, y: number) => {
    return enemyPositions.some((pos) => pos.x === x && pos.y === y);
  };

  const renderGrid = (isHidden: boolean) => (
    <div
      className={`absolute inset-0 grid`}
      style={{
        gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
        gridTemplateRows: `repeat(${gridSize}, 1fr)`,
      }}
    >
      {grid.map((row, y) =>
        row.map((cell, x) => {
          const isRevealed =
            !isHidden ||
            (Math.abs(x - cursorPosition.x) <= 1 &&
              Math.abs(y - cursorPosition.y) <= 1);
          let imageName;
          if (isHidden) {
            imageName = isEnemyCell(x, y)
              ? `enemies/e-${cell.shape}`
              : `filled/f-${cell.shape}`;
          } else {
            imageName = `normal/${cell.shape}`;
          }
          return (
            <div
              key={`${x}-${y}`}
              className={`flex justify-center items-center relative transition-all ease-out hover:bg-gray-900 border-blue-600 
                hover:border-4 hover:border-dashed hover:border-teal-300
                ${isRevealed ? "opacity-100" : "opacity-0"} ${
                isEnemyCell(x, y) ? "duration-500" : "duration-1000"
              } cell-style `}
              onClick={() => handleCellClick(x, y)}
              style={{
                transform: `translate(${cell.offset.x}px, ${cell.offset.y}px)`,
              }}
            >
              <Image
                src={`/grid-images/${imageName}.png`}
                alt={cell.shape}
                width={750 / gridSize / 1.8}
                height={750 / gridSize / 1.8}
                className={`${
                  cursorPosition.x === x && cursorPosition.y === y
                    ? "filter drop-shadow-lg scale-110"
                    : ""
                }`}
              />
              {revealedCells.some((rc) => rc.x === x && rc.y === y) && (
                <div
                  className="absolute inset-0 rounded border border-rose-700 bg-opacity-80 flex justify-center items-center text-gray-700 bad-cell"
                  style={{
                    fontSize: `${750 / gridSize / 4}px`,
                  }}
                >
                  {/* {`${x},${y}`} */}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );

  return (
    <div
      className="w-[750px] h-[750px] relative overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {renderGrid(false)}
      {renderGrid(true)}
    </div>
  );
};

export default GridGame;
