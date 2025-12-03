const fs = require("fs");
const path = require("path");

const artifact = require("../artifacts/contracts/NftAuctionV1.sol/NftAuctionV1.json");

// 导出 ABI
fs.writeFileSync(
  path.join(__dirname, "../NftAuctionV1.abi"),
  JSON.stringify(artifact.abi, null, 2)
);

// 导出 bytecode（去除 0x 前缀，让 abigen 支持）
const bytecode = artifact.bytecode.startsWith("0x")
  ? artifact.bytecode.slice(2)
  : artifact.bytecode;

fs.writeFileSync(
  path.join(__dirname, "../NftAuctionV1.bin"),
  bytecode
);

console.log("导出成功: NftAuctionV1.abi & NftAuctionV1.bin");