# Platform Petisi Digital Web3 - Hardhat Deployment Guide

## Daftar Isi
1. [Persiapan Environment](#persiapan-environment)
2. [Konfigurasi Hardhat](#konfigurasi-hardhat)
3. [Struktur Project](#struktur-project)
4. [Deployment Script](#deployment-script)
5. [Testing Script](#testing-script)
6. [Verification Script](#verification-script)
7. [Troubleshooting](#troubleshooting)

---

## Persiapan Environment

### Install Dependencies

```bash
# Inisialisasi project
mkdir petition-platform
cd petition-platform
npm init -y

# Install Hardhat dan dependencies
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install --save-dev @nomicfoundation/hardhat-verify
npm install @openzeppelin/contracts
npm install dotenv
```

### Setup Hardhat

```bash
npx hardhat init
```

Pilih: **Create a JavaScript project**

### Environment Variables

Buat file `.env` di root project:

```env
# Private key wallet deployer (TANPA prefix 0x)
PRIVATE_KEY=your_private_key_here

# Lisk Sepolia Testnet RPC
LISK_SEPOLIA_RPC=https://rpc.sepolia-api.lisk.com

# Blockscout API Key (optional, untuk verify)
BLOCKSCOUT_API_KEY=your_api_key_here
```

**PENTING:** Tambahkan `.env` ke `.gitignore`

```bash
echo ".env" >> .gitignore
```

### Dapatkan Testnet ETH

1. Buka: https://sepolia-faucet.lisk.com
2. Masukkan address wallet Anda
3. Request testnet ETH

---

## Konfigurasi Hardhat

Edit file `hardhat.config.js`:

```javascript
require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.30",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: false
    }
  },
  networks: {
    liskSepolia: {
      url: process.env.LISK_SEPOLIA_RPC || "https://rpc.sepolia-api.lisk.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 4202,
      gasPrice: 1000000000 // 1 gwei
    }
  },
  etherscan: {
    apiKey: {
      liskSepolia: process.env.BLOCKSCOUT_API_KEY || "empty"
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
  },
  sourcify: {
    enabled: true
  }
};
```

---

## Struktur Project

```
petition-platform/
├── contracts/
│   ├── CampaignToken.sol
│   ├── SoulboundMember.sol
│   └── PetitionPlatform.sol
├── scripts/
│   ├── deploy.js
│   ├── test-functions.js
│   └── verify.js
├── test/
│   └── PetitionPlatform.test.js
├── hardhat.config.js
├── .env
├── .gitignore
└── package.json
```

### Copy Contract Files

Copy ketiga contract Anda ke folder `contracts/`:
- `contracts/CampaignToken.sol`
- `contracts/SoulboundMember.sol`
- `contracts/PetitionPlatform.sol`

---

## Deployment Script

Buat file `scripts/deploy.js`:

```javascript
const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("=== PETITION PLATFORM DEPLOYMENT ===\n");
  
  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH\n");
  
  if (balance === 0n) {
    throw new Error("Deployer account has no balance. Please fund the account first.");
  }
  
  // ============================
  // 1. Deploy CampaignToken
  // ============================
  console.log("1. Deploying CampaignToken...");
  const CampaignToken = await hre.ethers.getContractFactory("CampaignToken");
  const campaignToken = await CampaignToken.deploy();
  await campaignToken.waitForDeployment();
  const campaignTokenAddress = await campaignToken.getAddress();
  console.log("   ✅ CampaignToken deployed to:", campaignTokenAddress);
  
  // Wait for confirmations
  await campaignToken.deploymentTransaction().wait(3);
  console.log("   ✅ Confirmed\n");
  
  // ============================
  // 2. Deploy SoulboundMember
  // ============================
  console.log("2. Deploying SoulboundMember...");
  const SoulboundMember = await hre.ethers.getContractFactory("SoulboundMember");
  const soulboundMember = await SoulboundMember.deploy(campaignTokenAddress);
  await soulboundMember.waitForDeployment();
  const soulboundMemberAddress = await soulboundMember.getAddress();
  console.log("   ✅ SoulboundMember deployed to:", soulboundMemberAddress);
  
  await soulboundMember.deploymentTransaction().wait(3);
  console.log("   ✅ Confirmed\n");
  
  // ============================
  // 3. Deploy PetitionPlatform
  // ============================
  console.log("3. Deploying PetitionPlatform...");
  const PetitionPlatform = await hre.ethers.getContractFactory("PetitionPlatform");
  const petitionPlatform = await PetitionPlatform.deploy(
    soulboundMemberAddress,
    campaignTokenAddress
  );
  await petitionPlatform.waitForDeployment();
  const petitionPlatformAddress = await petitionPlatform.getAddress();
  console.log("   ✅ PetitionPlatform deployed to:", petitionPlatformAddress);
  
  await petitionPlatform.deploymentTransaction().wait(3);
  console.log("   ✅ Confirmed\n");
  
  // ============================
  // 4. Setup Contract Connections
  // ============================
  console.log("4. Setting up contract connections...\n");
  
  // Set SoulboundMember in CampaignToken
  console.log("   Setting SoulboundMember in CampaignToken...");
  let tx = await campaignToken.setSoulboundMemberContract(soulboundMemberAddress);
  await tx.wait(2);
  console.log("   ✅ Done");
  
  // Set PetitionPlatform in CampaignToken
  console.log("   Setting PetitionPlatform in CampaignToken...");
  tx = await campaignToken.setPetitionContract(petitionPlatformAddress);
  await tx.wait(2);
  console.log("   ✅ Done");
  
  // Set PetitionPlatform in SoulboundMember
  console.log("   Setting PetitionPlatform in SoulboundMember...");
  tx = await soulboundMember.setPetitionContract(petitionPlatformAddress);
  await tx.wait(2);
  console.log("   ✅ Done\n");
  
  // ============================
  // 5. Verify Setup
  // ============================
  console.log("5. Verifying setup...\n");
  
  const ctPetitionContract = await campaignToken.petitionContract();
  const ctSoulboundContract = await campaignToken.soulboundMemberContract();
  const sbPetitionContract = await soulboundMember.petitionContract();
  const sbCampaignToken = await soulboundMember.campaignToken();
  const ppSoulboundMember = await petitionPlatform.soulboundMember();
  const ppCampaignToken = await petitionPlatform.campaignToken();
  
  console.log("   CampaignToken:");
  console.log("     petitionContract:", ctPetitionContract);
  console.log("     soulboundMemberContract:", ctSoulboundContract);
  console.log("     ✅", ctPetitionContract === petitionPlatformAddress ? "Correct" : "ERROR");
  console.log("     ✅", ctSoulboundContract === soulboundMemberAddress ? "Correct" : "ERROR");
  
  console.log("\n   SoulboundMember:");
  console.log("     petitionContract:", sbPetitionContract);
  console.log("     campaignToken:", sbCampaignToken);
  console.log("     ✅", sbPetitionContract === petitionPlatformAddress ? "Correct" : "ERROR");
  console.log("     ✅", sbCampaignToken === campaignTokenAddress ? "Correct" : "ERROR");
  
  console.log("\n   PetitionPlatform:");
  console.log("     soulboundMember:", ppSoulboundMember);
  console.log("     campaignToken:", ppCampaignToken);
  console.log("     ✅", ppSoulboundMember === soulboundMemberAddress ? "Correct" : "ERROR");
  console.log("     ✅", ppCampaignToken === campaignTokenAddress ? "Correct" : "ERROR");
  
  // ============================
  // 6. Save Deployment Info
  // ============================
  console.log("\n6. Saving deployment info...");
  
  const deploymentInfo = {
    network: "liskSepolia",
    chainId: 4202,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber(),
    contracts: {
      CampaignToken: {
        address: campaignTokenAddress,
        constructorArgs: []
      },
      SoulboundMember: {
        address: soulboundMemberAddress,
        constructorArgs: [campaignTokenAddress]
      },
      PetitionPlatform: {
        address: petitionPlatformAddress,
        constructorArgs: [soulboundMemberAddress, campaignTokenAddress]
      }
    }
  };
  
  fs.writeFileSync(
    'deployment-info.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("   ✅ Deployment info saved to deployment-info.json\n");
  
  // ============================
  // Summary
  // ============================
  console.log("=== DEPLOYMENT COMPLETE ===\n");
  console.log("Contract Addresses:");
  console.log("  CampaignToken:     ", campaignTokenAddress);
  console.log("  SoulboundMember:   ", soulboundMemberAddress);
  console.log("  PetitionPlatform:  ", petitionPlatformAddress);
  console.log("\nBlockscout Explorer:");
  console.log("  https://sepolia-blockscout.lisk.com/address/" + campaignTokenAddress);
  console.log("  https://sepolia-blockscout.lisk.com/address/" + soulboundMemberAddress);
  console.log("  https://sepolia-blockscout.lisk.com/address/" + petitionPlatformAddress);
  console.log("\nNext Steps:");
  console.log("  1. Run verification: npx hardhat run scripts/verify.js --network liskSepolia");
  console.log("  2. Run tests: npx hardhat run scripts/test-functions.js --network liskSepolia");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### Run Deployment

```bash
# Compile contracts
npx hardhat compile

# Deploy to Lisk Sepolia
npx hardhat run scripts/deploy.js --network liskSepolia
```

---

## Testing Script

Buat file `scripts/test-functions.js`:

```javascript
const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("=== TESTING PETITION PLATFORM FUNCTIONS ===\n");
  
  // Load deployment info
  if (!fs.existsSync('deployment-info.json')) {
    throw new Error("deployment-info.json not found. Please run deploy.js first.");
  }
  
  const deploymentInfo = JSON.parse(fs.readFileSync('deployment-info.json', 'utf8'));
  console.log("Loaded deployment info from:", deploymentInfo.network);
  console.log("Deployed at:", deploymentInfo.timestamp, "\n");
  
  const [deployer, user1, user2] = await hre.ethers.getSigners();
  
  console.log("Testing with accounts:");
  console.log("  Deployer:", deployer.address);
  console.log("  User1:   ", user1.address);
  console.log("  User2:   ", user2.address, "\n");
  
  // Get contract instances
  const campaignToken = await hre.ethers.getContractAt(
    "CampaignToken",
    deploymentInfo.contracts.CampaignToken.address
  );
  
  const soulboundMember = await hre.ethers.getContractAt(
    "SoulboundMember",
    deploymentInfo.contracts.SoulboundMember.address
  );
  
  const petitionPlatform = await hre.ethers.getContractAt(
    "PetitionPlatform",
    deploymentInfo.contracts.PetitionPlatform.address
  );
  
  // ============================
  // TEST 1: Mint SBT for User1
  // ============================
  console.log("=== TEST 1: Mint SBT (User1) ===");
  
  let isMember = await soulboundMember.isMember(user1.address);
  console.log("Before mint - User1 is member:", isMember);
  
  let tokenBalance = await campaignToken.balanceOf(user1.address);
  console.log("Before mint - User1 CampaignToken:", hre.ethers.formatEther(tokenBalance), "CAMP");
  
  console.log("\nMinting SBT...");
  let tx = await soulboundMember.connect(user1).mintMembership();
  let receipt = await tx.wait();
  console.log("✅ Tx hash:", receipt.hash);
  
  isMember = await soulboundMember.isMember(user1.address);
  tokenBalance = await campaignToken.balanceOf(user1.address);
  console.log("After mint - User1 is member:", isMember);
  console.log("After mint - User1 CampaignToken:", hre.ethers.formatEther(tokenBalance), "CAMP");
  
  if (tokenBalance >= hre.ethers.parseEther("1")) {
    console.log("✅ SUCCESS: User1 received 1 CampaignToken!\n");
  } else {
    console.log("❌ FAILED: User1 did not receive token!\n");
    return;
  }
  
  // ============================
  // TEST 2: Mint SBT for User2
  // ============================
  console.log("=== TEST 2: Mint SBT (User2) ===");
  tx = await soulboundMember.connect(user2).mintMembership();
  receipt = await tx.wait();
  console.log("✅ User2 minted SBT");
  console.log("✅ Tx hash:", receipt.hash, "\n");
  
  // ============================
  // TEST 3: Create Petition with Token (FREE)
  // ============================
  console.log("=== TEST 3: Create Petition with Token (User1) ===");
  
  const tokenBalanceBefore = await campaignToken.balanceOf(user1.address);
  console.log("Token balance before:", hre.ethers.formatEther(tokenBalanceBefore), "CAMP");
  
  tx = await petitionPlatform.connect(user1).createPetition(
    "Stop Deforestation in Amazon",
    "We need to protect the Amazon rainforest for future generations. This petition calls for immediate action.",
    "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco", // Example IPFS hash
    true // _useToken = true (use CampaignToken)
  );
  receipt = await tx.wait();
  console.log("✅ Petition created (FREE with token)");
  console.log("✅ Tx hash:", receipt.hash);
  
  const tokenBalanceAfter = await campaignToken.balanceOf(user1.address);
  console.log("Token balance after:", hre.ethers.formatEther(tokenBalanceAfter), "CAMP");
  console.log("Token burned:", hre.ethers.formatEther(tokenBalanceBefore - tokenBalanceAfter), "CAMP");
  
  let totalPetitions = await petitionPlatform.getTotalPetitions();
  console.log("Total petitions:", totalPetitions.toString());
  
  let petition = await petitionPlatform.getPetition(0);
  console.log("Petition #0:");
  console.log("  Title:", petition.title);
  console.log("  Creator:", petition.creator);
  console.log("  Signatures:", petition.signatureCount.toString(), "\n");
  
  // ============================
  // TEST 4: Create Petition with ETH
  // ============================
  console.log("=== TEST 4: Create Petition with ETH (User1) ===");
  
  const baseFee = await petitionPlatform.baseCampaignFee();
  console.log("Base campaign fee:", hre.ethers.formatEther(baseFee), "ETH");
  
  tx = await petitionPlatform.connect(user1).createPetition(
    "Clean Water for All Communities",
    "Access to clean water is a basic human right. We demand infrastructure improvements.",
    "QmYoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco",
    false, // _useToken = false (pay with ETH)
    { value: baseFee }
  );
  receipt = await tx.wait();
  console.log("✅ Petition created (PAID with ETH)");
  console.log("✅ Tx hash:", receipt.hash);
  
  totalPetitions = await petitionPlatform.getTotalPetitions();
  console.log("Total petitions:", totalPetitions.toString());
  
  const paidCount = await petitionPlatform.getUserPaidPetitionCount(user1.address);
  console.log("User1 paid petition count:", paidCount.toString(), "\n");
  
  // ============================
  // TEST 5: Sign Petition
  // ============================
  console.log("=== TEST 5: Sign Petition (User2 signs #0) ===");
  
  petition = await petitionPlatform.getPetition(0);
  console.log("Signatures before:", petition.signatureCount.toString());
  
  tx = await petitionPlatform.connect(user2).signPetition(0);
  receipt = await tx.wait();
  console.log("✅ User2 signed petition #0");
  console.log("✅ Tx hash:", receipt.hash);
  
  petition = await petitionPlatform.getPetition(0);
  console.log("Signatures after:", petition.signatureCount.toString());
  
  const hasSigned = await petitionPlatform.hasUserSigned(0, user2.address);
  console.log("User2 has signed:", hasSigned, "\n");
  
  // ============================
  // TEST 6: Try Sign Own Petition (should fail)
  // ============================
  console.log("=== TEST 6: Try Sign Own Petition (Should Fail) ===");
  try {
    tx = await petitionPlatform.connect(user1).signPetition(0);
    await tx.wait();
    console.log("❌ ERROR: Should have been reverted!\n");
  } catch (error) {
    console.log("✅ Correctly prevented creator from signing own petition");
    console.log("   Error:", error.message.split('\n')[0], "\n");
  }
  
  // ============================
  // TEST 7: Boost Petition
  // ============================
  console.log("=== TEST 7: Boost Petition (User1 boosts #0) ===");
  
  const boostFee = await petitionPlatform.boostingFee();
  console.log("Boosting fee:", hre.ethers.formatEther(boostFee), "ETH");
  
  petition = await petitionPlatform.getPetition(0);
  console.log("Before boost:");
  console.log("  boostEndTime:", petition.boostEndTime.toString());
  console.log("  boostPriority:", petition.boostPriority.toString());
  
  tx = await petitionPlatform.connect(user1).boostPetition(0, { value: boostFee });
  receipt = await tx.wait();
  console.log("\n✅ Petition boosted");
  console.log("✅ Tx hash:", receipt.hash);
  
  petition = await petitionPlatform.getPetition(0);
  console.log("\nAfter boost:");
  console.log("  boostEndTime:", new Date(Number(petition.boostEndTime) * 1000).toISOString());
  console.log("  boostPriority:", petition.boostPriority.toString());
  
  const isBoosted = await petitionPlatform.isPetitionBoosted(0);
  console.log("  Is boosted:", isBoosted, "\n");
  
  // ============================
  // TEST 8: Get All Petitions
  // ============================
  console.log("=== TEST 8: Get All Petitions ===");
  const allPetitions = await petitionPlatform.getAllPetitions();
  console.log("Total petitions:", allPetitions.length);
  
  for (let i = 0; i < allPetitions.length; i++) {
    const p = allPetitions[i];
    console.log(`\nPetition #${i}:`);
    console.log("  Title:", p.title);
    console.log("  Creator:", p.creator);
    console.log("  Signatures:", p.signatureCount.toString());
    console.log("  Boosted:", p.boostEndTime > 0n);
    if (p.boostEndTime > 0n) {
      console.log("  Boost Priority:", p.boostPriority.toString());
      console.log("  Boost End:", new Date(Number(p.boostEndTime) * 1000).toLocaleString());
    }
  }
  
  // ============================
  // TEST 9: Get Active Boosted Petitions
  // ============================
  console.log("\n=== TEST 9: Get Active Boosted Petitions ===");
  const boostedPetitions = await petitionPlatform.getActiveBoostedPetitions();
  console.log("Active boosted petitions:", boostedPetitions.length);
  
  // ============================
  // Summary
  // ============================
  console.log("\n=== TEST SUMMARY ===");
  const totalMembers = await soulboundMember.totalSupply();
  const finalTotalPetitions = await petitionPlatform.getTotalPetitions();
  
  console.log("Total Members:", totalMembers.toString());
  console.log("Total Petitions:", finalTotalPetitions.toString());
  console.log("User1 CampaignToken:", hre.ethers.formatEther(await campaignToken.balanceOf(user1.address)), "CAMP");
  console.log("User2 CampaignToken:", hre.ethers.formatEther(await campaignToken.balanceOf(user2.address)), "CAMP");
  
  console.log("\n✅ ALL TESTS COMPLETED SUCCESSFULLY");
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

## Verification Script

Buat file `scripts/verify.js`:

```javascript
const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("=== VERIFYING CONTRACTS ON BLOCKSCOUT ===\n");
  
  // Load deployment info
  if (!fs.existsSync('deployment-info.json')) {
    throw new Error("deployment-info.json not found. Please run deploy.js first.");
  }
  
  const deploymentInfo = JSON.parse(fs.readFileSync('deployment-info.json', 'utf8'));
  
  const { CampaignToken, SoulboundMember, PetitionPlatform } = deploymentInfo.contracts;
  
  console.log("Verifying contracts from deployment at:", deploymentInfo.timestamp, "\n");
  
  // ============================
  // Verify CampaignToken
  // ============================
  console.log("1. Verifying CampaignToken...");
  console.log("   Address:", CampaignToken.address);
  console.log("   Constructor args:", JSON.stringify(CampaignToken.constructorArgs));
  
  try {
    await hre.run("verify:verify", {
      address: CampaignToken.address,
      constructorArguments: CampaignToken.constructorArgs,
    });
    console.log("   ✅ CampaignToken verified\n");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("   ✅ CampaignToken already verified\n");
    } else {
      console.log("   ❌ Error:", error.message, "\n");
    }
  }
  
  // ============================
  // Verify SoulboundMember
  // ============================
  console.log("2. Verifying SoulboundMember...");
  console.log("   Address:", SoulboundMember.address);
  console.log("   Constructor args:", JSON.stringify(SoulboundMember.constructorArgs));
  
  try {
    await hre.run("verify:verify", {
      address: SoulboundMember.address,
      constructorArguments: SoulboundMember.constructorArgs,
    });
    console.log("   ✅ SoulboundMember verified\n");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("   ✅ SoulboundMember already verified\n");
    } else {
      console.log("   ❌ Error:", error.message, "\n");
    }
  }
  
  // ============================
  // Verify PetitionPlatform
  // ============================
  console.log("3. Verifying PetitionPlatform...");
  console.log("   Address:", PetitionPlatform.address);
  console.log("   Constructor args:", JSON.stringify(PetitionPlatform.constructorArgs));
  
  try {
    await hre.run("verify:verify", {
      address: PetitionPlatform.address,
      constructorArguments: PetitionPlatform.constructorArgs,
    });
    console.log("   ✅ PetitionPlatform verified\n");
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      console.log("   ✅ PetitionPlatform already verified\n");
    } else {
      console.log("   ❌ Error:", error.message, "\n");
    }
  }
  
  // ============================
  // Summary
  // ============================
  console.log("=== VERIFICATION COMPLETE ===\n");
  console.log("View contracts on Blockscout:");
  console.log("  CampaignToken:    ", "https://sepolia-blockscout.lisk.com/address/" + CampaignToken.address);
  console.log("  SoulboundMember:  ", "https://sepolia-blockscout.lisk.com/address/" + SoulboundMember.address);
  console.log("  PetitionPlatform: ", "https://sepolia-blockscout.lisk.com/address/" + PetitionPlatform.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### Run Verification

```bash
npx hardhat run scripts/verify.js --network liskSepolia
```

### Manual Verification (Alternative)

Jika automatic verification gagal, gunakan command ini:

```bash
# Verify CampaignToken
npx hardhat verify --network liskSepolia CAMPAIGN_TOKEN_ADDRESS

# Verify SoulboundMember
npx hardhat verify --network liskSepolia SOULBOUND_MEMBER_ADDRESS "CAMPAIGN_TOKEN_ADDRESS"

# Verify PetitionPlatform
npx hardhat verify --network liskSepolia PETITION_PLATFORM_ADDRESS "SOULBOUND_MEMBER_ADDRESS" "CAMPAIGN_TOKEN_ADDRESS"
```

---

## Troubleshooting

### Issue 1: Insufficient Funds

**Error:**
```
Error: insufficient funds for intrinsic transaction cost
```

**Solution:**
- Request testnet ETH from faucet: https://sepolia-faucet.lisk.com
- Check balance: `await ethers.provider.getBalance(address)`

### Issue 2: Nonce Too High

**Error:**
```
Error: nonce has already been used
```

**Solution:**
```bash
# Clear Hardhat cache
npx hardhat clean

# Or reset account nonce manually in MetaMask/wallet
```

### Issue 3: Contract Already Deployed

**Error:**
```
Error: contract creation code storage out of gas
```

**Solution:**
- Deploy ke address baru dengan private key berbeda
- Atau gunakan salt untuk CREATE2 deployment

### Issue 4: Verification Failed

**Error:**
```
Error: Failed to send contract verification request
```

**Solution:**

1. Tunggu beberapa block confirmations (minimal 3-5 blocks)
2. Check contract sudah ada di Blockscout
3. Manual verification di Blockscout UI:
   - Buka contract address di Blockscout
   - Tab "Code" → "Verify & Publish"
   - Compiler: 0.8.30
   - Optimization: Yes, 200 runs
   - Paste contract code
   - Submit

### Issue 5: Token Not Received After Minting SBT

**Error:**
User mint SBT tapi tidak dapat CampaignToken

**Solution:**

Check apakah `setSoulboundMemberContract` sudah dipanggil:

```javascript
const sbtAddress = await campaignToken.soulboundMemberContract();
console.log("SBT in CampaignToken:", sbtAddress);
console.log("Expected:", soulboundMember.address);

// Jika tidak match, set ulang:
await campaignToken.setSoulboundMemberContract(soulboundMember.address);
```

### Issue 6: Gas Estimation Failed

**Error:**
```
Error: cannot estimate gas; transaction may fail
```

**Solution:**

Set manual gas limit:

```javascript
const tx = await contract.functionName(args, {
  gasLimit: 500000
});
```

### Issue 7: Compilation Error

**Error:**
```
Error: Source file requires different compiler version
```

**Solution:**

Edit `hardhat.config.js`:

```javascript
solidity: {
  version: "0.8.30", // Match dengan pragma solidity ^0.8.30
  settings: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
}
```

### Issue 8: Network Connection Timeout

**Error:**
```
Error: timeout of 20000ms exceeded
```

**Solution:**

Tambah timeout di config:

```javascript
networks: {
  liskSepolia: {
    url: process.env.LISK_SEPOLIA_RPC,
    accounts: [process.env.PRIVATE_KEY],
    chainId: 4202,
    timeout: 60000 // 60 seconds
  }
}
```

---

## Complete Workflow Commands

### Fresh Deployment

```bash
# 1. Setup project
npm install

# 2. Create .env file with your PRIVATE_KEY

# 3. Compile contracts
npx hardhat compile

# 4. Deploy to Lisk Sepolia
npx hardhat run scripts/deploy.js --network liskSepolia

# 5. Verify contracts
npx hardhat run scripts/verify.js --network liskSepolia

# 6. Test functions
npx hardhat run scripts/test-functions.js --network liskSepolia
```

### Check Deployment Status

```bash
# Check if deployment-info.json exists
cat deployment-info.json

# Check contract on Blockscout
# Replace with your actual address
open https://sepolia-blockscout.lisk.com/address/YOUR_CONTRACT_ADDRESS
```

### Re-deploy (if needed)

```bash
# Clean artifacts
npx hardhat clean

# Re-compile
npx hardhat compile

# Deploy again (will create new contracts)
npx hardhat run scripts/deploy.js --network liskSepolia
```

---

## Advanced Configuration

### Gas Optimization

Edit `hardhat.config.js`:

```javascript
solidity: {
  version: "0.8.30",
  settings: {
    optimizer: {
      enabled: true,
      runs: 200, // Increase for cheaper execution, decrease for cheaper deployment
      details: {
        yul: true,
        yulDetails: {
          stackAllocation: true,
          optimizerSteps: "dhfoDgvulfnTUtnIf"
        }
      }
    }
  }
}
```

### Multiple Networks

```javascript
networks: {
  liskSepolia: {
    url: process.env.LISK_SEPOLIA_RPC,
    accounts: [process.env.PRIVATE_KEY],
    chainId: 4202
  },
  liskMainnet: {
    url: "https://rpc.api.lisk.com",
    accounts: [process.env.MAINNET_PRIVATE_KEY],
    chainId: 1135
  }
}
```

### Custom Tasks

Buat file `hardhat.config.js` tambahan:

```javascript
task("balance", "Prints an account's balance")
  .addParam("account", "The account's address")
  .setAction(async (taskArgs, hre) => {
    const balance = await hre.ethers.provider.getBalance(taskArgs.account);
    console.log(hre.ethers.formatEther(balance), "ETH");
  });

task("member", "Check if address is member")
  .addParam("address", "The address to check")
  .setAction(async (taskArgs, hre) => {
    const deploymentInfo = JSON.parse(fs.readFileSync('deployment-info.json'));
    const soulboundMember = await hre.ethers.getContractAt(
      "SoulboundMember",
      deploymentInfo.contracts.SoulboundMember.address
    );
    const isMember = await soulboundMember.isMember(taskArgs.address);
    console.log("Is member:", isMember);
  });
```

Usage:

```bash
npx hardhat balance --account 0x1234...
npx hardhat member --address 0x1234... --network liskSepolia
```

---

## Testing with Hardhat Network

### Local Testing

Buat file `test/PetitionPlatform.test.js`:

```javascript
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Petition Platform", function () {
  let campaignToken, soulboundMember, petitionPlatform;
  let owner, user1, user2;
  
  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    // Deploy CampaignToken
    const CampaignToken = await ethers.getContractFactory("CampaignToken");
    campaignToken = await CampaignToken.deploy();
    await campaignToken.waitForDeployment();
    
    // Deploy SoulboundMember
    const SoulboundMember = await ethers.getContractFactory("SoulboundMember");
    soulboundMember = await SoulboundMember.deploy(await campaignToken.getAddress());
    await soulboundMember.waitForDeployment();
    
    // Deploy PetitionPlatform
    const PetitionPlatform = await ethers.getContractFactory("PetitionPlatform");
    petitionPlatform = await PetitionPlatform.deploy(
      await soulboundMember.getAddress(),
      await campaignToken.getAddress()
    );
    await petitionPlatform.waitForDeployment();
    
    // Setup connections
    await campaignToken.setSoulboundMemberContract(await soulboundMember.getAddress());
    await campaignToken.setPetitionContract(await petitionPlatform.getAddress());
    await soulboundMember.setPetitionContract(await petitionPlatform.getAddress());
  });
  
  describe("SoulboundMember", function () {
    it("Should mint SBT and give 1 CampaignToken", async function () {
      await soulboundMember.connect(user1).mintMembership();
      
      const isMember = await soulboundMember.isMember(user1.address);
      expect(isMember).to.equal(true);
      
      const balance = await campaignToken.balanceOf(user1.address);
      expect(balance).to.equal(ethers.parseEther("1"));
    });
    
    it("Should prevent duplicate minting", async function () {
      await soulboundMember.connect(user1).mintMembership();
      
      await expect(
        soulboundMember.connect(user1).mintMembership()
      ).to.be.revertedWith("Already minted");
    });
    
    it("Should prevent SBT transfer", async function () {
      await soulboundMember.connect(user1).mintMembership();
      
      await expect(
        soulboundMember.connect(user1).transferFrom(user1.address, user2.address, 0)
      ).to.be.revertedWith("SBT: Token is non-transferable");
    });
  });
  
  describe("PetitionPlatform", function () {
    beforeEach(async function () {
      // Mint SBT for users
      await soulboundMember.connect(user1).mintMembership();
      await soulboundMember.connect(user2).mintMembership();
    });
    
    it("Should create petition with token (free)", async function () {
      await petitionPlatform.connect(user1).createPetition(
        "Test Petition",
        "Test Description",
        "QmTest",
        true // use token
      );
      
      const petition = await petitionPlatform.getPetition(0);
      expect(petition.title).to.equal("Test Petition");
      expect(petition.creator).to.equal(user1.address);
      
      // Check token burned
      const balance = await campaignToken.balanceOf(user1.address);
      expect(balance).to.equal(0);
    });
    
    it("Should create petition with ETH payment", async function () {
      const baseFee = await petitionPlatform.baseCampaignFee();
      
      await petitionPlatform.connect(user1).createPetition(
        "Test Petition 2",
        "Test Description 2",
        "QmTest2",
        false, // use ETH
        { value: baseFee }
      );
      
      const petition = await petitionPlatform.getPetition(0);
      expect(petition.title).to.equal("Test Petition 2");
      
      const paidCount = await petitionPlatform.getUserPaidPetitionCount(user1.address);
      expect(paidCount).to.equal(1);
    });
    
    it("Should allow user to sign petition", async function () {
      // User1 creates petition
      await petitionPlatform.connect(user1).createPetition(
        "Test Petition",
        "Test Description",
        "QmTest",
        true
      );
      
      // User2 signs petition
      await petitionPlatform.connect(user2).signPetition(0);
      
      const hasSigned = await petitionPlatform.hasUserSigned(0, user2.address);
      expect(hasSigned).to.equal(true);
      
      const petition = await petitionPlatform.getPetition(0);
      expect(petition.signatureCount).to.equal(1);
    });
    
    it("Should prevent creator from signing own petition", async function () {
      await petitionPlatform.connect(user1).createPetition(
        "Test Petition",
        "Test Description",
        "QmTest",
        true
      );
      
      await expect(
        petitionPlatform.connect(user1).signPetition(0)
      ).to.be.revertedWith("Creator cannot sign own petition");
    });
    
    it("Should prevent duplicate signature", async function () {
      await petitionPlatform.connect(user1).createPetition(
        "Test Petition",
        "Test Description",
        "QmTest",
        true
      );
      
      await petitionPlatform.connect(user2).signPetition(0);
      
      await expect(
        petitionPlatform.connect(user2).signPetition(0)
      ).to.be.revertedWith("Already signed");
    });
    
    it("Should boost petition correctly", async function () {
      await petitionPlatform.connect(user1).createPetition(
        "Test Petition",
        "Test Description",
        "QmTest",
        true
      );
      
      const boostFee = await petitionPlatform.boostingFee();
      await petitionPlatform.connect(user1).boostPetition(0, { value: boostFee });
      
      const petition = await petitionPlatform.getPetition(0);
      expect(petition.boostPriority).to.equal(1);
      expect(petition.boostEndTime).to.be.gt(0);
      
      const isBoosted = await petitionPlatform.isPetitionBoosted(0);
      expect(isBoosted).to.equal(true);
    });
    
    it("Should give reward after 5 paid petitions", async function () {
      const baseFee = await petitionPlatform.baseCampaignFee();
      
      // Burn initial free token
      await petitionPlatform.connect(user1).createPetition(
        "Petition 0", "Desc", "QmTest0", true
      );
      
      // Create 5 paid petitions
      for (let i = 1; i <= 5; i++) {
        await petitionPlatform.connect(user1).createPetition(
          `Petition ${i}`, `Description ${i}`, `QmTest${i}`,
          false,
          { value: baseFee }
        );
      }
      
      // Check if user got reward token
      const balance = await campaignToken.balanceOf(user1.address);
      expect(balance).to.equal(ethers.parseEther("1"));
    });
  });
});
```

### Run Local Tests

```bash
# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test test/PetitionPlatform.test.js

# Run with gas report
REPORT_GAS=true npx hardhat test

# Run with coverage
npx hardhat coverage
```

---

## Gas Reporter Configuration

Install gas reporter:

```bash
npm install --save-dev hardhat-gas-reporter
```

Edit `hardhat.config.js`:

```javascript
require("hardhat-gas-reporter");

module.exports = {
  gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false,
    currency: "USD",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    outputFile: "gas-report.txt",
    noColors: true
  }
};
```

Run with gas report:

```bash
REPORT_GAS=true npx hardhat test
```

---

## Coverage Testing

Install coverage:

```bash
npm install --save-dev solidity-coverage
```

Edit `hardhat.config.js`:

```javascript
require("solidity-coverage");
```

Run coverage:

```bash
npx hardhat coverage
```

Output akan tersimpan di `coverage/index.html`

---

## Deployment Checklist

### Pre-Deployment

- [ ] All contracts compiled without errors
- [ ] All tests passing
- [ ] Gas optimization done
- [ ] Security audit completed (if applicable)
- [ ] `.env` file configured with correct PRIVATE_KEY
- [ ] Deployer wallet has sufficient ETH
- [ ] Network configuration correct in hardhat.config.js

### Deployment

- [ ] Run `npx hardhat compile`
- [ ] Run `npx hardhat run scripts/deploy.js --network liskSepolia`
- [ ] Save deployment addresses from console output
- [ ] Verify `deployment-info.json` created
- [ ] Check all contract connections are correct

### Post-Deployment

- [ ] Run verification script
- [ ] Check contracts verified on Blockscout
- [ ] Run test-functions script
- [ ] Test all major functions (mint SBT, create petition, sign, boost)
- [ ] Document contract addresses
- [ ] Update frontend configuration with new addresses
- [ ] Test frontend integration

---

## Useful Hardhat Commands

```bash
# Compile contracts
npx hardhat compile

# Clean artifacts
npx hardhat clean

# Run tests
npx hardhat test

# Run specific test
npx hardhat test test/PetitionPlatform.test.js

# Deploy to network
npx hardhat run scripts/deploy.js --network liskSepolia

# Verify contract
npx hardhat verify --network liskSepolia CONTRACT_ADDRESS "CONSTRUCTOR_ARG1" "CONSTRUCTOR_ARG2"

# Check compilation size
npx hardhat size-contracts

# Run local node
npx hardhat node

# Console (interactive)
npx hardhat console --network liskSepolia

# Get help
npx hardhat help
```

---

## Environment Variables Reference

```env
# Required
PRIVATE_KEY=your_wallet_private_key_without_0x_prefix

# Network RPC
LISK_SEPOLIA_RPC=https://rpc.sepolia-api.lisk.com

# Optional (for verification)
BLOCKSCOUT_API_KEY=your_blockscout_api_key

# Optional (for gas reporter)
COINMARKETCAP_API_KEY=your_coinmarketcap_api_key

# Optional (for mainnet)
MAINNET_PRIVATE_KEY=your_mainnet_private_key
LISK_MAINNET_RPC=https://rpc.api.lisk.com
```

---

## Network Information

### Lisk Sepolia Testnet

- **Network Name:** Lisk Sepolia
- **Chain ID:** 4202
- **RPC URL:** https://rpc.sepolia-api.lisk.com
- **Currency:** ETH
- **Block Explorer:** https://sepolia-blockscout.lisk.com
- **Faucet:** https://sepolia-faucet.lisk.com

### Lisk Mainnet

- **Network Name:** Lisk
- **Chain ID:** 1135
- **RPC URL:** https://rpc.api.lisk.com
- **Currency:** ETH
- **Block Explorer:** https://blockscout.lisk.com

---

## Best Practices

### Security

1. Never commit `.env` file to git
2. Use different wallets for testnet and mainnet
3. Keep private keys secure
4. Test thoroughly on testnet before mainnet
5. Use hardware wallet for mainnet deployments

### Development

1. Always compile before deploying
2. Run tests before deployment
3. Verify contracts after deployment
4. Document all contract addresses
5. Keep deployment scripts updated

### Gas Optimization

1. Enable optimizer in hardhat.config.js
2. Use appropriate optimizer runs value
3. Test gas costs with gas reporter
4. Minimize storage operations
5. Use events for off-chain data

---

## Support and Resources

### Documentation

- Hardhat: https://hardhat.org/docs
- Ethers.js: https://docs.ethers.org
- OpenZeppelin: https://docs.openzeppelin.com
- Lisk: https://docs.lisk.com

### Community

- Hardhat Discord: https://hardhat.org/discord
- Lisk Discord: https://discord.gg/lisk
- Stack Overflow: ethereum tag

### Tools

- Remix IDE: https://remix.ethereum.org
- Hardhat VSCode Extension
- Solidity Compiler
- MetaMask Wallet

---

## Changelog

### Version 1.0.0
- Initial deployment guide
- Complete testing suite
- Verification scripts
- Troubleshooting section

---

**Last Updated:** November 2025

**Author:** Platform Development Team

**License:** MIT