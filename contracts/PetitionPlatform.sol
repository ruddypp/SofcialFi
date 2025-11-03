// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title PetitionPlatform
 * @dev Core logic untuk petition voting platform
 * - Hanya DAO member yang bisa buat petition
 * - Petition bisa dibuat dengan Campaign Token atau bayar ETH
 * - Siapa saja bisa sign petition (1 wallet = 1 signature)
 * - Setiap 5 petition berbayar, creator dapat 1 Campaign Token reward
 */
contract PetitionPlatform is Ownable, ReentrancyGuard {
    struct Petition {
        uint256 id;
        string title;
        string description;
        string imageHash;
        address creator;
        uint256 createdAt;
        uint256 deadline;
        uint256 signatureCount;
        bool isActive;
    }
    
    address public daoMembership;
    address public campaignToken;
    
    uint256 public petitionCounter;
    uint256 public campaignFee = 0.01 ether;
    uint256 public rewardThreshold = 5;
    
    mapping(uint256 => Petition) public petitions;
    mapping(address => uint256) public paidPetitionCount;
    mapping(uint256 => mapping(address => bool)) public hasSigned;
    
    event PetitionCreated(
        uint256 indexed petitionId,
        address indexed creator,
        string title,
        string imageHash,
        uint256 deadline,
        bool usedToken
    );
    
    event PetitionSigned(
        uint256 indexed petitionId,
        address indexed signer,
        uint256 newSignatureCount
    );
    
    event PetitionClosed(uint256 indexed petitionId);
    
    event RewardTokenMinted(address indexed creator, uint256 amount);
    
    constructor(address _daoMembership, address _campaignToken) Ownable(msg.sender) {
        require(_daoMembership != address(0), "Invalid DAO address");
        require(_campaignToken != address(0), "Invalid token address");
        
        daoMembership = _daoMembership;
        campaignToken = _campaignToken;
    }
    
    /**
     * @dev Check if user is DAO member
     */
    function isMember(address user) internal view returns (bool) {
        return IERC721(daoMembership).balanceOf(user) > 0;
    }
    
    /**
     * @dev Buat petition baru
     * @param _title Judul petition
     * @param _description Deskripsi petition
     * @param _imageHash IPFS hash untuk gambar campaign (dari Pinata)
     * @param _durationInDays Durasi petition dalam hari
     * 
     * User bisa pakai Campaign Token (gratis) atau bayar dengan ETH
     * Setiap 5 petition berbayar, user dapat 1 Campaign Token reward
     */
    function createPetition(
        string memory _title,
        string memory _description,
        string memory _imageHash,
        uint256 _durationInDays
    ) external payable nonReentrant {
        require(isMember(msg.sender), "Not a DAO member");
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(bytes(_imageHash).length > 0, "Image hash cannot be empty");
        require(_durationInDays > 0 && _durationInDays <= 365, "Invalid duration");
        
        bool usedToken = false;
        uint256 userTokenBalance = IERC20(campaignToken).balanceOf(msg.sender);
        
        // Check if user wants to use token or pay with ETH
        if (userTokenBalance >= 1 * 10**18) {
            // User has token, burn it
            (bool success, ) = campaignToken.call(
                abi.encodeWithSignature("burnFrom(address,uint256)", msg.sender, 1 * 10**18)
            );
            require(success, "Token burn failed");
            usedToken = true;
        } else {
            // User doesn't have token, must pay ETH
            require(msg.value >= campaignFee, "Insufficient fee");
            paidPetitionCount[msg.sender]++;
            
            // Check if user qualifies for reward
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
        
        uint256 deadline = block.timestamp + (_durationInDays * 1 days);
        
        petitions[petitionId] = Petition({
            id: petitionId,
            title: _title,
            description: _description,
            imageHash: _imageHash,
            creator: msg.sender,
            createdAt: block.timestamp,
            deadline: deadline,
            signatureCount: 0,
            isActive: true
        });
        
        emit PetitionCreated(petitionId, msg.sender, _title, _imageHash, deadline, usedToken);
    }
    
    /**
     * @dev Sign petition (tanda tangan)
     * Gratis dan siapa saja bisa sign
     * 1 wallet hanya bisa sign 1x per petition
     */
    function signPetition(uint256 _petitionId) external {
        require(_petitionId < petitionCounter, "Petition does not exist");
        Petition storage petition = petitions[_petitionId];
        
        require(petition.isActive, "Petition is not active");
        require(block.timestamp <= petition.deadline, "Petition has ended");
        require(!hasSigned[_petitionId][msg.sender], "Already signed");
        
        hasSigned[_petitionId][msg.sender] = true;
        petition.signatureCount++;
        
        emit PetitionSigned(_petitionId, msg.sender, petition.signatureCount);
    }
    
    /**
     * @dev Tutup petition sebelum deadline
     * Hanya creator atau owner yang bisa close
     */
    function closePetition(uint256 _petitionId) external {
        require(_petitionId < petitionCounter, "Petition does not exist");
        Petition storage petition = petitions[_petitionId];
        
        require(
            msg.sender == petition.creator || msg.sender == owner(),
            "Not authorized"
        );
        require(petition.isActive, "Already closed");
        
        petition.isActive = false;
        emit PetitionClosed(_petitionId);
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
     * @dev Update campaign fee (owner only)
     */
    function setCampaignFee(uint256 _fee) external onlyOwner {
        campaignFee = _fee;
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
}