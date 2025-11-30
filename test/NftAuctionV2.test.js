const { ethers, upgrades } = require("hardhat");
const { expect } = require("chai");
const config = require("./config");

describe("NftAuction V2 测试", function () {
    let auctionV2;
    let priceFeed;

    // 先进行合约的连接
    before(async function () {
        // 连接到已部署的 V2（proxy 地址）
        const NftAuctionV2 = await ethers.getContractFactory("NftAuctionV2");
        auctionV2 = NftAuctionV2.attach(config.proxyAddress);

        // 连接到已部署的 mock oracle
        const MockFeed = await ethers.getContractFactory("MockV3Aggregator");
        priceFeed = MockFeed.attach(config.mockFeedAddress);
    });

    // 测试V2合约是否部署成功
    it("V2合约是否已经成功初始化", async function () {
        const initialized = await auctionV2.isV2Initialized();
        expect(initialized).to.eq(true);
    });
});