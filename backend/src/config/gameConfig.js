// Game configuration
const MIN_BUGS = 5;
const MAX_BUGS = 10;
const MIN_GRID_SIZE = 8;
const MAX_GRID_SIZE = 16;

function generateGameConfig() {
  const gridSize =
    Math.floor(Math.random() * (MAX_GRID_SIZE - MIN_GRID_SIZE + 1)) +
    MIN_GRID_SIZE;
  const numBugs =
    Math.floor(Math.random() * (MAX_BUGS - MIN_BUGS + 1)) + MIN_BUGS;

  const bugs = [];
  for (let i = 0; i < numBugs; i++) {
    let x, y;
    do {
      x = Math.floor(Math.random() * gridSize);
      y = Math.floor(Math.random() * gridSize);
    } while (bugs.some((bug) => bug.x === x && bug.y === y));
    bugs.push({ x, y });
  }

  console.log(`Grid size: ${gridSize} \n Bug List: \n ${JSON.stringify(bugs)}`);

  return { gridSize, bugs };
}

module.exports = { generateGameConfig };
