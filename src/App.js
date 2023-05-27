import Header from "./components/Header";
import Swap from "./components/Swap";
import Pool from "./components/Pool";
import Lottery from "./components/Lottery";
import GitHub from "./github_logo.png";
import LinkedIn from "./linkedin_logo.png";
import { Routes, Route } from "react-router-dom";
import "./App.css";

function App() {
  return (
    <div className="App">
      <Header />
      <div className="mainWindow">
        <Routes>
          <Route path="/" element={<Swap />} />
          <Route path="/pool" element={<Pool />} />          
          <Route path="/lottery" element={<Lottery />} />
        </Routes>
      </div>
      
      <footer>
        <h3 className="creator">Created by Denys Datskov</h3>
        <div className="social_icons">
        <a href="https://github.com/sh3ifu/Decentralized-Exchange" target="_blank" rel="noopener noreferrer">
          <img src={GitHub} className="git_ico"/>
        </a>
        <a href="https://www.linkedin.com/in/denis-datskov/" target="_blank" rel="noopener noreferrer">
          <img src={LinkedIn} className="linkedin_ico"/>
        </a>          
        </div>
      </footer>

    </div>
  );
}

export default App;
