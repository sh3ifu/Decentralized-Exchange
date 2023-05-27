import React, { useState, useEffect } from "react";
import Logo from "../chocolate_logo.png";
import Eth from "../ethereum.png";
import Caramel from "../caramel.png";
import { Link } from "react-router-dom";
import { ethers } from "ethers";

import Exchange from "../artifacts/contracts/Exchange.sol/Exchange.json";
import Factory from "../artifacts/contracts/Factory.sol/Factory.json";
import jsonData from "./deployedContractsAddresses.json";
const factoryAddress = jsonData.factoryContractAddress;
const caramelTokenAddress = jsonData.caramelTokenAddress;

function Header() {
  const [walletAddress, setWalletAddress] = useState("");
  const [isWalletConnect, setIsWalletConnect] = useState(false);
  const [clmrPrice, setClmrPrice] = useState(1.256);

  async function requestAccount() {
    console.log("Requesting account...");

    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setWalletAddress(accounts[0]);
      } catch (error) {
        console.log("Connecting error...");
      }
    } else {
      alert("Metamask not detected");
    }
  }

  // Create a provider to interact with a smart contract
  async function connectWallet() {
    if (typeof window.ethereum !== "undefined") {
      await requestAccount();

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      signer.getAddress().then((address) => { setWalletAddress(address); });
      setIsWalletConnect(true);
    }
  }


  function checkMetamask(Contract, contractAddress) {
    // If MetaMask exists
    if (typeof window.ethereum !== "undefined") {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, Contract.abi, provider);

      return contract;
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

  async function getEthAmount() {
    const exchangeAddress = getExchange(caramelTokenAddress);
    const contract = checkMetamask(Exchange, exchangeAddress);

    const _ethAmount = ethers.utils.parseEther("1");

    const __ethAmount = await contract.getEthAmount(_ethAmount);    
    setClmrPrice(parseFloat(ethers.utils.formatEther(__ethAmount)).toFixed(5));
  }

  useEffect(() => {
    const fetchTokenPrice = async () => {
      try {
        getEthAmount();
      } catch (error) {
        console.log("Error fetching token price:", error);
      }
    };
  
    fetchTokenPrice();
  
    return () => {      
    };
  }, []);


  return (
    <header>
      <div className="leftH">
        <img src={Logo} alt="logo" className="logo" />
        <h1 className="dex-name">Caramel Swap</h1>
        <Link to="/" className="link">
          <div className="headerItem">Swap</div>
        </Link>
        <Link to="/pool" className="link">
          <div className="headerItem">Pool</div>
        </Link>        
        <Link to="/cottery" className="link">
          <div className="headerItem">Cottery</div>
        </Link>
      </div>

      <div className="rightH">
        <div className="headerItem">
          <img src={Caramel} alt="clmr" className="clmr" />
          <div className="clmrPrice">{clmrPrice}</div>
          <img src={Eth} alt="eth" className="eth" />Ethereum</div>
          <div className="connectButton" onClick={connectWallet}>
            {isWalletConnect ? walletAddress.slice(0, 4) + "..." + walletAddress.slice(38) : "Connect"}
          </div>
      </div>      
    </header>    
  );
}

export default Header;
