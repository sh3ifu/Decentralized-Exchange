import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Input, Modal } from "antd";
import { DownOutlined } from "@ant-design/icons";

import "./Pool.css";

import Factory from "../artifacts/contracts/Factory.sol/Factory.json";
import Exchange from "../artifacts/contracts/Exchange.sol/Exchange.json";
import Token from "../artifacts/contracts/Token.sol/Token.json";
import jsonData from "./deployedContractsAddresses.json";

const factoryAddress = jsonData.factoryContractAddress;
const Big = require("big.js");

function Pool() {
  const [tokenCreateAddress, setTokenCreateAddress] = useState("");
  const [exchangeCreation, setExchangeCreation] = useState("");
  const [selectedOption, setSelectedOption] = useState("addLiquidity");
  const [ethBalance, setEthBalance] = useState(0);
  const [tokenBalance, setTokenBalance] = useState(0);
  const [contractEthBalance, setContractEthBalance] = useState(0);
  const [contractTokenBalance, setContractTokenBalance] = useState(0);
  const [tokensAmount, setTokensAmount] = useState(0);
  const [timeoutId, setTimeoutId] = useState(null);
  const [lpTokenAmount, setLpTokenAmount] = useState(0);

  const [tokenOneAmount, setTokenOneAmount] = useState(null);
  const [tokenTwoAmount, setTokenTwoAmount] = useState(null);
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenAddress, setTokenAddress] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [changeToken, setChangeToken] = useState(1);
  const [tokenAddresses, setTokenAddresses] = useState([]);
  const [tokenSymbols, setTokenSymbols] = useState([]);

  const handleInputChange_createExchange = (e) => {
    setTokenCreateAddress(e.target.value);
    setExchangeCreation("");
  };

  function handleSelectedOption (option) {
    setSelectedOption(option);
    setChangeToken("");
    setTokenSymbol("");
    setTokenAddress("");
    setTokenBalance(0);
    setEthBalance(0);
    setTokenOneAmount("");
    setTokenTwoAmount("");
    setContractTokenBalance(0);
    setContractEthBalance(0);
    setTokensAmount(0);
  }

  function openModal(asset) {
    setChangeToken(asset);
    setIsOpen(true);
    getAllTokenAddresses();
  }

  function modifyToken(i) {
    if (changeToken === 1) {
      setTokenAddress(tokenAddresses[i]);
      setTokenSymbol(tokenSymbols[i]);
    }
    setIsOpen(false);
  }

  function handleInputChange(event, inputId) {
    const value = event.target.value;

    if (inputId === 1) {
      setTokenOneAmount(value);
    } else {
      setTokenTwoAmount(value);
    }

    clearTimeout(timeoutId);

    if(selectedOption === "addLiquidity"){
      const id = setTimeout(() => {
        calculateAddPoolValue(inputId, value);
      }, 1000);

      setTimeoutId(id);
    }
    else if(selectedOption === "removeLiquidity") {
      const id = setTimeout(() => {
        calculateRemovePoolValue(inputId, value);
      }, 1000);

      setTimeoutId(id);
    }    
  }

  useEffect(() => {
    if (tokenAddress !== "") {
      getTokenBalance();
      getEthBalance();
      getContractEthBalance();
      getReserve();
      getTokenAmount();
      setTokenOneAmount("");
      setTokenTwoAmount("");
    }
  }, [tokenAddress]);

  
  //  General blockchain functions -------------------------------
  function checkMetamask(Contract, contractAddress) {
    // If MetaMask exists
    if (typeof window.ethereum !== "undefined") {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(
        contractAddress,
        Contract.abi,
        provider
      );

      return contract;
    }
  }

  async function requestAccount() {
    await window.ethereum.request({ method: "eth_requestAccounts" });
  }

  async function getAccountAddress() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const accounts = await provider.listAccounts();

    return accounts[0];
  }

  async function getEthBalance() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const balance = await provider.getBalance(getAccountAddress());
    const bal = ethers.utils.formatEther(balance);
    setEthBalance(parseFloat(bal).toFixed(4));
  }

  async function getTokenBalance() {
    const contract = checkMetamask(Token, tokenAddress);

    try {
      const balance = await contract.balanceOf(getAccountAddress());
      const bal = ethers.utils.formatEther(balance);
      setTokenBalance(bal);
    } catch (error) {
      console.log("Error: ", error);
    }
  }

  async function getTokenSymbol(tokenAddress) {
    const contract = checkMetamask(Token, tokenAddress);

    try {
      const tokenSymbol = await contract.symbol();
      return tokenSymbol;
    } catch (error) {
      console.log("Error: ", error);
      throw error;
    }
  }

  async function getAllTokenAddresses() {
    const contract = checkMetamask(Factory, factoryAddress);

    try {
      const _tokenAddresses = await contract.getAllTokenAddresses();

      setTokenAddresses(_tokenAddresses);
    } catch (error) {
      console.log("Error: ", error);
    }
  }

  async function getContractEthBalance() {
    const exchangeAddress = getExchange(tokenAddress);
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contractEthBalance = await provider.getBalance(exchangeAddress);

    setContractEthBalance(ethers.utils.formatEther(contractEthBalance));
    return ethers.utils.formatEther(contractEthBalance);
  }

  async function getExchange(tokenAddress) {
    const contract = checkMetamask(Factory, factoryAddress);

    try {
      const exchangeAddress = await contract.getExchange(tokenAddress);
      return exchangeAddress;
    } catch (error) {
      console.log("Error: ", error);
    }
  }

  async function getReserve() {
    const exchangeAddress = getExchange(tokenAddress);
    const contract = checkMetamask(Exchange, exchangeAddress);

    try {
      const reserve = await contract.getReserve();
      setContractTokenBalance(ethers.utils.formatEther(reserve));
      return reserve;
    } catch (error) {
      console.log("Error: ", error);
    }
  }

  async function getTokenAmount() {
    const exchangeAddress = getExchange(tokenAddress);
    const contract = checkMetamask(Exchange, exchangeAddress);

    const _tokenAmount = ethers.utils.parseEther("1");

    try {
      const __tokenAmount = await contract.getTokenAmount(_tokenAmount);
      const tokenAmount = parseFloat(ethers.utils.formatEther(__tokenAmount));
      setTokensAmount(tokenAmount.toFixed(5));
    } catch (error) {
      setTokensAmount("0");
    }
  }

  // Add Liquidity  -------------------------------------------
  async function addLiquidity() {
    const exchangeAddress = await getExchange(tokenAddress);
    const reserve = ethers.utils.formatEther(await getReserve(exchangeAddress));

    const _tokenOneAmount = new Big(tokenOneAmount);
    const _tokenTwoAmount = new Big(tokenTwoAmount);
    const _tokenBalance = new Big(tokenBalance);
    const _ethBalance = new Big(ethBalance);

    if (reserve === "0.0") {
      if (_tokenBalance === 0 || _ethBalance === 0 || _tokenOneAmount === 0 || _tokenTwoAmount === 0) {
        alert("Inccorrect token amount");
      } else if (_tokenOneAmount > _tokenBalance || _tokenTwoAmount > _ethBalance) {
        alert("Inccorrect token amount");
      } else if (isNaN(_tokenOneAmount) || isNaN(_tokenTwoAmount)) {
        alert("Inccorrect token amount");
      }

      if (typeof window.ethereum !== "undefined") {
        await requestAccount();

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        const contractExchange = new ethers.Contract(
          exchangeAddress,
          Exchange.abi,
          signer
        );
        const contractToken = new ethers.Contract(
          tokenAddress,
          Token.abi,
          signer
        );

        const ethValue = ethers.utils.parseEther(tokenTwoAmount);
        const tokenValue = ethers.utils.parseEther(tokenOneAmount);

        await contractToken.approve(contractExchange.address, tokenValue);

        try {
          const transaction = await contractExchange.addLiquidity(tokenValue, {
            value: ethValue,
          });
          await transaction.wait();
          console.log("Liquidity added successfully!!!");
        } catch (error) {
          console.log("Error: ", error);
        }
      }
    } else {
      if (typeof window.ethereum !== "undefined") {
        await requestAccount();

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        const contractExchange = new ethers.Contract(
          exchangeAddress,
          Exchange.abi,
          signer
        );
        const contractToken = new ethers.Contract(
          tokenAddress,
          Token.abi,
          signer
        );

        const ethValue = ethers.utils.parseEther(tokenTwoAmount);
        const tokenValue = ethers.utils.parseEther(tokenOneAmount);
        console.log("token value: ", tokenValue);

        await contractToken.approve(contractExchange.address, tokenValue);

        try {
          const transaction = await contractExchange.addLiquidity(tokenValue, {
            value: ethValue,
          });
          await transaction.wait();
          console.log("Liquidity added successfully!!!");
        } catch (error) {
          console.log("Error: ", error);
        }
      }
    }

    getTokenBalance();
    getEthBalance();
    getContractEthBalance();
    getReserve();
    getTokenAmount();
    setTokenOneAmount("");
    setTokenTwoAmount("");
  }

  async function calculateAddPoolValue(inputId, value) {
    const exchangeAddress = await getExchange(tokenAddress);
    const reserve = ethers.utils.formatEther(await getReserve(exchangeAddress));

    if (reserve !== "0.0") {
      if (inputId === 1) {
        if (value.toString() === "") {
          setTokenTwoAmount("");
          return;
        }

        try {
          const _tokenOneAmount = new Big(
            ethers.utils.parseEther(value.toString())
          );
          const _contractEthBalance = new Big(
            ethers.utils.parseEther(await getContractEthBalance())
          );
          const _tokenReserve = new Big(ethers.utils.parseEther(reserve));
          const _tokenTwoAmount = _tokenOneAmount
            .times(_contractEthBalance)
            .div(_tokenReserve);

          const ethAmount = ethers.utils.formatEther(
            _tokenTwoAmount.toFixed(0).toString()
          );
          setTokenTwoAmount(ethAmount);
        } catch (error) {
          console.log("Error: ", error);
        }
      } else {
        if (value.toString() === "") {
          setTokenOneAmount("");
          return;
        }

        try {
          const _tokenTwoAmount = new Big(
            ethers.utils.parseEther(value.toString())
          );
          const _contractEthBalance = new Big(
            ethers.utils.parseEther(await getContractEthBalance())
          );
          const _tokenReserve = new Big(ethers.utils.parseEther(reserve));
          const _tokenOneAmount = _tokenTwoAmount
            .times(_tokenReserve)
            .div(_contractEthBalance);

          const tokenAmount = ethers.utils.formatEther(
            _tokenOneAmount.toFixed(0).toString()
          );
          setTokenOneAmount(tokenAmount);
        } catch (error) {
          console.log("Error: ", error);
        }
      }
    }
  }



  // Remove Liquidity ------------------------------------------
  // async function getLpTokenBalance() {
  //   const exchangeAddress = getExchange(tokenAddress);
  //   const contract = checkMetamask(Exchange, exchangeAddress);

  //   try {
  //     const _lpBalance = await contract.balanceOf(getAccountAddress());
  //     const lpBalance = ethers.utils.formatEther(_lpBalance);      
  //     return lpBalance;
  //   } catch (error) {
  //     console.log("Error: ", error);
  //   }
  // }

  async function getTotalSupply() {
    const exchangeAddress = getExchange(tokenAddress);
    const contract = checkMetamask(Exchange, exchangeAddress);

    try {
      const _totalSupply = await contract.totalSupply();
      const totalSupply = ethers.utils.formatEther(_totalSupply);      
      return totalSupply;
    } catch (error) {
      console.log("Error: ", error);
    }
  }

  async function removeLiquidity() {
    const exchangeAddress = await getExchange(tokenAddress);
    const reserve = ethers.utils.formatEther(await getReserve(exchangeAddress));

    const _tokenOneAmount = new Big(tokenOneAmount);
    const _tokenTwoAmount = new Big(tokenTwoAmount);
    const _tokenBalance = new Big(tokenBalance);
    const _ethBalance = new Big(ethBalance);

    if (reserve !== "0.0") {
      if (_tokenBalance === 0 || _ethBalance === 0 || _tokenOneAmount === 0 || _tokenTwoAmount === 0) {
        alert("Inccorrect token amount");
      } else if (_tokenOneAmount > _tokenBalance || _tokenTwoAmount > _ethBalance) {
        alert("Inccorrect token amount");
      } else if (isNaN(_tokenOneAmount) || isNaN(_tokenTwoAmount)) {
        alert("Inccorrect token amount");
      }

      if (typeof window.ethereum !== "undefined") {
        await requestAccount();

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();

        const contractExchange = new ethers.Contract(exchangeAddress, Exchange.abi, signer);
        // const contractToken = new ethers.Contract(tokenAddress, Token.abi, signer);

        // const ethValue = ethers.utils.parseEther(tokenTwoAmount);
        // const tokenValue = ethers.utils.parseEther(tokenOneAmount);

        // await contractToken.approve(contractExchange.address, tokenValue);

        try {
          const transaction = await contractExchange.removeLiquidity(lpTokenAmount);
          await transaction.wait();
          console.log("Liquidity removed successfully!!!");
        } catch (error) {
          console.log("Error: ", error);
        }
      }
    }

    getTokenBalance();
    getEthBalance();
    getContractEthBalance();
    getReserve();
    getTokenAmount();
    setTokenOneAmount("");
    setTokenTwoAmount("");
  }

  async function calculateRemovePoolValue(inputId, value) {
    const exchangeAddress = await getExchange(tokenAddress);
    const reserve = ethers.utils.formatEther(await getReserve(exchangeAddress));

    if (reserve !== "0.0") {
      if (inputId === 1) {
        if (value.toString() === "") {
          setTokenTwoAmount("");
          return;
        }

        try {
          const _tokenOneAmount = new Big(ethers.utils.parseEther(value.toString()));          
          const _tokenReserve = new Big(ethers.utils.parseEther(reserve));
          const _ethReserve = new Big(ethers.utils.parseEther(await getContractEthBalance()));
          const _totalSupply = new Big(await getTotalSupply());
          const _tokenTwoAmount = _tokenOneAmount.times(_totalSupply).div(_tokenReserve);
          
          const lpAmount = new Big(_tokenTwoAmount.toFixed(0).toString());
          const ethAmount = ethers.utils.formatEther((_ethReserve.times(lpAmount).div(_totalSupply)).toFixed(0).toString());

          setTokenTwoAmount(ethAmount);
          setLpTokenAmount(ethers.utils.parseEther(lpAmount.toFixed(0).toString()).toString());          
        } catch (error) {
          console.log("Error: ", error);
        }
      } else {
        if (value.toString() === "") {
          setTokenOneAmount("");
          return;
        }

        try {
          const _tokenTwoAmount = new Big(ethers.utils.parseEther(value.toString()));          
          const _tokenReserve = new Big(ethers.utils.parseEther(reserve));
          const _ethReserve = new Big(ethers.utils.parseEther(await getContractEthBalance()));
          const _totalSupply = new Big(await getTotalSupply());
          const _tokenOneAmount = _tokenTwoAmount.times(_totalSupply).div(_ethReserve);
          
          const lpAmount = new Big(_tokenOneAmount.toFixed(0).toString());
          const tokenAmount = ethers.utils.formatEther((_tokenReserve.times(lpAmount).div(_totalSupply)).toFixed(0).toString());          

          setTokenOneAmount(tokenAmount);
          setLpTokenAmount(ethers.utils.parseEther(lpAmount.toFixed(0).toString()).toString());
        } catch (error) {
          console.log("Error: ", error);
        }
      }
    }
  }



  // Create Exchange --------------------------
  async function createExchange() {
    if (typeof window.ethereum !== "undefined") {
      await requestAccount();

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(factoryAddress, Factory.abi, signer);

      try {
        const transaction = await contract.createExchange(tokenCreateAddress);
        await transaction.wait();

        setExchangeCreation("Exchange successfully created!!!");
        console.log("Exchange successfully created!!!");
      } catch (error) {
        setExchangeCreation("Address error");
        console.log(error);
      }
    }
  }




  useEffect(() => {
    async function fetchData() {
      const symbols = await Promise.all(
        tokenAddresses.map(async (_tokenAddress) => {
          try {
            const tokenSymbol = await getTokenSymbol(_tokenAddress);
            return tokenSymbol;
          } catch (error) {
            console.log("Error fetching token symbol: ", error);
            return null;
          }
        })
      );
      setTokenSymbols(symbols);
    }

    fetchData();
  }, [tokenAddresses]);



  // HTML -------------------------------------
  return (
    <>
      <Modal
        open={isOpen}
        footer={null}
        onCancel={() => setIsOpen(false)}
        title="Select a token"
      >
        <div className="modalContent">
          {tokenAddresses &&
            tokenSymbols.map((symbol, i) => {
              return (
                <div
                  className="tokenChoice"
                  key={i}
                  onClick={() => modifyToken(i)}
                >
                  <div className="tokenChoiceNames">
                    <div className="tokenName">{symbol}</div>
                    <div className="tokenTicker">{tokenAddresses[i]}</div>
                  </div>
                </div>
              );
            })}
        </div>
      </Modal>

      <div className="poolBox">
        <div className="poolBoxHeader">
          <div className="poolButtonGroup">
            <button
              className="pool-control-btn"
              onClick={(e) => handleSelectedOption("addLiquidity")}
            >
              Add
            </button>
            <button
              className="pool-control-btn"
              onClick={(e) => handleSelectedOption("removeLiquidity")}
            >
              Remove
            </button>
            <button
              className="pool-control-btn"
              onClick={(e) => handleSelectedOption("createExchange")}
            >
              Create
            </button>
          </div>
        </div>

        {selectedOption === "addLiquidity" && (
          <div className="inputs">
            <Input placeholder="0" value={tokenOneAmount} onChange={(event) => handleInputChange(event, 1)}/>
            <Input placeholder="0" value={tokenTwoAmount} onChange={(event) => handleInputChange(event, 2)}/>
            <div className="assetOneBalance">Balance: {tokenBalance}</div>
            <div className="assetOne" onClick={() => openModal(1)}>{tokenSymbol} <DownOutlined /></div>
            <div className="assetTwoBalance">Balance: {ethBalance}</div>
            <div className="assetTwo">ETH</div>
            <div className="poolInfo">
              <div className="poolSize">
                <div>Current Pool Size</div>
                <div>{contractEthBalance} ETH + {contractTokenBalance}{" "}{tokenSymbol}</div>
              </div>
            </div>

            <div className="swapButton" onClick={addLiquidity}>Add Liquidity</div>
          </div>
        )}

        {selectedOption === "removeLiquidity" && (
          <div className="inputs">
            <Input placeholder="0" value={tokenOneAmount} onChange={(event) => handleInputChange(event, 1)} />
            <Input placeholder="0" value={tokenTwoAmount} onChange={(event) => handleInputChange(event, 2)} />
            <div className="assetOneBalance">Balance: {tokenBalance}</div>
            <div className="assetOne" onClick={() => openModal(1)}> {tokenSymbol} <DownOutlined /> </div>
            <div className="assetTwoBalance">Balance: {ethBalance}</div>
            <div className="assetTwo">ETH</div>
            <div className="poolInfo">
              <div className="poolSize">
                <div>Current Pool Size</div>
                <div>
                  {contractEthBalance} ETH + {contractTokenBalance}{" "}
                  {tokenSymbol}
                </div>
              </div>
            </div>

            <div className="swapButton" onClick={removeLiquidity}>Remove Liquidity</div>
          </div>
        )}

        {selectedOption === "createExchange" && (
          <div>
            <Input
              onChange={handleInputChange_createExchange}
              value={tokenCreateAddress}
              placeholder="Token Address"
            />
            <div className="swapButton" onClick={createExchange}>
              Create Exchange
            </div>
            <h3
              style={{
                color: exchangeCreation === "Address error" ? "red" : "green",
              }}
            >
              {exchangeCreation}
            </h3>
          </div>
        )}
      </div>
    </>
  );
}

export default Pool;
