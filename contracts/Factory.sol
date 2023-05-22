// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

// Імпорт контракту обміну, для того щоб можна було створювати нові "обмінники" для кожного ERC20 токену
import "./Exchange.sol";

// Контракт фабрики
contract Factory {
    // Масив в якому зберігаються всі адреси токенів, для яких були створені контракти обміну
    address[] public tokenAddresses;
    // Зберігає пари(ключ - значення) адресів "обмінників" і токенів
    mapping(address => address) public tokenToExchange;    
    
    // Функція для створення нового обмінника
    // отримує на вхід адрес ERC20 токена, повертає адрес нового контракту обміна
    function createExchange(address _tokenAddress) public returns (address) {
        // Перевірка, чи не являється адрес токена нульовим адресом
        // якщо так, створює помилку
        require(_tokenAddress != address(0), "invalid token address");
        // Перевірка на наявність вже існуючого контракта обміну для певного токена
        // Використовується для того, щоб не створювати багато різних контрактів для одного і того самого токена
        require(tokenToExchange[_tokenAddress] == address(0), "exchange already exist");

        // Створюємо екземпляр контракта обміну
        // в конструктор передаєм адрес токена
        Exchange exchange = new Exchange(_tokenAddress);
        // Зберігаєм в "маппінг" адрес токена і адрес нового контракту обміну
        tokenToExchange[_tokenAddress] = address(exchange);
        // Додаємо в масив адрес токену
        tokenAddresses.push(_tokenAddress);

        // Повертаєм адрес нового контракта обміна
        return address(exchange);
    }

    // Функція для отримання всіх адресів токенів
    function getAllTokenAddresses() public view returns (address[] memory) {
        return tokenAddresses;
    }

    // Повертає адрес контракту обміну по адресу токена
    function getExchange(address _tokenAddress) public view returns(address){
        return tokenToExchange[_tokenAddress];
    }

    // Повертає адрес токена по адресу контракта обмінника
    function getToken(address _exchangeAddress) public view returns(address){
        return tokenToExchange[_exchangeAddress];
    }
}