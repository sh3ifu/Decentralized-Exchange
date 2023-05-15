import { useState } from "react";
import { ethers } from "ethers";
import { Input } from "antd";

import "./Pool.css";

import Factory from "../artifacts/contracts/Factory.sol/Factory.json";
import Exchange from "../artifacts/contracts/Exchange.sol/Exchange.json";
import Token from "../artifacts/contracts/Token.sol/Token.json";

const factoryAddress = "0x6d9d776397d4DfBdb07Bd0df84b7260Bf10C3ab0";

function Pool() {
  const [tokenAddress, setTokenAddress] = useState("");
  const [exchangeCreation, setExchangeCreation] = useState("");
  const [selectedOption, setSelectedOption] = useState("addLiquidity");
  const [f_deposit, setFDeposit] = useState(0);
  const [s_deposit, setSDeposit] = useState("");

  const handleInputChange = (e) => {
    setTokenAddress(e.target.value);
    setExchangeCreation("");
  };

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


  async function createExchange() {
    if (typeof window.ethereum !== "undefined") {
      await requestAccount();

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(factoryAddress, Factory.abi, signer);

      try {
        const transaction = await contract.createExchange(tokenAddress);
        await transaction.wait();

        setExchangeCreation("Exchange successfully created!!!");
        console.log("Exchange successfully created!!!");
      } catch(error) {
        setExchangeCreation("Address error");
        console.log(error);
      }
    }
  }

  async function getExchange() {
    const contract = checkMetamask(Factory, factoryAddress);

    try {
      const exchange = await contract.getExchange(tokenAddress);

      console.log("Exchange: ", exchange);

      setTokenAddress("");
    } catch (error) {
      console.log("Error: ", error);
    }
  }

  async function getTokenAmount() {
    const contract = checkMetamask(
      Exchange,
      "0x3545C95Cc60AC0AAAaEeA4b1FA9dB4720942529a"
    );

    try {
      const tokenValue = ethers.utils.parseEther("3");
      const tokenAmount = await contract.getTokenAmount(tokenValue);
      let hexValue = tokenAmount._hex;
      hexValue = hexValue.replace("0x", ""); // Удаляем префикс "0x"
      var decimalValue = parseInt(hexValue, 16);

      console.log("Token Amount: ", decimalValue);
    } catch (error) {
      console.log("Error: ", error);
    }
  }

  async function getEthAmount() {
    const contract = checkMetamask(
      Exchange,
      "0x3545C95Cc60AC0AAAaEeA4b1FA9dB4720942529a"
    );

    try {
      const ethAmount = await contract.getEthAmount("90");
      let hexValue = ethAmount._hex;
      hexValue = hexValue.replace("0x", ""); // Удаляем префикс "0x"
      var decimalValue = parseInt(hexValue, 16);

      console.log("Eth Amount: ", decimalValue);
    } catch (error) {
      console.log("Error: ", error);
    }
  }

  async function addLiquidity() {
    if (typeof window.ethereum !== "undefined") {
      await requestAccount();

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const contractExchange = new ethers.Contract(
        "0x3545C95Cc60AC0AAAaEeA4b1FA9dB4720942529a",
        Exchange.abi,
        signer
      );
      const contractToken = new ethers.Contract(
        "0x7078E0a8c876d4a1967B7634c9E4B82Bb9a53A19",
        Token.abi,
        signer
      );

      const ethValue = ethers.utils.parseEther(f_deposit);
      const tokenValue = ethers.utils.parseEther(s_deposit);

      await contractToken.approve(contractExchange.address, tokenValue);

      try {
        const transaction = await contractExchange.addLiquidity(tokenValue, {
          value: ethValue,
        });
        await transaction.wait();
      } catch (error) {
        console.log("Error: ", error);
      }
    }
  }

  async function getReserve() {
    const contract = checkMetamask(
      Exchange,
      "0x3545C95Cc60AC0AAAaEeA4b1FA9dB4720942529a"
    );

    try {
      const reserve = await contract.getReserve();
      let hexValue = reserve._hex;
      hexValue = hexValue.replace("0x", ""); // Удаляем префикс "0x"
      var decimalValue = parseInt(hexValue, 16);

      console.log("Reserve: ", decimalValue);
    } catch (error) {
      console.log("Error: ", error);
    }
  }


  return (
    <div className="poolBox">
      <div className="poolBoxHeader">
        <div className="buttonGroup">
          <button class="pool-control-btn" onClick={(e) => setSelectedOption("addLiquidity")}>Add</button>
          <button class="pool-control-btn" onClick={(e) => setSelectedOption("removeLiquidity")}>Remove</button>
          <button class="pool-control-btn" onClick={(e) => setSelectedOption("createExchange")}>Create</button>
        </div>
      </div>

      {selectedOption === "addLiquidity" && (
        <div>
          <Input placeholder="0" />
          <Input placeholder="0" disabled={true} />
          <div className="swapButton">Add Liquidity</div>
        </div>
      )}

      {selectedOption === "removeLiquidity" && (
        <div>
          <Input placeholder="0" />
          <Input placeholder="0" disabled={true} />
          <div className="swapButton">Remove Liquidity</div>
        </div>
      )}

      {selectedOption === "createExchange" && (
        <div>
          <Input 
            onChange={handleInputChange}
            value={tokenAddress}
            placeholder="Token Address" 
          />
          <div className="swapButton" onClick={createExchange}>Create Exchange</div>
          <h3 style={{ color: exchangeCreation === 'Address error' ? 'red' : 'green' }}>{exchangeCreation}</h3>
        </div>
      )}
    </div>
  );
}

export default Pool;
