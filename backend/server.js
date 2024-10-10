// File: backend/server.js

const express = require("express");
const cors = require("cors");
const ethers = require("ethers");
const axios = require("axios");
const { generateBlock, verifySolution, hashBlock } = require("./gameLogic");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const network = "holesky";
const provider = ethers.getDefaultProvider(network);

const GodsTokenABI =
  require("../artifacts/contracts/GodsToken.sol/GodsToken.json").abi;
const godsTokenAddress = process.env.GODS_TOKEN_ADDRESS;

const godsTokenContract = new ethers.Contract(
  godsTokenAddress,
  GodsTokenABI,
  provider
);

let gameState = {
  currentBlock: null,
  playerScores: {},
};

app.post("/start-game", (req, res) => {
  gameState.currentBlock = generateBlock();
  const blockHash = hashBlock(gameState.currentBlock);

  res.json({
    message: "New game started",
    blockHash,
    grid: gameState.currentBlock.grid,
    correctSolution: gameState.currentBlock.mismatches, // Only include this for testing
  });
});

app.post("/submit-solution", async (req, res) => {
  const { playerAddress, solution } = req.body;

  if (!gameState.currentBlock) {
    return res.status(400).json({ message: "No active game", success: false });
  }

  const isCorrect = verifySolution(gameState.currentBlock, solution);

  if (isCorrect) {
    try {
      const proofResponse = await axios.post(
        "http://localhost:8080/generate-proof",
        {
          block: gameState.currentBlock.grid,
          solution: solution,
        }
      );

      if (proofResponse.data.is_valid) {
        await updateScoreAndMintTokens(playerAddress);
        res.json({
          message: "Correct solution! Tokens minted.",
          success: true,
          verificationData: proofResponse.data.verification_data,
        });

        gameState.currentBlock = generateBlock();
      } else {
        res.json({ message: "Proof verification failed.", success: false });
      }
    } catch (error) {
      console.error("Error generating or verifying proof:", error);
      res
        .status(500)
        .json({ message: "Error processing proof", success: false });
    }
  } else {
    res.json({ message: "Incorrect solution.", success: false });
  }
});

async function updateScoreAndMintTokens(playerAddress) {
  gameState.playerScores[playerAddress] =
    (gameState.playerScores[playerAddress] || 0) + 1;

  const ownerWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const contractWithSigner = godsTokenContract.connect(ownerWallet);
  await contractWithSigner.mint(playerAddress, ethers.parseEther("10")); // Mint 10 tokens
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
