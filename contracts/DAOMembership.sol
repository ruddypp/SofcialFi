// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface ICampaignToken {
    function mint(address to, uint256 amount) external;
}

/**
 * @title DAOMembership
 * @dev ERC-721 NFT untuk membership DAO
 * User yang mint NFT ini bisa membuat petition
 * Saat mint, user mendapat 1 Campaign Token gratis
 */
contract DAOMembership is ERC721, Ownable, ReentrancyGuard {
    uint256 public tokenCounter;
    uint256 public mintPrice = 0.02 ether;
    
    ICampaignToken public campaignToken;
    address public petitionContract;
    
    mapping(address => bool) public hasMinted;
    
    event MembershipMinted(address indexed user, uint256 tokenId);
    event MintPriceUpdated(uint256 newPrice);
    
    constructor(address _campaignToken) ERC721("DAO Membership", "DAONFT") Ownable(msg.sender) {
        require(_campaignToken != address(0), "Invalid token address");
        campaignToken = ICampaignToken(_campaignToken);
    }
    
    /**
     * @dev Set address PetitionPlatform contract
     */
    function setPetitionContract(address _petitionContract) external onlyOwner {
        require(_petitionContract != address(0), "Invalid address");
        petitionContract = _petitionContract;
    }
    
    /**
     * @dev Mint NFT Membership
     * User harus bayar mintPrice dan hanya bisa mint 1x per wallet
     * Setelah mint, user dapat 1 Campaign Token gratis
     */
    function mintMembership() external payable nonReentrant {
        require(!hasMinted[msg.sender], "Already minted");
        require(msg.value >= mintPrice, "Insufficient payment");
        
        uint256 tokenId = tokenCounter;
        tokenCounter++;
        
        _safeMint(msg.sender, tokenId);
        hasMinted[msg.sender] = true;
        
        // Give 1 free campaign token (1 * 10^18 = 1 token dengan 18 decimals)
        campaignToken.mint(msg.sender, 1 * 10**18);
        
        emit MembershipMinted(msg.sender, tokenId);
    }
    
    /**
     * @dev Update harga mint NFT
     */
    function setMintPrice(uint256 _price) external onlyOwner {
        mintPrice = _price;
        emit MintPriceUpdated(_price);
    }
    
    /**
     * @dev Withdraw ETH dari contract ke owner
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        payable(owner()).transfer(balance);
    }
    
    /**
     * @dev Check apakah address adalah member (punya NFT)
     */
    function isMember(address user) external view returns (bool) {
        return balanceOf(user) > 0;
    }
}