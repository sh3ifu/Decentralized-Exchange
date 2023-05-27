import React, { useState, useEffect } from "react";
import Logo from "../chocolate_logo.png";
import Eth from "../ethereum.png";
import { Link } from "react-router-dom";
import { ethers } from "ethers";

function Header() {
  const [walletAddress, setWalletAddress] = useState("");
  const [isWalletConnect, setIsWalletConnect] = useState(false);

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
        <Link to="/lottery" className="link">
          <div className="headerItem">Lottery</div>
        </Link>
      </div>

      <div className="rightH">
        <div className="headerItem">
          <img src={Eth} alt="eth" className="eth" />
          Ethereum
        </div>
        <div className="connectButton" onClick={connectWallet}>
          {isWalletConnect ? walletAddress.slice(0, 4) + "..." + walletAddress.slice(38) : "Connect"}
        </div>
      </div>
    </header>
  );
}

export default Header;
