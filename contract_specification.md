# DAO Petition Platform - Smart Contract Specification

## Table of Contents
1. [Overview](#overview)
2. [Economic Model](#economic-model)
3. [Contract Architecture](#contract-architecture)
4. [Technical Specifications](#technical-specifications)
5. [Fee Structure](#fee-structure)
6. [Token Economics](#token-economics)
7. [User Roles](#user-roles)
8. [Core Functions](#core-functions)
9. [Security Features](#security-features)
10. [Gas Costs Estimation](#gas-costs-estimation)

---

## Overview

### Platform Purpose
Decentralized petition platform that enables transparent, fair, and tamper-proof petition campaigns with blockchain-based voting mechanism.

### Key Features
- Public signing (free for all users)
- Creator registration via NFT membership
- Dual payment system (ETH or Campaign Token)
- Automatic reward distribution
- IPFS-based image storage
- One wallet = one signature per petition

---

## Economic Model

### Cost Structure

| Action | Cost | Payment Method | Recipient |
|--------|------|----------------|-----------|
| Mint NFT Membership | 0.02 ETH | ETH | Platform |
| Create Petition (First Time) | FREE | 1 Campaign Token (included with NFT) | N/A |
| Create Petition (Paid) | 0.01 ETH | ETH | Platform |
| Create Petition (Token) | FREE | 1 Campaign Token | N/A |
| Sign Petition | FREE | N/A | N/A |

### Revenue Sources
1. NFT Membership Sales: 0.02 ETH per mint
2. Petition Creation Fees: 0.01 ETH per paid petition
3. NFT Royalties: (if implemented on secondary market)

### Token Distribution
- Initial Supply: 0 tokens (minted on-demand)
- Mint on NFT Purchase: 1 token per NFT
- Reward Mechanism: 1 token per 5 paid petitions
- Max Supply: Unlimited (controlled by platform activity)
- Decimal Places: 18 (standard ERC-20)

---

## Contract Architecture

### Three-Contract System

```
CampaignToken (ERC-20)
    ↓
DAOMembership (ERC-721)
    ↓
PetitionPlatform (Core Logic)
```

### Contract Dependencies
- CampaignToken requires PetitionPlatform address for mint/burn authorization
- DAOMembership requires CampaignToken address for initial token distribution
- PetitionPlatform requires both addresses for membership verification and token operations

---

## Technical Specifications

### CampaignToken Contract

**Standard**: ERC-20  
**Name**: Campaign Token  
**Symbol**: CAMP  
**Decimals**: 18  

**Key Properties**:
- Non-transferable by design (soulbound - optional implementation)
- Mintable only by authorized contracts
- Burnable during petition creation

**Functions**:
- `mint(address to, uint256 amount)`: Mint tokens (restricted)
- `burnFrom(address from, uint256 amount)`: Burn tokens (restricted)
- `setPetitionContract(address)`: Set authorized minter (owner only)

---

### DAOMembership Contract

**Standard**: ERC-721  
**Name**: DAO Membership  
**Symbol**: DAONFT  

**Mint Configuration**:
- Price: 0.02 ETH (configurable by owner)
- Limit: 1 NFT per wallet address
- Bonus: 1 Campaign Token automatically minted on purchase

**Functions**:
- `mintMembership()`: Purchase membership NFT
- `isMember(address)`: Check membership status
- `setMintPrice(uint256)`: Update mint price (owner only)
- `withdraw()`: Withdraw collected ETH (owner only)

**State Variables**:
- `tokenCounter`: Total NFTs minted
- `mintPrice`: Current price (default: 0.02 ETH)
- `hasMinted`: Mapping to prevent duplicate mints per address

---

### PetitionPlatform Contract

**Core Logic Contract**

**Configuration**:
- Campaign Fee: 0.01 ETH (configurable)
- Reward Threshold: 5 paid petitions (configurable)
- Max Duration: 365 days
- Min Duration: 1 day

**Data Structure - Petition**:
```solidity
struct Petition {
    uint256 id;              // Unique identifier
    string title;            // Petition title
    string description;      // Full description
    string imageHash;        // IPFS hash for image
    address creator;         // Creator wallet address
    uint256 createdAt;       // Creation timestamp
    uint256 deadline;        // Expiry timestamp
    uint256 signatureCount;  // Total signatures
    bool isActive;           // Active status
}
```

**Key Mappings**:
- `petitions`: Petition ID to Petition data
- `paidPetitionCount`: Creator address to paid petition count
- `hasSigned`: Petition ID to signer address to boolean

---

## Fee Structure

### Membership Acquisition
```
Input:  0.02 ETH
Output: 1 DAO Membership NFT + 1 Campaign Token
Net Cost: 0.02 ETH for unlimited petition signing + 1 free petition
```

### Petition Creation Options

**Option 1: Use Campaign Token**
```
Input:  1 Campaign Token
Output: 1 Petition created
Net Cost: FREE (token is burned)
```

**Option 2: Pay with ETH**
```
Input:  0.01 ETH
Output: 1 Petition created
Net Cost: 0.01 ETH
Benefit: Counts toward reward threshold
```

### Signing Petitions
```
Input:  None (completely free)
Output: 1 signature added to petition
Limitation: 1 signature per wallet per petition
```

---

## Token Economics

### Campaign Token Value

**Direct Value**:
- 1 Campaign Token = 1 Free Petition Creation
- 1 Free Petition = 0.01 ETH saved

**Implicit Value Equation**:
```
1 Campaign Token ≈ 0.01 ETH
```

### Token Acquisition Methods

1. **Initial Bonus** (One-time)
   - Mint NFT Membership → Receive 1 token
   - Cost: 0.02 ETH

2. **Reward System** (Recurring)
   - Create 5 paid petitions → Receive 1 token
   - Cost: 0.05 ETH (5 × 0.01 ETH)
   - Reward Value: 0.01 ETH
   - Effective Discount: 20% on 6th petition

### Token Lifecycle

```
Mint Event:
- NFT Purchase: +1 token to buyer
- Reward Trigger: +1 token to creator (every 5th paid petition)

Burn Event:
- Petition Creation: -1 token from creator (when using token payment)
```

### Supply Dynamics

**Inflationary by Design**:
- New tokens minted with each NFT purchase
- New tokens minted as rewards
- Tokens burned when used for petitions

**Supply Formula**:
```
Total Supply = (NFTs Minted × 1) + (Rewards Distributed × 1) - (Tokens Burned)
```

**Example Calculation**:
```
Scenario:
- 100 NFTs minted = 100 tokens
- 1000 paid petitions created = 200 reward tokens (1000 ÷ 5)
- 150 tokens used for free petitions = -150 tokens

Total Circulating Supply = 100 + 200 - 150 = 150 tokens
```

---

## User Roles

### Role 1: Public User (Non-Member)

**Capabilities**:
- Sign any active petition (free)
- View all petitions (read-only)

**Limitations**:
- Cannot create petitions
- Cannot receive rewards

**Cost to Participate**: 0 ETH

---

### Role 2: DAO Member (NFT Holder)

**Capabilities**:
- All public user capabilities
- Create unlimited petitions
- Earn Campaign Token rewards
- Close own petitions before deadline

**Requirements**:
- Own at least 1 DAO Membership NFT
- Sufficient balance (ETH or Campaign Token) for petition creation

**Acquisition Cost**: 0.02 ETH (one-time)

---

### Role 3: Platform Owner

**Capabilities**:
- Withdraw accumulated fees
- Update campaign fee amount
- Update reward threshold
- Update NFT mint price
- Close any petition (emergency only)
- Set contract addresses during deployment

**Restrictions**:
- Cannot modify existing petitions
- Cannot sign on behalf of users
- Cannot mint tokens outside reward system

---

## Core Functions

### 1. Mint Membership

**Function**: `mintMembership()`  
**Access**: Public (payable)  
**Cost**: 0.02 ETH  

**Process**:
1. Validate payment amount
2. Check user hasn't minted before
3. Mint NFT to user
4. Mint 1 Campaign Token to user
5. Emit MembershipMinted event

**Restrictions**:
- One NFT per wallet address
- Must send exact or higher mint price

---

### 2. Create Petition

**Function**: `createPetition(title, description, imageHash, durationInDays)`  
**Access**: DAO Members only  
**Cost**: 0.01 ETH OR 1 Campaign Token  

**Process**:
1. Verify user is DAO member
2. Validate input parameters
3. Check payment method (token or ETH)
4. If token: burn 1 token from user
5. If ETH: collect fee, increment paid counter
6. If 5th paid petition: mint reward token
7. Create petition struct
8. Emit PetitionCreated event

**Validations**:
- Title must not be empty
- Description must not be empty
- Image hash must not be empty
- Duration between 1-365 days
- Sufficient balance (ETH or token)

**Payment Logic**:
```
IF user has >= 1 Campaign Token:
    Burn 1 token
    usedToken = true
ELSE:
    Require msg.value >= 0.01 ETH
    paidPetitionCount++
    IF paidPetitionCount % 5 == 0:
        Mint 1 reward token
```

---

### 3. Sign Petition

**Function**: `signPetition(petitionId)`  
**Access**: Public (free)  
**Cost**: 0 ETH  

**Process**:
1. Validate petition exists
2. Check petition is active
3. Check petition not expired
4. Verify user hasn't signed before
5. Mark user as signed
6. Increment signature count
7. Emit PetitionSigned event

**Restrictions**:
- One signature per wallet per petition
- Cannot sign closed petitions
- Cannot sign expired petitions

---

### 4. Close Petition

**Function**: `closePetition(petitionId)`  
**Access**: Creator or Owner only  
**Cost**: 0 ETH  

**Process**:
1. Validate petition exists
2. Verify caller is creator or owner
3. Check petition is currently active
4. Set isActive to false
5. Emit PetitionClosed event

**Effect**:
- Petition no longer accepts signatures
- Existing signatures remain recorded
- Petition data remains viewable

---

## Security Features

### Access Control

**Ownable Pattern**:
- Critical functions restricted to owner
- Owner can withdraw funds
- Owner can update parameters
- No owner can modify user data

**Role-Based Access**:
- Member verification via NFT ownership
- Creator verification for petition closure
- Public access for signing

### Reentrancy Protection

**ReentrancyGuard**:
- Applied to all payable functions
- Applied to state-changing functions
- Prevents reentrancy attacks

**Protected Functions**:
- `mintMembership()`
- `createPetition()`
- `withdraw()`

### Input Validation

**String Length Checks**:
- Title: must not be empty
- Description: must not be empty
- Image hash: must not be empty

**Numeric Range Checks**:
- Duration: 1-365 days
- Payment: exact or higher than required

**Duplicate Prevention**:
- One NFT per address
- One signature per address per petition

### State Management

**Boolean Flags**:
- `isActive`: Prevents modification of closed petitions
- `hasSigned`: Prevents duplicate signatures
- `hasMinted`: Prevents duplicate NFT mints

**Timestamp Validation**:
- Deadline checking prevents late signatures
- Creation timestamp for audit trail

---

## Gas Costs Estimation

### Network: Ethereum Mainnet (approximate values)

| Function | Estimated Gas | At 50 Gwei | At 100 Gwei |
|----------|--------------|------------|-------------|
| Mint NFT Membership | ~150,000 | ~0.0075 ETH | ~0.015 ETH |
| Create Petition (First/Token) | ~180,000 | ~0.009 ETH | ~0.018 ETH |
| Create Petition (Paid) | ~200,000 | ~0.010 ETH | ~0.020 ETH |
| Create Petition (5th - with reward) | ~250,000 | ~0.0125 ETH | ~0.025 ETH |
| Sign Petition | ~70,000 | ~0.0035 ETH | ~0.007 ETH |
| Close Petition | ~50,000 | ~0.0025 ETH | ~0.005 ETH |
| Withdraw Funds | ~40,000 | ~0.002 ETH | ~0.004 ETH |

### Total Cost Breakdown

**Scenario A: Regular Creator (Uses ETH)**
```
NFT Mint:           0.02 ETH + 0.0075 gas = 0.0275 ETH
First Petition:     0 ETH (token) + 0.009 gas = 0.009 ETH
5 More Petitions:   0.05 ETH + 0.050 gas = 0.100 ETH
Total for 6:        0.1365 ETH

Reward: 1 Campaign Token (value: 0.01 ETH saved on 7th petition)
```

**Scenario B: Frequent Creator (Uses Rewards)**
```
NFT Mint:           0.02 ETH + 0.0075 gas = 0.0275 ETH
10 Paid Petitions:  0.10 ETH + 0.100 gas = 0.200 ETH
2 Token Petitions:  0 ETH + 0.018 gas = 0.018 ETH
Total for 12:       0.2455 ETH (avg 0.020 ETH per petition)

Without rewards:    12 × 0.01 = 0.12 ETH
Savings:           0.02 ETH (16.7% discount)
```

**Scenario C: Public User (Signing Only)**
```
Sign 10 Petitions:  0 ETH + 0.035 gas = 0.035 ETH total
Cost per sign:      0.0035 ETH (only gas)
```

---

## Implementation Notes

### Deployment Order
1. Deploy CampaignToken
2. Deploy DAOMembership (with CampaignToken address)
3. Deploy PetitionPlatform (with both addresses)
4. Call setPetitionContract() on CampaignToken
5. Call setPetitionContract() on DAOMembership

### Configuration Variables (Owner Adjustable)

**DAOMembership**:
- `mintPrice`: Default 0.02 ETH

**PetitionPlatform**:
- `campaignFee`: Default 0.01 ETH
- `rewardThreshold`: Default 5 paid petitions

### Upgrade Path
Current implementation is not upgradeable. For production:
- Consider proxy pattern for upgradeability
- Implement timelock for parameter changes
- Add emergency pause functionality
- Implement multisig for owner functions

---

## Compliance Considerations

### Data Storage
- Personal data: None (only wallet addresses)
- Image storage: Off-chain (IPFS)
- Text content: On-chain (immutable)

### Financial Regulations
- Platform fee collection: Transparent on-chain
- No investment returns promised
- Pure utility token (Campaign Token)
- No secondary market facilitation

### Intellectual Property
- User-generated content responsibility with users
- Platform acts as neutral infrastructure
- No content moderation mechanism implemented
- Consider adding content reporting in production

---

## Risk Analysis

### Smart Contract Risks
- **Oracle Dependency**: None (fully self-contained)
- **External Calls**: Minimal (only to owned contracts)
- **Centralization**: Owner has withdrawal and parameter control
- **Upgradeability**: Not implemented (immutable after deployment)

### Economic Risks
- **Token Value**: Dependent on petition creation fee
- **Spam Protection**: Limited to membership requirement
- **Fee Collection**: Centralized to owner address

### Operational Risks
- **IPFS Availability**: Images depend on IPFS network
- **Gas Costs**: Variable based on network congestion
- **Scalability**: Limited by Ethereum throughput

---

## Future Enhancements

### Suggested Improvements
1. Implement token transferability with governance
2. Add petition categories/tags
3. Implement petition search functionality
4. Add milestone-based rewards
5. Implement DAO governance for parameter changes
6. Add petition success thresholds
7. Implement automatic petition archival
8. Add petition delegation mechanism

### Scaling Solutions
1. Deploy on Layer 2 (Arbitrum, Optimism)
2. Implement signature batching
3. Use off-chain signatures with on-chain verification
4. Implement state channels for high-frequency signers

---

## Conclusion

This smart contract system provides a complete decentralized petition platform with:

- Clear economic incentives for creators
- Zero-cost participation for public users
- Sustainable reward mechanism
- Transparent fee structure
- Fair voting system (one wallet = one vote)

The dual payment system (ETH/Token) balances platform sustainability with user accessibility, while the reward mechanism encourages quality petition creation over quantity.

Total platform entry cost for creators: 0.02 ETH
Total platform entry cost for signers: FREE
Average petition creation cost: 0.01 ETH (or free with tokens)

The system is designed for long-term sustainability through fee collection while maintaining fairness through reward distribution.