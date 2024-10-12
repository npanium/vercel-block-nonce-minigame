/**
 * Game Logic for Grid Mismatch Challenge
 *
 * Core functionality:
 * 1. Generates a large grid (8x8) for display
 * 2. Selects a random smaller grid (4x4) within the large grid
 * 3. Creates mismatches within the small grid
 * 4. Inserts the mismatched small grid back into the large grid
 *
 * This approach creates a challenging game where players interact with
 * a larger grid, but the core puzzle exists within a hidden smaller grid.
 */

const crypto = require("crypto");
const VISIBLE_GRID_SIZE = 8; // or 16, depending on your preference
const ACTUAL_GRID_SIZE = 4;
const NUM_MISMATCHES = 1;

function generateBlock() {
  // Generate the larger visible grid
  let visibleGrid = Array(VISIBLE_GRID_SIZE)
    .fill()
    .map(() =>
      Array(VISIBLE_GRID_SIZE)
        .fill()
        .map(() => Math.floor(Math.random() * 256))
    );

  // Select a random 4x4 subgrid
  let startX = Math.floor(
    Math.random() * (VISIBLE_GRID_SIZE - ACTUAL_GRID_SIZE + 1)
  );
  let startY = Math.floor(
    Math.random() * (VISIBLE_GRID_SIZE - ACTUAL_GRID_SIZE + 1)
  );

  // Extract the original 4x4 grid
  let originalGrid = visibleGrid
    .slice(startX, startX + ACTUAL_GRID_SIZE)
    .map((row) => row.slice(startY, startY + ACTUAL_GRID_SIZE));

  // Create a copy for the mismatched grid
  let currentGrid = JSON.parse(JSON.stringify(originalGrid));

  // Create mismatches within the 4x4 subgrid
  let mismatches = [];
  for (let i = 0; i < NUM_MISMATCHES; i++) {
    let x = Math.floor(Math.random() * ACTUAL_GRID_SIZE);
    let y = Math.floor(Math.random() * ACTUAL_GRID_SIZE);

    let originalValue = currentGrid[x][y];
    let newValue;
    do {
      newValue = Math.floor(Math.random() * 256);
    } while (newValue === originalValue);

    currentGrid[x][y] = newValue;
    visibleGrid[startX + x][startY + y] = newValue;
    mismatches.push({ x, y, originalValue });
  }

  return {
    visibleGrid,
    originalGrid,
    currentGrid,
    mismatches,
    subgridPosition: { x: startX, y: startY },
  };
}

function verifySolution(gameState, solution) {
  const { originalGrid, currentGrid, subgridPosition } = gameState;

  for (let { x, y, value } of solution) {
    // Adjust x and y to the subgrid coordinates
    let subX = x - subgridPosition.x;
    let subY = y - subgridPosition.y;

    // Check if the correction is within the 4x4 subgrid
    if (
      subX < 0 ||
      subX >= ACTUAL_GRID_SIZE ||
      subY < 0 ||
      subY >= ACTUAL_GRID_SIZE
    ) {
      return false;
    }

    // Check if the correction is valid
    if (
      currentGrid[subX][subY] !== value ||
      originalGrid[subX][subY] !== value
    ) {
      return false;
    }
  }

  return solution.length === NUM_MISMATCHES;
}

/**
 * Generates a hash of the game state for verification purposes.
 * @param {Array} grid - The 2D array representing the game grid.
 * @returns {string} A hexadecimal string representing the hash of the grid.
 */
function hashBlock(grid) {
  const gridString = JSON.stringify(grid);
  return crypto.createHash("sha256").update(gridString).digest("hex");
}

module.exports = {
  generateBlock,
  verifySolution,
  hashBlock,
  VISIBLE_GRID_SIZE,
  ACTUAL_GRID_SIZE,
};
