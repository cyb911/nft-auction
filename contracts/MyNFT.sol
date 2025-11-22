// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyNFT is ERC721, Ownable {
    uint256 private _nextTokenId;

    constructor() ERC721("MyNFT","MNT") Ownable(msg.sender) {

    }

    function mint(address to) external onlyOwner returns (uint256) {
        require(to != address(0), "zero address");
        _nextTokenId += 1;
        uint256 tokenId = _nextTokenId;
        _safeMint(to, tokenId);
        return tokenId;
    }

}