import React, { useState, useEffect } from "react";
import {
  ArrowDownOutlined,
  DownOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Input, Popover, Radio, Modal } from "antd";
import { ethers } from "ethers";

import "./Swap.css";

import Factory from "../artifacts/contracts/Factory.sol/Factory.json";
import Exchange from "../artifacts/contracts/Exchange.sol/Exchange.json";
import Token from "../artifacts/contracts/Token.sol/Token.json";
import jsonData from "./deployedContractsAddresses.json";
const factoryAddress = jsonData.factoryContractAddress;

function Swap() {
  const [slippage, setSlippage] = useState(2.5);
  const [tokenOneAmount, setTokenOneAmount] = useState(null);
  const [tokenTwoAmount, setTokenTwoAmount] = useState(null);  
  const [isOpen, setIsOpen] = useState(false);
  const [changeToken, setChangeToken] = useState(1);
  const [tokenAddresses, setTokenAddresses] = useState([]);
  const [tokenSymbols, setTokenSymbols] = useState([]);
  const [selectedOption, setSelectedOption] = useState("tokenToToken");
  const [timeoutId, setTimeoutId] = useState(null);
  const [tokenSymbolOne, setTokenSymbolOne] = useState("");
  const [tokenSymbolTwo, setTokenSymbolTwo] = useState("");
  const [tokenAddressOne, setTokenAddressOne] = useState("");
  const [tokenAddressTwo, setTokenAddressTwo] = useState("");
  const [tokenAmount, setTokenAmount] = useState(0);
  const [tokenBalanceOne, setTokenBalanceOne] = useState(0);
  const [tokenBalanceTwo, setTokenBalanceTwo] = useState(0);
  const [contractTokenBalanceOne, setContractTokenBalanceOne] = useState(0);
  const [contractTokenBalanceTwo, setContractTokenBalanceTwo] = useState(0);

  const settings = (
    <>
      <div>Slippage Tolerance</div>
      <div>
        <Radio.Group
          value={slippage}
          onChange={(e) => setSlippage(e.target.value)}
        >
          <Radio.Button value={0.5}>0.5%</Radio.Button>
          <Radio.Button value={2.5}>2.5%</Radio.Button>
          <Radio.Button value={5}>5.0%</Radio.Button>
        </Radio.Group>
      </div>
    </>
  );

  useEffect(() => {
    if (tokenAddressOne !== "") {
      getTokenBalance(tokenAddressOne, 1);      
      getReserve(tokenAddressOne, 1);
      getTokenToTokenPrice();
    }
  }, [tokenAddressOne]);

  useEffect(() => {
    if (tokenAddressTwo !== "") {
      getTokenBalance(tokenAddressTwo, 2);      
      getReserve(tokenAddressTwo, 2);
      getTokenToTokenPrice();
    }
  }, [tokenAddressTwo]);

  function switchTokens() {
    const addressOne = tokenAddressOne;
    const addressTwo = tokenAddressTwo;
    const symbolOne = tokenSymbolOne;
    const symbolTwo = tokenSymbolTwo;
    const oneAmount = tokenOneAmount;
    const twoAmount = tokenTwoAmount;

    setTokenAddressOne(addressTwo);
    setTokenAddressTwo(addressOne);
    setTokenSymbolOne(symbolTwo);
    setTokenSymbolTwo(symbolOne);
    setTokenTwoAmount(oneAmount);
    setTokenOneAmount(twoAmount);
    getTokenBalance(tokenAddressOne, 1);
    getTokenBalance(tokenAddressTwo, 2);
  }

  function openModal(asset) {
    setChangeToken(asset);
    setIsOpen(true);
    getAllTokenAddresses();
  }

  function modifyToken(i) {
    if (changeToken === 1) {
      setTokenAddressOne(tokenAddresses[i]);
      setTokenSymbolOne(tokenSymbols[i]);
    } else {
      setTokenAddressTwo(tokenAddresses[i]);
      setTokenSymbolTwo(tokenSymbols[i]);
    }
    setIsOpen(false);
  }

  function handleSelectedOption(option) {
    setSelectedOption(option);
    setChangeToken("");
    setTokenSymbolOne("");
    setTokenAddressOne("");
    setTokenSymbolTwo("");
    setTokenAddressTwo("");
    // setTokenBalance(0);
    // setEthBalance(0);
    // setTokenOneAmount("");
    // setTokenTwoAmount("");
    // setContractTokenBalance(0);
    // setContractEthBalance(0);
    // setTokensAmount(0);
  }

  function handleInputChange(event, inputId) {
    const value = event.target.value;

    if (inputId === 1) {
      setTokenOneAmount(value);
    } else {
      setTokenTwoAmount(value);
    }

    clearTimeout(timeoutId);

    if(selectedOption === "tokenToToken"){
      const id = setTimeout(() => {
        getTokenToTokenAmount(value, inputId);
      }, 1000);

      setTimeoutId(id);
    }
    // else if(selectedOption === "removeLiquidity") {
    //   const id = setTimeout(() => {
    //     calculateRemovePoolValue(inputId, value);
    //   }, 1000);

    //   setTimeoutId(id);
    // }    
  }



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
      let _tokenAddresses = await contract.getAllTokenAddresses();

      setTokenAddresses(_tokenAddresses);
    } catch (error) {
      console.log("Error: ", error);
    }
  }

  async function getAccountAddress() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const accounts = await provider.listAccounts();

    return accounts[0];
  }

  async function getTokenBalance(tokenAddress, asset) {
    const contract = checkMetamask(Token, tokenAddress);

    try {
      const balance = await contract.balanceOf(getAccountAddress());
      const _balance = ethers.utils.formatEther(balance);
      if(asset === 1){
        setTokenBalanceOne(parseFloat(_balance).toFixed(3));
      } else {
        setTokenBalanceTwo(parseFloat(_balance).toFixed(3));
      }
    } catch (error) {
      console.log("Error: ", error);
    }
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

  async function getReserve(tokenAddress, asset) {
    const exchangeAddress = getExchange(tokenAddress);
    const contract = checkMetamask(Exchange, exchangeAddress);

    try {
      const reserve = await contract.getReserve();
      if(asset === 1){
        setContractTokenBalanceOne(parseFloat(ethers.utils.formatEther(reserve)).toFixed(3));
      } else {
        setContractTokenBalanceTwo(parseFloat(ethers.utils.formatEther(reserve)).toFixed(3));
      }
      return reserve;
    } catch (error) {
      console.log("Error: ", error);
    }
  }

  async function getEthAmount(tokenAddress, tokenAmount) {
    const exchangeAddress = getExchange(tokenAddress);
    const contract = checkMetamask(Exchange, exchangeAddress);

    const _ethAmount = ethers.utils.parseEther(tokenAmount);

    try {
      const __ethAmount = await contract.getEthAmount(_ethAmount);
      return ethers.utils.formatEther(__ethAmount);      
    } catch (error) {
    }
  }

  async function getTokenAmount(tokenAddress, ethAmount) {
    const exchangeAddress = getExchange(tokenAddress);
    const contract = checkMetamask(Exchange, exchangeAddress);

    const _tokenAmount = ethers.utils.parseEther(ethAmount);

    try {
      const __tokenAmount = await contract.getTokenAmount(_tokenAmount);
      return ethers.utils.formatEther(__tokenAmount);
      // setTokensAmount(tokenAmount.toFixed(5));
    } catch (error) {
      // setTokensAmount("0");
    }
  }

  


// Token to token ----------------------------------------
  async function getTokenToTokenPrice() {  
    const tokenOneReserve = ethers.utils.formatEther(await getReserve(tokenAddressOne, 1));
    const tokenTwoReserve = ethers.utils.formatEther(await getReserve(tokenAddressTwo, 2));    

    const tokenOneAmount = (parseFloat("1") * parseFloat(tokenTwoReserve)) / parseFloat(tokenOneReserve);
    setTokenAmount(parseFloat(tokenOneAmount).toFixed(3));    
  }

  async function getTokenToTokenAmount(value, inputId) {
    const tokenOneReserve = ethers.utils.formatEther(await getReserve(tokenAddressOne, 1));
    const tokenTwoReserve = ethers.utils.formatEther(await getReserve(tokenAddressTwo, 2)); 

    if(inputId === 1){
      if(value.toString() === ""){
        setTokenTwoAmount("");
        return;
      }      

      const tokenTwoAmount = (parseFloat(value) * parseFloat(tokenTwoReserve)) / parseFloat(tokenOneReserve);
      setTokenTwoAmount(parseFloat(tokenTwoAmount).toFixed(5));
    } else {
      if(value.toString() === ""){
        setTokenOneAmount("");
        return;
      }

      const tokenOneAmount = (parseFloat(value) * parseFloat(tokenOneReserve)) / parseFloat(tokenTwoReserve);
      setTokenOneAmount(parseFloat(tokenOneAmount).toFixed(5));      
    }
  }

  async function tokenToTokenSwap() {
    const exchangeAddressOne = await getExchange(tokenAddressOne);

    if (typeof window.ethereum !== "undefined") {
      await requestAccount();

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const contractExchange = new ethers.Contract(exchangeAddressOne, Exchange.abi, signer);
      const contractToken = new ethers.Contract(tokenAddressOne, Token.abi, signer);

      const tokenOneValue = ethers.utils.parseEther(tokenOneAmount);      

      const minTokensBought = ethers.utils.parseEther((parseFloat(tokenTwoAmount) * (slippage / 100)).toString());      
      await contractToken.approve(contractExchange.address, tokenOneValue);

      try {
        const transaction = await contractExchange.tokenToTokenSwap(tokenOneValue, minTokensBought, tokenAddressTwo);
        await transaction.wait();
        console.log("Swap successfull!!!");
      } catch (error) {
        console.log("Error: ", error);
      }
    }

      getTokenBalance(tokenAddressOne, 1);
      getReserve(tokenAddressOne, 1);
      getTokenBalance(tokenAddressTwo, 2);      
      getReserve(tokenAddressTwo, 2);
      setTokenOneAmount("");
      setTokenTwoAmount("");
      getTokenToTokenPrice();
  }


// HTML ------------------------------------------
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

      <div className="tradeBox">
        <div className="tradeBoxHeader">
          <div className="swapButtonGroup">
            <button
              className="swap-control-btn"
              onClick={(e) => handleSelectedOption("tokenToToken")}
            >
              Token ↔ Token
            </button>
            <button
              className="swap-control-btn"
              onClick={(e) => handleSelectedOption("tokenToETH")}
            >
              Token ↔ ETH
            </button>
          </div>

          <Popover
            content={settings}
            title="Settings"
            trigger="click"
            placement="bottomRight"
          >
            <SettingOutlined className="cog" />
          </Popover>
        </div>

        {selectedOption === "tokenToToken" && (
          <div>
            <div className="inputs">
              <Input placeholder="0" value={tokenOneAmount} onChange={(event) => handleInputChange(event, 1)}/>
              <Input placeholder="0" value={tokenTwoAmount} onChange={(event) => handleInputChange(event, 2)}/>
              <div className="switchButton" onClick={switchTokens}> <ArrowDownOutlined className="switchArrow" /></div>
              <div className="assetOneBalance">Balance: {tokenBalanceOne}</div>
              <div className="assetOne" onClick={() => openModal(1)}>{tokenSymbolOne} <DownOutlined /></div>
              <div className="assetTwoBalance">Balance: {tokenBalanceTwo}</div>
              <div className="assetTwo" onClick={() => openModal(2)}>{tokenSymbolTwo} <DownOutlined /></div>
            </div>

            <div className="poolInfo">
              <div className="exchangeRate">
                <div>Exchange Rate</div>
                <div>1 {tokenSymbolOne} = {tokenAmount} {tokenSymbolTwo}</div>
              </div>

              <div className="poolSize">
                <div>Current Pool Size</div>
                <div>{contractTokenBalanceOne} {tokenSymbolOne} + {contractTokenBalanceTwo}{" "}{tokenSymbolTwo}</div>
              </div>
            </div>

            <div className="swapButton" onClick={tokenToTokenSwap}>Token Swap</div>
          </div>
        )}

        {selectedOption === "tokenToETH" && (
          <div>
            <div className="inputs">
              <Input placeholder="0" value={tokenOneAmount} onChange={(e) => setTokenOneAmount(e.target.value)}/>
              <Input placeholder="0" value={tokenTwoAmount} disabled={true} />
              <div className="assetOne" onClick={() => openModal(1)}>
                {tokenSymbolOne} <DownOutlined />
              </div>

              <div className="assetTwo" onClick={() => openModal(2)}>
                {tokenSymbolTwo} <DownOutlined />
              </div>
            </div>
            <div className="swapButton" onClick={getAllTokenAddresses}>ETH Swap</div>
          </div>
        )}

      </div>
    </>
  );
}

export default Swap;
