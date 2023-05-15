import Header from "./components/Header";
import Swap from "./components/Swap";
import Pool from "./components/Pool";
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
        </Routes>
      </div>      
    </div>
  );
}

export default App;
