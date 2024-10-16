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

// Store active games
const activeGames = new Map();

app.post("/start-game", (req, res) => {
  const { address } = req.body;
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

  activeGames.set(gameId, gameState);

  // Set timer to end game
  setTimeout(() => endGame(gameId), GAME_DURATION);

  res.json({
    gameId,
    gridSize: gameConfig.gridSize,
    numBugs: gameConfig.bugs.length,
    duration: GAME_DURATION / 1000,
  });
});

// Handle user click
app.post("/click", (req, res) => {
  const { gameId, x, y } = req.body;
  const game = activeGames.get(gameId);

  if (!game) {
    return res.status(404).json({ error: "Game not found" });
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

  try {
    // Send only the number of bugs to Rust server
    const rustResponse = await axios.post(`${RUST_SERVER_URL}/generate-proof`, {
      num_bugs: game.config.bugs.length,
    });
    const alignedVerificationData = rustResponse.data;

    return alignedVerificationData;
  } catch (error) {
    console.error(`Error ending game ${gameId}:`, error);
  }
}

// Endpoint to end the game and sign/send transaction
app.post("/end-game", async (req, res) => {
  const { gameId, signedTransaction } = req.body;
  const game = activeGames.get(gameId);

  if (!game) {
    return res.status(404).json({ error: "Game not found" });
  }

  if (!game.isEnded) {
    return res.status(400).json({ error: "Game is still in progress" });
  }

  try {
    // Use the signed transaction from the frontend to send it to the blockchain
    const txResponse = await provider.sendTransaction(signedTransaction);
    await txResponse.wait();

    console.log(`Game ${gameId} ended. Transaction hash: ${txResponse.hash}`);

    res.json({ success: true, txHash: txResponse.hash });
  } catch (error) {
    console.error(`Error ending game ${gameId}:`, error);
    res.status(500).json({ error: "Failed to process transaction" });
  }
});

// Get game result
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
