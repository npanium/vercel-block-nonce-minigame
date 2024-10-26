const express = require("express");
const cors = require("cors");
const ethers = require("ethers");
const config = require("./config/config");
const GameStateManager = require("./services/GameStateManager");
const ProofGenerator = require("./services/ProofGenerator");
const GameService = require("./services/GameService");
const setupGameRoutes = require("./routes/gameRoutes");
const { validateAddress } = require("./middlewares/auth");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Setup services
const provider = ethers.getDefaultProvider(config.network);
const gameStateManager = new GameStateManager();
const proofGenerator = new ProofGenerator(config.rustServerUrl);
const gameService = new GameService(gameStateManager, proofGenerator, provider);

// Apply auth middleware globally
app.use(validateAddress);

// Setup routes with the new game service
app.use("/api/game", setupGameRoutes(gameService));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);

  // Handle specific error types
  if (err.name === "ValidationError") {
    return res.status(400).json({ error: err.message });
  }

  if (err.name === "AuthorizationError") {
    return res.status(403).json({ error: err.message });
  }

  // Default error
  res.status(500).json({
    error:
      config.nodeEnv === "production" ? "Something went wrong!" : err.message,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

module.exports = app;
