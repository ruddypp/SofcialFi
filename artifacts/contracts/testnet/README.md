# Frontend Integration Guide

## 📁 Files Generated

- `contracts.json` - All-in-one config (addresses + ABIs)
- `addresses.json` - Contract addresses only (lightweight)
- `CampaignToken.abi.json` - CampaignToken ABI
- `SoulboundMember.abi.json` - SoulboundMember ABI
- `PetitionPlatform.abi.json` - PetitionPlatform ABI
- `example-nextjs.tsx` - Next.js integration example
- `example-react.tsx` - React integration example

## 🚀 Quick Start

### Option 1: Use All-in-One Config (Recommended)

```typescript
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
```

### Option 2: Import Separately

```typescript
import addresses from './addresses.json';
import campaignTokenABI from './CampaignToken.abi.json';

const contract = new ethers.Contract(
  addresses.CampaignToken,
  campaignTokenABI,
  signer
);
```

## 📦 Installation

```bash
npm install ethers
```

## 🔧 Network Info

- **Network:** liskSepolia
- **Chain ID:** 4202
- **RPC URL:** https://rpc.sepolia-api.lisk.com
- **Explorer:** https://sepolia-blockscout.lisk.com

## 📝 Contract Addresses

- **CampaignToken:** 0x7D3e8350c2a87b9d61816975CFe0cd18CC4e7B30
- **SoulboundMember:** 0x9F090D06638f7d32915065d51BE2E737b8E6bDaB
- **PetitionPlatform:** 0x4Ec2EEc9D8071DBB9e4ba332e93d6624fF614D8b

## 🔗 Explorer Links

- [CampaignToken](https://sepolia-blockscout.lisk.com/address/0x7D3e8350c2a87b9d61816975CFe0cd18CC4e7B30)
- [SoulboundMember](https://sepolia-blockscout.lisk.com/address/0x9F090D06638f7d32915065d51BE2E737b8E6bDaB)
- [PetitionPlatform](https://sepolia-blockscout.lisk.com/address/0x4Ec2EEc9D8071DBB9e4ba332e93d6624fF614D8b)

## 💡 Usage Examples

### Connect Wallet

```typescript
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
```

### Mint Soulbound Member

```typescript
const soulboundMember = new ethers.Contract(
  contractsConfig.contracts.SoulboundMember.address,
  contractsConfig.contracts.SoulboundMember.abi,
  signer
);

const tx = await soulboundMember.mintMembership();
await tx.wait();
```

### Create Petition

```typescript
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
```

### Check Token Balance

```typescript
const campaignToken = new ethers.Contract(
  contractsConfig.contracts.CampaignToken.address,
  contractsConfig.contracts.CampaignToken.abi,
  signer
);

const balance = await campaignToken.balanceOf(address);
console.log('Balance:', ethers.formatEther(balance), 'CAMP');
```

## 🌐 Add Network to MetaMask

```typescript
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
```

## 📚 Resources

- [Ethers.js Documentation](https://docs.ethers.org/)
- [Lisk Sepolia Faucet](https://sepolia-faucet.lisk.com/)
- [Lisk Documentation](https://docs.lisk.com/)
