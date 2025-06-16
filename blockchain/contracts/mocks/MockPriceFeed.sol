// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * @title MockPriceFeed
 * @dev Mock implementation of Chainlink Price Feed for testing purposes
 */
contract MockPriceFeed is AggregatorV3Interface {
    uint8 public constant override decimals = 8;
    string public constant override description = "ETH / USD";
    uint256 public constant override version = 1;

    struct RoundData {
        uint80 roundId;
        int256 answer;
        uint256 startedAt;
        uint256 updatedAt;
        uint80 answeredInRound;
    }

    mapping(uint80 => RoundData) private s_rounds;
    uint80 private s_latestRoundId;
    int256 private s_latestPrice;

    event AnswerUpdated(int256 indexed current, uint256 indexed roundId, uint256 updatedAt);
    event NewRound(uint256 indexed roundId, address indexed startedBy, uint256 startedAt);

    constructor(int256 _initialPrice) {
        s_latestPrice = _initialPrice;
        s_latestRoundId = 1;
        
        s_rounds[s_latestRoundId] = RoundData({
            roundId: s_latestRoundId,
            answer: _initialPrice,
            startedAt: block.timestamp,
            updatedAt: block.timestamp,
            answeredInRound: s_latestRoundId
        });
    }

    function latestRoundData() external view override returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        RoundData memory data = s_rounds[s_latestRoundId];
        return (
            data.roundId,
            data.answer,
            data.startedAt,
            data.updatedAt,
            data.answeredInRound
        );
    }

    function getRoundData(uint80 _roundId) external view override returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
        RoundData memory data = s_rounds[_roundId];
        require(data.roundId != 0, "Round not found");
        
        return (
            data.roundId,
            data.answer,
            data.startedAt,
            data.updatedAt,
            data.answeredInRound
        );
    }

    // Mock functions for testing
    function updatePrice(int256 _price) external {
        s_latestRoundId++;
        s_latestPrice = _price;
        
        s_rounds[s_latestRoundId] = RoundData({
            roundId: s_latestRoundId,
            answer: _price,
            startedAt: block.timestamp,
            updatedAt: block.timestamp,
            answeredInRound: s_latestRoundId
        });
        
        emit NewRound(s_latestRoundId, msg.sender, block.timestamp);
        emit AnswerUpdated(_price, s_latestRoundId, block.timestamp);
    }

    function simulateMarketMovement() external {
        // Simulate price movement for testing (±5% from current price)
        int256 currentPrice = s_latestPrice;
        int256 change = (currentPrice * int256(_pseudoRandom() % 10 - 5)) / 100; // ±5%
        int256 newPrice = currentPrice + change;
        
        // Ensure price stays positive and reasonable ($500 - $10000 range)
        if (newPrice < 50000000000) newPrice = 50000000000; // $500 min
        if (newPrice > 1000000000000) newPrice = 1000000000000; // $10000 max
        
        updatePrice(newPrice);
    }

    function _pseudoRandom() private view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            s_latestRoundId
        )));
    }

    // Additional view functions for convenience
    function getLatestPrice() external view returns (int256) {
        return s_latestPrice;
    }

    function getLatestRoundId() external view returns (uint80) {
        return s_latestRoundId;
    }
} 