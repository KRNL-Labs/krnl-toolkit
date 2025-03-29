import * as fs from "fs";
import * as dotenv from "dotenv";
import { resolve } from "path";
import chalk from "chalk";
import readline from 'readline';
import { deployTokenAuthority } from "./1_deployTA";
import { deployMainContract } from "./2_deployMain";
import { registerPlatform } from "./3_platformRegister";
import { execSync } from "child_process";

// Load environment variables from root .env file
dotenv.config({ path: resolve(__dirname, "../../../.env") });

// Brand colors
const BRAND_BLUE = "#3b82f6";

// Create custom branded chalk styles
const brandBlue = chalk.hex(BRAND_BLUE);
const brandHeader = chalk.hex(BRAND_BLUE).white.bold;
const brandHighlight = chalk.bold.white.bgHex(BRAND_BLUE);

// Helper for loading animation
function startSpinner(message: string) {
  const spinnerChars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  process.stdout.write(`\r${spinnerChars[i]} ${message}`);
  return setInterval(() => {
    i = (i + 1) % spinnerChars.length;
    process.stdout.write(`\r${spinnerChars[i]} ${message}`);
  }, 80);
}

// Clear spinner and message
function clearSpinner() {
  process.stdout.write('\r' + ' '.repeat(100) + '\r');
}

// Check if required environment variables are set
function checkEnvironment() {
  const requiredVars = [
    'PRIVATE_KEY_OASIS',
    'PRIVATE_KEY_SEPOLIA',
    'KERNEL_ID'
  ];
  
  let allVarsSet = true;
  const missingVars: string[] = [];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      allVarsSet = false;
      missingVars.push(varName);
    } else if (varName.startsWith('PRIVATE_KEY') && process.env[varName]?.length !== 64 && !process.env[varName]?.startsWith('0x')) {
      // Check if private key is in the correct format (64 chars without 0x prefix or 66 chars with 0x prefix)
      allVarsSet = false;
      missingVars.push(`${varName} (invalid format)`);
    }
  }
  
  if (!allVarsSet) {
    console.log(chalk.red('❌ Missing or invalid environment variables:'));
    missingVars.forEach(varName => {
      console.log(chalk.red(`   - ${varName}`));
    });
    console.log(chalk.yellow('\nPlease run the setup-env script or manually set these variables in your .env file.'));
    console.log(chalk.yellow('Private keys should be 64 characters (without 0x prefix) or 66 characters (with 0x prefix).'));
    return false;
  }
  
  // Ensure private keys are in the correct format (without 0x prefix)
  if (process.env.PRIVATE_KEY_OASIS?.startsWith('0x')) {
    process.env.PRIVATE_KEY_OASIS = process.env.PRIVATE_KEY_OASIS.substring(2);
  }
  
  if (process.env.PRIVATE_KEY_SEPOLIA?.startsWith('0x')) {
    process.env.PRIVATE_KEY_SEPOLIA = process.env.PRIVATE_KEY_SEPOLIA.substring(2);
  }
  
  return true;
}

// Setup environment variables
async function setupEnvironment() {
  const envExamplePath = resolve(__dirname, "../../../.env.example");
  const envPath = resolve(__dirname, "../../../.env");

  // Check if .env already exists
  if (fs.existsSync(envPath)) {
    // Load existing .env file
    dotenv.config({ path: envPath });
    
    // Check if all required variables are set
    if (checkEnvironment()) {
      console.log(chalk.green('✓ Environment already set up'));
      return true;
    }
  }

  console.log(chalk.yellow('⚠️ Environment not fully set up. Starting setup process...'));
  
  // Read .env.example to get required variables
  if (!fs.existsSync(envExamplePath)) {
    console.error(chalk.red('❌ .env.example file not found'));
    return false;
  }
  
  const envExampleContent = fs.readFileSync(envExamplePath, 'utf8');
  const envVars = envExampleContent
    .split('\n')
    .filter(line => line.trim() && !line.startsWith('#'))
    .map(line => {
      const [key] = line.split('=');
      return key.trim();
    });
  
  // Create readline interface for user input
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  // Load existing .env content if it exists
  let existingEnvContent = '';
  if (fs.existsSync(envPath)) {
    existingEnvContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Parse existing env vars
  const existingEnvVars: Record<string, string> = {};
  existingEnvContent.split('\n').forEach(line => {
    if (line.trim() && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=');
      if (key && value) {
        existingEnvVars[key.trim()] = value.trim();
      }
    }
  });
  
  // Prompt for each variable
  const newEnvVars: Record<string, string> = { ...existingEnvVars };
  
  for (const varName of envVars) {
    if (!varName) continue;
    
    // Skip if already set and valid
    if (process.env[varName]) {
      if (varName.startsWith('PRIVATE_KEY') && 
          ((process.env[varName]?.length === 64 && !process.env[varName]?.startsWith('0x')) || 
           (process.env[varName]?.length === 66 && process.env[varName]?.startsWith('0x')))) {
        newEnvVars[varName] = process.env[varName] as string;
        continue;
      }
    }
    
    // Get user input for the variable
    const defaultValue = existingEnvVars[varName] || '';
    const promptText = defaultValue 
      ? `Enter ${varName} (current: ${defaultValue.substring(0, 3)}...${defaultValue.substring(defaultValue.length - 3)}): `
      : `Enter ${varName}: `;
    
    const value = await new Promise<string>(resolve => {
      rl.question(promptText, answer => {
        resolve(answer || defaultValue);
      });
    });
    
    if (value) {
      newEnvVars[varName] = value;
      // Update process.env for immediate use
      process.env[varName] = value;
    }
  }
  
  // Write to .env file
  const newEnvContent = Object.entries(newEnvVars)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  fs.writeFileSync(envPath, newEnvContent);
  
  rl.close();
  
  console.log(chalk.green('✓ Environment setup complete'));
  
  // Reload environment variables
  dotenv.config({ path: envPath });
  
  // Verify all required variables are now set
  return checkEnvironment();
}

async function main() {
  console.clear();
  
  // Display KRNL logo
  console.log(chalk.blue(`                                                                                                  
    %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%                 
    %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%                 
    %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%                 
    %%%%                                                          %%%%                 
    %%%%                                                          %%%%                 
    %%%%    %%%%%%%%    %%%%%%%%%%%   %%%%%%%%%%%%%%%%%%%         %%%%                 
    %%%%    %%%%%%%%  %%%%%%%%%%%%    %%%%%%%%%%%%%%%%%%%%%       %%%%                 
    %%%%    %%%%%%%% %%%%%%%%%%%      %%%%%%%%%%%%%%%%%%%%%%      %%%%                 
    %%%%    %%%%%%%%%%%%%%%%%%%       %%%%%%%%%%%%%%%%%%%%%%      %%%%                 
    %%%%    %%%%%%%%%%%%%%%%%         %%%%%%%%%%    %%%%%%%%%     %%%%                 
    %%%%    %%%%%%%%%%%%%%%%%         %%%%%%%%%%%%%%%%%%%%%%      %%%%                 
    %%%%    %%%%%%%%%%%%%%%%%%%       %%%%%%%%%%%%%%%%%%%%%%      %%%%                 
    %%%%    %%%%%%%%%%%%%%%%%%%%      %%%%%%%%%%%%%%%%%%%%%       %%%%                 
    %%%%    %%%%%%%%%%%%%%%%%%%%%%    %%%%%%%%%%%%%%%%%%%%        %%%%                 
    %%%%    %%%%%%%%%%%%%%%%%%%%%%%   %%%%%%%%%% %%%%%%%%%%       %%%%                 
    %%%%    %%%%%%%%   %%%%%%%%%%%      %%%%%%%%  %%%%%%%%%%      %%%%                 
    %%%%    %%%%%%%%    %%%%%%%%%        %%%%%%%   %%%%%%%%%%     %%%%                 
    %%%%    %%%%%%%%      %%%%%            %%%%%    %%%%%%%%%%    %%%%                 
    %%%%                                                          %%%%                 
    %%%%    %%%%%%%%%     %%%%%            %%%%%                  %%%%                 
    %%%%    %%%%%%%%%%    %%%%%%%        %%%%%%%                  %%%%                 
    %%%%    %%%%%%%%%%%   %%%%%%%%      %%%%%%%%                  %%%%                 
    %%%%    %%%%%%%%%%%%  %%%%%%%%%%  %%%%%%%%%%                  %%%%                 
    %%%%    %%%%%%%%%%%%% %%%%%%%%%%  %%%%%%%%%%                  %%%%                 
    %%%%    %%%%%%%%%%%%%%%%%%%%%%%%  %%%%%%%%%%                  %%%%                 
    %%%%    %%%%%%%%%%%%%%%%%%%%%%%%  %%%%%%%%%%                  %%%%                 
    %%%%    %%%%%%%%%%%%%%%%%%%%%%%%  %%%%%%%%%%                  %%%%                 
    %%%%    %%%%%%%%%%%%%%%%%%%%%%%%  %%%%%%%%%%                  %%%%                 
    %%%%    %%%%%%%%%% %%%%%%%%%%%%%  %%%%%%%%%%%%%%%%%%%%%%%%    %%%%                 
    %%%%    %%%%%%%%%%  %%%%%%%%%%%%  %%%%%%%%%%%%%%%%%%%%%%%%    %%%%                 
    %%%%    %%%%%%%%%%   %%%%%%%%%%%  %%%%%%%%%%%%%%%%%%%%%%%%    %%%%                 
    %%%%    %%%%%%%%%%     %%%%%%%%%  %%%%%%%%%%%%%%%%%%%%%%%%    %%%%                 
    %%%%                                                          %%%%                 
    %%%%                                                          %%%%                 
    %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%                 
    %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%                 
    %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%                                                                                                      
`));

  // First, ensure environment is set up
  const envSetup = await setupEnvironment();
  if (!envSetup) {
    process.exit(1);
  }
  
  // Check environment
  if (!checkEnvironment()) {
    process.exit(1);
  }
  
  // Warning box
  console.log(brandBlue('━'.repeat(70)));
  console.log(brandHeader('  ⚠️  IMPORTANT NOTICE '.padEnd(69) + ' '));
  console.log(brandBlue('━'.repeat(70)));
  console.log('This script will perform the following operations:');
  console.log('1. Deploy Token Authority contract to Oasis Sapphire testnet');
  console.log('2. Deploy Main contract to Sepolia testnet');
  console.log('3. Register both contracts with the platform registry');
  console.log();
  console.log('Warning messages may appear during deployment and verification.');
  console.log('This is normal and does not indicate deployment failure.');
  console.log(brandBlue('━'.repeat(70)));
  console.log();
  
  await new Promise(r => setTimeout(r, 3000));
  
  try {
    // STEP 1: Deploy Token Authority
    console.log(brandHighlight(' STEP 1: TOKEN AUTHORITY DEPLOYMENT '));
    console.log();
    
    const taResult = await deployTokenAuthority(true);
    
    console.log(brandBlue('✓ ') + chalk.green('TOKEN AUTHORITY DEPLOYMENT COMPLETED'));
    console.log();
    
    await new Promise(r => setTimeout(r, 2000));
    
    // STEP 2: Deploy Main Contract
    console.log(brandHighlight(' STEP 2: MAIN CONTRACT DEPLOYMENT '));
    console.log();
    
    const mainResult = await deployMainContract(true);
    
    console.log(brandBlue('✓ ') + chalk.green('MAIN CONTRACT DEPLOYMENT COMPLETED'));
    console.log();
    
    await new Promise(r => setTimeout(r, 2000));
    
    // STEP 3: Platform Registration
    console.log(brandHighlight(' STEP 3: PLATFORM REGISTRATION '));
    console.log();
    
    const registerResult = await registerPlatform(true);
    
    console.log(brandBlue('✓ ') + chalk.green('PLATFORM REGISTRATION COMPLETED'));
    console.log();
    
    // FINAL SUMMARY
    console.log(brandBlue('━'.repeat(70)));
    console.log(brandHeader(` 📋 DEPLOYMENT SUMMARY `.padEnd(69) + ' '));
    console.log(brandBlue('━'.repeat(70)));
    console.log(`Token Authority (Sapphire): ${chalk.white(taResult.addressTokenAuthority.toString())}`);
    console.log(`Main Contract (Sepolia):    ${chalk.white(mainResult.addressMain.toString())}`);
    console.log(`Smart Contract ID:          ${chalk.white(registerResult.registeredSmartContractId)}`);
    console.log(`dApp ID:                    ${chalk.white(registerResult.dAppIdResult)}`);
    console.log();
    console.log(`${chalk.green('✓')} Please visit this page for Entry ID, Access Token, and Kernel Payload:`);
    console.log(chalk.cyan(`https://app.platform.lat/dapp/${registerResult.dAppIdResult}`));
    console.log(brandBlue('━'.repeat(70)));
    console.log();
    
  } catch (error) {
    console.error('\n' + brandBlue('✗ ') + chalk.red('DEPLOYMENT PROCESS FAILED:'));
    console.error(error);
    console.log();
    process.exit(1);
  }
}

main()
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