const express = require("express");
const cors = require("cors");
const ethers = require("ethers");
const config = require("./config/config");
const GameStateManager = require("./services/GameStateManager");
const ProofGenerator = require("./services/ProofGenerator");
const setupGameRoutes = require("./routes/gameRoutes");
const { validateAddress } = require("./middlewares/auth");

const app = express();
app.use(cors());
app.use(express.json());

const provider = ethers.getDefaultProvider(config.network);
const gameStateManager = new GameStateManager();
const proofGenerator = new ProofGenerator(config.rustServerUrl);

// Apply auth middleware globally
app.use(validateAddress);

// Setup routes
app.use(
  "/api/game",
  setupGameRoutes(gameStateManager, proofGenerator, provider)
);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

module.exports = app;
