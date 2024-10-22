const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GodsToken", function () {
  let GodsToken;
  let godsToken;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  beforeEach(async function () {
    GodsToken = await ethers.getContractFactory("GodsToken");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // Updated deployment
    godsToken = await GodsToken.deploy(owner.address);
    await godsToken.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await godsToken.owner()).to.equal(owner.address);
    });

    it("Should assign the total supply of tokens to the owner", async function () {
      const ownerBalance = await godsToken.balanceOf(owner.address);
      expect(await godsToken.totalSupply()).to.equal(ownerBalance);
    });

    it("Should have correct name and symbol", async function () {
      expect(await godsToken.name()).to.equal("Gods Token");
      expect(await godsToken.symbol()).to.equal("BCG");
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      await godsToken.transfer(addr1.address, 50);
      const addr1Balance = await godsToken.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(50);

      await godsToken.connect(addr1).transfer(addr2.address, 50);
      const addr2Balance = await godsToken.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(50);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const initialOwnerBalance = await godsToken.balanceOf(owner.address);
      await expect(
        godsToken.connect(addr1).transfer(owner.address, 1)
      ).to.be.revertedWithCustomError(godsToken, "ERC20InsufficientBalance");
      expect(await godsToken.balanceOf(owner.address)).to.equal(
        initialOwnerBalance
      );
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint new tokens", async function () {
      const initialSupply = await godsToken.totalSupply();
      await godsToken.mint(addr1.address, 100);

      expect(await godsToken.balanceOf(addr1.address)).to.equal(100);
      expect(await godsToken.totalSupply()).to.equal(
        initialSupply.add(ethers.BigNumber.from(100))
      );
    });

    it("Should not allow non-owners to mint tokens", async function () {
      await expect(
        godsToken.connect(addr1).mint(addr2.address, 100)
      ).to.be.revertedWithCustomError(godsToken, "OwnableUnauthorizedAccount");
    });
  });
});
