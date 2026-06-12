// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title BuyMeACoffee
 * @dev Implementation contract for tipping, messaging, and withdrawals.
 */
contract BuyMeACoffee {
    // Custom Errors for gas optimization
    error InsufficientEth();
    error WithdrawFailed();
    error OnlyOwner();

    // Struct to represent a tipping memo
    struct Memo {
        address sender;
        uint256 timestamp;
        string name;
        string message;
        uint256 amount;
    }

    // State Variables
    address public immutable OWNER;
    Memo[] public memos;
    uint256 public totalRevenue;

    // Events
    event NewMemo(
        address indexed sender,
        uint256 indexed timestamp,
        string name,
        string message,
        uint256 amount
    );
    event Withdrawal(address indexed owner, uint256 amount);

    /**
     * @dev Sets the owner of the coffee contract.
     * @param _owner The address of the creator who receives the funds.
     */
    constructor(address _owner) {
        OWNER = _owner;
    }

    /**
     * @dev Allows users to buy a coffee by sending ETH and leaving a memo.
     * @param name The name of the person buying the coffee.
     * @param message The message left by the buyer.
     */
    function buyCoffee(string calldata name, string calldata message) external payable {
        if (msg.value == 0) {
            revert InsufficientEth();
        }

        // Add memo to storage
        memos.push(Memo({
            sender: msg.sender,
            timestamp: block.timestamp,
            name: name,
            message: message,
            amount: msg.value
        }));

        totalRevenue += msg.value;

        emit NewMemo(msg.sender, block.timestamp, name, message, msg.value);
    }

    /**
     * @dev Allows the owner to withdraw the entire contract balance to their wallet.
     */
    function withdraw() external {
        if (msg.sender != OWNER) {
            revert OnlyOwner();
        }

        uint256 balance = address(this).balance;
        if (balance == 0) {
            revert InsufficientEth();
        }

        (bool success, ) = OWNER.call{value: balance}("");
        if (!success) {
            revert WithdrawFailed();
        }

        emit Withdrawal(OWNER, balance);
    }

    /**
     * @dev Returns all memos stored in the contract.
     */
    function getMemos() external view returns (Memo[] memory) {
        return memos;
    }
}
