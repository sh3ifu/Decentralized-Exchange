import React, { useState, useEffect } from "react";
import {
  ArrowDownOutlined,
  DownOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { Input, Popover, Radio, Modal} from "antd";
import { ethers } from "ethers";

import Factory from "../artifacts/contracts/Factory.sol/Factory.json";
import Token from "../artifacts/contracts/Token.sol/Token.json";
import jsonData from "./deployedContractsAddresses.json";
const factoryAddress = jsonData.factoryContractAddress;

function Swap() {
  const [slippage, setSlippage] = useState(2.5);
  const [tokenOneAmount, setTokenOneAmount] = useState(null);
  const [tokenTwoAmount, setTokenTwoAmount] = useState(null);
  const [tokenOne, setTokenOne] = useState("");
  const [tokenTwo, setTokenTwo] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [changeToken, setChangeToken] = useState(1);
  const [tokenList, setTokenList] = useState([]);  
  const [tokenSymbols, setTokenSymbols] = useState([]);

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

  function switchTokens() {
    const one = tokenOne;
    const two = tokenTwo;

    setTokenOne(two);
    setTokenTwo(one);
  }

  function openModal(asset) {
    setChangeToken(asset);
    setIsOpen(true);
    getAllTokenAddresses();
  }

  function modifyToken(i) {
    if (changeToken === 1) {
      setTokenOne(tokenSymbols[i]);
    } else {
      setTokenTwo(tokenSymbols[i]);
    }
    setIsOpen(false);
  }

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
      const tokenAddresses = await contract.getAllTokenAddresses();

      setTokenList(tokenAddresses);
      // console.log("All token addresses: ", tokenAddresses);
    } catch (error) {
      console.log("Error: ", error);
    }
  }


  useEffect(() => {
    async function fetchData() {
      const symbols = await Promise.all(
        tokenList.map(async (tokenAddress) => {
          try {
            const tokenSymbol = await getTokenSymbol(tokenAddress);
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
  }, [tokenList]);

  return (
    <>
      <Modal
        open={isOpen}
        footer={null}
        onCancel={() => setIsOpen(false)}
        title="Select a token"
      >
        <div className="modalContent">
          {tokenList && tokenSymbols.map((symbol, i) => {
            return (
              <div
                className="tokenChoice"
                key={i}
                onClick={() => modifyToken(i)}
              >
                <div className="tokenChoiceNames">
                  <div className="tokenName">{symbol}</div>
                  <div className="tokenTicker">{tokenList[i]}</div>
                </div>
              </div>
            );
          })}
        </div>
      </Modal>

      <div className="tradeBox">
        <div className="tradeBoxHeader">
          <h4>Swap</h4>
          <Popover
            content={settings}
            title="Settings"
            trigger="click"
            placement="bottomRight"
          >
            <SettingOutlined className="cog" />
          </Popover>
        </div>

        <div className="inputs">
          <Input
            placeholder="0"
            value={tokenOneAmount}
            onChange={(e) => setTokenOneAmount(e.target.value)}
          />
          <Input placeholder="0" value={tokenTwoAmount} disabled={true} />
          <div className="switchButton" onClick={switchTokens}>
            <ArrowDownOutlined className="switchArrow" />
          </div>
          <div className="assetOne" onClick={() => openModal(1)}>
            {tokenOne} <DownOutlined />
          </div>
          <div className="assetTwo" onClick={() => openModal(2)}>
            {tokenTwo} <DownOutlined />
          </div>
        </div>
        <div className="swapButton">
          Swap
        </div>
      </div>
    </>
  );
}

export default Swap;
