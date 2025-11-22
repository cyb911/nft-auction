// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MyNFT.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";

contract NftAuction is ReentrancyGuard, ERC721Holder {
    struct Auction {
        address seller;         // 卖家
        address nft;            // NFT 合约地址
        uint256 tokenId;        // NFT 的 tokenId
        uint256 minBid;         // 起拍价（单位：wei）
        uint64  endTime;        // 结束时间戳
        bool    settled;        // 是否已结算
        address highestBidder;  // 当前最高出价者
        uint256 highestBid;     // 当前最高出价金额
    }

    // 拍卖 ID 自增
    uint256 public nextAuctionId;
    mapping(uint256 => Auction) public auctions;

    // 提取模式存储：用户待领取的退款
    mapping(address => uint256) public pendingReturns;

    /** 
     * @dev 创建拍卖
     * @param nft NFT 合约地址
     * @param tokenId NFT 合约地址
     * @param minBid 起拍价（wei）
     * @param duration 拍卖持续时间（秒）
     * PS： 需要NFT所有者先进行approve 给本合约，本函数需要对NFT进行所有者判断。确保NFT资产不会被其他人创建拍卖
     */
     function createAuction(address nft,uint256 tokenId,uint256 minBid,uint64 duration) 
     external returns (uint256) {
        require(duration > 0, "duration must > 0");
        require(minBid > 0, "minBid must > 0");

        MyNFT nftContract = MyNFT(nft);

        // 确认 msg.sender 是当前 NFT owner
        require(nftContract.ownerOf(tokenId) == msg.sender, "not owner");

        //NFT 是否授权给拍卖合约
        require(
            nftContract.getApproved(tokenId) == address(this) ||
            nftContract.isApprovedForAll(msg.sender, address(this)),
            "auction not approved"
        );

        // 把 NFT 转到拍卖合约里托管
        nftContract.safeTransferFrom(msg.sender, address(this), tokenId);

        uint256 auctionId = nextAuctionId++;
        Auction storage a = auctions[auctionId];

        a.seller = msg.sender;
        a.nft = nft;
        a.tokenId = tokenId;
        a.minBid = minBid;
        a.endTime = uint64(block.timestamp) + duration;

        return auctionId;
     }
     /**
     * @dev 出价(退款使用提取模式)
     * @param auctionId 出价方账户地址
     */
     function bid(uint256 auctionId) external payable nonReentrant {
        Auction storage a = auctions[auctionId];

        require(a.seller != address(0), "auction not exist");
        require(block.timestamp < a.endTime, "auction ended");
        require(!a.settled, "auction settled");
        require(msg.value >= a.minBid, "bid < minBid");
        require(msg.value > a.highestBid, "bid not highest");

        // 退还上一位出价者支付得金额
        if (a.highestBidder != address(0)) { // 首次出价，不用退款
            pendingReturns[a.highestBidder] += a.highestBid;
        }

        a.highestBidder = msg.sender;
        a.highestBid = msg.value;

     }

    /**
     * @dev 结算拍卖
     * - 如果有最高出价者：NFT -> winner，ETH -> seller
     * - 如果没人出价：NFT 退还给 seller
     */
     function settleAuction(uint256 auctionId) external nonReentrant {
        Auction storage a = auctions[auctionId];

        require(a.seller != address(0), "auction not exist");
        require(block.timestamp >= a.endTime, "auction not ended");
        require(!a.settled, "already settled");
        
        a.settled = true;

        MyNFT nftContract = MyNFT(a.nft);

        if (a.highestBidder != address(0)) {
            // 把 NFT 转给获胜者
            nftContract.safeTransferFrom(address(this), a.highestBidder, a.tokenId);

            // 卖家的金额进入待提取（避免付款被阻塞）
            pendingReturns[a.seller] += a.highestBid;
        } else {
            // 没人出价，退回 NFT
            nftContract.safeTransferFrom(address(this), a.seller, a.tokenId);
        }
     }

     /**
     * @dev 取消拍卖（只允许在没人出价时取消）
     */
    function cancelAuction(uint256 auctionId) external nonReentrant {
        Auction storage a = auctions[auctionId];

        require(a.seller != address(0), "auction not exist");
        require(msg.sender == a.seller, "not seller");
        require(!a.settled, "already settled");
        require(a.highestBidder == address(0), "already has bid");

        a.settled = true;

        MyNFT nftContract = MyNFT(a.nft);
        nftContract.safeTransferFrom(address(this), a.seller, a.tokenId);
    }

     /**
     * @dev 提取退款
     */
    function withdraw() external nonReentrant {
        uint256 amount = pendingReturns[msg.sender];
        require(amount > 0, "no funds");

        //先清零（避免重入）
        pendingReturns[msg.sender] = 0;

        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "withdraw failed");
    }
}