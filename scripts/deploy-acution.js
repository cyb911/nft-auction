const hre = require("hardhat");

async function main() {
    const Auction = await hre.ethers.getContractFactory("NftAuction");
    const auction = await Auction.deploy();
    await auction.waitForDeployment();

    const address = await auction.getAddress();

    console.log("NftAuction deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});