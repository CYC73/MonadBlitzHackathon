import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log(" sending contract to testnet");

  const rpcUrl = "https://monad-testnet.drpc.org";
  const privateKey = "be666a139019202e8cde8e73ac7c201ebed81b6c2f9f7b438bf7acb58243f654"; 

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  console.log(" setting account:", wallet.address);

  // 🚀 核心修正：放弃 __dirname，改用 process.cwd() 精准锁定 contracts 根目录
  const artifactPath = path.join(process.cwd(), "artifacts/contracts/MonadStream.sol/MonadStream.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  // 3. 部署合约
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  
  console.log(" setting up to Monad");
  const contract = await factory.deploy({
    value: ethers.parseEther("0.01") // 部署时自动充值 0.01 MON 激活合约
  });

  await contract.waitForDeployment();

  console.log("✨ [部署成功] ✨");
  console.log("📍 合约部署地址 (Contract Address):", await contract.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });