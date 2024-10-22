const express = require("express");
const router = express.Router();
const gameLogic = require("../config/gameConfig");
const config = require("../config/config");

function setupGameRoutes(gameStateManager, proofGenerator, provider) {
  // Start a new game
  router.post("/start-game", async (req, res) => {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({ error: "Player address is required" });
    }

    if (gameStateManager.hasActiveGame(address)) {
      const game = gameStateManager.getPlayerGame(address);
      return res.status(409).json({
        error: "Player already has an active game",
        gameId: gameStateManager.activePlayerGames.get(address),
        remainingTime: config.gameDuration - (Date.now() - game.startTime),
      });
    }

    const gameConfig = gameLogic.generateGameConfig();
    const gameId = Date.now().toString();
    const startTime = Date.now();

    const gameState = {
      address,
      config: gameConfig,
      startTime,
      clickedCells: [],
      isEnded: false,
    };

    gameStateManager.createGame(gameId, gameState);

    // Set timer to end game
    setTimeout(async () => {
      try {
        await endGame(gameId, gameStateManager, proofGenerator);
      } catch (error) {
        console.error(`Error ending game ${gameId}:`, error);
      }
    }, config.gameDuration);

    res.json({
      gameId,
      gridSize: gameConfig.gridSize,
      numBugs: gameConfig.bugs.length,
      duration: config.gameDuration / 1000,
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

    game.clickedCells.push({ x, y });
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

    if (!game.isEnded) {
      return res.status(400).json({ error: "Game is still in progress" });
    }

    try {
      const txResponse = await provider.sendTransaction(signedTransaction);
      await txResponse.wait();
      console.log(`Game ${gameId} ended. Transaction hash: ${txResponse.hash}`);

      // Clean up game state
      gameStateManager.removeGame(gameId);

      res.json({ success: true, txHash: txResponse.hash });
    } catch (error) {
      console.error(`Error ending game ${gameId}:`, error);
      res.status(500).json({ error: "Failed to process transaction" });
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
      remainingTime: config.gameDuration - (Date.now() - game.startTime),
    });
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

    res.json({
      isEnded: game.isEnded,
      remainingTime: game.isEnded
        ? 0
        : Math.max(0, config.gameDuration - (Date.now() - game.startTime)),
      clickedCells: game.clickedCells,
      gridSize: game.config.gridSize,
    });
  });

  return router;
}

// Helper function to handle game ending logic
async function endGame(gameId, gameStateManager, proofGenerator) {
  const game = gameStateManager.getGame(gameId);
  if (!game || game.isEnded) return;

  game.isEnded = true;
  gameStateManager.endGame(gameId);

  try {
    const alignedVerificationData = await proofGenerator.generateProof(
      game.config.bugs.length
    );
    return alignedVerificationData;
  } catch (error) {
    console.error(`Error generating proof for game ${gameId}:`, error);
    throw error;
  }
}

module.exports = setupGameRoutes;
