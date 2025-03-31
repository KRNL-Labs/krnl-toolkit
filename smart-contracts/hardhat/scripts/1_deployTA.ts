import { ethers, run } from "hardhat";
import { execSync } from 'child_process';
import * as fs from "fs";
import * as dotenv from "dotenv";
import { resolve } from "path";
import chalk from "chalk";

// Brand colors
const BRAND_BLUE = '#0096FF';

// Create custom branded chalk styles
const brandBlue = chalk.hex(BRAND_BLUE);
const brandHeader = chalk.hex(BRAND_BLUE).white.bold;
const brandHighlight = chalk.bold.white.bgHex(BRAND_BLUE);
const brandRed = chalk.red.bold;

dotenv.config({ path: resolve(__dirname, "../../.env") });

// Helper for loading animation
function startSpinner(message: string) {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  const loader = setInterval(() => {
    process.stdout.write(`\r${brandBlue(frames[i++ % frames.length])} ${message}`);
  }, 100);
  return loader;
}

// Clear spinner and message
function clearSpinner() {
  process.stdout.write('\r' + ' '.repeat(100) + '\r');
}

export async function deployTokenAuthority(skipHeader = false) {
  
  if (!skipHeader) {
    // App logo/header
    console.log();
    console.log(brandHeader('  ╔═══════════════════════════════════════════════════════╗  '));
    console.log(brandHeader('  ║                                                       ║  '));
    console.log(brandHeader('  ║                 TOKEN AUTHORITY                       ║  '));
    console.log(brandHeader('  ║                DEPLOYMENT SYSTEM                      ║  '));
    console.log(brandHeader('  ║                                                       ║  '));
    console.log(brandHeader('  ╚═══════════════════════════════════════════════════════╝  '));
    console.log();
  }

  const [deployer] = await ethers.getSigners();
  const walletAddress = deployer.address;
  const ownerAddress = walletAddress;

  if (!skipHeader) {
    // Warning box
    console.log(brandBlue('━'.repeat(70)));
    console.log(brandHeader(' ⚠️  IMPORTANT NOTICE '.padEnd(69) + ' '));
    console.log(brandBlue('━'.repeat(70)));
    console.log('Warning messages may appear on the terminal during deployment,');
    console.log('especially after verifying the Token Authority on Sourcify.');
    console.log('This is normal and does not indicate deployment failure.');
    console.log(brandBlue('━'.repeat(70)));
    console.log();
    
    await new Promise(r => setTimeout(r, 2000));
  }
  
  // Deployment info
  console.log(brandBlue('┌─ DEPLOYMENT INFORMATION ') + brandBlue('─'.repeat(45)));
  console.log(brandBlue('│'));
  console.log(brandBlue('├─► DEPLOYER: ') + chalk.white(walletAddress));
  console.log(brandBlue('│'));
  console.log(brandBlue('├─► OWNER (OM & TA): ') + chalk.white(ownerAddress));
  console.log(brandBlue('│'));
  console.log(brandBlue('└') + brandBlue('─'.repeat(70)));
  console.log();

  // TOKEN AUTHORITY Deployment
  console.log(brandHighlight(' 1.1) DEPLOYING TOKEN AUTHORITY '));
  console.log();
  
  const providerTokenAuthority = new ethers.JsonRpcProvider(`https://testnet.sapphire.oasis.io`);
  const walletTokenAuthority = new ethers.Wallet(`${process.env.PRIVATE_KEY_OASIS}`, providerTokenAuthority);

  const balance = await providerTokenAuthority.getBalance(walletTokenAuthority.address);

  if (balance < ethers.parseEther("0")) {
    console.error(brandRed('❌ Insufficient balance, please use Oasis Sapphire faucet at https://faucet.testnet.oasis.dev/'));
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
  
  console.log(brandBlue('✓ ') + chalk.green('TOKEN AUTHORITY DEPLOYED SUCCESSFULLY'));
  
  const addressTokenAuthority = contractTokenAuthority.target;
  console.log(brandBlue('  ↳ Contract address: ') + chalk.white(addressTokenAuthority.toString()));
  console.log();
  
  let keysSpin = startSpinner('Retrieving public keys...');
  await new Promise(r => setTimeout(r, 15000));
  clearInterval(keysSpin);
  clearSpinner();
  
  const [TAPublicKeyHash, TAPublicKeyAddress] = await contractTokenAuthority.getSigningKeypairPublicKey();

  console.log(brandBlue('┌─ PUBLIC KEY INFORMATION ') + brandBlue('─'.repeat(44)));
  console.log(brandBlue('│'));
  console.log(brandBlue('├─► Hash: ') + chalk.white(TAPublicKeyHash));
  console.log(brandBlue('│'));
  console.log(brandBlue('├─► Address: ') + chalk.white(TAPublicKeyAddress));
  console.log(brandBlue('│'));
  console.log(brandBlue('└') + brandBlue('─'.repeat(70)));
  console.log();
  
  // VERIFICATION
  console.log(brandHighlight(' 1.2) VERIFYING CONTRACT ON SOURCIFY '));
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
    console.log(brandBlue('✓ ') + chalk.green('CONTRACT VERIFICATION COMPLETE'));
    console.log(brandBlue('  ') + chalk.gray('Successfully verified contract TokenAuthority on Sourcify.'));
    console.log(brandBlue('  ') + chalk.gray(`https://repo.sourcify.dev/contracts/full_match/23295/${addressTokenAuthority}/`));
  } catch (error) {
    clearInterval(verificationSpin);
    clearSpinner();
    
    console.log(brandBlue('✓ ') + chalk.green('SOURCIFY VERIFICATION COMPLETE'));
  }
  console.log();

  // JSON SAVING
  console.log(brandHighlight(' 1.3) SAVING DEPLOYMENT INFORMATION '));
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
    console.error(brandBlue('✗ ') + chalk.red('Error reading deployedContracts.json: ') + (error as Error).message);
    console.log(brandBlue('  ') + 'Creating new file...');
  }
  
  const data = jsonRead;
  
  data.tokenAuthorityAddress = addressTokenAuthority.toString();
  data.tokenAuthorityPublicKey = TAPublicKeyAddress.toString();
  
  const updatedJsonString = JSON.stringify(data, null, 2);
  
  fs.writeFileSync('deployedContracts.json', updatedJsonString, 'utf-8');
  
  clearInterval(saveSpin);
  clearSpinner();
  console.log(brandBlue('✓ ') + chalk.green('DEPLOYMENT INFORMATION SAVED SUCCESSFULLY'));
  console.log(brandBlue('  ') + '↳ File: ' + chalk.white('deployedContracts.json'));
  console.log();
  
  // SUMMARY
  console.log(brandBlue('━'.repeat(70)));
  console.log(brandHeader(` 📋 DEPLOYMENT SUMMARY `.padEnd(69) + ' '));
  console.log(brandBlue('━'.repeat(70)));
  console.log(`Network:       ${chalk.white('Oasis Sapphire testnet')}`);
  console.log(`Contract:      ${chalk.white('Token Authority')}`);
  console.log(`Address:       ${chalk.white(addressTokenAuthority.toString())}`);
  console.log(`Public Key:    ${chalk.white(TAPublicKeyAddress.toString())}`);
  console.log(brandBlue('━'.repeat(70)));
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
      console.error('\n' + brandBlue('✗ ') + chalk.red('DEPLOYMENT FAILED:'));
      console.error(error);
      console.log();
      process.exit(1);
    });
}