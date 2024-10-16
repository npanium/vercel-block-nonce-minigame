const ethers = require("ethers");

// Game configuration
const MIN_BUGS = 5;
const MAX_BUGS = 10;
const MIN_GRID_SIZE = 8;
const MAX_GRID_SIZE = 16;

// Generate a random game configuration
function generateGameConfig() {
  const gridSize =
    Math.floor(Math.random() * (MAX_GRID_SIZE - MIN_GRID_SIZE + 1)) +
    MIN_GRID_SIZE;
  const numBugs =
    Math.floor(Math.random() * (MAX_BUGS - MIN_BUGS + 1)) + MIN_BUGS;

  const bugs = [];
  for (let i = 0; i < numBugs; i++) {
    let x, y;
    do {
      x = Math.floor(Math.random() * gridSize);
      y = Math.floor(Math.random() * gridSize);
    } while (bugs.some((bug) => bug.x === x && bug.y === y));
    bugs.push({ x, y });
  }

  return { gridSize, bugs };
}

// Prepare transaction for smart contract
async function prepareSmartContractTransaction(
  alignedVerificationData,
  userAddress,
  provider
) {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const contractABI = [
    "function verifyBatchInclusion(bytes32 proofCommitment, bytes32 pubInputCommitment, bytes32 provingSystemAuxDataCommitment, bytes20 proofGeneratorAddr, bytes32 batchMerkleRoot, bytes memory merkleProof, uint256 verificationDataBatchIndex) external returns (uint256)",
  ];

  const contract = new ethers.Contract(contractAddress, contractABI, provider);

  return await contract.populateTransaction.verifyBatchInclusion(
    alignedVerificationData.verification_data_commitment.proof_commitment,
    alignedVerificationData.verification_data_commitment.pub_input_commitment,
    alignedVerificationData.verification_data_commitment
      .proving_system_aux_data_commitment,
    alignedVerificationData.verification_data_commitment.proof_generator_addr,
    alignedVerificationData.batch_merkle_root,
    alignedVerificationData.batch_inclusion_proof.merkle_path.flat(),
    alignedVerificationData.index_in_batch,
    {
      from: userAddress,
    }
  );
}

module.exports = {
  generateGameConfig,
  prepareSmartContractTransaction,
};
