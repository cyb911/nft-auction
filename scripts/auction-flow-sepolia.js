const { ethers, network } = require("hardhat");

// NFT合约地址
const nftAddress = "0x604FEa51ab6743621FE804F2891f1898060741E8";
// 拍卖合约地址
const auctionAddress = "0xc2c0d3F53A7D737C8146Fe1A5d3eC2eBb05b6E80";

async function main() {
    console.log("=== script start ===");
    // 获取两个账户用于测试
    const { seller, bidder } = await getSignersSmart();
    console.log("seller:", seller.address);
    console.log("bidder:", bidder.address);

    // 获取合约得地址
    const nft = await ethers.getContractAt("MyNFT",nftAddress, seller);
    const auction = await ethers.getContractAt("NftAuctionV1",auctionAddress, bidder);

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

    const nextId = await auction.getNextAuctionId();
    const auctionId = nextId - 1n;

    console.log("auction created, auctionId:", auctionId.toString());

    // 模拟竞价
    const bidTx = await auction
    .connect(bidder)
    .bid(auctionId, { value: ethers.parseEther("0.2") });
    await bidTx.wait();
    console.log("bid placed");

    if (network.name === "hardhat" || network.name === "localhost") {
        await network.provider.send("evm_increaseTime", [60 * 10]);
        await network.provider.send("evm_mine");
        console.log("time increased 10 min");
    } else {
        console.log("⏳ sepolia 上无法加速时间，请等待真实时间结束后再 settle");
    }

    // 结算拍卖
    await (await auction.connect(seller).settleAuction(auctionId)).wait();
    console.log("auction settled");

    // 查看新 owner
    const newOwner = await nft.ownerOf(tokenId);
    console.log("new owner:", newOwner);

    console.log("✅ 全流程已完成");
}

async function getSignersSmart() {
    if (network.name === "localhost" || network.name === "hardhat") {
        // 本地环境 → 使用内置账户
        const [seller, bidder] = await ethers.getSigners();
        return { seller, bidder };
    }

    // 真实网络（sepolia/mainnet）→ 使用环境变量里的私钥
    const provider = ethers.provider;

    const seller = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const bidder = new ethers.Wallet(process.env.BIDDER_KEY, provider); 
    // 如果想一个人测试，也可以 bidder = seller

    return { seller, bidder };
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});