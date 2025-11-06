import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
  console.log("=== Testing Contract Functions ===\n");
  
  // Load deployment info
  const networkName = (await ethers.provider.getNetwork()).name;
  const deploymentFile = networkName === "unknown" 
    ? "deployment-local.json" 
    : "deployment-testnet.json";
  
  if (!fs.existsSync(deploymentFile)) {
    console.error(`❌ Deployment file not found: ${deploymentFile}`);
    console.log("Please deploy contracts first using:");
    console.log(`  npx hardhat run scripts/deploy${networkName === "unknown" ? "" : "-testnet"}.ts --network ${networkName === "unknown" ? "localhost" : "liskSepolia"}`);
    return;
  }
  
  const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  console.log("Using deployment from:", deploymentFile);
  console.log("Network:", deploymentInfo.network);
  console.log("Chain ID:", deploymentInfo.chainId, "\n");
  
  // Get signers
  const [deployer, user1, user2] = await ethers.getSigners();
  console.log("Test accounts:");
  console.log("  Deployer:", deployer.address);
  console.log("  User1:", user1.address);
  console.log("  User2:", user2.address);
  
  // Get contract instances
  const campaignToken = await ethers.getContractAt(
    "CampaignToken",
    deploymentInfo.contracts.CampaignToken
  );
  
  const soulboundMember = await ethers.getContractAt(
    "SoulboundMember",
    deploymentInfo.contracts.SoulboundMember
  );
  
  const petitionPlatform = await ethers.getContractAt(
    "PetitionPlatform",
    deploymentInfo.contracts.PetitionPlatform
  );
  
  // Test 1: Mint SBT for User1
  console.log("\n=== TEST 1: Mint Soulbound Member (User1) ===");
  console.log("Checking if User1 already minted...");
  let hasMinted = await soulboundMember.hasMinted(user1.address);
  
  if (hasMinted) {
    console.log("User1 already has SBT, skipping mint");
  } else {
    console.log("Minting SBT for User1...");
    let tx = await soulboundMember.connect(user1).mintMembership();
    await tx.wait();
    console.log("✓ User1 minted SBT successfully");
  }
  
  let isMember = await soulboundMember.isMember(user1.address);
  console.log("User1 is member:", isMember);
  
  let tokenBalance = await campaignToken.balanceOf(user1.address);
  console.log("User1 CampaignToken balance:", ethers.formatEther(tokenBalance), "CAMP");
  
  // Test 2: Mint SBT for User2
  console.log("\n=== TEST 2: Mint Soulbound Member (User2) ===");
  hasMinted = await soulboundMember.hasMinted(user2.address);
  
  if (hasMinted) {
    console.log("User2 already has SBT, skipping mint");
  } else {
    console.log("Minting SBT for User2...");
    let tx = await soulboundMember.connect(user2).mintMembership();
    await tx.wait();
    console.log("✓ User2 minted SBT successfully");
  }
  
  // Test 3: Create Petition with Token (User1)
  console.log("\n=== TEST 3: Create Petition with CampaignToken (User1) ===");
  tokenBalance = await campaignToken.balanceOf(user1.address);
  console.log("User1 token balance before:", ethers.formatEther(tokenBalance), "CAMP");
  
  if (tokenBalance >= ethers.parseEther("1")) {
    console.log("Creating petition with token...");
    let tx = await petitionPlatform.connect(user1).createPetition(
      "Stop Deforestation",
      "We need to protect our forests for future generations",
      "QmXxxx...ipfsHash",
      true // useToken = true
    );
    await tx.wait();
    console.log("✓ Petition created successfully");
    
    tokenBalance = await campaignToken.balanceOf(user1.address);
    console.log("User1 token balance after:", ethers.formatEther(tokenBalance), "CAMP");
  } else {
    console.log("⚠ User1 doesn't have enough tokens, skipping");
  }
  
  let totalPetitions = await petitionPlatform.getTotalPetitions();
  console.log("Total petitions:", totalPetitions.toString());
  
  // Test 4: Create Petition with ETH (User1)
  console.log("\n=== TEST 4: Create Petition with ETH Payment (User1) ===");
  const baseFee = await petitionPlatform.baseCampaignFee();
  console.log("Base campaign fee:", ethers.formatEther(baseFee), "ETH");
  
  let tx = await petitionPlatform.connect(user1).createPetition(
    "Clean Water Initiative",
    "Ensure access to clean water for all communities",
    "QmYyyy...ipfsHash",
    false, // useToken = false
    { value: baseFee }
  );
  await tx.wait();
  console.log("✓ Paid petition created successfully");
  
  totalPetitions = await petitionPlatform.getTotalPetitions();
  console.log("Total petitions:", totalPetitions.toString());
  
  // Test 5: Get Petition Details
  console.log("\n=== TEST 5: Get Petition Details ===");
  if (totalPetitions > 0n) {
    const petition = await petitionPlatform.getPetition(0);
    console.log("Petition #0:");
    console.log("  Title:", petition.title);
    console.log("  Creator:", petition.creator);
    console.log("  Signatures:", petition.signatureCount.toString());
    console.log("  Created:", new Date(Number(petition.createdAt) * 1000).toLocaleString());
  }
  
  // Test 6: Sign Petition (User2 signs User1's petition)
  console.log("\n=== TEST 6: Sign Petition (User2 signs petition #0) ===");
  if (totalPetitions > 0n) {
    const hasSignedBefore = await petitionPlatform.hasUserSigned(0, user2.address);
    
    if (hasSignedBefore) {
      console.log("User2 already signed this petition");
    } else {
      console.log("User2 signing petition...");
      tx = await petitionPlatform.connect(user2).signPetition(0);
      await tx.wait();
      console.log("✓ User2 signed petition successfully");
      
      const petition = await petitionPlatform.getPetition(0);
      console.log("Updated signature count:", petition.signatureCount.toString());
    }
    
    const hasSigned = await petitionPlatform.hasUserSigned(0, user2.address);
    console.log("User2 has signed petition #0:", hasSigned);
  }
  
  // Test 7: Try to sign own petition (should fail)
  console.log("\n=== TEST 7: Try to Sign Own Petition (Should Fail) ===");
  if (totalPetitions > 0n) {
    try {
      tx = await petitionPlatform.connect(user1).signPetition(0);
      await tx.wait();
      console.log("❌ ERROR: Should have failed!");
    } catch (error: any) {
      console.log("✓ Correctly prevented creator from signing own petition");
      console.log("  Error:", error.message.split('\n')[0]);
    }
  }
  
  // Test 8: Boost Petition
  console.log("\n=== TEST 8: Boost Petition (User1 boosts petition #0) ===");
  if (totalPetitions > 0n) {
    const boostFee = await petitionPlatform.boostingFee();
    console.log("Boost fee:", ethers.formatEther(boostFee), "ETH");
    
    console.log("Boosting petition...");
    tx = await petitionPlatform.connect(user1).boostPetition(0, { value: boostFee });
    await tx.wait();
    console.log("✓ Petition boosted successfully");
    
    const petition = await petitionPlatform.getPetition(0);
    console.log("Boost details:");
    console.log("  Boost end time:", new Date(Number(petition.boostEndTime) * 1000).toLocaleString());
    console.log("  Boost priority:", petition.boostPriority.toString());
    
    const isBoosted = await petitionPlatform.isPetitionBoosted(0);
    console.log("  Is boosted:", isBoosted);
  }
  
  // Test 9: Get All Petitions
  console.log("\n=== TEST 9: Get All Petitions ===");
  const allPetitions = await petitionPlatform.getAllPetitions();
  console.log("Total petitions:", allPetitions.length);
  
  for (let i = 0; i < allPetitions.length; i++) {
    const p = allPetitions[i];
    console.log(`\nPetition #${i}:`);
    console.log("  Title:", p.title);
    console.log("  Creator:", p.creator.slice(0, 6) + "..." + p.creator.slice(-4));
    console.log("  Signatures:", p.signatureCount.toString());
    console.log("  Boosted:", p.boostEndTime > 0n ? "Yes" : "No");
  }
  
  // Test 10: Get Platform Stats
  console.log("\n=== TEST 10: Platform Statistics ===");
  const totalMembers = await soulboundMember.totalSupply();
  totalPetitions = await petitionPlatform.getTotalPetitions();
  const pricingInfo = await petitionPlatform.getPricingInfo();
  
  console.log("Total Members:", totalMembers.toString());
  console.log("Total Petitions:", totalPetitions.toString());
  console.log("Base Campaign Fee:", ethers.formatEther(pricingInfo[0]), "ETH");
  console.log("Boosting Fee:", ethers.formatEther(pricingInfo[1]), "ETH");
  console.log("Reward Threshold:", pricingInfo[2].toString(), "petitions");
  
  console.log("\n=== ALL TESTS COMPLETED ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });