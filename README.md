# Platform Petisi Digital Web3 - Deployment & Integration Guide

## Daftar Isi
1. [Arsitektur Sistem](#arsitektur-sistem)
2. [Persiapan Environment](#persiapan-environment)
3. [Deployment dengan Remix](#deployment-dengan-remix)
4. [Deployment dengan Hardhat](#deployment-dengan-hardhat)
5. [Testing Contract Functions](#testing-contract-functions)
6. [Integrasi Frontend](#integrasi-frontend)
7. [Integrasi Backend](#integrasi-backend)
8. [Troubleshooting](#troubleshooting)

---

## Arsitektur Sistem

### Komponen Utama

**1. SoulboundMember (ERC-721)**
- Token identitas non-transferable
- Satu wallet hanya bisa mint satu kali
- Memberikan 1 CampaignToken gratis saat mint

**2. CampaignToken (ERC-20)**
- Token untuk membuat petisi gratis
- Diberikan sebagai reward setiap 5 petisi berbayar
- Dapat di-burn untuk membuat 1 petisi gratis

**3. PetitionPlatform (ERC-1155)**
- Core logic platform petisi
- Mengelola pembuatan dan penandatanganan petisi
- Sistem boost dengan priority-based ordering

### Alur Kerja Sistem

```
User Register (Mint SBT)
    ↓
Dapat 1 CampaignToken Gratis
    ↓
Buat Petisi (Gratis dengan Token ATAU Bayar 0.002 ETH)
    ↓
User Lain Tanda Tangan Petisi (Creator tidak bisa TTD petisi sendiri)
    ↓
Creator Boost Petisi (Bayar 0.001 ETH untuk 7 hari)
```

---

## Persiapan Environment

### Requirements

**Node.js & Package Manager**
```bash
node --version  # v16.x atau lebih tinggi
npm --version   # v8.x atau lebih tinggi
```

**Hardhat (untuk deployment via script)**
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
```

**Dependencies Smart Contract**
```bash
npm install @openzeppelin/contracts
```

**Lisk Testnet Configuration**
- Network: Lisk Sepolia Testnet
- RPC URL: https://rpc.sepolia-api.lisk.com
- Chain ID: 4202
- Currency: ETH
- Block Explorer: https://sepolia-blockscout.lisk.com

**Wallet Setup**
1. Install MetaMask
2. Tambahkan Lisk Sepolia Testnet ke MetaMask
3. Dapatkan testnet ETH dari faucet: https://sepolia-faucet.lisk.com

**Panna SDK untuk Gasless Transaction**
```bash
npm install @lisk-sdk/client
```

---

## Deployment dengan Remix

### Step 1: Persiapan File Contract

1. Buka Remix IDE: https://remix.ethereum.org
2. Buat folder baru: `petition-platform`
3. Buat 3 file contract:
   - `CampaignToken.sol`
   - `SoulboundMember.sol`
   - `PetitionPlatform.sol`

### Step 2: Compile Contracts

1. Buka tab "Solidity Compiler"
2. Pilih compiler version: `0.8.30`
3. Enable optimization: 200 runs
4. Compile semua contract:
   - Compile `CampaignToken.sol`
   - Compile `SoulboundMember.sol`
   - Compile `PetitionPlatform.sol`

### Step 3: Deploy CampaignToken

1. Buka tab "Deploy & Run Transactions"
2. Pilih Environment: "Injected Provider - MetaMask"
3. Pastikan MetaMask terhubung ke Lisk Sepolia Testnet
4. Pilih contract: `CampaignToken`
5. Klik "Deploy"
6. Konfirmasi transaksi di MetaMask
7. **SIMPAN ADDRESS**: Copy address contract yang baru di-deploy

**Contoh Address**: `0x1234...abcd` (CampaignToken)

### Step 4: Deploy SoulboundMember

1. Pilih contract: `SoulboundMember`
2. Masukkan parameter constructor:
   - `_campaignToken`: [Address CampaignToken dari Step 3]
3. Klik "Deploy"
4. Konfirmasi transaksi di MetaMask
5. **SIMPAN ADDRESS**: Copy address contract yang baru di-deploy

**Contoh Address**: `0x5678...efgh` (SoulboundMember)

### Step 5: Deploy PetitionPlatform

1. Pilih contract: `PetitionPlatform`
2. Masukkan parameter constructor:
   - `_soulboundMember`: [Address SoulboundMember dari Step 4]
   - `_campaignToken`: [Address CampaignToken dari Step 3]
3. Klik "Deploy"
4. Konfirmasi transaksi di MetaMask
5. **SIMPAN ADDRESS**: Copy address contract yang baru di-deploy

**Contoh Address**: `0x9abc...ijkl` (PetitionPlatform)

### Step 6: Setup Contract Connections

**A. Setup CampaignToken**

1. Expand contract `CampaignToken` di Remix
2. Panggil function `setSoulboundMemberContract`:
   - Input: [Address SoulboundMember]
   - Klik "transact"
   - Konfirmasi di MetaMask

3. Panggil function `setPetitionContract`:
   - Input: [Address PetitionPlatform]
   - Klik "transact"
   - Konfirmasi di MetaMask

**B. Setup SoulboundMember**

1. Expand contract `SoulboundMember` di Remix
2. Panggil function `setPetitionContract`:
   - Input: [Address PetitionPlatform]
   - Klik "transact"
   - Konfirmasi di MetaMask

### Step 7: Verifikasi Deployment

Panggil function berikut untuk memastikan setup benar:

**CampaignToken:**
- `petitionContract()` → harus return address PetitionPlatform
- `soulboundMemberContract()` → harus return address SoulboundMember

**SoulboundMember:**
- `petitionContract()` → harus return address PetitionPlatform
- `campaignToken()` → harus return address CampaignToken

**PetitionPlatform:**
- `soulboundMember()` → harus return address SoulboundMember
- `campaignToken()` → harus return address CampaignToken

---

## Deployment dengan Hardhat

### Step 1: Setup Hardhat Project

```bash
mkdir petition-platform
cd petition-platform
npm init -y
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npx hardhat init
```

Pilih: "Create a JavaScript project"

### Step 2: Install Dependencies

```bash
npm install @openzeppelin/contracts
npm install dotenv
```

### Step 3: Konfigurasi Hardhat

Buat file `.env`:

```env
PRIVATE_KEY=your_private_key_here
LISK_SEPOLIA_RPC=https://rpc.sepolia-api.lisk.com
```

Edit `hardhat.config.js`:

```javascript
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.30",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    liskSepolia: {
      url: process.env.LISK_SEPOLIA_RPC,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 4202
    }
  },
  etherscan: {
    apiKey: {
      liskSepolia: "your_blockscout_api_key"
    },
    customChains: [
      {
        network: "liskSepolia",
        chainId: 4202,
        urls: {
          apiURL: "https://sepolia-blockscout.lisk.com/api",
          browserURL: "https://sepolia-blockscout.lisk.com"
        }
      }
    ]
  }
};
```

### Step 4: Copy Contract Files

Copy 3 contract files ke folder `contracts/`:
- `contracts/CampaignToken.sol`
- `contracts/SoulboundMember.sol`
- `contracts/PetitionPlatform.sol`

### Step 5: Buat Deployment Script

Buat file `scripts/deploy.js`:

```javascript
const hre = require("hardhat");

async function main() {
  console.log("Starting deployment...");
  
  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");
  
  // 1. Deploy CampaignToken
  console.log("\n1. Deploying CampaignToken...");
  const CampaignToken = await hre.ethers.getContractFactory("CampaignToken");
  const campaignToken = await CampaignToken.deploy();
  await campaignToken.waitForDeployment();
  const campaignTokenAddress = await campaignToken.getAddress();
  console.log("CampaignToken deployed to:", campaignTokenAddress);
  
  // 2. Deploy SoulboundMember
  console.log("\n2. Deploying SoulboundMember...");
  const SoulboundMember = await hre.ethers.getContractFactory("SoulboundMember");
  const soulboundMember = await SoulboundMember.deploy(campaignTokenAddress);
  await soulboundMember.waitForDeployment();
  const soulboundMemberAddress = await soulboundMember.getAddress();
  console.log("SoulboundMember deployed to:", soulboundMemberAddress);
  
  // 3. Deploy PetitionPlatform
  console.log("\n3. Deploying PetitionPlatform...");
  const PetitionPlatform = await hre.ethers.getContractFactory("PetitionPlatform");
  const petitionPlatform = await PetitionPlatform.deploy(
    soulboundMemberAddress,
    campaignTokenAddress
  );
  await petitionPlatform.waitForDeployment();
  const petitionPlatformAddress = await petitionPlatform.getAddress();
  console.log("PetitionPlatform deployed to:", petitionPlatformAddress);
  
  // 4. Setup connections
  console.log("\n4. Setting up contract connections...");
  
  console.log("Setting SoulboundMember contract in CampaignToken...");
  let tx = await campaignToken.setSoulboundMemberContract(soulboundMemberAddress);
  await tx.wait();
  console.log("Done");
  
  console.log("Setting PetitionPlatform contract in CampaignToken...");
  tx = await campaignToken.setPetitionContract(petitionPlatformAddress);
  await tx.wait();
  console.log("Done");
  
  console.log("Setting PetitionPlatform contract in SoulboundMember...");
  tx = await soulboundMember.setPetitionContract(petitionPlatformAddress);
  await tx.wait();
  console.log("Done");
  
  // 5. Verify setup
  console.log("\n5. Verifying setup...");
  const ctPetitionContract = await campaignToken.petitionContract();
  const ctSoulboundContract = await campaignToken.soulboundMemberContract();
  const sbPetitionContract = await soulboundMember.petitionContract();
  const ppSoulboundMember = await petitionPlatform.soulboundMember();
  const ppCampaignToken = await petitionPlatform.campaignToken();
  
  console.log("\nVerification Results:");
  console.log("CampaignToken.petitionContract:", ctPetitionContract);
  console.log("CampaignToken.soulboundMemberContract:", ctSoulboundContract);
  console.log("SoulboundMember.petitionContract:", sbPetitionContract);
  console.log("PetitionPlatform.soulboundMember:", ppSoulboundMember);
  console.log("PetitionPlatform.campaignToken:", ppCampaignToken);
  
  // 6. Save deployment info
  console.log("\n6. Saving deployment info...");
  const deploymentInfo = {
    network: "liskSepolia",
    chainId: 4202,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      CampaignToken: campaignTokenAddress,
      SoulboundMember: soulboundMemberAddress,
      PetitionPlatform: petitionPlatformAddress
    }
  };
  
  const fs = require('fs');
  fs.writeFileSync(
    'deployment-info.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("Deployment info saved to deployment-info.json");
  
  console.log("\n=== DEPLOYMENT COMPLETE ===");
  console.log("\nContract Addresses:");
  console.log("CampaignToken:", campaignTokenAddress);
  console.log("SoulboundMember:", soulboundMemberAddress);
  console.log("PetitionPlatform:", petitionPlatformAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### Step 6: Compile & Deploy

```bash
# Compile contracts
npx hardhat compile

# Deploy to Lisk Sepolia
npx hardhat run scripts/deploy.js --network liskSepolia
```

### Step 7: Verify Contracts (Optional)

```bash
npx hardhat verify --network liskSepolia CAMPAIGN_TOKEN_ADDRESS

npx hardhat verify --network liskSepolia SOULBOUND_MEMBER_ADDRESS "CAMPAIGN_TOKEN_ADDRESS"

npx hardhat verify --network liskSepolia PETITION_PLATFORM_ADDRESS "SOULBOUND_MEMBER_ADDRESS" "CAMPAIGN_TOKEN_ADDRESS"
```

---

## Testing Contract Functions

### Setup Testing Environment

Buat file `scripts/test-functions.js`:

```javascript
const hre = require("hardhat");

async function main() {
  // Load deployment info
  const fs = require('fs');
  const deploymentInfo = JSON.parse(fs.readFileSync('deployment-info.json', 'utf8'));
  
  const [deployer, user1, user2] = await hre.ethers.getSigners();
  
  console.log("Testing with accounts:");
  console.log("Deployer:", deployer.address);
  console.log("User1:", user1.address);
  console.log("User2:", user2.address);
  
  // Get contract instances
  const campaignToken = await hre.ethers.getContractAt(
    "CampaignToken",
    deploymentInfo.contracts.CampaignToken
  );
  
  const soulboundMember = await hre.ethers.getContractAt(
    "SoulboundMember",
    deploymentInfo.contracts.SoulboundMember
  );
  
  const petitionPlatform = await hre.ethers.getContractAt(
    "PetitionPlatform",
    deploymentInfo.contracts.PetitionPlatform
  );
  
  // Test 1: Mint SBT for User1
  console.log("\n=== TEST 1: Mint Soulbound Member (User1) ===");
  let tx = await soulboundMember.connect(user1).mintMembership();
  await tx.wait();
  console.log("User1 minted SBT successfully");
  
  let isMember = await soulboundMember.isMember(user1.address);
  console.log("User1 is member:", isMember);
  
  let tokenBalance = await campaignToken.balanceOf(user1.address);
  console.log("User1 CampaignToken balance:", hre.ethers.formatEther(tokenBalance));
  
  // Test 2: Mint SBT for User2
  console.log("\n=== TEST 2: Mint Soulbound Member (User2) ===");
  tx = await soulboundMember.connect(user2).mintMembership();
  await tx.wait();
  console.log("User2 minted SBT successfully");
  
  // Test 3: Create Petition (Free with Token)
  console.log("\n=== TEST 3: Create Petition with CampaignToken (User1) ===");
  tx = await petitionPlatform.connect(user1).createPetition(
    "Stop Deforestation",
    "We need to protect our forests for future generations",
    "QmXxxx...ipfsHash"
  );
  let receipt = await tx.wait();
  console.log("Petition created successfully");
  
  let totalPetitions = await petitionPlatform.getTotalPetitions();
  console.log("Total petitions:", totalPetitions.toString());
  
  let petition = await petitionPlatform.getPetition(0);
  console.log("Petition details:", {
    id: petition.id.toString(),
    title: petition.title,
    creator: petition.creator,
    signatureCount: petition.signatureCount.toString()
  });
  
  // Test 4: Create Petition (Paid with ETH)
  console.log("\n=== TEST 4: Create Petition with ETH Payment (User1) ===");
  const baseFee = await petitionPlatform.baseCampaignFee();
  tx = await petitionPlatform.connect(user1).createPetition(
    "Clean Water Initiative",
    "Ensure access to clean water for all communities",
    "QmYyyy...ipfsHash",
    { value: baseFee }
  );
  await tx.wait();
  console.log("Paid petition created successfully");
  
  // Test 5: Sign Petition (User2 signs User1's petition)
  console.log("\n=== TEST 5: Sign Petition (User2 signs petition #0) ===");
  tx = await petitionPlatform.connect(user2).signPetition(0);
  await tx.wait();
  console.log("User2 signed petition successfully");
  
  petition = await petitionPlatform.getPetition(0);
  console.log("Updated signature count:", petition.signatureCount.toString());
  
  let hasSigned = await petitionPlatform.hasUserSigned(0, user2.address);
  console.log("User2 has signed:", hasSigned);
  
  // Test 6: Try to sign own petition (should fail)
  console.log("\n=== TEST 6: Try to Sign Own Petition (Should Fail) ===");
  try {
    tx = await petitionPlatform.connect(user1).signPetition(0);
    await tx.wait();
    console.log("ERROR: Should have failed!");
  } catch (error) {
    console.log("Correctly prevented creator from signing own petition");
  }
  
  // Test 7: Boost Petition
  console.log("\n=== TEST 7: Boost Petition (User1 boosts petition #0) ===");
  const boostFee = await petitionPlatform.boostingFee();
  tx = await petitionPlatform.connect(user1).boostPetition(0, { value: boostFee });
  await tx.wait();
  console.log("Petition boosted successfully");
  
  petition = await petitionPlatform.getPetition(0);
  console.log("Boost details:", {
    boostEndTime: new Date(Number(petition.boostEndTime) * 1000).toISOString(),
    boostPriority: petition.boostPriority.toString()
  });
  
  let isBoosted = await petitionPlatform.isPetitionBoosted(0);
  console.log("Is petition boosted:", isBoosted);
  
  // Test 8: Get All Petitions
  console.log("\n=== TEST 8: Get All Petitions ===");
  let allPetitions = await petitionPlatform.getAllPetitions();
  console.log("Total petitions:", allPetitions.length);
  allPetitions.forEach((p, index) => {
    console.log(`Petition ${index}:`, {
      title: p.title,
      creator: p.creator,
      signatures: p.signatureCount.toString(),
      boosted: p.boostEndTime > 0n
    });
  });
  
  // Test 9: Get Active Boosted Petitions
  console.log("\n=== TEST 9: Get Active Boosted Petitions ===");
  let boostedPetitions = await petitionPlatform.getActiveBoostedPetitions();
  console.log("Active boosted petitions:", boostedPetitions.length);
  
  console.log("\n=== ALL TESTS COMPLETED ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### Run Tests

```bash
npx hardhat run scripts/test-functions.js --network liskSepolia
```

---

## Integrasi Frontend

### Setup Web3 Connection

**Install Dependencies:**

```bash
npm install ethers wagmi viem @tanstack/react-query
```

### Configuration File

Buat file `src/config/contracts.js`:

```javascript
export const CONTRACTS = {
  CampaignToken: {
    address: "YOUR_CAMPAIGN_TOKEN_ADDRESS",
    abi: [/* ABI dari compiled contract */]
  },
  SoulboundMember: {
    address: "YOUR_SOULBOUND_MEMBER_ADDRESS",
    abi: [/* ABI dari compiled contract */]
  },
  PetitionPlatform: {
    address: "YOUR_PETITION_PLATFORM_ADDRESS",
    abi: [/* ABI dari compiled contract */]
  }
};

export const LISK_SEPOLIA = {
  id: 4202,
  name: "Lisk Sepolia",
  network: "lisk-sepolia",
  nativeCurrency: {
    decimals: 18,
    name: "Ethereum",
    symbol: "ETH"
  },
  rpcUrls: {
    default: { http: ["https://rpc.sepolia-api.lisk.com"] },
    public: { http: ["https://rpc.sepolia-api.lisk.com"] }
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://sepolia-blockscout.lisk.com"
    }
  },
  testnet: true
};
```

### React Hooks untuk Contract Interaction

**1. Hook untuk Mint SBT:**

```javascript
// hooks/useMintSBT.js
import { useContractWrite, useWaitForTransaction } from 'wagmi';
import { CONTRACTS } from '../config/contracts';

export function useMintSBT() {
  const { write, data, isLoading, error } = useContractWrite({
    address: CONTRACTS.SoulboundMember.address,
    abi: CONTRACTS.SoulboundMember.abi,
    functionName: 'mintMembership'
  });
  
  const { isLoading: isWaiting, isSuccess } = useWaitForTransaction({
    hash: data?.hash
  });
  
  return {
    mintSBT: write,
    isLoading: isLoading || isWaiting,
    isSuccess,
    error
  };
}
```

**2. Hook untuk Check Membership:**

```javascript
// hooks/useIsMember.js
import { useContractRead } from 'wagmi';
import { CONTRACTS } from '../config/contracts';

export function useIsMember(address) {
  const { data, isLoading, error } = useContractRead({
    address: CONTRACTS.SoulboundMember.address,
    abi: CONTRACTS.SoulboundMember.abi,
    functionName: 'isMember',
    args: [address],
    watch: true
  });
  
  return {
    isMember: data || false,
    isLoading,
    error
  };
}
```

**3. Hook untuk Create Petition:**

```javascript
// hooks/useCreatePetition.js
import { useContractWrite, useWaitForTransaction, useContractRead } from 'wagmi';
import { parseEther } from 'viem';
import { CONTRACTS } from '../config/contracts';

export function useCreatePetition() {
  // Check user's token balance
  const { data: tokenBalance } = useContractRead({
    address: CONTRACTS.CampaignToken.address,
    abi: CONTRACTS.CampaignToken.abi,
    functionName: 'balanceOf',
    args: [address]
  });
  
  const hasToken = tokenBalance && tokenBalance >= parseEther('1');
  
  const { write, data, isLoading, error } = useContractWrite({
    address: CONTRACTS.PetitionPlatform.address,
    abi: CONTRACTS.PetitionPlatform.abi,
    functionName: 'createPetition'
  });
  
  const { isLoading: isWaiting, isSuccess } = useWaitForTransaction({
    hash: data?.hash
  });
  
  const createPetition = async (title, description, imageHash) => {
    const baseFee = await readContract({
      address: CONTRACTS.PetitionPlatform.address,
      abi: CONTRACTS.PetitionPlatform.abi,
      functionName: 'baseCampaignFee'
    });
    
    write({
      args: [title, description, imageHash],
      value: hasToken ? 0n : baseFee
    });
  };
  
  return {
    createPetition,
    hasToken,
    isLoading: isLoading || isWaiting,
    isSuccess,
    error
  };
}
```

**4. Hook untuk Sign Petition:**

```javascript
// hooks/useSignPetition.js
import { useContractWrite, useWaitForTransaction } from 'wagmi';
import { CONTRACTS } from '../config/contracts';

export function useSignPetition() {
  const { write, data, isLoading, error } = useContractWrite({
    address: CONTRACTS.PetitionPlatform.address,
    abi: CONTRACTS.PetitionPlatform.abi,
    functionName: 'signPetition'
  });
  
  const { isLoading: isWaiting, isSuccess } = useWaitForTransaction({
    hash: data?.hash
  });
  
  const signPetition = (petitionId) => {
    write({
      args: [petitionId]
    });
  };
  
  return {
    signPetition,
    isLoading: isLoading || isWaiting,
    isSuccess,
    error
  };
}
```

**5. Hook untuk Boost Petition:**

```javascript
// hooks/useBoostPetition.js
import { useContractWrite, useWaitForTransaction } from 'wagmi';
import { parseEther } from 'viem';
import { CONTRACTS } from '../config/contracts';

export function useBoostPetition() {
  const { write, data, isLoading, error } = useContractWrite({
    address: CONTRACTS.PetitionPlatform.address,
    abi: CONTRACTS.PetitionPlatform.abi,
    functionName: 'boostPetition'
  });
  
  const { isLoading: isWaiting, isSuccess } = useWaitForTransaction({
    hash: data?.hash
  });
  
  const boostPetition = (petitionId) => {
    write({
      args: [petitionId],
      value: parseEther('0.001')
    });
  };
  
  return {
    boostPetition,
    isLoading: isLoading || isWaiting,
    isSuccess,
    error
  };
}
```

**6. Hook untuk Get All Petitions:**

```javascript
// hooks/usePetitions.js
import { useContractRead } from 'wagmi';
import { CONTRACTS } from '../config/contracts';

export function usePetitions() {
  const { data, isLoading, error, refetch } = useContractRead({
    address: CONTRACTS.PetitionPlatform.address,
    abi: CONTRACTS.PetitionPlatform.abi,
    functionName: 'getAllPetitions',
    watch: true
  });
  
  // Sort petitions: boosted first (by priority DESC), then by createdAt ASC
  const sortedPetitions = data ? [...data].sort((a, b) => {
    const now = Math.floor(Date.now() / 1000);
    const aIsBoosted = Number(a.boostEndTime) > now;
    const bIsBoosted = Number(b.boostEndTime) > now;
    
    if (aIsBoosted && bIsBoosted) {
      return Number(b.boostPriority) - Number(a.boostPriority);
    }
    if (aIsBoosted) return -1;
    if (bIsBoosted) return 1;
    
    return Number(a.createdAt) - Number(b.createdAt);
  }) : [];
  
  return {
    petitions: sortedPetitions,
    isLoading,
    error,
    refetch
  };
}
```

### Component Examples

**Component: Register Page**

```jsx
// pages/Register.jsx
import { useMintSBT } from '../hooks/useMintSBT';
import { useIsMember } from '../hooks/useIsMember';
import { useAccount } from 'wagmi';

export function Register() {
  const { address } = useAccount();
  const { isMember, isLoading: checkingMember } = useIsMember(address);
  const { mintSBT, isLoading, isSuccess, error } = useMintSBT();
  
  if (checkingMember) return <div>Checking membership...</div>;
  if (isMember) return <div>You are already a member!</div>;
  
  return (
    <div>
      <h1>Register as Member</h1>
      <p>Mint your Soulbound Token to become a member</p>
      <p>You will receive 1 free CampaignToken for creating your first petition</p>
      
      <button 
        onClick={() => mintSBT()}
        disabled={isLoading}
      >
        {isLoading ? 'Minting...' : 'Mint Soulbound Token'}
      </button>
      
      {isSuccess && <p>Successfully minted! You are now a member.</p>}
      {error && <p>Error: {error.message}</p>}
    </div>
  );
}
```

**Component: Create Petition Page**

```jsx
// pages/CreatePetition.jsx
import { useState } from 'react';
import { useCreatePetition } from '../hooks/useCreatePetition';
import { useIsMember } from '../hooks/useIsMember';
import { useAccount } from 'wagmi';

export function CreatePetition() {
  const { address } = useAccount();
  const { isMember } = useIsMember(address);
  const { createPetition, hasToken, isLoading, isSuccess, error } = useCreatePetition();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageHash: ''
  });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    await createPetition(
      formData.title,
      formData.description,
      formData.imageHash
    );
  };
  
  if (!isMember) {
    return <div>You need to be a member to create petitions</div>;
  }
  
  return (
    <div>
      <h1>Create Petition</h1>
      
      {hasToken ? (
        <p>You have a free CampaignToken. This petition will be FREE!</p>
      ) : (
        <p>Cost: 0.002 ETH + gas fees</p>
      )}
      
      <form onSubmit={handleSubmit}>
        <div>
          <label>Title:</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required
          />
        </div>
        
        <div>
          <label>Description:</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            required
          />
        </div>
        
        <div>
          <label>Image IPFS Hash:</label>
          <input
            type="text"
            value={formData.imageHash}
            onChange={(e) => setFormData({...formData, imageHash: e.target.value})}
            placeholder="QmXxxx..."
            required
          />
        </div>
        
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Petition'}
        </button>
      </form>
      
      {isSuccess && <p>Petition created successfully!</p>}
      {error && <p>Error: {error.message}</p>}
    </div>
  );
}
```

**Component: Petition List**

```jsx
// components/PetitionList.jsx
import { usePetitions } from '../hooks/usePetitions';
import { PetitionCard } from './PetitionCard';

export function PetitionList() {
  const { petitions, isLoading, error } = usePetitions();
  
  if (isLoading) return <div>Loading petitions...</div>;
  if (error) return <div>Error loading petitions: {error.message}</div>;
  if (!petitions || petitions.length === 0) return <div>No petitions yet</div>;
  
  return (
    <div>
      <h2>All Petitions</h2>
      <div className="petition-grid">
        {petitions.map((petition) => (
          <PetitionCard 
            key={petition.id.toString()} 
            petition={petition} 
          />
        ))}
      </div>
    </div>
  );
}
```

**Component: Petition Card**

```jsx
// components/PetitionCard.jsx
import { useSignPetition } from '../hooks/useSignPetition';
import { useBoostPetition } from '../hooks/useBoostPetition';
import { useAccount } from 'wagmi';
import { useContractRead } from 'wagmi';
import { CONTRACTS } from '../config/contracts';

export function PetitionCard({ petition }) {
  const { address } = useAccount();
  const { signPetition, isLoading: isSigning } = useSignPetition();
  const { boostPetition, isLoading: isBoosting } = useBoostPetition();
  
  // Check if user has signed
  const { data: hasSigned } = useContractRead({
    address: CONTRACTS.PetitionPlatform.address,
    abi: CONTRACTS.PetitionPlatform.abi,
    functionName: 'hasUserSigned',
    args: [petition.id, address]
  });
  
  const isCreator = petition.creator.toLowerCase() === address?.toLowerCase();
  const now = Math.floor(Date.now() / 1000);
  const isBoosted = Number(petition.boostEndTime) > now;
  const boostEndDate = isBoosted 
    ? new Date(Number(petition.boostEndTime) * 1000).toLocaleString()
    : null;
  
  return (
    <div className={`petition-card ${isBoosted ? 'boosted' : ''}`}>
      {isBoosted && (
        <div className="boost-badge">
          BOOSTED until {boostEndDate}
        </div>
      )}
      
      <img 
        src={`https://gateway.pinata.cloud/ipfs/${petition.imageHash}`} 
        alt={petition.title}
      />
      
      <h3>{petition.title}</h3>
      <p>{petition.description}</p>
      
      <div className="petition-meta">
        <p>Creator: {petition.creator.slice(0, 6)}...{petition.creator.slice(-4)}</p>
        <p>Signatures: {petition.signatureCount.toString()}</p>
        <p>Created: {new Date(Number(petition.createdAt) * 1000).toLocaleDateString()}</p>
      </div>
      
      <div className="petition-actions">
        {!isCreator && !hasSigned && (
          <button 
            onClick={() => signPetition(petition.id)}
            disabled={isSigning}
          >
            {isSigning ? 'Signing...' : 'Sign Petition'}
          </button>
        )}
        
        {isCreator && !isBoosted && (
          <button 
            onClick={() => boostPetition(petition.id)}
            disabled={isBoosting}
          >
            {isBoosting ? 'Boosting...' : 'Boost (0.001 ETH)'}
          </button>
        )}
        
        {hasSigned && <p className="signed-badge">You signed this</p>}
        {isCreator && <p className="creator-badge">Your petition</p>}
      </div>
    </div>
  );
}
```

### Upload Image ke Pinata (IPFS)

**Setup Pinata:**

```bash
npm install pinata-web3
```

**Upload Function:**

```javascript
// utils/pinata.js
import { PinataSDK } from "pinata-web3";

const pinata = new PinataSDK({
  pinataJwt: process.env.REACT_APP_PINATA_JWT,
  pinataGateway: process.env.REACT_APP_PINATA_GATEWAY
});

export async function uploadImageToPinata(file) {
  try {
    const upload = await pinata.upload.file(file);
    return upload.IpfsHash;
  } catch (error) {
    console.error("Error uploading to Pinata:", error);
    throw error;
  }
}
```

**Usage in Component:**

```jsx
// In CreatePetition component
const [imageFile, setImageFile] = useState(null);
const [uploading, setUploading] = useState(false);

const handleImageUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  setUploading(true);
  try {
    const ipfsHash = await uploadImageToPinata(file);
    setFormData({...formData, imageHash: ipfsHash});
  } catch (error) {
    alert('Error uploading image');
  } finally {
    setUploading(false);
  }
};

// In the form
<input 
  type="file" 
  accept="image/*"
  onChange={handleImageUpload}
  disabled={uploading}
/>
{uploading && <p>Uploading image...</p>}
```

---

## Integrasi Backend

### Setup Express.js Server

**Install Dependencies:**

```bash
npm install express cors dotenv ethers
```

**Server Configuration:**

```javascript
// server.js
const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Setup provider
const provider = new ethers.JsonRpcProvider(process.env.LISK_SEPOLIA_RPC);

// Contract ABIs and addresses
const CONTRACTS = {
  SoulboundMember: {
    address: process.env.SOULBOUND_MEMBER_ADDRESS,
    abi: require('./abis/SoulboundMember.json')
  },
  PetitionPlatform: {
    address: process.env.PETITION_PLATFORM_ADDRESS,
    abi: require('./abis/PetitionPlatform.json')
  }
};

// Get contract instances
const soulboundMember = new ethers.Contract(
  CONTRACTS.SoulboundMember.address,
  CONTRACTS.SoulboundMember.abi,
  provider
);

const petitionPlatform = new ethers.Contract(
  CONTRACTS.PetitionPlatform.address,
  CONTRACTS.PetitionPlatform.abi,
  provider
);

// API Routes

// Check if address is member
app.get('/api/member/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const isMember = await soulboundMember.isMember(address);
    res.json({ isMember });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all petitions
app.get('/api/petitions', async (req, res) => {
  try {
    const petitions = await petitionPlatform.getAllPetitions();
    
    // Format petitions
    const formattedPetitions = petitions.map(p => ({
      id: p.id.toString(),
      title: p.title,
      description: p.description,
      imageHash: p.imageHash,
      creator: p.creator,
      createdAt: Number(p.createdAt),
      boostEndTime: Number(p.boostEndTime),
      boostPriority: Number(p.boostPriority),
      signatureCount: Number(p.signatureCount)
    }));
    
    // Sort petitions
    const now = Math.floor(Date.now() / 1000);
    const sorted = formattedPetitions.sort((a, b) => {
      const aIsBoosted = a.boostEndTime > now;
      const bIsBoosted = b.boostEndTime > now;
      
      if (aIsBoosted && bIsBoosted) {
        return b.boostPriority - a.boostPriority;
      }
      if (aIsBoosted) return -1;
      if (bIsBoosted) return 1;
      
      return a.createdAt - b.createdAt;
    });
    
    res.json({ petitions: sorted });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single petition
app.get('/api/petitions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const petition = await petitionPlatform.getPetition(id);
    
    res.json({
      id: petition.id.toString(),
      title: petition.title,
      description: petition.description,
      imageHash: petition.imageHash,
      creator: petition.creator,
      createdAt: Number(petition.createdAt),
      boostEndTime: Number(petition.boostEndTime),
      boostPriority: Number(petition.boostPriority),
      signatureCount: Number(petition.signatureCount)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check if user signed petition
app.get('/api/petitions/:id/signed/:address', async (req, res) => {
  try {
    const { id, address } = req.params;
    const hasSigned = await petitionPlatform.hasUserSigned(id, address);
    res.json({ hasSigned });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get active boosted petitions
app.get('/api/petitions/boosted/active', async (req, res) => {
  try {
    const petitions = await petitionPlatform.getActiveBoostedPetitions();
    
    const formattedPetitions = petitions.map(p => ({
      id: p.id.toString(),
      title: p.title,
      description: p.description,
      imageHash: p.imageHash,
      creator: p.creator,
      createdAt: Number(p.createdAt),
      boostEndTime: Number(p.boostEndTime),
      boostPriority: Number(p.boostPriority),
      signatureCount: Number(p.signatureCount)
    }));
    
    // Sort by boostPriority DESC
    const sorted = formattedPetitions.sort((a, b) => b.boostPriority - a.boostPriority);
    
    res.json({ petitions: sorted });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get petition stats
app.get('/api/stats', async (req, res) => {
  try {
    const totalPetitions = await petitionPlatform.getTotalPetitions();
    const totalMembers = await soulboundMember.totalSupply();
    
    res.json({
      totalPetitions: Number(totalPetitions),
      totalMembers: Number(totalMembers)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Listen to events
async function setupEventListeners() {
  // Listen to new petitions
  petitionPlatform.on('PetitionCreated', (petitionId, creator, title, imageHash, usedToken, feePaid, createdAt) => {
    console.log('New petition created:', {
      petitionId: petitionId.toString(),
      creator,
      title,
      usedToken,
      feePaid: ethers.formatEther(feePaid)
    });
  });
  
  // Listen to signatures
  petitionPlatform.on('PetitionSigned', (petitionId, signer, newSignatureCount) => {
    console.log('Petition signed:', {
      petitionId: petitionId.toString(),
      signer,
      newSignatureCount: newSignatureCount.toString()
    });
  });
  
  // Listen to boosts
  petitionPlatform.on('PetitionBoosted', (petitionId, booster, boostEndTime, boostPriority) => {
    console.log('Petition boosted:', {
      petitionId: petitionId.toString(),
      booster,
      boostEndTime: new Date(Number(boostEndTime) * 1000).toISOString(),
      boostPriority: boostPriority.toString()
    });
  });
  
  console.log('Event listeners setup complete');
}

setupEventListeners();

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Database Integration (Optional)

**Setup MongoDB:**

```bash
npm install mongoose
```

**Schema Definition:**

```javascript
// models/Petition.js
const mongoose = require('mongoose');

const PetitionSchema = new mongoose.Schema({
  petitionId: {
    type: Number,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  imageHash: {
    type: String,
    required: true
  },
  creator: {
    type: String,
    required: true
  },
  createdAt: {
    type: Number,
    required: true
  },
  boostEndTime: {
    type: Number,
    default: 0
  },
  boostPriority: {
    type: Number,
    default: 0
  },
  signatureCount: {
    type: Number,
    default: 0
  },
  signatures: [{
    signer: String,
    signedAt: Number
  }],
  transactionHash: String
});

module.exports = mongoose.model('Petition', PetitionSchema);
```

**Indexer Service:**

```javascript
// services/indexer.js
const { ethers } = require('ethers');
const Petition = require('../models/Petition');

class BlockchainIndexer {
  constructor(provider, petitionPlatformContract) {
    this.provider = provider;
    this.contract = petitionPlatformContract;
  }
  
  async indexPetitionCreated(petitionId, creator, title, imageHash, usedToken, feePaid, createdAt, txHash) {
    try {
      const petition = new Petition({
        petitionId: Number(petitionId),
        title,
        description: '', // Will be fetched from contract
        imageHash,
        creator,
        createdAt: Number(createdAt),
        transactionHash: txHash
      });
      
      // Fetch full details from contract
      const fullDetails = await this.contract.getPetition(petitionId);
      petition.description = fullDetails.description;
      
      await petition.save();
      console.log(`Indexed petition ${petitionId}`);
    } catch (error) {
      console.error('Error indexing petition:', error);
    }
  }
  
  async indexPetitionSigned(petitionId, signer, newSignatureCount, txHash) {
    try {
      const petition = await Petition.findOne({ petitionId: Number(petitionId) });
      if (petition) {
        petition.signatureCount = Number(newSignatureCount);
        petition.signatures.push({
          signer,
          signedAt: Math.floor(Date.now() / 1000)
        });
        await petition.save();
        console.log(`Indexed signature for petition ${petitionId}`);
      }
    } catch (error) {
      console.error('Error indexing signature:', error);
    }
  }
  
  async indexPetitionBoosted(petitionId, booster, boostEndTime, boostPriority, txHash) {
    try {
      const petition = await Petition.findOne({ petitionId: Number(petitionId) });
      if (petition) {
        petition.boostEndTime = Number(boostEndTime);
        petition.boostPriority = Number(boostPriority);
        await petition.save();
        console.log(`Indexed boost for petition ${petitionId}`);
      }
    } catch (error) {
      console.error('Error indexing boost:', error);
    }
  }
  
  async startIndexing() {
    console.log('Starting blockchain indexer...');
    
    // Listen to new events
    this.contract.on('PetitionCreated', async (petitionId, creator, title, imageHash, usedToken, feePaid, createdAt, event) => {
      await this.indexPetitionCreated(petitionId, creator, title, imageHash, usedToken, feePaid, createdAt, event.transactionHash);
    });
    
    this.contract.on('PetitionSigned', async (petitionId, signer, newSignatureCount, event) => {
      await this.indexPetitionSigned(petitionId, signer, newSignatureCount, event.transactionHash);
    });
    
    this.contract.on('PetitionBoosted', async (petitionId, booster, boostEndTime, boostPriority, event) => {
      await this.indexPetitionBoosted(petitionId, booster, boostEndTime, boostPriority, event.transactionHash);
    });
    
    console.log('Indexer is listening to events');
  }
  
  async indexHistoricalData(fromBlock = 0) {
    console.log('Indexing historical data...');
    
    const filter = this.contract.filters.PetitionCreated();
    const events = await this.contract.queryFilter(filter, fromBlock);
    
    for (const event of events) {
      await this.indexPetitionCreated(
        event.args.petitionId,
        event.args.creator,
        event.args.title,
        event.args.imageHash,
        event.args.usedToken,
        event.args.feePaid,
        event.args.createdAt,
        event.transactionHash
      );
    }
    
    console.log(`Indexed ${events.length} historical petitions`);
  }
}

module.exports = BlockchainIndexer;
```

---

## Troubleshooting

### Common Issues

**1. Transaction Reverted: Not a member**

**Penyebab:** User belum mint Soulbound Token

**Solusi:**
```javascript
// Check membership before any action
const isMember = await soulboundMember.isMember(userAddress);
if (!isMember) {
  alert('You need to mint Soulbound Token first');
  return;
}
```

**2. Transaction Reverted: Already minted**

**Penyebab:** User sudah pernah mint SBT sebelumnya

**Solusi:**
```javascript
// Check before minting
const hasMinted = await soulboundMember.hasMinted(userAddress);
if (hasMinted) {
  alert('You have already minted your Soulbound Token');
  return;
}
```

**3. Transaction Reverted: Creator cannot sign own petition**

**Penyebab:** Creator mencoba tanda tangan petisi sendiri

**Solusi:**
```javascript
// Check if user is creator
const petition = await petitionPlatform.getPetition(petitionId);
if (petition.creator.toLowerCase() === userAddress.toLowerCase()) {
  alert('You cannot sign your own petition');
  return;
}
```

**4. Transaction Reverted: Already signed**

**Penyebab:** User sudah tanda tangan petisi tersebut

**Solusi:**
```javascript
// Check before signing
const hasSigned = await petitionPlatform.hasUserSigned(petitionId, userAddress);
if (hasSigned) {
  alert('You have already signed this petition');
  return;
}
```

**5. Transaction Reverted: Insufficient fee**

**Penyebab:** Value ETH yang dikirim kurang dari baseCampaignFee atau boostingFee

**Solusi:**
```javascript
// Get correct fee amount
const baseFee = await petitionPlatform.baseCampaignFee();
// Send exact amount or more
await petitionPlatform.createPetition(title, description, imageHash, { value: baseFee });
```

**6. SBT Transfer Failed**

**Penyebab:** User mencoba transfer SBT (token non-transferable)

**Solusi:** SBT tidak bisa ditransfer. Ini adalah expected behavior. Informasikan user bahwa token ini permanent dan tidak bisa dijual/transfer.

**7. Gasless Transaction Failed (Panna SDK)**

**Penyebab:** Konfigurasi Panna SDK tidak tepat

**Solusi:**
```javascript
// Setup Panna SDK properly
import { createPannaClient } from '@lisk-sdk/client';

const pannaClient = createPannaClient({
  network: 'lisk-sepolia',
  apiKey: process.env.PANNA_API_KEY
});

// Use Panna for gasless transactions
await pannaClient.sendTransaction({
  to: contractAddress,
  data: encodedFunctionCall
});
```

**8. Image Not Loading from IPFS**

**Penyebab:** IPFS hash salah atau gateway tidak responsif

**Solusi:**
```javascript
// Use multiple gateways
const gateways = [
  'https://gateway.pinata.cloud/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/'
];

function getImageUrl(ipfsHash, gatewayIndex = 0) {
  return `${gateways[gatewayIndex]}${ipfsHash}`;
}

// Fallback to next gateway on error
<img 
  src={getImageUrl(petition.imageHash)}
  onError={(e) => {
    e.target.src = getImageUrl(petition.imageHash, 1);
  }}
  alt={petition.title}
/>
```

### Network Issues

**MetaMask Network Not Detected:**

```javascript
// Add Lisk Sepolia programmatically
async function addLiskSepoliaNetwork() {
  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: '0x106A', // 4202 in hex
        chainName: 'Lisk Sepolia',
        nativeCurrency: {
          name: 'Ethereum',
          symbol: 'ETH',
          decimals: 18
        },
        rpcUrls: ['https://rpc.sepolia-api.lisk.com'],
        blockExplorerUrls: ['https://sepolia-blockscout.lisk.com']
      }]
    });
  } catch (error) {
    console.error('Error adding network:', error);
  }
}
```

### Contract Verification Issues

**Blockscout Verification Failed:**

Jika verifikasi otomatis gagal, lakukan manual verification:

1. Buka Blockscout: https://sepolia-blockscout.lisk.com
2. Cari contract address
3. Klik tab "Code"
4. Klik "Verify & Publish"
5. Pilih compiler version: 0.8.30
6. Pilih optimization: Yes, 200 runs
7. Paste source code
8. Submit

### Gas Estimation Failed

```javascript
// Manual gas limit
const tx = await contract.functionName(args, {
  gasLimit: 500000 // Set manual gas limit
});
```

### Event Listening Issues

```javascript
// Use polling instead of WebSocket if events not received
const provider = new ethers.JsonRpcProvider(
  'https://rpc.sepolia-api.lisk.com',
  {
    polling: true,
    pollingInterval: 4000 // 4 seconds
  }
);
```

---

## Testing Checklist

### Pre-Deployment Testing

- [ ] Compile all contracts without errors
- [ ] Run Hardhat tests for all functions
- [ ] Test on local hardhat network
- [ ] Verify constructor parameters
- [ ] Check all require statements
- [ ] Test edge cases

### Post-Deployment Testing

- [ ] Verify all contract addresses saved
- [ ] Test SBT minting
- [ ] Verify CampaignToken received after SBT mint
- [ ] Test petition creation with token (free)
- [ ] Test petition creation with ETH
- [ ] Test signature functionality
- [ ] Verify creator cannot sign own petition
- [ ] Test boost functionality
- [ ] Verify boost priority system
- [ ] Test multiple users interaction
- [ ] Check event emissions
- [ ] Verify contract connections

### Frontend Testing

- [ ] Wallet connection works
- [ ] Network switching works
- [ ] SBT minting UI works
- [ ] Petition creation form works
- [ ] Image upload to IPFS works
- [ ] Petition list displays correctly
- [ ] Sorting by boost priority works
- [ ] Signature button works
- [ ] Boost button works (creator only)
- [ ] Transaction pending states
- [ ] Success/error messages
- [ ] Responsive design

### Backend Testing (if applicable)

- [ ] API endpoints respond correctly
- [ ] Event listeners working
- [ ] Database indexing works
- [ ] Historical data sync
- [ ] Error handling
- [ ] Rate limiting
- [ ] CORS configuration

---

## Performance Optimization

### Frontend Optimization

**1. Caching Contract Calls:**

```javascript
import { useQuery } from '@tanstack/react-query';

function usePetitionData(petitionId) {
  return useQuery({
    queryKey: ['petition', petitionId],
    queryFn: () => getPetition(petitionId),
    staleTime: 30000, // 30 seconds
    cacheTime: 300000 // 5 minutes
  });
}
```

**2. Batch Contract Calls:**

```javascript
import { multicall } from '@wagmi/core';

async function batchGetPetitions(ids) {
  const calls = ids.map(id => ({
    address: CONTRACTS.PetitionPlatform.address,
    abi: CONTRACTS.PetitionPlatform.abi,
    functionName: 'getPetition',
    args: [id]
  }));
  
  return await multicall({ contracts: calls });
}
```

**3. Lazy Loading:**

```javascript
// Lazy load components
const CreatePetition = lazy(() => import('./pages/CreatePetition'));
const PetitionDetail = lazy(() => import('./pages/PetitionDetail'));
```

### Backend Optimization

**1. Redis Caching:**

```javascript
const redis = require('redis');
const client = redis.createClient();

async function getCachedPetitions() {
  const cached = await client.get('petitions:all');
  if (cached) return JSON.parse(cached);
  
  const petitions = await fetchPetitionsFromBlockchain();
  await client.setEx('petitions:all', 60, JSON.stringify(petitions));
  return petitions;
}
```

**2. Database Indexing:**

```javascript
// In MongoDB schema
PetitionSchema.index({ petitionId: 1 });
PetitionSchema.index({ creator: 1 });
PetitionSchema.index({ boostEndTime: -1 });
PetitionSchema.index({ boostPriority: -1 });
```

---

## Security Best Practices

### Smart Contract Security

1. **Access Control:** Semua sensitive functions sudah dilindungi dengan onlyOwner atau internal checks
2. **Reentrancy Protection:** Semua payable functions menggunakan nonReentrant modifier
3. **Input Validation:** Semua inputs divalidasi dengan require statements
4. **Integer Overflow:** Solidity 0.8+ sudah memiliki built-in overflow protection
5. **External Calls:** Menggunakan low-level call dengan proper error handling

### Frontend Security

**1. Validate User Input:**

```javascript
function validatePetitionInput(title, description) {
  if (!title || title.trim().length === 0) {
    throw new Error('Title cannot be empty');
  }
  if (title.length > 200) {
    throw new Error('Title too long (max 200 characters)');
  }
  if (!description || description.trim().length === 0) {
    throw new Error('Description cannot be empty');
  }
  if (description.length > 5000) {
    throw new Error('Description too long (max 5000 characters)');
  }
}
```

**2. Sanitize IPFS Hash:**

```javascript
function validateIPFSHash(hash) {
  const ipfsRegex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
  if (!ipfsRegex.test(hash)) {
    throw new Error('Invalid IPFS hash format');
  }
  return hash;
}
```

**3. Check Transaction Before Sending:**

```javascript
async function safeCreatePetition(title, description, imageHash) {
  try {
    // Validate inputs
    validatePetitionInput(title, description);
    const validHash = validateIPFSHash(imageHash);
    
    // Check membership
    const isMember = await checkMembership(userAddress);
    if (!isMember) {
      throw new Error('You must be a member to create petitions');
    }
    
    // Estimate gas
    const gasEstimate = await contract.estimateGas.createPetition(
      title, description, validHash
    );
    
    // Send transaction with extra gas buffer
    const tx = await contract.createPetition(
      title, description, validHash,
      { gasLimit: gasEstimate * 120n / 100n } // 20% buffer
    );
    
    return await tx.wait();
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
}
```

### Backend Security

**1. Rate Limiting:**

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

**2. Input Sanitization:**

```javascript
const validator = require('validator');

app.get('/api/member/:address', async (req, res) => {
  const { address } = req.params;
  
  // Validate Ethereum address
  if (!validator.isEthereumAddress(address)) {
    return res.status(400).json({ error: 'Invalid Ethereum address' });
  }
  
  // Continue processing
});
```

**3. Environment Variables:**

```bash
# Never commit .env file
# Use proper secrets management in production

PRIVATE_KEY=your_private_key
LISK_SEPOLIA_RPC=https://rpc.sepolia-api.lisk.com
PINATA_JWT=your_pinata_jwt
DATABASE_URL=mongodb://localhost:27017/petition
```

---

## Deployment to Production

### Pre-Production Checklist

- [ ] All contracts audited (if budget allows)
- [ ] Comprehensive testing completed
- [ ] Gas optimization done
- [ ] Documentation complete
- [ ] Frontend build optimized
- [ ] Backend secured and tested
- [ ] Database backed up
- [ ] Monitoring setup
- [ ] Error tracking configured
- [ ] Rate limiting implemented

### Mainnet Deployment Steps

**1. Update Network Configuration:**

```javascript
// hardhat.config.js
module.exports = {
  networks: {
    liskMainnet: {
      url: process.env.LISK_MAINNET_RPC,
      accounts: [process.env.MAINNET_PRIVATE_KEY],
      chainId: 1135 // Lisk Mainnet Chain ID
    }
  }
};
```

**2. Deploy to Mainnet:**

```bash
# Double check everything before deploying
npx hardhat run scripts/deploy.js --network liskMainnet

# Verify contracts
npx hardhat verify --network liskMainnet CONTRACT_ADDRESS [CONSTRUCTOR_ARGS]
```

**3. Update Frontend Configuration:**

```javascript
// config/contracts.js
export const CONTRACTS = {
  CampaignToken: {
    address: "MAINNET_CAMPAIGN_TOKEN_ADDRESS",
    abi: CampaignTokenABI
  },
  SoulboundMember: {
    address: "MAINNET_SOULBOUND_MEMBER_ADDRESS",
    abi: SoulboundMemberABI
  },
  PetitionPlatform: {
    address: "MAINNET_PETITION_PLATFORM_ADDRESS",
    abi: PetitionPlatformABI
  }
};

export const LISK_MAINNET = {
  id: 1135,
  name: "Lisk",
  network: "lisk",
  nativeCurrency: {
    decimals: 18,
    name: "Ethereum",
    symbol: "ETH"
  },
  rpcUrls: {
    default: { http: ["https://rpc.api.lisk.com"] },
    public: { http: ["https://rpc.api.lisk.com"] }
  },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://blockscout.lisk.com"
    }
  }
};
```

**4. Build and Deploy Frontend:**

```bash
# Build production bundle
npm run build

# Deploy to hosting (Vercel example)
vercel --prod

# Or deploy to IPFS
npm install -g ipfs-deploy
ipd build/
```

**5. Deploy Backend:**

```bash
# Using PM2 for Node.js
npm install -g pm2
pm2 start server.js --name petition-api
pm2 save
pm2 startup

# Or using Docker
docker build -t petition-backend .
docker run -d -p 3001:3001 petition-backend
```

### Post-Deployment

**1. Monitor Contracts:**

```javascript
// Setup monitoring service
const { Defender } = require('@openzeppelin/defender-sdk');

const client = new Defender({
  apiKey: process.env.DEFENDER_API_KEY,
  apiSecret: process.env.DEFENDER_API_SECRET
});

// Monitor for suspicious activity
await client.monitor.create({
  name: 'Petition Platform Monitor',
  addresses: [
    CONTRACTS.PetitionPlatform.address
  ],
  abi: PetitionPlatformABI,
  paused: false,
  alertThreshold: {
    amount: 1,
    windowSeconds: 3600
  },
  notificationChannels: ['email']
});
```

**2. Setup Analytics:**

```javascript
// Google Analytics or similar
import ReactGA from 'react-ga4';

ReactGA.initialize('YOUR_TRACKING_ID');

// Track petition creation
function trackPetitionCreated(petitionId) {
  ReactGA.event({
    category: 'Petition',
    action: 'Created',
    label: petitionId
  });
}

// Track signatures
function trackPetitionSigned(petitionId) {
  ReactGA.event({
    category: 'Petition',
    action: 'Signed',
    label: petitionId
  });
}
```

**3. Setup Error Tracking:**

```javascript
// Sentry for error tracking
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay()
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0
});
```

---

## Maintenance and Updates

### Regular Maintenance Tasks

**Daily:**
- Monitor transaction success rates
- Check error logs
- Verify event indexing working
- Monitor gas prices

**Weekly:**
- Review user feedback
- Check contract balance
- Verify backup systems
- Update documentation if needed

**Monthly:**
- Security audit review
- Performance optimization review
- User analytics review
- Database cleanup

### Contract Upgrade Strategy

Contracts ini tidak upgradeable by design untuk security. Jika perlu update:

**Option 1: Deploy New Version**
```javascript
// Deploy new contracts
// Migrate data if needed
// Update frontend to use new addresses
// Keep old contracts for historical data
```

**Option 2: Add New Features via Additional Contracts**
```javascript
// Deploy supplementary contract
// Integrate with existing contracts
// No migration needed
```

### Database Backup

```bash
# MongoDB backup
mongodump --db petition --out /backup/$(date +%Y%m%d)

# Automated daily backup
0 2 * * * mongodump --db petition --out /backup/$(date +\%Y\%m\%d)
```

---

## API Documentation

### REST API Endpoints

**Base URL:** `https://api.yourplatform.com`

#### Member Endpoints

**Check Membership**
```
GET /api/member/:address

Response:
{
  "isMember": true
}
```

#### Petition Endpoints

**Get All Petitions**
```
GET /api/petitions

Response:
{
  "petitions": [
    {
      "id": "0",
      "title": "Stop Deforestation",
      "description": "We need to protect...",
      "imageHash": "QmXxxx...",
      "creator": "0x1234...",
      "createdAt": 1699999999,
      "boostEndTime": 1700604799,
      "boostPriority": 5,
      "signatureCount": 142
    }
  ]
}
```

**Get Single Petition**
```
GET /api/petitions/:id

Response:
{
  "id": "0",
  "title": "Stop Deforestation",
  "description": "We need to protect...",
  "imageHash": "QmXxxx...",
  "creator": "0x1234...",
  "createdAt": 1699999999,
  "boostEndTime": 1700604799,
  "boostPriority": 5,
  "signatureCount": 142
}
```

**Check if User Signed**
```
GET /api/petitions/:id/signed/:address

Response:
{
  "hasSigned": true
}
```

**Get Active Boosted Petitions**
```
GET /api/petitions/boosted/active

Response:
{
  "petitions": [...]
}
```

**Get Platform Statistics**
```
GET /api/stats

Response:
{
  "totalPetitions": 45,
  "totalMembers": 123
}
```

---

## Resources and References

### Official Documentation

- **Lisk Documentation:** https://docs.lisk.com
- **Lisk Sepolia Testnet:** https://sepolia-api.lisk.com
- **OpenZeppelin Contracts:** https://docs.openzeppelin.com/contracts
- **Hardhat:** https://hardhat.org/docs
- **Ethers.js:** https://docs.ethers.org
- **Wagmi:** https://wagmi.sh
- **Pinata IPFS:** https://docs.pinata.cloud

### Community Resources

- **Lisk Discord:** https://discord.gg/lisk
- **Lisk Forum:** https://forum.lisk.com
- **GitHub Repository:** [Your repo URL]

### Support

For issues and questions:
- GitHub Issues: [Your repo]/issues
- Email: support@yourplatform.com
- Discord: [Your Discord server]

---

## Glossary

**SBT (Soulbound Token):** Non-transferable NFT yang berfungsi sebagai identitas digital unik

**CampaignToken:** ERC-20 token yang digunakan untuk membuat petisi gratis

**Petition:** Campaign atau petisi digital yang dapat ditandatangani

**Boost:** Fitur untuk meningkatkan visibilitas petisi dengan membayar fee

**Boost Priority:** Angka yang menentukan urutan petisi yang di-boost (semakin tinggi semakin atas)

**Gasless Transaction:** Transaksi blockchain tanpa biaya gas dari user (ditanggung platform via Panna SDK)

**IPFS:** InterPlanetary File System, storage terdesentralisasi untuk menyimpan gambar

**Signature:** Tanda tangan digital pada petisi (mint ERC-1155 token)

---

## FAQ

**Q: Apakah user harus bayar gas fee?**
A: Tidak, dengan integrasi Panna SDK semua transaksi gasless untuk user.

**Q: Berapa biaya membuat petisi?**
A: Petisi pertama gratis (menggunakan CampaignToken). Petisi selanjutnya 0.002 ETH.

**Q: Apakah SBT bisa ditransfer atau dijual?**
A: Tidak, SBT adalah token non-transferable dan permanent.

**Q: Berapa lama durasi boost?**
A: Boost berlaku selama 7 hari dengan biaya 0.001 ETH.

**Q: Apakah creator bisa tanda tangan petisi sendiri?**
A: Tidak, creator tidak bisa tanda tangan petisi yang mereka buat sendiri.

**Q: Bagaimana cara mendapat CampaignToken gratis?**
A: Otomatis dapat 1 token saat mint SBT, dan setiap 5 petisi berbayar dapat 1 token reward.

**Q: Apakah bisa mint SBT lebih dari sekali?**
A: Tidak, satu wallet hanya bisa mint SBT satu kali.

**Q: Apakah bisa tanda tangan petisi lebih dari sekali?**
A: Tidak, satu wallet hanya bisa tanda tangan satu kali per petisi.

**Q: Apa yang terjadi setelah boost berakhir?**
A: Petisi kembali ke urutan pembuatan (berdasarkan createdAt).

**Q: Bagaimana urutan petisi yang di-boost?**
A: Diurutkan berdasarkan boostPriority (siapa boost lebih dulu, priority lebih tinggi).

---

## Changelog

### Version 1.0.0 (Initial Release)
- Deployment ketiga smart contract
- Frontend web application
- Backend API server
- IPFS integration via Pinata
- Gasless transaction via Panna SDK

### Future Roadmap

**Version 1.1.0**
- Mobile application (React Native)
- Push notifications for petition updates
- Social sharing features
- Advanced analytics dashboard

**Version 1.2.0**
- Multi-language support
- DAO governance for platform decisions
- Token staking mechanism
- Petition categories and filtering

**Version 2.0.0**
- Cross-chain support
- Integration with other platforms
- Advanced verification system
- Enterprise features

---

## License

This project is licensed under the MIT License.

---

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

## Acknowledgments

- OpenZeppelin for secure smart contract libraries
- Lisk team for blockchain infrastructure
- Pinata for IPFS hosting
- Community contributors

---

**Last Updated:** November 2025

**Document Version:** 1.0.0

**Contact:** support@yourplatform.com