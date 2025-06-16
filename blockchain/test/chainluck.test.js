const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ChainLuckVault", function () {
  let chainLuckVault;
  let owner;
  let addr1, addr2, addr3, addr4, addr5;
  let addrs;

  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    const ChainLuckVault = await ethers.getContractFactory("ChainLuckVault");
    [owner, addr1, addr2, addr3, addr4, addr5, ...addrs] = await ethers.getSigners();

    // Deploy a new contract for each test
    chainLuckVault = await ChainLuckVault.deploy(2, 3); // 2 winners per draw, min 3 participants
    await chainLuckVault.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await chainLuckVault.owner()).to.equal(owner.address);
    });

    it("Should initialize with correct parameters", async function () {
      expect(await chainLuckVault.winnersPerDraw()).to.equal(2);
      expect(await chainLuckVault.minParticipants()).to.equal(3);
      expect(await chainLuckVault.currentRoundId()).to.equal(1);
    });

    it("Should have first round active", async function () {
      const roundInfo = await chainLuckVault.getCurrentRoundInfo();
      expect(roundInfo.isActive).to.be.true;
      expect(roundInfo.roundId).to.equal(1);
    });
  });

  describe("Deposits", function () {
    it("Should allow deposits to vault", async function () {
      const depositAmount = ethers.parseEther("1.0");
      
      await expect(chainLuckVault.connect(addr1).deposit({ value: depositAmount }))
        .to.emit(chainLuckVault, "Deposited")
        .withArgs(addr1.address, depositAmount, 1);

      const roundInfo = await chainLuckVault.getCurrentRoundInfo();
      expect(roundInfo.prizePool).to.equal(depositAmount);
    });

    it("Should revert on zero deposit", async function () {
      await expect(chainLuckVault.connect(addr1).deposit({ value: 0 }))
        .to.be.revertedWith("Must deposit some ETH");
    });

    it("Should accumulate multiple deposits", async function () {
      const deposit1 = ethers.parseEther("1.0");
      const deposit2 = ethers.parseEther("0.5");
      
      await chainLuckVault.connect(addr1).deposit({ value: deposit1 });
      await chainLuckVault.connect(addr2).deposit({ value: deposit2 });

      const roundInfo = await chainLuckVault.getCurrentRoundInfo();
      expect(roundInfo.prizePool).to.equal(deposit1 + deposit2);
    });
  });

  describe("User Entry", function () {
    beforeEach(async function () {
      // Add some funds to the vault
      await chainLuckVault.connect(owner).deposit({ value: ethers.parseEther("2.0") });
    });

    it("Should allow user entry", async function () {
      await expect(chainLuckVault.connect(addr1).enter(addr1.address))
        .to.emit(chainLuckVault, "UserEntered")
        .withArgs(addr1.address, 1);

      const roundInfo = await chainLuckVault.getCurrentRoundInfo();
      expect(roundInfo.participantCount).to.equal(1);
    });

    it("Should prevent duplicate entries in same round", async function () {
      await chainLuckVault.connect(addr1).enter(addr1.address);
      
      await expect(chainLuckVault.connect(addr1).enter(addr1.address))
        .to.be.revertedWith("Already entered this round");
    });

    it("Should prevent entry with zero address", async function () {
      await expect(chainLuckVault.connect(addr1).enter(ethers.ZeroAddress))
        .to.be.revertedWith("Invalid user address");
    });

    it("Should track user entry status", async function () {
      await chainLuckVault.connect(addr1).enter(addr1.address);
      
      expect(await chainLuckVault.hasUserEnteredCurrent(addr1.address)).to.be.true;
      expect(await chainLuckVault.hasUserEnteredCurrent(addr2.address)).to.be.false;
    });
  });

  describe("Winner Selection", function () {
    beforeEach(async function () {
      // Add funds to vault
      await chainLuckVault.connect(owner).deposit({ value: ethers.parseEther("2.0") });
    });

    it("Should automatically draw winners when min participants reached", async function () {
      // Create a fresh contract instance to avoid state issues
      const freshVault = await (await ethers.getContractFactory("ChainLuckVault")).deploy(2, 3);
      await freshVault.waitForDeployment();
      await freshVault.connect(owner).deposit({ value: ethers.parseEther("2.0") });
      
      // Enter 3 users (min participants)
      await freshVault.connect(addr1).enter(addr1.address);
      await freshVault.connect(addr2).enter(addr2.address);
      
      // This should trigger auto-draw
      await expect(freshVault.connect(addr3).enter(addr3.address))
        .to.emit(freshVault, "WinnersDrawn");
    });

    it("Should allow manual draw by owner", async function () {
      // Create fresh contract for manual draw test
      const newVault = await (await ethers.getContractFactory("ChainLuckVault")).deploy(2, 10);
      await newVault.waitForDeployment();
      await newVault.connect(owner).deposit({ value: ethers.parseEther("1.0") });
      
      // Enter users (less than minParticipants so no auto-draw)
      await newVault.connect(addr1).enter(addr1.address);
      await newVault.connect(addr2).enter(addr2.address);
      await newVault.connect(addr3).enter(addr3.address);

      // Manual draw should work
      await expect(newVault.connect(owner).drawWinners())
        .to.emit(newVault, "WinnersDrawn");
    });

    it("Should prevent manual draw with insufficient participants", async function () {
      const newVault = await (await ethers.getContractFactory("ChainLuckVault")).deploy(3, 10);
      await newVault.waitForDeployment();
      await newVault.connect(owner).deposit({ value: ethers.parseEther("1.0") });
      
      await newVault.connect(addr1).enter(addr1.address);
      await newVault.connect(addr2).enter(addr2.address);

      await expect(newVault.connect(owner).drawWinners())
        .to.be.revertedWith("Not enough participants");
    });

    it("Should prevent non-owner from manual draw", async function () {
      await chainLuckVault.connect(addr1).enter(addr1.address);
      await chainLuckVault.connect(addr2).enter(addr2.address);
      await chainLuckVault.connect(addr3).enter(addr3.address);

      await expect(chainLuckVault.connect(addr1).drawWinners())
        .to.be.revertedWithCustomError(chainLuckVault, "OwnableUnauthorizedAccount");
    });

    it("Should distribute prizes equally among winners", async function () {
      const prizePool = ethers.parseEther("2.0");
      
      // Enter users
      await chainLuckVault.connect(addr1).enter(addr1.address);
      await chainLuckVault.connect(addr2).enter(addr2.address);
      
      const balanceBefore1 = await ethers.provider.getBalance(addr1.address);
      const balanceBefore2 = await ethers.provider.getBalance(addr2.address);
      const balanceBefore3 = await ethers.provider.getBalance(addr3.address);
      
      // This should trigger draw with 2 winners from 3 participants
      await chainLuckVault.connect(addr3).enter(addr3.address);
      
      const balanceAfter1 = await ethers.provider.getBalance(addr1.address);
      const balanceAfter2 = await ethers.provider.getBalance(addr2.address);
      const balanceAfter3 = await ethers.provider.getBalance(addr3.address);
      
      // Check that exactly 2 people won (balance increased)
      const winners = [
        balanceAfter1 > balanceBefore1,
        balanceAfter2 > balanceBefore2,
        balanceAfter3 > balanceBefore3
      ].filter(Boolean);
      
      expect(winners.length).to.equal(2);
    });
  });

  describe("Round Management", function () {
    it("Should reset round after draw", async function () {
      await chainLuckVault.connect(owner).deposit({ value: ethers.parseEther("1.0") });
      
      // Enter users and trigger draw
      await chainLuckVault.connect(addr1).enter(addr1.address);
      await chainLuckVault.connect(addr2).enter(addr2.address);
      await chainLuckVault.connect(addr3).enter(addr3.address);
      
      // Should be on round 2 now
      expect(await chainLuckVault.currentRoundId()).to.equal(2);
      
      const roundInfo = await chainLuckVault.getCurrentRoundInfo();
      expect(roundInfo.isActive).to.be.true;
      expect(roundInfo.participantCount).to.equal(0);
    });

    it("Should allow owner to manually reset round", async function () {
      expect(await chainLuckVault.currentRoundId()).to.equal(1);
      
      await expect(chainLuckVault.connect(owner).resetRound())
        .to.emit(chainLuckVault, "RoundReset")
        .withArgs(1, 2);
        
      expect(await chainLuckVault.currentRoundId()).to.equal(2);
    });

    it("Should allow entry in new round after reset", async function () {
      await chainLuckVault.connect(owner).deposit({ value: ethers.parseEther("1.0") });
      await chainLuckVault.connect(addr1).enter(addr1.address);
      
      // Trigger draw
      await chainLuckVault.connect(addr2).enter(addr2.address);
      await chainLuckVault.connect(addr3).enter(addr3.address);
      
      // Should be able to enter new round
      await chainLuckVault.connect(owner).deposit({ value: ethers.parseEther("1.0") });
      await expect(chainLuckVault.connect(addr1).enter(addr1.address))
        .to.emit(chainLuckVault, "UserEntered");
    });
  });

  describe("Configuration", function () {
    it("Should allow owner to update winners per draw", async function () {
      await expect(chainLuckVault.connect(owner).setWinnersPerDraw(5))
        .to.emit(chainLuckVault, "ConfigUpdated")
        .withArgs(5, 3);
        
      expect(await chainLuckVault.winnersPerDraw()).to.equal(5);
    });

    it("Should allow owner to update min participants", async function () {
      await expect(chainLuckVault.connect(owner).setMinParticipants(10))
        .to.emit(chainLuckVault, "ConfigUpdated")
        .withArgs(2, 10);
        
      expect(await chainLuckVault.minParticipants()).to.equal(10);
    });

    it("Should prevent non-owner from updating config", async function () {
      await expect(chainLuckVault.connect(addr1).setWinnersPerDraw(5))
        .to.be.revertedWithCustomError(chainLuckVault, "OwnableUnauthorizedAccount");
    });

    it("Should prevent setting winners per draw to zero", async function () {
      await expect(chainLuckVault.connect(owner).setWinnersPerDraw(0))
        .to.be.revertedWith("Winners per draw must be greater than 0");
    });
  });

  describe("View Functions", function () {
    it("Should return correct round info", async function () {
      await chainLuckVault.connect(owner).deposit({ value: ethers.parseEther("1.5") });
      await chainLuckVault.connect(addr1).enter(addr1.address);
      
      const roundInfo = await chainLuckVault.getCurrentRoundInfo();
      expect(roundInfo.roundId).to.equal(1);
      expect(roundInfo.participantCount).to.equal(1);
      expect(roundInfo.prizePool).to.equal(ethers.parseEther("1.5"));
      expect(roundInfo.isActive).to.be.true;
    });

    it("Should return round participants", async function () {
      await chainLuckVault.connect(owner).deposit({ value: ethers.parseEther("1.0") });
      await chainLuckVault.connect(addr1).enter(addr1.address);
      await chainLuckVault.connect(addr2).enter(addr2.address);
      
      const participants = await chainLuckVault.getRoundParticipants(1);
      expect(participants).to.deep.equal([addr1.address, addr2.address]);
    });
  });

  describe("Emergency Functions", function () {
    it("Should allow owner to emergency withdraw", async function () {
      await chainLuckVault.connect(addr1).deposit({ value: ethers.parseEther("1.0") });
      
      const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
      const tx = await chainLuckVault.connect(owner).emergencyWithdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
      
      expect(ownerBalanceAfter).to.be.closeTo(
        ownerBalanceBefore + ethers.parseEther("1.0") - gasUsed,
        ethers.parseEther("0.001") // Small tolerance for gas estimation
      );
    });

    it("Should prevent non-owner from emergency withdraw", async function () {
      await expect(chainLuckVault.connect(addr1).emergencyWithdraw())
        .to.be.revertedWithCustomError(chainLuckVault, "OwnableUnauthorizedAccount");
    });
  });
}); 