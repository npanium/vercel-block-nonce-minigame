import React from "react";

interface MouseFollowerProps {
  x: number;
  y: number;
}

const MouseFollower: React.FC<MouseFollowerProps> = ({ x, y }) => {
  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <div
        className="w-[200px] h-[100px] border-2 border-yellow-400 rounded-lg relative frame-glow"
        style={{ mixBlendMode: "difference" }}
      >
        <div
          className="w-[50px] h-[25px] rounded-lg bg-yellow-400 absolute bottom-0 right-2/3"
          style={{ transform: "translate(50%, 50%)" }}
        />
      </div>
    </div>
  );
};

export default MouseFollower;
