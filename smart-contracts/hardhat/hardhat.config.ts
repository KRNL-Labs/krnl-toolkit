import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "hardhat-ignore-warnings";

import * as dotenv from "dotenv";
import { resolve } from "path";

// Type declaration for the warnings property added by hardhat-ignore-warnings
declare module "hardhat/types" {
  interface HardhatUserConfig {
    warnings?: 'off' | 'error' | 'warn' | boolean | {
      [filePattern: string]: 'off' | 'error' | 'warn' | boolean | {
        [warningCode: string]: 'off' | 'error' | 'warn' | boolean;
      };
    };
  }
}

dotenv.config({ path: resolve(__dirname, "../../.env") });

const sepoliaRpc = process.env.INFURA_PROJECT_ID ? `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}` : "https://sepolia.drpc.org";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24", // Oasis supports up to 0.8.24
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true // set to true for TA
    }
  },
  networks: {
    sepolia: {
      url: sepoliaRpc,
      chainId: 11155111,
      accounts: [`0x${process.env.PRIVATE_KEY_SEPOLIA}`],
    },
    "sapphire-testnet": {
      url: `https://testnet.sapphire.oasis.io`,
      chainId: 23295,
      accounts: [`0x${process.env.PRIVATE_KEY_OASIS}`],
    },
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY || "",
      "sapphire-testnet": process.env.ETHERSCAN_API_KEY || ""
    },
    customChains: [
      {
        network: "sapphire-testnet",
        chainId: 23295,
        urls: {
          apiURL: "https://api-sapphire.oasis.io",
          browserURL: "https://sapphire.oasis.io"
        }
      }
    ]
  },
  warnings: 'off',
  sourcify: {
    enabled: true
  //   // Optional: specify a different Sourcify server
  //   // apiUrl: "https://sourcify.dev/server",
  //   // Optional: specify a different Sourcify repository
  //   // browserUrl: "https://repo.sourcify.dev",
  }
}

export default config;
