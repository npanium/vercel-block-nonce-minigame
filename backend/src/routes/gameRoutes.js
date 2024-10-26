const express = require("express");
const router = express.Router();
const config = require("../config/config");

function setupGameRoutes(gameService) {
  const { gameStateManager } = gameService;

  router.post("/create-game", async (req, res) => {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ error: "Player address is required" });
    }

    if (gameStateManager.hasActiveGame(address)) {
      return res.status(409).json({
        error: "Player already has an active game",
        gameId: gameStateManager.activePlayerGames.get(address),
      });
    }

    // Only create basic game setup initially
    const gameId = Date.now().toString();
    const gameState = {
      address,
      startTime: Date.now(),
      isEnded: false,
    };

    gameStateManager.createGame(gameId, gameState);

    // Return only the gameId
    res.json({ gameId });
  });

  router.get("/:gameId", async (req, res) => {
    const { gameId } = req.params;
    const game = gameStateManager.getGame(gameId);
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    res.json({
      //   gridSize: game.config.gridSize,
      timeRemaining: game.config.gameDuration - (Date.now() - game.startTime),
      clickedCells: game.clickedCells,
      isEnded: game.isEnded,
    });
  });

  router.post("/start-game/:gameId", async (req, res) => {
    const { gameId } = req.params;
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ error: "Player address is required" });
    }

    const game = gameStateManager.getGame(gameId);
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    if (game.address !== address) {
      return res
        .status(403)
        .json({ error: "Not authorized to start this game" });
    }

    // if (game.config) {
    //   return res.status(400).json({ error: "Game already started" });
    // }

    // Initialize game configuration
    const gameConfig = gameService.generateGameConfig();
    const updates = {
      config: gameConfig,
      startTime: Date.now(),
      clickedCells: [],
      isEnded: false,
    };

    // Update the game state
    gameStateManager.updateGame(gameId, updates);

    // Set automatic game end timer
    game.timeoutId = setTimeout(async () => {
      try {
        const result = await endGame(
          gameId,
          gameStateManager,
          // proofGenerator,
          "timeout"
        );
        if (result) {
          console.log(`Game ${gameId} ended by timeout with result:`, result);
        }
      } catch (error) {
        console.error(`Error ending game ${gameId} by timeout:`, error);
      }
    }, gameConfig.gameDuration);

    res.json({
      gameId,
      gridSize: gameConfig.gridSize,
      bugs: gameConfig.bugs,
      numBugs: gameConfig.bugs.length,
      clickedCells: game.clickedCells,
      startTime: game.startTime,
      duration: gameConfig.gameDuration / 1000,
    });
  });
  // Handle cell clicks
  router.post("/click", (req, res) => {
    const { gameId, x, y, address } = req.body;
    if (!address) {
      return res.status(400).json({ error: "Player address is required" });
    }

    const game = gameStateManager.getGame(gameId);
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    if (game.address !== address) {
      return res
        .status(403)
        .json({ error: "Not authorized to play this game" });
    }

    if (game.isEnded) {
      return res.status(400).json({ error: "Game has already ended" });
    }

    if (!game.clickedCells) {
      game.clickedCells = [];
    }
    // TODO: Handle unclick
    game.clickedCells.push({ x, y });
    gameStateManager.updateGame(gameId, game);
    console.log(`Game Details: ${JSON.stringify(game)}`);
    res.json({ success: true });
  });

  // End game and process transaction
  router.post("/end-game", async (req, res) => {
    const { gameId, signedTransaction, address } = req.body;

    if (!address) {
      return res.status(400).json({ error: "Player address is required" });
    }

    const game = gameStateManager.getGame(gameId);

    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    if (game.address !== address) {
      return res.status(403).json({ error: "Not authorized to end this game" });
    }

    try {
      // const txResponse = await provider.sendTransaction(signedTransaction);
      // await txResponse.wait();
      // console.log(`Game ${gameId} ended. Transaction hash: ${txResponse.hash}`);

      // Clean up game state
      // gameStateManager.removeGame(gameId);
      // console.log("Game Ended from /end-game");
      // res.json({ success: true, txHash: txResponse.hash });

      const result = await endGame(gameId, gameStateManager, "manual");

      if (!result) {
        return res.json({
          success: true,
          gameId,
          result: game.result, // Return existing result if game was already ended
          alreadyEnded: true,
        });
      }

      res.json({
        success: true,
        gameId,
        result,
      });
    } catch (error) {
      console.error(`Error ending game ${gameId} manually:`, error);
      res.status(500).json({ error: "Failed to end game" });
    }
  });

  // Get game result
  router.get("/game-result/:gameId", (req, res) => {
    const { gameId } = req.params;
    const game = gameStateManager.getGame(gameId);

    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    if (!game.isEnded) {
      return res.status(400).json({ error: "Game is still in progress" });
    }

    const bugsFound = game.clickedCells.filter((cell) =>
      game.config.bugs.some((bug) => bug.x === cell.x && bug.y === cell.y)
    ).length;

    res.json({
      bugsFound,
      totalBugs: game.config.bugs.length,
      clickedCells: game.clickedCells.length,
    });
  });

  // Check for active game
  router.get("/active-game/:address", (req, res) => {
    const { address } = req.params;

    if (!gameStateManager.hasActiveGame(address)) {
      return res.json({ hasActiveGame: false });
    }

    const game = gameStateManager.getPlayerGame(address);
    const gameId = gameStateManager.activePlayerGames.get(address);

    res.json({
      hasActiveGame: true,
      gameId,
      remainingTime: gameConfig.gameDuration - (Date.now() - game.startTime),
    });
  });

  // Manual game end
  router.post("/end-game/:gameId", async (req, res) => {
    const { gameId } = req.params;
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ error: "Player address is required" });
    }

    const game = gameStateManager.getGame(gameId);
    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    if (game.address !== address) {
      return res.status(403).json({ error: "Not authorized to end this game" });
    }

    if (game.isEnded) {
      return res.status(400).json({ error: "Game already ended" });
    }

    try {
      // Clear the automatic timeout if it exists
      if (game.timeoutId) {
        clearTimeout(game.timeoutId);
      }

      // End the game manually
      const result = await endGame(
        gameId,
        gameStateManager,
        // proofGenerator,
        "manual"
      );

      res.json({
        success: true,
        gameId,
        result,
      });
    } catch (error) {
      console.error(`Error ending game ${gameId}:`, error);
      res.status(500).json({ error: "Failed to end game" });
    }
  });

  // Get game state
  router.get("/game-state/:gameId", (req, res) => {
    const { gameId } = req.params;
    const { address } = req.query;

    const game = gameStateManager.getGame(gameId);

    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    if (game.address !== address) {
      return res
        .status(403)
        .json({ error: "Not authorized to view this game" });
    }

    res.json(game);
  });
  router.get("/stats/:address", (req, res) => {
    const stats = gameStateManager.getPlayerStats(req.params.address);
    console.log(`Player Stats: ${JSON.stringify(stats)}`);
    res.json(stats);
  });

  return router;
}

// Helper fn
async function endGame(
  gameId,
  gameStateManager,
  //   proofGenerator,
  endType = "timeout"
) {
  const game = gameStateManager.getGame(gameId);
  if (!game || game.isEnded) return null;

  const updates = {
    isEnded: true,
    endType: endType,
    endTime: Date.now(),
    timeoutId: null, // Clear timeoutId
  };

  // Calculate game statistics
  const bugsFound = game.clickedCells.filter((cell) =>
    game.config.bugs.some((bug) => bug.x === cell.x && bug.y === cell.y)
  ).length;

  console.log(`Bugs found: ${JSON.stringify(bugsFound)}`);

  const gameResult = {
    bugsFound,
    totalBugs: game.config.bugs.length,
    clickedCells: game.clickedCells.length,
    duration: game.endTime - game.startTime,
    endType,
  };

  // Store the result in the game state
  updates.result = gameResult;
  gameStateManager.updateGame(gameId, updates);

  // Handle proof generation if needed
  //   if (proofGenerator) {
  //     try {
  //       const alignedVerificationData = await proofGenerator.generateProof(
  //         game.config.bugs.length
  //       );
  //       game.verificationData = alignedVerificationData;
  //     } catch (error) {
  //       console.error(`Error generating proof for game ${gameId}:`, error);
  //       // Don't throw the error, just log it
  //     }
  //   }
  if (game.timeoutId) {
    clearTimeout(game.timeoutId);
  }
  return gameResult;
}

module.exports = setupGameRoutes;
