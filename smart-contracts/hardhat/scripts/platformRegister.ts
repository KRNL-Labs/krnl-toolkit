import { ethers, run } from "hardhat";
import * as dotenv from "dotenv";
import { contractRegistryAbi } from "./abi/contractRegistry";
import * as fs from "fs";
async function main() {
  
  const provider = new ethers.JsonRpcProvider(`https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`);
  const wallet = new ethers.Wallet(`${process.env.PRIVATE_KEY_SEPOLIA}`, provider);
  
  const contractRegistryAddress = process.env.CONTRACT_REGISTRY_ADDRESS || "";
  const dAppRegistryAddress = process.env.DAPP_REGISTRY_ADDRESS || "";
  const kernelIdsFromEnv: any[] = process.env.KERNEL_ID ? process.env.KERNEL_ID.replace(/[\[\]]/g, '').split(',').map(Number) : [];

  const deployedContracts = JSON.parse(fs.readFileSync('deployedContracts.json', 'utf-8'));
  const registeredSmartContractAddress = deployedContracts.registeredSmartContractAddress;
  const tokenAuthorityAddress = deployedContracts.tokenAuthorityAddress;


  // REGISTER SMART CONTRACT
  console.log("======================================")
  console.log("START REGISTERING SMART CONTRACT")
  console.log("Using Smart Contract Address:", registeredSmartContractAddress)
  console.log("Using Token Authority Address:", tokenAuthorityAddress)
  console.log("Using Kernel ID(s): ", kernelIdsFromEnv)
  const smartContractRegistryContract: any = new ethers.Contract(contractRegistryAddress, contractRegistryAbi, wallet);
  const registerParams = {
    chainId: 11155111,
    smartContractAddress: registeredSmartContractAddress,
    tokenAuthorityProvider: 0,
    tokenAuthorityEndpoint: 'https://testnet.sapphire.oasis.io',
    tokenAuthorityContractAddress: tokenAuthorityAddress,
    kernelIds: kernelIdsFromEnv
  }
  let registeredSmartContractId: any;


  try {
    const contractTx = await smartContractRegistryContract.registerSmartContract(
      registerParams.chainId,
      registerParams.smartContractAddress,
      registerParams.tokenAuthorityProvider,
      registerParams.tokenAuthorityEndpoint,
      registerParams.tokenAuthorityContractAddress,
      registerParams.kernelIds
    );
    const contractReceipt = await contractTx.wait();
    const contactLog = contractReceipt.logs.find((x: any) => x.eventName === "ContractPropertiesCreated");
    const smartContractId = Number(contactLog.args[0]);
    registeredSmartContractId = smartContractId;
    console.log("REGISTERING SMART CONTRACT SUCCESS")
    console.log("Registered Smart Contract ID: ", registeredSmartContractId)
  } catch (error) {
    console.error("Error sending transaction:", error);
  }
  console.log("======================================")

  // REGISTER DAPP
  console.log("START REGISTERING DAPP")
  console.log("Using Smart Contract ID: ", registeredSmartContractId)
  const dAppFunctionSelector = "0x5e920169";
  const dAppRegisterParam = ethers.toBeHex(registeredSmartContractId).replace("0x", "").padStart(64, "0");
  const dAppRegisterData = dAppFunctionSelector + dAppRegisterParam;
  let dAppIdResult: any;

  try {
    const dAppRegisterTx = await wallet.sendTransaction({
      to: dAppRegistryAddress,
      data: dAppRegisterData,
    });

    const dAppRegisterReceipt: any = await dAppRegisterTx.wait();
    
    const dAppRegistryInterface = new ethers.Interface([
      "event DappCreated(uint256 indexed dappId, address indexed dappOwner)"
    ]);
    
    const dAppLog = dAppRegisterReceipt.logs.find((log: any) => {
      try {
        const parsed = dAppRegistryInterface.parseLog(log);
        return parsed?.name === "DappCreated";
      } catch (e) {
        return false;
      }
    });

    if (dAppLog) {
      const parsedLog = dAppRegistryInterface.parseLog(dAppLog);
      const [dAppId, dAppOwner] = parsedLog?.args || [];
      dAppIdResult = Number(dAppId);
      console.log("REGISTERING DAPP SUCCESS")
    }
  } catch (error) {
    console.error("Error registering dApp:", error);
  }

  console.log("======================================")
  // SUMMARY
  console.log("=====SUMMARY=====")
  console.log("Registered Smart Contract ID: ", registeredSmartContractId);
  console.log("dApp ID: ", dAppIdResult);
  console.log("Please visit this page for Entry ID, Access Token, and Kernel Payload\n\n", `https://app.platform.lat/dapp/${dAppIdResult}\n`);
  console.log("Entry ID and Access Token are similar to x-api-key or Bearer Token of Web2")
  console.log("Kernel Payload is the template of parameter(s) that needs to be sent to kernel ID(s):", kernelIdsFromEnv)
  console.log("======================================")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
