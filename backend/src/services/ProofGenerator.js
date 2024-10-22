const axios = require("axios");

class ProofGenerator {
  constructor(serverUrl) {
    this.serverUrl = serverUrl;
  }

  async generateProof(numBugs) {
    try {
      const response = await axios.post(`${this.serverUrl}/generate-proof`, {
        num_bugs: numBugs,
      });
      return response.data;
    } catch (error) {
      console.error("Error generating proof:", error);
      throw new Error("Failed to generate proof");
    }
  }
}

module.exports = ProofGenerator;
