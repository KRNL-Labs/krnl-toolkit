import { ethers, run } from "hardhat";
import { contractRegistryAbi } from "./abi/contractRegistry";
import * as fs from "fs";
import * as dotenv from "dotenv";
import { resolve } from "path";
import chalk from "chalk";

dotenv.config({ path: resolve(__dirname, "../../.env") });

// Brand colors
const BRAND_BLUE = '#001EFE';

// Create custom branded chalk styles
const brandBlue = chalk.hex(BRAND_BLUE);
const brandHeader = chalk.hex(BRAND_BLUE).white.bold;
const brandHighlight = chalk.bold.white.bgHex(BRAND_BLUE);

// Helper for loading animation
function startSpinner(message: string) {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  const loader = setInterval(() => {
    process.stdout.write(`\r${brandBlue(frames[i++ % frames.length])} ${message}`);
  }, 100);
  return loader;
}

export async function registerPlatform(skipHeader = false) {
  if (!skipHeader) {
    // App logo/header
    console.log();
    console.log(brandHeader('  ╔═══════════════════════════════════════════════════════╗  '));
    console.log(brandHeader('  ║                                                       ║  '));
    console.log(brandHeader('  ║              PLATFORM REGISTRATION                    ║  '));
    console.log(brandHeader('  ║                                                       ║  '));
    console.log(brandHeader('  ╚═══════════════════════════════════════════════════════╝  '));
    console.log();
  }
  
  const sepoliaRpc = process.env.INFURA_PROJECT_ID ? `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}` : "https://1rpc.io/sepolia";
  const provider = new ethers.JsonRpcProvider(sepoliaRpc);
  const wallet = new ethers.Wallet(`${process.env.PRIVATE_KEY_SEPOLIA}`, provider);
  
  const contractRegistryAddress = "0x901647B1517fD4dBF46B27759aDd59A91CBf0759";
  const dAppRegistryAddress = "0x6b96E52Cc40136E22eF690bA0C28E521a86AAc4D";
  const kernelIdsFromEnv: any[] = process.env.KERNEL_ID ? process.env.KERNEL_ID.replace(/[\[\]]/g, '').split(',').map(Number) : [];

  // Display wallet info
  const walletAddress = wallet.address;
  const balance = await provider.getBalance(walletAddress);
  console.log(brandBlue('┌─ REGISTRATION INFORMATION ') + brandBlue('─'.repeat(43)));
  console.log(brandBlue('│'));
  console.log(brandBlue('├─► NETWORK: ') + chalk.white('Sepolia Testnet'));
  console.log(brandBlue('│'));
  console.log(brandBlue('├─► WALLET: ') + chalk.white(walletAddress));
  console.log(brandBlue('│'));
  console.log(brandBlue('├─► BALANCE: ') + chalk.white(ethers.formatEther(balance) + ' ETH'));
  console.log(brandBlue('│'));
  console.log(brandBlue('└') + brandBlue('─'.repeat(70)));
  console.log();

  if (balance < ethers.parseEther("0.01")) {
    console.log(chalk.yellow('⚠️  Warning: Low balance on Sepolia wallet. You may need more ETH to complete registration.'));
    console.log();
  }

  let loadSpin = startSpinner('Loading deployment information...');
  let deployedContracts;
  try {
    deployedContracts = JSON.parse(fs.readFileSync('deployedContracts.json', 'utf-8'));
    clearInterval(loadSpin);
    process.stdout.write('\r' + ' '.repeat(100) + '\r');
    console.log(brandBlue('✓ ') + chalk.green('DEPLOYMENT INFORMATION LOADED'));
    console.log();
  } catch (error) {
    clearInterval(loadSpin);
    process.stdout.write('\r' + ' '.repeat(100) + '\r');
    console.error(brandBlue('✗ ') + chalk.red('Error reading deployedContracts.json: ') + (error as Error).message);
    throw new Error('Failed to read deployment information. Please deploy contracts first.');
  }

  const registeredSmartContractAddress = deployedContracts.registeredSmartContractAddress;
  const tokenAuthorityAddress = deployedContracts.tokenAuthorityAddress;

  // REGISTER SMART CONTRACT
  console.log(brandHighlight(' 3.1) REGISTERING SMART CONTRACT '));
  console.log();
  
  console.log(brandBlue('  ↳ Smart Contract Address: ') + chalk.white(registeredSmartContractAddress));
  console.log(brandBlue('  ↳ Token Authority Address: ') + chalk.white(tokenAuthorityAddress));
  console.log(brandBlue('  ↳ Kernel ID(s): ') + chalk.white(kernelIdsFromEnv.join(', ')));
  console.log();
  
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

  let registerSpin = startSpinner('Registering smart contract...');
  try {
    const contractTx = await smartContractRegistryContract.registerSmartContract(
      registerParams.chainId,
      registerParams.smartContractAddress,
      registerParams.tokenAuthorityProvider,
      registerParams.tokenAuthorityEndpoint,
      registerParams.tokenAuthorityContractAddress,
      registerParams.kernelIds
    );
    
    clearInterval(registerSpin);
    registerSpin = startSpinner('Waiting for transaction confirmation...');
    
    const contractReceipt = await contractTx.wait();
    const contactLog = contractReceipt.logs.find((x: any) => x.eventName === "ContractPropertiesCreated");
    const smartContractId = Number(contactLog.args[0]);
    registeredSmartContractId = smartContractId;
    
    clearInterval(registerSpin);
    process.stdout.write('\r' + ' '.repeat(100) + '\r');
    console.log(brandBlue('✓ ') + chalk.green('SMART CONTRACT REGISTRATION SUCCESSFUL'));
    console.log(brandBlue('  ↳ Smart Contract ID: ') + chalk.white(registeredSmartContractId));
  } catch (error) {
    clearInterval(registerSpin);
    process.stdout.write('\r' + ' '.repeat(100) + '\r');
    console.error(brandBlue('✗ ') + chalk.red('Error registering smart contract: ') + (error as Error).message);
    throw new Error('Failed to register smart contract.');
  }
  console.log();

  // REGISTER DAPP
  console.log(brandHighlight(' 3.2) REGISTERING DAPP '));
  console.log();
  
  const dAppFunctionSelector = "0x5e920169";
  const dAppRegisterParam = ethers.toBeHex(registeredSmartContractId).replace("0x", "").padStart(64, "0");
  const dAppRegisterData = dAppFunctionSelector + dAppRegisterParam;
  let dAppIdResult: any;

  let dappSpin = startSpinner('Registering dApp...');
  try {
    const dAppRegisterTx = await wallet.sendTransaction({
      to: dAppRegistryAddress,
      data: dAppRegisterData,
    });

    clearInterval(dappSpin);
    dappSpin = startSpinner('Waiting for transaction confirmation...');
    
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
      
      clearInterval(dappSpin);
      process.stdout.write('\r' + ' '.repeat(100) + '\r');
      console.log(brandBlue('✓ ') + chalk.green('DAPP REGISTRATION SUCCESSFUL'));
      console.log(brandBlue('  ↳ dApp ID: ') + chalk.white(dAppIdResult));
    } else {
      clearInterval(dappSpin);
      process.stdout.write('\r' + ' '.repeat(100) + '\r');
      console.error(brandBlue('✗ ') + chalk.red('Could not find DappCreated event in transaction logs'));
      throw new Error('Failed to register dApp: Event not found');
    }
  } catch (error) {
    clearInterval(dappSpin);
    process.stdout.write('\r' + ' '.repeat(100) + '\r');
    console.error(brandBlue('✗ ') + chalk.red('Error registering dApp: ') + (error as Error).message);
    throw new Error('Failed to register dApp.');
  }
  console.log();

  // SUMMARY
  console.log(brandBlue('━'.repeat(70)));
  console.log(brandHeader(` 📋 REGISTRATION SUMMARY `.padEnd(69) + ' '));
  console.log(brandBlue('━'.repeat(70)));
  console.log(`Smart Contract ID: ${chalk.white(registeredSmartContractId)}`);
  console.log(`dApp ID:           ${chalk.white(dAppIdResult)}`);
  console.log();
  console.log(`${chalk.green('✓')} Please visit this page for Entry ID, Access Token, and Kernel Payload:`);
  console.log(chalk.cyan(`https://app.platform.lat/dapp/${dAppIdResult}`));
  console.log();
  console.log(`${chalk.yellow('💡 Tips 1: ')} Entry ID and Access Token are similar to x-api-key or Bearer Token of Web2`);
  console.log();
  console.log(`${chalk.yellow('💡 Tips 2: ')} Kernel Payload is the template of parameter(s) that needs to be sent to kernel ID(s): ${chalk.white(kernelIdsFromEnv.join(', '))}`);
  console.log(brandBlue('━'.repeat(70)));
  console.log();

  return {
    registeredSmartContractId,
    dAppIdResult
  };
}

// If this script is run directly
if (require.main === module) {
  registerPlatform()
    .then(() => {
      console.log();
      console.log(brandHeader('  ╔═══════════════════════════════════════════════════════╗  '));
      console.log(brandHeader('  ║                                                       ║  '));
      console.log(brandHeader('  ║            REGISTRATION COMPLETED                     ║  '));
      console.log(brandHeader('  ║                 SUCCESSFULLY                          ║  '));
      console.log(brandHeader('  ║                                                       ║  '));
      console.log(brandHeader('  ╚═══════════════════════════════════════════════════════╝  '));
      console.log();
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n' + brandBlue('✗ ') + chalk.red('REGISTRATION FAILED:'));
      console.error(error);
      console.log();
      process.exit(1);
    });
}
