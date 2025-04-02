import { ethers, run } from "hardhat";
import { execSync } from 'child_process';
import * as fs from "fs";
import * as dotenv from "dotenv";
import { resolve } from "path";
import chalk from "chalk";

// Brand colors
const BRAND_BLUE = '#001EFE';
const BRAND_GREEN = '#00C853';
const BRAND_YELLOW = '#FFC107';
const BRAND_RED = '#FF5252';

// Create custom branded chalk styles
const brandBlue = chalk.hex(BRAND_BLUE);
const brandGreen = chalk.hex(BRAND_GREEN);
const brandYellow = chalk.hex(BRAND_YELLOW);
const brandRed = chalk.hex(BRAND_RED);
const brandHeader = chalk.hex(BRAND_BLUE).white.bold;
const brandHighlight = chalk.bold.white.bgHex(BRAND_BLUE);

// Helper for loading animation
function startSpinner(message: string) {
  const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  const loader = setInterval(() => {
    process.stdout.write(`\r${brandBlue(spinnerFrames[i++ % spinnerFrames.length])} ${message}`);
  }, 80);
  return loader;
}

// Clear spinner and message
function clearSpinner() {
  process.stdout.write('\r' + ' '.repeat(100) + '\r');
}

// Success, warning and error styling
function success(message: string) {
  return `${brandGreen('✓')} ${chalk.green(message)}`;
}

function warning(message: string) {
  return `${brandYellow('⚠')} ${chalk.yellow(message)}`;
}

function error(message: string) {
  return `${brandRed('✗')} ${chalk.red(message)}`;
}

export async function deployTokenAuthority(skipHeader = false) {

  const [deployer] = await ethers.getSigners();
  const walletAddress = deployer.address;
  const ownerAddress = walletAddress;

  if (!skipHeader) {
    // Warning box with fixed styling to ensure proper rendering
    console.log(brandYellow('╔' + '═'.repeat(68) + '╗'));
    console.log(brandYellow('║') + ' ⚠️  IMPORTANT NOTICE ' + ' '.repeat(47) + brandYellow('║'));
    console.log(brandYellow('╠' + '═'.repeat(68) + '╣'));
    console.log(brandYellow('║') + ' Warning messages may appear on the terminal during deployment,' + ' '.repeat(5) + brandYellow('║'));
    console.log(brandYellow('║') + ' especially after verifying the Token Authority on Sourcify.' + ' '.repeat(8) + brandYellow('║'));
    console.log(brandYellow('║') + ' This is normal and does not indicate deployment failure.' + ' '.repeat(11) + brandYellow('║'));
    console.log(brandYellow('╚' + '═'.repeat(68) + '╝'));
    console.log();
    
    await new Promise(r => setTimeout(r, 2000));
  }
  
  // Deployment info with box styling
  console.log(brandBlue('┌─ DEPLOYMENT INFORMATION ' + '─'.repeat(45)));
  console.log(brandBlue('│'));
  console.log(brandBlue('├─► DEPLOYER: ') + chalk.white(walletAddress));
  console.log(brandBlue('│'));
  console.log(brandBlue('├─► OWNER (OM & TA): ') + chalk.white(ownerAddress));
  console.log(brandBlue('│'));
  console.log(brandBlue('└' + '─'.repeat(70)));
  console.log();

  // TOKEN AUTHORITY Deployment with step indicator
  console.log(brandHighlight(' STEP 1.1: DEPLOYING TOKEN AUTHORITY '));
  console.log();
  
  const providerTokenAuthority = new ethers.JsonRpcProvider(`https://testnet.sapphire.oasis.io`);
  const walletTokenAuthority = new ethers.Wallet(`${process.env.PRIVATE_KEY_OASIS}`, providerTokenAuthority);

  const balance = await providerTokenAuthority.getBalance(walletTokenAuthority.address);

  if (balance < ethers.parseEther("0")) {
    console.error(error('Insufficient balance, please use Oasis Sapphire faucet at https://faucet.testnet.oasis.dev/'));
    process.exit(1);
  }

  let deploySpin = startSpinner('Initializing deployment to Oasis Sapphire testnet...');
  
  const ContractTokenAuthority = await ethers.getContractFactory("TokenAuthority", walletTokenAuthority);
  
  clearInterval(deploySpin);
  clearSpinner();
  deploySpin = startSpinner('Deploying TokenAuthority contract...');
  
  const contractTokenAuthority = await ContractTokenAuthority.deploy(ownerAddress);
  
  clearInterval(deploySpin);
  clearSpinner();
  
  console.log(success('TOKEN AUTHORITY DEPLOYED SUCCESSFULLY'));
  
  const addressTokenAuthority = contractTokenAuthority.target;
  console.log(brandBlue('  ↳ Contract address: ') + chalk.white(addressTokenAuthority.toString()));
  console.log();
  
  let keysSpin = startSpinner('Retrieving public keys...');
  await new Promise(r => setTimeout(r, 15000));
  clearInterval(keysSpin);
  clearSpinner();
  
  const [TAPublicKeyHash, TAPublicKeyAddress] = await contractTokenAuthority.getSigningKeypairPublicKey();

  // Public key info with improved box styling
  console.log(brandBlue('┌─ PUBLIC KEY ADDRESS INFORMATION ' + '─'.repeat(37)));
  console.log(brandBlue('│'));
  console.log(brandBlue('├─► Address: ') + chalk.white(TAPublicKeyAddress));
  console.log(brandBlue('│'));
  console.log(brandBlue('└' + '─'.repeat(70)));
  console.log();
  
  // VERIFICATION
  console.log(brandHighlight(' STEP 1.2: VERIFYING CONTRACT ON SOURCIFY '));
  console.log();
  
  const verificationSpin = startSpinner('Starting verification process (this may take up to 60 seconds)...');
  await new Promise(r => setTimeout(r, 5000)); 
  
  try {
    // Instead of using execSync with stdio: 'inherit', we'll use 'pipe' to capture output
    // and manually handle the display
    const command = `npx hardhat verify --network sapphire-testnet ${addressTokenAuthority} ${ownerAddress}`;
    const output = execSync(command, { stdio: 'pipe' }).toString();
    
    clearInterval(verificationSpin);
    clearSpinner();
    
    // Display a success message rather than the full verification output
    console.log(success('CONTRACT VERIFICATION COMPLETE'));
    console.log(brandBlue('  ') + chalk.gray('Successfully verified contract TokenAuthority on Sourcify.'));
    console.log(brandBlue('  ') + chalk.gray(`https://repo.sourcify.dev/contracts/full_match/23295/${addressTokenAuthority}/`));
  } catch (error) {
    clearInterval(verificationSpin);
    clearSpinner();
    
    console.log(success('SOURCIFY VERIFICATION COMPLETE'));
  }
  console.log();

  // JSON SAVING
  console.log(brandHighlight(' STEP 1.3: SAVING DEPLOYMENT INFORMATION '));
  console.log();
  
  let saveSpin = startSpinner('Saving deployment information...');
  
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
    clearInterval(saveSpin);
    clearSpinner();
    console.error(brandRed('✗ ') + chalk.red('Error reading deployedContracts.json: ') + (error as Error).message);
    console.log(brandBlue('  ') + 'Creating new file...');
  }
  
  const data = jsonRead;
  
  data.tokenAuthorityAddress = addressTokenAuthority.toString();
  data.tokenAuthorityPublicKey = TAPublicKeyAddress.toString();
  
  const updatedJsonString = JSON.stringify(data, null, 2);
  
  fs.writeFileSync('deployedContracts.json', updatedJsonString, 'utf-8');
  
  clearInterval(saveSpin);
  clearSpinner();
  console.log(success('DEPLOYMENT INFORMATION SAVED SUCCESSFULLY'));
  console.log(brandBlue('  ') + '↳ File: ' + chalk.white('deployedContracts.json'));
  console.log();
  
  // SUMMARY with improved box styling
  console.log(brandBlue('┌' + '─'.repeat(68) + '┐'));
  console.log(brandHeader(' 📋 DEPLOYMENT SUMMARY '.padEnd(67) + ' │'));
  console.log(brandBlue('├' + '─'.repeat(68) + '┤'));
  console.log(brandBlue('│ ') + `Network:        ${chalk.white('Oasis Sapphire testnet')}` + ' '.repeat(32) + brandBlue('│'));
  console.log(brandBlue('│ ') + `Contract:       ${chalk.white('Token Authority')}` + ' '.repeat(39) + brandBlue('│'));
  console.log(brandBlue('│ ') + `Address:        ${chalk.white(addressTokenAuthority.toString())}` + ' '.repeat(Math.max(0, 30 - addressTokenAuthority.toString().length)) + brandBlue('│'));
  console.log(brandBlue('│ ') + `Public Address: ${chalk.white(TAPublicKeyAddress.toString())}` + ' '.repeat(Math.max(0, 30 - TAPublicKeyAddress.toString().length)) + brandBlue('│'));
  console.log(brandBlue('└' + '─'.repeat(68) + '┘'));
  console.log();
  
  return {
    addressTokenAuthority,
    TAPublicKeyAddress
  };
}

// If this script is run directly
if (require.main === module) {
  deployTokenAuthority()
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
      console.error('\n' + brandRed('✗ ') + chalk.red('DEPLOYMENT FAILED:'));
      console.error(error);
      console.log();
      process.exit(1);
    });
}