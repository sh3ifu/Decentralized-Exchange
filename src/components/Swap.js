import React, { useState, useEffect } from "react";
import {ArrowDownOutlined, DownOutlined, SettingOutlined} from "@ant-design/icons";
import { Input, Popover, Radio, Modal, message } from "antd";

function Swap() {
  const [tokenOneAmount, setTokenOneAmount] = useState(null);
  const [tokenTwoAmount, setTokenTwoAmount] = useState(null);
  const [slippage, setSlippage] = useState(2.5);
  const [tokenOne, setTokenOne] = useState("USDC");
  const [tokenTwo, setTokenTwo] = useState("ETH");


  function switchTokens() {
    const one = tokenOne;
    const two = tokenTwo;

    setTokenOne(two);
    setTokenTwo(one);
  }

  const settings = (
    <>
      <div>Slippage Tolerance</div>
      <div>
        <Radio.Group value={slippage} onChange={(e) => setSlippage(e.target.value)}>
          <Radio.Button value={0.5}>0.5%</Radio.Button>
          <Radio.Button value={2.5}>2.5%</Radio.Button>
          <Radio.Button value={5}>5.0%</Radio.Button>
        </Radio.Group>
      </div>
    </>
  );

  return (
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
        <Input placeholder="0" value={tokenOneAmount} onChange={(e) => setTokenOneAmount(e.target.value)} />
        <Input placeholder="0" value={tokenTwoAmount} disabled={true} />
        <div className="switchButton" onClick={switchTokens}>
          <ArrowDownOutlined className="switchArrow"/>
        </div>
        <div className="assetOne">{tokenOne}</div>
        <div className="assetTwo">{tokenTwo}</div>
      </div>
      <div className="swapButton" >Swap</div>
    </div>
  );
}

export default Swap;
