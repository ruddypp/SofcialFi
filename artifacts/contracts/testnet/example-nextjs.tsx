// // Next.js 14+ with App Router Example
// 'use client';

// import { ethers } from 'ethers';
// import { useState, useEffect } from 'react';
// import contractsConfig from './contracts.json';

// export default function PetitionApp() {
//   const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
//   const [signer, setSigner] = useState<ethers.Signer | null>(null);
//   const [account, setAccount] = useState<string>('');
//   const [contracts, setContracts] = useState<any>({});

//   // Initialize contracts
//   useEffect(() => {
//     const init = async () => {
//       if (typeof window.ethereum !== 'undefined') {
//         const browserProvider = new ethers.BrowserProvider(window.ethereum);
//         setProvider(browserProvider);

//         // Request account access
//         const accounts = await browserProvider.send('eth_requestAccounts', []);
//         setAccount(accounts[0]);

//         const signer = await browserProvider.getSigner();
//         setSigner(signer);

//         // Initialize contract instances
//         const campaignToken = new ethers.Contract(
//           contractsConfig.contracts.CampaignToken.address,
//           contractsConfig.contracts.CampaignToken.abi,
//           signer
//         );

//         const soulboundMember = new ethers.Contract(
//           contractsConfig.contracts.SoulboundMember.address,
//           contractsConfig.contracts.SoulboundMember.abi,
//           signer
//         );

//         const petitionPlatform = new ethers.Contract(
//           contractsConfig.contracts.PetitionPlatform.address,
//           contractsConfig.contracts.PetitionPlatform.abi,
//           signer
//         );

//         setContracts({ campaignToken, soulboundMember, petitionPlatform });
//       }
//     };

//     init();
//   }, []);

//   // Example: Mint SBT
//   const mintSBT = async () => {
//     try {
//       const tx = await contracts.soulboundMember.mintMembership();
//       await tx.wait();
//       console.log('SBT Minted!');
//     } catch (error) {
//       console.error('Error minting SBT:', error);
//     }
//   };

//   // Example: Create Petition
//   const createPetition = async (title: string, description: string, ipfsHash: string) => {
//     try {
//       const useToken = true; // or false to pay with ETH
//       const tx = await contracts.petitionPlatform.createPetition(
//         title,
//         description,
//         ipfsHash,
//         useToken
//       );
//       await tx.wait();
//       console.log('Petition Created!');
//     } catch (error) {
//       console.error('Error creating petition:', error);
//     }
//   };

//   // Example: Get Token Balance
//   const getTokenBalance = async () => {
//     try {
//       const balance = await contracts.campaignToken.balanceOf(account);
//       console.log('Balance:', ethers.formatEther(balance), 'CAMP');
//       return balance;
//     } catch (error) {
//       console.error('Error getting balance:', error);
//     }
//   };

//   return (
//     <div>
//       <h1>Petition Platform</h1>
//       <p>Connected Account: {account}</p>
//       <button onClick={mintSBT}>Mint SBT</button>
//       <button onClick={getTokenBalance}>Check Balance</button>
//     </div>
//   );
// }

// // Network Configuration
// export const networkConfig = {
//   chainId: `0x${contractsConfig.chainId.toString(16)}`, // 0x106a
//   chainName: 'Lisk Sepolia',
//   nativeCurrency: {
//     name: 'Ether',
//     symbol: 'ETH',
//     decimals: 18,
//   },
//   rpcUrls: [contractsConfig.rpcUrl],
//   blockExplorerUrls: [contractsConfig.blockExplorer],
// };

// // Helper: Add Lisk Sepolia to MetaMask
// export async function addLiskSepoliaNetwork() {
//   try {
//     await window.ethereum.request({
//       method: 'wallet_addEthereumChain',
//       params: [networkConfig],
//     });
//   } catch (error) {
//     console.error('Error adding network:', error);
//   }
// }
