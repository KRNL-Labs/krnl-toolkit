import { ethers, run } from "hardhat";
import { execSync } from 'child_process';
import * as dotenv from "dotenv";
import * as fs from "fs";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  const walletAddress = deployer.address;

  const ownerAddress = process.env.INITIAL_OWNER_ADDRESS || walletAddress;

  console.log("======================================\n")
  console.log("Warning messages may appear on the terminal\n")
  console.log("Especially after verifying the Token Authority\n")
  console.log("======================================")
  await new Promise(r => setTimeout(r, 3000));
  console.log("DEPLOYER:", walletAddress);
  console.log("Owner address for OM and TA:", ownerAddress)
  console.log("======================================")


  // TOKEN AUTHORITY TokenAuthority.sol
  console.log("START DEPLOYING TOKEN AUTHORITY")
  const providerTokenAuthority = new ethers.JsonRpcProvider(`https://testnet.sapphire.oasis.io`);
  const walletTokenAuthority = new ethers.Wallet(`${process.env.PRIVATE_KEY_OASIS}`, providerTokenAuthority);

  const ContractTokenAuthority = await ethers.getContractFactory("TokenAuthority", walletTokenAuthority);
  const contractTokenAuthority = await ContractTokenAuthority.deploy(ownerAddress);

  console.log("DEPLOYED TOKEN AUTHORITY")
  const addressTokenAuthority = contractTokenAuthority.target;
  console.log("Contract deployed to:", addressTokenAuthority);
  //   console.log("Contract: ", contractTokenAuthority)
  await new Promise(r => setTimeout(r, 15000));
  const [TAPublicKeyHash, TAPublicKeyAddress] = await contractTokenAuthority.getSigningKeypairPublicKey();

  console.log("Token Authority Public Key in hash value:",TAPublicKeyHash)
  console.log("Token Authority Public Key in address value:", TAPublicKeyAddress)
  console.log("======================================")
  
  // VERIFYING PART
  await new Promise(r => setTimeout(r, 60000));
  try {
    const command = `npx hardhat verify --network sapphire-testnet ${addressTokenAuthority} ${ownerAddress}`;
    console.log(`Running command: ${command}`);
    execSync(command, { stdio: 'inherit' });
  } catch (error: any) {
    console.error('Error during verification:', error.message);
  }

  // JSON
  let jsonRead = {
    tokenAuthorityAddress: "",
    tokenAuthorityPublicKey: "",
    registeredSmartContractAddress: ""
  };
  try {
    const fileContent = fs.readFileSync('deployedContracts.json', 'utf-8');
    if (fileContent.trim() !== '') {
      jsonRead = JSON.parse(fileContent);
    }
  } catch (error) {
    console.error("Error reading deployedContracts.json:", error);
  }
  
  const data = jsonRead;
  
  data.tokenAuthorityAddress = addressTokenAuthority.toString();
  data.tokenAuthorityPublicKey = TAPublicKeyAddress.toString();
  
  const updatedJsonString = JSON.stringify(data, null, 2);
  
  fs.writeFileSync('deployedContracts.json', updatedJsonString, 'utf-8');
  
  // SUMMARY
  console.log("=====END OF TOKEN AUTHORITY DEPLOYMENT=====")
  console.log("\nToken Authority - Oasis Sapphire testnet\nAddress:", addressTokenAuthority)
  console.log("\nYou may see warning or error messages, make sure to recheck with Sourcify after verified")
  console.log("=================")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
