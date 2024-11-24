const express = require("express");
const cors = require("cors");
const ethers = require("ethers");
const config = require("./config/config");
const GameStateManager = require("./services/GameStateManager");
const ProofVerifier = require("./services/ProofVerifier");
const GameService = require("./services/GameService");
const setupGameRoutes = require("./routes/gameRoutes");
const { validateAddress } = require("./middlewares/auth");
const http = require("http");
const { Server } = require("socket.io");
const cookieParser = require("cookie-parser");

const app = express();
const server = http.createServer(app);

const CORS_ORIGIN =
  process.env.NODE_ENV === "production"
    ? "your-production-url.com"
    : "http://localhost:3000";

app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["set-cookie"],
  })
);

// Middleware
app.use(express.json());
app.use(cookieParser());

const io = new Server(server, {
  cors: {
    origin: CORS_ORIGIN, // frontend URL
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Setup services
const provider = ethers.getDefaultProvider(config.network);
const gameStateManager = new GameStateManager();
const proofVerifier = new ProofVerifier(config.rustServerUrl);
const gameService = new GameService(
  gameStateManager,
  proofVerifier,
  provider,
  io
);

// Apply auth middleware globally
app.use(validateAddress);

// Setup routes with the new game service
app.use("/api/game", setupGameRoutes(gameService, io));

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

module.exports = { app, server, io };
