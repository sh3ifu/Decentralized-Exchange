// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "./Exchange.sol";

contract Factory {
    address[] public tokenAddresses;
    mapping(address => address) public tokenToExchange;    
    
    function createExchange(address _tokenAddress) public returns (address) {
        require(_tokenAddress != address(0), "invalid token address");
        require(tokenToExchange[_tokenAddress] == address(0), "exchange already exist");

        Exchange exchange = new Exchange(_tokenAddress);
        tokenToExchange[_tokenAddress] = address(exchange);
        tokenAddresses.push(_tokenAddress);
        return address(exchange);
    }

    function getAllTokenAddresses() public view returns (address[] memory) {
        return tokenAddresses;
    }

    function getExchange(address _tokenAddress) public view returns(address){
        return tokenToExchange[_tokenAddress];
    }
}