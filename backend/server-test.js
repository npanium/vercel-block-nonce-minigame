require("dotenv").config();
const express = require("express");
const cors = require("cors");
const ethers = require("ethers");
const { generateBlock, verifySolution, hashBlock } = require("./gameLogic");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const network = "holesky";
// Initialize ethers provider
const provider = ethers.getDefaultProvider(network);

// Import your GodsToken ABI and address
const GodsTokenABI =
  require("../artifacts/contracts/GodsToken.sol/GodsToken.json").abi;
const godsTokenAddress = process.env.GODS_TOKEN_ADDRESS;

// Create contract instance
const godsTokenContract = new ethers.Contract(
  godsTokenAddress,
  GodsTokenABI,
  provider
);

// Game state (this should be moved to a database in a production environment)
let gameState = {
  currentBlock: null,
  playerScores: {},
};

app.post("/start-game", (req, res) => {
  gameState.currentBlock = generateBlock();
  const blockHash = hashBlock(gameState.currentBlock);
  const responseData = {
    message: "New game started",
    blockHash,
    grid: gameState.currentBlock.grid,
    correctSolution: gameState.currentBlock.mismatches, // Only include this for testing
  };

  console.log(
    "New game started. Response data:",
    JSON.stringify(responseData, null, 2)
  );
  res.json(responseData);
});

app.post("/submit-solution", async (req, res) => {
  const { playerAddress, solution } = req.body;

  if (!gameState.currentBlock) {
    return res.status(400).json({ message: "No active game", success: false });
  }

  // Verify the solution
  const isCorrect = verifySolution(gameState.currentBlock, solution);

  if (isCorrect) {
    // For testing purposes, we'll skip the ZK proof generation and verification
    // Update score and mint tokens

    console.log("Correct solution. minting tokens...");
    await updateScoreAndMintTokens(playerAddress);
    res.json({ message: "Correct solution! Tokens minted.", success: true });

    // Start a new game
    gameState.currentBlock = generateBlock();
  } else {
    res.json({ message: "Incorrect solution.", success: false });
  }
});

async function updateScoreAndMintTokens(playerAddress) {
  // Update player's score
  gameState.playerScores[playerAddress] =
    (gameState.playerScores[playerAddress] || 0) + 1;

  // Mint tokens to the player
  const ownerWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const contractWithSigner = godsTokenContract.connect(ownerWallet);

  await contractWithSigner.mint(playerAddress, ethers.parseEther("10")); // Mint 10 tokens
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
