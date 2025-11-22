const hre = require("hardhat");
const { ethers, network } = hre;

// NFT合约地址
const nftAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
// 拍卖合约地址
const auctionAddress = "0x0165878A594ca255338adfa4d48449f69242Eb8F";

async function main() {
    console.log("=== script start ===");
    // 获取两个账户用于测试
    const [seller, bidder] = await ethers.getSigners();
    console.log("seller:", seller.address);
    console.log("bidder:", bidder.address);

    // 获取合约得地址
    const nft = await ethers.getContractAt("MyNFT",nftAddress);
    const auction = await ethers.getContractAt("NftAuction",auctionAddress);

    // 铸造一个NFT
    const mintNFT = await nft.connect(seller).mint(seller.address);
    const mintReceipt = await mintNFT.wait();
    console.log("NFT minted");

    // 从 Transfer 事件中解析 tokenId
    const transferEvent = mintReceipt.logs.find(
        (log) => log.fragment && log.fragment.name === "Transfer"
    );

    if (!transferEvent) {
        throw new Error("Transfer event not found, cannot parse tokenId");
    }

    const tokenId = transferEvent.args.tokenId;
    console.log("tokenId:", tokenId.toString());

    // 将NFT资产授权给拍卖合约
    await (await nft.connect(seller).approve(auctionAddress, tokenId)).wait();
    console.log("approved tokenId:", tokenId.toString());

    // 创建拍卖
    const minBid = ethers.parseEther("0.1");
    const duration = 60 * 2; // 2 分钟

    const createTx = await auction
    .connect(seller)
    .createAuction(nftAddress, tokenId, minBid, duration);
    await createTx.wait();

    const nextId = await auction.nextAuctionId();
    const auctionId = nextId - 1n;

    console.log("auction created, auctionId:", auctionId.toString());

    // 模拟竞价
    const bidTx = await auction
    .connect(bidder)
    .bid(auctionId, { value: ethers.parseEther("0.2") });
    await bidTx.wait();
    console.log("bid placed");

    await network.provider.send("evm_increaseTime", [60 * 10]); // +10 分钟
    await network.provider.send("evm_mine");
    console.log("time increased 10 min");

    // 结算拍卖
    await (await auction.connect(seller).settleAuction(auctionId)).wait();
    console.log("auction settled");

    // 查看新 owner
    const newOwner = await nft.ownerOf(tokenId);
    console.log("new owner:", newOwner);

    console.log("✅ 全流程已完成");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});