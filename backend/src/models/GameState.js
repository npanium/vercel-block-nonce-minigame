class GameState {
  constructor(address, config, startTime) {
    this.address = address;
    this.config = config;
    this.startTime = startTime;
    this.clickedCells = [];
    this.isEnded = false;
  }

  addClick(x, y) {
    this.clickedCells.push({ x, y });
  }

  getBugsFound() {
    return this.clickedCells.filter((cell) =>
      this.config.bugs.some((bug) => bug.x === cell.x && bug.y === cell.y)
    ).length;
  }
}

module.exports = GameState;
