# Sample Hardhat Project

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
