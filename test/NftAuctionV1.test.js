const { ethers } = require("hardhat");
const config = require("./config");

describe("NftAuction V1 测试", function () {
    let auction;
    let myNft;
    let owner;

    // 先进行合约的连接
    before(async function () {
        // 连接到已部署的地址（proxy 地址）
        const NftAuctionV1 = await ethers.getContractFactory("NftAuctionV1");
        auction = NftAuctionV1.attach(config.proxyAddress);

        ({ owner } = await getSignersSmart());
        myNft = await ethers.getContractAt("MyNFT",config.nftAddress, owner);
        console.log("owner:", owner.address);
        console.log("NFT address:", config.nftAddress);
        console.log("Auction address:", config.proxyAddress);
    });

    it("NFT 授权给 NftAuction", async function () {
        // 将NFT资产授权给拍卖合约
        console.log("auctionAddress:", config.proxyAddress);
        const tx = await myNft.connect(owner).approve(config.proxyAddress, 3);
        const receipt = await tx.wait();
        console.log("approve 成功，gasUsed:", receipt.gasUsed.toString());
    });

    it("查询 NFT 授权给who", async function () {
        const tokenId = 3;
        const approved = await myNft.getApproved(tokenId);
        console.log(`tokenId ${tokenId} 授权给地址:`, approved);
    });

    it.only("创建拍拍卖", async function () {
        const minBid = ethers.parseEther("0.1");
        const duration = 60 * 2; // 2 分钟
        const tokenId = 3;
        const createTx = await auction.connect(owner).createAuction(config.nftAddress, tokenId, minBid, duration);
        await createTx.wait();
        
        const nextId = await auction.getNextAuctionId();
        const auctionId = nextId - 1n;
        
        console.log("auction created, auctionId:", auctionId.toString());
    });
});

async function getSignersSmart() {
    if (network.name === "localhost" || network.name === "hardhat") {
        // 本地环境 → 使用内置账户
        const [owner] = await ethers.getSigners();
        return { owner };
    }

    // 真实网络（sepolia/mainnet）→ 使用环境变量里的私钥
    const provider = ethers.provider;

    const owner = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    return { owner };
}