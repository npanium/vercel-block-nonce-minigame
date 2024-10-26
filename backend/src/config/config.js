require("dotenv").config();

module.exports = {
  network: "holesky",
  rustServerUrl: process.env.RUST_SERVER_URL || "http://localhost:8080",
  port: process.env.PORT || 3001,
};
