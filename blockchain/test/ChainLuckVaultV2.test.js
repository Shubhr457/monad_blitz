const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ChainLuckVaultV2 with Chainlink Integration", function () {
    let chainLuckVault, mockPriceFeed, mockVRFCoordinator;
    let owner, user1, user2, user3, user4, user5, user6;
    let subscriptionId = 1;
    
    const winnersPerDraw = 2;
    const minParticipants = 5;
    const entryFeeUSD = ethers.parseUnits("1", 8); // $1 USD
    const gasLane = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const callbackGasLimit = 200000;
    const initialETHPrice = ethers.parseUnits("2000", 8); // $2000

    beforeEach(async function () {
        [owner, user1, user2, user3, user4, user5, user6] = await ethers.getSigners();

        // Deploy Mock Price Feed
        const MockPriceFeed = await ethers.getContractFactory("MockPriceFeed");
        mockPriceFeed = await MockPriceFeed.deploy(initialETHPrice);
        await mockPriceFeed.waitForDeployment();

        // Deploy Mock VRF Coordinator
        const MockVRFCoordinator = await ethers.getContractFactory("MockVRFCoordinator");
        mockVRFCoordinator = await MockVRFCoordinator.deploy();
        await mockVRFCoordinator.waitForDeployment();

        // Deploy ChainLuckVaultV2
        const ChainLuckVaultV2 = await ethers.getContractFactory("ChainLuckVaultV2");
        chainLuckVault = await ChainLuckVaultV2.deploy(
            winnersPerDraw,
            minParticipants,
            entryFeeUSD,
            await mockVRFCoordinator.getAddress(),
            subscriptionId,
            gasLane,
            callbackGasLimit,
            await mockPriceFeed.getAddress()
        );
        await chainLuckVault.waitForDeployment();

        // Add contract as VRF consumer
        await mockVRFCoordinator.addConsumer(subscriptionId, await chainLuckVault.getAddress());

        // Fund the vault with initial prize pool
        await chainLuckVault.deposit({ value: ethers.parseEther("10") });
    });

    describe("Deployment and Configuration", function () {
        it("Should deploy with correct parameters", async function () {
            expect(await chainLuckVault.winnersPerDraw()).to.equal(winnersPerDraw);
            expect(await chainLuckVault.minParticipants()).to.equal(minParticipants);
            expect(await chainLuckVault.entryFeeUSD()).to.equal(entryFeeUSD);
            expect(await chainLuckVault.currentRoundId()).to.equal(1);
        });

        it("Should have correct owner", async function () {
            expect(await chainLuckVault.owner()).to.equal(owner.address);
        });
    });

    describe("Price Feed Integration", function () {
        it("Should get latest ETH price", async function () {
            const price = await chainLuckVault.getLatestPrice();
            expect(price).to.equal(initialETHPrice);
        });

        it("Should calculate entry fee in ETH correctly", async function () {
            const entryFeeETH = await chainLuckVault.getEntryFeeInETH();
            // $1 USD / $2000 per ETH = 0.0005 ETH
            const expectedFee = ethers.parseEther("0.0005");
            expect(entryFeeETH).to.equal(expectedFee);
        });

        it("Should update entry fee when price changes", async function () {
            // Change ETH price to $1000
            const newPrice = ethers.parseUnits("1000", 8);
            await mockPriceFeed.updatePrice(newPrice);
            
            const entryFeeETH = await chainLuckVault.getEntryFeeInETH();
            // $1 USD / $1000 per ETH = 0.001 ETH
            const expectedFee = ethers.parseEther("0.001");
            expect(entryFeeETH).to.equal(expectedFee);
        });
    });

    describe("Entry System with Fees", function () {
        it("Should allow entry with correct fee", async function () {
            const entryFee = await chainLuckVault.getEntryFeeInETH();
            
            await expect(chainLuckVault.connect(user1).enter({ value: entryFee }))
                .to.emit(chainLuckVault, "UserEntered")
                .withArgs(user1.address, 1, entryFee);
        });

        it("Should reject entry with insufficient fee", async function () {
            const entryFee = await chainLuckVault.getEntryFeeInETH();
            const insufficientFee = entryFee - 1n;
            
            await expect(chainLuckVault.connect(user1).enter({ value: insufficientFee }))
                .to.be.revertedWith("Insufficient entry fee");
        });

        it("Should refund excess payment", async function () {
            const entryFee = await chainLuckVault.getEntryFeeInETH();
            const excessPayment = entryFee + ethers.parseEther("0.1");
            
            const balanceBefore = await ethers.provider.getBalance(user1.address);
            const tx = await chainLuckVault.connect(user1).enter({ value: excessPayment });
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed * receipt.gasPrice;
            const balanceAfter = await ethers.provider.getBalance(user1.address);
            
            // Should only deduct entry fee + gas costs
            const expectedBalance = balanceBefore - entryFee - gasUsed;
            expect(balanceAfter).to.equal(expectedBalance);
        });

        it("Should support legacy entry method (free)", async function () {
            await expect(chainLuckVault.connect(owner).enter(user1.address))
                .to.emit(chainLuckVault, "UserEntered")
                .withArgs(user1.address, 1, 0);
        });
    });

    describe("VRF Integration and Winner Selection", function () {
        beforeEach(async function () {
            // Enter minimum participants using free method for simplicity
            await chainLuckVault.connect(owner).enter(user1.address);
            await chainLuckVault.connect(owner).enter(user2.address);
            await chainLuckVault.connect(owner).enter(user3.address);
            await chainLuckVault.connect(owner).enter(user4.address);
        });

        it("Should request randomness when minimum participants reached", async function () {
            await expect(chainLuckVault.connect(owner).enter(user5.address))
                .to.emit(chainLuckVault, "RandomnessRequested");
        });

        it("Should transition round state to CALCULATING", async function () {
            await chainLuckVault.connect(owner).enter(user5.address);
            
            const roundInfo = await chainLuckVault.getCurrentRoundInfo();
            expect(roundInfo.state).to.equal(1); // CALCULATING state
        });

        it("Should select winners and distribute prizes", async function () {
            await chainLuckVault.connect(owner).enter(user5.address);
            
            // The mock VRF fulfills immediately, so winners should be drawn
            const roundInfo = await chainLuckVault.getCurrentRoundInfo();
            expect(roundInfo.state).to.equal(0); // Should be OPEN for new round
            expect(roundInfo.roundId).to.equal(2); // Should have moved to next round
        });

        it("Should emit WinnersDrawn event with random word", async function () {
            const tx = await chainLuckVault.connect(owner).enter(user5.address);
            const receipt = await tx.wait();
            
            // Find WinnersDrawn event
            const winnersDrawnEvent = receipt.logs.find(log => {
                try {
                    const parsed = chainLuckVault.interface.parseLog(log);
                    return parsed.name === "WinnersDrawn";
                } catch {
                    return false;
                }
            });
            
            expect(winnersDrawnEvent).to.not.be.undefined;
        });

        it("Should prevent entry during CALCULATING state", async function () {
            await chainLuckVault.connect(owner).enter(user5.address);
            
            // Try to enter in calculating state (should fail)
            await expect(chainLuckVault.connect(owner).enter(user6.address))
                .to.be.revertedWith("Round is not open");
        });
    });

    describe("Round Management", function () {
        it("Should provide accurate round information", async function () {
            const roundInfo = await chainLuckVault.getCurrentRoundInfo();
            
            expect(roundInfo.roundId).to.equal(1);
            expect(roundInfo.participantCount).to.equal(0);
            expect(roundInfo.prizePool).to.equal(ethers.parseEther("10"));
            expect(roundInfo.state).to.equal(0); // OPEN
        });

        it("Should reset round correctly after winner selection", async function () {
            // Enter 5 participants
            for (let i = 0; i < 5; i++) {
                const user = [user1, user2, user3, user4, user5][i];
                await chainLuckVault.connect(owner).enter(user.address);
            }
            
            // Check new round started
            const roundInfo = await chainLuckVault.getCurrentRoundInfo();
            expect(roundInfo.roundId).to.equal(2);
            expect(roundInfo.participantCount).to.equal(0);
            expect(roundInfo.state).to.equal(0); // OPEN
        });

        it("Should allow manual round reset by owner", async function () {
            await expect(chainLuckVault.resetRound())
                .to.emit(chainLuckVault, "RoundReset")
                .withArgs(1, 2);
        });
    });

    describe("Configuration Updates", function () {
        it("Should allow owner to update entry fee", async function () {
            const newFeeUSD = ethers.parseUnits("2", 8); // $2 USD
            
            await expect(chainLuckVault.setEntryFeeUSD(newFeeUSD))
                .to.emit(chainLuckVault, "ConfigUpdated")
                .withArgs(winnersPerDraw, minParticipants, newFeeUSD);
            
            expect(await chainLuckVault.entryFeeUSD()).to.equal(newFeeUSD);
        });

        it("Should allow owner to update winners per draw", async function () {
            const newWinners = 3;
            
            await expect(chainLuckVault.setWinnersPerDraw(newWinners))
                .to.emit(chainLuckVault, "ConfigUpdated");
            
            expect(await chainLuckVault.winnersPerDraw()).to.equal(newWinners);
        });

        it("Should allow owner to update minimum participants", async function () {
            const newMinParticipants = 10;
            
            await expect(chainLuckVault.setMinParticipants(newMinParticipants))
                .to.emit(chainLuckVault, "ConfigUpdated");
            
            expect(await chainLuckVault.minParticipants()).to.equal(newMinParticipants);
        });
    });

    describe("Security and Access Control", function () {
        it("Should prevent non-owner from updating configuration", async function () {
            await expect(chainLuckVault.connect(user1).setWinnersPerDraw(3))
                .to.be.revertedWithCustomError(chainLuckVault, "OwnableUnauthorizedAccount");
        });

        it("Should prevent non-owner from manual round reset", async function () {
            await expect(chainLuckVault.connect(user1).resetRound())
                .to.be.revertedWithCustomError(chainLuckVault, "OwnableUnauthorizedAccount");
        });

        it("Should prevent duplicate entries", async function () {
            await chainLuckVault.connect(owner).enter(user1.address);
            
            await expect(chainLuckVault.connect(owner).enter(user1.address))
                .to.be.revertedWith("User already entered this round");
        });
    });

    describe("Emergency Functions", function () {
        it("Should allow emergency withdrawal by owner", async function () {
            const contractBalance = await ethers.provider.getBalance(await chainLuckVault.getAddress());
            const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
            
            const tx = await chainLuckVault.emergencyWithdraw();
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed * receipt.gasPrice;
            
            const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
            expect(ownerBalanceAfter).to.equal(ownerBalanceBefore + contractBalance - gasUsed);
        });

        it("Should prevent non-owner from emergency withdrawal", async function () {
            await expect(chainLuckVault.connect(user1).emergencyWithdraw())
                .to.be.revertedWithCustomError(chainLuckVault, "OwnableUnauthorizedAccount");
        });
    });

    describe("Integration Tests", function () {
        it("Should handle complete lottery cycle with fees", async function () {
            const entryFee = await chainLuckVault.getEntryFeeInETH();
            
            // Enter 5 participants with fees
            for (let i = 0; i < 5; i++) {
                const user = [user1, user2, user3, user4, user5][i];
                await chainLuckVault.connect(user).enter({ value: entryFee });
            }
            
            // Verify new round started
            const roundInfo = await chainLuckVault.getCurrentRoundInfo();
            expect(roundInfo.roundId).to.equal(2);
            expect(roundInfo.participantCount).to.equal(0);
            
            // Check that entry fees were added to prize pool
            expect(roundInfo.prizePool).to.be.gt(ethers.parseEther("10"));
        });

        it("Should handle price feed updates during lottery", async function () {
            // Enter some participants
            await chainLuckVault.connect(user1).enter({ value: await chainLuckVault.getEntryFeeInETH() });
            
            // Update price
            await mockPriceFeed.updatePrice(ethers.parseUnits("3000", 8));
            
            // New participants should use new price
            const newEntryFee = await chainLuckVault.getEntryFeeInETH();
            await chainLuckVault.connect(user2).enter({ value: newEntryFee });
            
            expect(newEntryFee).to.equal(ethers.parseEther("0.000333333333333333")); // Approximately $1/3000
        });
    });
}); 