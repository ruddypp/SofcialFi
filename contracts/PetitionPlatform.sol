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
 * - Hanya member dengan SBT yang bisa buat dan sign petition
 * - Petition bisa dibuat dengan Campaign Token (gratis) atau bayar ETH
 * - Creator TIDAK BISA sign petition sendiri
 * - Setiap wallet hanya bisa sign 1x per petition
 * - Setiap 5 petition berbayar, creator dapat 1 Campaign Token reward
 * - Boost system: bayar 0.001 ETH untuk naik ke urutan pertama selama 7 hari
 * - Sistem boost: siapa cepat dia yang di urutan paling atas
 */
contract PetitionPlatform is Ownable, ERC1155, ReentrancyGuard {
    struct Petition {
        uint256 id;
        string title;
        string description;
        string imageHash;
        address creator;
        uint256 createdAt;
        uint256 boostEndTime;      // Kapan boost berakhir (0 = tidak di-boost)
        uint256 boostPriority;     // Untuk menentukan urutan boost (siapa cepat dia dapat)
        uint256 signatureCount;
    }
    
    address public soulboundMember;
    address public campaignToken;
    
    uint256 public petitionCounter;
    uint256 private boostPriorityCounter; // Counter untuk tracking urutan boost
    
    // Pricing Configuration
    uint256 public baseCampaignFee = 0.002 ether; 
    uint256 public boostingFee = 0.001 ether;
    
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
        uint256 createdAt
    );
    
    event PetitionSigned(
        uint256 indexed petitionId,
        address indexed signer,
        uint256 newSignatureCount
    );
    
    event PetitionBoosted(
        uint256 indexed petitionId,
        address indexed booster,
        uint256 boostEndTime,
        uint256 boostPriority
    );
    
    event RewardTokenMinted(address indexed creator, uint256 amount);
    
    event PricingConfigUpdated(
        uint256 baseFee,
        uint256 boostingFee
    );
    
    constructor(address _soulboundMember, address _campaignToken) ERC1155("") Ownable(msg.sender) {
        require(_soulboundMember != address(0), "Invalid SBT address");
        require(_campaignToken != address(0), "Invalid token address");
        
        soulboundMember = _soulboundMember;
        campaignToken = _campaignToken;
    }
    
    /**
     * @dev Check if user is member (has SBT)
     */
    function isMember(address user) internal view returns (bool) {
        return IERC721(soulboundMember).balanceOf(user) > 0;
    }
    
    /**
     * @dev Buat petition baru
     * @param _title Judul petition
     * @param _description Deskripsi petition
     * @param _imageHash IPFS hash untuk gambar campaign (dari Pinata)
     * 
     * Cara bayar:
     * 1. Pakai Campaign Token (gratis 1x) - burn 1 token
     * 2. Bayar dengan ETH - baseCampaignFee + gas
     * 
     * Reward: Setiap 5 petition berbayar → 1 Campaign Token
     */
    /**
     * @dev Buat petition baru
     * @param _title Judul petition
     * @param _description Deskripsi petition
     * @param _imageHash IPFS hash untuk gambar campaign
     * @param _useToken Pilihan: true (bayar pakai token), false (bayar pakai ETH)
     * * Cara bayar:
     * 1. Pakai Campaign Token (jika _useToken == true) - burn 1 token
     * 2. Bayar dengan ETH (jika _useToken == false) - baseCampaignFee + gas
     * * Reward: Setiap 5 petition berbayar -> 1 Campaign Token
     */
    function createPetition(
        string memory _title,
        string memory _description,
        string memory _imageHash,
        bool _useToken // <-- PARAMETER BARU DITAMBAHKAN
    ) external payable nonReentrant {
        require(isMember(msg.sender), "Not a member (need SBT)");
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(bytes(_imageHash).length > 0, "Image hash cannot be empty");
        
        bool usedToken = false;
        uint256 feePaid = 0;
        
        // --- LOGIKA UTAMA DIRUBAH DISINI ---
        if (_useToken) {
            // 1. User memilih untuk menggunakan token
            require(msg.value == 0, "Do not send ETH when using token");
            
            uint256 userTokenBalance = IERC20(campaignToken).balanceOf(msg.sender);
            require(userTokenBalance >= 1 * 10**18, "Insufficient campaign tokens");
            
            // Burn the token (1 * 10^18)
            (bool success, ) = campaignToken.call(
                abi.encodeWithSignature("burnFrom(address,uint256)", msg.sender, 1 * 10**18)
            );
            require(success, "Token burn failed");
            
            usedToken = true;

        } else {
            // 2. User memilih untuk membayar dengan ETH
            require(msg.value >= baseCampaignFee, "Insufficient ETH fee");
            
            feePaid = baseCampaignFee;
            paidPetitionCount[msg.sender]++;
            
            // Check jika user berhak dapat reward token (setiap 5 petition berbayar)
            if (paidPetitionCount[msg.sender] % rewardThreshold == 0) {
                (bool success, ) = campaignToken.call(
                    abi.encodeWithSignature("mint(address,uint256)", msg.sender, 1 * 10**18)
                );
                require(success, "Token mint failed");
                emit RewardTokenMinted(msg.sender, 1 * 10**18);
            }
        }
        // --- AKHIR DARI LOGIKA YANG DIRUBAH ---
        
        uint256 petitionId = petitionCounter;
        petitionCounter++;
        
        petitions[petitionId] = Petition({
            id: petitionId,
            title: _title,
            description: _description,
            imageHash: _imageHash,
            creator: msg.sender,
            createdAt: block.timestamp,
            boostEndTime: 0,
            boostPriority: 0,
            signatureCount: 0
        });
        
        emit PetitionCreated(
            petitionId, 
            msg.sender, 
            _title, 
            _imageHash, 
            usedToken, // Akan bernilai true jika _useToken == true
            feePaid,   // Akan bernilai baseCampaignFee jika _useToken == false
            block.timestamp
        );
    }
    
    /**
     * @dev Sign petition (tanda tangan)
     * IMPORTANT: Creator TIDAK BISA sign petition sendiri
     * 1 wallet hanya bisa sign 1x per petition
     */
    function signPetition(uint256 _petitionId) external nonReentrant {
        require(_petitionId < petitionCounter, "Petition does not exist");
        require(isMember(msg.sender), "Not a member (need SBT)");
        
        Petition storage petition = petitions[_petitionId];
        
        // CRITICAL: Creator tidak bisa sign petition sendiri
        require(petition.creator != msg.sender, "Creator cannot sign own petition");
        
        require(!hasSigned[_petitionId][msg.sender], "Already signed");
        
        hasSigned[_petitionId][msg.sender] = true;
        petition.signatureCount++;
        
        // Mint ERC-1155 token sebagai bukti signature
        _mint(msg.sender, _petitionId, 1, "");
        
        emit PetitionSigned(_petitionId, msg.sender, petition.signatureCount);
    }
    
    /**
     * @dev Boost petition untuk naik ke urutan pertama selama 7 hari
     * Hanya creator yang bisa boost petition sendiri
     * Bayar 0.001 ETH + gas
     * Sistem: Siapa cepat dia yang di urutan paling atas (boostPriority lebih tinggi = lebih atas)
     */
    function boostPetition(uint256 _petitionId) external payable nonReentrant {
        require(_petitionId < petitionCounter, "Petition does not exist");
        require(msg.value >= boostingFee, "Insufficient fee");
        require(isMember(msg.sender), "Not a member (need SBT)");
        
        Petition storage petition = petitions[_petitionId];
        require(petition.creator == msg.sender, "Only creator can boost");
        
        // Update boost info
        petition.boostEndTime = block.timestamp + 7 days;
        boostPriorityCounter++; // Increment untuk sistem "siapa cepat dia dapat"
        petition.boostPriority = boostPriorityCounter;
        
        emit PetitionBoosted(_petitionId, msg.sender, petition.boostEndTime, petition.boostPriority);
    }
    
    /**
     * @dev Get detail petition
     */
    function getPetition(uint256 _petitionId) external view returns (Petition memory) {
        require(_petitionId < petitionCounter, "Petition does not exist");
        return petitions[_petitionId];
    }
    
    /**
     * @dev Get semua petitions (untuk frontend sorting)
     * Frontend harus sort berdasarkan:
     * 1. Petisi dengan boostEndTime > block.timestamp (masih boosted) → sort by boostPriority DESC
     * 2. Petisi dengan boostEndTime <= block.timestamp atau 0 → sort by createdAt ASC (urutan pembuatan)
     */
    function getAllPetitions() external view returns (Petition[] memory) {
        Petition[] memory allPetitions = new Petition[](petitionCounter);
        for (uint256 i = 0; i < petitionCounter; i++) {
            allPetitions[i] = petitions[i];
        }
        return allPetitions;
    }
    
    /**
     * @dev Get boosted petitions yang masih aktif
     * Return petitions yang boostEndTime > block.timestamp
     */
    function getActiveBoostedPetitions() external view returns (Petition[] memory) {
        // Count active boosted petitions
        uint256 count = 0;
        for (uint256 i = 0; i < petitionCounter; i++) {
            if (petitions[i].boostEndTime > block.timestamp) {
                count++;
            }
        }
        
        // Create array with exact size
        Petition[] memory boosted = new Petition[](count);
        uint256 index = 0;
        
        for (uint256 i = 0; i < petitionCounter; i++) {
            if (petitions[i].boostEndTime > block.timestamp) {
                boosted[index] = petitions[i];
                index++;
            }
        }
        
        return boosted;
    }
    
    /**
     * @dev Check apakah petition masih dalam status boosted
     */
    function isPetitionBoosted(uint256 _petitionId) external view returns (bool) {
        require(_petitionId < petitionCounter, "Petition does not exist");
        return petitions[_petitionId].boostEndTime > block.timestamp;
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
     */
    function setPricingConfig(
        uint256 _baseFee,
        uint256 _boostingFee
    ) external onlyOwner {
        baseCampaignFee = _baseFee;
        boostingFee = _boostingFee;
        
        emit PricingConfigUpdated(_baseFee, _boostingFee);
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
        uint256 baseFee,
        uint256 boostFee,
        uint256 rewardThresh
    ) {
        return (
            baseCampaignFee,
            boostingFee,
            rewardThreshold
        );
    }
}