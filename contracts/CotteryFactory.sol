// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "./Cottery.sol";

contract CotteryFactory {
    address public latestCottery;
    address private tokenAddress;
    address private owner;
    uint256 private prizePool;

    constructor (address _tokenAddress, uint256 _prizePool){
        tokenAddress = _tokenAddress;
        owner = msg.sender;
        prizePool = _prizePool;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    function createCottery() public onlyOwner returns(address){
        Cottery newCottery = new Cottery(tokenAddress, owner, prizePool);
        latestCottery = address(newCottery);
        return latestCottery;
    }
}
