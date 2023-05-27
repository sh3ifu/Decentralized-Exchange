import React, { useState, useEffect } from "react";
import Caramel from "../caramel.png";
import { Input } from "antd";
import { ethers } from "ethers";

import "./Cottery.css";

import CotteryContract from "../artifacts/contracts/Cottery.sol/Cottery.json";
import CaramelToken from "../artifacts/contracts/CaramelToken.sol/CaramelToken.json";
import CotteryFactory from "../artifacts/contracts/CotteryFactory.sol/CotteryFactory.json";
import jsonData from "./deployedContractsAddresses.json";
const cotteryFactoryAddress = jsonData.cotteryFactoryContractAddress;
const deploymentPrivateKey = jsonData.deploymentPrivateKey;
const caramelTokenAddress = jsonData.caramelTokenAddress;

function Cottery() {
  const [countdown, setCountdown] = useState(10);
  const [currentCottery, setCurrentCottery] = useState("");
  const [bidAmount, setBidAmount] = useState("");
  const [cotteryStatus, setCotteryStatus] = useState("Cottery starts:");
  const [prizePool, setPrizePool] = useState(0);
  const [highestBid, setHighestBid] = useState(0);
  const [currentPoolSize, setCurrentPoolSize] = useState(0);

  const handleInputChange = (e) => {
    setBidAmount(e.target.value);    
  };

  // Функція оновлення таймера після закінчення лотереї
  const resetTimer = () => {
    setCountdown(300);    
  };

  // Оновлення таймера кожну секунду
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prevCountdown) => {
        if (prevCountdown > 0) {          
          return prevCountdown - 1;
        } else {
          resetTimer();
          setCotteryStatus("Cottery ends: ");
          performActions();
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const performActions = async () => {
    await endAuction();
    await createNewCottery();
    await getPrizePool();    
  };

  // Перетворення секунд у формат часу (хвилини: секунди)
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };


//  General blockchain functions -------------------------------
  function checkMetamask(Contract, contractAddress) {
    // If MetaMask exists
    if (typeof window.ethereum !== "undefined") {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(contractAddress, Contract.abi, provider);

      return contract;
    }
  }

  async function requestAccount() {
    await window.ethereum.request({ method: "eth_requestAccounts" });
  }


// Cottery functions -------------------------------------------

  async function createNewCottery() {
    if (typeof window.ethereum !== "undefined") {
        await requestAccount();

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const wallet = new ethers.Wallet(deploymentPrivateKey, provider);

        const contractCotteryFactory = new ethers.Contract(cotteryFactoryAddress, CotteryFactory.abi, wallet);

        try {
          const transaction = await contractCotteryFactory.createCottery();
          await transaction.wait();
          console.log('Cottery created! ');
        } catch (error) {
          console.log("Error: ", error);
        }
      }    
  }

  async function getLatestCotteryAddress() {
    if (typeof window.ethereum !== "undefined") {
      await requestAccount();

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contractCotteryFactory = new ethers.Contract(cotteryFactoryAddress, CotteryFactory.abi, provider);
    
      const latestCotteryAddress = await contractCotteryFactory.latestCottery();
      setCurrentCottery(await latestCotteryAddress);
      console.log('cottery address: ', latestCotteryAddress);
      return latestCotteryAddress;
    }
  }

  async function getPrizePool() {    
    if (typeof window.ethereum !== "undefined") {
      await requestAccount();
      const cottery_address = await getLatestCotteryAddress();

      try {        
        const provider = new ethers.providers.Web3Provider(window.ethereum);        
        const _cotteryContract = new ethers.Contract(cottery_address, CotteryContract.abi, provider);
      
        const prizePool = await _cotteryContract.prizePool();
        setPrizePool(parseFloat(ethers.utils.formatEther(prizePool)).toFixed(0));
      } catch(error) {
        console.log(error);
      }      
    }
  }

  async function placeBid() {
    if (typeof window.ethereum !== "undefined") {
      await requestAccount();

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const _cotteryContract = new ethers.Contract(currentCottery, CotteryContract.abi, signer);
      const tokenContract = new ethers.Contract(caramelTokenAddress, CaramelToken.abi, signer);

      const _bidAmount = ethers.utils.parseEther(bidAmount);      
      await tokenContract.approve(currentCottery, _bidAmount);      

      try {
        const transaction = await _cotteryContract.placeBid(_bidAmount);
        await transaction.wait();
        console.log('Bid successfull!');
        setHighestBid(bidAmount);
        setBidAmount("");
        await getContractTokenBalance();
      } catch (error) {
        console.log("Error: ", error);
      }
    } 
  }

  async function endAuction() {
    if (typeof window.ethereum !== "undefined") {
      await requestAccount();
      const cottery_address = await getLatestCotteryAddress();

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const wallet = new ethers.Wallet(deploymentPrivateKey, provider);      

      const _cotteryContract = new ethers.Contract(cottery_address, CotteryContract.abi, wallet);

      try {
        const transaction = await _cotteryContract.endAuction();
        await transaction.wait();
        console.log('Withdraw successfull!');
        setHighestBid(0);
        setCurrentPoolSize(0);
        setBidAmount("");
      } catch (error) {
        console.log("Error: ", error);
      }
    }
  }

  async function getContractTokenBalance() {
    if (typeof window.ethereum !== "undefined") {
      await requestAccount();

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const tokenContract = new ethers.Contract(caramelTokenAddress, CaramelToken.abi, provider);
    
      const balance = await tokenContract.balanceOf(currentCottery);
      setCurrentPoolSize(parseFloat(ethers.utils.formatEther(balance)).toFixed(0));      
      console.log(parseFloat(ethers.utils.formatEther(balance)).toFixed(0));
    }
  }


  return (
    <div>
      <div className="lotteryBox">
        <div className="lotteryBoxHeader">
          <div className="lotteryTitle">
            <h2>Cottery</h2>
            <div className="flex-container">
              <p>Stake Caramel, Earn Caramel, Win Caramel</p>
              <img src={Caramel} className="caramel_ico" />
            </div>
            <div className="line"></div>
          </div>
        </div>
        <Input 
          onChange={handleInputChange}
          value={bidAmount}
          placeholder="Bid amount" 
        />
        <div className="lotteryInfo">
          <div className="info">
            <div className="textInfo">Highest bid:</div>
            <div className="countInfo">{highestBid} CRML</div>
          </div>
          <div className="info">
            <div className="textInfo">Award:</div>
            <div className="countInfo">{prizePool} CRML</div>
          </div>          
          <div className="info">
            <div className="textInfo">Current pool size:</div>
            <div className="countInfo">{currentPoolSize} CRML</div>
          </div>
        </div>

        <div>{cotteryStatus} {formatTime(countdown)}</div>
        <div className="line"></div>
        <div className="swapButton" onClick={placeBid}>Bid Caramel</div>
      </div>
    </div>
  );
}

export default Cottery;
