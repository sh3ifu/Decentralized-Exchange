const hre = require("hardhat");
const fs = require('fs');

async function deployContract(name, ...args) {
  const Contract = await hre.ethers.getContractFactory(name);
  const contract = await Contract.deploy(...args);

  await contract.deployed();

  console.log(`${name} deployed to:`, contract.address);
  
  return contract.address;
}

function writeToFile(filename, data){
  fs.writeFileSync(filename, JSON.stringify(data));
}

async function main() {
  const decimals = BigInt(10 ** 18);
  const tokenContractAddress = await deployContract("Token", "Suraynded Pip", "SRP", 5000n * decimals);
  const tokenContractAddress1 = await deployContract("Token", "GalaxySwap Token", "GLX", 5000n * decimals);
  const tokenContractAddress2 = await deployContract("Token", "Chain Link", "Link", 5000n * decimals);
  const factoryContractAddress = await deployContract("Factory");

  writeToFile('./src/components/deployedContractsAddresses.json', { factoryContractAddress:  factoryContractAddress});
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
