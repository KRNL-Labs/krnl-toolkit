import * as fs from "fs";
import * as dotenv from "dotenv";
import { resolve } from "path";
import chalk from "chalk";
import readline from 'readline';
import { deployTokenAuthority } from "./1_deployTA";
import { deployMainContract } from "./2_deployMain";
import { registerPlatform } from "./3_platformRegister";


dotenv.config({ path: resolve(__dirname, "../../.env") });

// Brand colors
const BRAND_BLUE = '#0000FF';

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

// Check if environment variables are set up
function checkEnvironment() {
  const requiredVars = [
    'PRIVATE_KEY_OASIS',
    'PRIVATE_KEY_SEPOLIA',
    'KERNEL_ID'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error(chalk.red('\n❌ Missing required environment variables:'));
    missingVars.forEach(varName => {
      console.error(chalk.red(`   - ${varName}`));
    });
    console.log(chalk.yellow('\nPlease set up your environment variables first.'));
    return false;
  }
  
  return true;
}

// Setup environment variables
async function setupEnvironment() {
  const envExamplePath = resolve(__dirname, "../../../.env.example");
  const envPath = resolve(__dirname, "../../../.env");


  // Check if .env already exists
  if (fs.existsSync(envPath)) {
    console.log(chalk.yellow("\n✅ .env file already exists. Skipping environment setup...\n"));
    return true;
  }

  // Check if .env.example exists
  if (!fs.existsSync(envExamplePath)) {
    console.error(chalk.red("\n❌ Error: .env.example file not found.\n"));
    return false;
  }

  // Read and parse the .env.example file
  const exampleContent = fs.readFileSync(envExamplePath, "utf-8");
  const envLines = exampleContent.split("\n");

  const envVars: Array<{
    name: string;
    description: string;
    defaultValue: string;
    optional: boolean;
  }> = [];
  
  let currentComment = "";

  for (const line of envLines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith("#")) {
      currentComment += trimmedLine.substring(1).trim() + " ";
    } else if (trimmedLine && trimmedLine.includes("=")) {
      const [name, defaultValue] = trimmedLine.split("=").map((part) => part.trim());
      envVars.push({
        name,
        description: currentComment.trim(),
        defaultValue: defaultValue || "",
        optional: currentComment.toLowerCase().includes("optional"),
      });
      currentComment = "";
    }
  }

  // Setup interactive prompt
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const envValues: Record<string, string> = {};

  const askQuestion = (variable: { name: string; description: string; defaultValue: string; optional: boolean }) => {
    return new Promise<void>((resolve) => {
      let prompt = chalk.blue(`\n🔹 ${variable.name}`);

      if (variable.description) {
        prompt += chalk.gray(` (${variable.description})`);
      }

      if (variable.defaultValue) {
        prompt += chalk.green(` [default: ${variable.defaultValue}]`);
      }

      if (variable.optional) {
        prompt += chalk.yellow(" [Press Enter to skip]");
      }

      prompt += ": ";

      rl.question(prompt, (answer) => {
        envValues[variable.name] = answer || variable.defaultValue || "";
        resolve();
      });
    });
  };

  console.log(chalk.magenta("\n🚀 Setting up your .env file...\n"));

  for (const variable of envVars) {
    await askQuestion(variable);
  }

  rl.close();

  const envContent = envVars
    .map((variable) => `${variable.name}=${envValues[variable.name]}`)
    .join("\n");

  fs.writeFileSync(envPath, envContent);
  console.log(chalk.green("\n✅ .env file created successfully!\n"));
  
  // Reload environment variables
  dotenv.config({ path: resolve(__dirname, "../../.env") });
  
  return true;
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
  console.log(brandHeader(' ⚠️  IMPORTANT NOTICE '.padEnd(69) + ' '));
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