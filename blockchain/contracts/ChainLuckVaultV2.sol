// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract ChainLuckVaultV2 is Ownable, ReentrancyGuard, VRFConsumerBaseV2 {
    // Chainlink VRF Variables
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    uint64 private immutable i_subscriptionId;
    bytes32 private immutable i_gasLane;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    // Price Feed Interface
    AggregatorV3Interface private immutable i_priceFeed;

    // State variables
    uint256 public currentRoundId;
    uint256 public winnersPerDraw;
    uint256 public minParticipants;
    uint256 public entryFeeUSD; // Entry fee in USD (8 decimals)
    
    enum RoundState {
        OPEN,
        CALCULATING,
        CLOSED
    }
    
    struct Round {
        address[] participants;
        mapping(address => bool) hasEntered;
        uint256 prizePool;
        RoundState state;
        address[] winners;
        uint256 prizePerWinner;
        uint256 vrfRequestId;
        uint256 randomWord;
    }
    
    mapping(uint256 => Round) public rounds;
    mapping(uint256 => uint256) public vrfRequestToRound; // VRF request ID to round ID mapping
    
    // Events
    event Deposited(address indexed depositor, uint256 amount, uint256 roundId);
    event UserEntered(address indexed user, uint256 roundId, uint256 entryFee);
    event RandomnessRequested(uint256 roundId, uint256 requestId);
    event WinnersDrawn(uint256 roundId, address[] winners, uint256 prizePerWinner, uint256 randomWord);
    event PrizeDistributed(address indexed winner, uint256 amount, uint256 roundId);
    event RoundReset(uint256 oldRoundId, uint256 newRoundId);
    event ConfigUpdated(uint256 winnersPerDraw, uint256 minParticipants, uint256 entryFeeUSD);
    
    // Modifiers
    modifier roundOpen() {
        require(rounds[currentRoundId].state == RoundState.OPEN, "Round is not open");
        _;
    }
    
    modifier hasNotEntered() {
        require(!rounds[currentRoundId].hasEntered[msg.sender], "Already entered this round");
        _;
    }
    
    constructor(
        uint256 _winnersPerDraw,
        uint256 _minParticipants,
        uint256 _entryFeeUSD,
        address _vrfCoordinatorV2,
        uint64 _subscriptionId,
        bytes32 _gasLane,
        uint32 _callbackGasLimit,
        address _priceFeed
    ) 
        Ownable(msg.sender) 
        VRFConsumerBaseV2(_vrfCoordinatorV2)
    {
        winnersPerDraw = _winnersPerDraw;
        minParticipants = _minParticipants;
        entryFeeUSD = _entryFeeUSD;
        i_vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinatorV2);
        i_subscriptionId = _subscriptionId;
        i_gasLane = _gasLane;
        i_callbackGasLimit = _callbackGasLimit;
        i_priceFeed = AggregatorV3Interface(_priceFeed);
        
        currentRoundId = 1;
        rounds[currentRoundId].state = RoundState.OPEN;
    }

    /**
     * @dev Get the current ETH price in USD
     */
    function getLatestPrice() public view returns (int256) {
        (, int256 price, , , ) = i_priceFeed.latestRoundData();
        return price;
    }

    /**
     * @dev Calculate entry fee in ETH based on USD amount
     */
    function getEntryFeeInETH() public view returns (uint256) {
        if (entryFeeUSD == 0) return 0;
        
        int256 ethPriceUSD = getLatestPrice(); // 8 decimals
        require(ethPriceUSD > 0, "Invalid ETH price");
        
        // entryFeeUSD has 8 decimals, ethPriceUSD has 8 decimals
        // Result should be in wei (18 decimals)
        uint256 entryFeeETH = (entryFeeUSD * 1e18) / uint256(ethPriceUSD);
        return entryFeeETH;
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
     * @dev Enters a user into the current round with entry fee
     */
    function enter() external payable roundOpen hasNotEntered nonReentrant {
        uint256 entryFee = getEntryFeeInETH();
        require(msg.value >= entryFee, "Insufficient entry fee");
        
        Round storage round = rounds[currentRoundId];
        round.participants.push(msg.sender);
        round.hasEntered[msg.sender] = true;
        
        // Add entry fee to prize pool
        if (entryFee > 0) {
            round.prizePool += entryFee;
        }
        
        // Refund excess payment
        if (msg.value > entryFee) {
            payable(msg.sender).transfer(msg.value - entryFee);
        }
        
        emit UserEntered(msg.sender, currentRoundId, entryFee);
        
        // Auto-draw if we have enough participants
        if (round.participants.length >= minParticipants) {
            requestRandomWinner();
        }
    }

    /**
     * @dev Legacy function to enter another user (for backward compatibility)
     */
    function enter(address user) external roundOpen nonReentrant {
        require(user != address(0), "Invalid user address");
        require(!rounds[currentRoundId].hasEntered[user], "User already entered this round");
        
        Round storage round = rounds[currentRoundId];
        round.participants.push(user);
        round.hasEntered[user] = true;
        
        emit UserEntered(user, currentRoundId, 0);
        
        // Auto-draw if we have enough participants
        if (round.participants.length >= minParticipants) {
            requestRandomWinner();
        }
    }
    
    /**
     * @dev Request random number from Chainlink VRF
     */
    function requestRandomWinner() public roundOpen returns (uint256 requestId) {
        Round storage round = rounds[currentRoundId];
        require(round.participants.length >= winnersPerDraw, "Not enough participants");
        require(round.prizePool > 0, "No prize pool available");
        
        // Change state to calculating
        round.state = RoundState.CALCULATING;
        
        // Request randomness from Chainlink VRF
        requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        
        round.vrfRequestId = requestId;
        vrfRequestToRound[requestId] = currentRoundId;
        
        emit RandomnessRequested(currentRoundId, requestId);
        return requestId;
    }
    
    /**
     * @dev Callback function called by Chainlink VRF with random number
     */
    function fulfillRandomWords(
        uint256 requestId,
        uint256[] memory randomWords
    ) internal override {
        uint256 roundId = vrfRequestToRound[requestId];
        Round storage round = rounds[roundId];
        
        require(round.state == RoundState.CALCULATING, "Round not in calculating state");
        require(randomWords.length > 0, "No random words received");
        
        round.randomWord = randomWords[0];
        
        // Draw winners using the random number
        _drawWinnersWithRandomness(roundId, randomWords[0]);
    }
    
    /**
     * @dev Internal function to draw winners using Chainlink VRF randomness
     */
    function _drawWinnersWithRandomness(uint256 roundId, uint256 randomWord) internal {
        Round storage round = rounds[roundId];
        
        uint256 actualWinners = winnersPerDraw > round.participants.length ? 
            round.participants.length : winnersPerDraw;
        
        round.prizePerWinner = round.prizePool / actualWinners;
        
        // Use Chainlink VRF randomness for fair selection
        address[] memory selectedWinners = new address[](actualWinners);
        bool[] memory selected = new bool[](round.participants.length);
        
        for (uint256 i = 0; i < actualWinners; i++) {
            uint256 randomIndex;
            uint256 attempts = 0;
            
            do {
                // Generate different random numbers for each winner
                randomIndex = uint256(keccak256(abi.encode(randomWord, i, attempts))) % round.participants.length;
                attempts++;
            } while (selected[randomIndex] && attempts < 100);
            
            selected[randomIndex] = true;
            selectedWinners[i] = round.participants[randomIndex];
            round.winners.push(round.participants[randomIndex]);
        }
        
        // Distribute prizes
        for (uint256 i = 0; i < actualWinners; i++) {
            payable(selectedWinners[i]).transfer(round.prizePerWinner);
            emit PrizeDistributed(selectedWinners[i], round.prizePerWinner, roundId);
        }
        
        emit WinnersDrawn(roundId, selectedWinners, round.prizePerWinner, randomWord);
        
        // Mark round as closed
        round.state = RoundState.CLOSED;
        
        // Start new round
        _resetRound();
    }
    
    /**
     * @dev Internal function to reset the round and start a new one
     */
    function _resetRound() internal {
        uint256 oldRoundId = currentRoundId;
        currentRoundId++;
        rounds[currentRoundId].state = RoundState.OPEN;
        
        emit RoundReset(oldRoundId, currentRoundId);
    }
    
    /**
     * @dev Reset the round and start a new one (owner only)
     */
    function resetRound() public onlyOwner {
        rounds[currentRoundId].state = RoundState.CLOSED;
        _resetRound();
    }
    
    /**
     * @dev Update configuration parameters
     */
    function setWinnersPerDraw(uint256 _winnersPerDraw) external onlyOwner {
        require(_winnersPerDraw > 0, "Winners per draw must be greater than 0");
        winnersPerDraw = _winnersPerDraw;
        emit ConfigUpdated(winnersPerDraw, minParticipants, entryFeeUSD);
    }
    
    function setMinParticipants(uint256 _minParticipants) external onlyOwner {
        require(_minParticipants > 0, "Min participants must be greater than 0");
        minParticipants = _minParticipants;
        emit ConfigUpdated(winnersPerDraw, minParticipants, entryFeeUSD);
    }

    function setEntryFeeUSD(uint256 _entryFeeUSD) external onlyOwner {
        entryFeeUSD = _entryFeeUSD;
        emit ConfigUpdated(winnersPerDraw, minParticipants, entryFeeUSD);
    }
    
    // View functions
    function getCurrentRoundInfo() external view returns (
        uint256 roundId,
        uint256 participantCount,
        uint256 prizePool,
        RoundState state,
        uint256 entryFeeETH
    ) {
        Round storage round = rounds[currentRoundId];
        return (
            currentRoundId,
            round.participants.length,
            round.prizePool,
            round.state,
            getEntryFeeInETH()
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

    function getRoundState(uint256 roundId) external view returns (RoundState) {
        return rounds[roundId].state;
    }
    
    // Emergency functions
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        payable(owner()).transfer(balance);
    }
} 