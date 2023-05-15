import React, { useState, useEffect } from "react";
import { Input } from "antd";

function Swap() {
  const [tokenOneAmount, setTokenOneAmount] = useState(null);
  const [tokenTwoAmount, setTokenTwoAmount] = useState(null);

  function changeAmount(e) {
    setTokenOneAmount(e.target.value);
  }

  return (
    <div className="tradeBox">
      <div className="tradeBoxHeader">
        <h4>Swap</h4>
      </div>

      <div className="inputs">
        <Input placeholder="0" value={tokenOneAmount} onChange={changeAmount} />
        <Input placeholder="0" value={tokenTwoAmount} disabled={true} />
        <div className="assetOne"></div>
        <div className="assetTwo"></div>
      </div>
      <div className="swapButton" >Swap</div>
    </div>
  );
}

export default Swap;
