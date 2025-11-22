// 合约部署脚本
const hre = require("hardhat");

async function main() {
  const MyNFT = await hre.ethers.getContractFactory("MyNFT");
  const nft = await MyNFT.deploy();
  await nft.waitForDeployment();

  const address = await nft.getAddress();

  console.log("MyNFT deployed to:", address);//0xEAfB1dc9490CA1F25e13F222104Fdd93Fef84893
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});