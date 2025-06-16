const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting ChainLuckVault deployment...");

  // Get the contract factory
  const ChainLuckVault = await ethers.getContractFactory("ChainLuckVault");

  // Deploy with initial parameters
  const winnersPerDraw = 2; // 2 winners per draw
  const minParticipants = 5; // Minimum 5 participants to trigger draw

  console.log(`📋 Deployment Parameters:`);
  console.log(`   Winners per draw: ${winnersPerDraw}`);
  console.log(`   Min participants: ${minParticipants}`);

  // Deploy the contract
  const chainLuckVault = await ChainLuckVault.deploy(winnersPerDraw, minParticipants);
  await chainLuckVault.waitForDeployment();

  const contractAddress = await chainLuckVault.getAddress();
  
  console.log(`✅ ChainLuckVault deployed successfully!`);
  console.log(`📍 Contract Address: ${contractAddress}`);
  console.log(`🔧 Network: ${network.name}`);
  
  // Verify deployment
  const deployedWinnersPerDraw = await chainLuckVault.winnersPerDraw();
  const deployedMinParticipants = await chainLuckVault.minParticipants();
  const currentRound = await chainLuckVault.currentRoundId();
  
  console.log(`\n📊 Deployment Verification:`);
  console.log(`   Winners per draw: ${deployedWinnersPerDraw}`);
  console.log(`   Min participants: ${deployedMinParticipants}`);
  console.log(`   Current round: ${currentRound}`);

  // Save deployment info
  const deploymentInfo = {
    contractAddress: contractAddress,
    network: network.name,
    chainId: network.config.chainId,
    winnersPerDraw: deployedWinnersPerDraw.toString(),
    minParticipants: deployedMinParticipants.toString(),
    deployedAt: new Date().toISOString(),
    deployer: await chainLuckVault.owner()
  };

  // Write deployment info for reference
  const fs = require('fs');
  fs.writeFileSync(
    'deployment.json',
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log(`💾 Deployment info saved to deployment.json`);
  console.log(`\n🎉 Deployment completed successfully!`);
  
  if (network.name === "monad") {
    console.log(`\n🔗 Contract deployed to: ${contractAddress}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 