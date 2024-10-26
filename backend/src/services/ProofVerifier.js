const axios = require("axios");

class ProofVerifier {
  constructor(verifierUrl = "http://127.0.0.1:8080") {
    this.verifierUrl = verifierUrl;
  }

  async setSecret(secret) {
    try {
      const response = await axios.post(`${this.verifierUrl}/set-secret`, {
        secret: secret,
      });
      return response.data;
    } catch (error) {
      console.error(
        "Error setting secret:",
        error.response?.data || error.message
      );
      throw new Error("Failed to set secret");
    }
  }

  async verifyGuess(guess) {
    try {
      const response = await axios.post(`${this.verifierUrl}/verify-guess`, {
        guess: guess,
      });
      return response.data;
    } catch (error) {
      console.error(
        "Error verifying guess:",
        error.response?.data || error.message
      );
      throw new Error("Failed to verify guess");
    }
  }
}

module.exports = ProofVerifier;
