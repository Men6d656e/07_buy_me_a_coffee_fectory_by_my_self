// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {CoffeeFactory} from "../src/CoffeeFactory.sol";

contract Deploy is Script {
    function setUp() public {}

    function run() public returns (CoffeeFactory) {
        vm.startBroadcast();

        CoffeeFactory factory = new CoffeeFactory();
        console2.log("CoffeeFactory deployed at:", address(factory));

        vm.stopBroadcast();
        return factory;
    }
}
