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

    it("ETH-USD 价格", async function () {
        const price = await auctionV2.getLatestEthUsdPrice();
        const feedResult = await priceFeed.latestRoundData();
        const feedPrice = feedResult[1];
        
        // 格式化显示（实际价格 = 原始价格 / 1e8）
        const format = (p) => Number(p) / 1e8;

        console.log("========================================");
        console.log("🟦 Chainlink Oracle Price (Raw):", price.toString());
        console.log("🟩 Chainlink Oracle Price (Formatted):", format(price), "USD");
        console.log("----------------------------------------");
        console.log("🟦 Mock Feed Price (Raw):", feedPrice.toString());
        console.log("🟩 Mock Feed Price (Formatted):", format(feedPrice), "USD");
        console.log("========================================");
        expect(price).to.equal(feedPrice);
    });

    it("1 ETH 对 USD 价格", async function () {
        const usd = await auctionV2.convertEthToUsd(ethers.parseEther("1"));
        const feedPrice = (await priceFeed.latestRoundData())[1];

        const uintUsd = usd.toString();
        const formattedUsd = Number(uintUsd) / 1e8;

        console.log("======================================");
        console.log("🟦 Raw USD (1e8 precision):", uintUsd);
        console.log("🟩 Formatted USD:", formattedUsd, "USD");
        console.log("======================================");

        const expectedUsd = (ethers.parseEther("1") * feedPrice) / (10n ** 18n);
        expect(usd).to.equal(expectedUsd);
    });

    it("起拍价 USD 价值", async function () {
        const usd = await auctionV2.getAuctionMinBidUsd(0);
        console.log("minBid in USD:", usd.toString());

        expect(usd).to.be.gt(0);
    });

    it("最高拍卖 USD 价值", async function () {
        const usd = await auctionV2.getAuctionHighestBidUsd(0);
        console.log("highestBid in USD:", usd.toString());

        expect(usd).to.be.gte(0);
    });
});