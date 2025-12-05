const { ethers } = require("hardhat");
const config = require("./config");

describe("NFT 合约测试", function () {
    let myNft;
    // 合约链接
    before(async function () {
        const MyNFT = await ethers.getContractFactory("MyNFT");
        myNft = MyNFT.attach(config.nftAddress);
    });

    it("NFT 铸造", async function () {
        const { owner } = await getSignersSmart();
        const tx = await myNft.connect(owner).mint(owner.address)
        const receipt = await tx.wait();

        console.log("Mint 成功, tokenId 出现在 Transfer 事件里");

        for (const log of receipt.logs) {
            try {
                const event = iface.parseLog(log);
                if (event.name === "Transfer") {
                console.log("tokenId:", event.args.tokenId.toString());
                }
            } catch (_) {}
}

        const event = receipt.logs.find(log => log.fragment?.name === "Transfer");
        console.log("tokenId:", event.args.tokenId.toString());
    })
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