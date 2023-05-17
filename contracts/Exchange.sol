// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IFactory {
    function getExchange(address _tokenAddress) external returns (address);
}

interface IExchange {
    function ethToTokenSwap(uint256 _minTokens) external payable;

    function ethToTokenTransfer(uint256 _minTokens, address _recipient)
        external
        payable;
}

contract Exchange is ERC20 {
    // Адрес токена
    address public tokenAddress;
    address public factoryAddress;

    // Конструктор в котором задаётся адрес токены для этой биржи(токен -> етх)
    // проверка не является ли адрес токена 0х0000...
    constructor(address _token) ERC20("GalaxySwap", "GLX") {
        require(_token != address(0), "Incorrect token address!");
        tokenAddress = _token;
        factoryAddress = msg.sender;
    }

    // Функция для добавления ликвидности, указывается в параметрах количество токенов для добавления,
    // создаётся экземпляр интферфейса токена,
    // запрашивается перевод токенов от инициатора транзакции на адрес контракта
    function addLiquidity(uint256 _tokenAmount) public payable returns (uint) {
        if (getReserve() == 0) {
            IERC20 token = IERC20(tokenAddress);
            token.transferFrom(msg.sender, address(this), _tokenAmount);

            uint liquidity = address(this).balance;
            _mint(msg.sender, liquidity);
            
            return liquidity;
        } else {
            uint ethReserve = address(this).balance - msg.value;
            uint tokenReserve = getReserve();
            uint tokenAmount = (msg.value * tokenReserve) / ethReserve;

            require(_tokenAmount >= tokenAmount, "insufficient token amount");
            IERC20 token = IERC20(tokenAddress);
            token.transferFrom(msg.sender, address(this), tokenAmount);

            uint liquidity = (totalSupply() * msg.value) / ethReserve;
            _mint(msg.sender, liquidity);
            return liquidity;
        }
    }

    function removeLiquidity(uint _amount) public returns (uint, uint) {
        require(_amount > 0, "invalid amount");

        uint ethAmount = (address(this).balance * _amount) / totalSupply();
        uint tokenAmount = (getReserve() * _amount) / totalSupply();

        _burn(msg.sender, _amount);
        payable(msg.sender).transfer(ethAmount);
        IERC20(tokenAddress).transfer(msg.sender, tokenAmount);
        
        return (ethAmount, tokenAmount);
    }

    // Функция для получения баланса токенов на контракте
    function getReserve() public view returns (uint256) {
        return IERC20(tokenAddress).balanceOf(address(this));
    }

    // Функция для расчёта количества обмениваемого актива, по формуле CPMM
    function getAmount(uint inputAmount, uint inputReserve, uint outputReserve) private pure returns (uint) {
        require(inputReserve > 0 && outputReserve > 0, "invalid reserves");

        uint256 inputAmountWithFee = (inputAmount * 995) / 1000;  // 0,5% комиссия
        uint256 numerator = inputAmountWithFee * outputReserve;
        uint256 denominator = (inputReserve * 1000) + (inputAmountWithFee * 995);        

        return numerator / denominator;
    }

    // Получаем количество токенов, потом передаём в функцию ...
    function getTokenAmount(uint _ethSold) public view returns (uint) {
        require(_ethSold > 0, "ethSold is too small");
        uint tokenReserve = getReserve();

        return getAmount(_ethSold, address(this).balance, tokenReserve);
    }

    function getEthAmount(uint _tokenSold) public view returns (uint) {
        require(_tokenSold > 0, "tokenSold is too small");
        uint tokenReserve = getReserve();

        return getAmount(_tokenSold, tokenReserve, address(this).balance);
    }

    function ethToToken(uint256 _minTokens, address recipient) private {
        uint256 tokenReserve = getReserve();
        uint256 tokensBought = getAmount(msg.value, address(this).balance - msg.value, tokenReserve);
        require(tokensBought >= _minTokens, "not enough amount to output");
        IERC20(tokenAddress).transfer(recipient, tokensBought);
    }

    function ethToTokenSwap(uint256 _minTokens) public payable {
        ethToToken(_minTokens, msg.sender);
    }

    function ethToTokenTransfer(uint256 _minTokens, address _recipient) public payable {
        ethToToken(_minTokens, _recipient);
    }

    function tokenToEthSwap(uint _tokensSold, uint _minEth) public {
        uint tokenReserve = getReserve();
        uint ethBought = getAmount(_tokensSold, tokenReserve, address(this).balance);

        require(ethBought >= _minEth, "not enough product count");
        payable(msg.sender).transfer(ethBought);
    }

    function tokenToTokenSwap(uint256 _tokensSold, uint256 _minTokensBought, address _tokenAddress) public {
        address exchangeAddress = IFactory(factoryAddress).getExchange(_tokenAddress);

        require(exchangeAddress != address(this) && exchangeAddress != address(0), "exchange not exist");

        uint256 tokenReserve = getReserve();
        uint256 ethBought = getAmount(_tokensSold, tokenReserve, address(this).balance);

        IERC20(tokenAddress).transferFrom(msg.sender, address(this), _tokensSold);

        IExchange(exchangeAddress).ethToTokenTransfer{value: ethBought}(_minTokensBought, msg.sender);
    }
}
