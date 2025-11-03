// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CampaignToken
 * @dev ERC-20 token untuk membuat campaign gratis
 * Token ini diberikan sebagai reward dan dapat digunakan untuk membuat petition tanpa bayar ETH
 */
contract CampaignToken is ERC20, Ownable {
    address public petitionContract;
    address public daoMembershipContract; // <-- VARIABEL BARU
    
    constructor() ERC20("Campaign Token", "CAMP") Ownable(msg.sender) {}
    
    /**
     * @dev Set address PetitionPlatform contract
     * Hanya bisa dipanggil sekali setelah PetitionPlatform di-deploy
     */
    function setPetitionContract(address _petitionContract) external onlyOwner {
        require(_petitionContract != address(0), "Invalid address");
        petitionContract = _petitionContract;
    }
    
    /**
     * @dev Set address DAOMembership contract (BARU)
     * Diperlukan agar DAOMembership bisa memanggil mint() untuk token gratis
     */
    function setDAOMembershipContract(address _daoMembershipContract) external onlyOwner {
        require(_daoMembershipContract != address(0), "Invalid address");
        daoMembershipContract = _daoMembershipContract;
    }
    
    /**
     * @dev Mint token baru
     * Hanya bisa dipanggil oleh PetitionContract, Owner, atau DAOMembership Contract
     */
    function mint(address to, uint256 amount) external {
        require(
            msg.sender == petitionContract || 
            msg.sender == owner() || 
            msg.sender == daoMembershipContract, // <-- PENGECEKAN BARU
            "Not authorized"
        );
        _mint(to, amount);
    }
    
    /**
     * @dev Burn token dari address tertentu
     * Hanya bisa dipanggil oleh PetitionContract
     */
    function burnFrom(address from, uint256 amount) external {
        require(msg.sender == petitionContract, "Not authorized");
        _burn(from, amount);
    }
}