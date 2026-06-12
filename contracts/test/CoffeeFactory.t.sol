// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {CoffeeFactory} from "../src/CoffeeFactory.sol";
import {BuyMeACoffee} from "../src/BuyMeACoffee.sol";

contract CoffeeFactoryTest is Test {
    CoffeeFactory public factory;
    address public creator = address(0x1111);
    address public fan = address(0x2222);
    address public other = address(0x3333);

    function setUp() public {
        factory = new CoffeeFactory();
        vm.deal(creator, 10 ether);
        vm.deal(fan, 10 ether);
        vm.deal(other, 10 ether);
    }

    function test_DeployFactory() public view {
        assertEq(factory.getCreatorsCount(), 0);
    }

    function test_CreateCoffeeContract() public {
        vm.prank(creator);
        address coffeeAddress = factory.createCoffeeContract();

        assertTrue(coffeeAddress != address(0));
        assertTrue(factory.hasCoffeeContract(creator));
        assertEq(factory.getCoffeeContract(creator), coffeeAddress);
        assertEq(factory.getCreatorsCount(), 1);

        BuyMeACoffee coffee = BuyMeACoffee(coffeeAddress);
        assertEq(coffee.OWNER(), creator);
    }

    function test_RevertIfCreateCoffeeContractTwice() public {
        vm.prank(creator);
        factory.createCoffeeContract();

        vm.prank(creator);
        vm.expectRevert(CoffeeFactory.ContractAlreadyExists.selector);
        factory.createCoffeeContract();
    }

    function test_BuyCoffee() public {
        vm.prank(creator);
        address coffeeAddress = factory.createCoffeeContract();
        BuyMeACoffee coffee = BuyMeACoffee(coffeeAddress);

        vm.prank(fan);
        coffee.buyCoffee{value: 1 ether}("Alice", "Great project!");

        assertEq(address(coffee).balance, 1 ether);
        assertEq(coffee.totalRevenue(), 1 ether);

        BuyMeACoffee.Memo[] memory memos = coffee.getMemos();
        assertEq(memos.length, 1);
        assertEq(memos[0].sender, fan);
        assertEq(memos[0].name, "Alice");
        assertEq(memos[0].message, "Great project!");
        assertEq(memos[0].amount, 1 ether);
    }

    function test_RevertBuyCoffeeWithZeroValue() public {
        vm.prank(creator);
        address coffeeAddress = factory.createCoffeeContract();
        BuyMeACoffee coffee = BuyMeACoffee(coffeeAddress);

        vm.prank(fan);
        vm.expectRevert(BuyMeACoffee.InsufficientEth.selector);
        coffee.buyCoffee{value: 0}("Alice", "Free coffee?");
    }

    function test_WithdrawSuccess() public {
        vm.prank(creator);
        address coffeeAddress = factory.createCoffeeContract();
        BuyMeACoffee coffee = BuyMeACoffee(coffeeAddress);

        vm.prank(fan);
        coffee.buyCoffee{value: 2 ether}("Bob", "Support!");

        uint256 creatorBalBefore = creator.balance;

        vm.prank(creator);
        coffee.withdraw();

        assertEq(address(coffee).balance, 0);
        assertEq(creator.balance, creatorBalBefore + 2 ether);
        // Revenue tracker remains persistent
        assertEq(coffee.totalRevenue(), 2 ether);
    }

    function test_RevertWithdrawNotOwner() public {
        vm.prank(creator);
        address coffeeAddress = factory.createCoffeeContract();
        BuyMeACoffee coffee = BuyMeACoffee(coffeeAddress);

        vm.prank(fan);
        coffee.buyCoffee{value: 2 ether}("Bob", "Support!");

        vm.prank(other);
        vm.expectRevert(BuyMeACoffee.OnlyOwner.selector);
        coffee.withdraw();
    }

    function test_RevertWithdrawZeroBalance() public {
        vm.prank(creator);
        address coffeeAddress = factory.createCoffeeContract();
        BuyMeACoffee coffee = BuyMeACoffee(coffeeAddress);

        vm.prank(creator);
        vm.expectRevert(BuyMeACoffee.InsufficientEth.selector);
        coffee.withdraw();
    }
}
