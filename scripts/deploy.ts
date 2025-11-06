import { ethers } from "hardhat";

async function main() {
  console.log("=== Deploying Contracts to Local Network ===\n");
  
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
  console.log("✓ CampaignToken deployed to:", campaignTokenAddress);
  
  // 2. Deploy SoulboundMember
  console.log("\n2. Deploying SoulboundMember...");
  const SoulboundMember = await ethers.getContractFactory("SoulboundMember");
  const soulboundMember = await SoulboundMember.deploy(campaignTokenAddress);
  await soulboundMember.waitForDeployment();
  const soulboundMemberAddress = await soulboundMember.getAddress();
  console.log("✓ SoulboundMember deployed to:", soulboundMemberAddress);
  
  // 3. Deploy PetitionPlatform
  console.log("\n3. Deploying PetitionPlatform...");
  const PetitionPlatform = await ethers.getContractFactory("PetitionPlatform");
  const petitionPlatform = await PetitionPlatform.deploy(
    soulboundMemberAddress,
    campaignTokenAddress
  );
  await petitionPlatform.waitForDeployment();
  const petitionPlatformAddress = await petitionPlatform.getAddress();
  console.log("✓ PetitionPlatform deployed to:", petitionPlatformAddress);
  
  // 4. Setup connections
  console.log("\n4. Setting up contract connections...");
  
  console.log("  - Setting SoulboundMember in CampaignToken...");
  let tx = await campaignToken.setSoulboundMemberContract(soulboundMemberAddress);
  await tx.wait();
  console.log("  ✓ Done");
  
  console.log("  - Setting PetitionPlatform in CampaignToken...");
  tx = await campaignToken.setPetitionContract(petitionPlatformAddress);
  await tx.wait();
  console.log("  ✓ Done");
  
  console.log("  - Setting PetitionPlatform in SoulboundMember...");
  tx = await soulboundMember.setPetitionContract(petitionPlatformAddress);
  await tx.wait();
  console.log("  ✓ Done");
  
  // 5. Verify setup
  console.log("\n5. Verifying setup...");
  const sbtInCampaign = await campaignToken.soulboundMemberContract();
  const petitionInCampaign = await campaignToken.petitionContract();
  const petitionInSbt = await soulboundMember.petitionContract();
  
  console.log("  CampaignToken.soulboundMemberContract:", sbtInCampaign);
  console.log("  CampaignToken.petitionContract:", petitionInCampaign);
  console.log("  SoulboundMember.petitionContract:", petitionInSbt);
  
  const allCorrect = 
    sbtInCampaign === soulboundMemberAddress &&
    petitionInCampaign === petitionPlatformAddress &&
    petitionInSbt === petitionPlatformAddress;
  
  if (allCorrect) {
    console.log("\n✓ All contract connections verified successfully!");
  } else {
    console.log("\n✗ Contract connections verification failed!");
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