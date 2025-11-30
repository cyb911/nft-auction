// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./NftAuctionV1.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract NftAuctionV2 is NftAuctionV1 {
    // keccak256("nft-auction.storage.v2")
    bytes32 private constant STORAGE_POSITION_V2 = 0x4db1a054d59e8e9ac44f77125613f395bb16938e28edd967b8420ab1fadcbca8;

    struct AuctionStorageV2 {
        address ethUsdPriceFeed; // Chainlink ETH/USD oracle 地址
        bool initializedV2; // 知否已经成功初始化。
    }

    /** 
     * @dev 获取 V2 的独立存储槽
     * @param $ 指向 V2 storage 的内部指针
     */
    function _getStorageV2() private pure returns (AuctionStorageV2 storage $) {
        bytes32 position = STORAGE_POSITION_V2;
        assembly {
            $.slot := position
        }
    }

    function isV2Initialized() external view returns (bool) {
        return _getStorageV2().initializedV2;
    }

    // 升级版初始化函数
    function initializeV2(address _ethUsdFeed) public reinitializer(2) {
        require(_ethUsdFeed != address(0), "invalid feed");
        AuctionStorageV2 storage s2 = _getStorageV2();

        require(!s2.initializedV2, "V2 already initialized");
        s2.ethUsdPriceFeed = _ethUsdFeed;
        s2.initializedV2 = true;
    }

    /** 
     * @dev 获取 ETH-USD 兑换价格
     */
    function getLatestEthUsdPrice() public view returns (int256 price) {
        AuctionStorageV2 storage s2 = _getStorageV2();
        require(s2.ethUsdPriceFeed != address(0), "feed not set");
        AggregatorV3Interface feed = AggregatorV3Interface(s2.ethUsdPriceFeed);
        (, price,,,) = feed.latestRoundData();
    }

    /** 
     * @dev 将 wei 金额转换为美元价格（返回 1e8 精度的 USD 值）,USD = wei * price / 1e18
     */
    function convertEthToUsd(uint256 ethwei) public view returns(uint256) {
        int256 price = getLatestEthUsdPrice(); // 1e8
        require(price > 0, "invalid oracle");

        return (ethwei * uint256(price)) / 1e18;
    }



    /** 
     * @dev 获取拍卖当前最高价的 USD 估值
     */
    function getAuctionHighestBidUsd(uint256 auctionId) external view returns(uint256) {
        return convertEthToUsd(_getStorage().auctions[auctionId].highestBid);
    }

    /** 
     * @dev 获取起拍价 minBid 的 USD 估值
     */
    function getAuctionMinBidUsd(uint256 auctionId) external view returns(uint256) {
        AuctionStorage storage s = _getStorage();
        Auction storage a = s.auctions[auctionId];
        return convertEthToUsd(a.minBid);
    }
}