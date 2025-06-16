const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    console.log("🚀 Deploying ChainLuckVaultV2 on Monad with Mock Chainlink Integration...\n");

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", ethers.formatEther(await deployer.getBalance()), "ETH\n");

    // Step 1: Deploy Mock Chainlink Contracts
    console.log("📦 Step 1: Deploying Mock Chainlink Contracts...");
    
    // Deploy Mock Price Feed with initial ETH price ($2000)
    const MockPriceFeed = await ethers.getContractFactory("MockPriceFeed");
    const initialETHPrice = ethers.parseUnits("2000", 8); // $2000 with 8 decimals
    const mockPriceFeed = await MockPriceFeed.deploy(initialETHPrice);
    await mockPriceFeed.waitForDeployment();
    const priceFeedAddress = await mockPriceFeed.getAddress();
    console.log("✅ Mock Price Feed deployed to:", priceFeedAddress);

    // Deploy Mock VRF Coordinator
    const MockVRFCoordinator = await ethers.getContractFactory("MockVRFCoordinator");
    const mockVRFCoordinator = await MockVRFCoordinator.deploy();
    await mockVRFCoordinator.waitForDeployment();
    const vrfCoordinatorAddress = await mockVRFCoordinator.getAddress();
    console.log("✅ Mock VRF Coordinator deployed to:", vrfCoordinatorAddress);

    // Step 2: Create VRF Subscription
    console.log("\n🔗 Step 2: Setting up VRF Subscription...");
    const subscriptionId = 1; // Using default subscription from mock
    console.log("✅ Using subscription ID:", subscriptionId);

    // Step 3: Deploy ChainLuckVaultV2
    console.log("\n🎰 Step 3: Deploying ChainLuckVaultV2...");
    
    // Constructor parameters
    const winnersPerDraw = 2;
    const minParticipants = 5;
    const entryFeeUSD = ethers.parseUnits("1", 8); // $1 USD with 8 decimals
    const gasLane = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const callbackGasLimit = 200000;

    console.log("Contract Parameters:");
    console.log("- Winners per draw:", winnersPerDraw);
    console.log("- Minimum participants:", minParticipants);
    console.log("- Entry fee USD:", ethers.formatUnits(entryFeeUSD, 8), "USD");
    console.log("- VRF Coordinator:", vrfCoordinatorAddress);
    console.log("- Subscription ID:", subscriptionId);
    console.log("- Gas Lane:", gasLane);
    console.log("- Callback Gas Limit:", callbackGasLimit);
    console.log("- Price Feed:", priceFeedAddress, "\n");

    const ChainLuckVaultV2 = await ethers.getContractFactory("ChainLuckVaultV2");
    const chainLuckVault = await ChainLuckVaultV2.deploy(
        winnersPerDraw,
        minParticipants,
        entryFeeUSD,
        vrfCoordinatorAddress,
        subscriptionId,
        gasLane,
        callbackGasLimit,
        priceFeedAddress
    );

    await chainLuckVault.waitForDeployment();
    const vaultAddress = await chainLuckVault.getAddress();
    console.log("✅ ChainLuckVaultV2 deployed to:", vaultAddress);

    // Step 4: Add ChainLuck contract as VRF consumer
    console.log("\n🔗 Step 4: Adding contract as VRF consumer...");
    await mockVRFCoordinator.addConsumer(subscriptionId, vaultAddress);
    console.log("✅ Contract added as VRF consumer");

    // Step 5: Fund the vault with initial prize pool
    console.log("\n💰 Step 5: Adding initial prize pool...");
    const initialPrizePool = ethers.parseEther("1.0"); // 1 ETH
    await chainLuckVault.deposit({ value: initialPrizePool });
    console.log("✅ Added", ethers.formatEther(initialPrizePool), "ETH to prize pool");

    // Save deployment info
    const deploymentInfo = {
        network: "monad",
        timestamp: new Date().toISOString(),
        deployer: deployer.address,
        contracts: {
            chainLuckVault: {
                address: vaultAddress,
                constructorArgs: [
                    winnersPerDraw,
                    minParticipants,
                    entryFeeUSD.toString(),
                    vrfCoordinatorAddress,
                    subscriptionId,
                    gasLane,
                    callbackGasLimit,
                    priceFeedAddress
                ]
            },
            mockPriceFeed: {
                address: priceFeedAddress,
                initialPrice: initialETHPrice.toString()
            },
            mockVRFCoordinator: {
                address: vrfCoordinatorAddress,
                subscriptionId: subscriptionId
            }
        },
        configuration: {
            winnersPerDraw,
            minParticipants,
            entryFeeUSD: ethers.formatUnits(entryFeeUSD, 8) + " USD",
            initialPrizePool: ethers.formatEther(initialPrizePool) + " ETH"
        }
    };

    // Write deployment info to file
    const fs = require("fs");
    fs.writeFileSync(
        "deployment-monad-v2.json",
        JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("\n📝 Deployment info saved to deployment-monad-v2.json");

    // Display summary
    console.log("\n" + "=".repeat(60));
    console.log("🎉 DEPLOYMENT COMPLETE!");
    console.log("=".repeat(60));
    console.log("🎰 ChainLuck Vault V2:", vaultAddress);
    console.log("📊 Mock Price Feed:", priceFeedAddress);
    console.log("🎲 Mock VRF Coordinator:", vrfCoordinatorAddress);
    console.log("💰 Initial Prize Pool:", ethers.formatEther(initialPrizePool), "ETH");
    console.log("🎯 Entry Fee:", ethers.formatUnits(entryFeeUSD, 8), "USD");
    
    console.log("\n🔗 Next Steps:");
    console.log("1. Test the lottery functionality:");
    console.log("   - Users can call enter() with entry fee");
    console.log("   - Winners are selected using Chainlink VRF");
    console.log("   - Entry fees are calculated based on USD price feed");
    console.log("2. Monitor events for RandomnessRequested and WinnersDrawn");
    console.log("3. Consider deploying to other networks with real Chainlink");
    
    console.log("\n✨ Happy testing on Monad!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    }); 