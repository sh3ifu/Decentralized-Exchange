// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

// Імпорт контрактів для взаємодії з токенами
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

// Контракт обміну, наслідується від ERC20
contract Exchange is ERC20 {
    // Адрес токена
    address public tokenAddress;
    // Адрес фабрики
    address public factoryAddress;

    // Конструктор в якому задається адрес токена для цієї біржі(ERC20 -> ETH)
    // перевірка чи не являєтся адрес токена 0х0000...
    constructor(address _token) ERC20("GalaxySwap", "GLX") {
        require(_token != address(0), "Incorrect token address!");
        tokenAddress = _token;
        factoryAddress = msg.sender;
    }

    // Функція для додавання ліквідності, в параметрах вказується кількість токенів для додавання
    // створюється екземляр інтферфейса токена,
    // викликається переведення токенів від ініціатора транзакції на адрес контракта
    function addLiquidity(uint256 _tokenAmount) public payable returns (uint) {
        // Перевірка, на наявність активів в цьому пулі
        if (getReserve() == 0) {
            // створюється екземляр інтферфейса токена
            IERC20 token = IERC20(tokenAddress);
            // Виконується переведення токенів від відправника на адрес контракту
            token.transferFrom(msg.sender, address(this), _tokenAmount);

            // Обраховуємо ліквідність
            uint liquidity = address(this).balance;
            // Мінт токенів ліквідності
            _mint(msg.sender, liquidity);
            
            return liquidity;
        } else {
            // Обраховуємо резерви ETH
            uint ethReserve = address(this).balance - msg.value;
            // Отримуємо резерви токену
            uint tokenReserve = getReserve();
            // Визначаємо скільки токенів треба додати в пул
            uint tokenAmount = (msg.value * tokenReserve) / ethReserve;

            // Перевіряємо чи користувач вказав правильне число
            require(_tokenAmount >= tokenAmount, "insufficient token amount");
            
            // Створюємо екземпляр інтерфейсу токена
            IERC20 token = IERC20(tokenAddress);
            // Переводимо токени від користувача на контракт
            token.transferFrom(msg.sender, address(this), tokenAmount);

            // Обраховуємо нове значення ліквідності
            uint liquidity = (totalSupply() * msg.value) / ethReserve;            
            _mint(msg.sender, liquidity);
            return liquidity;
        }
    }

    // Видалення ліквідності
    function removeLiquidity(uint _amount) public returns (uint, uint) {
        // Перевірка на коректність числа
        require(_amount > 0, "invalid amount");

        // Обчислення кількості ETH і токену з урахуванням кількості lp-токенів
        uint ethAmount = (address(this).balance * _amount) / totalSupply();
        uint tokenAmount = (getReserve() * _amount) / totalSupply();

        // Виклик функції для спалювання lp-токенів
        _burn(msg.sender, _amount);
        // Конвертуємо адрес відправника в payable і переводимо йому ETH
        payable(msg.sender).transfer(ethAmount);
        // Переводимо користувачеві токени
        IERC20(tokenAddress).transfer(msg.sender, tokenAmount);
        
        return (ethAmount, tokenAmount);
    }

    // Функція для отримання баланса токенів на контракті
    function getReserve() public view returns (uint256) {
        return IERC20(tokenAddress).balanceOf(address(this));
    }

    // Функція для обрахунку кількості актива для обміну, по формулі CPMM
    function getAmount(uint inputAmount, uint inputReserve, uint outputReserve) private pure returns (uint) {
        // Перевірка на коректність резервів
        require(inputReserve > 0 && outputReserve > 0, "invalid reserves");

        // Обрахунок комісії
        uint256 inputAmountWithFee = inputAmount * 99;  // 1%
        // Розрахунок чисельника
        uint256 numerator = inputAmountWithFee * outputReserve;
        // Розрахунок знаменника
        uint256 denominator = (inputReserve * 100) + inputAmountWithFee; 

        // Обчислення кількості і повернення значення
        return numerator / denominator;
    }

    // Обчислення кількості отриманих токенів за продаж ETH
    function getTokenAmount(uint _ethSold) public view returns (uint) {
        // Перевірка на коректність числа
        require(_ethSold > 0, "ethSold is too small");
        // Отримуємо кількість токенів на контракті
        uint tokenReserve = getReserve();

        // Обчислюємо кількість ERC20 токенів
        return getAmount(_ethSold, address(this).balance, tokenReserve);
    }

    // Обчислення кількості отриманого ETH за продаж певної кількості токенів
    function getEthAmount(uint _tokenSold) public view returns (uint) {
        // Перевірка на коректність числа
        require(_tokenSold > 0, "tokenSold is too small");
        // Отримуємо кількість токенів на контракті
        uint tokenReserve = getReserve();

        // Обчислюємо кількість ETH
        return getAmount(_tokenSold, tokenReserve, address(this).balance);
    }

    // Приватна функція для обміну ETH на токени
    function ethToToken(uint256 _minTokens, address recipient) private {
        // Отримуємо кількість токенів, які знаходяться на контракті
        uint256 tokenReserve = getReserve();
        // Обраховуємо кількість токенів, які отримає користувач в обмін на ETH(для цього викликається функція getAmount)
        uint256 tokensBought = getAmount(msg.value, address(this).balance - msg.value, tokenReserve);
        // Перевірка на прослизання(slippage)
        require(tokensBought >= _minTokens, "not enough amount to output");
        // Переводимо токени на адрес користувача
        IERC20(tokenAddress).transfer(recipient, tokensBought);
    }

    // Публічна функція для обміну ETH на токени(викликає ethToToken)
    function ethToTokenSwap(uint256 _minTokens) public payable {
        ethToToken(_minTokens, msg.sender);
    }

    // Дозволяє обмінювати ETH на токени(викликає ethToToken), відрізняється від ethToTokenSwap
    // тим що можна вказати адресу отримувача
    function ethToTokenTransfer(uint256 _minTokens, address _recipient) public payable {
        ethToToken(_minTokens, _recipient);
    }

    // Функція для обміну токена на ETH
    function tokenToEthSwap(uint _tokensSold, uint _minEth) public {
        // Отримуємо резерв токенів
        uint tokenReserve = getReserve();
        // Обраховуєм кількість ETH, яке отримає користувач
        uint ethBought = getAmount(_tokensSold, tokenReserve, address(this).balance);

        // Перевірка на прослизання
        require(ethBought >= _minEth, "not enough product count");

        // Переводимо токени з адреси покупця на адрес контракту
        IERC20(tokenAddress).transferFrom(msg.sender, address(this), _tokensSold);        

        // Відправляємо користувачеві ETH
        payable(msg.sender).transfer(ethBought);
    }

    // Обмін між двома токенами
    function tokenToTokenSwap(uint256 _tokensSold, uint256 _minTokensBought, address _tokenAddress) public {
        // Отримуємо адрес біржі другого токена
        address exchangeAddress = IFactory(factoryAddress).getExchange(_tokenAddress);

        // Перевіряємо чи адрес другої біржі не дорівнює адресу цієї а також чи не дорівнює нульовому адресу
        require(exchangeAddress != address(this) && exchangeAddress != address(0), "exchange not exist");

        // Отримуємо кількість токенів на контракті
        uint256 tokenReserve = getReserve();
        // Розраховуєм скільки треба заплатити ETH за обмін
        uint256 ethBought = getAmount(_tokensSold, tokenReserve, address(this).balance);
        // Переводимо токени з адреси покупця на адрес контракту
        IERC20(tokenAddress).transferFrom(msg.sender, address(this), _tokensSold);
        // Ініціюємо обмін
        IExchange(exchangeAddress).ethToTokenTransfer{value: ethBought}(_minTokensBought, msg.sender);
    }
}
