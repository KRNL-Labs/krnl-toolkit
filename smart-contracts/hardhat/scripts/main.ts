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
const BRAND_BLUE = "#001EFE";

// Create custom branded chalk styles
const brandBlue = chalk.hex(BRAND_BLUE);
const brandHeader = chalk.hex(BRAND_BLUE).white.bold;
const brandHighlight = chalk.bold.white.bgHex(BRAND_BLUE);

async function main() {
  // Enhanced console clearing to ensure any previous output is completely removed
  console.clear();
  
  // Small delay to ensure clearing is complete
  await new Promise(r => setTimeout(r, 200));
  
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