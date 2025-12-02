const { ethers, upgrades } = require("hardhat");

async function main() {
  console.log("==== Upgrade to NftAuctionV2 ====");
  // 获取 Proxy 地址
  const proxyAddress = "0xC6Ab7C475311c3B9772c7dD90b11F10fBe5650e8";
  // 预言机地址
  const mockFeedAddress = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";

  // 获取V2合约工厂
  const NftAuctionV2 = await ethers.getContractFactory("NftAuctionV2");

  console.log("Deploying V2 implementation...");
  const proxy = await upgrades.upgradeProxy(proxyAddress, NftAuctionV2);
  await proxy.waitForDeployment();

  const implAddress = await upgrades.erc1967.getImplementationAddress(proxyAddress);

  console.log("--------------------------------------");
  console.log("Proxy Address:         ", await proxy.getAddress());
  console.log("New Implementation:    ", implAddress);
  console.log("--------------------------------------");

  console.log("Checking V2 initialization...");
  const initialized = await proxy.isV2Initialized();
  if (!initialized) {
    console.log("Calling initializeV2...");
    // 调用 initializeV2 设置预言机地址
    const tx = await proxy.initializeV2(mockFeedAddress);
    await tx.wait();
  } else {
    console.log("V2 already initialized, skipping.");
  }

  console.log("initializeV2 done.");
  console.log("===== Upgrade Complete =====");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});