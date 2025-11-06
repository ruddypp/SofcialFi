import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.30",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true, // Enabled for better optimization
    },
  },
  networks: {
    // Local Hardhat Network
    hardhat: {
      chainId: 31337,
      allowUnlimitedContractSize: true,
    },
    
    // Lisk Sepolia Testnet
    liskSepolia: {
      url: process.env.LISK_SEPOLIA_RPC || "https://rpc.sepolia-api.lisk.com",
      accounts: process.env.PRIVATE_KEY && process.env.PRIVATE_KEY_USER1 && process.env.PRIVATE_KEY_USER2
        ? [
            process.env.PRIVATE_KEY,
            process.env.PRIVATE_KEY_USER1,
            process.env.PRIVATE_KEY_USER2,
          ]
        : [],
      chainId: 4202,
      gasPrice: "auto",
    },
  },
  
  etherscan: {
    apiKey: {
      liskSepolia: process.env.BLOCKSCOUT_API_KEY || "empty",
    },
    customChains: [
      {
        network: "liskSepolia",
        chainId: 4202,
        urls: {
          apiURL: "https://sepolia-blockscout.lisk.com/api",
          browserURL: "https://sepolia-blockscout.lisk.com",
        },
      },
    ],
  },
  
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  
  mocha: {
    timeout: 40000,
  },
};

export default config;