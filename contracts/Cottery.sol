// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "./CaramelToken.sol";

contract Cottery {
    address public owner;
    uint256 public prizePool;
    CaramelToken private token;

    address public highestBidder;
    uint256 public highestBid;

    bool public auctionEnded;

    constructor(address tokenAddress, address _owner, uint256 _prizePool) {
        token = CaramelToken(tokenAddress);
        owner = _owner;
        prizePool = _prizePool;
        auctionEnded = false;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier auctionNotEnded() {
        require(!auctionEnded, "Auction has already ended");
        _;
    }

    function placeBid(uint256 bidAmount) external auctionNotEnded {
        require(bidAmount > highestBid, "Bid amount must be higher than current highest bid");
        require(token.balanceOf(msg.sender) >= bidAmount, "Insufficient balance");

        token.transferFrom(msg.sender, address(this), bidAmount);

        highestBidder = msg.sender;
        highestBid = bidAmount;
    }

    function endAuction() external onlyOwner auctionNotEnded {
        auctionEnded = true;

        // Спалюємо всі токени, які надійшли на контракт під час ставок
        token._burn(address(this), token.balanceOf(address(this)));

        if (highestBidder != address(0)) {
            // Мінтим нові токени переможцю
            token._mint(highestBidder, prizePool);
        }

        // emit AuctionEnded(highestBidder, highestBid);
    }

    // event AuctionEnded(address winner, uint256 winningBid);
}
