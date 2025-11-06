// // React + Vite Example
// import { ethers } from 'ethers';
// import { useState, useEffect } from 'react';
// import contractsConfig from './contracts.json';

// function App() {
//   const [provider, setProvider] = useState(null);
//   const [contracts, setContracts] = useState({});
//   const [account, setAccount] = useState('');

//   useEffect(() => {
//     initContracts();
//   }, []);

//   const initContracts = async () => {
//     if (typeof window.ethereum === 'undefined') {
//       alert('Please install MetaMask!');
//       return;
//     }

//     const provider = new ethers.BrowserProvider(window.ethereum);
//     setProvider(provider);

//     const accounts = await provider.send('eth_requestAccounts', []);
//     setAccount(accounts[0]);

//     const signer = await provider.getSigner();

//     // Initialize contracts
//     const campaignToken = new ethers.Contract(
//       contractsConfig.contracts.CampaignToken.address,
//       contractsConfig.contracts.CampaignToken.abi,
//       signer
//     );

//     const soulboundMember = new ethers.Contract(
//       contractsConfig.contracts.SoulboundMember.address,
//       contractsConfig.contracts.SoulboundMember.abi,
//       signer
//     );

//     const petitionPlatform = new ethers.Contract(
//       contractsConfig.contracts.PetitionPlatform.address,
//       contractsConfig.contracts.PetitionPlatform.abi,
//       signer
//     );

//     setContracts({ campaignToken, soulboundMember, petitionPlatform });
//   };

//   const mintSBT = async () => {
//     try {
//       const tx = await contracts.soulboundMember.mintMembership();
//       await tx.wait();
//       alert('SBT Minted Successfully!');
//     } catch (error) {
//       console.error(error);
//       alert('Error minting SBT');
//     }
//   };

//   const createPetition = async () => {
//     try {
//       const tx = await contracts.petitionPlatform.createPetition(
//         'My Petition',
//         'Description here',
//         'QmIPFShash',
//         true // use token
//       );
//       await tx.wait();
//       alert('Petition Created!');
//     } catch (error) {
//       console.error(error);
//       alert('Error creating petition');
//     }
//   };

//   return (
//     <div>
//       <h1>Petition Platform</h1>
//       <p>Account: {account}</p>
//       <button onClick={mintSBT}>Mint SBT</button>
//       <button onClick={createPetition}>Create Petition</button>
//     </div>
//   );
// }

// export default App;
