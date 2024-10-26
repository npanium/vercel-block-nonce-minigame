class GameService {
  constructor(gameStateManager, proofGenerator, provider) {
    this.gameStateManager = gameStateManager;
    this.proofGenerator = proofGenerator;
    this.provider = provider;
  }

  async createGame(address) {
    if (!address) {
      throw new Error("Player address is required");
    }

    if (this.gameStateManager.hasActiveGame(address)) {
      const gameId = this.gameStateManager.activePlayerGames.get(address);
      throw new Error(`Player already has active game: ${gameId}`);
    }

    const gameId = Date.now().toString();
    const gameState = {
      address,
      startTime: Date.now(),
      isEnded: false,
      clickedCells: [],
    };

    this.gameStateManager.createGame(gameId, gameState);
    return gameId;
  }

  async startGame(gameId, address) {
    const game = this.gameStateManager.getGame(gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    if (game.address !== address) {
      throw new Error("Not authorized to start this game");
    }

    if (game.config) {
      throw new Error("Game already started");
    }

    // Initialize game configuration
    const gameConfig = this.generateGameConfig();
    game.config = gameConfig;
    game.startTime = Date.now();
    game.clickedCells = [];
    game.isEnded = false;

    // Set automatic game end timer
    game.timeoutId = setTimeout(async () => {
      try {
        await this.endGame(gameId, "timeout");
      } catch (error) {
        console.error(`Error ending game ${gameId}:`, error);
      }
    }, gameConfig.gameDuration);

    return {
      gameId,
      gridSize: gameConfig.gridSize,
      bugs: gameConfig.bugs,
      numBugs: gameConfig.bugs.length,
      startTime: game.startTime,
      duration: gameConfig.gameDuration / 1000,
    };
  }

  generateGameConfig() {
    const MIN_BUGS = 5;
    const MAX_BUGS = 10;
    const MIN_GRID_SIZE = 8;
    const MAX_GRID_SIZE = 16;
    const gameDuration = 30000; // 3000 seconds

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

    return { gridSize, bugs, gameDuration };
  }

  async handleClick(gameId, x, y, address) {
    const game = this.gameStateManager.getGame(gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    if (game.address !== address) {
      throw new Error("Not authorized to play this game");
    }

    if (game.isEnded) {
      throw new Error("Game has already ended");
    }

    game.clickedCells.push({ x, y });
    return { success: true };
  }

  async endGame(gameId, endType = "timeout") {
    const game = this.gameStateManager.getGame(gameId);
    if (!game || game.isEnded) return;

    game.isEnded = true;
    game.endType = endType;
    game.endTime = Date.now();

    const bugsFound = game.clickedCells.filter((cell) =>
      game.config.bugs.some((bug) => bug.x === cell.x && bug.y === cell.y)
    ).length;

    const gameResult = {
      bugsFound,
      totalBugs: game.config.bugs.length,
      clickedCells: game.clickedCells.length,
      duration: game.endTime - game.startTime,
      endType,
    };

    game.result = gameResult;

    if (this.proofGenerator) {
      try {
        const alignedVerificationData = await this.proofGenerator.generateProof(
          game.config.bugs.length
        );
        game.verificationData = alignedVerificationData;
      } catch (error) {
        console.error(`Error generating proof for game ${gameId}:`, error);
      }
    }

    return gameResult;
  }

  async processTransaction(gameId, signedTransaction, address) {
    const game = this.gameStateManager.getGame(gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    if (game.address !== address) {
      throw new Error("Not authorized to end this game");
    }

    if (!game.isEnded) {
      throw new Error("Game is still in progress");
    }

    const txResponse = await this.provider.sendTransaction(signedTransaction);
    await txResponse.wait();

    this.gameStateManager.removeGame(gameId);
    return txResponse.hash;
  }
}

module.exports = GameService;
