const { ethers } = require("hardhat");

const DECIMALS = 8;
const INITIAL_PRICE = "200000000000"; // 2000 USD, 8 decimals

async function main() {
    const MockV3Aggregator = await ethers.getContractFactory("MockV3Aggregator");
    const mock = await MockV3Aggregator.deploy(DECIMALS,INITIAL_PRICE);
    await mock.waitForDeployment();

    const address = await mock.getAddress();

    console.log("MockV3Aggregator deployed to:", address);
}


main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});