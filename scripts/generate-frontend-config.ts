import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("=== Generating Frontend Configuration ===\n");

  // Read deployment info
  const deploymentPath = "deployment-testnet.json";
  if (!fs.existsSync(deploymentPath)) {
    console.error("❌ deployment-testnet.json not found!");
    console.log("Please deploy contracts first.");
    return;
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  console.log("✓ Loaded deployment info");
  console.log("  Network:", deployment.network);
  console.log("  Chain ID:", deployment.chainId);

  // Read ABIs from artifacts
  const contracts = ["CampaignToken", "SoulboundMember", "PetitionPlatform"];
  const abis: any = {};

  console.log("\n📦 Extracting ABIs...");
  for (const contractName of contracts) {
    const artifactPath = path.join(
      "artifacts",
      "contracts",
      `${contractName}.sol`,
      `${contractName}.json`
    );

    if (!fs.existsSync(artifactPath)) {
      console.error(`❌ Artifact not found: ${artifactPath}`);
      return;
    }

    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    abis[contractName] = artifact.abi;
    console.log(`  ✓ ${contractName}: ${artifact.abi.length} functions`);
  }

  // Create output directory
  const outputDir = path.join("artifacts", "contracts", "testnet");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 1. Generate contracts.json (All-in-one config)
  console.log("\n📝 Generating contracts.json...");
  const contractsConfig = {
    network: deployment.network,
    chainId: deployment.chainId,
    rpcUrl: "https://rpc.sepolia-api.lisk.com",
    blockExplorer: "https://sepolia-blockscout.lisk.com",
    contracts: {
      CampaignToken: {
        address: deployment.contracts.CampaignToken,
        abi: abis.CampaignToken,
      },
      SoulboundMember: {
        address: deployment.contracts.SoulboundMember,
        abi: abis.SoulboundMember,
      },
      PetitionPlatform: {
        address: deployment.contracts.PetitionPlatform,
        abi: abis.PetitionPlatform,
      },
    },
    explorerUrls: deployment.explorerUrls,
  };

  fs.writeFileSync(
    path.join(outputDir, "contracts.json"),
    JSON.stringify(contractsConfig, null, 2)
  );
  console.log("  ✓ contracts.json created");

  // 2. Generate separate ABI files
  console.log("\n📝 Generating separate ABI files...");
  for (const contractName of contracts) {
    fs.writeFileSync(
      path.join(outputDir, `${contractName}.abi.json`),
      JSON.stringify(abis[contractName], null, 2)
    );
    console.log(`  ✓ ${contractName}.abi.json created`);
  }

  // 3. Generate addresses.json (lightweight)
  console.log("\n📝 Generating addresses.json...");
  const addressesConfig = {
    network: deployment.network,
    chainId: deployment.chainId,
    CampaignToken: deployment.contracts.CampaignToken,
    SoulboundMember: deployment.contracts.SoulboundMember,
    PetitionPlatform: deployment.contracts.PetitionPlatform,
  };

  fs.writeFileSync(
    path.join(outputDir, "addresses.json"),
    JSON.stringify(addressesConfig, null, 2)
  );
  console.log("  ✓ addresses.json created");

  // 4. Generate Next.js example
  console.log("\n📝 Generating Next.js example...");
  const nextjsExample = `// Next.js 14+ with App Router Example
'use client';

import { ethers } from 'ethers';
import { useState, useEffect } from 'react';
import contractsConfig from './contracts.json';

export default function PetitionApp() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [account, setAccount] = useState<string>('');
  const [contracts, setContracts] = useState<any>({});

  // Initialize contracts
  useEffect(() => {
    const init = async () => {
      if (typeof window.ethereum !== 'undefined') {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        setProvider(browserProvider);

        // Request account access
        const accounts = await browserProvider.send('eth_requestAccounts', []);
        setAccount(accounts[0]);

        const signer = await browserProvider.getSigner();
        setSigner(signer);

        // Initialize contract instances
        const campaignToken = new ethers.Contract(
          contractsConfig.contracts.CampaignToken.address,
          contractsConfig.contracts.CampaignToken.abi,
          signer
        );

        const soulboundMember = new ethers.Contract(
          contractsConfig.contracts.SoulboundMember.address,
          contractsConfig.contracts.SoulboundMember.abi,
          signer
        );

        const petitionPlatform = new ethers.Contract(
          contractsConfig.contracts.PetitionPlatform.address,
          contractsConfig.contracts.PetitionPlatform.abi,
          signer
        );

        setContracts({ campaignToken, soulboundMember, petitionPlatform });
      }
    };

    init();
  }, []);

  // Example: Mint SBT
  const mintSBT = async () => {
    try {
      const tx = await contracts.soulboundMember.mintMembership();
      await tx.wait();
      console.log('SBT Minted!');
    } catch (error) {
      console.error('Error minting SBT:', error);
    }
  };

  // Example: Create Petition
  const createPetition = async (title: string, description: string, ipfsHash: string) => {
    try {
      const useToken = true; // or false to pay with ETH
      const tx = await contracts.petitionPlatform.createPetition(
        title,
        description,
        ipfsHash,
        useToken
      );
      await tx.wait();
      console.log('Petition Created!');
    } catch (error) {
      console.error('Error creating petition:', error);
    }
  };

  // Example: Get Token Balance
  const getTokenBalance = async () => {
    try {
      const balance = await contracts.campaignToken.balanceOf(account);
      console.log('Balance:', ethers.formatEther(balance), 'CAMP');
      return balance;
    } catch (error) {
      console.error('Error getting balance:', error);
    }
  };

  return (
    <div>
      <h1>Petition Platform</h1>
      <p>Connected Account: {account}</p>
      <button onClick={mintSBT}>Mint SBT</button>
      <button onClick={getTokenBalance}>Check Balance</button>
    </div>
  );
}

// Network Configuration
export const networkConfig = {
  chainId: \`0x\${contractsConfig.chainId.toString(16)}\`, // 0x106a
  chainName: 'Lisk Sepolia',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: [contractsConfig.rpcUrl],
  blockExplorerUrls: [contractsConfig.blockExplorer],
};

// Helper: Add Lisk Sepolia to MetaMask
export async function addLiskSepoliaNetwork() {
  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [networkConfig],
    });
  } catch (error) {
    console.error('Error adding network:', error);
  }
}
`;

  fs.writeFileSync(
    path.join(outputDir, "example-nextjs.tsx"),
    nextjsExample
  );
  console.log("  ✓ example-nextjs.tsx created");

  // 5. Generate React (Vite) example
  console.log("\n📝 Generating React example...");
  const reactExample = `// React + Vite Example
import { ethers } from 'ethers';
import { useState, useEffect } from 'react';
import contractsConfig from './contracts.json';

function App() {
  const [provider, setProvider] = useState(null);
  const [contracts, setContracts] = useState({});
  const [account, setAccount] = useState('');

  useEffect(() => {
    initContracts();
  }, []);

  const initContracts = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('Please install MetaMask!');
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    setProvider(provider);

    const accounts = await provider.send('eth_requestAccounts', []);
    setAccount(accounts[0]);

    const signer = await provider.getSigner();

    // Initialize contracts
    const campaignToken = new ethers.Contract(
      contractsConfig.contracts.CampaignToken.address,
      contractsConfig.contracts.CampaignToken.abi,
      signer
    );

    const soulboundMember = new ethers.Contract(
      contractsConfig.contracts.SoulboundMember.address,
      contractsConfig.contracts.SoulboundMember.abi,
      signer
    );

    const petitionPlatform = new ethers.Contract(
      contractsConfig.contracts.PetitionPlatform.address,
      contractsConfig.contracts.PetitionPlatform.abi,
      signer
    );

    setContracts({ campaignToken, soulboundMember, petitionPlatform });
  };

  const mintSBT = async () => {
    try {
      const tx = await contracts.soulboundMember.mintMembership();
      await tx.wait();
      alert('SBT Minted Successfully!');
    } catch (error) {
      console.error(error);
      alert('Error minting SBT');
    }
  };

  const createPetition = async () => {
    try {
      const tx = await contracts.petitionPlatform.createPetition(
        'My Petition',
        'Description here',
        'QmIPFShash',
        true // use token
      );
      await tx.wait();
      alert('Petition Created!');
    } catch (error) {
      console.error(error);
      alert('Error creating petition');
    }
  };

  return (
    <div>
      <h1>Petition Platform</h1>
      <p>Account: {account}</p>
      <button onClick={mintSBT}>Mint SBT</button>
      <button onClick={createPetition}>Create Petition</button>
    </div>
  );
}

export default App;
`;

  fs.writeFileSync(
    path.join(outputDir, "example-react.tsx"),
    reactExample
  );
  console.log("  ✓ example-react.tsx created");

  // 6. Generate README
  console.log("\n📝 Generating README...");
  const readme = `# Frontend Integration Guide

## 📁 Files Generated

- \`contracts.json\` - All-in-one config (addresses + ABIs)
- \`addresses.json\` - Contract addresses only (lightweight)
- \`CampaignToken.abi.json\` - CampaignToken ABI
- \`SoulboundMember.abi.json\` - SoulboundMember ABI
- \`PetitionPlatform.abi.json\` - PetitionPlatform ABI
- \`example-nextjs.tsx\` - Next.js integration example
- \`example-react.tsx\` - React integration example

## 🚀 Quick Start

### Option 1: Use All-in-One Config (Recommended)

\`\`\`typescript
import contractsConfig from './contracts.json';

// Access addresses
const campaignTokenAddress = contractsConfig.contracts.CampaignToken.address;

// Access ABIs
const campaignTokenABI = contractsConfig.contracts.CampaignToken.abi;

// Initialize contract
const contract = new ethers.Contract(
  campaignTokenAddress,
  campaignTokenABI,
  signer
);
\`\`\`

### Option 2: Import Separately

\`\`\`typescript
import addresses from './addresses.json';
import campaignTokenABI from './CampaignToken.abi.json';

const contract = new ethers.Contract(
  addresses.CampaignToken,
  campaignTokenABI,
  signer
);
\`\`\`

## 📦 Installation

\`\`\`bash
npm install ethers
\`\`\`

## 🔧 Network Info

- **Network:** ${deployment.network}
- **Chain ID:** ${deployment.chainId}
- **RPC URL:** https://rpc.sepolia-api.lisk.com
- **Explorer:** https://sepolia-blockscout.lisk.com

## 📝 Contract Addresses

- **CampaignToken:** ${deployment.contracts.CampaignToken}
- **SoulboundMember:** ${deployment.contracts.SoulboundMember}
- **PetitionPlatform:** ${deployment.contracts.PetitionPlatform}

## 🔗 Explorer Links

- [CampaignToken](${deployment.explorerUrls.CampaignToken})
- [SoulboundMember](${deployment.explorerUrls.SoulboundMember})
- [PetitionPlatform](${deployment.explorerUrls.PetitionPlatform})

## 💡 Usage Examples

### Connect Wallet

\`\`\`typescript
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
\`\`\`

### Mint Soulbound Member

\`\`\`typescript
const soulboundMember = new ethers.Contract(
  contractsConfig.contracts.SoulboundMember.address,
  contractsConfig.contracts.SoulboundMember.abi,
  signer
);

const tx = await soulboundMember.mintMembership();
await tx.wait();
\`\`\`

### Create Petition

\`\`\`typescript
const petitionPlatform = new ethers.Contract(
  contractsConfig.contracts.PetitionPlatform.address,
  contractsConfig.contracts.PetitionPlatform.abi,
  signer
);

const tx = await petitionPlatform.createPetition(
  "Petition Title",
  "Petition Description",
  "QmIPFSHash",
  true // useToken
);
await tx.wait();
\`\`\`

### Check Token Balance

\`\`\`typescript
const campaignToken = new ethers.Contract(
  contractsConfig.contracts.CampaignToken.address,
  contractsConfig.contracts.CampaignToken.abi,
  signer
);

const balance = await campaignToken.balanceOf(address);
console.log('Balance:', ethers.formatEther(balance), 'CAMP');
\`\`\`

## 🌐 Add Network to MetaMask

\`\`\`typescript
await window.ethereum.request({
  method: 'wallet_addEthereumChain',
  params: [{
    chainId: '0x106a', // 4202 in hex
    chainName: 'Lisk Sepolia',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['https://rpc.sepolia-api.lisk.com'],
    blockExplorerUrls: ['https://sepolia-blockscout.lisk.com']
  }]
});
\`\`\`

## 📚 Resources

- [Ethers.js Documentation](https://docs.ethers.org/)
- [Lisk Sepolia Faucet](https://sepolia-faucet.lisk.com/)
- [Lisk Documentation](https://docs.lisk.com/)
`;

  fs.writeFileSync(
    path.join(outputDir, "README.md"),
    readme
  );
  console.log("  ✓ README.md created");

  console.log("\n=== ✅ GENERATION COMPLETE ===");
  console.log(`\nFiles created in: ${outputDir}`);
  console.log("\n📁 Generated Files:");
  console.log("  ├── contracts.json (All-in-one config)");
  console.log("  ├── addresses.json (Addresses only)");
  console.log("  ├── CampaignToken.abi.json");
  console.log("  ├── SoulboundMember.abi.json");
  console.log("  ├── PetitionPlatform.abi.json");
  console.log("  ├── example-nextjs.tsx");
  console.log("  ├── example-react.tsx");
  console.log("  └── README.md");
  console.log("\n📖 Check README.md for integration guide!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });