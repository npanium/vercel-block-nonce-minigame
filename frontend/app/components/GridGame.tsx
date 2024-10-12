"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  IoHeartOutline,
  IoStarOutline,
  IoSquareOutline,
  IoAtCircleOutline,
  IoFlowerOutline,
  IoLeafOutline,
  IoRocketOutline,
  IoMoonOutline,
} from "react-icons/io5";
import { IconType } from "react-icons/lib";
import MouseFollower from "./MouseFollower";

const icons: IconType[] = [
  IoHeartOutline,
  IoStarOutline,
  IoSquareOutline,
  IoAtCircleOutline,
  IoFlowerOutline,
  IoLeafOutline,
  IoRocketOutline,
  IoMoonOutline,
];

const mainColors: string[] = [
  "text-red-500",
  "text-blue-500",
  "text-green-500",
  "text-yellow-500",
  "text-purple-500",
  "text-pink-500",
  "text-indigo-500",
  "text-teal-500",
];

const hiddenColors: string[] = [
  "text-red-800",
  "text-blue-800",
  "text-green-800",
  "text-yellow-800",
  "text-purple-800",
  "text-pink-800",
  "text-indigo-800",
  "text-teal-800",
];

interface CellData {
  icon: IconType;
  color: string;
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
}

const GridGame: React.FC<GridGameProps> = ({ gridSize, onCellReveal }) => {
  const [grid, setGrid] = useState<CellData[][]>([]);
  const [hiddenGrid, setHiddenGrid] = useState<CellData[][]>([]);
  const [cursorPosition, setCursorPosition] = useState<Position>({
    x: -1,
    y: -1,
  });
  const [revealedCells, setRevealedCells] = useState<Position[]>([]);
  const [mousePosition, setMousePosition] = useState<Position>({
    x: -1,
    y: -1,
  });
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / (rect.width / gridSize));
      const y = Math.floor((e.clientY - rect.top) / (rect.height / gridSize));
      setCursorPosition({ x, y });

      // Update mouse position for the follower
      setMousePosition({ x: e.clientX, y: e.clientY });
    },
    [gridSize]
  );

  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => setIsHovering(false);

  useEffect(() => {
    const createGrid = (isHidden: boolean) =>
      Array(gridSize)
        .fill(null)
        .map(() =>
          Array(gridSize)
            .fill(null)
            .map(() => ({
              icon: icons[Math.floor(Math.random() * icons.length)],
              color: isHidden
                ? hiddenColors[Math.floor(Math.random() * hiddenColors.length)]
                : mainColors[Math.floor(Math.random() * mainColors.length)],
              offset: { x: 0, y: 0 },
            }))
        );

    setGrid(createGrid(false));
    setHiddenGrid(createGrid(true));
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

  // const handleMouseMove = useCallback(
  //   (e: React.MouseEvent<HTMLDivElement>) => {
  //     const rect = e.currentTarget.getBoundingClientRect();
  //     const x = Math.floor((e.clientX - rect.left) / (rect.width / gridSize));
  //     const y = Math.floor((e.clientY - rect.top) / (rect.height / gridSize));
  //     setCursorPosition({ x, y });
  //   },
  //   [gridSize]
  // );

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

  const renderGrid = (gridData: CellData[][], isHidden: boolean) => (
    <div
      className={`absolute inset-0 grid`}
      style={{
        gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
        gridTemplateRows: `repeat(${gridSize}, 1fr)`,
      }}
    >
      {gridData.map((row, y) =>
        row.map((cell, x) => {
          const Icon = cell.icon;
          const isRevealed =
            !isHidden ||
            (Math.abs(x - cursorPosition.x) <= 1 &&
              Math.abs(y - cursorPosition.y) <= 1);
          return (
            <div
              key={`${x}-${y}`}
              // hover:border-4 hover:border-dashed hover:border-teal-300
              className={`flex justify-center items-center cursor-none relative transition-all duration-1000 ease-out hover:bg-gray-900 
                
                ${isRevealed ? "opacity-100" : "opacity-0"} cell-style `}
              onClick={() => handleCellClick(x, y)}
              style={{
                transform: `translate(${cell.offset.x}px, ${cell.offset.y}px)`,
              }}
            >
              <Icon
                className={`${cell.color} ${
                  cursorPosition.x === x && cursorPosition.y === y
                    ? "filter drop-shadow-lg scale-110"
                    : ""
                }`}
                style={{
                  fontSize: `${750 / gridSize / 2}px`,
                }}
              />
              {revealedCells.some((rc) => rc.x === x && rc.y === y) && (
                <div
                  className="absolute inset-0 bg-white bg-opacity-80 flex justify-center items-center text-gray-700"
                  style={{
                    fontSize: `${750 / gridSize / 4}px`,
                  }}
                >
                  {`${x},${y}`}
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
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {renderGrid(grid, false)}
      {renderGrid(hiddenGrid, true)}
      {isHovering && <MouseFollower x={mousePosition.x} y={mousePosition.y} />}
    </div>
  );
};

export default GridGame;
