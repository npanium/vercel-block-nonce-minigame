const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const GodsToken = await hre.ethers.getContractFactory("GodsToken");
  const godsToken = await GodsToken.deploy(deployer.address);

  await godsToken.waitForDeployment();

  console.log("Gods Token deployed to:", await godsToken.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
