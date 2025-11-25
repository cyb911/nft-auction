const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log("==== Upgrade to NftAuctionV2 ====");
  // 获取 Proxy 地址
  const proxyAddress = "";
  // 预言机地址
  const mockFeedAddress = "";

  // 获取V2合约工厂
  const NftAuctionV2 = await ethers.getContractFactory("NftAuctionV2");

  console.log("Deploying V2 implementation...");
  const v2 = await upgrades.upgradeProxy(proxyAddress, NftAuctionV2);
  await proxy.waitForDeployment();

  console.log("Upgraded to V2 at proxy:", await v2.getAddress());

  // 调用 initializeV2 设置预言机地址

  console.log("Calling initializeV2() ...");
  const tx = await v2.initializeV2(mockFeedAddress);
  await tx.wait();

  console.log("initializeV2 done.");
  console.log("===== Upgrade Complete =====");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});