import { ethers } from "hardhat";

async function main() {
  console.log("=== Deploying Contracts to Lisk Sepolia Testnet ===\n");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH\n");
  
  // 1. Deploy CampaignToken
  console.log("1. Deploying CampaignToken...");
  const CampaignToken = await ethers.getContractFactory("CampaignToken");
  const campaignToken = await CampaignToken.deploy();
  await campaignToken.waitForDeployment();
  const campaignTokenAddress = await campaignToken.getAddress();
  
  const deployTx1 = campaignToken.deploymentTransaction();
  console.log("✓ CampaignToken deployed to:", campaignTokenAddress);
  if (deployTx1) {
    console.log("  Transaction hash:", deployTx1.hash);
    console.log("  Waiting for confirmations...");
    await deployTx1.wait(1);
    console.log("  ✓ Confirmed");
  }
  
  // 2. Deploy SoulboundMember
  console.log("\n2. Deploying SoulboundMember...");
  const SoulboundMember = await ethers.getContractFactory("SoulboundMember");
  const soulboundMember = await SoulboundMember.deploy(campaignTokenAddress);
  await soulboundMember.waitForDeployment();
  const soulboundMemberAddress = await soulboundMember.getAddress();
  
  const deployTx2 = soulboundMember.deploymentTransaction();
  console.log("✓ SoulboundMember deployed to:", soulboundMemberAddress);
  if (deployTx2) {
    console.log("  Transaction hash:", deployTx2.hash);
    console.log("  Waiting for confirmations...");
    await deployTx2.wait(1);
    console.log("  ✓ Confirmed");
  }
  
  // 3. Deploy PetitionPlatform
  console.log("\n3. Deploying PetitionPlatform...");
  const PetitionPlatform = await ethers.getContractFactory("PetitionPlatform");
  const petitionPlatform = await PetitionPlatform.deploy(
    soulboundMemberAddress,
    campaignTokenAddress
  );
  await petitionPlatform.waitForDeployment();
  const petitionPlatformAddress = await petitionPlatform.getAddress();
  
  const deployTx3 = petitionPlatform.deploymentTransaction();
  console.log("✓ PetitionPlatform deployed to:", petitionPlatformAddress);
  if (deployTx3) {
    console.log("  Transaction hash:", deployTx3.hash);
    console.log("  Waiting for confirmations...");
    await deployTx3.wait(1);
    console.log("  ✓ Confirmed");
  }
  
  // 4. Setup connections
  console.log("\n4. Setting up contract connections...");
  
  console.log("  - Setting SoulboundMember in CampaignToken...");
  let tx = await campaignToken.setSoulboundMemberContract(soulboundMemberAddress);
  await tx.wait(1);
  console.log("  ✓ Done");
  
  console.log("  - Setting PetitionPlatform in CampaignToken...");
  tx = await campaignToken.setPetitionContract(petitionPlatformAddress);
  await tx.wait(1);
  console.log("  ✓ Done");
  
  console.log("  - Setting PetitionPlatform in SoulboundMember...");
  tx = await soulboundMember.setPetitionContract(petitionPlatformAddress);
  await tx.wait(1);
  console.log("  ✓ Done");
  
  console.log("  ✓ All steps completed");
  
  // 5. Verify setup
  console.log("\n5. Verifying setup...");
  const sbtInCampaign = await campaignToken.soulboundMemberContract();
  const petitionInCampaign = await campaignToken.petitionContract();
  const petitionInSbt = await soulboundMember.petitionContract();
  
  const allCorrect = 
    sbtInCampaign === soulboundMemberAddress &&
    petitionInCampaign === petitionPlatformAddress &&
    petitionInSbt === petitionPlatformAddress;
  
  if (allCorrect) {
    console.log("  ✓ All contract connections verified successfully!");
  } else {
    console.log("  ✗ Contract connections verification failed!");
    console.log("    CampaignToken.soulboundMemberContract:", sbtInCampaign);
    console.log("    Expected:", soulboundMemberAddress);
    console.log("    CampaignToken.petitionContract:", petitionInCampaign);
    console.log("    Expected:", petitionPlatformAddress);
    console.log("    SoulboundMember.petitionContract:", petitionInSbt);
    console.log("    Expected:", petitionPlatformAddress);
    return;
  }
  
  // 6. Save deployment info
  console.log("\n6. Saving deployment info...");
  const fs = require("fs");
  const deploymentInfo = {
    network: "liskSepolia",
    chainId: 4202,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      CampaignToken: campaignTokenAddress,
      SoulboundMember: soulboundMemberAddress,
      PetitionPlatform: petitionPlatformAddress,
    },
    transactionHashes: {
      CampaignToken: deployTx1?.hash,
      SoulboundMember: deployTx2?.hash,
      PetitionPlatform: deployTx3?.hash,
    },
    explorerUrls: {
      CampaignToken: `https://sepolia-blockscout.lisk.com/address/${campaignTokenAddress}`,
      SoulboundMember: `https://sepolia-blockscout.lisk.com/address/${soulboundMemberAddress}`,
      PetitionPlatform: `https://sepolia-blockscout.lisk.com/address/${petitionPlatformAddress}`,
    },
  };
  
  fs.writeFileSync(
    "deployment-testnet.json",
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("✓ Deployment info saved to deployment-testnet.json");
  
  console.log("\n=== DEPLOYMENT COMPLETE ===");
  console.log("\nContract Addresses:");
  console.log("CampaignToken:", campaignTokenAddress);
  console.log("SoulboundMember:", soulboundMemberAddress);
  console.log("PetitionPlatform:", petitionPlatformAddress);
  
  console.log("\nBlockscout URLs:");
  console.log("CampaignToken:", deploymentInfo.explorerUrls.CampaignToken);
  console.log("SoulboundMember:", deploymentInfo.explorerUrls.SoulboundMember);
  console.log("PetitionPlatform:", deploymentInfo.explorerUrls.PetitionPlatform);
  
  console.log("\n=== NEXT STEPS ===");
  console.log("1. Verify contracts:");
  console.log("   npx hardhat run scripts/verify-contracts.ts --network liskSepolia");
  console.log("\n2. Test contracts:");
  console.log("   npx hardhat run scripts/test-functions.ts --network liskSepolia");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });