import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "./plugins/plugin";

import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(__dirname, "../../.env") });

const sepoliaRpc = process.env.INFURA_PROJECT_ID ? `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}` : "https://sepolia.drpc.org";

const config: HardhatUserConfig = {
  defaultNetwork: "sepolia",
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
    apiKey: process.env.ETHERSCAN_API_KEY || ""
  },
  warnings: 'off',
  sourcify: {
    enabled: true
  }
}

export default config;
