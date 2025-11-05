// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SoulboundMember
 * @notice Implementasi SBT (Non-Transferable ERC-721)
 * @dev Token ini tidak dapat ditransfer setelah di-mint (soulbound)
 */

interface ICampaignToken {
    function mint(address to, uint256 amount) external;
}

contract SoulboundMember is ERC721, Ownable, ReentrancyGuard {
    uint256 private tokenCounter;
    address public petitionContract;
    ICampaignToken public campaignToken;
    
    mapping(address => bool) public hasMinted;
    
    event MembershipMinted(address indexed user, uint256 tokenId);
    event PetitionContractUpdated(address indexed newContract);
    
    constructor(address _campaignToken) ERC721("Soulbound Member", "SBTM") Ownable(msg.sender) {
        require(_campaignToken != address(0), "Invalid token address");
        campaignToken = ICampaignToken(_campaignToken);
    }
    
    /**
     * @dev Set address PetitionPlatform contract
     */
    function setPetitionContract(address _petitionContract) external onlyOwner {
        require(_petitionContract != address(0), "Invalid address");
        petitionContract = _petitionContract;
        emit PetitionContractUpdated(_petitionContract);
    }
    
    /**
     * @dev Mint NFT Membership
     * User hanya bisa mint 1x per wallet
     * Setelah mint, user dapat 1 Campaign Token gratis (untuk 1 petisi gratis)
     */
    function mintMembership() external nonReentrant {
        require(!hasMinted[msg.sender], "Already minted");
        
        uint256 tokenId = tokenCounter;
        tokenCounter++;
        
        _safeMint(msg.sender, tokenId);
        hasMinted[msg.sender] = true;
        
        // Give 1 free campaign token (1 * 10^18 = 1 token dengan 18 decimals)
        campaignToken.mint(msg.sender, 1 * 10**18);
        
        emit MembershipMinted(msg.sender, tokenId);
    }
    
    /**
     * @dev Check apakah address adalah member (punya NFT)
     */
    function isMember(address user) external view returns (bool) {
        return balanceOf(user) > 0;
    }
    
    /**
     * @dev Override transfer functions untuk membuat token Non-Transferable (Soulbound)
     */
    function _update(address to, uint256 tokenId, address auth) 
        internal 
        virtual 
        override 
        returns (address) 
    {
        address from = _ownerOf(tokenId);
        
        // Allow minting (from == address(0))
        // Block all transfers (from != address(0) && to != address(0))
        // Allow burning (to == address(0))
        require(
            from == address(0) || to == address(0), 
            "SBT: Token is non-transferable"
        );
        
        return super._update(to, tokenId, auth);
    }
    
    /**
     * @dev Get total supply of minted tokens
     */
    function totalSupply() external view returns (uint256) {
        return tokenCounter;
    }
}