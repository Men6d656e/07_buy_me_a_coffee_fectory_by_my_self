// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {BuyMeACoffee} from "./BuyMeACoffee.sol";

/**
 * @title CoffeeFactory
 * @dev Factory contract to deploy and track individual user BuyMeACoffee contracts.
 */
contract CoffeeFactory {
    error ContractAlreadyExists();

    // Mapping of creator address to their deployed BuyMeACoffee contract address
    mapping(address => address) public getCoffeeContract;
    
    // Array of all creators who have deployed contracts
    address[] public allCreators;

    // Event emitted when a new contract is deployed
    event CoffeeContractCreated(address indexed creator, address coffeeContract);

    /**
     * @dev Deploys a new BuyMeACoffee contract for the caller.
     * @return The address of the newly deployed contract.
     */
    function createCoffeeContract() external returns (address) {
        if (getCoffeeContract[msg.sender] != address(0)) {
            revert ContractAlreadyExists();
        }

        // Deploy the contract and set the caller as the owner
        BuyMeACoffee newContract = new BuyMeACoffee(msg.sender);
        address contractAddr = address(newContract);

        getCoffeeContract[msg.sender] = contractAddr;
        allCreators.push(msg.sender);

        emit CoffeeContractCreated(msg.sender, contractAddr);

        return contractAddr;
    }

    /**
     * @dev Helper to check if a creator has a contract.
     * @param creator The address of the creator.
     */
    function hasCoffeeContract(address creator) external view returns (bool) {
        return getCoffeeContract[creator] != address(0);
    }

    /**
     * @dev Returns the total number of creators.
     */
    function getCreatorsCount() external view returns (uint256) {
        return allCreators.length;
    }

    /**
     * @dev Returns all creators who have deployed contracts.
     */
    function getAllCreators() external view returns (address[] memory) {
        return allCreators;
    }
}
