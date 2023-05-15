const hre = require("hardhat");

async function deployContract(name, ...args) {
  const Contract = await hre.ethers.getContractFactory(name);
  const contract = await Contract.deploy(...args);

  await contract.deployed();

  console.log(`${name} deployed to:`, contract.address);
  
  return contract.address;
}

async function main() {
  const decimals = BigInt(10 ** 18);
  const contractAAddress = await deployContract("Token", "GalaxyToken", "GXT", 10000n * decimals);  
  // const contractAAddress = await deployContract("Factory");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
