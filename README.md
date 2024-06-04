# Links
[Video](https://youtu.be/_w87HMNmPAA)

# User interface
Main page of the site

![Env file example](/screenshots/mainPage.png)
In the main part of the page there is a window for exchanging tokens. At the top of the window you can see two buttons for exchanging **ERC20 ↔ ERC20** and **ERC20 ↔ ETH** respectively.

By clicking on the corresponding element (with a white arrow down), the user will see a modal window where he can choose the one he needs from the list of tokens.

![Env file example](/screenshots/selectingTokens.png)
This window displays both the name of the token and the address of its contract. This is necessary in order to distinguish tokens that have the same name.

After selecting two tokens and entering the required amount for exchange, the following information is displayed:
1. Balance of tokens in the wallet. Located next to the token selection menu.
2. After entering the number of tokens in one of the fields, the corresponding number of another token will be displayed in the other, which the user will receive for exchange at the specified rate.
3. Above the exchange button, gray text shows information about the exchange rate for these tokens, as well as the amount of liquidity in the pool.

![Env file example](/screenshots/exchangeWindow.png)

On the **Pool** page, the global interface does not change much. In the center is the same window, only there are three buttons for selection: **Add**, **Remove** and **Create**. Accordingly, to add liquidity, withdraw and create a new exchange contract for a new token.

![Env file example](/screenshots/poolPage.png)

Adding liquidity.

![Env file example](/screenshots/addingLiquidity.png)
You can see that there are already some assets in this liquidity pool, so when the user wants to add more of his assets to this pool, he cannot do it arbitrarily. The pool itself calculates in what ratio tokens and ether should be added. If there was no liquidity in this pool, then the user could add any number of the first and second assets.

You can see the auction window on the **Cottery** page. In the input field, users will enter the size of the bets they want to place.

![Env file example](/screenshots/cotteryPage.png)

# User instructions
#### Technologies used
![Env file example](/screenshots/usedTechnologies.png)

To start the project, you need to install the following software tools:

- Node.js
- Solidity
- React
- Ganache
- Metamask
- Ethers.js
- Hardhat
- Text editor and web-browser.

Having installed all the necessary software tools, the next thing you need to do is download the project from GitHub and unpack it on your local machine.

The next step to start the project, the user needs to perform a number of actions:
1. Open the project in the code editor.
2. Install all necessary dependencies via the **node.js** npm package manager.
3. Launch the local **Ganache** blockchain.
4. Specify the necessary variables in the **.env** file. That is, the private key to the address in the Ethereum network from which smart contracts will be deployed, as well as **localhost** addresses.

![Env file example](/screenshots/envFileExample.png)

5. Make the necessary settings in the **hardhat.config.js** file. They are required for the proper operation of the **Hardhat** tool, that is, for the deployment of smart contracts in the selected blockchain network, as well as for testing.
6. Next, from the **scripts** directory, you need to run the deploy.js file, which is responsible for deploying contracts to the blockchain. This can be done using the command: **npx hardhat run .\scripts\deploy.js –network localganache**, where you need to specify the path to the **deploy.js** file and the name of the local blockchain network (it was specified in the **hardhat.config.js** file).
7. The next step is to go to the **src/components** directory and in the **deployedContractsAddresses.json** file, in the **deploymentPrivateKey** field, specify the same address that was specified in the **.env** file.

![Env file example](/screenshots/deployedContractExample.png)

8. After that, you need to enter the **npm start** command in the terminal to start the project itself.
9. After opening a web page in a browser on the local host, the user first needs to connect his **Metamask** crypto wallet to the exchange, and only then can it be used.