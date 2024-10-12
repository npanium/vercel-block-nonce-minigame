require("dotenv").config();
const express = require("express");
const cors = require("cors");
const ethers = require("ethers");
const axios = require("axios");
const {
  generateBlock,
  verifySolution,
  hashBlock,
  VISIBLE_GRID_SIZE,
  ACTUAL_GRID_SIZE,
} = require("./gameLogic");
const { generateAndVerifyProof } = require("./zkProofService");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const network = "holesky";
const provider = ethers.getDefaultProvider(network);

const GodsTokenABI =
  require("../artifacts/contracts/GodsToken.sol/GodsToken.json").abi;
const godsTokenAddress = "0x4BA072BDBEf051DA5110B4E7Bd12798cB6F86645";

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
  gameState = generateBlock();
  const blockHash = hashBlock(gameState.visibleGrid);

  res.json({
    message: "New game started",
    blockHash,
    visibleGrid: gameState.visibleGrid,
    gridSize: VISIBLE_GRID_SIZE,
    subgridSize: ACTUAL_GRID_SIZE,
    subgridPosition: gameState.subgridPosition,
  });
});

app.post("/submit-solution", async (req, res) => {
  const { playerAddress, solution } = req.body;

  if (!gameState) {
    return res.status(400).json({ message: "No active game", success: false });
  }

  const isCorrect = verifySolution(gameState, solution);

  if (isCorrect) {
    try {
      const { isValid, verificationData } = await generateAndVerifyProof(
        gameState.originalGrid,
        gameState.currentGrid,
        solution.map((s) => ({
          x: s.x - gameState.subgridPosition.x,
          y: s.y - gameState.subgridPosition.y,
          value: s.value,
        }))
      );

      if (isValid) {
        await updateScoreAndMintTokens(playerAddress);

        res.json({
          message:
            "Correct solution! Proof verified. Tokens minted successfully.",
          success: true,
          verificationData: verificationData,
        });

        // Start a new game
        gameState = generateBlock();
      } else {
        res.json({ message: "Proof verification failed.", success: false });
      }
    } catch (error) {
      console.error("Error processing solution:", error);
      res
        .status(500)
        .json({ message: "Error processing solution", success: false });
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

  // In a real-world scenario, you would prepare this transaction for the user to sign
  // For now, we're using the server wallet to mint tokens
  const tx = await contractWithSigner.mint(
    playerAddress,
    ethers.parseEther("10")
  );
  await tx.wait();

  console.log(
    `Tokens minted for ${playerAddress}. Transaction hash: ${tx.hash}`
  );
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
