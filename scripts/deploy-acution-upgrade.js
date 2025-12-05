const { ethers, upgrades } = require("hardhat");
const config = require("../test/config");

async function main() {
  console.log("==== Upgrade to NftAuction ====");
  // 获取 Proxy 地址
  const proxyAddress = config.proxyAddress

  // 获取V2合约工厂
  const NftAuction = await ethers.getContractFactory("NftAuctionV1");

  console.log("Deploying implementation...");
  const proxy = await upgrades.upgradeProxy(proxyAddress, NftAuction);
  await proxy.waitForDeployment();

  const implAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);

  console.log("--------------------------------------");
  console.log("Proxy Address:         ", await proxy.getAddress());
  console.log("New Implementation:    ", implAddress);
  console.log("--------------------------------------");
  console.log("===== Upgrade Complete =====");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});