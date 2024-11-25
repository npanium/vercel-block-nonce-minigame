const express = require("express");
const router = express.Router();

function setupGameRoutes(gameService, io) {
  // Socket.io connection handling
  io.on("connection", (socket) => {
    console.log("Client connected");

    socket.on("joinGame", (gameId) => {
      socket.join(gameId);
      console.log(`Client joined game room: ${gameId}`);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });

  // Create a new game
  router.post("/create-game", async (req, res) => {
    const { address } = req.body;

    try {
      const gameId = await gameService.createGame(address);
      console.log(`GameId: ${gameId}`);
      res.json({ gameId });
    } catch (error) {
      if (error.message.includes("already has active game")) {
        const gameId =
          gameService.gameStateManager.activePlayerGames.get(address);
        return res.status(409).json({ error: error.message, gameId });
      }
      res.status(400).json({ error: error.message });
    }
  });

  // Start game
  router.post("/start-game/:gameId", async (req, res) => {
    const { gameId } = req.params;
    const { address } = req.body;
    console.log("Router trying to start the game");
    try {
      const gameData = await gameService.startGame(gameId, address);
      res.json(gameData);
    } catch (error) {
      console.error(`Error starting game: ${error.message}`);
      res.status(400).json({ error: error.message });
    }
  });

  // Handle cell clicks
  router.post("/click", async (req, res) => {
    const { gameId, x, y, address } = req.body;

    try {
      const result = await gameService.handleClick(gameId, x, y, address);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // End game manually
  router.post("/end-game", async (req, res) => {
    const { gameId, address } = req.body;

    try {
      const result = await gameService.endGame(gameId, "manual");

      // Emit game ended event through socket
      console.log(`About to emit gameEnded event for game ${gameId}`);
      io.to(gameId).emit("gameEnded", {
        gameId,
        result,
      });
      console.log("Event emitted");

      res.json({
        success: true,
        gameId,
        result,
      });
    } catch (error) {
      console.error(`Error ending game ${gameId}:`, error);
      res.status(500).json({ error: error.message });
    }
  });

  // If the user request full verification after successful local verification
  router.post("/end-game/full", async (req, res) => {
    const { gameId, address } = req.body;
    const contractAddress = "";

    try {
      console.log("BE- trying for full verification");

      let contractInstance = null;
      if (contractAddress) {
        contractInstance = new ethers.Contract(
          contractAddress,
          VERIFIER_CONTRACT_ABI,
          provider
        );
      }

      const result = await gameService.endGameWithFullVerification(
        gameId,
        "manual"
      );
      console.log(`Result: ${JSON.stringify(result)}`);

      res.json({
        success: true,
        gameId,
        result,
      });
    } catch (error) {
      console.error(
        `Error ending game with full verification ${gameId}:`,
        error
      );
      res.status(500).json({ error: error.message });
    }
  });

  // Get game state
  router.get("/game-state/:gameId", async (req, res) => {
    const { gameId } = req.params;
    const { address } = req.query;

    try {
      const game = gameService.validateGameAccess(gameId, address);
      res.json(game);
    } catch (error) {
      res
        .status(error.message.includes("Not authorized") ? 403 : 404)
        .json({ error: error.message });
    }
  });

  // Get game result
  router.get("/game-result/:gameId", (req, res) => {
    const { gameId } = req.params;
    const game = gameService.gameStateManager.getGame(gameId);

    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    if (!game.isEnded) {
      return res.status(400).json({ error: "Game is still in progress" });
    }

    res.json(game.result);
  });

  // Check for active game
  router.get("/active-game/:address", (req, res) => {
    const { address } = req.params;

    if (!gameService.gameStateManager.hasActiveGame(address)) {
      return res.json({ hasActiveGame: false });
    }

    const gameId = gameService.gameStateManager.activePlayerGames.get(address);
    const game = gameService.gameStateManager.getGame(gameId);

    res.json({
      hasActiveGame: true,
      gameId,
      remainingTime: game.config?.gameDuration - (Date.now() - game.startTime),
    });
  });

  // Get player stats
  router.get("/stats", (req, res) => {
    try {
      const { address } = req.query;

      if (!address) {
        return res.status(400).json({ error: "Address is required" });
      }

      console.log(`Getting stats for address: ${address}`);

      const stats = gameService.gameStateManager.getPlayerStats(address);
      console.log(`Retrieved stats:`, stats);

      if (!stats) {
        return res.status(404).json({ error: "Stats not found for address" });
      }

      res.json(stats);
    } catch (error) {
      console.error("Error getting player stats:", error);
      res.status(500).json({ error: "Failed to retrieve player stats" });
    }
  });

  return router;
}

module.exports = setupGameRoutes;
