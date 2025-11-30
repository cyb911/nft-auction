# Sample Hardhat Project

## 📦 项目结构
```
    ├── contracts                   (合约)
        ├── interfaces              (合约接口)
    ├── scripts                     (部署脚本)  
    ├── test                        (单元测试用例)
        ├── config.js               (模块配置参数)
        ├── deploy-mock.js          (MOCK 预言机合约部署脚本)                           
        ├── NftAuctionV2.test.js    (V2合约测试脚本)                        
    ├── hardhat.config.js           (Hardhat项目配置)                                                                                       

项目依赖安装  
Hardhat 2
```shell
npm install hardhat@2.22.8 --save-dev
npx hardhat --version
npx hardhat
```
环境变量：dotenv
```shell
npm install dotenv --save-dev
```

openzeppelin
```shell
npm install @openzeppelin/contracts-upgradeable@latest
npm install --save-dev @openzeppelin/hardhat-upgrades
```

预言机依赖（Hardhat 环境）
```shell
npm install @chainlink/contracts
```

项目启动  
1.启动Hardhat本地网络（本地测试需要）
```shell
npx hardhat node
```

2.部署NFT合约脚本  
PS: 部署前先启动 hardhat 本地网络，或者保证有其他可用网络
NFT合约  
```shell
npx hardhat run .\scripts\deploy-nft.js --network localhost
```
拍卖合约V1  
```shell
npx hardhat run .\scripts\deploy-acutionV1.js --network localhost
```
执行模拟测试脚本  
```shell
npx hardhat run .\scripts\auction-flow.js --network localhost
```

部署升级合约V2

本地模拟预言机合约
```shell
npx hardhat run .\test\deploy-mock.js --network localhost
```

v2版本合约升级部署
```shell
npx hardhat run .\scripts\deploy-acutionV2.js --network localhost
```
执行测试用例：
```shell
npx hardhat test test/NftAuctionV2.test.js --network localhost
```

