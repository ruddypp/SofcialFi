// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

/**
 * @title PetitionPlatform
 * @dev Core logic untuk petition voting platform
 * - Hanya DAO member yang bisa buat petition
 * - Petition bisa dibuat dengan Campaign Token atau bayar ETH
 * - Siapa saja bisa sign petition (1 wallet = 1 signature)
 * - Setiap 5 petition berbayar, creator dapat 1 Campaign Token reward
 * - NEW: Durasi campaign bisa diatur dengan pricing dinamis
 */
contract PetitionPlatform is Ownable, ERC1155, ReentrancyGuard {
    struct Petition {
        uint256 id;
        string title;
        string description;
        string imageHash;
        address creator;
        uint256 createdAt;
        uint256 boostingDuration;
        uint256 signatureCount;
    }
    
    address public daoMembership;
    address public campaignToken;
    
    uint256 public petitionCounter;
    
    // Pricing Configuration
    uint256 public baseCampaignFee = 0.002 ether; 
    uint256 public boostingFee = 0.001 ether; // Fee per booster
    
    uint256 public rewardThreshold = 5; // Setiap 5 petition berbayar dapat 1 token
    
    mapping(uint256 => Petition) public petitions;
    mapping(address => uint256) public paidPetitionCount;
    mapping(uint256 => mapping(address => bool)) public hasSigned;
    
    event PetitionCreated(
        uint256 indexed petitionId,
        address indexed creator,
        string title,
        string imageHash,
        bool usedToken,
        uint256 feePaid,
        uint256 boostingDuration
    );
    
    event PetitionSigned(
        uint256 indexed petitionId,
        address indexed signer,
        uint256 newSignatureCount
    );
    
    
    event RewardTokenMinted(address indexed creator, uint256 amount);
    
    event PricingConfigUpdated(
        uint256 baseFee
    );
    event PetitionBossted(uint256 petitionId, uint256 boostingDuration);
    
    constructor(address _daoMembership, address _campaignToken) ERC1155("") Ownable(msg.sender) {
        require(_daoMembership != address(0), "Invalid DAO address");
        require(_campaignToken != address(0), "Invalid token address");
        
        daoMembership = _daoMembership;
        campaignToken = _campaignToken;
    }

    function mint(address account, uint256 id, uint256 amount, bytes memory data)
    internal 
        onlyOwner
    {
        _mint(account, id, amount, data);
    }
    
    /**
     * @dev Check if user is DAO member
     */
    function isMember(address user) internal view returns (bool) {
        return IERC721(daoMembership).balanceOf(user) > 0;
    }
    
    
    /**
     * @dev Buat petition baru dengan durasi yang bisa diatur
     * @param _title Judul petition
     * @param _description Deskripsi petition
     * @param _imageHash IPFS hash untuk gambar campaign (dari Pinata)
     * 
     * Cara bayar:
     * 1. Pakai Campaign Token (gratis) - hanya untuk durasi 7 hari (default)
     * 2. Bayar dengan ETH - bisa pilih durasi custom (pricing dinamis)
     * 
     * Reward: Setiap 5 petition berbayar → 1 Campaign Token
     */
    function createPetition(
        string memory _title,
        string memory _description,
        string memory _imageHash
    ) external payable nonReentrant {
        require(isMember(msg.sender), "Not a DAO member");
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(bytes(_imageHash).length > 0, "Image hash cannot be empty");
        
        bool usedToken = false;
        uint256 feePaid = 0;
        uint256 userTokenBalance = IERC20(campaignToken).balanceOf(msg.sender);
        
        // Check if user wants to use token
        if (userTokenBalance >= 1 * 10**18) {
            // Burn the token for free campaign
            (bool success, ) = campaignToken.call(
                abi.encodeWithSignature("burnFrom(address,uint256)", msg.sender, 1 * 10**18)
            );
            require(success, "Token burn failed");
            usedToken = true;
        } else {
            // User must pay with ETH (no token)
            require(msg.value >= baseCampaignFee, "Insufficient fee");
            
            feePaid = baseCampaignFee;
            paidPetitionCount[msg.sender]++;
            
            // Check if user qualifies for reward token
            if (paidPetitionCount[msg.sender] % rewardThreshold == 0) {
                (bool success, ) = campaignToken.call(
                    abi.encodeWithSignature("mint(address,uint256)", msg.sender, 1 * 10**18)
                );
                require(success, "Token mint failed");
                emit RewardTokenMinted(msg.sender, 1 * 10**18);
            }
        }
        
        uint256 petitionId = petitionCounter;
        petitionCounter++;
        
        
        petitions[petitionId] = Petition({
            id: petitionId,
            title: _title,
            description: _description,
            imageHash: _imageHash,
            creator: msg.sender,
            createdAt: block.timestamp,
            signatureCount: 0,
            boostingDuration : 0
        });
        
        emit PetitionCreated(
            petitionId, 
            msg.sender, 
            _title, 
            _imageHash, 
            usedToken,
            feePaid,
            0
        );
    }
    
    /**
     * @dev Sign petition (tanda tangan)
     * Gratis dan siapa saja bisa sign
     * 1 wallet hanya bisa sign 1x per petition
     */
    function signPetition(uint256 _petitionId) external {
        require(_petitionId < petitionCounter, "Petition does not exist");
        Petition storage petition = petitions[_petitionId];
        require(!hasSigned[_petitionId][msg.sender], "Already signed");
        
        hasSigned[_petitionId][msg.sender] = true; // 
        petition.signatureCount++;
        mint(msg.sender, _petitionId, 1, "" );
        emit PetitionSigned(_petitionId, msg.sender, petition.signatureCount);
    }
    
    /**
     * @dev Get detail petition
     */
    function getPetition(uint256 _petitionId) external view returns (Petition memory) {
        require(_petitionId < petitionCounter, "Petition does not exist");
        return petitions[_petitionId];
    }
    
    /**
     * @dev Get jumlah petition berbayar yang sudah dibuat user
     */
    function getUserPaidPetitionCount(address _user) external view returns (uint256) {
        return paidPetitionCount[_user];
    }
    
    /**
     * @dev Check apakah user sudah sign petition tertentu
     */
    function hasUserSigned(uint256 _petitionId, address _user) external view returns (bool) {
        return hasSigned[_petitionId][_user];
    }
    
    /**
     * @dev Update pricing configuration (owner only)
     * Untuk menyesuaikan harga base dan per hari
     */
    function setPricingConfig(
        uint256 _baseFee
    ) external onlyOwner {
        baseCampaignFee = _baseFee;
        
        emit PricingConfigUpdated(_baseFee);
    }
    
    /**
     * @dev Update reward threshold (owner only)
     */
    function setRewardThreshold(uint256 _threshold) external onlyOwner {
        require(_threshold > 0, "Invalid threshold");
        rewardThreshold = _threshold;
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
     * @dev Get total petition yang ada
     */
    function getTotalPetitions() external view returns (uint256) {
        return petitionCounter;
    }
    
    /**
     * @dev Get pricing info untuk frontend
     */
    function getPricingInfo() external view returns (
        uint256 baseFee
    ) {
        return (
            baseCampaignFee
        );
    }

function boostPetition(uint256 _petitionId) external payable nonReentrant {
    require(_petitionId < petitionCounter, "Petition does not exist");
    require(msg.value >= boostingFee, "Insufficient fee");
    require(isMember(msg.sender), "Not a DAO member");

    Petition storage petition = petitions[_petitionId];
    require(petition.creator == msg.sender, "Only creator can boost");

    // Tambah durasi campaign
    petition.boostingDuration = block.timestamp + 7 days;

    emit PetitionBossted(_petitionId, petition.boostingDuration);
}

}