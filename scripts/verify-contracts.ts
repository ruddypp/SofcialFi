import { run } from "hardhat";
import * as fs from "fs";

async function main() {
  console.log("=== Verifying Contracts on Blockscout ===\n");
  
  // Load deployment info
  if (!fs.existsSync("deployment-testnet.json")) {
    console.error("❌ deployment-testnet.json not found");
    console.log("Please deploy to testnet first");
    return;
  }
  
  const deploymentInfo = JSON.parse(fs.readFileSync("deployment-testnet.json", "utf8"));
  
  console.log("Verifying contracts on Lisk Sepolia...\n");
  
  // Verify CampaignToken
  console.log("1. Verifying CampaignToken...");
  try {
    await run("verify:verify", {
      address: deploymentInfo.contracts.CampaignToken,
      constructorArguments: [],
    });
    console.log("✓ CampaignToken verified");
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("✓ CampaignToken already verified");
    } else {
      console.log("❌ Error verifying CampaignToken:", error.message);
    }
  }
  
  // Verify SoulboundMember
  console.log("\n2. Verifying SoulboundMember...");
  try {
    await run("verify:verify", {
      address: deploymentInfo.contracts.SoulboundMember,
      constructorArguments: [deploymentInfo.contracts.CampaignToken],
    });
    console.log("✓ SoulboundMember verified");
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("✓ SoulboundMember already verified");
    } else {
      console.log("❌ Error verifying SoulboundMember:", error.message);
    }
  }
  
  // Verify PetitionPlatform
  console.log("\n3. Verifying PetitionPlatform...");
  try {
    await run("verify:verify", {
      address: deploymentInfo.contracts.PetitionPlatform,
      constructorArguments: [
        deploymentInfo.contracts.SoulboundMember,
        deploymentInfo.contracts.CampaignToken,
      ],
    });
    console.log("✓ PetitionPlatform verified");
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("✓ PetitionPlatform already verified");
    } else {
      console.log("❌ Error verifying PetitionPlatform:", error.message);
    }
  }
  
  console.log("\n=== VERIFICATION COMPLETE ===");
  console.log("\nView contracts on Blockscout:");
  console.log("CampaignToken:", deploymentInfo.explorerUrls.CampaignToken);
  console.log("SoulboundMember:", deploymentInfo.explorerUrls.SoulboundMember);
  console.log("PetitionPlatform:", deploymentInfo.explorerUrls.PetitionPlatform);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });