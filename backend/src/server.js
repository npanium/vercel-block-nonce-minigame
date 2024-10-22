require("dotenv").config();
const express = require("express");
const cors = require("cors");
const ethers = require("ethers");
const axios = require("axios");
const gameLogic = require("./gameLogic");
const app = express();
app.use(cors());
app.use(express.json());

const network = "holesky";
const provider = ethers.getDefaultProvider(network);
const RUST_SERVER_URL = process.env.RUST_SERVER_URL || "http://localhost:8080";
const GAME_DURATION = 30000; // 30 seconds

// Store active games with both gameId and address mapping
const activeGames = new Map();
const activePlayerGames = new Map(); // Maps player addresses to their active gameId

app.post("/start-game", (req, res) => {
  const { address } = req.body;

  if (!address) {
    return res.status(400).json({ error: "Player address is required" });
  }

  // Check if player already has an active game
  const existingGameId = activePlayerGames.get(address);
  if (existingGameId) {
    const existingGame = activeGames.get(existingGameId);
    if (existingGame && !existingGame.isEnded) {
      return res.status(409).json({
        error: "Player already has an active game",
        gameId: existingGameId,
        remainingTime: GAME_DURATION - (Date.now() - existingGame.startTime),
      });
    }
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

  // Store game state and player mapping
  activeGames.set(gameId, gameState);
  activePlayerGames.set(address, gameId);

  // Set timer to end game
  setTimeout(() => {
    endGame(gameId).then(() => {
      // Clean up player mapping after game ends
      activePlayerGames.delete(address);
    });
  }, GAME_DURATION);

  res.json({
    gameId,
    gridSize: gameConfig.gridSize,
    numBugs: gameConfig.bugs.length,
    duration: GAME_DURATION / 1000,
  });
});

app.post("/click", (req, res) => {
  const { gameId, x, y, address } = req.body;

  if (!address) {
    return res.status(400).json({ error: "Player address is required" });
  }

  const game = activeGames.get(gameId);

  if (!game) {
    return res.status(404).json({ error: "Game not found" });
  }

  if (game.address !== address) {
    return res.status(403).json({ error: "Not authorized to play this game" });
  }

  if (game.isEnded) {
    return res.status(400).json({ error: "Game has already ended" });
  }

  game.clickedCells.push({ x, y });
  res.json({ success: true });
});

async function endGame(gameId) {
  const game = activeGames.get(gameId);
  if (!game || game.isEnded) return;

  game.isEnded = true;
  activePlayerGames.delete(game.address);

  try {
    const rustResponse = await axios.post(`${RUST_SERVER_URL}/generate-proof`, {
      num_bugs: game.config.bugs.length,
    });
    const alignedVerificationData = rustResponse.data;
    return alignedVerificationData;
  } catch (error) {
    console.error(`Error ending game ${gameId}:`, error);
  }
}

app.post("/end-game", async (req, res) => {
  const { gameId, signedTransaction, address } = req.body;

  if (!address) {
    return res.status(400).json({ error: "Player address is required" });
  }

  const game = activeGames.get(gameId);

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
    activeGames.delete(gameId);
    activePlayerGames.delete(address);

    res.json({ success: true, txHash: txResponse.hash });
  } catch (error) {
    console.error(`Error ending game ${gameId}:`, error);
    res.status(500).json({ error: "Failed to process transaction" });
  }
});

app.get("/game-result/:gameId", (req, res) => {
  const { gameId } = req.params;
  const game = activeGames.get(gameId);

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

// Add an endpoint to check if a player has an active game
app.get("/active-game/:address", (req, res) => {
  const { address } = req.params;
  const gameId = activePlayerGames.get(address);

  if (!gameId) {
    return res.json({ hasActiveGame: false });
  }

  const game = activeGames.get(gameId);
  if (!game || game.isEnded) {
    // Clean up stale game state
    activePlayerGames.delete(address);
    if (game) {
      activeGames.delete(gameId);
    }
    return res.json({ hasActiveGame: false });
  }

  res.json({
    hasActiveGame: true,
    gameId,
    remainingTime: GAME_DURATION - (Date.now() - game.startTime),
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
