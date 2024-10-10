// File: backend/gameLogic.js

const crypto = require("crypto");

// Constants
const GRID_SIZE = 4;
const NUM_MISMATCHES = 1;

function generateBlock() {
  let grid = [];
  for (let i = 0; i < GRID_SIZE; i++) {
    let row = [];
    for (let j = 0; j < GRID_SIZE; j++) {
      row.push(Math.floor(Math.random() * 256)); // 0-255 for each cell
    }
    grid.push(row);
  }

  // Create mismatches
  let mismatches = [];
  for (let i = 0; i < NUM_MISMATCHES; i++) {
    let x, y;
    do {
      x = Math.floor(Math.random() * GRID_SIZE);
      y = Math.floor(Math.random() * GRID_SIZE);
    } while (mismatches.some((m) => m.x === x && m.y === y));

    let originalValue = grid[x][y];
    let newValue;
    do {
      newValue = Math.floor(Math.random() * 256);
    } while (newValue === originalValue);

    grid[x][y] = newValue;
    mismatches.push({ x, y, originalValue });
  }

  return { grid, mismatches };
}

function verifySolution(block, solution) {
  if (solution.length !== NUM_MISMATCHES) {
    return false;
  }
  console.log(solution.length);
  const mismatchMap = new Map(
    block.mismatches.map((m) => [`${m.x},${m.y}`, m.originalValue])
  );

  console.log("Mismatch Map: " + Array.from(mismatchMap));

  for (let correction of solution) {
    const key = `${correction.x},${correction.y}`;

    if (!mismatchMap.has(key)) {
      console.log(`Mismatch Map doesnt have key: ${key}`);
      return false;
    }
    if (mismatchMap.get(key) !== correction.value) {
      console.log(`Mismatch Map doesnt value: ${key}, ${correction.value}`);
      return false;
    }
    mismatchMap.delete(key);
  }

  return mismatchMap.size === 0;
}

function hashBlock(block) {
  const blockString = JSON.stringify(block.grid);
  return crypto.createHash("sha256").update(blockString).digest("hex");
}

module.exports = {
  generateBlock,
  verifySolution,
  hashBlock,
  GRID_SIZE,
  NUM_MISMATCHES,
};
