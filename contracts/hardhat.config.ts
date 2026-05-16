import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-mocha-ethers";

// 🚨 现场注意：换成你 MetaMask 测试钱包的私钥！必须以 0x 开头
const PRIVATE_KEY = "be666a139019202e8cde8e73ac7c201ebed81b6c2f9f7b438bf7acb58243f654";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  networks: {
    monadTestnet: {
      type: "http",                          
      url: "https://rpc-devnet.monad.xyz/",
      chainId: 10143,                        
      accounts: [PRIVATE_KEY],
    },
  },
};

export default config;