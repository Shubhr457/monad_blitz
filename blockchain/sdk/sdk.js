const { ethers } = require('ethers');

// ChainLuckVault ABI - only the functions we need for integration
const CHAINLUCK_ABI = [
  "function enter(address user) external",
  "function deposit() external payable",
  "function getCurrentRoundInfo() external view returns (uint256 roundId, uint256 participantCount, uint256 prizePool, bool isActive)",
  "function hasUserEnteredCurrent(address user) external view returns (bool)",
  "function winnersPerDraw() external view returns (uint256)",
  "function minParticipants() external view returns (uint256)",
  "event UserEntered(address indexed user, uint256 roundId)",
  "event WinnersDrawn(uint256 roundId, address[] winners, uint256 prizePerWinner)",
  "event PrizeDistributed(address indexed winner, uint256 amount, uint256 roundId)"
];

class ChainLuckSDK {
  constructor(contractAddress, provider) {
    this.contractAddress = contractAddress;
    this.provider = provider;
    this.contract = new ethers.Contract(contractAddress, CHAINLUCK_ABI, provider);
  }

  /**
   * Enter a user into the current jackpot round
   * @param {string} userAddress - The user's wallet address
   * @param {object} signer - Ethers signer object
   * @returns {Promise<object>} Transaction receipt
   */
  async enterUser(userAddress, signer) {
    try {
      const contractWithSigner = this.contract.connect(signer);
      const tx = await contractWithSigner.enter(userAddress);
      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt.hash,
        roundId: await this.getCurrentRoundId(),
        receipt
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }

  /**
   * Check if a user has already entered the current round
   * @param {string} userAddress - The user's wallet address
   * @returns {Promise<boolean>} True if user has entered current round
   */
  async hasUserEntered(userAddress) {
    try {
      return await this.contract.hasUserEnteredCurrent(userAddress);
    } catch (error) {
      console.error('Error checking user entry status:', error);
      return false;
    }
  }

  /**
   * Get current round information
   * @returns {Promise<object>} Round information
   */
  async getCurrentRoundInfo() {
    try {
      const [roundId, participantCount, prizePool, isActive] = await this.contract.getCurrentRoundInfo();
      
      return {
        roundId: roundId.toString(),
        participantCount: participantCount.toString(),
        prizePool: ethers.formatEther(prizePool),
        isActive,
        prizePoolWei: prizePool.toString()
      };
    } catch (error) {
      console.error('Error getting round info:', error);
      return null;
    }
  }

  /**
   * Get the current round ID
   * @returns {Promise<string>} Current round ID
   */
  async getCurrentRoundId() {
    try {
      const roundInfo = await this.getCurrentRoundInfo();
      return roundInfo ? roundInfo.roundId : '0';
    } catch (error) {
      console.error('Error getting current round ID:', error);
      return '0';
    }
  }

  /**
   * Get configuration parameters
   * @returns {Promise<object>} Configuration object
   */
  async getConfig() {
    try {
      const [winnersPerDraw, minParticipants] = await Promise.all([
        this.contract.winnersPerDraw(),
        this.contract.minParticipants()
      ]);

      return {
        winnersPerDraw: winnersPerDraw.toString(),
        minParticipants: minParticipants.toString()
      };
    } catch (error) {
      console.error('Error getting config:', error);
      return null;
    }
  }

  /**
   * Listen for user entry events
   * @param {function} callback - Callback function to handle events
   * @returns {object} Event listener that can be removed
   */
  onUserEntered(callback) {
    const filter = this.contract.filters.UserEntered();
    const listener = (user, roundId, event) => {
      callback({
        user,
        roundId: roundId.toString(),
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber
      });
    };

    this.contract.on(filter, listener);
    return {
      remove: () => this.contract.off(filter, listener)
    };
  }

  /**
   * Listen for winner draw events
   * @param {function} callback - Callback function to handle events
   * @returns {object} Event listener that can be removed
   */
  onWinnersDrawn(callback) {
    const filter = this.contract.filters.WinnersDrawn();
    const listener = (roundId, winners, prizePerWinner, event) => {
      callback({
        roundId: roundId.toString(),
        winners,
        prizePerWinner: ethers.formatEther(prizePerWinner),
        prizePerWinnerWei: prizePerWinner.toString(),
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber
      });
    };

    this.contract.on(filter, listener);
    return {
      remove: () => this.contract.off(filter, listener)
    };
  }

  /**
   * Listen for prize distribution events for a specific user
   * @param {string} userAddress - User address to listen for
   * @param {function} callback - Callback function to handle events
   * @returns {object} Event listener that can be removed
   */
  onUserWon(userAddress, callback) {
    const filter = this.contract.filters.PrizeDistributed(userAddress);
    const listener = (winner, amount, roundId, event) => {
      callback({
        winner,
        amount: ethers.formatEther(amount),
        amountWei: amount.toString(),
        roundId: roundId.toString(),
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber
      });
    };

    this.contract.on(filter, listener);
    return {
      remove: () => this.contract.off(filter, listener)
    };
  }

  /**
   * Fund the vault (for protocols/sponsors)
   * @param {string} amount - Amount in ETH
   * @param {object} signer - Ethers signer object
   * @returns {Promise<object>} Transaction receipt
   */
  async fundVault(amount, signer) {
    try {
      const contractWithSigner = this.contract.connect(signer);
      const tx = await contractWithSigner.deposit({
        value: ethers.parseEther(amount)
      });
      const receipt = await tx.wait();
      
      return {
        success: true,
        transactionHash: receipt.hash,
        amount,
        receipt
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }
}

// Helper functions for common integration patterns

/**
 * Simple integration function for dApps
 * @param {object} provider - Ethers provider
 * @param {string} vaultAddress - ChainLuck vault contract address
 * @param {string} userAddress - User wallet address
 * @returns {Promise<object>} Entry result
 */
async function enterUser(provider, vaultAddress, userAddress) {
  try {
    const signer = await provider.getSigner();
    const sdk = new ChainLuckSDK(vaultAddress, provider);
    
    // Check if user already entered
    const hasEntered = await sdk.hasUserEntered(userAddress);
    if (hasEntered) {
      return {
        success: false,
        error: 'User already entered this round'
      };
    }

    return await sdk.enterUser(userAddress, signer);
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Check if user can participate (hasn't entered current round)
 * @param {object} provider - Ethers provider  
 * @param {string} vaultAddress - ChainLuck vault contract address
 * @param {string} userAddress - User wallet address
 * @returns {Promise<boolean>} True if user can participate
 */
async function canUserParticipate(provider, vaultAddress, userAddress) {
  try {
    const sdk = new ChainLuckSDK(vaultAddress, provider);
    const hasEntered = await sdk.hasUserEntered(userAddress);
    return !hasEntered;
  } catch (error) {
    console.error('Error checking user participation status:', error);
    return false;
  }
}

/**
 * Get current jackpot info for display
 * @param {object} provider - Ethers provider
 * @param {string} vaultAddress - ChainLuck vault contract address
 * @returns {Promise<object>} Jackpot information
 */
async function getJackpotInfo(provider, vaultAddress) {
  try {
    const sdk = new ChainLuckSDK(vaultAddress, provider);
    const [roundInfo, config] = await Promise.all([
      sdk.getCurrentRoundInfo(),
      sdk.getConfig()
    ]);

    if (!roundInfo || !config) {
      return null;
    }

    return {
      currentPrize: roundInfo.prizePool,
      participants: roundInfo.participantCount,
      winnersPerDraw: config.winnersPerDraw,
      minParticipants: config.minParticipants,
      roundId: roundInfo.roundId,
      isActive: roundInfo.isActive,
      prizePerWinner: roundInfo.prizePool && config.winnersPerDraw ? 
        (parseFloat(roundInfo.prizePool) / parseInt(config.winnersPerDraw)).toFixed(4) : '0'
    };
  } catch (error) {
    console.error('Error getting jackpot info:', error);
    return null;
  }
}

// Export SDK and helper functions
module.exports = {
  ChainLuckSDK,
  enterUser,
  canUserParticipate,
  getJackpotInfo,
  CHAINLUCK_ABI
}; 