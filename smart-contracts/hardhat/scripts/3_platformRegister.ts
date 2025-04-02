import { ethers, run } from "hardhat";
import { contractRegistryAbi } from "./abi/contractRegistry";
import * as fs from "fs";
import * as dotenv from "dotenv";
import { resolve } from "path";
import chalk from "chalk";

dotenv.config({ path: resolve(__dirname, "../../.env") });

interface KernelParameterTypes {
  header: Record<string, string>;
  body: Record<string, string>;
  query: Record<string, string>;
  path: Record<string, string>;
}

interface KernelPayloadItem {
  parameters?: KernelParameterTypes;
  functionParams?: string;
}

interface KernelPayloadStructure {
  senderAddress: string;
  kernelPayload: Record<string, KernelPayloadItem>;
}

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

  console.log(brandHighlight(' 3.3) PULLING ENTRY ID, ACCESS TOKEN, AND KERNEL PAYLOAD '));
  console.log();
  
  // Variables that will be used across the function scope
  let entryId: string = '';
  let accessToken: string = '';

  // Pull Entry ID and Access Token and Kernel Payload
  try {
    let pullSpin = startSpinner('Fetching Entry ID...');
    
    const entryData = await provider.call({
      to: dAppRegistryAddress,
      data: "0x53d85919" + ethers.toBeHex(dAppIdResult).replace("0x", "").padStart(64, "0"),
    });

    const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
      ["tuple(uint256 dappId, uint256 contractId, bytes32 entryId, address dappOwner)"],
      entryData
    );

    clearInterval(pullSpin);
    process.stdout.write('\r' + ' '.repeat(100) + '\r');
    
    entryId = decoded[0].entryId;
    
    pullSpin = startSpinner('Fetching Access Token...');

    const providerTokenAuthority = new ethers.JsonRpcProvider(`https://testnet.sapphire.oasis.io`);

    const entryIdEncoded = ethers.AbiCoder.defaultAbiCoder()
    .encode(["bytes32"], [entryId])
    .replace("0x", "");

    const accessData = await providerTokenAuthority.call({
      to: tokenAuthorityAddress,
      data: "0x688b87e8" + entryIdEncoded,
    });

    const accessDecoded = ethers.AbiCoder.defaultAbiCoder().decode(["bytes"], accessData);
    accessToken = accessDecoded[0];
    
    clearInterval(pullSpin);
    process.stdout.write('\r' + ' '.repeat(100) + '\r');
    
    pullSpin = startSpinner('Generating Kernel Payload...');

    // Initialize with proper types
    const kernelPayload: KernelPayloadStructure = { 
      senderAddress: "{{senderAddress}}", 
      kernelPayload: {} 
    };
    
    try {
      // First, get the contract information to access the kernels
      const contractData = await provider.call({
        to: contractRegistryAddress,
        data: "0x6ebc8c86" + ethers.toBeHex(registeredSmartContractId).replace("0x", "").padStart(64, "0"),
      });
  
      const decodedContract = ethers.AbiCoder.defaultAbiCoder().decode(
        ["tuple(uint256 contractId, address smartContractAddress, uint64 chainId, uint8 tokenAuthorityProvider, string tokenAuthorityEndpoint, address tokenAuthorityContractAddress, address contractOwner, uint256[] kernelIds, uint256 createdAt)"],
        contractData
      );
  
      // Process each kernel
      const kernelIds = decodedContract[0].kernelIds;

      for (const kernelId of kernelIds) {
        // Fetch kernel information
        const kernelData = await provider.call({
          to: "0xB93acF8cEB94E0cDa52400dd4eA714bc2957AA9d", // Kernel registry address
          data: "0x698edd2d" + ethers.toBeHex(kernelId).replace("0x", "").padStart(64, "0"),
        });
    
        const decodedKernel = ethers.AbiCoder.defaultAbiCoder().decode(
          ["tuple(uint256 kernelId, uint8 resolverType, uint64 chainId, address kernelContractAddress, string functionSignature, string functionReturnType, bytes schemaCid, bytes metadataCid, bool isActive, uint256 deactivatedAfter, uint256 fee, uint256 stakedBalance, address kernelOwner, uint256 createdAt)"],
          kernelData
        );

        const kernel = decodedKernel[0];
        
        // Process kernel based on type
        if (Number(kernel.resolverType.toString()) === 1) { // Off-chain kernel
          // Initialize with empty parameters structure
          kernelPayload.kernelPayload[kernelId.toString()] = {
            parameters: {
              header: {},
              body: {},
              query: {},
              path: {}
            }
          };
          
          // If there's a schema, fetch and parse it from IPFS
          if (kernel.schemaCid !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
            try {
              // Convert the bytes32 to a string 
              let cid = "";
              try {
                // Try to convert hex to UTF-8 string
                const bytes = ethers.getBytes(kernel.schemaCid);
                cid = ethers.toUtf8String(bytes);
                // Clean up any null characters
                cid = cid.replace(/\0/g, '');
              } catch (error) {
                // Fallback to hex string
                cid = kernel.schemaCid.toString();
              }
              
              // Make API call to fetch the schema
              const ipfsGateway = process.env.IPFS_GATEWAY_URL || 'ipfs.io';
              const response = await fetch(`https://${ipfsGateway}/ipfs/${cid}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
              });
              
              if (response.ok) {
                const schemaData = await response.json();
                
                // Process schema to extract parameters
                try {
                  const paths = schemaData.paths || {};
                  for (const pathKey in paths) {
                    const pathObj = paths[pathKey] as Record<string, any>;
                    // Look for methods (GET, POST, etc.)
                    for (const method in pathObj) {
                      const operation = pathObj[method] as Record<string, any>;
                      
                      // Extract parameters
                      if (Array.isArray(operation.parameters)) {
                        operation.parameters.forEach((param: any) => {
                          const paramName = param.name as string;
                          const paramType = (param.schema?.type as string) || 'string';
                          
                          if (param.in === 'path' && kernelPayload.kernelPayload[kernelId.toString()].parameters) {
                            kernelPayload.kernelPayload[kernelId.toString()].parameters!.path[paramName] = paramType;
                          } else if (param.in === 'query' && kernelPayload.kernelPayload[kernelId.toString()].parameters) {
                            kernelPayload.kernelPayload[kernelId.toString()].parameters!.query[paramName] = paramType;
                          } else if (param.in === 'header' && kernelPayload.kernelPayload[kernelId.toString()].parameters) {
                            kernelPayload.kernelPayload[kernelId.toString()].parameters!.header[paramName] = paramType;
                          }
                        });
                      }
                      
                      // Extract request body properties if present
                      const requestBody = operation.requestBody as Record<string, any> | undefined;
                      if (requestBody?.content?.['application/json']?.schema?.properties && 
                          kernelPayload.kernelPayload[kernelId.toString()].parameters) {
                        const properties = requestBody.content['application/json'].schema.properties as Record<string, any>;
                        for (const propName in properties) {
                          const propSchema = properties[propName] as Record<string, any>;
                          kernelPayload.kernelPayload[kernelId.toString()].parameters!.body[propName] = 
                            (propSchema.type as string) || 'string';
                        }
                      }
                      
                      // We only need to process the first operation we find
                      break;
                    }
                    // We only need to process the first path we find
                    break;
                  }
                  
                  // Handle security for Authorization header
                  if (schemaData.components?.securitySchemes?.bearerAuth && 
                      kernelPayload.kernelPayload[kernelId.toString()].parameters) {
                    kernelPayload.kernelPayload[kernelId.toString()].parameters!.header['Authorization'] = 'Bearer {{accessToken}}';
                  }
                } catch (parseError) {
                  // Silently continue if schema parsing fails
                }
              }
            } catch (fetchError) {
              // Silently continue if schema fetching fails
            }
          }
        } else if (Number(kernel.resolverType.toString()) === 2) { // On-chain kernel
          kernelPayload.kernelPayload[kernelId.toString()] = {
            functionParams: `{{abiEncoded(${kernel.functionSignature.slice(
              kernel.functionSignature.indexOf('(') + 1, 
              kernel.functionSignature.lastIndexOf(')')
            )})}}`,
          };
        }
      }
      
      clearInterval(pullSpin);
      process.stdout.write('\r' + ' '.repeat(100) + '\r');
      
      // Format the payload for display
      const formattedPayload = JSON.stringify(kernelPayload, null, 2);

      const saveSpin = startSpinner('Saving kernel payload...');

      // Save the kernel payload to a local JSON file
      const outputPath = resolve(__dirname, `../kernel-payload.json`);
      fs.writeFileSync(outputPath, formattedPayload);

      clearInterval(saveSpin);
      process.stdout.write('\r' + ' '.repeat(100) + '\r');

      console.log();
      console.log(brandBlue('✓ ') + chalk.green('FETCHING DAPP DETAILS SUCCESSFUL'));

      // Display all information in a structured box

      console.log(brandBlue('  ↳ Entry ID:'));
      console.log(chalk.white("    "+ entryId));
      console.log();
      
      console.log(brandBlue('  ↳ Access Token:'));
      console.log(chalk.white("    "+ accessToken));
      console.log();
      
      console.log(brandBlue('  ↳ Kernel Payload:'));
      console.log();
      
      // Split the payload by lines and format each line
      const payloadLines = formattedPayload.split('\n');
      for (const line of payloadLines) {
        // Ensure the line fits within the box width (70 characters)
        if (line.length > 70) {
          console.log(chalk.white("    "+line.substring(0, 70)));
          console.log(chalk.white("    "+line.substring(70)));
        } else {
          console.log(chalk.white("    "+line));
        }
      }
      
    } catch (error) {
      clearInterval(pullSpin);
      process.stdout.write('\r' + ' '.repeat(100) + '\r');
      console.error(brandBlue('✗ ') + chalk.red('ERROR GENERATING KERNEL PAYLOAD: ') + (error as Error).message);
    }
  } catch (error) {
    console.error(brandBlue('✗ ') + chalk.red('ERROR PULLING ENTRY ID, ACCESS TOKEN, AND KERNEL PAYLOAD: ') + (error as Error).message);
    throw new Error('Failed to pull Entry ID, Access Token, and Kernel Payload.');
  }
  
  // SUMMARY
  console.log(brandBlue('━'.repeat(70)));
  console.log(brandHeader(` 📋 REGISTRATION SUMMARY `.padEnd(69) + ' '));
  console.log(brandBlue('━'.repeat(70)));
  console.log(`Smart Contract ID: ${chalk.white(registeredSmartContractId)}`);
  console.log(`dApp ID:           ${chalk.white(dAppIdResult)}`);
  console.log(`Entry ID:          ${chalk.white(entryId)}`);
  console.log(`Access Token:      ${chalk.white(accessToken)}`);
  console.log(`Kernel Payload:    ${chalk.white('kernel-payload.json')}`);
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
