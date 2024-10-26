const { app, server } = require("./app");
const config = require("./config/config");

server.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
