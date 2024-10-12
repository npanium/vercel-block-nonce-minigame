const axios = require("axios");

const RUST_ZK_SERVICE_URL = "http://localhost:8080";

async function generateAndVerifyProof(originalGrid, currentGrid, solution) {
  try {
    // Flatten both 2D grids into 1D arrays
    const flattenedOriginalGrid = originalGrid.flat();
    const flattenedCurrentGrid = currentGrid.flat();

    // Format the solution as expected by the Rust code
    const formattedSolution = solution.map((s) => [s.x, s.y, s.value]);

    const response = await axios.post(
      `${RUST_ZK_SERVICE_URL}/generate-and-submit-proof`,
      {
        originalGrid: flattenedOriginalGrid,
        currentGrid: flattenedCurrentGrid,
        solution: formattedSolution,
      }
    );

    return {
      isValid: response.data.is_valid,
      alignedVerificationData: response.data.aligned_verification_data,
    };
  } catch (error) {
    console.error("Error calling Rust ZK service:", error);
    throw new Error("Failed to generate or verify proof");
  }
}

module.exports = {
  generateAndVerifyProof,
};
