const hre = require("hardhat");

async function main() {
  console.log("Deploying UUPS proxy for NftAuctionV1...");
  const Auction = await hre.ethers.getContractFactory("NftAuctionV1");
  const proxy = await hre.upgrades.deployProxy(Auction,[], {
    initializer: "initialize",
    kind: "uups"
  });

  await proxy.waitForDeployment();

  const proxyAddress = await proxy.getAddress();
  const implAddress = await hre.upgrades.erc1967.getImplementationAddress(proxyAddress);

  console.log("Proxy deployed to:", proxyAddress);
  console.log("NftAuctionV1 deployed to:", implAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});