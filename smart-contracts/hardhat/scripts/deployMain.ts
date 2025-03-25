import { ethers, run } from "hardhat";
import * as dotenv from "dotenv";
import * as fs from "fs";

async function main() {

  console.log("START DEPLOYING REGISTERED SMART CONTRACT")

  // SMART CONTRACT Sample.sol
  const providerMain = new ethers.JsonRpcProvider(`https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`);
  const walletMain = new ethers.Wallet(`${process.env.PRIVATE_KEY_SEPOLIA}`, providerMain);

  const jsonRead = JSON.parse(fs.readFileSync('deployedContracts.json', 'utf8'));
  const TAPublicKeyAddress = jsonRead.tokenAuthorityPublicKey;

  const ContractMain = await ethers.getContractFactory("Sample", walletMain);
  const contractMain = await ContractMain.deploy(TAPublicKeyAddress);
  const addressMain = contractMain.target;
  console.log("Contract deployed to:", addressMain);
  
  // VERIFYING PART
  await new Promise(r => setTimeout(r, 60000));
  try {
      console.log("TRY VERIFYING CONTRACT");
      await run("verify:verify", {
          address: addressMain,
          constructorArguments: [TAPublicKeyAddress],
        });
        console.log(`CONTRACT: ${addressMain} IS VERIFIED ON ETHERSCAN`);
    } catch (error: any) {
        console.error("VERIFY FAILED WITH ERROR:", error.message);
    }

    
  // JSON
  const deployedContractJson = jsonRead;
  deployedContractJson.registeredSmartContractAddress = addressMain;
  const jsonString = JSON.stringify(deployedContractJson, null, 2);

  fs.writeFileSync('deployedContracts.json', jsonString, 'utf-8');
  // SUMMARY
  console.log("=====END OF SMART CONTRACT DEPLOYMENT=====")
  console.log("\nRegistered Smart Contract - Sepolia\nAddress:", addressMain)
  console.log("=================")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
