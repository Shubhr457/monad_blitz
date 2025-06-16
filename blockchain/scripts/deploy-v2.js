const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    console.log("🚀 Deploying ChainLuckVaultV2 with Chainlink Integration...\n");

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", ethers.formatEther(await deployer.getBalance()), "ETH\n");

    // Network-specific Chainlink configurations
    const chainlinkConfig = getChainlinkConfig(network.name);
    console.log("Network:", network.name);
    console.log("Chainlink Config:", chainlinkConfig, "\n");

    // Constructor parameters
    const winnersPerDraw = 2;
    const minParticipants = 5;
    const entryFeeUSD = ethers.parseUnits("1", 8); // $1 USD with 8 decimals

    console.log("Contract Parameters:");
    console.log("- Winners per draw:", winnersPerDraw);
    console.log("- Minimum participants:", minParticipants);
    console.log("- Entry fee USD:", ethers.formatUnits(entryFeeUSD, 8), "USD");
    console.log("- VRF Coordinator:", chainlinkConfig.vrfCoordinator);
    console.log("- Subscription ID:", chainlinkConfig.subscriptionId);
    console.log("- Gas Lane:", chainlinkConfig.gasLane);
    console.log("- Callback Gas Limit:", chainlinkConfig.callbackGasLimit);
    console.log("- Price Feed:", chainlinkConfig.priceFeed, "\n");

    // Deploy the contract
    const ChainLuckVaultV2 = await ethers.getContractFactory("ChainLuckVaultV2");
    const contract = await ChainLuckVaultV2.deploy(
        winnersPerDraw,
        minParticipants,
        entryFeeUSD,
        chainlinkConfig.vrfCoordinator,
        chainlinkConfig.subscriptionId,
        chainlinkConfig.gasLane,
        chainlinkConfig.callbackGasLimit,
        chainlinkConfig.priceFeed
    );

    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();

    console.log("✅ ChainLuckVaultV2 deployed to:", contractAddress);
    
    // Save deployment info
    const deploymentInfo = {
        network: network.name,
        contractAddress: contractAddress,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        constructorArgs: [
            winnersPerDraw,
            minParticipants,
            entryFeeUSD.toString(),
            chainlinkConfig.vrfCoordinator,
            chainlinkConfig.subscriptionId,
            chainlinkConfig.gasLane,
            chainlinkConfig.callbackGasLimit,
            chainlinkConfig.priceFeed
        ],
        chainlinkConfig: chainlinkConfig
    };

    // Write deployment info to file
    const fs = require("fs");
    fs.writeFileSync(
        "deployment-v2.json",
        JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("\n📝 Deployment info saved to deployment-v2.json");
    
    // Wait for a few blocks before verification
    console.log("\n⏳ Waiting for block confirmations...");
    await contract.deploymentTransaction().wait(5);

    console.log("\n🔗 IMPORTANT: Next Steps:");
    console.log("1. Create and fund a Chainlink VRF subscription at https://vrf.chain.link/");
    console.log("2. Add the deployed contract as a consumer to your VRF subscription");
    console.log("3. Update the subscriptionId in your deployment if needed");
    console.log("4. Fund the contract with ETH for prize pools");
    console.log("\n✨ Deployment completed successfully!");
}

function getChainlinkConfig(networkName) {
    const configs = {
        // Ethereum Mainnet
        mainnet: {
            vrfCoordinator: "0x271682DEB8C4E0901D1a1550aD2e64D568E69909",
            gasLane: "0x9fe0eebf5e446e3c998ec9bb19951541aee00bb90ea201ae456421a2ded86805",
            subscriptionId: 1, // You need to create this
            callbackGasLimit: 200000,
            priceFeed: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419" // ETH/USD
        },
        
        // Ethereum Sepolia Testnet
        sepolia: {
            vrfCoordinator: "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
            gasLane: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
            subscriptionId: 1, // You need to create this
            callbackGasLimit: 200000,
            priceFeed: "0x694AA1769357215DE4FAC081bf1f309aDC325306" // ETH/USD
        },

        // Polygon Mainnet
        polygon: {
            vrfCoordinator: "0xAE975071Be8F8eE67addBC1A82488F1C24858067",
            gasLane: "0x6e099d640cde6de9d40ac749b4b594126b0169747122711109c9985d47751f93",
            subscriptionId: 1,
            callbackGasLimit: 200000,
            priceFeed: "0xF9680D99D6C9589e2a93a78A04A279e509205945" // ETH/USD
        },

        // BSC Mainnet
        bsc: {
            vrfCoordinator: "0xc587d9053cd1118f25F645F9E08BB98c9712A4EE",
            gasLane: "0x17cd473250a9a479dc7f234c64332ed4bc8af9e8ded7556aa6e66d83da49f470",
            subscriptionId: 1,
            callbackGasLimit: 200000,
            priceFeed: "0x9ef1B8c0E4F7dc8bF5719Ea496883DC6401d5b2e" // ETH/USD
        },

        // For Monad (assuming no native Chainlink yet - using mock addresses)
        monad: {
            vrfCoordinator: "0x0000000000000000000000000000000000000000", // Deploy mock VRF
            gasLane: "0x0000000000000000000000000000000000000000000000000000000000000000",
            subscriptionId: 1,
            callbackGasLimit: 200000,
            priceFeed: "0x0000000000000000000000000000000000000000" // Deploy mock price feed
        },

        // Default/localhost configuration
        localhost: {
            vrfCoordinator: "0x0000000000000000000000000000000000000000",
            gasLane: "0x0000000000000000000000000000000000000000000000000000000000000000",
            subscriptionId: 1,
            callbackGasLimit: 200000,
            priceFeed: "0x0000000000000000000000000000000000000000"
        }
    };

    return configs[networkName] || configs.localhost;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    }); 