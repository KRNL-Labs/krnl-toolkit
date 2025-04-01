#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get package version
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8')
);

// Brand colors
const BRAND_BLUE = '#001EFE';
const brandHeader = chalk.hex(BRAND_BLUE).white.bold;

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

const program = new Command();

program
  .name('krnl-cli')
  .description('KRNL Toolkit CLI for deploying and registering smart contracts')
  .version(packageJson.version);

// Helper function to run a script in the hardhat workspace
function runHardhatScript(scriptName, args = []) {
  try {
    const scriptPath = path.join(__dirname, '../smart-contracts/hardhat/scripts', scriptName);
    const command = `npx hardhat run ${scriptPath} ${args.join(' ')}`;
    console.log(chalk.gray(`> ${command}`));
    execSync(command, { stdio: 'inherit', cwd: path.join(__dirname, '../smart-contracts/hardhat') });
    return true;
  } catch (error) {
    console.error(chalk.red(`Error running script ${scriptName}:`), error.message);
    return false;
  }
}

program
  .command('setup')
  .description('Set up environment variables')
  .action(() => {
    try {
      execSync('node setup-env.js', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    } catch (error) {
      console.error(chalk.red('Error setting up environment:'), error.message);
    }
  });

program
  .command('deploy-ta')
  .description('Deploy Token Authority contract to Oasis Sapphire testnet')
  .action(() => {
    runHardhatScript('1_deployTA.ts');
  });

program
  .command('deploy-main')
  .description('Deploy Main contract to Sepolia testnet')
  .action(() => {
    runHardhatScript('2_deployMain.ts');
  });

program
  .command('register')
  .description('Register contracts with the platform registry')
  .action(() => {
    runHardhatScript('3_platformRegister.ts');
  });

program
  .command('deploy-all')
  .description('Run the complete deployment process')
  .action(() => {
    runHardhatScript('main.ts');
  });

program.parse(process.argv);

// If no command is provided, display help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
