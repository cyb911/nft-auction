// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MyNFT.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";

contract NftAuctionV1 is Initializable,UUPSUpgradeable,OwnableUpgradeable,ReentrancyGuardUpgradeable, ERC721Holder {
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

    // 命名空间存储，避免使用gap.目的：方式升级后导致历史存储炸掉
    struct AuctionStorage {
        // 拍卖 ID 自增
        uint256 nextAuctionId;
        mapping(uint256 => Auction) auctions;
        // 提取模式存储：用户待领取的退款
        mapping(address => uint256) pendingReturns;
    }
    // keccak256("nft-auction.storage.main")
    bytes32 private constant STORAGE_POSITION = 0xd3aa3faf77c45e7e5cacaa6f46bbf7a522da316b92ce40938e425c205b5fff00;

    /** 
     * @dev 获取合约 storage 指针.该合约不能是private，便于升级合约可以访问旧合约的slot
     * @param $ NFT 合约地址
     */
    function _getStorage() internal pure returns (AuctionStorage storage $) {
        bytes32 position = STORAGE_POSITION;
        assembly {
            $.slot := position
        }
    }

    // UUPS 初始化函数
    function initialize() public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();
    }

    // UUPS 合约必须实现 _authorizeUpgrade(address)，用于控制谁能升级合约。升级时由 Proxy.upgradeTo() 调用该函数。
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {
        // 空函数体
    }

    // 创建合约事件
    event AuctionCreated(
    uint256 indexed auctionId,
    address indexed seller,
    address indexed nft,
    uint256 tokenId,
    uint256 minBid,
    uint64 endTime
);

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

        AuctionStorage storage s = _getStorage();

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

        uint256 auctionId = s.nextAuctionId++;
        Auction storage a = s.auctions[auctionId];

        a.seller = msg.sender;
        a.nft = nft;
        a.tokenId = tokenId;
        a.minBid = minBid;
        a.endTime = uint64(block.timestamp) + duration;

        // 事件
        emit AuctionCreated(auctionId, msg.sender, nft, tokenId, minBid, a.endTime);

        return auctionId;
     }
     /**
     * @dev 出价(退款使用提取模式)
     * @param auctionId 出价方账户地址
     */
     function bid(uint256 auctionId) external payable nonReentrant {
        AuctionStorage storage s = _getStorage();
        Auction storage a = s.auctions[auctionId];

        require(a.seller != address(0), "auction not exist");
        require(block.timestamp < a.endTime, "auction ended");
        require(!a.settled, "auction settled");
        require(msg.value >= a.minBid, "bid < minBid");
        require(msg.value > a.highestBid, "bid not highest");

        // 每次出价，最低幅度不能低于上一个出价的10%
        require(msg.value >= a.highestBid + (a.highestBid / 10),"bid too small");

        // 退还上一位出价者支付得金额
        if (a.highestBidder != address(0)) { // 首次出价，不用退款
            s.pendingReturns[a.highestBidder] += a.highestBid;
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
        AuctionStorage storage s = _getStorage();
        Auction storage a = s.auctions[auctionId];

        require(a.seller != address(0), "auction not exist");
        require(block.timestamp >= a.endTime, "auction not ended");
        require(!a.settled, "already settled");
        
        a.settled = true;

        MyNFT nftContract = MyNFT(a.nft);

        if (a.highestBidder != address(0)) {
            // 把 NFT 转给获胜者
            nftContract.safeTransferFrom(address(this), a.highestBidder, a.tokenId);

            // 卖家的金额进入待提取（避免付款被阻塞）
            s.pendingReturns[a.seller] += a.highestBid;
        } else {
            // 没人出价，退回 NFT
            nftContract.safeTransferFrom(address(this), a.seller, a.tokenId);
        }
     }

     /**
     * @dev 取消拍卖（只允许在没人出价时取消）
     */
    function cancelAuction(uint256 auctionId) external nonReentrant {
        AuctionStorage storage s = _getStorage();
        Auction storage a = s.auctions[auctionId];

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
        AuctionStorage storage s = _getStorage();
        uint256 amount = s.pendingReturns[msg.sender];
        require(amount > 0, "no funds");

        //先清零（避免重入）
        s.pendingReturns[msg.sender] = 0;

        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "withdraw failed");
    }

    function getNextAuctionId() external view returns(uint256) {
        return _getStorage().nextAuctionId;
    }
}