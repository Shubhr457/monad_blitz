// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";

/**
 * @title MockVRFCoordinator
 * @dev Mock implementation of Chainlink VRF Coordinator for testing purposes
 */
contract MockVRFCoordinator is VRFCoordinatorV2Interface {
    uint256 private constant BLOCK_HASH_STORE_START = 256;
    uint256 private s_requestId = 1;
    uint256 private s_subscriptionId = 1;
    
    struct Subscription {
        uint96 balance;
        uint64 reqCount;
        address owner;
        address[] consumers;
    }
    
    mapping(uint64 => Subscription) private s_subscriptions;
    mapping(uint256 => address) private s_consumers;
    
    event RandomWordsRequested(
        bytes32 indexed keyHash,
        uint256 requestId,
        uint256 preSeed,
        uint64 indexed subId,
        uint16 minimumRequestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords,
        address indexed sender
    );
    
    event RandomWordsFulfilled(uint256 indexed requestId, uint256 outputSeed, uint96 payment, bool success);
    
    constructor() {
        // Create a default subscription for testing
        s_subscriptions[s_subscriptionId] = Subscription({
            balance: 100 ether,
            reqCount: 0,
            owner: msg.sender,
            consumers: new address[](0)
        });
    }
    
    function requestRandomWords(
        bytes32, // keyHash
        uint64 subId,
        uint16, // minimumRequestConfirmations
        uint32 callbackGasLimit,
        uint32 numWords
    ) external override returns (uint256) {
        require(s_subscriptions[subId].owner != address(0), "Subscription not found");
        require(numWords <= 500, "Too many random words requested");
        require(callbackGasLimit >= 20000, "Callback gas limit too low");
        
        uint256 requestId = s_requestId++;
        s_consumers[requestId] = msg.sender;
        
        emit RandomWordsRequested(
            bytes32(0),
            requestId,
            0,
            subId,
            3,
            callbackGasLimit,
            numWords,
            msg.sender
        );
        
        // In a real implementation, this would be handled by Chainlink nodes
        // For mock purposes, we'll fulfill immediately with pseudo-random numbers
        _fulfillRandomWords(requestId, numWords);
        
        return requestId;
    }
    
    function _fulfillRandomWords(uint256 requestId, uint32 numWords) internal {
        address consumer = s_consumers[requestId];
        require(consumer != address(0), "Consumer not found");
        
        uint256[] memory randomWords = new uint256[](numWords);
        for (uint32 i = 0; i < numWords; i++) {
            // Generate pseudo-random number for testing
            randomWords[i] = uint256(keccak256(abi.encodePacked(
                block.timestamp,
                block.prevrandao,
                requestId,
                i
            )));
        }
        
        try VRFConsumerBaseV2(consumer).rawFulfillRandomWords(requestId, randomWords) {
            emit RandomWordsFulfilled(requestId, randomWords[0], 0, true);
        } catch {
            emit RandomWordsFulfilled(requestId, 0, 0, false);
        }
    }
    
    // Mock subscription management functions
    function createSubscription() external override returns (uint64) {
        s_subscriptionId++;
        s_subscriptions[s_subscriptionId] = Subscription({
            balance: 0,
            reqCount: 0,
            owner: msg.sender,
            consumers: new address[](0)
        });
        return s_subscriptionId;
    }
    
    function addConsumer(uint64 subId, address consumer) external override {
        require(s_subscriptions[subId].owner == msg.sender, "Not subscription owner");
        s_subscriptions[subId].consumers.push(consumer);
    }
    
    function removeConsumer(uint64 subId, address consumer) external override {
        require(s_subscriptions[subId].owner == msg.sender, "Not subscription owner");
        address[] storage consumers = s_subscriptions[subId].consumers;
        for (uint256 i = 0; i < consumers.length; i++) {
            if (consumers[i] == consumer) {
                consumers[i] = consumers[consumers.length - 1];
                consumers.pop();
                break;
            }
        }
    }
    
    function cancelSubscription(uint64 subId, address to) external override {
        require(s_subscriptions[subId].owner == msg.sender, "Not subscription owner");
        uint96 balance = s_subscriptions[subId].balance;
        delete s_subscriptions[subId];
        if (balance > 0) {
            payable(to).transfer(balance);
        }
    }
    
    function requestSubscriptionOwnerTransfer(uint64, address) external pure override {
        // Mock implementation - do nothing
    }
    
    function acceptSubscriptionOwnerTransfer(uint64) external pure override {
        // Mock implementation - do nothing
    }
    
    function fundSubscription(uint64 subId) external payable override {
        require(s_subscriptions[subId].owner != address(0), "Subscription not found");
        s_subscriptions[subId].balance += uint96(msg.value);
    }
    
    function getSubscription(uint64 subId) external view override returns (
        uint96 balance,
        uint64 reqCount,
        address owner,
        address[] memory consumers
    ) {
        Subscription memory sub = s_subscriptions[subId];
        return (sub.balance, sub.reqCount, sub.owner, sub.consumers);
    }
    
    // Additional mock functions
    function fundSubscriptionWithToken(uint64, uint256, address) external pure override {
        // Mock implementation - do nothing
    }
} 