class GameService {
  constructor(gameStateManager, proofVerifier, provider, io) {
    this.gameStateManager = gameStateManager;
    this.proofVerifier = proofVerifier;
    this.provider = provider;
    this.io = io;

    // Game configuration constants
    this.GAME_CONFIG = {
      MIN_BUGS: 1, //change back to 5
      MAX_BUGS: 2, //change back to 10
      MIN_GRID_SIZE: 8,
      MAX_GRID_SIZE: 9, //change back to 16
      GAME_DURATION: 35000, // 35 seconds
    };
  }

  // Helper method to validate game access
  validateGameAccess(gameId, address) {
    const game = this.gameStateManager.getGame(gameId);
    if (!game) {
      throw new Error("Game not found");
    }
    if (game.address !== address) {
      throw new Error("Not authorized for this game");
    }
    return game;
  }

  async createGame(address) {
    if (!address) {
      throw new Error("Player address is required");
    }

    if (this.gameStateManager.hasActiveGame(address)) {
      throw new Error(
        `Player already has active game: ${this.gameStateManager.activePlayerGames.get(
          address
        )}`
      );
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

  generateGameConfig() {
    const { MIN_BUGS, MAX_BUGS, MIN_GRID_SIZE, MAX_GRID_SIZE, GAME_DURATION } =
      this.GAME_CONFIG;

    const gridSize =
      Math.floor(Math.random() * (MAX_GRID_SIZE - MIN_GRID_SIZE + 1)) +
      MIN_GRID_SIZE;
    const numBugs =
      Math.floor(Math.random() * (MAX_BUGS - MIN_BUGS + 1)) + MIN_BUGS;

    // Generate unique bug positions
    const bugs = new Set();
    while (bugs.size < numBugs) {
      const x = Math.floor(Math.random() * gridSize);
      const y = Math.floor(Math.random() * gridSize);
      bugs.add(JSON.stringify({ x, y }));
    }

    return {
      gridSize,
      bugs: Array.from(bugs).map((bug) => JSON.parse(bug)),
      gameDuration: GAME_DURATION,
    };
  }

  async startGame(gameId, address) {
    const game = this.validateGameAccess(gameId, address);

    if (game.config) {
      throw new Error("Game already started");
    }

    // Initialize game configuration
    const gameConfig = this.generateGameConfig();

    // Set the secret (number of bugs) in the proof verifier
    try {
      const secretSetRes = await this.proofVerifier.setSecret(
        gameConfig.bugs.length
      );
      console.log(`Secret set. ${JSON.stringify(secretSetRes)}`);
    } catch (error) {
      throw new Error(
        `Failed to initialize game verification: ${error.message}`
      );
    }

    const updates = {
      config: gameConfig,
      startTime: Date.now(),
      clickedCells: [],
      isEnded: false,
    };

    // Update game state
    this.gameStateManager.updateGame(gameId, updates);

    // Set automatic game end timer
    this.setGameEndTimer(gameId, gameConfig.gameDuration);

    return {
      gameId,
      gridSize: gameConfig.gridSize,
      bugs: gameConfig.bugs,
      numBugs: gameConfig.bugs.length,
      startTime: updates.startTime,
      duration: gameConfig.gameDuration / 1000,
    };
  }

  setGameEndTimer(gameId, duration) {
    const game = this.gameStateManager.getGame(gameId);
    if (game.timeoutId) {
      clearTimeout(game.timeoutId);
    }

    game.timeoutId = setTimeout(async () => {
      try {
        await this.endGame(gameId, "timeout");
      } catch (error) {
        console.error(`Error ending game ${gameId}:`, error);
      }
    }, duration);
  }

  async handleClick(gameId, x, y, address) {
    const game = this.validateGameAccess(gameId, address);

    if (game.isEnded) {
      throw new Error("Game has already ended");
    }

    game.clickedCells.push({ x, y });
    this.gameStateManager.updateGame(gameId, game);
    return { success: true };
  }

  async endGame(gameId, endType = "timeout") {
    const game = this.gameStateManager.getGame(gameId);
    if (!game || game.isEnded) return null;

    // Clear any existing timeout
    if (game.timeoutId) {
      clearTimeout(game.timeoutId);
    }

    const updates = {
      isEnded: true,
      endType,
      endTime: Date.now(),
      timeoutId: null,
    };

    // Calculate game statistics
    const bugsFound = game.clickedCells.filter((cell) =>
      game.config.bugs.some((bug) => bug.x === cell.x && bug.y === cell.y)
    ).length;

    const initialResult = {
      bugsFound,
      totalBugs: game.config.bugs.length,
      clickedCells: game.clickedCells.length,
      duration: Date.now() - game.startTime,
      endType,
      proofVerified: false,
      verificationInProgress: true,
    };

    // Emit initial result immediately
    this.io.to(gameId).emit("gameEnded", {
      gameId,
      result: initialResult,
      endType,
      status: "verifying",
    });

    try {
      // Verify the bugs found with the proof verifier Locally
      const verificationResult = await this.proofVerifier.verifyGuessLocal(
        bugsFound
      );

      const finalResult = {
        ...initialResult,
        proofVerified: verificationResult.success,
        verificationInProgress: false,
      };

      const updates = {
        isEnded: true,
        endType,
        endTime: Date.now(),
        timeoutId: null,
        result: finalResult,
      };

      this.gameStateManager.updateGame(gameId, updates);

      console.log(
        `Emitting final gameEnded event with verification for game ${gameId}`
      );
      this.io.to(gameId).emit("gameEnded", {
        gameId,
        result: finalResult,
        endType,
        status: "complete",
      });

      // console.log(`Proof verified with result ${JSON.stringify(finalResult)}`);
      return finalResult;
    } catch (error) {
      console.error(`Error verifying proof for game ${gameId}:`, error);
      throw new Error("Failed to verify game result");
    }
  }

  async endGameWithFullVerification(
    gameId,
    endType = "manual",
    contractInstance = null
  ) {
    const game = this.gameStateManager.getGame(gameId);
    if (!game) return null;

    if (game.timeoutId) {
      clearTimeout(game.timeoutId);
    }

    const bugsFound = game.clickedCells.filter((cell) =>
      game.config.bugs.some((bug) => bug.x === cell.x && bug.y === cell.y)
    ).length;

    // Initial result and emission
    const initialResult = {
      bugsFound,
      totalBugs: game.config.bugs.length,
      clickedCells: game.clickedCells.length,
      duration: Date.now() - game.startTime,
      endType,
      proofVerified: false,
      verificationInProgress: true,
      onChainVerified: false,
    };

    console.log(
      `Emitting initial gameEnded Full verification event for game ${gameId}`
    );
    this.io.to(gameId).emit("gameEndedFull", {
      gameId,
      result: initialResult,
      endType,
      status: "verifying",
    });

    try {
      console.log("Trying for full verification GS");
      // Full verification (local + on-chain)
      const verificationResult = await this.proofVerifier.verifyGuessFull(
        bugsFound
      );

      // If verification succeeded and there's a contract instance
      let contractResult = null;
      if (
        verificationResult.success &&
        verificationResult.on_chain_verified &&
        contractInstance
      ) {
        try {
          // Call smart contract method
          const tx = await contractInstance.verifyGameResult(
            gameId,
            bugsFound,
            verificationResult.proof_data // Assuming this comes from verification result
          );
          await tx.wait();
          contractResult = tx.hash;
        } catch (contractError) {
          console.error("Contract interaction failed:", contractError);
          // Emit contract failure but don't throw
          this.io.to(gameId).emit("gameEndedFull", {
            gameId,
            status: "contractError",
            error: contractError.message,
          });
        }
      }

      const finalResult = {
        ...initialResult,
        proofVerified: verificationResult.success,
        verificationInProgress: false,
        onChainVerified: verificationResult.on_chain_verified,
        contractTxHash: contractResult,
      };

      this.gameStateManager.updateGame(gameId, {
        isEnded: true,
        endType,
        endTime: Date.now(),
        timeoutId: null,
        result: finalResult,
      });

      console.log(
        `Emitting final gameEnded event with full verification for game ${gameId}`
      );
      this.io.to(gameId).emit("gameEndedFull", {
        gameId,
        result: finalResult,
        endType,
        status: "complete",
      });

      return finalResult;
    } catch (error) {
      // Emit error status
      this.io.to(gameId).emit("gameEndedFull", {
        gameId,
        result: initialResult,
        endType,
        status: "error",
        error: error.message,
      });

      console.error(`Error in full verification for game ${gameId}:`, error);
      throw new Error("Failed to complete full verification");
    }
  }

  async processTransaction(gameId, signedTransaction, address) {
    const game = this.validateGameAccess(gameId, address);

    if (!game.isEnded) {
      throw new Error("Game is still in progress");
    }

    try {
      const txResponse = await this.provider.sendTransaction(signedTransaction);
      await txResponse.wait();
      this.gameStateManager.removeGame(gameId);
      return txResponse.hash;
    } catch (error) {
      throw new Error(`Transaction failed: ${error.message}`);
    }
  }
}

module.exports = GameService;
