// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract ChainLuckVault is Ownable, ReentrancyGuard {
    // State variables
    uint256 public currentRoundId;
    uint256 public winnersPerDraw;
    uint256 public minParticipants;
    
    struct Round {
        address[] participants;
        mapping(address => bool) hasEntered;
        uint256 prizePool;
        bool isActive;
        address[] winners;
        uint256 prizePerWinner;
    }
    
    mapping(uint256 => Round) public rounds;
    
    // Events
    event Deposited(address indexed depositor, uint256 amount, uint256 roundId);
    event UserEntered(address indexed user, uint256 roundId);
    event WinnersDrawn(uint256 roundId, address[] winners, uint256 prizePerWinner);
    event PrizeDistributed(address indexed winner, uint256 amount, uint256 roundId);
    event RoundReset(uint256 oldRoundId, uint256 newRoundId);
    event ConfigUpdated(uint256 winnersPerDraw, uint256 minParticipants);
    
    // Modifiers
    modifier roundActive() {
        require(rounds[currentRoundId].isActive, "Round is not active");
        _;
    }
    
    modifier hasNotEntered() {
        require(!rounds[currentRoundId].hasEntered[msg.sender], "Already entered this round");
        _;
    }
    
    constructor(uint256 _winnersPerDraw, uint256 _minParticipants) Ownable(msg.sender) {
        winnersPerDraw = _winnersPerDraw;
        minParticipants = _minParticipants;
        currentRoundId = 1;
        rounds[currentRoundId].isActive = true;
    }
    
    /**
     * @dev Allows protocols to deposit ETH into the current round's prize pool
     */
    function deposit() external payable nonReentrant {
        require(msg.value > 0, "Must deposit some ETH");
        
        rounds[currentRoundId].prizePool += msg.value;
        
        emit Deposited(msg.sender, msg.value, currentRoundId);
    }
    
    /**
     * @dev Enters a user into the current round
     * @param user The address of the user to enter
     */
    function enter(address user) external roundActive hasNotEntered {
        require(user != address(0), "Invalid user address");
        
        Round storage round = rounds[currentRoundId];
        round.participants.push(user);
        round.hasEntered[user] = true;
        
        emit UserEntered(user, currentRoundId);
        
        // Auto-draw if we have enough participants
        if(round.participants.length >= minParticipants) {
            _drawWinners();
        }
    }
    
    /**
     * @dev Manually trigger winner selection (owner only)
     */
    function drawWinners() external onlyOwner roundActive {
        Round storage round = rounds[currentRoundId];
        require(round.participants.length >= winnersPerDraw, "Not enough participants");
        
        _drawWinners();
    }
    
    /**
     * @dev Internal function to draw winners and distribute prizes
     */
    function _drawWinners() internal {
        Round storage round = rounds[currentRoundId];
        require(round.prizePool > 0, "No prize pool available");
        
        uint256 actualWinners = winnersPerDraw > round.participants.length ? 
            round.participants.length : winnersPerDraw;
        
        round.prizePerWinner = round.prizePool / actualWinners;
        
        // Simple random selection (note: not cryptographically secure, suitable for hackathon)
        address[] memory selectedWinners = new address[](actualWinners);
        bool[] memory selected = new bool[](round.participants.length);
        
        for(uint256 i = 0; i < actualWinners; i++) {
            uint256 randomIndex;
            uint256 attempts = 0;
            do {
                randomIndex = uint256(keccak256(abi.encodePacked(
                    block.timestamp, 
                    block.prevrandao, 
                    msg.sender, 
                    i,
                    attempts,
                    round.participants.length
                ))) % round.participants.length;
                attempts++;
            } while(selected[randomIndex] && attempts < 100); // Prevent infinite loop
            
            selected[randomIndex] = true;
            selectedWinners[i] = round.participants[randomIndex];
            round.winners.push(round.participants[randomIndex]);
        }
        
        // Distribute prizes
        for(uint256 i = 0; i < actualWinners; i++) {
            payable(selectedWinners[i]).transfer(round.prizePerWinner);
            emit PrizeDistributed(selectedWinners[i], round.prizePerWinner, currentRoundId);
        }
        
        emit WinnersDrawn(currentRoundId, selectedWinners, round.prizePerWinner);
        
        // Mark round as inactive
        round.isActive = false;
        
        // Start new round
        _resetRound();
    }
    
    /**
     * @dev Internal function to reset the round and start a new one
     */
    function _resetRound() internal {
        uint256 oldRoundId = currentRoundId;
        currentRoundId++;
        rounds[currentRoundId].isActive = true;
        
        emit RoundReset(oldRoundId, currentRoundId);
    }
    
    /**
     * @dev Reset the round and start a new one (owner only)
     */
    function resetRound() public onlyOwner {
        _resetRound();
    }
    
    /**
     * @dev Update configuration parameters
     */
    function setWinnersPerDraw(uint256 _winnersPerDraw) external onlyOwner {
        require(_winnersPerDraw > 0, "Winners per draw must be greater than 0");
        winnersPerDraw = _winnersPerDraw;
        emit ConfigUpdated(winnersPerDraw, minParticipants);
    }
    
    function setMinParticipants(uint256 _minParticipants) external onlyOwner {
        require(_minParticipants > 0, "Min participants must be greater than 0");
        minParticipants = _minParticipants;
        emit ConfigUpdated(winnersPerDraw, minParticipants);
    }
    
    // View functions
    function getCurrentRoundInfo() external view returns (
        uint256 roundId,
        uint256 participantCount,
        uint256 prizePool,
        bool isActive
    ) {
        Round storage round = rounds[currentRoundId];
        return (
            currentRoundId,
            round.participants.length,
            round.prizePool,
            round.isActive
        );
    }
    
    function getRoundParticipants(uint256 roundId) external view returns (address[] memory) {
        return rounds[roundId].participants;
    }
    
    function getRoundWinners(uint256 roundId) external view returns (address[] memory) {
        return rounds[roundId].winners;
    }
    
    function hasUserEntered(address user, uint256 roundId) external view returns (bool) {
        return rounds[roundId].hasEntered[user];
    }
    
    function hasUserEnteredCurrent(address user) external view returns (bool) {
        return rounds[currentRoundId].hasEntered[user];
    }
    
    // Emergency functions
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner()).transfer(balance);
    }
} 