import { ethers, run } from "hardhat";
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

export async function deployMainContract(skipHeader = false) {
  if (!skipHeader) {
    // App logo/header
    console.log();
    console.log(brandHeader('  ╔═══════════════════════════════════════════════════════╗  '));
    console.log(brandHeader('  ║                                                       ║  '));
    console.log(brandHeader('  ║              MAIN CONTRACT DEPLOYMENT                 ║  '));
    console.log(brandHeader('  ║                                                       ║  '));
    console.log(brandHeader('  ╚═══════════════════════════════════════════════════════╝  '));
    console.log();
  }

  // SMART CONTRACT Sample.sol
  const sepoliaRpc = process.env.INFURA_PROJECT_ID ? `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}` : "https://sepolia.drpc.org";
  const providerMain = new ethers.JsonRpcProvider(sepoliaRpc);
  const walletMain = new ethers.Wallet(`${process.env.PRIVATE_KEY_SEPOLIA}`, providerMain);

  // Display wallet info
  const walletAddress = walletMain.address;
  const balance = await providerMain.getBalance(walletAddress);
  console.log(brandBlue('┌─ DEPLOYMENT INFORMATION ') + brandBlue('─'.repeat(45)));
  console.log(brandBlue('│'));
  console.log(brandBlue('├─► NETWORK: ') + chalk.white('Sepolia Testnet'));
  console.log(brandBlue('│'));
  console.log(brandBlue('├─► DEPLOYER: ') + chalk.white(walletAddress));
  console.log(brandBlue('│'));
  console.log(brandBlue('├─► BALANCE: ') + chalk.white(ethers.formatEther(balance) + ' ETH'));
  console.log(brandBlue('│'));
  console.log(brandBlue('└') + brandBlue('─'.repeat(70)));
  console.log();

  if (balance < ethers.parseEther("0.01")) {
    console.log(chalk.yellow('⚠️  Warning: Low balance on Sepolia wallet. You may need more ETH to complete deployment.'));
    console.log();
  }

  let deploySpin = startSpinner('Reading deployment information...');
  let jsonRead;
  try {
    const fileContent = fs.readFileSync('deployedContracts.json', 'utf8');
    jsonRead = JSON.parse(fileContent);
    clearInterval(deploySpin);
    process.stdout.write('\r' + ' '.repeat(100) + '\r');
    console.log(brandBlue('✓ ') + chalk.green('DEPLOYMENT INFORMATION LOADED'));
  } catch (error) {
    clearInterval(deploySpin);
    process.stdout.write('\r' + ' '.repeat(100) + '\r');
    console.error(brandBlue('✗ ') + chalk.red('Error reading deployedContracts.json: ') + (error as Error).message);
    throw new Error('Failed to read deployment information. Please deploy Token Authority first.');
  }

  const TAPublicKeyAddress = jsonRead.tokenAuthorityPublicKey;
  console.log(brandBlue('  ↳ Token Authority Public Key: ') + chalk.white(TAPublicKeyAddress));
  console.log();

  console.log(brandHighlight(' 2.1) DEPLOYING REGISTERED SMART CONTRACT '));
  console.log();

  deploySpin = startSpinner('Deploying main contract to Sepolia...');
  const ContractMain = await ethers.getContractFactory("Sample", walletMain);
  const contractMain = await ContractMain.deploy(TAPublicKeyAddress);
  clearInterval(deploySpin);
  process.stdout.write('\r' + ' '.repeat(100) + '\r');
  
  const addressMain = contractMain.target;
  console.log(brandBlue('✓ ') + chalk.green('MAIN CONTRACT DEPLOYED SUCCESSFULLY'));
  console.log(brandBlue('  ↳ Contract address: ') + chalk.white(addressMain.toString()));
  console.log();
  
  // VERIFYING PART
  console.log(brandHighlight(' 2.2) VERIFYING CONTRACT ON ETHERSCAN '));
  console.log();
  
  let verifySpin = startSpinner('Starting verification process (this may take up to 60 seconds)...');
  
  // Wait for the contract to be properly deployed and indexed
  await new Promise(r => setTimeout(r, 40000));
  
  try {
    await run("verify:verify", {
      address: addressMain,
      constructorArguments: [TAPublicKeyAddress],
    });
    clearInterval(verifySpin);
    process.stdout.write('\r' + ' '.repeat(100) + '\r');
    console.log(brandBlue('✓ ') + chalk.green('CONTRACT VERIFICATION COMPLETE'));
  } catch (error: any) {
    clearInterval(verifySpin);
    process.stdout.write('\r' + ' '.repeat(100) + '\r');
    console.error(brandBlue('✗ ') + chalk.red('VERIFY FAILED WITH ERROR: ') + error.message);
  }
  console.log();

  // JSON SAVING
  console.log(brandHighlight(' 2.3) SAVING DEPLOYMENT INFORMATION '));
  console.log();
  
  let saveSpin = startSpinner('Updating deployment information...');
  
  // Update JSON
  const deployedContractJson = jsonRead;
  deployedContractJson.registeredSmartContractAddress = addressMain.toString();
  const jsonString = JSON.stringify(deployedContractJson, null, 2);

  fs.writeFileSync('deployedContracts.json', jsonString, 'utf-8');
  
  clearInterval(saveSpin);
  process.stdout.write('\r' + ' '.repeat(100) + '\r');
  console.log(brandBlue('✓ ') + chalk.green('DEPLOYMENT INFORMATION UPDATED SUCCESSFULLY'));
  console.log(brandBlue('  ') + '↳ File: ' + chalk.white('deployedContracts.json'));
  console.log();

  // SUMMARY
  console.log(brandBlue('━'.repeat(70)));
  console.log(brandHeader(` 📋 DEPLOYMENT SUMMARY `.padEnd(69) + ' '));
  console.log(brandBlue('━'.repeat(70)));
  console.log(`Network:       ${chalk.white('Sepolia Testnet')}`);
  console.log(`Contract:      ${chalk.white('Sample (Main Contract)')}`);
  console.log(`Address:       ${chalk.white(addressMain.toString())}`);
  console.log(`TA Public Key: ${chalk.white(TAPublicKeyAddress.toString())}`);
  console.log(brandBlue('━'.repeat(70)));
  console.log();

  return {
    addressMain,
    TAPublicKeyAddress
  };
}

// If this script is run directly
if (require.main === module) {
  deployMainContract()
    .then(() => {
      console.log();
      console.log(brandHeader('  ╔═══════════════════════════════════════════════════════╗  '));
      console.log(brandHeader('  ║                                                       ║  '));
      console.log(brandHeader('  ║             DEPLOYMENT COMPLETED                      ║  '));
      console.log(brandHeader('  ║                  SUCCESSFULLY                         ║  '));
      console.log(brandHeader('  ║                                                       ║  '));
      console.log(brandHeader('  ╚═══════════════════════════════════════════════════════╝  '));
      console.log();
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n' + brandBlue('✗ ') + chalk.red('DEPLOYMENT FAILED:'));
      console.error(error);
      console.log();
      process.exit(1);
    });
}
